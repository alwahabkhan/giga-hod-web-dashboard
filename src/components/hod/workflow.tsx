import { Smartphone, Route, Eye, UserPlus, FileSearch, PenLine, ArrowRightLeft, HandCoins, CheckCircle2 } from "lucide-react";
import { Panel } from "./ui-bits";

const STEPS = [
  { icon: Smartphone, title: "Client submits", text: "Query raised in Client Mobile App", dept: "Client" },
  { icon: Route, title: "Routed", text: "Auto-routed to Finance", dept: "System" },
  { icon: Eye, title: "HOD reviews", text: "Incoming query triaged", dept: "Finance HOD" },
  { icon: UserPlus, title: "Assigned", text: "Given to a Finance employee", dept: "Finance HOD" },
  { icon: FileSearch, title: "Verification", text: "Receipt checked vs records", dept: "Finance" },
  { icon: PenLine, title: "Update", text: "Verification result recorded", dept: "Finance" },
  { icon: ArrowRightLeft, title: "Clarification", text: "Optional transfer to Customer Care", dept: "Customer Care", optional: true },
  { icon: HandCoins, title: "Follow-up", text: "Optional Recovery involvement", dept: "Recovery", optional: true },
  { icon: CheckCircle2, title: "Resolved", text: "History retained, client updated", dept: "Client" },
];

export function WorkflowStrip() {
  return (
    <Panel title="Departmental workflow · Payment receipt verification" description="Illustrative flow. Not every query passes through every department; transfers are permission-based and keep the original reference.">
      <ol className="grid grid-cols-3 gap-3 md:grid-cols-5 xl:grid-cols-9">
        {STEPS.map((s, i) => (
          <li key={s.title} className={`relative rounded-lg border p-3 ${s.optional ? "border-dashed bg-muted/30" : "bg-card"}`}>
            <div className="flex items-center justify-between">
              <span className={`grid size-7 place-items-center rounded-md ${s.optional ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}><s.icon className="size-3.5" /></span>
              <span className="text-[10px] font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-navy">{s.title}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.text}</div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{s.dept}</div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
