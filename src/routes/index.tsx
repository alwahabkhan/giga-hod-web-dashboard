import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Inbox, Sparkles, Clock, Loader, CheckCircle2, AlertTriangle, MessageCircleReply, ArrowRight, UserPlus,
  ArrowRightLeft, FileCheck2, Bell, StickyNote, Flag, ListChecks,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHod, employeeStats } from "@/lib/hod-store";
import { TODAY, type Activity, type QueryStatus } from "@/lib/hod-data";
import { daysUntil, relTime } from "@/lib/format";
import { Panel, StatCard, PersonAvatar, chartColors, tooltipStyle } from "@/components/hod/ui-bits";
import { AvailabilityBadge, PriorityBadge, StatusBadge } from "@/components/hod/badges";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WorkflowStrip } from "@/components/hod/workflow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, 
      { title: "Dashboard · Giga Group HOD" },
      { name: "description", content: "Finance department overview: query workload, trends, employee performance and items needing attention." },
      { property: "og:title", content: "Dashboard · Giga Group HOD" },
      { property: "og:description", content: "Departmental overview for Giga Group heads of department." },
    ],
  }),
  component: Dashboard,
});

// Deterministic illustrative trend series.
export function trendSeries(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const dt = new Date(TODAY); dt.setDate(dt.getDate() - (days - 1 - i));
    const r = 8 + Math.round(4 * Math.sin(i / 2.3) + ((i * 7) % 5));
    const s = Math.max(2, r - 2 + Math.round(3 * Math.cos(i / 1.7)));
    return { date: dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), received: r, resolved: s, pending: Math.max(1, 6 + Math.round(3 * Math.sin(i / 4)) + (i % 3)) };
  });
}

const activityIcon: Record<Activity["kind"], typeof Inbox> = {
  assign: UserPlus, resolve: FileCheck2, new: Inbox, transfer: ArrowRightLeft, deadline: Clock, submit: MessageCircleReply,
  note: StickyNote, escalate: Flag, task: ListChecks, status: Bell,
};

function CategoryTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const value = payload?.value ?? "";
  const [first, ...rest] = value.split(" ");
  const second = rest.join(" ");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" fill="var(--muted-foreground)" fontSize={11}>
        <tspan x={0} dy={second ? -5 : 4}>{first}</tspan>
        {second ? <tspan x={0} dy={12}>{second}</tspan> : null}
      </text>
    </g>
  );
}

function CategoryBreakdown({ data }: { data: { name: string; open: number }[] }) {
  const [narrow, setNarrow] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const max = Math.max(1, ...data.map((d) => d.open));
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No open queries.</p>;
  }
  if (narrow) {
    return (
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 font-medium leading-snug text-navy">{d.name}</span>
              <span className="shrink-0 font-semibold tabular-nums text-navy">{d.open}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${Math.max(8, (d.open / max) * 100)}%`, background: chartColors.teal }} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="w-full min-w-0" style={{ height: Math.max(240, data.length * 48) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={108} tick={<CategoryTick />} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="open" name="Open" fill={chartColors.teal} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dashboard() {
  const { hod, queries, employees, tasks, activity } = useHod();
  const navigate = useNavigate();
  const [range, setRange] = useState("7");
  const count = (s: QueryStatus) => queries.filter((q) => q.status === s).length;
  const hour = TODAY.getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const stats: { label: string; status?: QueryStatus; value: number; icon: typeof Inbox; tone: "teal" | "info" | "warn" | "ok" | "bad" | "navy"; delta: number }[] = [
    { label: "Total Queries", value: queries.length, icon: Inbox, tone: "navy", delta: 12 },
    { label: "New Queries", status: "New", value: count("New"), icon: Sparkles, tone: "info", delta: 8 },
    { label: "Pending", status: "Pending", value: count("Pending"), icon: Clock, tone: "warn", delta: -4 },
    { label: "In Progress", status: "In Progress", value: count("In Progress"), icon: Loader, tone: "teal", delta: 5 },
    { label: "Resolved", status: "Resolved", value: count("Resolved") + count("Closed"), icon: CheckCircle2, tone: "ok", delta: 18 },
    { label: "Overdue", status: "Overdue", value: count("Overdue"), icon: AlertTriangle, tone: "bad", delta: -10 },
    { label: "Awaiting Response", status: "Awaiting Response", value: count("Awaiting Response"), icon: MessageCircleReply, tone: "navy", delta: 0 },
  ];

  const dist = [
    { name: "New", value: count("New"), fill: chartColors.info },
    { name: "Pending", value: count("Pending"), fill: chartColors.warn },
    { name: "In Progress", value: count("In Progress") + count("Awaiting Response"), fill: chartColors.teal },
    { name: "Resolved", value: count("Resolved") + count("Closed"), fill: chartColors.ok },
    { name: "Overdue", value: count("Overdue"), fill: chartColors.bad },
  ];
  const trend = useMemo(() => trendSeries(Number(range)), [range]);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    queries.filter((q) => !["Resolved", "Closed"].includes(q.status)).forEach((q) => m.set(q.category, (m.get(q.category) ?? 0) + 1));
    return [...m].map(([name, open]) => ({ name, open })).sort((a, b) => b.open - a.open);
  }, [queries]);

  const open = queries.filter((q) => !["Resolved", "Closed"].includes(q.status));
  const attention = [
    { label: "High priority", items: open.filter((q) => q.priority === "High" && q.status !== "Overdue") , tone: "bad" },
    { label: "Overdue", items: open.filter((q) => q.status === "Overdue"), tone: "bad" },
    { label: "Due within 48h", items: open.filter((q) => q.status !== "Overdue" && daysUntil(q.dueAt) <= 2), tone: "warn" },
    { label: "Awaiting employee response", items: open.filter((q) => q.status === "Pending" && q.assigneeId), tone: "warn" },
    { label: "Unassigned", items: open.filter((q) => !q.assigneeId), tone: "info" },
  ];
  const [attTab, setAttTab] = useState("Unassigned");
  const attItems = attention.find((a) => a.label === attTab)?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">{greet}, {hod.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Finance Department Overview · {open.length} open queries across {employees.length} team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/tasks">Create task</Link></Button>
          <Button asChild><Link to="/queries" search={{ status: "New" }}>Assign new queries <ArrowRight /></Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} onClick={() => navigate({ to: "/queries", search: { status: s.status } })} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Priority & attention required" description="Matters that need your decision today" className="xl:col-span-2" bodyClass="p-0">
          <div className="flex flex-wrap gap-1.5 border-b px-5 py-3">
            {attention.map((a) => (
              <button key={a.label} onClick={() => setAttTab(a.label)}
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition", attTab === a.label ? "border-navy bg-navy text-primary-foreground" : "hover:bg-muted")}>
                {a.label}
                <span className={cn("rounded-full px-1.5 text-[10px] font-bold", attTab === a.label ? "bg-primary-foreground/20" : a.tone === "bad" ? "bg-destructive/10 text-destructive" : a.tone === "warn" ? "bg-warning/20" : "bg-info/10 text-info")}>{a.items.length}</span>
              </button>
            ))}
          </div>
          <ul className="divide-y">
            {attItems.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing here — all clear.</li>}
            {attItems.slice(0, 5).map((q) => {
              const emp = employees.find((e) => e.id === q.assigneeId);
              const du = daysUntil(q.dueAt);
              return (
                <li key={q.ref}>
                  <Link to="/queries/$ref" params={{ ref: q.ref }} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{q.ref}</span><PriorityBadge priority={q.priority} /></div>
                      <div className="truncate text-sm font-semibold text-navy">{q.subject}</div>
                      <div className="text-xs text-muted-foreground">{q.client.name} · {q.client.project}</div>
                    </div>
                    <div className="hidden text-right text-xs sm:block">
                      <div className={cn("font-semibold", du < 0 ? "text-destructive" : du <= 1 ? "text-warning" : "text-muted-foreground")}>{du < 0 ? `${-du}d overdue` : du === 0 ? "Due today" : `Due in ${du}d`}</div>
                      <div className="text-muted-foreground">{emp ? emp.name : <span className="font-semibold text-info">Unassigned</span>}</div>
                    </div>
                    <StatusBadge status={q.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Recent department activity" actions={<Link to="/notifications" className="text-xs font-semibold text-primary">View all</Link>} bodyClass="p-0">
          <ul className="max-h-[340px] divide-y overflow-y-auto">
            {activity.slice(0, 8).map((a) => {
              const Icon = activityIcon[a.kind];
              const isQ = a.target?.startsWith("GG-QRY");
              return (
                <li key={a.id} className="flex gap-3 px-5 py-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-navy"><Icon className="size-3.5" /></span>
                  <div className="min-w-0 text-sm">
                    <p className="leading-snug"><span className="font-semibold text-navy">{a.actor}</span> {a.action}{" "}
                      {a.target && (isQ ? <Link to="/queries/$ref" params={{ ref: a.target }} className="font-medium text-primary hover:underline">#{a.target}</Link> : <span className="font-medium">{a.target}</span>)}</p>
                    <p className="text-[11px] text-muted-foreground">{relTime(a.at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Department workload" description="Current query status distribution">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                  {dist.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {dist.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: d.fill }} />{d.name}</span>
                <span className="font-semibold text-navy">{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Query trends" description="Received, resolved and still pending" className="xl:col-span-2"
          actions={<Tabs value={range} onValueChange={setRange}><TabsList className="h-8"><TabsTrigger value="7" className="text-xs">7 days</TabsTrigger><TabsTrigger value="30" className="text-xs">30 days</TabsTrigger><TabsTrigger value="90" className="text-xs">90 days</TabsTrigger></TabsList></Tabs>}>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.navy} stopOpacity={0.25} /><stop offset="100%" stopColor={chartColors.navy} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.teal} stopOpacity={0.3} /><stop offset="100%" stopColor={chartColors.teal} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="received" name="Received" stroke={chartColors.navy} fill="url(#gR)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke={chartColors.teal} fill="url(#gS)" strokeWidth={2} />
                <Area type="monotone" dataKey="pending" name="Pending" stroke={chartColors.warn} fill="none" strokeWidth={2} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Panel title="Employee performance overview" className="min-w-0 xl:col-span-2" bodyClass="p-0"
          actions={<Link to="/employees" className="text-xs font-semibold text-primary">All employees</Link>}>
          <ul className="divide-y md:hidden">
            {employees.map((e) => {
              const s = employeeStats(e.id, queries, tasks);
              const metrics = [
                { label: "Assigned", value: s.assigned, className: "text-navy" },
                { label: "Completed", value: s.resolved, className: "text-success" },
                { label: "Pending", value: s.open, className: "text-navy" },
                { label: "Overdue", value: s.tasksOverdue, className: s.tasksOverdue ? "text-destructive" : "text-muted-foreground" },
              ];
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => navigate({ to: "/employees/$id", params: { id: e.id } })} className="w-full px-4 py-3 text-left hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <PersonAvatar initials={e.initials} availability={e.availability} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-navy">{e.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{e.designation}</div>
                      </div>
                      <AvailabilityBadge a={e.availability} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      {metrics.map((m) => (
                        <div key={m.label} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
                          <dt className="text-[11px] font-medium text-muted-foreground">{m.label}</dt>
                          <dd className={cn("text-sm font-semibold tabular-nums", m.className)}>{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-2.5 font-semibold">Employee</th><th className="px-3 font-semibold">Assigned</th><th className="px-3 font-semibold">Completed</th><th className="px-3 font-semibold">Pending</th><th className="px-3 font-semibold">Overdue tasks</th><th className="px-5 font-semibold">Status</th></tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((e) => {
                  const s = employeeStats(e.id, queries, tasks);
                  return (
                    <tr key={e.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate({ to: "/employees/$id", params: { id: e.id } })}>
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><PersonAvatar initials={e.initials} availability={e.availability} size="sm" /><div><div className="font-semibold text-navy">{e.name}</div><div className="text-xs text-muted-foreground">{e.designation}</div></div></div></td>
                      <td className="px-3 font-semibold text-navy">{s.assigned}</td>
                      <td className="px-3 text-success">{s.resolved}</td>
                      <td className="px-3">{s.open}</td>
                      <td className={cn("px-3", s.tasksOverdue ? "font-semibold text-destructive" : "text-muted-foreground")}>{s.tasksOverdue}</td>
                      <td className="px-5"><AvailabilityBadge a={e.availability} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Open queries by category" className="min-w-0">
          <CategoryBreakdown data={byCategory} />
        </Panel>
      </div>

      <WorkflowStrip />
    </div>
  );
}
