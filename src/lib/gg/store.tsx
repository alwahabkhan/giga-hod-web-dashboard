import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DB, Session, Case, DeptId, CaseStatus, Priority, TimelineEntry, DeptAdmin, AppAccount } from "./types";
import { makeSeed, DB_VERSION } from "./seed";
import { DEPT_NAMES, slaHours } from "./logic";

const DB_KEY = "gg-demo-db", SESSION_KEY = "gg-session";
let n = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(++n).toString(36)}`;

type Ctx = {
  ready: boolean; db: DB; session: Session | null; now: number; actor: string;
  mutate: (fn: (d: DB) => void, audit?: { action: string; entity: string; ref: string; before?: string; after?: string }) => void;
  login: (email: string, password: string) => { ok: true; to: "/admin" | "/dept" | "/set-password" } | { ok: false; error: string };
  loginDemo: (kind: "super" | "finance") => void;
  logout: () => void;
  setSession: (s: Session | null) => void;
  resetDemo: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [session, setSessionState] = useState<Session | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const first = useRef(true);

  useEffect(() => {
    let loaded: DB | null = null;
    try { const raw = localStorage.getItem(DB_KEY); if (raw) { const p = JSON.parse(raw) as DB; if (p.version === DB_VERSION) loaded = p; } } catch { /* ignore */ }
    setDb(loaded ?? makeSeed());
    try { const s = localStorage.getItem(SESSION_KEY); if (s) setSessionState(JSON.parse(s) as Session); } catch { /* ignore */ }
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!db) return;
    if (first.current) { first.current = false; }
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* quota */ }
  }, [db]);

  const setSession = useCallback((s: Session | null) => {
    setSessionState(s);
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY);
  }, []);

  const actor = !db || !session ? "System" : session.kind === "super" ? `${db.superadmin.name} (Superadmin)` : db.admins.find((a) => a.id === session.adminId)?.name ?? "Dept Admin";

  const mutate = useCallback<Ctx["mutate"]>((fn, audit) => {
    setDb((prev) => {
      if (!prev) return prev;
      const d = structuredClone(prev);
      fn(d);
      if (audit) d.audit.unshift({ id: nid("AU"), at: new Date().toISOString(), user: actor, before: "—", after: "—", ...audit });
      return d;
    });
    setNow(Date.now());
  }, [actor]);

  const login: Ctx["login"] = (email, password) => {
    if (!db) return { ok: false, error: "Loading…" };
    const e = email.trim().toLowerCase();
    if (e === db.superadmin.email && password === db.superadmin.password) {
      setSession({ kind: "super" }); mutate(() => {}, { action: "Login", entity: "Session", ref: "Superadmin" }); return { ok: true, to: "/admin" };
    }
    const a = db.admins.find((x) => x.email.toLowerCase() === e);
    if (!a || a.password !== password) return { ok: false, error: "Invalid email or password." };
    if (a.status === "Disabled") return { ok: false, error: "This account has been disabled by the Superadmin." };
    setSession({ kind: "dept", adminId: a.id, activeDept: a.departments[0]! });
    mutate((d) => { const x = d.admins.find((y) => y.id === a.id)!; x.lastLogin = new Date().toISOString(); if (x.status === "Invited") x.status = "Active"; }, { action: "Login", entity: "Session", ref: a.name });
    return { ok: true, to: a.mustChangePassword ? "/set-password" : "/dept" };
  };
  const loginDemo = (kind: "super" | "finance") => {
    if (!db) return;
    if (kind === "super") login(db.superadmin.email, db.superadmin.password);
    else { const a = db.admins.find((x) => x.id === "DA-1")!; setSession({ kind: "dept", adminId: a.id, activeDept: "FIN" }); mutate((d) => { d.admins.find((y) => y.id === a.id)!.lastLogin = new Date().toISOString(); }, { action: "Login", entity: "Session", ref: a.name }); }
  };
  const logout = () => setSession(null);
  const resetDemo = () => { const fresh = makeSeed(); setDb(fresh); };

  const value = useMemo<Ctx | null>(() => db ? { ready: true, db, session, now, actor, mutate, login, loginDemo, logout, setSession, resetDemo } : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, session, now, actor, mutate, setSession]);

  if (!value) return <StoreCtx.Provider value={null}>{children}</StoreCtx.Provider>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStoreMaybe() { return useContext(StoreCtx); }
export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("Store not ready");
  return c;
}

/* ---------- Case actions (each writes timeline + audit) ---------- */
export function useCaseActions() {
  const { mutate, actor, db } = useStore();
  const tl = (c: Case, kind: TimelineEntry["kind"], text: string) => c.timeline.push({ id: nid("TL"), at: new Date().toISOString(), by: actor, kind, text });
  const withCase = (id: string, fn: (c: Case, d: DB) => void, audit: { action: string; before?: string; after?: string }) => {
    const no = db.cases.find((c) => c.id === id)?.no ?? id;
    mutate((d) => { const c = d.cases.find((x) => x.id === id); if (c) fn(c, d); }, { ...audit, entity: "Case", ref: no });
  };
  const notify = (d: DB, audience: "super" | DeptId, title: string, body: string, caseNo: string) => d.notifications.unshift({ id: nid("NT"), at: new Date().toISOString(), audience, title, body, read: false, caseNo });

  return {
    create(input: { clientId: string; saleId?: string; receiptId?: string; category: string; department: DeptId; priority: Priority; description: string; attachments: string[] }) {
      const max = Math.max(0, ...db.cases.map((c) => Number(c.no.slice(3))));
      const no = `CS-${String(max + 1).padStart(4, "0")}`;
      mutate((d) => {
        const at = new Date().toISOString();
        const c: Case = {
          id: nid("C"), no, clientId: input.clientId, ...(input.saleId ? { saleId: input.saleId } : {}), ...(input.receiptId ? { receiptId: input.receiptId } : {}),
          category: input.category, department: input.department, status: "New", priority: input.priority, createdAt: at,
          slaDueAt: new Date(Date.now() + slaHours(d, input.category, input.priority, input.department) * 3600000).toISOString(),
          description: input.description, handoffs: [], attachments: input.attachments,
          timeline: [{ id: nid("TL"), at, by: actor, kind: "created", text: `Case created in ${DEPT_NAMES[input.department]} · ${input.category}` }],
        };
        input.attachments.forEach((a) => c.timeline.push({ id: nid("TL"), at, by: actor, kind: "attachment", text: `Attached ${a}` }));
        d.cases.unshift(c);
        notify(d, input.department, `New case ${no}`, `${input.category} · ${input.priority}`, no);
        d.audit.unshift({ id: nid("AU"), at, user: actor, action: "Case created", entity: "Case", ref: no, before: "—", after: `${input.category} → ${DEPT_NAMES[input.department]}` });
      });
      return no;
    },
    assign(ids: string[], staffId: string) {
      const s = db.staff.find((x) => x.id === staffId)!;
      mutate((d) => {
        for (const id of ids) {
          const c = d.cases.find((x) => x.id === id); if (!c) continue;
          const prev = d.staff.find((x) => x.id === c.assigneeId)?.name;
          c.assigneeId = staffId;
          c.timeline.push({ id: nid("TL"), at: new Date().toISOString(), by: actor, kind: "assigned", text: prev ? `Reassigned from ${prev} to ${s.name}` : `Assigned to ${s.name}` });
          if (c.status === "New" || c.status === "Handed Off") { c.timeline.push({ id: nid("TL"), at: new Date().toISOString(), by: actor, kind: "status", text: `Status changed: ${c.status} → Assigned` }); c.status = "Assigned"; }
          const h = c.handoffs.at(-1); if (h && h.status === "Pending" && h.to === c.department) h.status = "Accepted";
          d.audit.unshift({ id: nid("AU"), at: new Date().toISOString(), user: actor, action: "Case assigned", entity: "Case", ref: c.no, before: prev ?? "Unassigned", after: s.name });
        }
      });
    },
    setStatus(id: string, status: CaseStatus) {
      const before = db.cases.find((c) => c.id === id)?.status;
      withCase(id, (c) => { tl(c, "status", `Status changed: ${c.status} → ${status}`); c.status = status; if (status === "Resolved") c.resolvedAt = new Date().toISOString(); }, { action: "Status changed", before: before ?? "", after: status });
    },
    setPriority(id: string, p: Priority) {
      const before = db.cases.find((c) => c.id === id)?.priority;
      withCase(id, (c) => { tl(c, "priority", `Priority changed: ${c.priority} → ${p}`); c.priority = p; }, { action: "Priority changed", before: before ?? "", after: p });
    },
    handoff(id: string, to: DeptId, reason: string, override: boolean) {
      const c0 = db.cases.find((c) => c.id === id)!;
      withCase(id, (c, d) => {
        const at = new Date().toISOString();
        c.handoffs.push({ id: nid("HO"), from: c.department, to, by: actor, at, reason, status: "Pending", ...(override ? { override: true } : {}) });
        tl(c, "handoff", `Handed off ${DEPT_NAMES[c.department]} → ${DEPT_NAMES[to]}${override ? " (Superadmin override)" : ""}: ${reason}`);
        c.department = to; delete c.assigneeId; c.status = "Handed Off";
        notify(d, to, `Incoming handoff ${c.no}`, `From ${DEPT_NAMES[c0.department]}: ${reason}`, c.no);
      }, { action: override ? "Handoff (override)" : "Case handed off", before: DEPT_NAMES[c0.department], after: DEPT_NAMES[to] });
    },
    accept(id: string) {
      withCase(id, (c) => { const h = c.handoffs.at(-1); if (h) h.status = "Accepted"; tl(c, "handoff_accepted", `Handoff accepted by ${DEPT_NAMES[c.department]}`); tl(c, "status", "Status changed: Handed Off → New"); c.status = "New"; }, { action: "Handoff accepted", before: "Pending", after: "Accepted" });
    },
    note(id: string, text: string, visible: boolean) {
      withCase(id, (c) => tl(c, visible ? "note_client" : "note_internal", text), { action: visible ? "Client message added" : "Internal note added" });
    },
    attach(id: string, file: string) { withCase(id, (c) => { c.attachments.push(file); tl(c, "attachment", `Attached ${file}`); }, { action: "Attachment added", after: file }); },
    resolve(id: string, summary: string) {
      withCase(id, (c, d) => { tl(c, "resolved", `Case resolved: ${summary}`); c.status = "Resolved"; c.resolvedAt = new Date().toISOString(); notify(d, "super", `${c.no} resolved`, summary, c.no); }, { action: "Case resolved", after: "Resolved" });
    },
    close(id: string) { withCase(id, (c) => { tl(c, "closed", "Case closed"); c.status = "Closed"; c.closedAt = new Date().toISOString(); c.resolvedAt ??= c.closedAt; }, { action: "Case closed", after: "Closed" }); },
    reopen(id: string, reason: string) { withCase(id, (c) => { tl(c, "reopened", `Case reopened: ${reason}`); c.status = "Reopened"; delete c.resolvedAt; delete c.closedAt; }, { action: "Case reopened", after: "Reopened" }); },
  };
}

export function useAccountActions() {
  const { mutate } = useStore();
  const set = (id: string, status: AppAccount["status"], action: string, reason?: string) =>
    mutate((d) => { const a = d.accounts.find((x) => x.id === id)!; a.status = status; if (reason) a.reason = reason; else delete a.reason; }, { action, entity: "Client Account", ref: id, after: status + (reason ? `: ${reason}` : "") });
  return {
    verify: (id: string) => set(id, "Verified", "Account verified"),
    reject: (id: string, reason: string) => set(id, "Rejected", "Account rejected", reason),
    suspend: (id: string, reason: string) => set(id, "Suspended", "Account suspended", reason),
    reactivate: (id: string) => set(id, "Verified", "Account reactivated"),
    link: (id: string, clientId: string) => mutate((d) => { d.accounts.find((x) => x.id === id)!.clientId = clientId; }, { action: "Account linked", entity: "Client Account", ref: id, after: clientId }),
  };
}

export function currentAdmin(db: DB, s: Session | null): DeptAdmin | undefined {
  return s?.kind === "dept" ? db.admins.find((a) => a.id === s.adminId) : undefined;
}
