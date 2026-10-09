import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Archive, CalendarClock, CheckCircle2, Circle, Globe, History, Loader2, Send, ShieldCheck, Undo2 } from "lucide-react";
import { useCaseDraft } from "@/features/cases/CaseDraftProvider";
import { useCaseActions } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel, Stat } from "@/components/common/Page";
import { CaseStatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { completeness, summarize, validateCase } from "@/services/validation";
import { cn } from "@/lib/utils";
import type { CaseStatus, Visibility } from "@/types";

/** "1.4" → "1.5"; anything unparseable becomes "1.0". */
function bumpVersion(v: string) {
  const m = /^(\d+)\.(\d+)$/.exec(v);
  return m ? `${m[1]}.${Number(m[2]) + 1}` : "1.0";
}

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Pending = { status: CaseStatus; title: string; description: string; destructive?: boolean } | null;

export function PublishSection() {
  const { bundle, update, saveNow } = useCaseDraft();
  const { setStatus } = useCaseActions();
  const c = bundle.case;
  const results = validateCase(bundle);
  const sum = summarize(results);
  const comp = completeness(bundle);

  const [version, setVersion] = useState(() => (c.status === "published" ? bumpVersion(c.version) : c.version));
  const [notes, setNotes] = useState("");
  const [scheduleAt, setScheduleAt] = useState(toLocalInput(c.scheduledFor));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Pending>(null);

  const versionTaken = c.versions.some((v) => v.version === version) && version !== c.version;
  const scheduleInPast = !!scheduleAt && new Date(scheduleAt).getTime() <= Date.now();
  const willSchedule = !!scheduleAt && !scheduleInPast;
  const targetStatus: CaseStatus = willSchedule ? "scheduled" : "published";
  const blockedReason = !sum.canPublish ? `${sum.errors} validation error(s) must be fixed first` : !version.trim() ? "Version is required" : versionTaken ? `Version ${version} already exists` : !notes.trim() ? "Add a short version note" : null;

  const apply = async (status: CaseStatus) => {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const releasing = status === "published" || status === "scheduled";
      update((b) => ({
        ...b,
        case: {
          ...b.case,
          status,
          ...(releasing && {
            version: version.trim(),
            versions: [{ version: version.trim(), createdAt: now, author: "You", summary: notes.trim() }, ...b.case.versions],
            publishedAt: status === "published" ? now : b.case.publishedAt,
            scheduledFor: status === "scheduled" ? new Date(scheduleAt).toISOString() : undefined,
          }),
          ...(status === "draft" && { scheduledFor: undefined }),
        },
      }));
      // Let the draft state settle before persisting it.
      await new Promise((r) => setTimeout(r, 50));
      await saveNow();
      await setStatus.mutateAsync({ id: c.id, status });
      toast.success({ published: "Case published", scheduled: "Publication scheduled", review: "Submitted for review", draft: "Moved back to draft", archived: "Case archived" }[status]);
      if (releasing) setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const isLive = c.status === "published" || c.status === "scheduled";

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Globe className="size-4" />Publish</h2>
          <p className="text-xs text-muted-foreground">Review readiness, set visibility and release a version.</p>
        </div>
        <div className="flex items-center gap-2"><CaseStatusBadge status={c.status} /><span className="font-mono text-xs text-muted-foreground">v{c.version}</span></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Completeness" value={`${comp.percent}%`} sub={`${comp.sections.filter((s) => s.ok).length} of ${comp.sections.length} sections ready`} tone={comp.percent === 100 ? "success" : "amber"} />
        <Stat label="Validation" value={sum.errors ? `${sum.errors} error${sum.errors > 1 ? "s" : ""}` : sum.warnings ? `${sum.warnings} warning${sum.warnings > 1 ? "s" : ""}` : "All clear"} tone={sum.errors ? "crimson" : sum.warnings ? "amber" : "success"} sub={`Health ${sum.score}%`} />
        <Stat label="Current visibility" value={<span className="capitalize">{c.visibility}</span>} sub={c.publishedAt ? `Published ${new Date(c.publishedAt).toLocaleDateString()}` : "Not published yet"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Panel title="Completeness checklist" icon={CheckCircle2}>
            <Progress value={comp.percent} className="mb-3 h-1.5" />
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {comp.sections.map((s) => (
                <li key={s.key} className={cn("flex items-center gap-2 text-xs", s.ok ? "text-foreground" : "text-muted-foreground")}>
                  {s.ok ? <CheckCircle2 className="size-3.5 text-success" /> : <Circle className="size-3.5" />}{s.key}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Validation" icon={ShieldCheck} actions={<Button variant="outline" size="sm" className="h-7 text-xs" asChild><Link to="/cases/$caseId/validation" params={{ caseId: c.id }}>Open full report</Link></Button>}>
            {sum.errors + sum.warnings === 0
              ? <p className="text-xs text-success">All {results.length} checks passed.</p>
              : <ul className="space-y-1.5 text-xs">
                {results.filter((r) => r.severity !== "pass").map((r) => (
                  <li key={r.id} className="flex items-center gap-2"><span className={cn("size-1.5 rounded-full", r.severity === "error" ? "bg-crimson" : "bg-amber")} />{r.label}<span className="text-muted-foreground">· {r.messages.length}</span></li>
                ))}
              </ul>}
          </Panel>
          <Panel title="Version history" icon={History}>
            {c.versions.length === 0 ? <p className="text-xs text-muted-foreground">No versions released yet.</p> : (
              <ul className="space-y-2">
                {c.versions.map((v) => (
                  <li key={v.version} className="text-xs">
                    <div className="flex items-center gap-2"><span className="font-mono font-medium">v{v.version}</span><span className="text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()} · {v.author}</span></div>
                    <div className="text-muted-foreground">{v.summary}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Release" icon={Send}>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Version"><Input className="font-mono" value={version} onChange={(e) => setVersion(e.target.value)} />{versionTaken && <span className="text-[11px] text-crimson">Already used</span>}</Field>
              <Field label="Visibility">
                <Select value={c.visibility} onValueChange={(v) => update((b) => ({ ...b, case: { ...b.case, visibility: v as Visibility } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="beta">Beta testers</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Version notes" hint="Shown in the version history and changelog"><Textarea rows={3} value={notes} placeholder="What changed in this version?" onChange={(e) => setNotes(e.target.value)} /></Field>
            <Field label="Schedule (optional)" hint="Leave empty to publish immediately">
              <div className="flex gap-2">
                <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                {scheduleAt && <Button variant="ghost" size="sm" onClick={() => setScheduleAt("")}>Clear</Button>}
              </div>
              {scheduleInPast && <span className="text-[11px] text-crimson">That time has passed — clear it or pick a future time.</span>}
            </Field>

            {blockedReason && <div className="rounded-md border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">{blockedReason}</div>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button disabled={!!blockedReason || scheduleInPast || busy} onClick={() => setConfirm({ status: targetStatus, title: willSchedule ? "Schedule publication?" : isLive ? `Publish v${version}?` : "Publish this case?", description: willSchedule ? `v${version} goes live on ${new Date(scheduleAt).toLocaleString()} with ${c.visibility} visibility.` : `v${version} goes live immediately with ${c.visibility} visibility.` })}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : willSchedule ? <CalendarClock className="size-3.5" /> : <Globe className="size-3.5" />}
                {willSchedule ? "Schedule" : isLive ? "Publish new version" : "Publish now"}
              </Button>
              {c.status === "draft" && <Button variant="outline" disabled={busy} onClick={() => void apply("review")}><Send className="size-3.5" />Submit for review</Button>}
              {isLive && <Button variant="outline" disabled={busy} onClick={() => setConfirm({ status: "draft", title: "Unpublish this case?", description: "Players will no longer be able to open it. You can publish again at any time.", destructive: true })}><Undo2 className="size-3.5" />Unpublish</Button>}
              {c.status !== "archived" && <Button variant="ghost" className="text-crimson" disabled={busy} onClick={() => setConfirm({ status: "archived", title: "Archive this case?", description: "Archived cases are hidden from players and from the default case list.", destructive: true })}><Archive className="size-3.5" />Archive</Button>}
              {c.status === "archived" && <Button variant="outline" disabled={busy} onClick={() => void apply("draft")}><Undo2 className="size-3.5" />Restore to draft</Button>}
            </div>
          </div>
        </Panel>
      </div>

      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)} title={confirm?.title ?? ""} description={confirm?.description ?? ""} destructive={confirm?.destructive ?? false} confirmLabel="Confirm"
        onConfirm={() => { if (confirm) void apply(confirm.status); }} />
    </div>
  );
}
