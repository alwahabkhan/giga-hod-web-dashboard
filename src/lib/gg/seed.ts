import type { DB, Client, Sale, Installment, Receipt, Surcharge, Staff, Case, CaseStatus, Priority, DeptId, TimelineEntry, Handoff, AppAccount, HistoryEntry, AuditEntry, Notification, Department, Category, HandoffRule, SlaRule, Template, DeptAdmin, PaymentMode, SaleStatus } from "./types";

export const DB_VERSION = 3;
export const PROJECTS: { name: string; buildings: { name: string; type: Sale["unitType"]; floors: number; perFloor: number }[] }[] = [
  { name: "GOLDCREST", buildings: [{ name: "Tower A", type: "Apartment", floors: 8, perFloor: 6 }, { name: "Tower B", type: "Apartment", floors: 8, perFloor: 5 }] },
  { name: "GIGA MALL", buildings: [{ name: "Block 1", type: "Shop", floors: 3, perFloor: 12 }, { name: "Block 2", type: "Office", floors: 5, perFloor: 6 }] },
  { name: "GOLDCREST Breeze", buildings: [{ name: "Block 3", type: "Apartment", floors: 6, perFloor: 6 }, { name: "Block 5", type: "Apartment", floors: 6, perFloor: 5 }] },
  { name: "GOLDCREST VIEWS", buildings: [{ name: "Tower A", type: "Apartment", floors: 10, perFloor: 4 }, { name: "Tower C", type: "Apartment", floors: 8, perFloor: 4 }] },
];
export const DEPT_SEED: Department[] = [
  { id: "FIN", name: "Finance", code: "FIN", description: "Payments, receipts, ledgers and statements.", slaHours: 48, headStaffId: "ST-01", active: true },
  { id: "CC", name: "Customer Care", code: "CC", description: "First point of contact for client queries.", slaHours: 24, headStaffId: "ST-06", active: true },
  { id: "REC", name: "Recovery", code: "REC", description: "Overdue collections, surcharges and rescheduling.", slaHours: 72, headStaffId: "ST-11", active: true },
  { id: "SS", name: "Sales Support", code: "SS", description: "Transfers, possession and booking changes.", slaHours: 72, headStaffId: "ST-16", active: true },
  { id: "LEG", name: "Legal", code: "LEG", description: "Agreements, notices and legal documentation.", slaHours: 120, headStaffId: "ST-21", active: true },
];
export const CATEGORY_SEED: Omit<Category, "id">[] = [
  { name: "Cheque Issue", description: "Bounced, lost or unclear cheque payments.", defaultDept: "FIN", defaultPriority: "High", visibleToClient: true, active: true },
  { name: "Payment Not Reflected", description: "Payment made but not visible on the ledger.", defaultDept: "FIN", defaultPriority: "High", visibleToClient: true, active: true },
  { name: "Outstanding Query", description: "Questions about the outstanding balance.", defaultDept: "FIN", defaultPriority: "Normal", visibleToClient: true, active: true },
  { name: "Surcharge Waiver Request", description: "Request to waive late-payment surcharge.", defaultDept: "REC", defaultPriority: "Normal", visibleToClient: true, active: true },
  { name: "Reschedule Request", description: "Request to restructure installment plan.", defaultDept: "REC", defaultPriority: "Normal", visibleToClient: true, active: true },
  { name: "Transfer Request", description: "Transfer of ownership to another person.", defaultDept: "SS", defaultPriority: "Normal", visibleToClient: true, active: true },
  { name: "Possession Request", description: "Request for unit possession / handover.", defaultDept: "SS", defaultPriority: "High", visibleToClient: true, active: true },
  { name: "Document Request", description: "Statements, allotment letters, NOCs.", defaultDept: "CC", defaultPriority: "Low", visibleToClient: true, active: true },
  { name: "Other", description: "Anything else.", defaultDept: "CC", defaultPriority: "Normal", visibleToClient: true, active: true },
];
const RULE_SEED: [DeptId, DeptId, boolean][] = [["FIN", "CC", true], ["CC", "FIN", true], ["CC", "REC", true], ["REC", "FIN", true], ["SS", "LEG", true], ["FIN", "REC", true], ["CC", "SS", true], ["REC", "LEG", true], ["LEG", "SS", false]];

const MALE = ["Muhammad", "Ahmed", "Ali", "Hassan", "Usman", "Bilal", "Imran", "Faisal", "Kamran", "Zeeshan", "Omar", "Hamza", "Tariq", "Asif", "Waqas", "Shahid", "Adnan", "Junaid", "Saad", "Farhan", "Naveed", "Raheel", "Salman", "Haris"];
const FEMALE = ["Ayesha", "Fatima", "Sana", "Hira", "Maryam", "Zainab", "Nida", "Sadia", "Amna", "Rabia", "Mehwish", "Iqra", "Saba", "Kiran", "Faiza", "Uzma"];
const LAST = ["Khan", "Malik", "Sheikh", "Qureshi", "Chaudhry", "Butt", "Raza", "Siddiqui", "Hussain", "Javed", "Mirza", "Abbasi", "Awan", "Rana", "Bhatti", "Iqbal", "Aslam", "Farooq", "Hashmi", "Rehman", "Gondal", "Niazi"];
const CITIES = [["Rawalpindi", "Bahria Town Phase 7"], ["Islamabad", "F-11/3"], ["Islamabad", "DHA Phase II"], ["Lahore", "Gulberg III"], ["Rawalpindi", "Saddar"], ["Islamabad", "G-13/2"], ["Karachi", "Clifton Block 5"], ["Lahore", "Model Town"]] as const;
const BANKS = ["HBL", "MCB Bank", "UBL", "Meezan Bank", "Bank Alfalah", "Allied Bank", "Faysal Bank", "Bank Al Habib"];

function rng(seed: number) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function makeSeed(nowMs: number = Date.now()): DB {
  const r = rng(20261120);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
  const chance = (p: number) => r() < p;
  const DAY = 86400000, HOUR = 3600000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join("");
  let idc = 0; const uid = (p: string) => `${p}-${(++idc).toString(36)}`;

  // Clients
  const clients: Client[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 150; i++) {
    let name = "";
    const female = chance(0.3);
    do { name = `${pick(female ? FEMALE : MALE)} ${pick(LAST)}`; if (usedNames.has(name)) name = `${pick(MALE)} ${name}`; } while (usedNames.has(name));
    usedNames.add(name);
    const [city, area] = pick(CITIES);
    const first = name.split(" ")[0]!.toLowerCase(), last = name.split(" ").at(-1)!.toLowerCase();
    clients.push({
      id: `CL-${String(i + 1).padStart(4, "0")}`, name, fatherName: `${pick(MALE)} ${name.split(" ").at(-1)}`,
      cnic: `${pick(["35202", "37405", "61101", "42101", "37406", "61102"])}-${digits(7)}-${int(1, 9)}`,
      mobile: `03${int(0, 4)}${int(0, 9)}-${digits(7)}`, email: `${first}.${last}${int(1, 99)}@${pick(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"])}`,
      address: `House ${int(1, 400)}, Street ${int(1, 40)}, ${area}`, city,
    });
  }

  // Units
  type U = { project: string; building: string; unit: string; type: Sale["unitType"]; area: number };
  const units: U[] = [];
  for (const p of PROJECTS) for (const b of p.buildings) for (let f = 1; f <= b.floors; f++) for (let u = 1; u <= b.perFloor; u++) {
    const unit = b.type === "Shop" ? `Shop ${(f - 1) * b.perFloor + u}` : b.type === "Office" ? `Office ${f}0${u}` : `Apt ${f}${String(u).padStart(2, "0")}`;
    units.push({ project: p.name, building: b.name, unit, type: b.type, area: b.type === "Shop" ? int(250, 700) : b.type === "Office" ? int(600, 1500) : int(850, 2400) });
  }
  // shuffle
  for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [units[i], units[j]] = [units[j]!, units[i]!]; }

  const sales: Sale[] = [], installments: Installment[] = [], receipts: Receipt[] = [], surcharges: Surcharge[] = [];
  let rcp = 1000000;
  for (let i = 0; i < 208; i++) {
    const u = units[i]!;
    const cancelled = i >= 200;
    const owner = i < 150 ? clients[i]!.id : pick(clients).id;
    const ownerIds = [owner];
    if (chance(0.18)) { const co = pick(clients).id; if (co !== owner) ownerIds.push(co); }
    const rate = u.type === "Shop" ? int(45000, 90000) : u.type === "Office" ? int(22000, 32000) : int(11000, 19000);
    const netPrice = Math.round((u.area * rate) / 10000) * 10000;
    const bookedMs = nowMs - int(60, 1100) * DAY;
    const status: SaleStatus = chance(0.8) ? "New" : pick(["Merged", "Transferred", "Rebooked"] as const);
    const sale: Sale = { id: `SL-${i + 1}`, bookingNo: `BK-1003${String(i + 101).padStart(3, "0")}`, project: u.project, building: u.building, unit: u.unit, unitType: u.type, areaSqft: u.area, ownerIds, netPrice, status, bookedAt: iso(bookedMs), cancelled };
    sales.push(sale);
    if (cancelled) continue;
    // schedule
    const n = int(8, 16);
    const down = Math.round(netPrice * 0.2 / 1000) * 1000, balloon = Math.round(netPrice * 0.1 / 1000) * 1000, poss = Math.round(netPrice * 0.1 / 1000) * 1000;
    const inst = Math.round((netPrice - down - balloon - poss) / n / 1000) * 1000;
    const sched: Installment[] = [];
    sched.push({ id: uid("IN"), saleId: sale.id, seq: 1, dueDate: iso(bookedMs), type: "Down Payment", amount: down, paid: 0 });
    for (let k = 1; k <= n; k++) {
      sched.push({ id: uid("IN"), saleId: sale.id, seq: k + 1, dueDate: iso(bookedMs + k * 91 * DAY), type: "Installment", amount: inst, paid: 0 });
      if (k === Math.floor(n / 2)) sched.push({ id: uid("IN"), saleId: sale.id, seq: 0, dueDate: iso(bookedMs + k * 91 * DAY + 15 * DAY), type: "Balloon", amount: balloon, paid: 0 });
    }
    const last = netPrice - down - balloon - inst * n;
    sched.push({ id: uid("IN"), saleId: sale.id, seq: 0, dueDate: iso(bookedMs + (n + 1) * 91 * DAY), type: "On Possession", amount: last, paid: 0 });
    sched.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).forEach((s, idx) => (s.seq = idx + 1));
    const profile = r(); // good payer > 0.35
    const paidDates: number[] = [];
    for (const s of sched) {
      const due = Date.parse(s.dueDate);
      if (s.type === "Down Payment") { s.paid = s.amount; paidDates.push(due); continue; }
      if (due > nowMs) continue;
      if (profile > 0.35) { s.paid = s.amount; paidDates.push(due + int(0, 10) * DAY); }
      else if (profile > 0.15) { const x = r(); s.paid = x > 0.5 ? s.amount : x > 0.25 ? Math.round(s.amount * 0.5 / 1000) * 1000 : 0; if (s.paid) paidDates.push(due + int(0, 20) * DAY); }
    }
    installments.push(...sched);
    // 3 receipts per sale
    const totalPaid = sched.reduce((a, s) => a + s.paid, 0);
    const parts = totalPaid === down ? [Math.round(down * 0.5), Math.round(down * 0.3)] : [down, Math.round((totalPaid - down) * 0.55)];
    parts.push(totalPaid - parts[0]! - parts[1]!);
    const dates = totalPaid === down ? [bookedMs, bookedMs + 3 * DAY, bookedMs + 7 * DAY] : [bookedMs, paidDates[Math.floor(paidDates.length / 2)] ?? bookedMs, paidDates.at(-1) ?? bookedMs];
    parts.forEach((amt, k) => {
      const mode: PaymentMode = pick(["Cheque", "Cheque", "Pay Order", "TT", "Cash", "Adjustment"] as const);
      receipts.push({ id: uid("RC"), no: `RP-10${String(++rcp).slice(-5)}`, saleId: sale.id, clientId: owner, date: iso(Math.min(dates[k]!, nowMs - DAY)), amount: amt, mode,
        bank: mode === "Cash" || mode === "Adjustment" ? "—" : pick(BANKS), ref: mode === "Cheque" ? `CHQ-${digits(8)}` : mode === "Pay Order" ? `PO-${digits(6)}` : mode === "TT" ? `TT${digits(10)}` : mode === "Adjustment" ? `ADJ-${digits(4)}` : "—" });
    });
    // surcharges
    const overdue = sched.filter((s) => Date.parse(s.dueDate) < nowMs && s.paid < s.amount);
    if (overdue.length) {
      const amt = Math.round(overdue.reduce((a, s) => a + (s.amount - s.paid), 0) * 0.02 / 100) * 100;
      surcharges.push({ id: uid("SC"), saleId: sale.id, clientId: owner, amount: amt, paid: chance(0.3) ? Math.round(amt * 0.5 / 100) * 100 : 0, date: overdue[0]!.dueDate });
    }
  }

  // Staff
  const deptIds: DeptId[] = ["FIN", "CC", "REC", "SS", "LEG"];
  const roleName: Record<DeptId, string> = { FIN: "Finance", CC: "Customer Care", REC: "Recovery", SS: "Sales Support", LEG: "Legal" };
  const staffNames = ["Fatima Malik", "Ahmed Sheikh", "Hira Aslam", "Waqas Butt", "Saad Iqbal", "Imran Qureshi", "Ayesha Khan", "Zeeshan Raza", "Nida Farooq", "Hamza Awan", "Bilal Chaudhry", "Kamran Niazi", "Sadia Hussain", "Junaid Bhatti", "Omar Hashmi", "Sana Javed", "Faisal Mirza", "Amna Siddiqui", "Raheel Gondal", "Iqra Rehman", "Hassan Raza", "Mehwish Abbasi", "Adnan Rana", "Tariq Malik", "Kiran Sheikh"];
  const staff: Staff[] = staffNames.map((name, i) => {
    const d = deptIds[Math.floor(i / 5)]!;
    const deps: DeptId[] = [d]; if (i === 9) deps.push("REC"); if (i === 19) deps.push("LEG");
    return { id: `ST-${String(i + 1).padStart(2, "0")}`, name, email: `${name.toLowerCase().replace(" ", ".")}@gigagroup.pk`, mobile: `03${int(0, 4)}${int(0, 9)}-${digits(7)}`, crmRole: i % 5 === 0 ? `${roleName[d]} Manager` : `${roleName[d]} Officer`, departments: deps, active: i !== 24, availability: chance(0.8) ? "Available" : "Away" };
  });
  const admins: DeptAdmin[] = [
    { id: "DA-1", name: "Fatima Malik", email: "fatima.malik@gigagroup.pk", phone: "0300-5123456", departments: ["FIN"], status: "Active", lastLogin: iso(nowMs - 3 * HOUR), password: "Finance@123", mustChangePassword: false },
    { id: "DA-2", name: "Imran Qureshi", email: "imran.qureshi@gigagroup.pk", phone: "0321-4455667", departments: ["CC"], status: "Active", lastLogin: iso(nowMs - 26 * HOUR), password: "Care@123", mustChangePassword: false },
    { id: "DA-3", name: "Bilal Chaudhry", email: "bilal.chaudhry@gigagroup.pk", phone: "0333-7788990", departments: ["REC"], status: "Active", lastLogin: iso(nowMs - 2 * DAY), password: "Recovery@123", mustChangePassword: false },
    { id: "DA-4", name: "Sana Javed", email: "sana.javed@gigagroup.pk", phone: "0345-2211334", departments: ["SS", "LEG"], status: "Active", lastLogin: iso(nowMs - 5 * HOUR), password: "Sales@123", mustChangePassword: false },
    { id: "DA-5", name: "Hassan Raza", email: "hassan.raza@gigagroup.pk", phone: "0312-9988776", departments: ["LEG"], status: "Invited", lastLogin: null, password: "Temp@1234", mustChangePassword: true },
  ];

  const categories: Category[] = CATEGORY_SEED.map((c, i) => ({ ...c, id: `CAT-${i + 1}` }));
  const rules: HandoffRule[] = RULE_SEED.map(([from, to, enabled], i) => ({ id: `HR-${i + 1}`, from, to, enabled }));
  const sla: SlaRule[] = [
    ...(["Urgent", "High", "Normal", "Low"] as Priority[]).map((p, i) => ({ id: `SLA-${i + 1}`, category: "*", priority: p, responseHours: [2, 4, 12, 24][i]!, resolutionHours: [24, 48, 72, 120][i]! })),
    { id: "SLA-5", category: "Cheque Issue", priority: "High" as Priority, responseHours: 2, resolutionHours: 24 },
    { id: "SLA-6", category: "Possession Request", priority: "Normal" as Priority, responseHours: 24, resolutionHours: 168 },
  ];
  const slaFor = (cat: string, p: Priority) => (sla.find((s) => s.category === cat && s.priority === p) ?? sla.find((s) => s.category === "*" && s.priority === p))!.resolutionHours;

  // Cases
  const activeSales = sales.filter((s) => !s.cancelled);
  const cases: Case[] = [];
  const statusPool: CaseStatus[] = ["New", "New", "Assigned", "Assigned", "In Progress", "In Progress", "In Progress", "Waiting on Client", "Handed Off", "Resolved", "Resolved", "Closed", "Closed", "Closed", "Reopened"];
  const descs: Record<string, string[]> = {
    "Cheque Issue": ["Cheque #{n} submitted at the Gulberg office was returned by the bank. Client says funds were available.", "Client reports the post-dated cheque for the quarterly installment was not presented on time."],
    "Payment Not Reflected": ["Client paid via TT on the due date but the ledger still shows the installment as unpaid.", "Pay order deposited last month is not visible on the client statement."],
    "Outstanding Query": ["Client disputes the outstanding balance and wants a reconciled statement.", "Client asks for a breakdown of the remaining amount including balloon payment."],
    "Surcharge Waiver Request": ["Client requests waiver of late surcharge citing a delay in bank processing.", "Overseas client asks to waive surcharge due to remittance delays."],
    "Reschedule Request": ["Client requests restructuring of the remaining installments over 24 months.", "Client wants to defer the balloon payment by two quarters."],
    "Transfer Request": ["Client wants to transfer the unit to a family member.", "Ownership transfer requested following sale to a third party."],
    "Possession Request": ["Client has cleared dues and requests possession scheduling.", "Client asks for an expected possession date and handover checklist."],
    "Document Request": ["Client requests an updated account statement for bank financing.", "Allotment letter copy and NOC requested."],
    "Other": ["Client complaint about parking allocation in the building.", "Client asks to update the registered mobile number."],
  };
  for (let i = 0; i < 120; i++) {
    const cat = pick(categories);
    const sale = pick(activeSales);
    const clientId = sale.ownerIds[0]!;
    let status = statusPool[i % statusPool.length]!;
    const priority: Priority = chance(0.12) ? "Urgent" : chance(0.25) ? "High" : chance(0.8) ? "Normal" : "Low";
    const createdMs = nowMs - (i < 8 ? int(1, 8) * HOUR : int(1, 60) * DAY + int(0, 23) * HOUR);
    let dept: DeptId = cat.defaultDept;
    const members = (d: DeptId) => staff.filter((s) => s.departments.includes(d) && s.active);
    const tl: TimelineEntry[] = [];
    const add = (offsetH: number, by: string, kind: TimelineEntry["kind"], text: string) => tl.push({ id: uid("TL"), at: iso(Math.min(createdMs + offsetH * HOUR, nowMs - 60000)), by, kind, text });
    add(0, chance(0.5) ? "Client (mobile app)" : pick(members("CC")).name, "created", `Case created in ${roleName[dept]} · ${cat.name}`);
    const handoffs: Handoff[] = [];
    let assignee: string | undefined;
    let h = 1;
    // handoffs for some
    const doHandoff = (status === "Handed Off") || chance(0.18);
    if (status !== "New") { const m = pick(members(dept)); assignee = m.id; add(h++, staff.find((s) => s.departments.includes(dept))!.name, "assigned", `Assigned to ${m.name}`); add(h++, m.name, "status", "Status changed: Assigned → In Progress"); }
    if (chance(0.6) && status !== "New") add(h++, staff.find((s) => s.id === assignee)?.name ?? "System", "note_internal", pick(["Checked ledger in CRM; amount mismatch of PKR 50,000.", "Called client, will revert after bank confirmation.", "Bank statement requested from client.", "Verified receipt in CRM against booking."]));
    if (doHandoff) {
      const targets = rules.filter((x) => x.from === dept && x.enabled);
      const t = targets.length ? pick(targets).to : null;
      if (t) {
        const pending = status === "Handed Off";
        const hoMs = pending ? nowMs - int(2, 60) * HOUR : createdMs + h * HOUR;
        const by = staff.find((s) => s.id === assignee)?.name ?? "System";
        const reason = pick(["Requires ledger correction by Finance.", "Client needs callback from Customer Care.", "Overdue amount — recovery follow-up needed.", "Legal vetting of transfer documents required.", "Client wants a reschedule; outside Finance scope."]);
        handoffs.push({ id: uid("HO"), from: dept, to: t, by, at: iso(hoMs), reason, status: pending ? "Pending" : "Accepted" });
        tl.push({ id: uid("TL"), at: iso(hoMs), by, kind: "handoff", text: `Handed off ${roleName[dept]} → ${roleName[t]}: ${reason}` });
        dept = t;
        if (pending) assignee = undefined;
        else { const m = pick(members(t)); assignee = m.id; tl.push({ id: uid("TL"), at: iso(hoMs + HOUR), by: members(t)[0]!.name, kind: "handoff_accepted", text: `Handoff accepted by ${roleName[t]}` }); tl.push({ id: uid("TL"), at: iso(hoMs + 2 * HOUR), by: members(t)[0]!.name, kind: "assigned", text: `Assigned to ${m.name}` }); h += 3; }
      } else if (status === "Handed Off") status = "In Progress";
    }
    if (status === "New") assignee = undefined;
    if (status === "Waiting on Client") { add(h++, "System", "note_client", "We have requested a copy of your bank deposit slip. Please upload it in the app."); add(h++, staff.find((s) => s.id === assignee)?.name ?? "System", "status", "Status changed: In Progress → Waiting on Client"); }
    let resolvedAt: string | undefined, closedAt: string | undefined;
    if (["Resolved", "Closed", "Reopened"].includes(status)) {
      const resH = int(6, Math.max(8, slaFor(cat.name, priority) * (chance(0.7) ? 0.9 : 1.6)));
      add(resH, staff.find((s) => s.id === assignee)?.name ?? "System", "note_client", "Your request has been processed. The updated statement is available in the app.");
      add(resH, staff.find((s) => s.id === assignee)?.name ?? "System", "resolved", "Case resolved");
      resolvedAt = tl.at(-1)!.at;
      if (status === "Closed") { add(resH + 24, "System", "closed", "Case closed after client confirmation"); closedAt = tl.at(-1)!.at; }
      if (status === "Reopened") { add(resH + 30, "Client (mobile app)", "reopened", "Reopened by client: issue persists"); resolvedAt = undefined; }
    }
    tl.sort((a, b) => a.at.localeCompare(b.at));
    const receipt = chance(0.4) ? receipts.find((x) => x.saleId === sale.id) : undefined;
    cases.push({
      id: `C${i + 1}`, no: `CS-${String(i + 1).padStart(4, "0")}`, clientId, saleId: sale.id, ...(receipt ? { receiptId: receipt.id } : {}), category: cat.name, department: dept,
      ...(assignee ? { assigneeId: assignee } : {}), status, priority, createdAt: iso(createdMs), slaDueAt: iso(createdMs + slaFor(cat.name, priority) * HOUR),
      ...(resolvedAt ? { resolvedAt } : {}), ...(closedAt ? { closedAt } : {}),
      description: pick(descs[cat.name] ?? descs["Other"]!).replace("{n}", digits(6)), handoffs, timeline: tl, attachments: chance(0.3) ? ["bank_slip.pdf"] : [],
    });
  }
  // App accounts
  const accounts: AppAccount[] = [];
  clients.forEach((c, i) => {
    if (i % 5 === 4 && i > 20) return; // ~ no account
    if (i > 120) return;
    const st: AppAccount["status"] = i < 14 ? "Pending" : i % 13 === 0 ? "Rejected" : i % 17 === 0 ? "Suspended" : "Verified";
    const mismatch = st === "Pending" && i % 3 === 0;
    accounts.push({ id: `AA-${i + 1}`, clientId: c.id, signupName: mismatch ? c.name.split(" ")[0] + " " + pick(LAST) : c.name, signupCnic: c.cnic, signupMobile: mismatch ? `03${int(0, 4)}${int(0, 9)}-${digits(7)}` : c.mobile, signupEmail: c.email, registeredAt: iso(nowMs - (st === "Pending" ? int(1, 72) * HOUR : int(5, 300) * DAY)), status: st, ...(st === "Rejected" ? { reason: "CNIC does not match CRM record." } : {}) });
  });
  accounts.push({ id: "AA-901", clientId: null, signupName: "Rizwan Ahmed", signupCnic: "35202-8812345-3", signupMobile: "0301-7712345", signupEmail: "rizwan.ahmed@gmail.com", registeredAt: iso(nowMs - 5 * HOUR), status: "Pending" });

  const history: HistoryEntry[] = [];
  clients.forEach((c) => {
    for (let k = 0; k < int(2, 5); k++) {
      const kind = pick(["Call", "Call", "Letter", "Notice", "Visit", "SMS"] as const);
      const text = { Call: pick(["Inbound call regarding installment due date.", "Outbound reminder call for overdue installment.", "Client called to confirm receipt of payment."]), Letter: pick(["Allotment letter dispatched via TCS.", "Payment schedule letter issued."]), Notice: pick(["First reminder notice for overdue installment.", "Final notice issued for outstanding balance."]), Visit: "Client visited the Rawalpindi sales office.", SMS: "Installment reminder SMS sent." }[kind];
      history.push({ id: uid("HI"), clientId: c.id, at: iso(nowMs - int(1, 400) * DAY), kind, text, by: pick(staff).name });
    }
  });
  const audit: AuditEntry[] = [];
  for (let k = 0; k < 25; k++) {
    const c = pick(cases); const actor = pick(["Superadmin", "Fatima Malik", "Imran Qureshi", "Bilal Chaudhry", "Sana Javed"]);
    const a = pick(["Case assigned", "Status changed", "Account verified", "Login"]);
    audit.push({ id: uid("AU"), at: iso(nowMs - int(1, 400) * HOUR), user: actor, action: a, entity: a === "Account verified" ? "Client Account" : a === "Login" ? "Session" : "Case", ref: a === "Account verified" ? pick(accounts).id : a === "Login" ? actor : c.no, before: a === "Status changed" ? "Assigned" : "—", after: a === "Status changed" ? "In Progress" : a === "Case assigned" ? pick(staff).name : "—" });
  }
  audit.sort((a, b) => b.at.localeCompare(a.at));
  const notifications: Notification[] = [];
  cases.filter((c) => c.handoffs.some((h) => h.status === "Pending")).slice(0, 8).forEach((c) => notifications.push({ id: uid("NT"), at: c.handoffs.at(-1)!.at, audience: c.department, title: `Incoming handoff ${c.no}`, body: `${c.category} handed in from ${roleName[c.handoffs.at(-1)!.from]}`, read: false, caseNo: c.no }));
  cases.filter((c) => c.status === "New").slice(0, 6).forEach((c) => { notifications.push({ id: uid("NT"), at: c.createdAt, audience: c.department, title: `New case ${c.no}`, body: `${c.category} · ${c.priority}`, read: false, caseNo: c.no }); notifications.push({ id: uid("NT"), at: c.createdAt, audience: "super", title: `New case ${c.no}`, body: `${c.category} routed to ${roleName[c.department]}`, read: false, caseNo: c.no }); });
  notifications.push({ id: uid("NT"), at: iso(nowMs - 2 * HOUR), audience: "super", title: "15 client accounts pending verification", body: "Mobile app sign-ups are waiting for review.", read: false });
  notifications.sort((a, b) => b.at.localeCompare(a.at));

  const templates: Template[] = [
    { id: "TP-1", event: "Case Created", channel: "SMS", title: "Case received", message: "Dear {client_name}, your request {case_no} has been received by Giga Group. We will respond shortly." },
    { id: "TP-2", event: "Case Assigned", channel: "Push Notification", title: "Your case is being handled", message: "{case_no} has been assigned to {staff_name} in {department}." },
    { id: "TP-3", event: "Status Changed", channel: "Email", title: "Update on {case_no}", message: "Dear {client_name}, the status of {case_no} is now {status}." },
    { id: "TP-4", event: "Case Resolved", channel: "SMS", title: "Case resolved", message: "Dear {client_name}, {case_no} has been resolved. Reply in the app if you need more help." },
  ];
  return {
    version: DB_VERSION, seededAt: iso(nowMs), departments: DEPT_SEED.map((d) => ({ ...d })), clients, accounts, sales, installments, receipts, surcharges, staff, admins, cases,
    rules, allowOverride: true, categories, sla, templates, audit, notifications, history,
    superadmin: { name: "Kashif Mehmood", email: "superadmin@gigagroup.pk", phone: "0300-8500100", password: "Admin@123" }, prefs: {},
  };
}
