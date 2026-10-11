import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronRight, Moon, Sun } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { useCases, useNotifications, useNotificationActions } from "@/hooks/queries";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { fmtAgo } from "@/utils/format";
import { CASE_SECTIONS } from "@/constants/caseSections";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard", cases: "Cases", new: "New Case", media: "Media Library", suspects: "Suspects", locations: "Locations", analytics: "Analytics",
  players: "Players", notifications: "Notifications", users: "Users & Roles", settings: "Settings", evidence: "Evidence", interviews: "Interviews",
  clues: "Clues", timelines: "Timelines", audit: "Audit Log",
};

function Breadcrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: cases = [] } = useCases();
  const parts = path.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; to?: string }> = [{ label: "MysteryCase", to: "/dashboard" }];
  parts.forEach((p, i) => {
    const prev = parts[i - 1];
    if (prev === "cases" && p !== "new") {
      const c = cases.find((x) => x.id === p);
      crumbs.push({ label: c?.code ?? p });
      if (c) crumbs.push({ label: c.title, to: `/cases/${p}` });
      return;
    }
    const section = CASE_SECTIONS.find((s) => s.key === p);
    if (parts[0] === "cases" && i >= 2 && section) { crumbs.push({ label: section.label }); return; }
    crumbs.push({ label: LABELS[p] ?? p, to: `/${parts.slice(0, i + 1).join("/")}` });
  });
  return (
    <nav className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-50" />}
          {c.to && i < crumbs.length - 1 ? (
            <Link to={c.to} className="truncate hover:text-foreground">{c.label}</Link>
          ) : (
            <span className={cn("truncate", i === crumbs.length - 1 && "font-medium text-foreground")}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function NotificationsPopover() {
  const { data = [] } = useNotifications();
  const { markRead, markAll } = useNotificationActions();
  const unread = data.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger className="relative grid size-8 place-items-center rounded-md border border-border hover:bg-accent" aria-label="Notifications">
        <Bell className="size-3.5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-crimson font-mono text-[9px] text-destructive-foreground">{unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold">Notifications</span>
          <button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => markAll.mutate()}>Mark all read</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.slice(0, 6).map((n) => (
            <button key={n.id} onClick={() => markRead.mutate(n.id)} className="flex w-full gap-2 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-accent">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-crimson")} />
              <span className="min-w-0">
                <span className="block text-xs font-medium">{n.title}</span>
                <span className="block text-[11px] text-muted-foreground">{n.body}</span>
                <span className="block font-mono text-[10px] text-muted-foreground/70">{fmtAgo(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
        <Link to="/notifications" className="block border-t border-border px-3 py-2 text-center text-[11px] text-muted-foreground hover:text-foreground">View all</Link>
      </PopoverContent>
    </Popover>
  );
}

export function TopHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-5 backdrop-blur">
      <div className="min-w-0 flex-1"><Breadcrumbs /></div>
      <div className="hidden flex-1 justify-center md:flex"><GlobalSearch /></div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ConnectionStatus />
        <NotificationsPopover />
        <Button variant="outline" size="icon" className="size-8" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </Button>
      </div>
    </header>
  );
}
