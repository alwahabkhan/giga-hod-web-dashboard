import { cn } from "@/lib/utils";
import type { Availability, Priority, QueryStatus, TaskStatus } from "@/lib/hod-data";

const tone = {
  teal: "bg-primary/10 text-primary ring-primary/20",
  info: "bg-info/10 text-info ring-info/20",
  warn: "bg-warning/15 text-foreground ring-warning/30",
  ok: "bg-success/10 text-success ring-success/20",
  bad: "bg-destructive/10 text-destructive ring-destructive/20",
  muted: "bg-muted text-muted-foreground ring-border",
  navy: "bg-navy/10 text-navy ring-navy/20",
};
const dot = { teal: "bg-primary", info: "bg-info", warn: "bg-warning", ok: "bg-success", bad: "bg-destructive", muted: "bg-muted-foreground", navy: "bg-navy" };
type Tone = keyof typeof tone;

function Pill({ t, children, className }: { t: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", tone[t], className)}>
      <span className={cn("size-1.5 rounded-full", dot[t])} />
      {children}
    </span>
  );
}

const qTone: Record<QueryStatus, Tone> = { New: "info", Pending: "warn", "In Progress": "teal", "Awaiting Response": "navy", Resolved: "ok", Closed: "muted", Overdue: "bad" };
export const StatusBadge = ({ status }: { status: QueryStatus }) => <Pill t={qTone[status]}>{status}</Pill>;

const tTone: Record<TaskStatus, Tone> = { "To Do": "info", "In Progress": "teal", Completed: "ok", Overdue: "bad", "On Hold": "muted" };
export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => <Pill t={tTone[status]}>{status}</Pill>;

const pTone: Record<Priority, Tone> = { High: "bad", Medium: "warn", Low: "muted" };
export const PriorityBadge = ({ priority }: { priority: Priority }) => <Pill t={pTone[priority]}>{priority}</Pill>;

const aTone: Record<Availability, Tone> = { Available: "ok", Busy: "bad", Away: "warn", Offline: "muted" };
export const AvailabilityBadge = ({ a }: { a: Availability }) => <Pill t={aTone[a]}>{a}</Pill>;
export const availabilityDot = (a: Availability) => dot[aTone[a]];
