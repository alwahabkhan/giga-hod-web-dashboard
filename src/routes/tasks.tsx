import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useHod } from "@/lib/hod-store";
import { PRIORITIES, TASK_STATUSES, type Priority, type TaskStatus } from "@/lib/hod-data";
import { fmtDate } from "@/lib/format";
import { PageHeader, Panel } from "@/components/hod/ui-bits";
import { PriorityBadge, TaskStatusBadge } from "@/components/hod/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Task Management · Giga Group HOD" }, { name: "description", content: "Create, assign and track departmental tasks." }, { property: "og:title", content: "Task Management · Giga Group HOD" }, { property: "og:description", content: "Departmental tasks." }] }),
  component: Tasks,
});

function Tasks() {
  const { tasks, employees, queries, createTask, setTaskStatus } = useHod();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", assigneeId: "", priority: "Medium" as Priority, start: "2026-11-09", due: "2026-11-12", related: "none", instructions: "" });
  const name = (id: string) => employees.find((e) => e.id === id)?.name;
  return (
    <div>
      <PageHeader title="Task Management" description="Individual responsibilities assigned to your team (separate from client queries)." actions={<Button onClick={() => setOpen(true)}><Plus /> Create task</Button>} />
      <Tabs defaultValue="kanban">
        <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="list">List</TabsTrigger><TabsTrigger value="deadlines">Deadlines</TabsTrigger></TabsList>
        <TabsContent value="kanban"><div className="grid gap-4 md:grid-cols-3">{(["To Do", "In Progress", "Completed"] as TaskStatus[]).map((col) => (
          <div key={col} className="rounded-xl bg-muted/50 p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => setTaskStatus(e.dataTransfer.getData("id"), col)}>
            <div className="mb-3 text-sm font-semibold text-navy">{col}</div>
            <div className="space-y-2">{tasks.filter((t) => t.status === col || (col === "To Do" && (t.status === "Overdue" || t.status === "On Hold"))).map((t) => (
              <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", t.id)} className={`cursor-grab rounded-lg border bg-card p-3 shadow-card ${t.status === "Overdue" ? "border-l-4 border-l-destructive" : ""}`}>
                <div className="flex justify-between gap-2"><span className="text-sm font-semibold text-navy">{t.title}</span><PriorityBadge priority={t.priority} /></div>
                <div className="mt-1 text-xs text-muted-foreground">{name(t.assigneeId)} · due {fmtDate(t.dueAt)}</div>
                <div className="mt-2 flex items-center justify-between"><TaskStatusBadge status={t.status} />
                  <Select value={t.status} onValueChange={(v) => setTaskStatus(t.id, v as TaskStatus)}><SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>))}</div>
          </div>))}</div></TabsContent>
        <TabsContent value="list"><Panel bodyClass="p-0"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground"><tr>{["Task", "Assignee", "Created by", "Priority", "Start", "Due", "Related query", "Status"].map((h) => <th key={h} className="px-4 py-2.5">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{tasks.map((t) => <tr key={t.id}><td className="px-4 py-2.5"><div className="font-semibold text-navy">{t.title}</div><div className="text-xs text-muted-foreground">{t.description}</div></td><td className="px-4">{name(t.assigneeId)}</td><td className="px-4">{t.createdBy}</td><td className="px-4"><PriorityBadge priority={t.priority} /></td><td className="px-4 text-xs">{fmtDate(t.startAt)}</td><td className="px-4 text-xs">{fmtDate(t.dueAt)}</td><td className="px-4 font-mono text-xs">{t.relatedQuery ?? "—"}</td><td className="px-4"><TaskStatusBadge status={t.status} /></td></tr>)}</tbody></table></Panel></TabsContent>
        <TabsContent value="deadlines"><Panel><ul className="space-y-2">{[...tasks].filter((t) => t.status !== "Completed").sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map((t) => <li key={t.id} className="flex justify-between rounded border p-3 text-sm"><span><b>{fmtDate(t.dueAt)}</b> — {t.title} ({name(t.assigneeId)})</span><TaskStatusBadge status={t.status} /></li>)}</ul></Panel></TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Task title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Assign employee</Label><Select value={f.assigneeId} onValueChange={(v) => setF({ ...f, assigneeId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Priority</Label><Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as Priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Start date</Label><Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></div>
          </div>
          <div><Label>Related query (optional)</Label><Select value={f.related} onValueChange={(v) => setF({ ...f, related: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{queries.map((q) => <SelectItem key={q.ref} value={q.ref}>{q.ref} · {q.subject}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Supporting attachments</Label><Input type="file" multiple /></div>
          <div><Label>Additional instructions</Label><Textarea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!f.title || !f.assigneeId} onClick={() => {
          createTask({ title: f.title, description: f.description, assigneeId: f.assigneeId, priority: f.priority, startAt: `${f.start}T09:00:00.000Z`, dueAt: `${f.due}T17:00:00.000Z`, relatedQuery: f.related === "none" ? undefined : f.related, instructions: f.instructions, attachments: [] });
          toast.success("Task created and assigned"); setOpen(false); setF({ ...f, title: "", description: "" });
        }}>Create task</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
