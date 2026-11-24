import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { useHod, PERMISSIONS } from "@/lib/hod-store";
import { PageHeader, Panel, PersonAvatar } from "@/components/hod/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Settings · Giga Group HOD" }, { name: "description", content: "HOD profile and preferences." }, { property: "og:title", content: "Settings · Giga Group HOD" }, { property: "og:description", content: "HOD profile settings." }] }),
  component: Settings,
});

function Settings() {
  const { hod, updateProfile } = useHod();
  const [f, setF] = useState({ name: hod.name, email: hod.email, phone: hod.phone });
  return (
    <div className="space-y-6">
      <PageHeader title="Settings / My Profile" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Profile"><div className="mb-4 flex items-center gap-4"><PersonAvatar initials={hod.initials} size="lg" /><div><div className="font-semibold text-navy">{hod.name}</div><div className="text-sm text-muted-foreground">{hod.designation} · Finance · {hod.employeeId}</div></div></div>
          <div className="space-y-3">{(["name", "email", "phone"] as const).map((k) => <div key={k}><Label className="capitalize">{k}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}
          <Button onClick={() => { updateProfile(f); toast.success("Profile updated"); }}>Save profile</Button></div></Panel>
        <Panel title="Change password"><div className="space-y-3"><Input type="password" placeholder="Current password" /><Input type="password" placeholder="New password" /><Button variant="outline" onClick={() => toast.success("Password updated (demo)")}>Update password</Button></div></Panel>
        <Panel title="Notification preferences"><div className="space-y-3 text-sm">{["New departmental queries", "Overdue queries", "Escalations", "Task updates", "Workload alerts"].map((p) => <label key={p} className="flex justify-between">{p}<Switch defaultChecked /></label>)}</div></Panel>
        <Panel title="Sessions"><div className="space-y-2 text-sm"><div className="flex justify-between">Chrome · Lahore office <span className="text-success">Current</span></div><div className="flex justify-between">Safari · iPad <Button size="sm" variant="ghost" onClick={() => toast("Session signed out")}>Sign out</Button></div></div></Panel>
        <Panel title="Access scope" className="xl:col-span-2"><div className="grid gap-2 text-sm sm:grid-cols-2">{Object.entries(PERMISSIONS).map(([k, v]) => <div key={k} className="flex items-center justify-between rounded border px-3 py-2"><span>{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>{v ? <span className="text-success">Allowed</span> : <span className="flex items-center gap-1 text-muted-foreground"><Lock className="size-3" />Central Admin only</span>}</div>)}</div></Panel>
      </div>
    </div>
  );
}
