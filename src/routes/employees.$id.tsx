import { createFileRoute, Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useHod, employeeStats } from "@/lib/hod-store";
import { Panel, PersonAvatar, StatCard, chartColors, tooltipStyle } from "@/components/hod/ui-bits";
import { AvailabilityBadge, StatusBadge, TaskStatusBadge } from "@/components/hod/badges";
import { fmtDate } from "@/lib/format";
import { ArrowLeft, Inbox, Sparkles, Loader, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/employees/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Employee profile · Giga Group HOD" }, { name: "description", content: "Employee work, tasks and performance." }, { property: "og:title", content: "Employee profile · Giga Group HOD" }, { property: "og:description", content: "Employee performance view." }] }),
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { id } = Route.useParams();
  const { employees, queries, tasks } = useHod();
  const e = employees.find((x) => x.id === id);
  if (!e) return <p className="py-20 text-center">Employee not in your department.</p>;
  const s = employeeStats(e.id, queries, tasks);
  const pie = [{ n: "To Do", v: s.tasksTodo, c: chartColors.info }, { n: "In Progress", v: s.tasksInProgress, c: chartColors.teal }, { n: "Completed", v: s.tasksCompleted, c: chartColors.ok }, { n: "Overdue", v: s.tasksOverdue, c: chartColors.bad }];
  return (
    <div className="space-y-6">
      <Link to="/employees" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />All employees</Link>
      <Panel><div className="flex flex-wrap items-center gap-5"><PersonAvatar initials={e.initials} availability={e.availability} size="lg" /><div className="flex-1"><h1 className="text-2xl font-bold text-navy">{e.name}</h1><p className="text-sm text-muted-foreground">{e.designation} · Finance · {e.id}</p><p className="text-sm">{e.email} · {e.phone}</p></div><AvailabilityBadge a={e.availability} /></div></Panel>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Assigned queries" value={s.assigned} icon={Inbox} tone="navy" /><StatCard label="New" value={s.newQ} icon={Sparkles} tone="info" /><StatCard label="In progress" value={s.inProgress} icon={Loader} /><StatCard label="Resolved" value={s.resolved} icon={CheckCircle2} tone="ok" /><StatCard label="Overdue" value={s.overdue} icon={AlertTriangle} tone="bad" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Task overview"><div className="h-48"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" nameKey="n" innerRadius={45} outerRadius={75}>{pie.map((p) => <Cell key={p.n} fill={p.c} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div>
          <div className="grid grid-cols-2 gap-1 text-xs">{pie.map((p) => <span key={p.n}>{p.n}: <b>{p.v}</b></span>)}<span>Total: <b>{s.tasksTotal}</b></span></div></Panel>
        <Panel title="Assigned queries" className="xl:col-span-2" bodyClass="p-0"><ul className="divide-y">{queries.filter((q) => q.assigneeId === e.id).map((q) => (
          <li key={q.ref}><Link to="/queries/$ref" params={{ ref: q.ref }} className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-muted/40"><span><span className="font-mono text-xs text-muted-foreground">{q.ref}</span> {q.subject}</span><StatusBadge status={q.status} /></Link></li>))}</ul></Panel>
      </div>
      <Panel title="Tasks" bodyClass="p-0"><ul className="divide-y">{tasks.filter((t) => t.assigneeId === e.id).map((t) => (<li key={t.id} className="flex items-center justify-between px-5 py-2.5 text-sm"><span>{t.title} <span className="text-xs text-muted-foreground">· due {fmtDate(t.dueAt)}</span></span><TaskStatusBadge status={t.status} /></li>))}</ul></Panel>
    </div>
  );
}
