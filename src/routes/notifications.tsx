import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useHod } from "@/lib/hod-store";
import { PageHeader, Panel } from "@/components/hod/ui-bits";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Notifications · Giga Group HOD" }, { name: "description", content: "Department alerts and updates." }, { property: "og:title", content: "Notifications · Giga Group HOD" }, { property: "og:description", content: "HOD notification center." }] }),
  component: Notifs,
});

function Notifs() {
  const { notifications, markNotification, markAllNotificationsRead } = useHod();
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Notification Center" actions={<Button variant="outline" onClick={markAllNotificationsRead}>Mark all as read</Button>} />
      <Panel bodyClass="p-0"><ul className="divide-y">{notifications.map((n) => (
        <li key={n.id} className={`flex items-center gap-4 px-5 py-3 ${n.read ? "" : "bg-primary/5"}`}>
          <span className={`size-2 rounded-full ${n.read ? "bg-border" : "bg-primary"}`} />
          <button className="flex-1 text-left" onClick={() => { markNotification(n.id, true);
            if (n.link.to === "/queries/$ref") navigate({ to: "/queries/$ref", params: { ref: n.link.ref } });
            else if (n.link.to === "/employees/$id") navigate({ to: "/employees/$id", params: { id: n.link.id } });
            else navigate({ to: "/tasks" }); }}>
            <div className="text-sm font-semibold text-navy">{n.title}</div><div className="text-xs text-muted-foreground">{n.description}</div></button>
          <span className="text-xs text-muted-foreground">{fmtDateTime(n.at)}</span>
          <Button variant="ghost" size="sm" onClick={() => markNotification(n.id, !n.read)}>{n.read ? "Mark unread" : "Mark read"}</Button>
        </li>))}</ul></Panel>
    </div>
  );
}
