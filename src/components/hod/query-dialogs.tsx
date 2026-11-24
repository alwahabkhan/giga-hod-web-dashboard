import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHod, employeeStats } from "@/lib/hod-store";
import { DEPARTMENTS, PRIORITIES, type Priority, type Query } from "@/lib/hod-data";
import { PersonAvatar } from "./ui-bits";
import { AvailabilityBadge } from "./badges";
import { cn } from "@/lib/utils";

const toInputDate = (iso: string) => iso.slice(0, 10);

export function AssignmentDialog({ query, open, onOpenChange }: { query: Query; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { employees, queries, tasks, assignQuery } = useHod();
  const [emp, setEmp] = useState(query.assigneeId ?? "");
  const [priority, setPriority] = useState<Priority>(query.priority);
  const [due, setDue] = useState(toInputDate(query.dueAt));
  const [instructions, setInstructions] = useState("");
  const [note, setNote] = useState("");
  const reassign = !!query.assigneeId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{reassign ? "Reassign query" : "Assign query"}</DialogTitle>
          <DialogDescription>{query.ref} · {query.subject}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Select employee</Label>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
              {employees.map((e) => {
                const s = employeeStats(e.id, queries, tasks);
                const load = Math.min(100, s.open * 20);
                return (
                  <button key={e.id} type="button" onClick={() => setEmp(e.id)}
                    className={cn("flex items-center gap-3 rounded-lg border p-2.5 text-left transition", emp === e.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}>
                    <PersonAvatar initials={e.initials} availability={e.availability} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-navy">{e.name}{e.id === query.assigneeId && <span className="text-[10px] font-medium text-muted-foreground">(current)</span>}</div>
                      <div className="text-xs text-muted-foreground">{e.designation}</div>
                    </div>
                    <div className="w-28 text-right">
                      <AvailabilityBadge a={e.availability} />
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", load >= 80 ? "bg-destructive" : load >= 50 ? "bg-warning" : "bg-success")} style={{ width: `${Math.max(load, 6)}%` }} /></div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{s.open} open · {s.overdue} overdue</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block" htmlFor="due">Deadline</Label>
              <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block" htmlFor="instr">Assignment instructions</Label>
            <Textarea id="instr" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Verify receipt against bank statement and ERP ledger" />
          </div>
          <div>
            <Label className="mb-1.5 block" htmlFor="note">Internal note <span className="font-normal text-muted-foreground">(never visible to client)</span></Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!emp || !due || emp === query.assigneeId && priority === query.priority && due === toInputDate(query.dueAt)} onClick={() => {
            assignQuery(query.ref, { employeeId: emp, priority, dueAt: new Date(`${due}T17:00:00Z`).toISOString(), instructions: instructions || undefined, note: note || undefined });
            toast.success(`${query.ref} ${reassign ? "reassigned" : "assigned"}`, { description: `${employees.find((e) => e.id === emp)?.name} has been notified.` });
            onOpenChange(false);
          }}>Confirm {reassign ? "reassignment" : "assignment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ReasonMode = "escalate" | "transfer" | "extend" | "resolve" | "close";
const COPY: Record<ReasonMode, { title: string; desc: string; cta: string; reasonRequired: boolean; destructive?: boolean }> = {
  escalate: { title: "Escalate query", desc: "Escalation raises priority to High and notifies senior management. A reason is required.", cta: "Confirm escalation", reasonRequired: true, destructive: true },
  transfer: { title: "Transfer to another department", desc: "Authorised interdepartmental transfer. The original reference and full history are retained.", cta: "Confirm transfer", reasonRequired: true },
  extend: { title: "Extend deadline", desc: "Set a new deadline for this query.", cta: "Update deadline", reasonRequired: false },
  resolve: { title: "Mark as resolved", desc: "The client will see the query as resolved in their app.", cta: "Mark resolved", reasonRequired: false },
  close: { title: "Close query", desc: "Closing finalises the query. History is retained for audit.", cta: "Close query", reasonRequired: false, destructive: true },
};

export function ReasonDialog({ query, mode, onClose }: { query: Query; mode: ReasonMode | null; onClose: () => void }) {
  const { escalateQuery, transferQuery, extendDeadline, setQueryStatus } = useHod();
  const [reason, setReason] = useState("");
  const [dept, setDept] = useState("Customer Care");
  const [due, setDue] = useState(toInputDate(query.dueAt));
  if (!mode) return null;
  const c = COPY[mode];
  const submit = () => {
    if (mode === "escalate") escalateQuery(query.ref, reason);
    if (mode === "transfer") transferQuery(query.ref, dept, reason);
    if (mode === "extend") extendDeadline(query.ref, new Date(`${due}T17:00:00Z`).toISOString(), reason);
    if (mode === "resolve") setQueryStatus(query.ref, "Resolved", reason);
    if (mode === "close") setQueryStatus(query.ref, "Closed", reason);
    toast.success(c.title.replace(/^\w/, (x) => x) + " — done", { description: `${query.ref} updated and recorded in activity history.` });
    setReason(""); onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{query.ref} · {c.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {mode === "transfer" && (
            <div>
              <Label className="mb-1.5 block">Destination department</Label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.filter((d) => d.id !== "finance").map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {mode === "extend" && (
            <div><Label className="mb-1.5 block" htmlFor="nd">New deadline</Label><Input id="nd" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          )}
          <div>
            <Label className="mb-1.5 block" htmlFor="reason">Reason {c.reasonRequired ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}</Label>
            <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Recorded in the internal activity history" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={c.destructive ? "destructive" : "default"} disabled={c.reasonRequired && reason.trim().length < 3} onClick={submit}>{c.cta}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
