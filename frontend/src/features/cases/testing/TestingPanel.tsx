import { useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, Lock, LockOpen, RotateCcw, Unlock, Zap } from "lucide-react";
import { useCaseDraft } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { describe, emptyPlayerState, evaluate, type PlayerState } from "@/services/conditionEngine";
import { scoreAccusation } from "@/services/scoring";
import { cn } from "@/lib/utils";
import type { CaseBundle, ConditionGroup, TriggerActionKind } from "@/types";

type ListKey = Exclude<keyof PlayerState, "progress" | "choices">;

interface StateGroup { key: ListKey; label: string; items: Array<{ id: string; label: string }> }

const stateGroups = (b: CaseBundle): StateGroup[] => [
  { key: "evidence", label: "Evidence found", items: b.evidence.map((e) => ({ id: e.id, label: `${e.code} · ${e.name}` })) },
  { key: "clues", label: "Clues discovered", items: b.clues.map((c) => ({ id: c.id, label: `${c.code} · ${c.title}` })) },
  { key: "interviewsCompleted", label: "Interviews completed", items: b.interviews.map((i) => ({ id: i.id, label: `${i.code} · ${i.title}` })) },
  { key: "suspectsInterviewed", label: "Suspects interviewed", items: b.suspects.filter((s) => s.role !== "victim").map((s) => ({ id: s.id, label: s.name })) },
  { key: "locationsVisited", label: "Locations visited", items: b.locations.map((l) => ({ id: l.id, label: l.name })) },
  { key: "timelineDiscovered", label: "Timeline events found", items: b.timeline.map((t) => ({ id: t.id, label: `${t.time} · ${t.title}` })) },
  { key: "questionsAnswered", label: "Questions answered", items: b.interviews.flatMap((i) => i.nodes.filter((n) => n.type === "question").map((n) => ({ id: n.id, label: `${i.code} · ${n.text}` }))) },
];

/** What a fired trigger unlocks, by action kind. */
const UNLOCKS: Partial<Record<TriggerActionKind, "interviews" | "locations" | "clues" | "timeline" | "questions">> = {
  unlock_interview: "interviews", unlock_location: "locations", unlock_clue: "clues", reveal_contradiction: "clues", unlock_timeline_event: "timeline", unlock_question: "questions",
};

function Status({ open, children }: { open: boolean; children?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px]", open ? "text-success" : "text-muted-foreground")}>
      {open ? <LockOpen className="size-3" /> : <Lock className="size-3" />}{children ?? (open ? "Available" : "Locked")}
    </span>
  );
}

function Row({ open, title, sub, why }: { open: boolean; title: React.ReactNode; sub?: React.ReactNode; why?: string }) {
  return (
    <li className={cn("flex items-start justify-between gap-3 py-1.5", !open && "opacity-70")}>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium">{title}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        {!open && why && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">needs {why}</div>}
      </div>
      <Status open={open} />
    </li>
  );
}

export function TestingPanel() {
  const { bundle } = useCaseDraft();
  const [state, setState] = useState<PlayerState>(emptyPlayerState);
  const groups = useMemo(() => stateGroups(bundle), [bundle]);
  const [accused, setAccused] = useState(bundle.solution.killerId);
  const [motive, setMotive] = useState(bundle.solution.motive);
  const [method, setMethod] = useState(bundle.solution.method);
  const [minutes, setMinutes] = useState(30);

  const toggle = (key: ListKey, id: string) => setState((s) => ({ ...s, [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id] }));
  const unlockAll = () => setState((s) => ({ ...s, ...Object.fromEntries(groups.map((g) => [g.key, g.items.map((i) => i.id)])), progress: 100 }));

  const check = (cond: ConditionGroup | undefined) => evaluate(cond, state);

  const firedTriggers = bundle.triggers.filter((t) => t.enabled && check(t.condition));
  const unlockedByTrigger = useMemo(() => {
    const out: Record<"interviews" | "locations" | "clues" | "timeline" | "questions", Set<string>> = { interviews: new Set(), locations: new Set(), clues: new Set(), timeline: new Set(), questions: new Set() };
    for (const t of firedTriggers) for (const a of t.actions) { const k = UNLOCKS[a.kind]; if (k && a.targetId) out[k].add(a.targetId); }
    return out;
  }, [firedTriggers]);

  const score = useMemo(
    () => scoreAccusation(bundle, { killerId: accused, motive, method, evidenceIds: state.evidence, timelineOrder: state.timelineDiscovered.length ? bundle.solution.correctTimelineIds.filter((id) => state.timelineDiscovered.includes(id)) : [] }, 0, minutes),
    [bundle, accused, motive, method, state.evidence, state.timelineDiscovered, minutes],
  );
  const missingRequired = bundle.solution.requiredEvidenceIds.filter((id) => !state.evidence.includes(id));
  const empty = Object.values(state).every((v) => (Array.isArray(v) ? v.length === 0 : v === 0));

  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[360px_1fr]">
      <Panel title="Simulated player" icon={FlaskConical} actions={
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={unlockAll}><Unlock className="size-3" />All</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setState(emptyPlayerState())} disabled={empty}><RotateCcw className="size-3" />Reset</Button>
        </div>
      } className="h-fit xl:sticky xl:top-28">
        <div className="space-y-4">
          <Field label={`Case progress · ${state.progress}%`}>
            <Slider min={0} max={100} step={5} value={[state.progress]} onValueChange={([v]) => setState((s) => ({ ...s, progress: v ?? 0 }))} />
          </Field>
          {groups.map((g) => (
            <details key={g.key} open={g.key === "evidence" || g.key === "clues"} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium">
                {g.label}<span className="font-mono text-[10px] text-muted-foreground">{state[g.key].length}/{g.items.length}</span>
              </summary>
              <ul className="mt-1.5 max-h-48 space-y-0.5 overflow-y-auto pr-1">
                {g.items.length === 0 && <li className="text-[11px] text-muted-foreground">None defined.</li>}
                {g.items.map((it) => (
                  <li key={it.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-0.5 text-[11px] hover:bg-accent">
                      <input type="checkbox" className="mt-0.5" checked={state[g.key].includes(it.id)} onChange={() => toggle(g.key, it.id)} />
                      <span>{it.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title={`Triggers · ${firedTriggers.length}/${bundle.triggers.length} firing`} icon={Zap}>
          <ul className="divide-y divide-border">
            {bundle.triggers.length === 0 && <li className="py-2 text-xs text-muted-foreground">No triggers defined.</li>}
            {bundle.triggers.map((t) => {
              const fired = t.enabled && check(t.condition);
              return (
                <li key={t.id} className={cn("py-2", !fired && "opacity-70")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{t.name}</span>
                    {!t.enabled ? <Pill>Disabled</Pill> : fired ? <Pill tone="success"><CheckCircle2 className="size-2.5" />Firing</Pill> : <Pill>Waiting</Pill>}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">{describe(t.condition, bundle)}</div>
                  {fired && <div className="mt-1 flex flex-wrap gap-1">{t.actions.map((a) => <Pill key={a.id} tone="amber">{a.label || a.kind.replace(/_/g, " ")}</Pill>)}</div>}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="grid gap-5 2xl:grid-cols-2">
          <Panel title="Hotspots">
            <div className="space-y-3">
              {bundle.scenes.map((sc) => (
                <div key={sc.id}>
                  <div className="label-caps mb-0.5">{sc.name}</div>
                  <ul className="divide-y divide-border">
                    {sc.hotspots.map((h) => {
                      const needsItem = !!h.requiredItemId && !state.evidence.includes(h.requiredItemId);
                      const condOk = check(h.unlockCondition);
                      const open = condOk && !needsItem;
                      const why = needsItem ? `item ${bundle.evidence.find((e) => e.id === h.requiredItemId)?.code ?? h.requiredItemId}` : describe(h.unlockCondition, bundle);
                      return <Row key={h.id} open={open} title={h.name} sub={<span className="capitalize">{h.type} · {h.discoveryState.replace("_", " ")}</span>} why={why} />;
                    })}
                    {sc.hotspots.length === 0 && <li className="py-1.5 text-[11px] text-muted-foreground">No hotspots.</li>}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>
          <div className="space-y-5">
            <Panel title="Interviews">
              <ul className="divide-y divide-border">
                {bundle.interviews.map((i) => {
                  const viaTrigger = unlockedByTrigger.interviews.has(i.id);
                  const open = i.unlockedByDefault || check(i.unlockCondition) || viaTrigger;
                  return <Row key={i.id} open={open} title={`${i.code} · ${i.title}`} sub={viaTrigger && !i.unlockedByDefault ? "Unlocked by a trigger" : undefined} why={describe(i.unlockCondition, bundle)} />;
                })}
              </ul>
            </Panel>
            <Panel title="Locations">
              <ul className="divide-y divide-border">
                {bundle.locations.map((l) => {
                  const viaTrigger = unlockedByTrigger.locations.has(l.id);
                  const open = l.unlockedByDefault || check(l.unlockCondition) || viaTrigger;
                  return <Row key={l.id} open={open} title={l.name} sub={viaTrigger && !l.unlockedByDefault ? "Unlocked by a trigger" : undefined} why={describe(l.unlockCondition, bundle)} />;
                })}
              </ul>
            </Panel>
            <Panel title="Hints">
              <ul className="divide-y divide-border">
                {[...bundle.hints].sort((a, b) => a.order - b.order).map((h) => <Row key={h.id} open={check(h.unlockCondition)} title={`Hint ${h.order}`} sub={h.text} why={describe(h.unlockCondition, bundle)} />)}
                {bundle.hints.length === 0 && <li className="py-1.5 text-[11px] text-muted-foreground">No hints.</li>}
              </ul>
            </Panel>
          </div>
        </div>

        <Panel title="Test accusation">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Accuse">
              <Select value={accused} onValueChange={setAccused}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{bundle.suspects.filter((s) => s.role !== "victim").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Minutes taken"><Input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))} /></Field>
            <Field label="Motive"><Input value={motive} onChange={(e) => setMotive(e.target.value)} /></Field>
            <Field label="Method"><Input value={method} onChange={(e) => setMethod(e.target.value)} /></Field>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Uses the evidence and timeline events ticked on the left. {missingRequired.length > 0 ? `${missingRequired.length} required evidence item(s) not found yet.` : "All required evidence found."}</p>
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-baseline justify-between">
              <span className={cn("text-xs font-medium", score.correct ? "text-success" : "text-crimson")}>{score.correct ? "Correct accusation" : "Wrong accusation"}</span>
              <span className="font-display text-xl font-semibold tabular">{score.total}<span className="text-sm text-muted-foreground"> / {score.max}</span></span>
            </div>
            <ul className="mt-2 space-y-0.5 text-xs">
              {score.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.label}</span><span className={cn("font-mono", l.points < 0 ? "text-crimson" : "text-success")}>{l.points > 0 ? "+" : ""}{l.points}</span></li>)}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}
