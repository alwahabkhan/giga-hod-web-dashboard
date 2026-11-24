import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHod, employeeStats } from "@/lib/hod-store";
import { PageHeader, Panel, PersonAvatar, chartColors, tooltipStyle } from "@/components/hod/ui-bits";
import { AvailabilityBadge } from "@/components/hod/badges";

export const Route = createFileRoute("/employees/")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Employee Management · Giga Group HOD" }, { name: "description", content: "Finance team directory, availability and workload." }, { property: "og:title", content: "Employee Management · Giga Group HOD" }, { property: "og:description", content: "Department employee workload." }] }),
  component: Employees,
});

function Employees() {
  const { employees, queries, tasks } = useHod();
  const navigate = useNavigate();
  const data = employees.map((e) => ({ e, s: employeeStats(e.id, queries, tasks) }));
  return (
    <div className="space-y-6">
      <PageHeader title="Employee Management" description="Supervise your department's team. Organisation-wide accounts are managed by Central Admin." />
      <Panel title="Employee workload" description="Compare open work to distribute new queries fairly">
        <div className="h-64"><ResponsiveContainer><BarChart data={data.map(({ e, s }) => ({ name: e.name, Open: s.open - s.overdue, Overdue: s.overdue, "Pending tasks": s.tasksPending }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Open" stackId="a" fill={chartColors.teal} /><Bar dataKey="Overdue" stackId="a" fill={chartColors.bad} radius={[4, 4, 0, 0]} /><Bar dataKey="Pending tasks" fill={chartColors.navy} radius={[4, 4, 0, 0]} />
        </BarChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="Directory" bodyClass="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground"><tr>{["Employee", "ID", "Email", "Contact", "Status", "Assigned queries", "Pending tasks", "Completed tasks", "Performance"].map((h) => <th key={h} className="px-4 py-2.5">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{data.map(({ e, s }) => { const perf = s.assigned ? Math.round((s.resolved / s.assigned) * 100) : 0; return (
          <tr key={e.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate({ to: "/employees/$id", params: { id: e.id } })}>
            <td className="px-4 py-3"><div className="flex items-center gap-3"><PersonAvatar initials={e.initials} availability={e.availability} /><div><div className="font-semibold text-navy">{e.name}</div><div className="text-xs text-muted-foreground">{e.designation}</div></div></div></td>
            <td className="px-4 font-mono text-xs">{e.id}</td><td className="px-4 text-xs">{e.email}</td><td className="px-4 text-xs">{e.phone}</td><td className="px-4"><AvailabilityBadge a={e.availability} /></td>
            <td className="px-4">{s.assigned}</td><td className="px-4">{s.tasksPending}</td><td className="px-4">{s.tasksCompleted}</td>
            <td className="px-4"><div className="h-1.5 w-20 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${perf}%` }} /></div><span className="text-xs">{perf}% resolved</span></td>
          </tr>); })}</tbody></table></div></Panel>
    </div>
  );
}
