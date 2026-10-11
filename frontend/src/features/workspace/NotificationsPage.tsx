import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificationActions, useNotifications } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/common/Page";
import { Pill, type Tone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { fmtAgo } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { NotificationKind } from "@/types";

const KIND: Record<NotificationKind, { label: string; tone: Tone }> = {
  player_activity: { label: "Players", tone: "info" },
  case_published: { label: "Published", tone: "success" },
  review_requested: { label: "Review", tone: "violet" },
  validation_failed: { label: "Validation", tone: "crimson" },
  scheduled_release: { label: "Scheduled", tone: "amber" },
  system: { label: "System", tone: "neutral" },
};

export function NotificationsPage() {
  const { data = [], isLoading, error, refetch } = useNotifications();
  const { markRead, markAll } = useNotificationActions();
  const [kind, setKind] = useState<NotificationKind | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = data.filter((n) => !n.read).length;
  const list = data.filter((n) => (kind === "all" || n.kind === kind) && (!unreadOnly || !n.read));

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Notifications" subtitle={`${unread} unread of ${data.length}`}
        actions={<Button size="sm" variant="outline" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck className="size-3.5" />Mark all read</Button>} />
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...Object.keys(KIND)] as const).map((k) => (
          <button key={k} onClick={() => setKind(k as NotificationKind | "all")} className={cn("rounded-md border px-2.5 py-1 text-xs", kind === k ? "border-amber/60 bg-accent font-medium" : "border-border text-muted-foreground hover:text-foreground")}>
            {k === "all" ? "All" : KIND[k as NotificationKind].label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Unread only</label>
      </div>
      {isLoading && <TableSkeleton />}
      {error && <ErrorState message="Could not load notifications" onRetry={() => void refetch()} />}
      {!isLoading && !error && list.length === 0 && <EmptyState icon={Bell} title="Nothing here" body="No notifications match this filter." />}
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id} className={cn("flex items-start gap-3 rounded-md border bg-card p-3", n.read ? "border-border" : "border-amber/40")}>
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-amber")} aria-label={n.read ? "Read" : "Unread"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{n.title}</span><Pill tone={KIND[n.kind].tone}>{KIND[n.kind].label}</Pill></div>
              <p className="text-xs text-muted-foreground">{n.body}</p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{fmtAgo(n.createdAt)}</span>
                {n.caseId && <Link to="/cases/$caseId" params={{ caseId: n.caseId }} className="text-info hover:underline">Open case</Link>}
              </div>
            </div>
            {!n.read && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markRead.mutate(n.id)}>Mark read</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
