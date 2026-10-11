import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  BarChart3, Bell, Briefcase, ChevronsUpDown, Clock3, FolderArchive, Fingerprint, Image, LayoutDashboard, Lightbulb, MapPin, MessagesSquare,
  Settings, ShieldCheck, Users, UserSquare2, Gamepad2, FilePen, CalendarClock, Globe, ScrollText,
} from "lucide-react";
import { useNotifications } from "@/hooks/queries";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useWebSocket } from "@/websocket/WebSocketProvider";

type Item = { label: string; to: string; icon: typeof Briefcase; search?: { status?: string }; badge?: number };

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      search={(item.search ?? {}) as never}
      className={cn(
        "group flex h-7 items-center gap-2.5 rounded-[5px] px-2 text-[12.5px] transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-3.5", active ? "text-sidebar-primary" : "opacity-70")} />
      <span className="flex-1 truncate">{item.label}</span>
      {!!item.badge && <span className="rounded-sm bg-crimson px-1 font-mono text-[10px] text-destructive-foreground">{item.badge}</span>}
    </Link>
  );
}

function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      {label && <div className="px-2 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sidebar-foreground/40">{label}</div>}
      {children}
    </div>
  );
}

export function AppSidebar() {
  const loc = useRouterState({ select: (s) => s.location });
  const status = (loc.search as { status?: string }).status;
  const { data: notes = [] } = useNotifications();
  const unread = notes.filter((n) => !n.read).length;
  const { status: ws } = useWebSocket();
  const [workspace, setWorkspace] = useState("MysteryCase Studio");

  const isActive = (to: string, s?: string) => {
    if (to === "/cases") return loc.pathname === "/cases" && (status ?? "") === (s ?? "");
    return loc.pathname === to || loc.pathname.startsWith(`${to}/`);
  };

  const caseItems: Item[] = [
    { label: "All Cases", to: "/cases", icon: Briefcase },
    { label: "Drafts", to: "/cases", icon: FilePen, search: { status: "draft" } },
    { label: "Published", to: "/cases", icon: Globe, search: { status: "published" } },
    { label: "Scheduled", to: "/cases", icon: CalendarClock, search: { status: "scheduled" } },
    { label: "Archived", to: "/cases", icon: FolderArchive, search: { status: "archived" } },
  ];
  const content: Item[] = [
    { label: "Suspects", to: "/suspects", icon: UserSquare2 },
    { label: "Locations", to: "/locations", icon: MapPin },
    { label: "Evidence", to: "/evidence", icon: Fingerprint },
    { label: "Interviews", to: "/interviews", icon: MessagesSquare },
    { label: "Clues", to: "/clues", icon: Lightbulb },
    { label: "Timelines", to: "/timelines", icon: Clock3 },
    { label: "Media Library", to: "/media", icon: Image },
  ];
  const insights: Item[] = [
    { label: "Analytics", to: "/analytics", icon: BarChart3 },
    { label: "Players", to: "/players", icon: Gamepad2 },
    { label: "Notifications", to: "/notifications", icon: Bell, badge: unread },
  ];
  const admin: Item[] = [
    { label: "Users & Roles", to: "/users", icon: Users },
    { label: "Audit Log", to: "/audit", icon: ScrollText },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-[224px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <Link to="/dashboard" className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="grid size-7 place-items-center rounded-[5px] border border-sidebar-primary/40 bg-sidebar-primary/10">
          <Fingerprint className="size-4 text-sidebar-primary" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[14px] font-semibold tracking-wide text-sidebar-accent-foreground">MysteryCase</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/50">Case Authoring</div>
        </div>
      </Link>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        <Group><NavItem item={{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }} active={isActive("/dashboard")} /></Group>
        <Group label="Cases">{caseItems.map((i) => <NavItem key={i.label} item={i} active={isActive(i.to, i.search?.status)} />)}</Group>
        <Group label="Content">{content.map((i) => <NavItem key={i.label} item={i} active={isActive(i.to)} />)}</Group>
        <Group label="Insights">{insights.map((i) => <NavItem key={i.label} item={i} active={isActive(i.to)} />)}</Group>
        <Group label="Admin">{admin.map((i) => <NavItem key={i.label} item={i} active={isActive(i.to)} />)}</Group>
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-xs hover:bg-sidebar-accent">
            <ShieldCheck className="size-3.5 text-sidebar-primary" />
            <span className="flex-1 truncate">{workspace}</span>
            <ChevronsUpDown className="size-3 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuLabel className="text-xs">Workspaces</DropdownMenuLabel>
            {["MysteryCase Studio", "MysteryCase — Staging", "Localisation Team"].map((w) => (
              <DropdownMenuItem key={w} onClick={() => setWorkspace(w)}>{w}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/settings">Workspace settings</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2.5 rounded-[5px] px-2 py-1.5">
          <div className="relative grid size-7 place-items-center rounded-full bg-crimson/80 font-mono text-[10px] font-semibold text-destructive-foreground">
            AD
            <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-sidebar", ws === "connected" ? "bg-success" : ws === "offline" ? "bg-muted-foreground" : "bg-amber")} />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-sidebar-accent-foreground">Admin</div>
            <div className="truncate text-[10.5px] text-sidebar-foreground/55">Super Admin · {ws === "connected" ? "Online" : ws}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
