import { cn } from "@/lib/utils";
import { availabilityDot } from "./badges";
import type { Availability } from "@/lib/hod-data";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClass }: {
  title?: ReactNode; description?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-navy">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "teal", delta, onClick, hint }: {
  label: string; value: ReactNode; icon: LucideIcon; tone?: "teal" | "info" | "warn" | "ok" | "bad" | "navy";
  delta?: number; onClick?: () => void; hint?: string;
}) {
  const tones = {
    teal: "bg-primary/10 text-primary", info: "bg-info/10 text-info", warn: "bg-warning/15 text-warning",
    ok: "bg-success/10 text-success", bad: "bg-destructive/10 text-destructive", navy: "bg-navy/10 text-navy",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("group flex flex-col rounded-xl border bg-card p-4 text-left shadow-card transition", onClick && "hover:border-primary/40 hover:shadow-md")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}><Icon className="size-4" /></span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-navy">{value}</div>
      <div className="mt-1 h-4 text-[11px] text-muted-foreground">
        {delta !== undefined ? (
          <span className={cn("font-semibold", delta > 0 ? (tone === "bad" ? "text-destructive" : "text-success") : delta < 0 ? (tone === "bad" ? "text-success" : "text-destructive") : "")}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}%
          </span>
        ) : null}{" "}
        {hint ?? (delta !== undefined ? "vs last period" : "")}
      </div>
    </Comp>
  );
}

export function PersonAvatar({ initials, availability, size = "md" }: { initials: string; availability?: Availability; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-16 text-lg" }[size];
  return (
    <span className="relative inline-flex shrink-0">
      <span className={cn("grid place-items-center rounded-full bg-navy font-semibold text-primary-foreground", s)}>{initials}</span>
      {availability && <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card", availabilityDot(availability))} />}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <p className="mt-3 text-sm font-semibold text-navy">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}

export const chartColors = {
  teal: "var(--chart-1)", navy: "var(--chart-2)", warn: "var(--chart-3)", ok: "var(--chart-4)", bad: "var(--chart-5)", info: "var(--info)", muted: "var(--muted-foreground)",
};
export const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" };
