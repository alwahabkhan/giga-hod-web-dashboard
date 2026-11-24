export type DeptId = "FIN" | "CC" | "REC" | "SS" | "LEG";
export type CaseStatus = "New" | "Assigned" | "In Progress" | "Waiting on Client" | "Handed Off" | "Resolved" | "Closed" | "Reopened";
export type Priority = "Low" | "Normal" | "High" | "Urgent";
export type SaleStatus = "New" | "Merged" | "Transferred" | "Rebooked";
export type InstallmentType = "Down Payment" | "Installment" | "Balloon" | "On Possession";
export type InstallmentStatus = "Paid" | "Partly Paid" | "Unpaid" | "Upcoming";
export type PaymentMode = "Cash" | "Cheque" | "TT" | "Pay Order" | "Adjustment";
export type AccountStatus = "Pending" | "Verified" | "Rejected" | "Suspended";
export type AdminStatus = "Active" | "Invited" | "Disabled";

export interface Department { id: DeptId; name: string; code: string; description: string; slaHours: number; headStaffId: string; active: boolean }
export interface Client { id: string; name: string; cnic: string; mobile: string; email: string; address: string; city: string; fatherName: string }
export interface AppAccount { id: string; clientId: string | null; signupName: string; signupCnic: string; signupMobile: string; signupEmail: string; registeredAt: string; status: AccountStatus; reason?: string }
export interface Sale { id: string; bookingNo: string; project: string; building: string; unit: string; unitType: "Apartment" | "Shop" | "Office"; areaSqft: number; ownerIds: string[]; netPrice: number; status: SaleStatus; bookedAt: string; cancelled: boolean }
export interface Installment { id: string; saleId: string; seq: number; dueDate: string; type: InstallmentType; amount: number; paid: number }
export interface Receipt { id: string; no: string; saleId: string; clientId: string; date: string; amount: number; mode: PaymentMode; bank: string; ref: string }
export interface Surcharge { id: string; saleId: string; clientId: string; amount: number; paid: number; date: string }
export interface Staff { id: string; name: string; email: string; mobile: string; crmRole: string; departments: DeptId[]; active: boolean; availability: "Available" | "Away" }
export interface DeptAdmin { id: string; name: string; email: string; phone: string; departments: DeptId[]; status: AdminStatus; lastLogin: string | null; password: string; mustChangePassword: boolean }
export interface Handoff { id: string; from: DeptId; to: DeptId; by: string; at: string; reason: string; status: "Pending" | "Accepted"; override?: boolean }
export type TimelineKind = "created" | "assigned" | "status" | "handoff" | "handoff_accepted" | "note_internal" | "note_client" | "attachment" | "resolved" | "closed" | "reopened" | "priority";
export interface TimelineEntry { id: string; at: string; by: string; kind: TimelineKind; text: string }
export interface Case {
  id: string; no: string; clientId: string; saleId?: string; receiptId?: string; category: string; department: DeptId;
  assigneeId?: string; status: CaseStatus; priority: Priority; createdAt: string; slaDueAt: string; resolvedAt?: string; closedAt?: string;
  description: string; handoffs: Handoff[]; timeline: TimelineEntry[]; attachments: string[];
}
export interface HandoffRule { id: string; from: DeptId; to: DeptId; enabled: boolean }
export interface Category { id: string; name: string; description: string; defaultDept: DeptId; defaultPriority: Priority; visibleToClient: boolean; active: boolean }
export interface SlaRule { id: string; category: string; priority: Priority; responseHours: number; resolutionHours: number }
export interface Template { id: string; event: "Case Created" | "Case Assigned" | "Status Changed" | "Case Resolved"; channel: "SMS" | "Email" | "Push Notification"; title: string; message: string }
export interface AuditEntry { id: string; at: string; user: string; action: string; entity: string; ref: string; before: string; after: string }
export interface Notification { id: string; at: string; audience: "super" | DeptId; title: string; body: string; read: boolean; caseNo?: string }
export interface HistoryEntry { id: string; clientId: string; at: string; kind: "Call" | "Letter" | "Notice" | "Visit" | "SMS"; text: string; by: string }
export interface SuperProfile { name: string; email: string; phone: string; password: string }

export interface DB {
  version: number; seededAt: string;
  departments: Department[]; clients: Client[]; accounts: AppAccount[]; sales: Sale[]; installments: Installment[];
  receipts: Receipt[]; surcharges: Surcharge[]; staff: Staff[]; admins: DeptAdmin[]; cases: Case[];
  rules: HandoffRule[]; allowOverride: boolean; categories: Category[]; sla: SlaRule[]; templates: Template[];
  audit: AuditEntry[]; notifications: Notification[]; history: HistoryEntry[]; superadmin: SuperProfile;
  prefs: Record<string, Record<string, boolean>>;
}

export type Session = { kind: "super" } | { kind: "dept"; adminId: string; activeDept: DeptId };
