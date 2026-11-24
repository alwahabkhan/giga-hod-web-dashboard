import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Database, Info, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountStatus, AdminStatus, CaseStatus, InstallmentStatus, Priority } from "@/lib/gg/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

const pill = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold";
const ST: Record<CaseStatus, string> = {
  New: "bg-st-new/12 text-st-new", Assigned: "bg-st-assigned/12 text-st-assigned", "In Progress": "bg-st-progress/12 text-st-progress",
  "Waiting on Client": "bg-st-waiting/15 text-st-waiting", "Handed Off": "bg-st-handoff/12 text-st-handoff", Resolved: "bg-st-resolved/12 text-st-resolved",
  Closed: "bg-st-closed/15 text-st-closed", Reopened: "bg-st-reopened/12 text-st-reopened",
};
export const StatusBadge = ({ s }: { s: CaseStatus }) => <span className={cn(pill, ST[s])}><span className="size-1.5 rounded-full bg-current" />{s}</span>;
const PR: Record<Priority, string> = { Low: "bg-st-closed/15 text-st-closed", Normal: "bg-st-new/12 text-st-new", High: "bg-st-reopened/12 text-st-reopened", Urgent: "bg-destructive/12 text-destructive" };
export const PriorityBadge = ({ p }: { p: Priority }) => <span className={cn(pill, PR[p])}>{p}</span>;
export function SlaBadge({ s }: { s: "Met" | "Breached" | "Due soon" | "On track" }) {
  const c = s === "Breached" ? "bg-destructive/12 text-destructive" : s === "Due soon" ? "bg-st-waiting/15 text-st-waiting" : "bg-st-resolved/12 text-st-resolved";
  return <span className={cn(pill, c)}>{s}</span>;
}
export function AccountBadge({ s }: { s: AccountStatus | AdminStatus | "Active" | "Inactive" | "No account" }) {
  const c = s === "Verified" || s === "Active" ? "bg-st-resolved/12 text-st-resolved" : s === "Pending" || s === "Invited" ? "bg-st-waiting/15 text-st-waiting" : s === "No account" || s === "Inactive" ? "bg-st-closed/15 text-st-closed" : "bg-destructive/12 text-destructive";
  return <span className={cn(pill, c)}>{s}</span>;
}
export function InstBadge({ s }: { s: InstallmentStatus }) {
  const c = s === "Paid" ? "bg-st-resolved/12 text-st-resolved" : s === "Partly Paid" ? "bg-st-waiting/15 text-st-waiting" : s === "Unpaid" ? "bg-destructive/12 text-destructive" : "bg-st-new/12 text-st-new";
  return <span className={cn(pill, c)}>{s}</span>;
}
export const CrmTag = () => <span className="inline-flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><Database className="size-3" />From CRM (Read-only)</span>;
export const ChequeNote = () => <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"><Info className="size-3.5 shrink-0" />Cheque clearance status is not tracked in the CRM.</div>;

export type Crumb = { label: string; to?: string };
export function PageHeader({ title, crumbs, subtitle, actions, crm }: { title: string; crumbs: Crumb[]; subtitle?: ReactNode; actions?: ReactNode; crm?: boolean }) {
  return (
    <div className="mb-5 space-y-2">
      <Breadcrumb><BreadcrumbList className="text-xs">
        {crumbs.map((c, i) => (
          <span key={i} className="contents">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>{c.to && i < crumbs.length - 1 ? <BreadcrumbLink asChild><Link to={c.to}>{c.label}</Link></BreadcrumbLink> : <BreadcrumbPage>{c.label}</BreadcrumbPage>}</BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList></Breadcrumb>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight">{title}{crm && <CrmTag />}</h1>{subtitle && <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>}</div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
export function Panel({ title, actions, children, className, crm }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; crm?: boolean }) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-[var(--shadow-card)]", className)}>
      {(title || actions) && <div className="flex items-center justify-between gap-2 border-b px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold">{title}{crm && <CrmTag />}</h2>{actions}</div>}
      <div className="p-4">{children}</div>
    </section>
  );
}
export function Kpi({ label, value, hint, icon, tone = "default", to, search }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "default" | "danger" | "warning" | "primary"; to?: string; search?: Record<string, string> }) {
  const body = (
    <div className={cn("h-full rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] transition-colors", to && "hover:border-primary/50")}>
      <div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className={cn("grid size-8 place-items-center rounded-md", tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-st-waiting/15 text-st-waiting" : "bg-primary/10 text-primary")}>{icon}</span>}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} search={search as never} className="block">{body}</Link> : body;
}
export function Empty({ title = "Nothing here", hint }: { title?: string; hint?: string }) {
  return <div className="flex flex-col items-center justify-center gap-2 py-12 text-center"><Inbox className="size-8 text-muted-foreground/60" /><div className="text-sm font-medium">{title}</div>{hint && <div className="text-xs text-muted-foreground">{hint}</div>}</div>;
}
export function Confirm({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, onConfirm, children, disabled }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel?: string; destructive?: boolean; onConfirm: () => void; children?: ReactNode; disabled?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription></AlertDialogHeader>
        {children}
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={disabled} className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")} onClick={(e) => { if (disabled) { e.preventDefault(); return; } onConfirm(); }}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function Field({ label, required, error, children, hint }: { label: string; required?: boolean; error?: string | undefined; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}{required && <span className="ml-0.5 text-destructive">*</span>}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
export const Initials = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary", className)}>{name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
);
export function DL({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">{items.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium">{v}</dd></div>)}</dl>;
}
