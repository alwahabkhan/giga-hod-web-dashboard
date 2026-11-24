import type { DB, Case, CaseStatus, DeptId, HandoffRule, Installment, InstallmentStatus, Sale, Staff, Category, Session } from "./types";

export const DEPT_NAMES: Record<DeptId, string> = { FIN: "Finance", CC: "Customer Care", REC: "Recovery", SS: "Sales Support", LEG: "Legal" };
export const OPEN_STATUSES: CaseStatus[] = ["New", "Assigned", "In Progress", "Waiting on Client", "Handed Off", "Reopened"];
export const ALL_STATUSES: CaseStatus[] = ["New", "Assigned", "In Progress", "Waiting on Client", "Handed Off", "Resolved", "Closed", "Reopened"];
export const isOpen = (c: Pick<Case, "status">) => OPEN_STATUSES.includes(c.status);

export function slaState(c: Pick<Case, "status" | "slaDueAt" | "resolvedAt" | "closedAt">, now: number): "Met" | "Breached" | "Due soon" | "On track" {
  const due = Date.parse(c.slaDueAt);
  if (!isOpen(c)) { const end = Date.parse(c.resolvedAt ?? c.closedAt ?? c.slaDueAt); return end <= due ? "Met" : "Breached"; }
  if (now > due) return "Breached";
  if (due - now < 8 * 3600000) return "Due soon";
  return "On track";
}
export const isOverdue = (c: Case, now: number) => isOpen(c) && now > Date.parse(c.slaDueAt);

/** Departments a case can be handed off to. Override (Superadmin only, when enabled) lifts the rule matrix. */
export function handoffTargets(rules: HandoffRule[], from: DeptId, opts: { superadmin: boolean; override: boolean; allowOverride: boolean; activeDepts: DeptId[] }): DeptId[] {
  if (opts.superadmin && opts.override && opts.allowOverride) return opts.activeDepts.filter((d) => d !== from);
  const allowed = rules.filter((r) => r.enabled && r.from === from).map((r) => r.to);
  return opts.activeDepts.filter((d) => allowed.includes(d) && d !== from);
}

/** Staff a user may assign a case to: Superadmin → any active member of the case's department; Dept Admin → only members of their own active department. */
export function assignableStaff(staff: Staff[], caseDept: DeptId, session: Session): Staff[] {
  const dept = session.kind === "super" ? caseDept : session.activeDept;
  return staff.filter((s) => s.active && s.departments.includes(dept));
}

export const suggestDepartment = (cats: Category[], name: string): DeptId | undefined => cats.find((c) => c.name === name)?.defaultDept;
export const canSeeCollections = (depts: DeptId[]) => depts.some((d) => d === "FIN" || d === "REC");

export function installmentStatus(i: Pick<Installment, "amount" | "paid" | "dueDate">, now: number): InstallmentStatus {
  if (i.paid >= i.amount) return "Paid";
  if (i.paid > 0) return "Partly Paid";
  return Date.parse(i.dueDate) < now ? "Unpaid" : "Upcoming";
}

export function saleFinancials(db: DB, sale: Sale, now: number) {
  const ins = db.installments.filter((i) => i.saleId === sale.id);
  const paid = db.receipts.filter((r) => r.saleId === sale.id).reduce((a, r) => a + r.amount, 0);
  const outstanding = sale.netPrice - paid;
  const overdueIns = ins.filter((i) => Date.parse(i.dueDate) < now && i.paid < i.amount);
  const overdueAmount = overdueIns.reduce((a, i) => a + i.amount - i.paid, 0);
  const oldest = overdueIns[0];
  const daysOverdue = oldest ? Math.floor((now - Date.parse(oldest.dueDate)) / 86400000) : 0;
  const next = ins.find((i) => Date.parse(i.dueDate) >= now && i.paid < i.amount);
  return { paid, outstanding, overdueAmount, daysOverdue, next, installments: ins };
}

/** Cases visible to a department queue: owned now, or handed out by it previously. */
export function deptCases(cases: Case[], dept: DeptId) {
  return cases.filter((c) => c.department === dept || c.handoffs.some((h) => h.from === dept));
}
export const pendingHandoff = (c: Case) => { const h = c.handoffs.at(-1); return h && h.status === "Pending" ? h : undefined; };

export function slaHours(db: Pick<DB, "sla" | "departments">, category: string, priority: Case["priority"], dept: DeptId) {
  const r = db.sla.find((s) => s.category === category && s.priority === priority) ?? db.sla.find((s) => s.category === "*" && s.priority === priority);
  return r?.resolutionHours ?? db.departments.find((d) => d.id === dept)?.slaHours ?? 72;
}
export const resolutionHours = (c: Case) => c.resolvedAt ? (Date.parse(c.resolvedAt) - Date.parse(c.createdAt)) / 3600000 : null;
