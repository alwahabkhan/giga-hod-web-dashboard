import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Inbox, CheckCircle2, Clock, AlertTriangle, Timer, Reply, ListChecks, Users } from "lucide-react";
import { useHod, employeeStats } from "@/lib/hod-store";
import { PageHeader, Panel, StatCard, chartColors, tooltipStyle } from "@/components/hod/ui-bits";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trendSeries } from "./index";

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Department Performance · Giga Group HOD" }, { name: "description", content: "Finance department analytics and employee performance." }, { property: "og:title", content: "Department Performance · Giga Group HOD" }, { property: "og:description", content: "Department analytics." }] }),
  component: Perf,
});

function Perf() {
  const { queries, tasks, employees } = useHod();
  const [range, setRange] = useState("30");
  const trend = useMemo(() => trendSeries(Number(range)), [range]);
  const c = (s: string[]) => queries.filter((q) => s.includes(q.status)).length;
  const rows = employees.map((e) => ({ e, s: employeeStats(e.id, queries, tasks) }));
  const status = [{ n: "New", v: c(["New"]), f: chartColors.info }, { n: "Pending", v: c(["Pending"]), f: chartColors.warn }, { n: "In Progress", v: c(["In Progress", "Awaiting Response"]), f: chartColors.teal }, { n: "Resolved", v: c(["Resolved", "Closed"]), f: chartColors.ok }, { n: "Overdue", v: c(["Overdue"]), f: chartColors.bad }];
  const done = tasks.filter((t) => t.status === "Completed").length;
  return (
    <div className="space-y-6">
      <PageHeader title="Department Performance" description="Illustrative demo metrics. Scoring formulas are configurable and imply no official targets."
        actions={<Tabs value={range} onValueChange={setRange}><TabsList><TabsTrigger value="7">This week</TabsTrigger><TabsTrigger value="30">This month</TabsTrigger><TabsTrigger value="90">Last 3 months</TabsTrigger></TabsList></Tabs>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Queries received" value={trend.reduce((a, b) => a + b.received, 0)} icon={Inbox} tone="navy" /><StatCard label="Queries resolved" value={trend.reduce((a, b) => a + b.resolved, 0)} icon={CheckCircle2} tone="ok" />
        <StatCard label="Pending" value={c(["Pending", "New", "In Progress", "Awaiting Response"])} icon={Clock} tone="warn" /><StatCard label="Overdue" value={c(["Overdue"])} icon={AlertTriangle} tone="bad" />
        <StatCard label="Avg resolution time" value="2.4 days" icon={Timer} /><StatCard label="Avg first response" value="3.1 h" icon={Reply} tone="info" />
        <StatCard label="Task completion" value={`${Math.round((done / tasks.length) * 100)}%`} icon={ListChecks} tone="ok" /><StatCard label="Team members" value={employees.length} icon={Users} tone="navy" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Received vs resolved"><div className="h-64"><ResponsiveContainer><BarChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="received" name="Received" fill={chartColors.navy} /><Bar dataKey="resolved" name="Resolved" fill={chartColors.teal} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Status distribution"><div className="h-64"><ResponsiveContainer><PieChart><Pie data={status} dataKey="v" nameKey="n" innerRadius={55} outerRadius={90}>{status.map((s) => <Cell key={s.n} fill={s.f} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer></div></Panel>
        <Panel title="Resolution & overdue trend"><div className="h-64"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} /><Line dataKey="resolved" name="Resolved" stroke={chartColors.teal} dot={false} strokeWidth={2} /><Line dataKey="pending" name="Overdue/pending" stroke={chartColors.bad} dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div></Panel>
        <Panel title="Employee comparison & workload"><div className="h-64"><ResponsiveContainer><BarChart data={rows.map(({ e, s }) => ({ name: e.name.split(" ")[0], Resolved: s.resolved, Open: s.open, Tasks: s.tasksCompleted }))}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Resolved" fill={chartColors.ok} /><Bar dataKey="Open" fill={chartColors.warn} /><Bar dataKey="Tasks" fill={chartColors.navy} /></BarChart></ResponsiveContainer></div></Panel>
      </div>
      <Panel title="Employee performance" bodyClass="p-0"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground"><tr>{["Employee", "Assigned", "Resolved", "Pending", "Overdue", "Completed tasks", "Resolution rate"].map((h) => <th key={h} className="px-4 py-2.5">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{rows.map(({ e, s }) => <tr key={e.id}><td className="px-4 py-2.5 font-semibold text-navy">{e.name}</td><td className="px-4">{s.assigned}</td><td className="px-4">{s.resolved}</td><td className="px-4">{s.open}</td><td className="px-4">{s.overdue}</td><td className="px-4">{s.tasksCompleted}</td><td className="px-4">{s.assigned ? Math.round((s.resolved / s.assigned) * 100) : 0}%</td></tr>)}</tbody></table></Panel>
    </div>
  );
}
