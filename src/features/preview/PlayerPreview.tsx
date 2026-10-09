import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Bug, Clock, Gavel, MapPin, NotebookPen, RotateCcw, Search, Trophy, Users, Fingerprint } from "lucide-react";
import { useCaseBundle } from "@/hooks/queries";
import { applyTriggers, initialPreviewState, unlockEverything, type PreviewState } from "@/services/previewEngine";
import { scoreAccusation, type ScoreBreakdown } from "@/services/scoring";
import { ErrorState } from "@/components/common/Page";
import { Skeleton } from "@/components/ui/skeleton";
import { STORAGE_KEYS } from "@/constants/config";
import { cn } from "@/lib/utils";
import { EvidenceScreen, NotesScreen, PeopleScreen, SceneScreen, TimelineScreen, phoneBtn, phoneGhostBtn, type Ctx } from "./PhoneScreens";
import type { CaseBundle } from "@/types";

type Tab = "scene" | "evidence" | "people" | "notes" | "timeline" | "accuse";
type Phase = "briefing" | "play" | "result" | "reveal";

const TABS: Array<{ key: Tab; label: string; icon: typeof Search }> = [
  { key: "scene", label: "Scene", icon: MapPin },
  { key: "evidence", label: "Evidence", icon: Fingerprint },
  { key: "people", label: "People", icon: Users },
  { key: "notes", label: "Notes", icon: NotebookPen },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "accuse", label: "Accuse", icon: Gavel },
];

const storageKey = (caseId: string) => `${STORAGE_KEYS.previewProgress}.${caseId}`;
function loadState(caseId: string): PreviewState | null {
  try { const raw = window.localStorage.getItem(storageKey(caseId)); return raw ? { ...initialPreviewState(), ...(JSON.parse(raw) as Partial<PreviewState>) } : null; } catch { return null; }
}

/* ───────────────────────── Accusation ───────────────────────── */

function AccuseScreen({ ctx, onSubmit }: { ctx: Ctx; onSubmit: (score: ScoreBreakdown) => void }) {
  const { bundle, state } = ctx;
  const suspects = bundle.suspects.filter((s) => s.role === "suspect" || s.role === "witness");
  const motives = useMemo(() => [...new Set([bundle.solution.motive, ...bundle.theories.map((t) => t.motive)].filter(Boolean))].sort(), [bundle]);
  const methods = useMemo(() => [...new Set([bundle.solution.method, ...bundle.theories.map((t) => t.method)].filter(Boolean))].sort(), [bundle]);
  const known = bundle.timeline.filter((t) => state.timelineDiscovered.includes(t.id) || t.visibility === "visible").filter((t) => !t.isClaim);

  const [killerId, setKillerId] = useState("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(() => known.map((t) => t.id));
  const evidence = bundle.evidence.filter((e) => state.evidence.includes(e.id));

  const move = (i: number, d: -1 | 1) => setOrder((o) => { const n = o.slice(); const j = i + d; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });
  const hintPenalty = bundle.hints.filter((h) => state.hintsUsed.includes(h.id)).reduce((t, h) => t + h.scorePenalty, 0);
  const submit = () => onSubmit(scoreAccusation(bundle, { killerId, motive, method, evidenceIds, timelineOrder: order }, hintPenalty, Math.round((Date.now() - state.startedAt) / 60000)));

  const Choice = ({ value, current, set, children }: { value: string; current: string; set: (v: string) => void; children: React.ReactNode }) => (
    <button onClick={() => set(value)} className={cn("w-full rounded-lg border px-3 py-2 text-left text-sm", current === value ? "border-amber-400 bg-amber-400/15" : "border-white/10 bg-white/5")}>{children}</button>
  );

  return (
    <div className="h-full space-y-5 overflow-y-auto p-3 pb-6">
      <section><h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Who did it?</h3>
        <div className="space-y-1.5">{suspects.map((s) => <Choice key={s.id} value={s.id} current={killerId} set={setKillerId}>{s.name}</Choice>)}</div></section>
      <section><h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Why?</h3>
        <div className="space-y-1.5">{motives.map((m) => <Choice key={m} value={m} current={motive} set={setMotive}>{m}</Choice>)}</div></section>
      <section><h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">How?</h3>
        <div className="space-y-1.5">{methods.map((m) => <Choice key={m} value={m} current={method} set={setMethod}>{m}</Choice>)}</div></section>
      <section><h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Proof · {evidenceIds.length} selected</h3>
        {evidence.length === 0 && <p className="text-xs text-white/40">You haven't found any evidence.</p>}
        <div className="space-y-1.5">{evidence.map((e) => (
          <label key={e.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"><input type="checkbox" checked={evidenceIds.includes(e.id)} onChange={() => setEvidenceIds((l) => (l.includes(e.id) ? l.filter((x) => x !== e.id) : [...l, e.id]))} />{e.name}</label>
        ))}</div></section>
      <section><h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Put the events in order</h3>
        {order.length === 0 && <p className="text-xs text-white/40">No timeline events known yet.</p>}
        <ol className="space-y-1.5">{order.map((id, i) => {
          const t = bundle.timeline.find((x) => x.id === id);
          return (
            <li key={id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
              <span className="w-4 font-mono text-white/40">{i + 1}</span><span className="flex-1">{t?.title}</span>
              <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
              <button aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
            </li>
          );
        })}</ol></section>
      <button className={cn(phoneBtn, "w-full")} disabled={!killerId} onClick={submit}>Make accusation</button>
      {hintPenalty > 0 && <p className="text-center text-[11px] text-white/40">Hints used: −{hintPenalty} points</p>}
    </div>
  );
}

/* ───────────────────────── Reveal ───────────────────────── */

function RevealScreen({ bundle, onDone }: { bundle: CaseBundle; onDone: () => void }) {
  const scenes = useMemo(() => [...bundle.reveal].sort((a, b) => a.order - b.order), [bundle.reveal]);
  const [i, setI] = useState(0);
  const finished = i >= scenes.length;
  const scene = scenes[i];

  useEffect(() => {
    if (!scene) return;
    const t = setTimeout(() => setI((n) => n + 1), scene.durationSec * 1000);
    return () => clearTimeout(t);
  }, [scene]);

  if (finished) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 p-5 text-center">
        <h2 className="text-xl font-semibold">Case closed</h2>
        <p className="text-sm text-white/70">{bundle.solution.explanation || `${bundle.suspects.find((s) => s.id === bundle.solution.killerId)?.name ?? "The killer"} — ${bundle.solution.motive}.`}</p>
        <button className={phoneBtn} onClick={onDone}>Finish</button>
      </div>
    );
  }
  const cls = { cut: "", fade: "animate-in fade-in duration-700", dissolve: "animate-in fade-in zoom-in-95 duration-1000", slide: "animate-in slide-in-from-right duration-500" }[scene!.transition];
  return (
    <button className="relative h-full w-full text-left" onClick={() => setI((n) => n + 1)} aria-label="Next scene">
      <div key={scene!.id} className={cn("absolute inset-0", cls)}>
        {scene!.image && <img src={scene!.image} alt="" className="size-full object-cover opacity-70" />}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent p-5 pt-16">
          <div className="font-mono text-xs text-amber-300">{scene!.time}</div>
          <div className="text-lg font-semibold">{scene!.title}</div>
          <p className="mt-1 text-sm text-white/80">{scene!.text}</p>
          <div className="mt-3 text-[10px] text-white/40">Tap to skip · {i + 1}/{scenes.length}</div>
        </div>
      </div>
    </button>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export function PlayerPreview({ caseId }: { caseId: string }) {
  const { data: bundle, isLoading, error, refetch } = useCaseBundle(caseId);
  if (isLoading) return <div className="grid min-h-screen place-items-center bg-background"><Skeleton className="h-[760px] w-[380px] rounded-[2.5rem]" /></div>;
  if (error || !bundle) return <div className="p-6"><ErrorState message="Could not load this case" onRetry={() => void refetch()} /></div>;
  return <Preview bundle={bundle} />;
}

function Preview({ bundle }: { bundle: CaseBundle }) {
  const caseId = bundle.case.id;
  const [state, setState] = useState<PreviewState>(() => loadState(caseId) ?? initialPreviewState());
  const stateRef = useRef(state);
  const resumed = useRef(state.evidence.length + state.clues.length > 0);
  const [phase, setPhase] = useState<Phase>(resumed.current ? "play" : "briefing");
  const [tab, setTab] = useState<Tab>("scene");
  const [sceneId, setSceneId] = useState(() => [...bundle.scenes].sort((a, b) => a.order - b.order)[0]?.id ?? "");
  const [showHidden, setShowHidden] = useState(false);
  const [jumpInterview, setJumpInterview] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreBreakdown | null>(null);

  useEffect(() => { try { window.localStorage.setItem(storageKey(caseId), JSON.stringify(state)); } catch { /* storage unavailable */ } }, [state, caseId]);

  const commit = useCallback((fn: (s: PreviewState) => PreviewState) => {
    const { state: next, notifications } = applyTriggers(bundle, fn(stateRef.current));
    stateRef.current = next;
    setState(next);
    notifications.forEach((n) => toast(n));
  }, [bundle]);
  const getState = useCallback(() => stateRef.current, []);
  const ctx: Ctx = { bundle, state, getState, commit, showHidden };

  const restart = () => {
    const fresh = initialPreviewState();
    stateRef.current = fresh;
    setState(fresh);
    setResult(null);
    setTab("scene");
    setPhase("briefing");
    try { window.localStorage.removeItem(storageKey(caseId)); } catch { /* storage unavailable */ }
  };

  const c = bundle.case;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        {/* Phone */}
        <div className="relative h-[780px] w-[380px] shrink-0 overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-800 bg-[#0d1117] text-white shadow-2xl">
          <div className="absolute left-1/2 top-0 z-30 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-neutral-800" aria-hidden />
          {phase === "briefing" && (
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="relative h-72 shrink-0">
                <img src={c.coverImage} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-[#0d1117] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5"><div className="font-mono text-[11px] text-amber-300">{c.code} · {c.type}</div><h1 className="text-2xl font-bold leading-tight">{c.title}</h1><p className="text-sm text-white/60">{c.tagline}</p></div>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <p className="text-white/80">{c.story}</p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs"><div className="text-[10px] uppercase tracking-wide text-white/40">Victim</div><div className="font-medium">{c.victim.name}, {c.victim.age}</div><div className="text-white/60">{c.victim.occupation}</div></div>
                {c.objectives.length > 0 && <ul className="space-y-1 text-xs text-white/70">{c.objectives.map((o, i) => <li key={i} className="flex gap-2"><span className="text-amber-300">▸</span>{o}</li>)}</ul>}
                <div className="text-xs text-white/40">~{c.estimatedMinutes[0]}–{c.estimatedMinutes[1]} min · {c.difficulty}</div>
                <button className={cn(phoneBtn, "w-full")} onClick={() => { stateRef.current = { ...stateRef.current, startedAt: Date.now() }; setPhase("play"); }}>Begin investigation</button>
              </div>
            </div>
          )}
          {phase === "play" && (
            <div className="flex h-full flex-col pt-6">
              <div className="flex items-center justify-between px-4 pb-1 pt-2"><span className="truncate text-sm font-semibold">{c.title}</span><span className="font-mono text-[11px] text-white/50">{state.progress}%</span></div>
              <div className="relative min-h-0 flex-1">
                {tab === "scene" && <SceneScreen ctx={ctx} sceneId={sceneId} onSceneChange={setSceneId} />}
                {tab === "evidence" && <EvidenceScreen ctx={ctx} />}
                {tab === "people" && <PeopleScreen ctx={ctx} jumpInterviewId={jumpInterview} />}
                {tab === "notes" && <NotesScreen ctx={ctx} />}
                {tab === "timeline" && <TimelineScreen ctx={ctx} />}
                {tab === "accuse" && <AccuseScreen ctx={ctx} onSubmit={(r) => { setResult(r); setPhase("result"); }} />}
              </div>
              <nav className="grid grid-cols-6 border-t border-white/10 bg-[#0b0f14]">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => { setJumpInterview(null); setTab(key); }} className={cn("flex flex-col items-center gap-0.5 py-2 text-[9px]", tab === key ? "text-amber-400" : "text-white/45")} aria-current={tab === key}>
                    <Icon className="size-4" />{label}
                  </button>
                ))}
              </nav>
            </div>
          )}
          {phase === "result" && result && (
            <div className="flex h-full flex-col justify-center gap-4 overflow-y-auto p-5">
              <div className="text-center">
                <Trophy className={cn("mx-auto size-9", result.correct ? "text-amber-400" : "text-white/30")} />
                <h2 className="mt-2 text-xl font-semibold">{result.correct ? "You solved it!" : "Not quite…"}</h2>
                <div className="mt-1 text-4xl font-bold tabular-nums">{result.total}<span className="text-base font-normal text-white/40"> / {result.max}</span></div>
              </div>
              <ul className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                {result.lines.map((l, i) => <li key={i} className="flex justify-between"><span className="text-white/70">{l.label}</span><span className={cn("font-mono", l.points < 0 ? "text-red-400" : "text-emerald-400")}>{l.points > 0 ? "+" : ""}{l.points}</span></li>)}
              </ul>
              {result.correct
                ? <button className={phoneBtn} onClick={() => setPhase("reveal")}>See what really happened</button>
                : <button className={phoneBtn} onClick={() => { setPhase("play"); setTab("notes"); }}>Keep investigating</button>}
            </div>
          )}
          {phase === "reveal" && <RevealScreen bundle={bundle} onDone={() => { setPhase("briefing"); restart(); }} />}
        </div>

        {/* Debug panel */}
        <aside className="w-full max-w-sm space-y-4 rounded-md border border-border bg-card p-4 text-sm shadow-panel lg:w-72">
          <div className="flex items-center gap-2 font-semibold"><Bug className="size-4 text-amber" />Debug controls</div>
          <div className="grid grid-cols-2 gap-2">
            <button className={cn(phoneGhostBtn, "text-foreground")} onClick={restart}><RotateCcw className="mr-1 inline size-3.5" />Restart</button>
            <button className={cn(phoneGhostBtn, "text-foreground")} onClick={() => { setPhase("play"); commit((s) => unlockEverything(bundle, s)); toast.success("Everything unlocked"); }}>Unlock all</button>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />Show hidden content and secrets</label>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="jump-scene">Jump to scene</label>
            <select id="jump-scene" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" value={sceneId} onChange={(e) => { setSceneId(e.target.value); setPhase("play"); setTab("scene"); }}>
              {bundle.scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="jump-int">Jump to interview</label>
            <select id="jump-int" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" value="" onChange={(e) => { if (!e.target.value) return; setJumpInterview(e.target.value); setPhase("play"); setTab("people"); }}>
              <option value="">Choose…</option>
              {bundle.interviews.map((i) => <option key={i.id} value={i.id}>{i.code} · {i.title}</option>)}
            </select>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
            <dt>Evidence</dt><dd className="text-right text-foreground">{state.evidence.length}/{bundle.evidence.length}</dd>
            <dt>Clues</dt><dd className="text-right text-foreground">{state.clues.length}/{bundle.clues.length}</dd>
            <dt>Interviews</dt><dd className="text-right text-foreground">{state.interviewsCompleted.length}/{bundle.interviews.length}</dd>
            <dt>Triggers fired</dt><dd className="text-right text-foreground">{state.firedTriggers.length}/{bundle.triggers.length}</dd>
            <dt>Hints used</dt><dd className="text-right text-foreground">{state.hintsUsed.length}</dd>
          </dl>
          <Link to="/cases/$caseId" params={{ caseId }} className="flex items-center gap-1.5 text-xs text-info hover:underline"><ArrowLeft className="size-3.5" />Exit to editor</Link>
        </aside>
      </div>
    </div>
  );
}
