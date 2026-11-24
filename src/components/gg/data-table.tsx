import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Download, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv } from "@/lib/gg/format";
import { Empty } from "./bits";
import { cn } from "@/lib/utils";

export type Col<T> = { key: string; header: string; cell: (r: T) => ReactNode; sort?: (r: T) => string | number; csv?: (r: T) => string | number; hidden?: boolean; className?: string; align?: "right" };

export function DataTable<T>({ rows, columns, rowKey, search, searchPlaceholder = "Search…", toolbar, onRowClick, exportName, pageSize = 15, selectable, bulk, initialSort, emptyTitle = "No records found", emptyHint = "Try changing the search or filters." }: {
  rows: T[]; columns: Col<T>[]; rowKey: (r: T) => string; search?: (r: T) => string; searchPlaceholder?: string; toolbar?: ReactNode;
  onRowClick?: (r: T) => void; exportName?: string; pageSize?: number; selectable?: boolean; bulk?: (ids: string[], clear: () => void) => ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" }; emptyTitle?: string; emptyHint?: string;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.hidden).map((c) => c.key)));
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 250); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = t && search ? rows.filter((x) => search(x).toLowerCase().includes(t)) : rows;
    if (sort) { const c = columns.find((x) => x.key === sort.key); if (c?.sort) { const f = c.sort; r = [...r].sort((a, b) => { const va = f(a), vb = f(b); const d = va < vb ? -1 : va > vb ? 1 : 0; return sort.dir === "asc" ? d : -d; }); } }
    return r;
  }, [rows, q, sort, columns, search]);
  useEffect(() => setPage(0), [q, rows.length]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const view = filtered.slice(page * size, page * size + size);
  const vis = columns.filter((c) => !hidden.has(c.key));
  const allSel = view.length > 0 && view.every((r) => sel.has(rowKey(r)));

  const exportCsv = () => {
    const cols = vis;
    downloadCsv(exportName ?? "export", [cols.map((c) => c.header), ...filtered.map((r) => cols.map((c) => (c.csv ? c.csv(r) : c.sort ? c.sort(r) : "")))]);
  };

  return (
    <div className="rounded-lg border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        {search && <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-9 pl-8" aria-label="Search table" /></div>}
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {selectable && sel.size > 0 && bulk?.([...sel], () => setSel(new Set()))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Columns3 /> Columns</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuLabel>Visible columns</DropdownMenuLabel><DropdownMenuSeparator />
              {columns.map((c) => <DropdownMenuCheckboxItem key={c.key} checked={!hidden.has(c.key)} onSelect={(e) => e.preventDefault()} onCheckedChange={(v) => setHidden((h) => { const n = new Set(h); if (v) n.delete(c.key); else n.add(c.key); return n; })}>{c.header}</DropdownMenuCheckboxItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          {exportName && <Button variant="outline" size="sm" onClick={exportCsv}><Download /> Export CSV</Button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
            {selectable && <TableHead className="w-10"><Checkbox checked={allSel} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); view.forEach((r) => (v ? n.add(rowKey(r)) : n.delete(rowKey(r)))); return n; })} aria-label="Select page" /></TableHead>}
            {vis.map((c) => (
              <TableHead key={c.key} className={cn("whitespace-nowrap text-xs", c.align === "right" && "text-right")}>
                {c.sort ? <button className={cn("inline-flex items-center gap-1 font-semibold hover:text-foreground", c.align === "right" && "flex-row-reverse")} onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" }))}>
                  {c.header}{sort?.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}</button> : <span className="font-semibold">{c.header}</span>}
              </TableHead>
            ))}
          </TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{selectable && <TableCell />}{vis.map((c) => <TableCell key={c.key}><Skeleton className="h-4 w-full max-w-32" /></TableCell>)}</TableRow>)
              : view.length === 0 ? <TableRow><TableCell colSpan={vis.length + (selectable ? 1 : 0)}><Empty title={emptyTitle} hint={emptyHint} /></TableCell></TableRow>
              : view.map((r) => { const k = rowKey(r); return (
                <TableRow key={k} className={cn(onRowClick && "cursor-pointer")} onClick={() => onRowClick?.(r)} data-state={sel.has(k) ? "selected" : undefined}>
                  {selectable && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={sel.has(k)} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); if (v) n.add(k); else n.delete(k); return n; })} aria-label="Select row" /></TableCell>}
                  {vis.map((c) => <TableCell key={c.key} className={cn("text-sm", c.align === "right" && "text-right tabular-nums", c.className)}>{c.cell(r)}</TableCell>)}
                </TableRow>); })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>{filtered.length === 0 ? "0 records" : `${page * size + 1}–${Math.min(filtered.length, (page + 1) * size)} of ${filtered.length}`}{selectable && sel.size > 0 && ` · ${sel.size} selected`}</span>
        <div className="flex items-center gap-2">
          <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}><SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger><SelectContent>{[10, 15, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
          <span>Page {page + 1} / {pages}</span>
          <Button variant="outline" size="icon" className="size-8" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight /></Button>
        </div>
      </div>
    </div>
  );
}
