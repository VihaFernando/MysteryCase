import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, Clock, GripVertical, Plus, Trash2, ArrowDownUp } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel, EmptyState } from "@/components/common/Page";
import { Pill, type Tone } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiPicker } from "@/components/forms/MultiPicker";
import { uid } from "@/services/caseFactory";
import { cn } from "@/lib/utils";
import type { CaseBundle, TimelineEvent } from "@/types";

const VISIBILITY: TimelineEvent["visibility"][] = ["visible", "discoverable", "hidden"];
const VIS_TONE: Record<TimelineEvent["visibility"], Tone> = { visible: "success", discoverable: "info", hidden: "crimson" };
const NO_LOCATION = "__none__";

const toMinutes = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Re-assign `correctOrder` 1..n following array order. */
const renumber = (events: TimelineEvent[]) => events.map((e, i) => ({ ...e, correctOrder: i + 1 }));
const sorted = (events: TimelineEvent[]) => [...events].sort((a, b) => a.correctOrder - b.correctOrder);

/**
 * A claim that is not true is a lie. It is contradicted by true, non-claim events that involve
 * the same characters and either share evidence with it or happen within an hour of it.
 */
function contradictions(claim: TimelineEvent, events: TimelineEvent[]): TimelineEvent[] {
  if (!claim.isClaim || claim.isTrue) return [];
  const ct = toMinutes(claim.time);
  return events.filter((e) => {
    if (e.id === claim.id || e.isClaim || !e.isTrue) return false;
    if (!e.characterIds.some((c) => claim.characterIds.includes(c))) return false;
    const shared = e.evidenceIds.some((x) => claim.evidenceIds.includes(x));
    const et = toMinutes(e.time);
    return shared || (ct !== null && et !== null && Math.abs(et - ct) <= 60);
  });
}

function EventForm({ event, bundle, onSave }: { event: TimelineEvent; bundle: CaseBundle; onSave: (e: TimelineEvent) => void }) {
  const set = (patch: Partial<TimelineEvent>) => onSave({ ...event, ...patch });
  const timeInvalid = event.time !== "" && toMinutes(event.time) === null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Title" className="md:col-span-2"><Input value={event.title} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Time (24h, HH:MM)">
        <Input value={event.time} placeholder="21:45" className={cn("font-mono", timeInvalid && "border-crimson")} onChange={(e) => set({ time: e.target.value })} />
        {timeInvalid && <span className="text-[11px] text-crimson">Use HH:MM, e.g. 21:45</span>}
      </Field>
      <Field label="Location">
        <Select value={event.locationId ?? NO_LOCATION} onValueChange={(v) => set({ locationId: v === NO_LOCATION ? undefined : v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_LOCATION}>Unknown / none</SelectItem>
            {bundle.locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Description" className="md:col-span-2"><Textarea rows={2} value={event.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      <Field label="Characters involved"><MultiPicker placeholder="Add character…" options={bundle.suspects.map((s) => ({ value: s.id, label: s.name }))} value={event.characterIds} onChange={(v) => set({ characterIds: v })} /></Field>
      <Field label="Evidence"><MultiPicker placeholder="Add evidence…" options={bundle.evidence.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` }))} value={event.evidenceIds} onChange={(v) => set({ evidenceIds: v })} /></Field>
      <Field label="Source" hint="Where the player learns of this (interview, CCTV, receipt…)"><Input value={event.source} onChange={(e) => set({ source: e.target.value })} /></Field>
      <Field label="Visibility to player">
        <Select value={event.visibility} onValueChange={(v) => set({ visibility: v as TimelineEvent["visibility"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{VISIBILITY.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-6 md:col-span-2">
        <label className="flex items-center gap-2 text-xs"><Switch checked={event.isClaim} onCheckedChange={(v) => set({ isClaim: v })} />Claim (stated by a character)</label>
        <label className="flex items-center gap-2 text-xs"><Switch checked={event.isTrue} onCheckedChange={(v) => set({ isTrue: v })} />Actually true</label>
      </div>
    </div>
  );
}

export function TimelineBuilder() {
  const { bundle, update } = useCaseDraft();
  const events = useMemo(() => sorted(bundle.timeline), [bundle.timeline]);
  const [selId, setSelId] = useState(events[0]?.id ?? "");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [del, setDel] = useState<TimelineEvent | null>(null);
  const sel = bundle.timeline.find((e) => e.id === selId);

  const setOrder = (next: TimelineEvent[]) => update((b) => ({ ...b, timeline: renumber(next) }));
  const move = (id: string, delta: -1 | 1) => {
    const i = events.findIndex((e) => e.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= events.length) return;
    const next = events.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };
  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = events.findIndex((e) => e.id === dragId);
    const to = events.findIndex((e) => e.id === targetId);
    if (from < 0 || to < 0) return;
    const next = events.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setOrder(next);
  };
  const sortByTime = () => {
    setOrder([...events].sort((a, b) => (toMinutes(a.time) ?? Infinity) - (toMinutes(b.time) ?? Infinity)));
    toast.success("Correct order now follows clock time");
  };
  const save = (e: TimelineEvent) => update((b) => ({ ...b, timeline: replaceById(b.timeline, e) }));
  const add = () => {
    const e: TimelineEvent = { id: uid("tl"), time: "", title: "New event", description: "", characterIds: [], evidenceIds: [], source: "", correctOrder: events.length + 1, visibility: "discoverable", isClaim: false, isTrue: true };
    update((b) => ({ ...b, timeline: [...b.timeline, e] }));
    setSelId(e.id);
  };
  const remove = (e: TimelineEvent) => {
    update((b) => ({ ...b, timeline: renumber(sorted(b.timeline).filter((x) => x.id !== e.id)) }));
    setSelId(events.find((x) => x.id !== e.id)?.id ?? "");
    toast.success("Event deleted");
  };

  const nameOf = (id: string) => bundle.suspects.find((s) => s.id === id)?.name ?? id;
  const lieCount = events.filter((e) => contradictions(e, events).length > 0).length;

  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Timeline <span className="ml-1 font-mono text-xs text-muted-foreground">{events.length}</span>
            {lieCount > 0 && <span className="ml-2 text-xs font-normal text-crimson">{lieCount} contradicted {lieCount === 1 ? "claim" : "claims"}</span>}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={sortByTime} disabled={events.length < 2}><ArrowDownUp className="size-3.5" />Sort by time</Button>
            <Button size="sm" onClick={add}><Plus className="size-3.5" />Add event</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Order here is the <em>correct</em> order players must reconstruct. Drag or use the arrows to reorder.</p>
        {events.length === 0 && <EmptyState icon={Clock} title="No timeline events" body="Add the events that happened, and the claims characters make about them." action={<Button size="sm" onClick={add}>Add event</Button>} />}
        <ol className="space-y-2">
          {events.map((e, i) => {
            const contra = contradictions(e, events);
            const prev = events[i - 1];
            const outOfOrder = !e.isClaim && prev && !prev.isClaim && toMinutes(e.time) !== null && toMinutes(prev.time) !== null && toMinutes(e.time)! < toMinutes(prev.time)!;
            return (
              <li
                key={e.id}
                draggable
                onDragStart={() => setDragId(e.id)}
                onDragOver={(ev) => { ev.preventDefault(); setOverId(e.id); }}
                onDrop={() => { drop(e.id); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={cn("flex gap-2 rounded-md border bg-card p-2.5 transition-colors", e.id === selId ? "border-amber/60" : "border-border", overId === e.id && dragId !== e.id && "border-info", dragId === e.id && "opacity-50", e.isClaim && !e.isTrue && "border-l-2 border-l-crimson")}
              >
                <GripVertical className="mt-1 size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                <button className="min-w-0 flex-1 text-left" onClick={() => setSelId(e.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-muted font-mono text-[10px]">{e.correctOrder}</span>
                    <span className="font-mono text-xs text-amber">{e.time || "--:--"}</span>
                    <span className="text-sm font-medium">{e.title}</span>
                    {e.isClaim && <Pill tone={e.isTrue ? "violet" : "crimson"}>{e.isTrue ? "Claim · true" : "Claim · false"}</Pill>}
                    <Pill tone={VIS_TONE[e.visibility]}>{e.visibility}</Pill>
                    {outOfOrder && <Pill tone="amber"><AlertTriangle className="size-2.5" />Earlier than previous</Pill>}
                  </div>
                  {e.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>}
                  {(e.characterIds.length > 0 || e.source) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      {e.characterIds.map((c) => <Pill key={c}>{nameOf(c)}</Pill>)}
                      {e.source && <span>· {e.source}</span>}
                    </div>
                  )}
                  {contra.length > 0 && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-sm bg-crimson-soft px-2 py-1 text-[11px] text-crimson">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span>Contradicted by {contra.map((c) => `${c.time} ${c.title}`).join("; ")}</span>
                    </div>
                  )}
                </button>
                <div className="flex shrink-0 flex-col">
                  <Button variant="ghost" size="icon" className="size-6" disabled={i === 0} onClick={() => move(e.id, -1)} aria-label="Move up"><ArrowUp className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-6" disabled={i === events.length - 1} onClick={() => move(e.id, 1)} aria-label="Move down"><ArrowDown className="size-3" /></Button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {sel && (
        <Panel title={`Edit — ${sel.title || "event"}`} actions={<Button variant="ghost" size="sm" className="text-crimson" onClick={() => setDel(sel)}><Trash2 className="size-3.5" />Delete</Button>} className="h-fit">
          <EventForm key={sel.id} event={sel} bundle={bundle} onSave={save} />
        </Panel>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete "${del?.title}"?`} description="Evidence and solution links to this event will be left orphaned and flagged by validation." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) remove(del); setDel(null); }} />
    </div>
  );
}
