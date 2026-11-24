import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  HOD, EMPLOYEES, INITIAL_QUERIES, INITIAL_TASKS, INITIAL_NOTIFICATIONS, INITIAL_ACTIVITY, TODAY,
  type Query, type Task, type Notification, type Activity, type Priority, type QueryStatus, type TaskStatus,
  type InternalNote, type HodProfile, type Employee,
} from "./hod-data";

// Mock role-based permissions for the HOD role. Boundaries are enforced in the UI.
export const PERMISSIONS = {
  viewDepartmentQueries: true,
  assignQueries: true,
  reassignQueries: true,
  setPriorityAndDeadline: true,
  createTasks: true,
  escalate: true,
  transferInterdepartmental: true,
  closeQueries: true,
  viewOtherDepartments: false,
  viewOrgFinancials: false,
  manageDepartments: false,
  manageGlobalRoles: false,
  editErpFinancialRecords: false,
} as const;

let counter = 1000;
const uid = (p: string) => `${p}-${++counter}`;
const now = () => new Date(TODAY.getTime() + (counter - 1000) * 60000).toISOString();

interface Store {
  hod: HodProfile; employees: Employee[]; queries: Query[]; tasks: Task[];
  notifications: Notification[]; activity: Activity[];
  assignQuery: (ref: string, input: { employeeId: string; priority: Priority; dueAt: string; instructions?: string | undefined; note?: string | undefined }) => void;
  setQueryStatus: (ref: string, status: QueryStatus, reason?: string) => void;
  setQueryPriority: (ref: string, p: Priority) => void;
  extendDeadline: (ref: string, dueAt: string, reason?: string) => void;
  escalateQuery: (ref: string, reason: string) => void;
  transferQuery: (ref: string, dept: string, reason: string) => void;
  addNote: (ref: string, kind: InternalNote["kind"], body: string) => void;
  sendClientMessage: (ref: string, body: string) => void;
  createTask: (t: Omit<Task, "id" | "createdBy" | "status" | "progress" | "activity">) => void;
  setTaskStatus: (id: string, s: TaskStatus) => void;
  markNotification: (id: string, read: boolean) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (p: Partial<HodProfile>) => void;
}
const Ctx = createContext<Store | null>(null);

export function HodStoreProvider({ children }: { children: ReactNode }) {
  const [hod, setHod] = useState(HOD);
  const [queries, setQueries] = useState(INITIAL_QUERIES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);

  const store = useMemo<Store>(() => {
    const empName = (id: string) => EMPLOYEES.find((e) => e.id === id)?.name ?? id;
    const log = (a: Omit<Activity, "id" | "at">) => setActivity((xs) => [{ ...a, id: uid("ac"), at: now() }, ...xs]);
    const notify = (n: Omit<Notification, "id" | "at" | "read">) =>
      setNotifications((xs) => [{ ...n, id: uid("n"), at: now(), read: false }, ...xs]);
    const patch = (ref: string, fn: (q: Query) => Partial<Query>, label: string, detail?: string) =>
      setQueries((qs) => qs.map((q) => q.ref === ref
        ? { ...q, ...fn(q), updatedAt: now(), timeline: [...q.timeline, { id: uid("t"), label, actor: hod.name, at: now(), detail }] }
        : q));

    return {
      hod, employees: EMPLOYEES, queries, tasks, notifications, activity,
      assignQuery: (ref, { employeeId, priority, dueAt, instructions, note }) => {
        const prev = queries.find((q) => q.ref === ref)?.assigneeId;
        const label = prev ? "Query reassigned" : "Assigned to employee";
        patch(ref, (q) => ({
          assigneeId: employeeId, assignedAt: now(), assignedBy: hod.name, priority, dueAt,
          status: q.status === "New" ? "Pending" : q.status,
          notes: [
            ...q.notes,
            ...(instructions ? [{ id: uid("n"), author: hod.name, kind: "HOD comment" as const, body: `Assignment instructions: ${instructions}`, at: now() }] : []),
            ...(note ? [{ id: uid("n"), author: hod.name, kind: "Internal remark" as const, body: note, at: now() }] : []),
          ],
        }), label, `${prev ? `${empName(prev)} → ` : ""}${empName(employeeId)}`);
        log({ actor: hod.name, action: `${prev ? "reassigned" : "assigned"} query to ${empName(employeeId)}`, target: ref, kind: "assign" });
        notify({ kind: "employee", title: `Notification sent to ${empName(employeeId)}`, description: `${ref} has been assigned to them`, link: { to: "/queries/$ref", ref } });
      },
      setQueryStatus: (ref, status, reason) => {
        patch(ref, () => ({ status }), "Query status changed", `Status set to ${status}${reason ? ` — ${reason}` : ""}`);
        log({ actor: hod.name, action: status === "Resolved" ? "marked as resolved" : status === "Closed" ? "closed query" : `changed status to ${status} on`, target: ref, kind: status === "Resolved" ? "resolve" : "status" });
      },
      setQueryPriority: (ref, p) => {
        patch(ref, () => ({ priority: p }), "Priority changed", `Priority set to ${p}`);
        log({ actor: hod.name, action: `changed priority to ${p} on`, target: ref, kind: "status" });
      },
      extendDeadline: (ref, dueAt, reason) => {
        patch(ref, (q) => ({ dueAt, status: q.status === "Overdue" ? "In Progress" : q.status }), "Deadline extended",
          `New deadline ${new Date(dueAt).toLocaleDateString("en-GB")}${reason ? ` — ${reason}` : ""}`);
        log({ actor: hod.name, action: "extended the deadline of", target: ref, kind: "deadline" });
      },
      escalateQuery: (ref, reason) => {
        patch(ref, () => ({ escalated: true, priority: "High" }), "Query escalated", reason);
        log({ actor: hod.name, action: "escalated", target: ref, kind: "escalate" });
        notify({ kind: "escalation", title: "Query escalated", description: `${ref} escalated: ${reason}`, link: { to: "/queries/$ref", ref } });
      },
      transferQuery: (ref, dept, reason) => {
        patch(ref, (q) => ({
          notes: [...q.notes, { id: uid("n"), author: hod.name, kind: "Transfer", body: `Transferred to ${dept}: ${reason}`, at: now() }],
          status: "Pending",
        }), "Query transferred", `Finance → ${dept}: ${reason}`);
        log({ actor: hod.name, action: `transferred query to ${dept}`, target: ref, kind: "transfer" });
      },
      addNote: (ref, kind, body) => {
        setQueries((qs) => qs.map((q) => q.ref === ref ? { ...q, notes: [...q.notes, { id: uid("n"), author: hod.name, kind, body, at: now() }] } : q));
        log({ actor: hod.name, action: "added an internal note to", target: ref, kind: "note" });
      },
      sendClientMessage: (ref, body) => {
        setQueries((qs) => qs.map((q) => q.ref === ref ? { ...q, updatedAt: now(), messages: [...q.messages, { id: uid("m"), from: "employee", author: hod.name, body, at: now() }] } : q));
        log({ actor: hod.name, action: "sent a client-visible update on", target: ref, kind: "submit" });
      },
      createTask: (t) => {
        const id = `GG-TSK-${200 + tasks.length + 1 + (counter % 100)}`;
        setTasks((xs) => [{ ...t, id, createdBy: hod.name, status: "To Do", progress: 0,
          activity: [{ id: uid("a"), label: "Task created and assigned", at: now(), actor: hod.name }] }, ...xs]);
        log({ actor: hod.name, action: `assigned a task to ${empName(t.assigneeId)}:`, target: t.title, kind: "task" });
        notify({ kind: "task", title: `Task sent to ${empName(t.assigneeId)}`, description: t.title, link: { to: "/tasks" } });
      },
      setTaskStatus: (id, s) => setTasks((xs) => xs.map((t) => t.id === id
        ? { ...t, status: s, progress: s === "Completed" ? 100 : t.progress, activity: [...t.activity, { id: uid("a"), label: `Status changed to ${s}`, at: now(), actor: hod.name }] }
        : t)),
      markNotification: (id, read) => setNotifications((xs) => xs.map((n) => n.id === id ? { ...n, read } : n)),
      markAllNotificationsRead: () => setNotifications((xs) => xs.map((n) => ({ ...n, read: true }))),
      updateProfile: (p) => setHod((h) => ({ ...h, ...p })),
    };
  }, [hod, queries, tasks, notifications, activity]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useHod() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useHod must be used inside HodStoreProvider");
  return s;
}

export const OPEN_STATUSES: QueryStatus[] = ["New", "Pending", "In Progress", "Awaiting Response", "Overdue"];

export function employeeStats(id: string, queries: Query[], tasks: Task[]) {
  const qs = queries.filter((q) => q.assigneeId === id);
  const ts = tasks.filter((t) => t.assigneeId === id);
  const count = (s: QueryStatus[]) => qs.filter((q) => s.includes(q.status)).length;
  return {
    assigned: qs.length,
    newQ: count(["New"]),
    inProgress: count(["In Progress", "Awaiting Response"]),
    pending: count(["Pending"]),
    open: count(OPEN_STATUSES),
    resolved: count(["Resolved", "Closed"]),
    overdue: count(["Overdue"]),
    tasksTotal: ts.length,
    tasksTodo: ts.filter((t) => t.status === "To Do").length,
    tasksInProgress: ts.filter((t) => t.status === "In Progress").length,
    tasksPending: ts.filter((t) => t.status !== "Completed").length,
    tasksCompleted: ts.filter((t) => t.status === "Completed").length,
    tasksOverdue: ts.filter((t) => t.status === "Overdue").length,
  };
}
