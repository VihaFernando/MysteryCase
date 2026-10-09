import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Lightbulb, Plus, Target, Trash2, X, Gauge, FlaskConical } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel, EmptyState } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiPicker } from "@/components/forms/MultiPicker";
import { ConditionBuilder, emptyGroup } from "@/components/editors/ConditionBuilder";
import { scoreAccusation, type Accusation } from "@/services/scoring";
import { uid } from "@/services/caseFactory";
import { cn } from "@/lib/utils";
import type { CaseBundle, Hint, ScoringConfig, Solution, Theory } from "@/types";

const sortedTimeline = (b: CaseBundle) => [...b.timeline].sort((a, c) => a.correctOrder - c.correctOrder);

/* ───────────────────────── Answer ───────────────────────── */

function OrderedEvents({ bundle, value, onChange }: { bundle: CaseBundle; value: string[]; onChange: (v: string[]) => void }) {
  const label = (id: string) => {
    const e = bundle.timeline.find((t) => t.id === id);
    return e ? `${e.time || "--:--"} · ${e.title}` : `Missing event (${id})`;
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  const remaining = bundle.timeline.filter((t) => !value.includes(t.id));
  return (
    <div className="space-y-1.5">
      {value.length === 0 && <div className="text-[11px] text-muted-foreground">No events selected — players are not asked to order a timeline.</div>}
      {value.map((id, i) => (
        <div key={id} className={cn("flex items-center gap-1.5 rounded-md border bg-background px-2 py-1", !bundle.timeline.some((t) => t.id === id) && "border-crimson/50")}>
          <span className="w-5 font-mono text-[10px] text-muted-foreground">{i + 1}</span>
          <span className="flex-1 truncate text-xs">{label(id)}</span>
          <Button variant="ghost" size="icon" className="size-6" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-3" /></Button>
          <Button variant="ghost" size="icon" className="size-6" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-3" /></Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => onChange(value.filter((x) => x !== id))} aria-label="Remove"><X className="size-3" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Select value="" onValueChange={(v) => onChange([...value, v])}>
          <SelectTrigger className="h-8 flex-1 text-xs" disabled={remaining.length === 0}><SelectValue placeholder="Add event…" /></SelectTrigger>
          <SelectContent>{remaining.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.time} · {t.title}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onChange(sortedTimeline(bundle).filter((t) => !t.isClaim).map((t) => t.id))}>Use timeline order</Button>
      </div>
    </div>
  );
}

function AnswerTab() {
  const { bundle, update } = useCaseDraft();
  const s = bundle.solution;
  const set = (patch: Partial<Solution>) => update((b) => ({ ...b, solution: { ...b.solution, ...patch } }));
  const evOpts = bundle.evidence.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` }));
  const killer = bundle.suspects.find((x) => x.id === s.killerId);
  const flaggedKillers = bundle.suspects.filter((x) => x.isKiller);
  const overlap = s.requiredEvidenceIds.filter((id) => s.supportingEvidenceIds.includes(id));
  const [alt, setAlt] = useState("");

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="The truth" icon={Target}>
        <div className="grid gap-3">
          <Field label="Killer">
            <Select value={s.killerId} onValueChange={(v) => set({ killerId: v })}>
              <SelectTrigger className={cn(!killer && "border-crimson/50")}><SelectValue placeholder="Select the killer…" /></SelectTrigger>
              <SelectContent>{bundle.suspects.filter((x) => x.role !== "victim").map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {killer && !killer.isKiller && <div className="text-[11px] text-amber">{killer.name} is not flagged "Is the killer" on the Suspects page.</div>}
          {flaggedKillers.length > 1 && <div className="text-[11px] text-amber">{flaggedKillers.length} characters are flagged as the killer.</div>}
          <Field label="Motive"><Input value={s.motive} onChange={(e) => set({ motive: e.target.value })} /></Field>
          <Field label="Method"><Input value={s.method} onChange={(e) => set({ method: e.target.value })} /></Field>
          <Field label="Weapon"><Input value={s.weapon} onChange={(e) => set({ weapon: e.target.value })} /></Field>
          <Field label="Full explanation" hint="Shown to the player after a correct accusation"><Textarea rows={4} value={s.explanation} onChange={(e) => set({ explanation: e.target.value })} /></Field>
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Evidence">
          <div className="grid gap-3">
            <Field label={`Required evidence · ${s.requiredEvidenceIds.length}`} hint="Players must present these to prove the case"><MultiPicker placeholder="Add required evidence…" options={evOpts} value={s.requiredEvidenceIds} onChange={(v) => set({ requiredEvidenceIds: v })} /></Field>
            <Field label={`Supporting evidence · ${s.supportingEvidenceIds.length}`}><MultiPicker placeholder="Add supporting evidence…" options={evOpts} value={s.supportingEvidenceIds} onChange={(v) => set({ supportingEvidenceIds: v })} /></Field>
            {overlap.length > 0 && <div className="text-[11px] text-amber">{overlap.length} item(s) are both required and supporting.</div>}
          </div>
        </Panel>
        <Panel title="Correct timeline order">
          <OrderedEvents bundle={bundle} value={s.correctTimelineIds} onChange={(v) => set({ correctTimelineIds: v })} />
        </Panel>
        <Panel title="Alternatives & partial credit">
          <div className="space-y-3">
            <Field label="Acceptable alternative motives" hint="Wording accepted as equivalent to the main motive">
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {s.acceptableAlternatives.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px]">{a}<button onClick={() => set({ acceptableAlternatives: s.acceptableAlternatives.filter((x) => x !== a) })} aria-label={`Remove ${a}`}><X className="size-2.5" /></button></span>
                  ))}
                </div>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = alt.trim(); if (v && !s.acceptableAlternatives.includes(v)) set({ acceptableAlternatives: [...s.acceptableAlternatives, v] }); setAlt(""); }}>
                  <Input className="h-8 text-xs" placeholder="Add alternative…" value={alt} onChange={(e) => setAlt(e.target.value)} />
                  <Button type="submit" variant="outline" size="sm" className="h-8">Add</Button>
                </form>
              </div>
            </Field>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Partial credit rules</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => set({ partialCredit: [...s.partialCredit, { label: "New rule", points: 100 }] })}><Plus className="size-3" />Rule</Button></div>
              {s.partialCredit.map((p, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input className="h-8 flex-1 text-xs" value={p.label} onChange={(e) => set({ partialCredit: s.partialCredit.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <Input className="h-8 w-24 text-xs" type="number" min={0} value={p.points} onChange={(e) => set({ partialCredit: s.partialCredit.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) || 0 } : x)) })} />
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Remove rule" onClick={() => set({ partialCredit: s.partialCredit.filter((_, j) => j !== i) })}><Trash2 className="size-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ───────────────────────── Theories ───────────────────────── */

function TheoryCard({ theory, bundle, onSave, onDelete }: { theory: Theory; bundle: CaseBundle; onSave: (t: Theory) => void; onDelete: () => void }) {
  const set = (patch: Partial<Theory>) => onSave({ ...theory, ...patch });
  const evOpts = bundle.evidence.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` }));
  const both = theory.supportingEvidenceIds.filter((id) => theory.contradictingEvidenceIds.includes(id));
  return (
    <Panel title={<span className="flex items-center gap-2">{theory.name || "Untitled theory"}<Pill tone={theory.isCorrect ? "success" : "neutral"}>{theory.isCorrect ? "Correct" : "Incorrect"}</Pill></span>}
      actions={<Button variant="ghost" size="icon" className="size-7 text-crimson" onClick={onDelete} aria-label="Delete theory"><Trash2 className="size-3.5" /></Button>}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name"><Input value={theory.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Suspected killer">
          <Select value={theory.killerId} onValueChange={(v) => set({ killerId: v })}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{bundle.suspects.filter((x) => x.role !== "victim").map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Motive"><Input value={theory.motive} onChange={(e) => set({ motive: e.target.value })} /></Field>
        <Field label="Method"><Input value={theory.method} onChange={(e) => set({ method: e.target.value })} /></Field>
        <Field label="Supporting evidence"><MultiPicker placeholder="Add evidence…" options={evOpts} value={theory.supportingEvidenceIds} onChange={(v) => set({ supportingEvidenceIds: v })} /></Field>
        <Field label="Contradicting evidence"><MultiPicker placeholder="Add evidence…" options={evOpts} value={theory.contradictingEvidenceIds} onChange={(v) => set({ contradictingEvidenceIds: v })} /></Field>
        <Field label="Required clues" className="md:col-span-2"><MultiPicker placeholder="Add clue…" options={bundle.clues.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))} value={theory.requiredClueIds} onChange={(v) => set({ requiredClueIds: v })} /></Field>
        <label className="flex items-center gap-2 text-xs md:col-span-2"><Switch checked={theory.isCorrect} onCheckedChange={(v) => set({ isCorrect: v })} />This is the correct theory</label>
        {both.length > 0 && <div className="text-[11px] text-amber md:col-span-2">{both.length} evidence item(s) both support and contradict this theory.</div>}
      </div>
    </Panel>
  );
}

function TheoriesTab() {
  const { bundle, update } = useCaseDraft();
  const [del, setDel] = useState<Theory | null>(null);
  const add = () => update((b) => ({ ...b, theories: [...b.theories, { id: uid("th"), name: "New theory", killerId: "", motive: "", method: "", supportingEvidenceIds: [], contradictingEvidenceIds: [], requiredClueIds: [], isCorrect: false }] }));
  const correct = bundle.theories.filter((t) => t.isCorrect).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Theories players can form during the investigation. {correct !== 1 && bundle.theories.length > 0 && <span className="text-amber">Expected exactly one correct theory, found {correct}.</span>}</p>
        <Button size="sm" onClick={add}><Plus className="size-3.5" />Add theory</Button>
      </div>
      {bundle.theories.length === 0 && <EmptyState icon={FlaskConical} title="No theories" body="Add the competing explanations players can weigh up." action={<Button size="sm" onClick={add}>Add theory</Button>} />}
      <div className="grid gap-4 2xl:grid-cols-2">
        {bundle.theories.map((t) => <TheoryCard key={t.id} theory={t} bundle={bundle} onSave={(x) => update((b) => ({ ...b, theories: replaceById(b.theories, x) }))} onDelete={() => setDel(t)} />)}
      </div>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete "${del?.name}"?`} description="This theory will be removed." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { update((b) => ({ ...b, theories: b.theories.filter((t) => t.id !== del.id) })); toast.success("Theory deleted"); } setDel(null); }} />
    </div>
  );
}

/* ───────────────────────── Hints ───────────────────────── */

function HintCard({ hint, index, count, bundle, onSave, onMove, onDelete }: { hint: Hint; index: number; count: number; bundle: CaseBundle; onSave: (h: Hint) => void; onMove: (d: -1 | 1) => void; onDelete: () => void }) {
  const set = (patch: Partial<Hint>) => onSave({ ...hint, ...patch });
  return (
    <Panel title={<span className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-muted font-mono text-[10px]">{index + 1}</span>Hint</span>}
      actions={
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="size-7" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7 text-crimson" onClick={onDelete} aria-label="Delete hint"><Trash2 className="size-3.5" /></Button>
        </div>
      }>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Hint text" className="md:col-span-2"><Textarea rows={2} value={hint.text} onChange={(e) => set({ text: e.target.value })} /></Field>
        <Field label="Hint cost (tokens)"><Input type="number" min={0} value={hint.cost} onChange={(e) => set({ cost: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <Field label="Score penalty"><Input type="number" min={0} value={hint.scorePenalty} onChange={(e) => set({ scorePenalty: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <div className="space-y-2 md:col-span-2">
          <label className="flex items-center gap-2 text-xs"><Switch checked={!!hint.unlockCondition} onCheckedChange={(v) => set({ unlockCondition: v ? emptyGroup() : undefined })} />Only available once conditions are met</label>
          {hint.unlockCondition && <ConditionBuilder value={hint.unlockCondition} bundle={bundle} onChange={(g) => set({ unlockCondition: g })} />}
        </div>
      </div>
    </Panel>
  );
}

function HintsTab() {
  const { bundle, update } = useCaseDraft();
  const [del, setDel] = useState<Hint | null>(null);
  const hints = useMemo(() => [...bundle.hints].sort((a, b) => a.order - b.order), [bundle.hints]);
  const renumber = (list: Hint[]) => list.map((h, i) => ({ ...h, order: i + 1 }));
  const add = () => update((b) => ({ ...b, hints: renumber([...hints, { id: uid("hint"), order: 0, text: "", cost: 1, scorePenalty: 50 }]) }));
  const move = (i: number, d: -1 | 1) => {
    const next = hints.slice();
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    update((b) => ({ ...b, hints: renumber(next) }));
  };
  const totalPenalty = hints.reduce((t, h) => t + h.scorePenalty, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{hints.length} hints · using all costs {totalPenalty} points (max score {bundle.solution.scoring.maxScore}).</p>
        <Button size="sm" onClick={add}><Plus className="size-3.5" />Add hint</Button>
      </div>
      {hints.length === 0 && <EmptyState icon={Lightbulb} title="No hints" body="Hints nudge stuck players at the cost of score." action={<Button size="sm" onClick={add}>Add hint</Button>} />}
      <div className="grid gap-4 2xl:grid-cols-2">
        {hints.map((h, i) => <HintCard key={h.id} hint={h} index={i} count={hints.length} bundle={bundle} onSave={(x) => update((b) => ({ ...b, hints: replaceById(b.hints, x) }))} onMove={(d) => move(i, d)} onDelete={() => setDel(h)} />)}
      </div>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Delete this hint?" description="The remaining hints are renumbered." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { update((b) => ({ ...b, hints: renumber(hints.filter((h) => h.id !== del.id)) })); toast.success("Hint deleted"); } setDel(null); }} />
    </div>
  );
}

/* ───────────────────────── Scoring ───────────────────────── */

const SCORE_FIELDS: Array<{ key: keyof ScoringConfig; label: string; hint?: string }> = [
  { key: "maxScore", label: "Maximum score" },
  { key: "correctKiller", label: "Correct killer" },
  { key: "correctMotive", label: "Correct motive" },
  { key: "correctMethod", label: "Correct method" },
  { key: "timelineAccuracy", label: "Timeline accuracy (max)" },
  { key: "perRequiredEvidence", label: "Per required evidence" },
  { key: "timeBonusUnderMinutes", label: "Time bonus under (minutes)" },
  { key: "timeBonus", label: "Time bonus" },
  { key: "wrongAccusationPenalty", label: "Wrong accusation penalty" },
];

function ScoringTab() {
  const { bundle, update } = useCaseDraft();
  const sc = bundle.solution.scoring;
  const setScoring = (patch: Partial<ScoringConfig>) => update((b) => ({ ...b, solution: { ...b.solution, scoring: { ...b.solution.scoring, ...patch } } }));

  const [acc, setAcc] = useState<Accusation>({ killerId: bundle.solution.killerId, motive: bundle.solution.motive, method: bundle.solution.method, evidenceIds: bundle.solution.requiredEvidenceIds, timelineOrder: bundle.solution.correctTimelineIds });
  const [hintPenalty, setHintPenalty] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const result = useMemo(() => scoreAccusation(bundle, acc, hintPenalty, minutes), [bundle, acc, hintPenalty, minutes]);

  const reachable = sc.correctKiller + sc.correctMotive + sc.correctMethod + sc.timelineAccuracy + sc.perRequiredEvidence * bundle.solution.requiredEvidenceIds.length + sc.timeBonus;
  const pct = result.max > 0 ? Math.round((result.total / result.max) * 100) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Scoring configuration" icon={Gauge}>
        <div className="grid grid-cols-2 gap-3">
          {SCORE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input type="number" min={0} value={sc[f.key]} onChange={(e) => setScoring({ [f.key]: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          A perfect run is worth {reachable} points{reachable > sc.maxScore ? <span className="text-amber"> — above the cap of {sc.maxScore}, so the extra is lost.</span> : reachable < sc.maxScore ? <span className="text-amber"> — below the cap of {sc.maxScore}, so the maximum is unreachable.</span> : "."}
        </div>
      </Panel>
      <Panel title="Live preview — simulate an accusation" icon={FlaskConical}>
        <div className="grid gap-3">
          <Field label="Accused">
            <Select value={acc.killerId} onValueChange={(v) => setAcc({ ...acc, killerId: v })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{bundle.suspects.filter((x) => x.role !== "victim").map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Motive"><Input value={acc.motive} onChange={(e) => setAcc({ ...acc, motive: e.target.value })} /></Field>
            <Field label="Method"><Input value={acc.method} onChange={(e) => setAcc({ ...acc, method: e.target.value })} /></Field>
          </div>
          <Field label="Evidence presented"><MultiPicker placeholder="Add evidence…" options={bundle.evidence.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` }))} value={acc.evidenceIds} onChange={(v) => setAcc({ ...acc, evidenceIds: v })} /></Field>
          <Field label="Timeline order">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAcc({ ...acc, timelineOrder: bundle.solution.correctTimelineIds })}>Correct</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAcc({ ...acc, timelineOrder: [...bundle.solution.correctTimelineIds].reverse() })}>Reversed</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAcc({ ...acc, timelineOrder: [] })}>None</Button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minutes taken"><Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))} /></Field>
            <Field label="Hint penalty used"><Input type="number" min={0} value={hintPenalty} onChange={(e) => setHintPenalty(Math.max(0, Number(e.target.value) || 0))} /></Field>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-baseline justify-between">
              <span className="label-caps">Score</span>
              <span className={cn("font-display text-2xl font-semibold tabular", result.correct ? "text-success" : "text-crimson")}>{result.total}<span className="text-sm text-muted-foreground"> / {result.max}</span></span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"><div className={cn("h-full", result.correct ? "bg-success" : "bg-crimson")} style={{ width: `${pct}%` }} /></div>
            <ul className="mt-3 space-y-1 text-xs">
              {result.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.label}</span><span className={cn("font-mono", l.points < 0 ? "text-crimson" : "text-success")}>{l.points > 0 ? "+" : ""}{l.points}</span></li>)}
              {result.lines.length === 0 && <li className="text-muted-foreground">No points awarded.</li>}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── Section ───────────────────────── */

export function SolutionSection() {
  const { bundle } = useCaseDraft();
  return (
    <div className="p-6">
      <Tabs defaultValue="answer">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Solution</h2>
          <TabsList>
            <TabsTrigger value="answer">Answer</TabsTrigger>
            <TabsTrigger value="theories">Theories <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{bundle.theories.length}</span></TabsTrigger>
            <TabsTrigger value="hints">Hints <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{bundle.hints.length}</span></TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="answer"><AnswerTab /></TabsContent>
        <TabsContent value="theories"><TheoriesTab /></TabsContent>
        <TabsContent value="hints"><HintsTab /></TabsContent>
        <TabsContent value="scoring"><ScoringTab /></TabsContent>
      </Tabs>
    </div>
  );
}
