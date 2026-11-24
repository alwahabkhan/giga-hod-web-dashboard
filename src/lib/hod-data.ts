// Fictional demonstration data for the Giga Group HOD dashboard prototype.
export const TODAY = new Date("2026-11-09T09:00:00");

export type DepartmentId = "finance" | "recovery" | "customer-care" | "sales" | "records";
export const DEPARTMENTS: { id: DepartmentId; name: string }[] = [
  { id: "recovery", name: "Recovery" },
  { id: "customer-care", name: "Customer Care" },
  { id: "sales", name: "Sales" },
  { id: "finance", name: "Finance" },
  { id: "records", name: "Records" },
];

export type QueryStatus = "New" | "Pending" | "In Progress" | "Awaiting Response" | "Resolved" | "Closed" | "Overdue";
export const QUERY_STATUSES: QueryStatus[] = ["New", "Pending", "In Progress", "Awaiting Response", "Resolved", "Closed", "Overdue"];
export type Priority = "High" | "Medium" | "Low";
export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
export type Availability = "Available" | "Busy" | "Away" | "Offline";
export type TaskStatus = "To Do" | "In Progress" | "Completed" | "Overdue" | "On Hold";
export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Completed", "Overdue", "On Hold"];

export const QUERY_CATEGORIES = ["Receipt Verification", "Payment Correction", "Balance Clarification", "Account Statement", "Refund Request", "Installment Plan"];

export interface HodProfile {
  name: string; employeeId: string; designation: string; department: DepartmentId;
  email: string; phone: string; initials: string;
}
export const HOD: HodProfile = {
  name: "Ahmed Sheikh", employeeId: "GG-EMP-1001", designation: "Head of Finance", department: "finance",
  email: "ahmed.sheikh@gigagroup.example", phone: "+92 300 555 0101", initials: "AS",
};

export interface Employee {
  id: string; name: string; initials: string; designation: string; email: string; phone: string;
  availability: Availability; joined: string;
}
export const EMPLOYEES: Employee[] = [
  { id: "GG-EMP-1104", name: "Ali Khan", initials: "AK", designation: "Finance Officer", email: "ali.khan@gigagroup.example", phone: "+92 301 555 0144", availability: "Busy", joined: "2023-02-14" },
  { id: "GG-EMP-1087", name: "Sara Ahmed", initials: "SA", designation: "Senior Finance Executive", email: "sara.ahmed@gigagroup.example", phone: "+92 302 555 0187", availability: "Available", joined: "2021-08-02" },
  { id: "GG-EMP-1121", name: "Usman Malik", initials: "UM", designation: "Finance Executive", email: "usman.malik@gigagroup.example", phone: "+92 303 555 0121", availability: "Away", joined: "2024-01-09" },
  { id: "GG-EMP-1133", name: "Hamza Tariq", initials: "HT", designation: "Finance Officer", email: "hamza.tariq@gigagroup.example", phone: "+92 304 555 0133", availability: "Available", joined: "2024-06-17" },
  { id: "GG-EMP-1142", name: "Ayesha Raza", initials: "AR", designation: "Finance Executive", email: "ayesha.raza@gigagroup.example", phone: "+92 305 555 0142", availability: "Offline", joined: "2025-03-03" },
];

export interface Message { id: string; from: "client" | "employee"; author: string; body: string; at: string; attachment?: string | undefined }
export interface InternalNote { id: string; author: string; kind: "Internal remark" | "Investigation" | "HOD comment" | "Transfer"; body: string; at: string }
export interface TimelineEvent { id: string; label: string; actor: string; at: string; detail?: string | undefined }

export interface Query {
  ref: string; subject: string; description: string; category: string; priority: Priority; status: QueryStatus;
  client: { name: string; ref: string; email: string; phone: string; project: string; account: string };
  assigneeId: string | null; assignedAt: string | null; assignedBy: string | null;
  submittedAt: string; updatedAt: string; dueAt: string; escalated: boolean;
  messages: Message[]; notes: InternalNote[]; timeline: TimelineEvent[];
}

const clients = [
  { name: "Bilal Hussain", project: "Giga Mall Extension", account: "Unit B-214 · Installment plan" },
  { name: "Nadia Qureshi", project: "Giga Heights", account: "Apartment 7C · 36-month plan" },
  { name: "Faisal Mehmood", project: "Giga Business Park", account: "Office 11-A · Quarterly plan" },
  { name: "Zainab Iqbal", project: "Giga Residencia", account: "Villa 32 · Down payment paid" },
  { name: "Omar Farooq", project: "Giga Mall Extension", account: "Shop G-08 · Monthly plan" },
  { name: "Hina Siddiqui", project: "Giga Heights", account: "Apartment 12A · 48-month plan" },
  { name: "Kamran Javed", project: "Giga Business Park", account: "Office 4-C · Monthly plan" },
  { name: "Mehwish Ali", project: "Giga Residencia", account: "Villa 9 · Installment plan" },
];

const d = (offsetDays: number, hour = 10) => {
  const t = new Date(TODAY); t.setDate(t.getDate() + offsetDays); t.setHours(hour, (offsetDays * 17 + 60) % 60, 0, 0);
  return t.toISOString();
};

type Seed = [string, string, Priority, QueryStatus, number, string | null, number, number];
// subject, category, priority, status, clientIdx, assignee, submittedOffset, dueOffset
const seeds: Seed[] = [
  ["March Installment Receipt Verification", "Receipt Verification", "High", "In Progress", 0, "GG-EMP-1104", -6, 1],
  ["Payment Record Correction", "Payment Correction", "Medium", "Pending", 1, "GG-EMP-1087", -5, 3],
  ["Outstanding Balance Clarification", "Balance Clarification", "High", "New", 2, null, -1, 2],
  ["Account Statement Request", "Account Statement", "Low", "Resolved", 3, "GG-EMP-1133", -9, -4],
  ["Duplicate Payment Refund", "Refund Request", "High", "Overdue", 4, "GG-EMP-1121", -12, -2],
  ["Installment Schedule Revision", "Installment Plan", "Medium", "Awaiting Response", 5, "GG-EMP-1087", -7, 2],
  ["Late Fee Waiver Request", "Payment Correction", "Medium", "In Progress", 6, "GG-EMP-1104", -4, 4],
  ["Bank Transfer Not Reflected", "Receipt Verification", "High", "New", 7, null, 0, 1],
  ["Annual Statement for Tax Filing", "Account Statement", "Low", "Closed", 1, "GG-EMP-1133", -20, -12],
  ["Advance Payment Adjustment", "Balance Clarification", "Medium", "Pending", 3, "GG-EMP-1142", -3, 5],
  ["Cheque Clearance Confirmation", "Receipt Verification", "Medium", "Resolved", 0, "GG-EMP-1087", -10, -5],
  ["Possession Dues Breakdown", "Balance Clarification", "High", "Overdue", 2, "GG-EMP-1104", -14, -3],
  ["Refund for Cancelled Booking", "Refund Request", "High", "Awaiting Response", 4, "GG-EMP-1121", -8, 1],
  ["Installment Reminder Opt-out", "Installment Plan", "Low", "New", 5, null, -1, 6],
  ["Online Payment Receipt Missing", "Receipt Verification", "Medium", "In Progress", 6, "GG-EMP-1133", -2, 3],
  ["Ledger Mismatch for Q3", "Payment Correction", "High", "Pending", 7, "GG-EMP-1087", -4, 0],
  ["Statement Address Update", "Account Statement", "Low", "Resolved", 1, "GG-EMP-1142", -11, -6],
  ["Partial Payment Allocation", "Balance Clarification", "Medium", "New", 3, null, 0, 4],
  ["Transfer Fee Clarification", "Payment Correction", "Low", "Closed", 0, "GG-EMP-1133", -25, -15],
  ["Restructured Plan Approval", "Installment Plan", "High", "In Progress", 2, "GG-EMP-1087", -3, 2],
  ["Penalty Charge Dispute", "Payment Correction", "Medium", "Overdue", 4, "GG-EMP-1142", -10, -1],
  ["Receipt Copy for Bank Loan", "Account Statement", "Low", "Resolved", 5, "GG-EMP-1104", -6, -2],
];

export const INITIAL_QUERIES: Query[] = seeds.map((s, i) => {
  const [subject, category, priority, status, ci, assigneeId, sub, due] = s;
  const n = 12 + i;
  const ref = `GG-QRY-2026-${String(n).padStart(4, "0")}`;
  const c = clients[ci];
  if (!c) throw new Error(`Missing demo client at index ${ci}`);
  const assignee = EMPLOYEES.find((e) => e.id === assigneeId);
  const timeline: TimelineEvent[] = [
    { id: `${ref}-t1`, label: "Query submitted", actor: c.name, at: d(sub, 9), detail: "Via Client Mobile Application" },
    { id: `${ref}-t2`, label: "Query received by department", actor: "System", at: d(sub, 9), detail: "Routed to Finance" },
  ];
  if (assignee) {
    timeline.push({ id: `${ref}-t3`, label: "Assigned to employee", actor: HOD.name, at: d(sub, 11), detail: `Assigned to ${assignee.name}` });
    timeline.push({ id: `${ref}-t4`, label: "Employee opened query", actor: assignee.name, at: d(sub, 14) });
  }
  if (["Awaiting Response", "Resolved", "Closed"].includes(status) && assignee)
    timeline.push({ id: `${ref}-t5`, label: "Employee responded", actor: assignee.name, at: d(sub + 1, 12) });
  if (status === "Resolved" || status === "Closed")
    timeline.push({ id: `${ref}-t6`, label: "Query resolved", actor: assignee?.name ?? HOD.name, at: d(Math.min(due, -1), 16) });
  if (status === "Closed") timeline.push({ id: `${ref}-t7`, label: "Query closed", actor: HOD.name, at: d(Math.min(due, -1) + 1, 10) });

  const messages: Message[] = [
    { id: `${ref}-m1`, from: "client", author: c.name, at: d(sub, 9),
      body: i === 0
        ? "I paid my March installment of PKR 185,000 via bank transfer on 5 March, but it still shows as unpaid in the app. Receipt attached."
        : `Hello, I need help regarding: ${subject.toLowerCase()}. Please look into my account.`,
      attachment: category === "Receipt Verification" ? "bank_receipt.pdf" : undefined },
  ];
  if (assignee && status !== "New")
    messages.push({ id: `${ref}-m2`, from: "employee", author: assignee.name, at: d(sub + 1, 11),
      body: i === 0
        ? "Thank you, we have received your receipt and are verifying it against our bank records. We will update you within 24 hours."
        : "Thank you for reaching out. We have started reviewing your request and will update you shortly." });

  const notes: InternalNote[] = [];
  if (i === 0) {
    notes.push({ id: `${ref}-n1`, author: "Ali Khan", kind: "Investigation", at: d(-4, 15), body: "Bank statement shows a credit of PKR 185,000 on 6 March under a different reference. Matching with ledger." });
    notes.push({ id: `${ref}-n2`, author: HOD.name, kind: "HOD comment", at: d(-3, 10), body: "Prioritise — client has escalated twice through Customer Care." });
  }
  if (i === 5) notes.push({ id: `${ref}-n3`, author: "Customer Care", kind: "Transfer", at: d(sub, 9), body: "Transferred from Customer Care: client requires revised installment schedule (finance decision)." });

  return {
    ref, subject, category, priority, status,
    description: i === 0
      ? "Client reports that the March installment (PKR 185,000) paid by bank transfer is not reflected in their account. Receipt has been provided for verification against bank and ERP records."
      : `Client has requested assistance with ${subject.toLowerCase()} for ${c.account}. Review the relevant financial records and respond with the outcome.`,
    client: { name: c.name, ref: `GG-CL-${3200 + ci * 7}`, email: `${c.name.toLowerCase().replace(" ", ".")}@mail.example`, phone: `+92 31${ci} 555 0${200 + ci}`, project: c.project, account: c.account },
    assigneeId, assignedAt: assignee ? d(sub, 11) : null, assignedBy: assignee ? HOD.name : null,
    submittedAt: d(sub, 9), updatedAt: d(Math.min(sub + 2, 0), 13), dueAt: d(due, 17), escalated: false,
    messages, notes, timeline,
  };
});

export interface TaskActivity { id: string; label: string; at: string; actor: string }
export interface Task {
  id: string; title: string; description: string; assigneeId: string; createdBy: string; priority: Priority;
  startAt: string; dueAt: string; status: TaskStatus; relatedQuery?: string | undefined; progress: number;
  instructions?: string | undefined; attachments: string[]; activity: TaskActivity[];
}
type TSeed = [string, string, string, Priority, TaskStatus, number, number, string | undefined, number];
const tseeds: TSeed[] = [
  ["Verify March installment receipt", "Match client bank receipt with bank statement and ERP ledger.", "GG-EMP-1104", "High", "In Progress", -5, 1, "GG-QRY-2026-0012", 60],
  ["Review pending payment records", "Review all payment records flagged as pending for more than 7 days.", "GG-EMP-1087", "Medium", "To Do", -1, 4, undefined, 0],
  ["Respond to outstanding balance query", "Prepare balance breakdown and draft client response.", "GG-EMP-1133", "High", "To Do", 0, 2, "GG-QRY-2026-0014", 0],
  ["Complete monthly financial verification", "Monthly reconciliation of client receipts for October.", "GG-EMP-1087", "High", "In Progress", -7, 3, undefined, 45],
  ["Process duplicate payment refund", "Raise refund request with treasury after verification.", "GG-EMP-1121", "High", "Overdue", -10, -2, "GG-QRY-2026-0016", 30],
  ["Prepare Q3 ledger mismatch report", "Summarise mismatches between bank feed and ERP for Q3.", "GG-EMP-1142", "Medium", "On Hold", -6, 6, "GG-QRY-2026-0027", 20],
  ["Update installment schedule template", "Revise standard installment schedule template.", "GG-EMP-1133", "Low", "Completed", -12, -5, undefined, 100],
  ["Draft late fee waiver recommendation", "Assess waiver eligibility and recommend outcome.", "GG-EMP-1104", "Medium", "To Do", 0, 5, "GG-QRY-2026-0018", 0],
  ["Archive closed statements", "Archive statements for queries closed in October.", "GG-EMP-1142", "Low", "Completed", -9, -3, undefined, 100],
  ["Verify cheque clearances", "Confirm clearance of cheques deposited last week.", "GG-EMP-1087", "Medium", "Completed", -8, -4, undefined, 100],
  ["Possession dues breakdown", "Compile possession dues breakdown for client.", "GG-EMP-1104", "High", "Overdue", -9, -3, "GG-QRY-2026-0023", 50],
  ["Penalty charge review", "Review disputed penalty charges against policy.", "GG-EMP-1121", "Medium", "In Progress", -3, 2, "GG-QRY-2026-0032", 35],
];
export const INITIAL_TASKS: Task[] = tseeds.map((t, i) => ({
  id: `GG-TSK-${String(201 + i)}`, title: t[0], description: t[1], assigneeId: t[2], createdBy: HOD.name, priority: t[3],
  status: t[4], startAt: d(t[5], 9), dueAt: d(t[6], 17), relatedQuery: t[7], progress: t[8], attachments: [],
  activity: [
    { id: `a${i}1`, label: "Task created and assigned", at: d(t[5], 9), actor: HOD.name },
    ...(t[8] > 0 ? [{ id: `a${i}2`, label: `Progress updated to ${t[8]}%`, at: d(Math.min(t[5] + 2, 0), 15), actor: EMPLOYEES.find((e) => e.id === t[2])?.name ?? HOD.name }] : []),
  ],
}));

export interface Notification {
  id: string; title: string; description: string; at: string; read: boolean;
  kind: "query" | "escalation" | "overdue" | "deadline" | "task" | "employee" | "workload";
  link: { to: "/queries/$ref"; ref: string } | { to: "/employees/$id"; id: string } | { to: "/tasks" };
}
export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "query", title: "New departmental query", description: "GG-QRY-2026-0019 · Bank Transfer Not Reflected — unassigned", at: d(0, 8), read: false, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0019" } },
  { id: "n2", kind: "overdue", title: "Query overdue", description: "GG-QRY-2026-0016 · Duplicate Payment Refund is 2 days overdue", at: d(0, 7), read: false, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0016" } },
  { id: "n3", kind: "deadline", title: "Deadline approaching", description: "GG-QRY-2026-0027 · Ledger Mismatch for Q3 is due today", at: d(0, 7), read: false, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0027" } },
  { id: "n4", kind: "employee", title: "Employee response submitted", description: "Sara Ahmed responded on GG-QRY-2026-0017", at: d(-1, 16), read: false, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0017" } },
  { id: "n5", kind: "task", title: "Task overdue", description: "Process duplicate payment refund — Usman Malik", at: d(-1, 12), read: false, link: { to: "/tasks" } },
  { id: "n6", kind: "workload", title: "Workload alert", description: "Ali Khan has 5 open queries — consider redistributing", at: d(-1, 10), read: true, link: { to: "/employees/$id", id: "GG-EMP-1104" } },
  { id: "n7", kind: "query", title: "Query transferred to Finance", description: "GG-QRY-2026-0017 transferred from Customer Care", at: d(-2, 11), read: true, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0017" } },
  { id: "n8", kind: "query", title: "Unassigned queries", description: "4 queries are waiting for assignment", at: d(-2, 9), read: true, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0014" } },
  { id: "n9", kind: "task", title: "Pending task", description: "Review pending payment records — Sara Ahmed", at: d(-3, 9), read: true, link: { to: "/tasks" } },
  { id: "n10", kind: "employee", title: "Query resolved", description: "Hamza Tariq resolved GG-QRY-2026-0015", at: d(-4, 16), read: true, link: { to: "/queries/$ref", ref: "GG-QRY-2026-0015" } },
];

export interface Activity { id: string; actor: string; action: string; target?: string; at: string; kind: "assign" | "resolve" | "new" | "transfer" | "deadline" | "submit" | "note" | "escalate" | "task" | "status" }
export const INITIAL_ACTIVITY: Activity[] = [
  { id: "ac1", actor: "System", action: "New client query received", target: "GG-QRY-2026-0019", at: d(0, 8), kind: "new" },
  { id: "ac2", actor: "Ali Khan", action: "submitted an investigation note on", target: "GG-QRY-2026-0012", at: d(0, 7), kind: "submit" },
  { id: "ac3", actor: "System", action: "Task deadline approaching for", target: "Complete monthly financial verification", at: d(-1, 17), kind: "deadline" },
  { id: "ac4", actor: "Sara Ahmed", action: "responded to client on", target: "GG-QRY-2026-0017", at: d(-1, 16), kind: "submit" },
  { id: "ac5", actor: "Customer Care", action: "transferred query to Finance", target: "GG-QRY-2026-0017", at: d(-2, 11), kind: "transfer" },
  { id: "ac6", actor: "Ahmed Sheikh", action: "assigned query to Ali Khan", target: "GG-QRY-2026-0012", at: d(-6, 11), kind: "assign" },
  { id: "ac7", actor: "Hamza Tariq", action: "marked as resolved", target: "GG-QRY-2026-0015", at: d(-4, 16), kind: "resolve" },
];

// Performance scoring is intentionally configurable — no official Giga Group targets are implied.
export const PERFORMANCE_CONFIG = {
  resolutionWeight: 0.7,
  taskWeight: 0.3,
  overduePenalty: 5,
};
