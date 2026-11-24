import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Paperclip } from "lucide-react";
import { useHod } from "@/lib/hod-store";
import { PRIORITIES, type Priority } from "@/lib/hod-data";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Panel } from "@/components/hod/ui-bits";
import { PriorityBadge, StatusBadge } from "@/components/hod/badges";
import { AssignmentDialog, ReasonDialog, type ReasonMode } from "@/components/hod/query-dialogs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/queries/$ref")({
  head: ({ params }) => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: `${params.ref} · Giga Group HOD` }, { name: "description", content: "Query details, communication and internal notes." }, { property: "og:title", content: `${params.ref} · Giga Group HOD` }, { property: "og:description", content: "Query details for Giga Group HODs." }] }),
  component: QueryDetail,
});

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (<div className="flex justify-between gap-3 py-1.5 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium text-navy">{v}</span></div>);

function QueryDetail() {
  const { ref } = Route.useParams();
  const { queries, employees, setQueryPriority, addNote, sendClientMessage } = useHod();
  const q = queries.find((x) => x.ref === ref);
  const [assign, setAssign] = useState(false);
  const [mode, setMode] = useState<ReasonMode | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  if (!q) return <div className="py-20 text-center"><p className="font-semibold">Query not found in your department.</p><Link to="/queries" search={{}} className="text-primary">Back to queries</Link></div>;
  const emp = employees.find((e) => e.id === q.assigneeId);
  const closed = q.status === "Closed";
  return (
    <div className="space-y-6">
      <Link to="/queries" search={{}} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-navy"><ArrowLeft className="size-3.5" />All queries</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><span className="font-mono text-sm text-muted-foreground">{q.ref}</span><StatusBadge status={q.status} /><PriorityBadge priority={q.priority} />{q.escalated && <span className="rounded bg-destructive/10 px-1.5 text-xs font-bold text-destructive">Escalated</span>}</div>
          <h1 className="mt-1 text-2xl font-bold text-navy">{q.subject}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAssign(true)} disabled={closed}>{q.assigneeId ? "Reassign" : "Assign"}</Button>
          <Select value={q.priority} onValueChange={(v) => setQueryPriority(q.ref, v as Priority)} disabled={closed}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p} priority</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" disabled={closed} onClick={() => setMode("extend")}>Extend deadline</Button>
          <Button variant="outline" disabled={closed} onClick={() => setMode("transfer")}>Transfer</Button>
          <Button variant="outline" disabled={closed} onClick={() => setMode("escalate")}>Escalate</Button>
          <Button variant="outline" disabled={closed || q.status === "Resolved"} onClick={() => setMode("resolve")}>Mark resolved</Button>
          <Button variant="destructive" disabled={closed} onClick={() => setMode("close")}>Close</Button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Query information"><p className="mb-4 text-sm leading-relaxed">{q.description}</p><div className="grid gap-x-8 sm:grid-cols-2"><Row k="Category" v={q.category} /><Row k="Submitted" v={fmtDateTime(q.submittedAt)} /><Row k="Due date" v={fmtDate(q.dueAt)} /><Row k="Last updated" v={fmtDateTime(q.updatedAt)} /></div></Panel>
          <Tabs defaultValue="comms">
            <TabsList><TabsTrigger value="comms">Client communication</TabsTrigger><TabsTrigger value="notes">Internal notes ({q.notes.length})</TabsTrigger></TabsList>
            <TabsContent value="comms"><Panel>
              <div className="space-y-3">{q.messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-lg p-3 text-sm ${m.from === "client" ? "bg-muted" : "ml-auto bg-primary/10"}`}>
                  <div className="mb-1 text-xs font-semibold text-navy">{m.author} · <span className="font-normal text-muted-foreground">{fmtDateTime(m.at)}</span></div>{m.body}
                  {m.attachment && <div className="mt-2 inline-flex items-center gap-1 rounded border bg-card px-2 py-1 text-xs"><Paperclip className="size-3" />{m.attachment}</div>}
                </div>))}</div>
              <div className="mt-4 flex gap-2"><Textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Client-visible update…" /><Button disabled={!msg.trim()} onClick={() => { sendClientMessage(q.ref, msg); setMsg(""); }}>Send</Button></div>
            </Panel></TabsContent>
            <TabsContent value="notes"><Panel>
              <p className="mb-3 flex items-center gap-1.5 rounded-md bg-warning/10 px-3 py-2 text-xs"><Lock className="size-3.5" />Internal only — never shown in the client inbox.</p>
              <div className="space-y-3">{q.notes.map((n) => (<div key={n.id} className="rounded-lg border-l-4 border-warning bg-muted/40 p-3 text-sm"><div className="mb-1 text-xs"><span className="font-semibold text-navy">{n.author}</span> · {n.kind} · {fmtDateTime(n.at)}</div>{n.body}</div>))}</div>
              <div className="mt-4 flex gap-2"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add HOD comment…" /><Button variant="secondary" disabled={!note.trim()} onClick={() => { addNote(q.ref, "HOD comment", note); setNote(""); }}>Add note</Button></div>
            </Panel></TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">
          <Panel title="Client information"><Row k="Name" v={q.client.name} /><Row k="Reference" v={q.client.ref} /><Row k="Email" v={q.client.email} /><Row k="Contact" v={q.client.phone} /><Row k="Project" v={q.client.project} /><Row k="Account" v={q.client.account} /></Panel>
          <Panel title="Assignment"><Row k="Department" v="Finance" /><Row k="Assigned to" v={emp?.name ?? "Unassigned"} /><Row k="Assigned on" v={q.assignedAt ? fmtDate(q.assignedAt) : "—"} /><Row k="Assigned by" v={q.assignedBy ?? "—"} /><Row k="Deadline" v={fmtDate(q.dueAt)} /></Panel>
          <Panel title="Activity timeline"><ol className="relative space-y-4 border-l pl-4">{q.timeline.map((t) => (<li key={t.id} className="text-sm"><span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-card bg-primary" /><div className="font-semibold text-navy">{t.label}</div><div className="text-xs text-muted-foreground">{t.actor} · {fmtDateTime(t.at)}</div>{t.detail && <div className="text-xs">{t.detail}</div>}</li>))}</ol></Panel>
        </div>
      </div>
      {assign && <AssignmentDialog query={q} open onOpenChange={setAssign} />}
      <ReasonDialog key={mode ?? "none"} query={q} mode={mode} onClose={() => setMode(null)} />
    </div>
  );
}
