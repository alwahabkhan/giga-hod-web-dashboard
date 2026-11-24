import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, MessageSquareText, Users, ListChecks, BarChart3, Bell, Settings, LogOut, Search,
  ChevronsUpDown, CalendarDays, CheckCheck, UserRound, Lock, Building2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useHod } from "@/lib/hod-store";
import { DEPARTMENTS, TODAY } from "@/lib/hod-data";
import { relTime } from "@/lib/format";
import { PersonAvatar } from "./ui-bits";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Query Management", url: "/queries", icon: MessageSquareText },
  { title: "Employee Management", url: "/employees", icon: Users },
  { title: "Task Management", url: "/tasks", icon: ListChecks },
  { title: "Department Performance", url: "/performance", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings / My Profile", url: "/settings", icon: Settings },
] as const;

export function GigaLogo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-black text-sidebar-primary-foreground">G</span>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-sidebar-accent-foreground">GIGA GROUP</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">HOD Workspace</div>
        </div>
      )}
    </div>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { hod, notifications, queries } = useHod();
  const unread = notifications.filter((n) => !n.read).length;
  const unassigned = queries.filter((q) => !q.assigneeId).length;
  const dept = DEPARTMENTS.find((d) => d.id === hod.department)?.name ?? "Finance";
  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4"><GigaLogo collapsed={collapsed} /></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">{dept} Department</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}
                    className="h-9 data-[active=true]:bg-sidebar-primary/15 data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold">
                    <Link to={item.url}><item.icon /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                  {item.url === "/notifications" && unread > 0 && <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground">{unread}</SidebarMenuBadge>}
                  {item.url === "/queries" && unassigned > 0 && <SidebarMenuBadge className="bg-warning/90 text-navy-dark">{unassigned}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!collapsed && (
          <div className="mx-3 mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-[11px] text-sidebar-foreground/70">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-sidebar-accent-foreground"><Lock className="size-3" /> HOD access</div>
            Scoped to {dept} department records only. Central Admin settings are not available.
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <ProfileMenu side="sidebar" collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}

function ProfileMenu({ side, collapsed }: { side: "sidebar" | "header"; collapsed?: boolean }) {
  const { hod } = useHod();
  const navigate = useNavigate();
  const dept = DEPARTMENTS.find((d) => d.id === hod.department)?.name ?? "Finance";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {side === "sidebar" ? (
          <button className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left hover:bg-sidebar-accent">
            <PersonAvatar initials={hod.initials} availability="Available" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{hod.name}</div>
                  <div className="truncate text-[11px] text-sidebar-foreground/60">{dept} · HOD</div>
                </div>
                <ChevronsUpDown className="size-4 text-sidebar-foreground/60" />
              </>
            )}
          </button>
        ) : (
          <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted" aria-label="Profile menu">
            <PersonAvatar initials={hod.initials} size="sm" />
            <span className="hidden text-sm font-medium text-navy lg:inline">{hod.name.split(" ")[0]}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={side === "sidebar" ? "start" : "end"} side={side === "sidebar" ? "top" : "bottom"} className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">{hod.name}</div>
          <div className="text-xs font-normal text-muted-foreground">{hod.designation}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><UserRound /> My Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><Settings /> Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}><Bell /> Notifications</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast("Signed out (demo)", { description: "In production this ends your session." })}>
          <LogOut /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LABELS: Record<string, string> = { queries: "Query Management", employees: "Employee Management", tasks: "Task Management", performance: "Department Performance", notifications: "Notifications", settings: "Settings / My Profile" };

function NotificationDropdown() {
  const { notifications, markNotification, markAllNotificationsRead } = useHod();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5 text-navy" />
          {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold text-navy">Notifications <span className="text-muted-foreground">({unread} unread)</span></div>
          <button onClick={markAllNotificationsRead} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"><CheckCheck className="size-3.5" />Mark all read</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.slice(0, 7).map((n) => (
            <button key={n.id} onClick={() => {
              markNotification(n.id, true); setOpen(false);
              if (n.link.to === "/queries/$ref") navigate({ to: "/queries/$ref", params: { ref: n.link.ref } });
              else if (n.link.to === "/employees/$id") navigate({ to: "/employees/$id", params: { id: n.link.id } });
              else navigate({ to: "/tasks" });
            }} className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/60", !n.read && "bg-primary/5")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-navy">{n.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{n.description}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{relTime(n.at)}</span>
              </span>
            </button>
          ))}
        </div>
        <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted/50">View all notifications</Link>
      </PopoverContent>
    </Popover>
  );
}

function TopHeader() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { hod } = useHod();
  const [q, setQ] = useState("");
  const parts = path.split("/").filter(Boolean);
  const dept = DEPARTMENTS.find((d) => d.id === hod.department)?.name ?? "Finance";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-6">
      <SidebarTrigger className="text-navy" />
      <div className="hidden min-w-0 flex-col md:flex">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">{dept}</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            {parts.length === 0 ? <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem> : parts.map((p, i) => (
              <span key={p} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === parts.length - 1 ? <BreadcrumbPage>{LABELS[p] ?? p}</BreadcrumbPage>
                    : <BreadcrumbLink asChild><Link to={`/${p}` as "/queries"}>{LABELS[p] ?? p}</Link></BreadcrumbLink>}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-navy"><Building2 className="size-3.5 text-primary" />{dept} Department</div>
      </div>
      <form className="relative ml-auto w-full max-w-sm" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/queries", search: { q: q || undefined } }); }}>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search queries, clients, references…" className="h-9 bg-muted/60 pl-9" aria-label="Global search" />
      </form>
      <div className="hidden items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground xl:flex">
        <CalendarDays className="size-4" />{TODAY.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
      </div>
      <NotificationDropdown />
      <ProfileMenu side="header" />
    </header>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <TopHeader />
          <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
