import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, FilterX, Inbox, MoreHorizontal, Search, UserPlus } from "lucide-react";
import { useHod } from "@/lib/hod-store";
import { PRIORITIES, QUERY_CATEGORIES, QUERY_STATUSES, type Query, type QueryStatus } from "@/lib/hod-data";
import { daysUntil, fmtDate } from "@/lib/format";
import { PageHeader, EmptyState, PersonAvatar } from "@/components/hod/ui-bits";
import { PriorityBadge, StatusBadge } from "@/components/hod/badges";
import { AssignmentDialog } from "@/components/hod/query-dialogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface QSearch { q?: string | undefined; status?: QueryStatus | undefined }

export const Route = createFileRoute("/queries/")({
  validateSearch: (s: Record<string, unknown>): QSearch => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    status: QUERY_STATUSES.includes(s["status"] as QueryStatus) ? (s["status"] as QueryStatus) : undefined,
  }),
  head: () => ({
    meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, 
      { title: "Query Management · Giga Group HOD" },
      { name: "description", content: "Monitor, filter, assign and escalate all Finance department client queries." },
      { property: "og:title", content: "Query Management · Giga Group HOD" },
      { property: "og:description", content: "Department query management for Giga Group HODs." },
    ],
  }),
  component: QueriesPage,
});

type SortKey = "ref" | "client" | "priority" | "submittedAt" | "updatedAt" | "dueAt" | "status";
const PRI_ORDER = { High: 0, Medium: 1, Low: 2 };
const PAGE = 10;

function QueriesPage() {
  const { queries, employees } = useHod();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/queries/" });
  const [employee, setEmployee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "submittedAt", dir: -1 });
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<Query | null>(null);
  const q = search.q ?? "";
  const status = search.status ?? "all";

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    const r = queries.filter((x) =>
      (!term || x.ref.toLowerCase().includes(term) || x.client.name.toLowerCase().includes(term) || x.subject.toLowerCase().includes(term)) &&
      (status === "all" || x.status === status || (status === "Resolved" && x.status === "Closed" && false)) &&
      (employee === "all" || (employee === "none" ? !x.assigneeId : x.assigneeId === employee)) &&
      (priority === "all" || x.priority === priority) &&
      (category === "all" || x.category === category) &&
      (!from || x.submittedAt.slice(0, 10) >= from) && (!to || x.submittedAt.slice(0, 10) <= to) &&
      (!overdueOnly || x.status === "Overdue" || (daysUntil(x.dueAt) < 0 && !["Resolved", "Closed"].includes(x.status))));
    return r.sort((a, b) => {
      const k = sort.key;
      const va = k === "client" ? a.client.name : k === "priority" ? PRI_ORDER[a.priority] : a[k];
      const vb = k === "client" ? b.client.name : k === "priority" ? PRI_ORDER[b.priority] : b[k];
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [queries, q, status, employee, priority, category, from, to, overdueOnly, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const setSearch = (patch: Partial<QSearch>) => { setPage(1); navigate({ search: (s) => ({ ...s, ...patch }) }); };
  const clear = () => { setEmployee("all"); setPriority("all"); setCategory("all"); setFrom(""); setTo(""); setOverdueOnly(false); setPage(1); navigate({ search: {} }); };
  const Th = ({ k, children, className }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cn("whitespace-nowrap px-3 py-2.5 font-semibold", className)}>
      {k ? <button className="inline-flex items-center gap-1 hover:text-navy" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : 1 }))}>
        {children}<ArrowDownUp className={cn("size-3", sort.key === k ? "text-primary" : "opacity-40")} /></button> : children}
    </th>
  );

  return (
    <div>
      <PageHeader title="Query Management" description="All client queries routed to the Finance department." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...QUERY_STATUSES] as const).map((s) => {
          const n = s === "all" ? queries.length : queries.filter((x) => x.status === s).length;
          return (
            <button key={s} onClick={() => setSearch({ status: s === "all" ? undefined : s })}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", status === s ? "border-navy bg-navy text-primary-foreground" : "bg-card hover:bg-muted")}>
              {s === "all" ? "All" : s} <span className="ml-1 opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setSearch({ q: e.target.value || undefined })} placeholder="Search reference, client or subject" className="h-9 pl-9" />
          </div>
          <Select value={employee} onValueChange={(v) => { setEmployee(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Employee" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All employees</SelectItem><SelectItem value="none">Unassigned</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All priorities</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{QUERY_CATEGORIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" aria-label="From date" />–
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" aria-label="To date" />
          </div>
          <label className="flex items-center gap-2 px-1 text-xs font-medium"><Switch checked={overdueOnly} onCheckedChange={setOverdueOnly} />Overdue only</label>
          <Button variant="ghost" size="sm" onClick={clear}><FilterX /> Clear</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th k="ref" className="pl-5">Reference</Th><Th k="client">Client</Th><Th>Project / Account</Th><Th>Subject</Th><Th>Category</Th>
                <Th k="priority">Priority</Th><Th>Assigned</Th><Th k="submittedAt">Submitted</Th><Th k="updatedAt">Updated</Th><Th k="dueAt">Due</Th><Th k="status">Status</Th><Th className="pr-5 text-right">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((x) => {
                const emp = employees.find((e) => e.id === x.assigneeId);
                const du = daysUntil(x.dueAt);
                const open = !["Resolved", "Closed"].includes(x.status);
                return (
                  <tr key={x.ref} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap py-3 pl-5 pr-3"><Link to="/queries/$ref" params={{ ref: x.ref }} className="font-mono text-xs font-semibold text-primary hover:underline">{x.ref}</Link>{x.escalated && <span className="ml-1.5 rounded bg-destructive/10 px-1 text-[10px] font-bold text-destructive">ESC</span>}</td>
                    <td className="whitespace-nowrap px-3 font-medium text-navy">{x.client.name}</td>
                    <td className="px-3 text-xs text-muted-foreground"><div className="whitespace-nowrap">{x.client.project}</div><div className="max-w-40 truncate">{x.client.account}</div></td>
                    <td className="max-w-56 truncate px-3">{x.subject}</td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{x.category}</td>
                    <td className="px-3"><PriorityBadge priority={x.priority} /></td>
                    <td className="whitespace-nowrap px-3">{emp ? <span className="flex items-center gap-2"><PersonAvatar initials={emp.initials} size="sm" />{emp.name}</span> : <span className="text-xs font-semibold text-info">Unassigned</span>}</td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{fmtDate(x.submittedAt)}</td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{fmtDate(x.updatedAt)}</td>
                    <td className={cn("whitespace-nowrap px-3 text-xs", open && du < 0 ? "font-semibold text-destructive" : open && du <= 1 ? "font-semibold text-warning" : "text-muted-foreground")}>{fmtDate(x.dueAt)}</td>
                    <td className="px-3"><StatusBadge status={x.status} /></td>
                    <td className="whitespace-nowrap py-2 pl-3 pr-5 text-right">
                      {!x.assigneeId ? <Button size="sm" className="h-7" onClick={() => setAssigning(x)}><UserPlus /> Assign</Button> : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7" aria-label="Query actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate({ to: "/queries/$ref", params: { ref: x.ref } })}>Open details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAssigning(x)}>Reassign</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && <EmptyState icon={Inbox} title="No queries match these filters" text="Try clearing filters or adjusting the date range." />}
        </div>
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
          <span>Showing {rows.length ? (cur - 1) * PAGE + 1 : 0}–{Math.min(cur * PAGE, rows.length)} of {rows.length} queries</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            {Array.from({ length: pages }, (_, i) => (
              <Button key={i} variant={cur === i + 1 ? "default" : "ghost"} size="icon" className="size-8" onClick={() => setPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button variant="outline" size="icon" className="size-8" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      </div>
      {assigning && <AssignmentDialog key={assigning.ref} query={assigning} open onOpenChange={(o) => !o && setAssigning(null)} />}
    </div>
  );
}
