import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { Plus, Trash2, Search, Zap, Link2, Network } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel, EmptyState } from "@/components/common/Page";
import { Pill, type Tone } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiPicker } from "@/components/forms/MultiPicker";
import { ConditionBuilder, emptyGroup } from "@/components/editors/ConditionBuilder";
import { describe, targetOptions } from "@/services/conditionEngine";
import { uid } from "@/services/caseFactory";
import { cn } from "@/lib/utils";
import type { CaseBundle, Clue, ClueCategory, ClueConnection, ConditionKind, Trigger, TriggerAction, TriggerActionKind } from "@/types";

const CATEGORIES: ClueCategory[] = ["alibi", "motive", "method", "opportunity", "contradiction", "red_herring", "context"];
const IMPORTANCE: Clue["importance"][] = ["critical", "major", "minor"];
const IMPORTANCE_TONE: Record<Clue["importance"], Tone> = { critical: "crimson", major: "amber", minor: "neutral" };
const RELATIONS: ClueConnection["relation"][] = ["supports", "contradicts", "leads_to", "explains"];
const RELATION_COLOR: Record<ClueConnection["relation"], string> = { supports: "var(--success)", contradicts: "var(--crimson)", leads_to: "var(--info)", explains: "var(--amber)" };

/** Which entity list each trigger action targets (null = free-text notification). */
const ACTION_TARGET: Record<TriggerActionKind, ConditionKind | null> = {
  unlock_question: "question_answered",
  unlock_interview: "interview_completed",
  unlock_location: "location_visited",
  unlock_clue: "clue_discovered",
  reveal_contradiction: "clue_discovered",
  unlock_timeline_event: "timeline_event_discovered",
  show_notification: null,
};
const ACTION_KINDS = Object.keys(ACTION_TARGET) as TriggerActionKind[];
const actionLabel = (k: TriggerActionKind) => k.replace(/_/g, " ");

const nextClueCode = (b: CaseBundle) => {
  const max = b.clues.reduce((m, c) => Math.max(m, Number(/(\d+)$/.exec(c.code)?.[1] ?? 0)), 0);
  return `CLU-${String(max + 1).padStart(3, "0")}`;
};

/* ───────────────────────── Clues ───────────────────────── */

function ClueForm({ clue, bundle, onSave }: { clue: Clue; bundle: CaseBundle; onSave: (c: Clue) => void }) {
  const set = (patch: Partial<Clue>) => onSave({ ...clue, ...patch });
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Title" className="md:col-span-2"><Input value={clue.title} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Description" className="md:col-span-2"><Textarea rows={3} value={clue.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      <Field label="Category">
        <Select value={clue.category} onValueChange={(v) => set({ category: v as ClueCategory, isRedHerring: v === "red_herring" ? true : clue.isRedHerring })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Importance">
        <Select value={clue.importance} onValueChange={(v) => set({ importance: v as Clue["importance"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{IMPORTANCE.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Source evidence"><MultiPicker placeholder="Add evidence…" options={targetOptions(bundle, "evidence_discovered")} value={clue.sourceEvidenceIds} onChange={(v) => set({ sourceEvidenceIds: v })} /></Field>
      <Field label="Source interviews"><MultiPicker placeholder="Add interview…" options={targetOptions(bundle, "interview_completed")} value={clue.sourceInterviewIds} onChange={(v) => set({ sourceInterviewIds: v })} /></Field>
      <Field label="Related suspects" className="md:col-span-2"><MultiPicker placeholder="Add suspect…" options={targetOptions(bundle, "suspect_interviewed")} value={clue.suspectIds} onChange={(v) => set({ suspectIds: v })} /></Field>
      <label className="flex items-center gap-2 text-xs md:col-span-2"><Switch checked={clue.isRedHerring} onCheckedChange={(v) => set({ isRedHerring: v })} />Red herring — misleading, does not point to the real killer</label>
    </div>
  );
}

function CluesTab() {
  const { bundle, update } = useCaseDraft();
  const [selId, setSelId] = useState(bundle.clues[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [del, setDel] = useState<Clue | null>(null);
  const sel = bundle.clues.find((c) => c.id === selId);

  const list = bundle.clues.filter((c) => (cat === "all" || c.category === cat) && `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase()));
  const save = (c: Clue) => update((b) => ({ ...b, clues: replaceById(b.clues, c) }));
  const add = () => {
    const c: Clue = { id: uid("clu"), code: nextClueCode(bundle), title: "New clue", description: "", category: "context", importance: "minor", sourceEvidenceIds: [], sourceInterviewIds: [], suspectIds: [], isRedHerring: false };
    update((b) => ({ ...b, clues: [...b.clues, c] }));
    setSelId(c.id);
  };
  const remove = (c: Clue) => {
    update((b) => ({
      ...b,
      clues: b.clues.filter((x) => x.id !== c.id),
      clueConnections: b.clueConnections.filter((x) => x.from !== c.id && x.to !== c.id),
    }));
    toast.success(`${c.code} deleted`);
    setSelId(bundle.clues.find((x) => x.id !== c.id)?.id ?? "");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-40 flex-1">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input className="h-8 pl-8 text-xs" placeholder="Search clues…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs capitalize">{c.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={add}><Plus className="size-3.5" />Add clue</Button>
        </div>
        {bundle.clues.length === 0 && <EmptyState icon={Search} title="No clues yet" body="Clues are the facts players piece together from evidence and interviews." action={<Button size="sm" onClick={add}>Add clue</Button>} />}
        {bundle.clues.length > 0 && list.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No clues match the filter.</div>}
        {list.map((c) => (
          <button key={c.id} onClick={() => setSelId(c.id)} className={cn("w-full rounded-md border bg-card p-3 text-left transition-colors", c.id === selId ? "border-amber/60" : "border-border hover:border-muted-foreground/40")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{c.code}</span>
              <span className="text-sm font-medium">{c.title}</span>
              <Pill tone={IMPORTANCE_TONE[c.importance]}>{c.importance}</Pill>
              <Pill tone="info">{c.category.replace("_", " ")}</Pill>
              {c.isRedHerring && <Pill tone="amber">Red herring</Pill>}
            </div>
            {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
          </button>
        ))}
      </div>
      {sel && (
        <Panel title={`Edit — ${sel.code}`} actions={<Button variant="ghost" size="sm" className="text-crimson" onClick={() => setDel(sel)}><Trash2 className="size-3.5" />Delete</Button>}>
          <ClueForm key={sel.id} clue={sel} bundle={bundle} onSave={save} />
        </Panel>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete ${del?.code}?`} description="Connections to this clue are removed. Triggers and conditions that reference it will be flagged by validation." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) remove(del); setDel(null); }} />
    </div>
  );
}

/* ───────────────────────── Connections ───────────────────────── */

function ConnectionsTab() {
  const { bundle, update } = useCaseDraft();
  const clueOpts = bundle.clues.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }));
  const codeOf = (id: string) => bundle.clues.find((c) => c.id === id)?.code ?? "?";

  const save = (c: ClueConnection) => update((b) => ({ ...b, clueConnections: replaceById(b.clueConnections, c) }));
  const add = () => {
    if (bundle.clues.length < 2) { toast.error("Create at least two clues first"); return; }
    const c: ClueConnection = { id: uid("cc"), from: bundle.clues[0]!.id, to: bundle.clues[1]!.id, relation: "supports", label: "" };
    update((b) => ({ ...b, clueConnections: [...b.clueConnections, c] }));
  };

  const nodes: Node[] = useMemo(() => bundle.clues.map((c, i) => ({
    id: c.id,
    position: { x: (i % 4) * 230, y: Math.floor(i / 4) * 130 },
    draggable: false,
    data: { label: <div><div className="font-mono text-[9px] text-muted-foreground">{c.code}{c.isRedHerring ? " · red herring" : ""}</div><div className="text-[11px] font-medium">{c.title}</div></div> },
    style: { background: "var(--card)", color: "var(--foreground)", border: `1px solid ${c.isRedHerring ? "var(--amber)" : "var(--border)"}`, borderRadius: 8, width: 190, padding: 8 },
  })), [bundle.clues]);
  const edges: Edge[] = useMemo(() => bundle.clueConnections
    .filter((c) => bundle.clues.some((x) => x.id === c.from) && bundle.clues.some((x) => x.id === c.to))
    .map((c) => ({
      id: c.id, source: c.from, target: c.to, label: c.label || c.relation.replace("_", " "),
      style: { stroke: RELATION_COLOR[c.relation] }, markerEnd: { type: "arrowclosed" as const, color: RELATION_COLOR[c.relation] },
      animated: c.relation === "leads_to",
      labelStyle: { fill: "var(--foreground)", fontSize: 10 }, labelBgStyle: { fill: "var(--card)" },
    })), [bundle.clueConnections, bundle.clues]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      <Panel title="Clue graph" icon={Network} bodyClassName="p-0">
        <div className="h-[460px]">
          {bundle.clues.length === 0 ? <div className="grid h-full place-items-center text-xs text-muted-foreground">No clues to graph.</div> : (
            <ReactFlow nodes={nodes} edges={edges} nodesConnectable={false} fitView colorMode="dark" proOptions={{ hideAttribution: true }}>
              <Background /><Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2 text-[11px]">
          {RELATIONS.map((r) => <span key={r} className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: RELATION_COLOR[r] }} />{r.replace("_", " ")}</span>)}
        </div>
      </Panel>
      <Panel title={`Connections · ${bundle.clueConnections.length}`} icon={Link2} actions={<Button size="sm" onClick={add}><Plus className="size-3.5" />Add</Button>}>
        <div className="space-y-2">
          {bundle.clueConnections.length === 0 && <EmptyState icon={Link2} title="No connections" body="Link clues to show how they support, contradict or lead to one another." />}
          {bundle.clueConnections.map((c) => (
            <div key={c.id} className="space-y-1.5 rounded-md border border-border bg-background p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Select value={c.from} onValueChange={(v) => save({ ...c, from: v })}>
                  <SelectTrigger className="h-7 min-w-36 flex-1 text-xs"><SelectValue>{codeOf(c.from)}</SelectValue></SelectTrigger>
                  <SelectContent>{clueOpts.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={c.relation} onValueChange={(v) => save({ ...c, relation: v as ClueConnection["relation"] })}>
                  <SelectTrigger className="h-7 w-32 text-xs" style={{ color: RELATION_COLOR[c.relation] }}><SelectValue /></SelectTrigger>
                  <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r} className="text-xs">{r.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={c.to} onValueChange={(v) => save({ ...c, to: v })}>
                  <SelectTrigger className="h-7 min-w-36 flex-1 text-xs"><SelectValue>{codeOf(c.to)}</SelectValue></SelectTrigger>
                  <SelectContent>{clueOpts.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="size-7" aria-label="Remove connection" onClick={() => update((b) => ({ ...b, clueConnections: b.clueConnections.filter((x) => x.id !== c.id) }))}><Trash2 className="size-3" /></Button>
              </div>
              <Input className="h-7 text-xs" placeholder="Label (optional)" value={c.label} onChange={(e) => save({ ...c, label: e.target.value })} />
              {c.from === c.to && <div className="text-[11px] text-crimson">A clue cannot connect to itself.</div>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── Triggers ───────────────────────── */

function ActionRow({ action, bundle, onChange, onRemove }: { action: TriggerAction; bundle: CaseBundle; onChange: (a: TriggerAction) => void; onRemove: () => void }) {
  const targetKind = ACTION_TARGET[action.kind];
  const opts = targetKind ? targetOptions(bundle, targetKind) : [];
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
      <Select value={action.kind} onValueChange={(v) => onChange({ ...action, kind: v as TriggerActionKind, targetId: "" })}>
        <SelectTrigger className="h-7 w-52 text-xs capitalize"><SelectValue /></SelectTrigger>
        <SelectContent>{ACTION_KINDS.map((k) => <SelectItem key={k} value={k} className="text-xs capitalize">{actionLabel(k)}</SelectItem>)}</SelectContent>
      </Select>
      {targetKind ? (
        <Select value={action.targetId} onValueChange={(v) => onChange({ ...action, targetId: v })}>
          <SelectTrigger className={cn("h-7 min-w-48 flex-1 text-xs", !action.targetId && "border-crimson/50")}><SelectValue placeholder="Select target…" /></SelectTrigger>
          <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : (
        <Input className="h-7 min-w-48 flex-1 text-xs" placeholder="Notification text shown to the player" value={action.label} onChange={(e) => onChange({ ...action, label: e.target.value })} />
      )}
      <Button variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remove action"><Trash2 className="size-3" /></Button>
    </div>
  );
}

function TriggerCard({ trigger, bundle, onSave, onDelete }: { trigger: Trigger; bundle: CaseBundle; onSave: (t: Trigger) => void; onDelete: () => void }) {
  const set = (patch: Partial<Trigger>) => onSave({ ...trigger, ...patch });
  const setAction = (a: TriggerAction) => set({ actions: trigger.actions.map((x) => (x.id === a.id ? a : x)) });
  const addAction = () => set({ actions: [...trigger.actions, { id: uid("ta"), kind: "unlock_clue", targetId: "", label: "" }] });
  return (
    <Panel
      className={cn(!trigger.enabled && "opacity-70")}
      title={<span className="flex items-center gap-2"><Zap className="size-3.5 text-amber" />{trigger.name || "Untitled trigger"}</span>}
      actions={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Switch checked={trigger.enabled} onCheckedChange={(v) => set({ enabled: v })} />{trigger.enabled ? "Enabled" : "Disabled"}</label>
          <Button variant="ghost" size="icon" className="size-7 text-crimson" onClick={onDelete} aria-label="Delete trigger"><Trash2 className="size-3.5" /></Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name"><Input value={trigger.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Description"><Input value={trigger.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        </div>
        <ConditionBuilder value={trigger.condition} bundle={bundle} onChange={(g) => set({ condition: g })} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="label-caps">THEN</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={addAction}><Plus className="size-3" />Action</Button>
          </div>
          {trigger.actions.length === 0 && <div className="px-1 text-[11px] text-crimson">A trigger with no actions does nothing.</div>}
          {trigger.actions.map((a) => <ActionRow key={a.id} action={a} bundle={bundle} onChange={setAction} onRemove={() => set({ actions: trigger.actions.filter((x) => x.id !== a.id) })} />)}
        </div>
        <div className="rounded-sm bg-muted/50 px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{describe(trigger.condition, bundle)}</div>
      </div>
    </Panel>
  );
}

function TriggersTab() {
  const { bundle, update } = useCaseDraft();
  const [del, setDel] = useState<Trigger | null>(null);
  const add = () => update((b) => ({ ...b, triggers: [...b.triggers, { id: uid("trg"), name: "New trigger", description: "", condition: emptyGroup(), actions: [], enabled: true }] }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Triggers fire when their conditions become true, unlocking content for the player.</p>
        <Button size="sm" onClick={add}><Plus className="size-3.5" />Add trigger</Button>
      </div>
      {bundle.triggers.length === 0 && <EmptyState icon={Zap} title="No triggers" body="Add a trigger to unlock questions, interviews, locations or clues based on player progress." action={<Button size="sm" onClick={add}>Add trigger</Button>} />}
      <div className="grid gap-4 2xl:grid-cols-2">
        {bundle.triggers.map((t) => (
          <TriggerCard key={t.id} trigger={t} bundle={bundle} onSave={(x) => update((b) => ({ ...b, triggers: replaceById(b.triggers, x) }))} onDelete={() => setDel(t)} />
        ))}
      </div>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete "${del?.name}"?`} description="This trigger and its actions will be removed." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { update((b) => ({ ...b, triggers: b.triggers.filter((t) => t.id !== del.id) })); toast.success("Trigger deleted"); } setDel(null); }} />
    </div>
  );
}

/* ───────────────────────── Section ───────────────────────── */

export function CluesSection() {
  const { bundle } = useCaseDraft();
  return (
    <div className="p-6">
      <Tabs defaultValue="clues">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Clues & triggers</h2>
          <TabsList>
            <TabsTrigger value="clues">Clues <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{bundle.clues.length}</span></TabsTrigger>
            <TabsTrigger value="connections">Connections <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{bundle.clueConnections.length}</span></TabsTrigger>
            <TabsTrigger value="triggers">Triggers <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{bundle.triggers.length}</span></TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="clues"><CluesTab /></TabsContent>
        <TabsContent value="connections"><ConnectionsTab /></TabsContent>
        <TabsContent value="triggers"><TriggersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
