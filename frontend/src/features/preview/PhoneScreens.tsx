import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronRight, Eye, Fingerprint, Lightbulb, Lock, MessageCircle, Search, User, X, ZoomIn } from "lucide-react";
import { evaluate } from "@/services/conditionEngine";
import { collectFromHotspot, completeStage, hotspotStatus, isInterviewOpen, isLocationOpen, unmetRequirements, walkDialogue, type DialogueLine, type DialogueStop, type PreviewState } from "@/services/previewEngine";
import { cn } from "@/lib/utils";
import type { CaseBundle, Evidence, Hotspot, Interview } from "@/types";

export interface Ctx {
  bundle: CaseBundle;
  state: PreviewState;
  getState: () => PreviewState;
  commit: (fn: (s: PreviewState) => PreviewState) => void;
  showHidden: boolean;
}

const btn = "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black active:scale-95 disabled:opacity-40";
const ghostBtn = "rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 active:scale-95 disabled:opacity-40";

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div className="max-h-[80%] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#161b22] p-4 text-white animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end"><button onClick={onClose} aria-label="Close" className="text-white/60"><X className="size-4" /></button></div>
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── Scene ───────────────────────── */

export function SceneScreen({ ctx, sceneId, onSceneChange }: { ctx: Ctx; sceneId: string; onSceneChange: (id: string) => void }) {
  const { bundle, state, commit, showHidden } = ctx;
  const [picked, setPicked] = useState<Hotspot | null>(null);
  const scenes = [...bundle.scenes].sort((a, b) => a.order - b.order);
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];

  useEffect(() => { if (scene) commit((s) => (s.locationsVisited.includes(scene.locationId) ? s : { ...s, locationsVisited: [...s.locationsVisited, scene.locationId] })); }, [scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!scene) return <Empty text="This case has no scenes yet." />;

  const tap = (h: Hotspot) => {
    const status = hotspotStatus(h, state);
    if (status === "open" || showHidden) {
      commit((s) => collectFromHotspot(bundle, s, h));
      if (h.evidenceId && !state.evidence.includes(h.evidenceId)) {
        const e = bundle.evidence.find((x) => x.id === h.evidenceId);
        if (e) toast.success(`Evidence found: ${e.name}`);
      }
    }
    setPicked(h);
  };

  const picks = picked && (hotspotStatus(picked, state) === "open" || showHidden);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
        {scenes.map((s) => {
          const open = isLocationOpen(bundle, s.locationId, state) || showHidden;
          return (
            <button key={s.id} disabled={!open} onClick={() => onSceneChange(s.id)} className={cn("flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs", s.id === scene.id ? "bg-amber-500 text-black" : "bg-white/10 text-white/70", !open && "opacity-40")}>
              {!open && <Lock className="size-3" />}{s.name}
            </button>
          );
        })}
      </div>
      <div className="relative mx-3 overflow-hidden rounded-xl border border-white/10">
        <img src={scene.image} alt={scene.name} className="aspect-[4/3] w-full object-cover" />
        {scene.hotspots.map((h) => {
          const status = hotspotStatus(h, state);
          if (status === "hidden" && !showHidden) return null;
          const found = (!!h.evidenceId && state.evidence.includes(h.evidenceId)) || (!h.evidenceId && !!h.clueId && state.clues.includes(h.clueId));
          return (
            <button key={h.id} onClick={() => tap(h)} aria-label={h.name} style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className={cn("absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-white backdrop-blur-sm", found ? "border-emerald-400 bg-emerald-500/40" : status === "open" ? "animate-pulse border-amber-300 bg-amber-400/30" : "border-white/40 bg-black/40", status === "hidden" && "border-dashed")}>
              {status === "locked" || status === "needs_item" ? <Lock className="size-3.5" /> : found ? <CheckCircle2 className="size-4" /> : <Search className="size-3.5" />}
            </button>
          );
        })}
      </div>
      <p className="px-4 pt-3 text-xs text-white/60">{scene.description}</p>
      <p className="px-4 pt-1 text-[11px] text-white/40">Tap the markers to investigate.</p>

      {picked && (
        <Sheet onClose={() => setPicked(null)}>
          <h3 className="text-base font-semibold">{picks ? picked.name : hotspotStatus(picked, state) === "needs_item" ? "You need something first" : "Locked"}</h3>
          {picks ? (
            <>
              <p className="mt-2 text-sm text-white/80">{picked.initialInfo || picked.description}</p>
              {picked.detailedInfo && <p className="mt-2 text-sm text-white/60">{picked.detailedInfo}</p>}
              {picked.evidenceId && <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400"><Fingerprint className="size-3.5" />Added to evidence: {bundle.evidence.find((e) => e.id === picked.evidenceId)?.name}</p>}
            </>
          ) : (
            <p className="mt-2 text-sm text-white/60">
              {hotspotStatus(picked, state) === "needs_item" ? `This needs ${bundle.evidence.find((e) => e.id === picked.requiredItemId)?.name ?? "a specific item"}.` : "Keep investigating — something else will unlock this."}
            </p>
          )}
        </Sheet>
      )}
    </div>
  );
}

/* ───────────────────────── Evidence ───────────────────────── */

export function EvidenceScreen({ ctx }: { ctx: Ctx }) {
  const { bundle, state, commit } = ctx;
  const [openId, setOpenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ src: string; title: string } | null>(null);
  const items = bundle.evidence.filter((e) => state.evidence.includes(e.id));
  const open = bundle.evidence.find((e) => e.id === openId);

  if (open) {
    return (
      <div className="h-full overflow-y-auto pb-4">
        <button onClick={() => setOpenId(null)} className="flex items-center gap-1 px-4 py-3 text-sm text-white/70"><ArrowLeft className="size-4" />Evidence</button>
        {open.image && <img src={open.image} alt={open.name} className="mx-4 aspect-video w-[calc(100%-2rem)] rounded-xl object-cover" />}
        <div className="px-4 pt-3"><h2 className="text-lg font-semibold">{open.name}</h2><p className="mt-1 text-sm text-white/70">{open.description}</p></div>
        <div className="space-y-2 px-4 pt-4">
          {open.inspections.map((st, si) => {
            const done = state.stagesDone.includes(st.id);
            const unmet = unmetRequirements(open, si, state).map(({ req, index }) => ({ r: req, ri: index }));
            const ready = unmet.length === 0;
            return (
              <div key={st.id} className={cn("rounded-xl border p-3", done ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/5")}>
                <div className="flex items-center justify-between"><span className="text-sm font-medium">Stage {st.stage} · {st.title}</span>{done ? <CheckCircle2 className="size-4 text-emerald-400" /> : !ready && <Lock className="size-3.5 text-white/40" />}</div>
                {done && <p className="mt-1.5 text-sm text-white/70">{st.description}</p>}
                {done && st.image && (
                  <button onClick={() => setZoom({ src: st.image!, title: st.title })} className="relative mt-2 block w-full overflow-hidden rounded-lg border border-white/10" aria-label={`Zoom in: ${st.title}`}>
                    <img src={st.image} alt={st.title} className="aspect-video w-full object-cover" />
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px]"><ZoomIn className="size-3" />Zoom</span>
                  </button>
                )}
                {!done && !ready && (
                  <ul className="mt-1.5 space-y-1 text-xs text-white/50">
                    {unmet.map(({ r, ri }) => (
                      <li key={ri} className="flex items-center justify-between gap-2">
                        <span>Requires: {r.label}</span>
                        {r.kind === "player_action" && <button className="rounded bg-white/10 px-2 py-0.5 text-white" onClick={() => commit((s) => ({ ...s, actionsDone: [...s.actionsDone, `${st.id}:${ri}`] }))}>Do it</button>}
                      </li>
                    ))}
                  </ul>
                )}
                {!done && ready && <button className={cn(btn, "mt-2 w-full")} onClick={() => commit((s) => completeStage(s, open, si))}>Inspect</button>}
              </div>
            );
          })}
          {open.inspections.length === 0 && <p className="text-sm text-white/50">Nothing more to learn from this item.</p>}
        </div>
        {zoom && (
          <div className="absolute inset-0 z-30 flex flex-col bg-black/95" onClick={() => setZoom(null)}>
            <div className="flex items-center justify-between px-4 py-3 text-sm"><span>{zoom.title}</span><button aria-label="Close" onClick={() => setZoom(null)}><X className="size-4" /></button></div>
            <div className="grid flex-1 place-items-center p-3"><img src={zoom.src} alt={zoom.title} className="max-h-full max-w-full rounded-lg object-contain" /></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      {items.length === 0 && <Empty text="No evidence yet. Search the scene." />}
      <div className="grid grid-cols-2 gap-2">
        {items.map((e) => (
          <button key={e.id} onClick={() => setOpenId(e.id)} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
            {e.image ? <img src={e.image} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-white/10" />}
            <div className="p-2"><div className="truncate text-xs font-medium">{e.name}</div><div className="text-[10px] text-white/40">{e.inspections.filter((s) => state.stagesDone.includes(s.id)).length}/{e.inspections.length} inspected</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── People & interviews ───────────────────────── */

/** Pause before a line appears, so answers feel like a conversation instead of a wall of text. */
const LINE_DELAY = { npc: 950, player: 400, system: 500 } as const;

function InterviewView({ ctx, interview, onExit }: { ctx: Ctx; interview: Interview; onExit: () => void }) {
  const { bundle, commit, getState } = ctx;
  const [lines, setLines] = useState<DialogueLine[]>([]);
  const [shown, setShown] = useState(0);
  const [stop, setStop] = useState<DialogueStop | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const suspect = bundle.suspects.find((s) => s.id === interview.suspectId);
  const speaker = suspect?.name.split(" ")[0] ?? "They";

  const apply = (step: ReturnType<typeof walkDialogue>, extra: DialogueLine[] = []) => {
    commit(() => step.state);
    setLines((l) => [...l, ...extra, ...step.lines]);
    setStop(step.stop);
  };
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    const start = interview.nodes.find((n) => n.type === "start");
    if (start) apply(walkDialogue(bundle, interview, start.id, getState()));
    else setStop({ type: "dead" });
  }, [interview.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const typing = shown < lines.length;
  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setShown((n) => n + 1), LINE_DELAY[lines[shown]!.kind]);
    return () => clearTimeout(t);
  }, [shown, lines, typing]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [shown, stop]);

  const owned = bundle.evidence.filter((e) => getState().evidence.includes(e.id));
  const present = (id: string) => {
    if (stop?.type !== "present") return;
    const name = bundle.evidence.find((e) => e.id === id)?.name ?? "evidence";
    const intro: DialogueLine = { kind: "system", text: `You present: ${name}` };
    if (stop.evidenceId && stop.evidenceId !== id) setLines((l) => [...l, intro, { kind: "npc", speaker, text: "I don't see what that has to do with anything." }]);
    else apply(walkDialogue(bundle, interview, stop.nodeId, getState(), true, stop.menuId), [intro]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onClick={onExit} aria-label="Back"><ArrowLeft className="size-4" /></button>
        {suspect?.portrait && <img src={suspect.portrait} alt="" className="size-7 rounded-full object-cover" />}
        <div className="text-sm font-medium">{interview.title}</div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" onClick={() => setShown(lines.length)}>
        {lines.slice(0, shown).map((l, i) => (
          <div key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-200", l.kind === "player" ? "ml-auto bg-amber-500 text-black" : l.kind === "system" ? "mx-auto max-w-full bg-transparent text-center text-xs italic text-sky-300" : "bg-white/10", l.contradiction && "ring-1 ring-red-400/60")}>
            {l.kind === "npc" && l.speaker && <div className="mb-0.5 text-[10px] uppercase tracking-wide text-white/40">{l.speaker}{l.reaction ? ` · ${l.reaction.emotion}` : ""}</div>}
            {l.text}
          </div>
        ))}
        {typing && lines[shown]!.kind === "npc" && <div className="w-fit rounded-2xl bg-white/10 px-3 py-2 text-sm tracking-widest text-white/50 animate-pulse" aria-label="Typing">•••</div>}
        <div ref={bottom} />
      </div>
      <div className="max-h-[55%] space-y-1.5 overflow-y-auto border-t border-white/10 p-3">
        {!typing && stop?.type === "choices" && [...stop.options].filter((o) => !o.locked || ctx.showHidden).sort((x, y) => Number(x.asked) - Number(y.asked)).map((o) => ( // locked questions stay hidden until a clue or answer unlocks them; new ones first
          <button key={o.nodeId} disabled={o.locked} onClick={() => apply(walkDialogue(bundle, interview, o.nodeId, getState(), false, stop.menuId))} className={cn(ghostBtn, "flex w-full items-center justify-between text-left", o.asked && "text-white/50")}>
            <span>{o.label}</span>{o.locked ? <Lock className="size-3.5" /> : !o.asked && !o.label.startsWith("That's all") ? <span className="rounded bg-amber-500 px-1.5 text-[10px] font-semibold text-black">New</span> : o.asked ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <ChevronRight className="size-3.5" />}
          </button>
        ))}
        {!typing && stop?.type === "present" && (
          <>
            <p className="text-center text-xs text-white/50">Choose evidence to present</p>
            {owned.map((e) => <button key={e.id} className={cn(ghostBtn, "flex w-full items-center gap-2 text-left")} onClick={() => present(e.id)}>{e.image && <img src={e.image} alt="" className="size-8 rounded object-cover" />}{e.name}</button>)}
            {owned.length === 0 && <p className="text-center text-xs text-white/40">You have no evidence to present yet.</p>}
            {stop.menuId && <button className={cn(ghostBtn, "w-full")} onClick={() => apply(walkDialogue(bundle, interview, stop.menuId!, getState(), true, stop.menuId))}>Not now</button>}
          </>
        )}
        {!typing && stop?.type === "end" && <button className={cn(btn, "w-full")} onClick={onExit}>Finish interview</button>}
        {!typing && stop?.type === "dead" && <div className="space-y-2 text-center text-xs text-white/50"><p>The conversation goes quiet. Come back with more evidence.</p><button className={ghostBtn} onClick={onExit}>Leave</button></div>}
      </div>
    </div>
  );
}

export function PeopleScreen({ ctx, jumpInterviewId }: { ctx: Ctx; jumpInterviewId?: string | null }) {
  const { bundle, state, showHidden } = ctx;
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  useEffect(() => { if (jumpInterviewId) setInterviewId(jumpInterviewId); }, [jumpInterviewId]);

  const interview = bundle.interviews.find((i) => i.id === interviewId);
  if (interview) return <InterviewView key={interview.id + (jumpInterviewId ?? "")} ctx={ctx} interview={interview} onExit={() => setInterviewId(null)} />;

  const profile = bundle.suspects.find((s) => s.id === profileId);
  if (profile) {
    const ivs = bundle.interviews.filter((i) => i.suspectId === profile.id);
    return (
      <div className="h-full overflow-y-auto pb-4">
        <button onClick={() => setProfileId(null)} className="flex items-center gap-1 px-4 py-3 text-sm text-white/70"><ArrowLeft className="size-4" />People</button>
        <div className="flex gap-3 px-4">
          {profile.portrait ? <img src={profile.portrait} alt={profile.name} className="h-28 w-24 rounded-xl object-cover" /> : <div className="grid h-28 w-24 place-items-center rounded-xl bg-white/10"><User /></div>}
          <div><h2 className="text-lg font-semibold">{profile.name}</h2><p className="text-xs text-white/60">{profile.age} · {profile.occupation}</p><p className="mt-1 text-xs text-white/60">{profile.relationship}</p></div>
        </div>
        <div className="space-y-3 px-4 pt-4 text-sm">
          <p className="text-white/80">{profile.publicInfo}</p>
          <div><div className="text-[10px] uppercase tracking-wide text-white/40">Their story</div><p className="text-white/70">{profile.claim}</p></div>
          {showHidden && profile.hiddenInfo.length > 0 && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200"><div className="mb-1 font-semibold">Debug · hidden info</div>{profile.hiddenInfo.map((h, i) => <p key={i}>• {h}</p>)}</div>}
          <div className="space-y-1.5 pt-1">
            {ivs.map((i) => {
              const open = isInterviewOpen(i, state) || showHidden;
              return (
                <button key={i.id} disabled={!open} onClick={() => setInterviewId(i.id)} className={cn(ghostBtn, "flex w-full items-center justify-between")}>
                  <span className="flex items-center gap-2"><MessageCircle className="size-4" />{i.title}</span>
                  {state.interviewsCompleted.includes(i.id) ? <CheckCircle2 className="size-4 text-emerald-400" /> : !open ? <Lock className="size-3.5" /> : <ChevronRight className="size-4" />}
                </button>
              );
            })}
            {ivs.length === 0 && <p className="text-xs text-white/40">No interviews available.</p>}
          </div>
        </div>
      </div>
    );
  }

  const people = bundle.suspects.filter((s) => s.role !== "victim" && s.role !== "investigator");
  return (
    <div className="h-full space-y-2 overflow-y-auto p-3">
      {people.map((s) => (
        <button key={s.id} onClick={() => setProfileId(s.id)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left">
          {s.portrait ? <img src={s.portrait} alt="" className="size-14 rounded-lg object-cover" /> : <div className="grid size-14 place-items-center rounded-lg bg-white/10"><User /></div>}
          <div className="min-w-0 flex-1"><div className="text-sm font-medium">{s.name}</div><div className="truncate text-xs text-white/50">{s.occupation}</div></div>
          {state.suspectsInterviewed.includes(s.id) && <CheckCircle2 className="size-4 text-emerald-400" />}
          <ChevronRight className="size-4 text-white/30" />
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Notes (clues + hints) & timeline ───────────────────────── */

export function NotesScreen({ ctx }: { ctx: Ctx }) {
  const { bundle, state, commit, showHidden } = ctx;
  const clues = bundle.clues.filter((c) => state.clues.includes(c.id));
  const hints = [...bundle.hints].sort((a, b) => a.order - b.order);
  const nextHint = hints.find((h) => !state.hintsUsed.includes(h.id));
  const usable = !!nextHint && (evaluate(nextHint.unlockCondition, state) || showHidden);
  const used = hints.filter((h) => state.hintsUsed.includes(h.id));

  return (
    <div className="h-full space-y-4 overflow-y-auto p-3">
      <section>
        <h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Clues · {clues.length}/{bundle.clues.length}</h3>
        {clues.length === 0 && <Empty text="No clues discovered yet." />}
        <div className="space-y-1.5">
          {clues.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{c.title}</span><span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] capitalize text-white/60">{c.category.replace("_", " ")}</span></div>
              <p className="mt-1 text-xs text-white/60">{c.description}</p>
              {showHidden && c.isRedHerring && <p className="mt-1 text-[10px] text-amber-300">Debug · red herring</p>}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-white/40">Hints</h3>
        {used.map((h) => <div key={h.id} className="mb-1.5 flex gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-xs"><Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-300" />{h.text}</div>)}
        {nextHint ? (
          <button disabled={!usable} className={cn(ghostBtn, "w-full")} onClick={() => commit((s) => ({ ...s, hintsUsed: [...s.hintsUsed, nextHint.id] }))}>
            {usable ? `Use a hint (−${nextHint.scorePenalty} points)` : "No hint available right now"}
          </button>
        ) : hints.length > 0 ? <p className="text-xs text-white/40">No more hints.</p> : <p className="text-xs text-white/40">This case has no hints.</p>}
      </section>
    </div>
  );
}

export function TimelineScreen({ ctx }: { ctx: Ctx }) {
  const { bundle, state, showHidden } = ctx;
  const events = useMemo(() => [...bundle.timeline].sort((a, b) => a.correctOrder - b.correctOrder), [bundle.timeline]);
  const shown = events.filter((e) => e.visibility === "visible" || state.timelineDiscovered.includes(e.id) || showHidden);
  return (
    <div className="h-full overflow-y-auto p-3">
      {shown.length === 0 && <Empty text="No timeline events known yet." />}
      <ol className="relative space-y-2 border-l border-white/15 pl-4">
        {shown.map((e) => (
          <li key={e.id} className="relative rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="absolute -left-[21px] top-3 size-2.5 rounded-full bg-amber-400" />
            <div className="flex items-center gap-2 text-xs"><span className="font-mono text-amber-300">{e.time}</span>{e.isClaim && <span className="rounded bg-sky-400/20 px-1.5 text-[10px] text-sky-300">claim</span>}{showHidden && e.isClaim && !e.isTrue && <span className="rounded bg-red-400/20 px-1.5 text-[10px] text-red-300">false</span>}</div>
            <div className="text-sm font-medium">{e.title}</div>
            <p className="text-xs text-white/60">{e.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="grid place-items-center px-6 py-10 text-center text-xs text-white/40"><Eye className="mb-2 size-5" />{text}</div>;
}

export { btn as phoneBtn, ghostBtn as phoneGhostBtn };
