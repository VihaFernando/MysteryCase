import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronRight, Eye, Fingerprint, Flashlight, GitCompareArrows, Lightbulb, Link2, Lock, MessageCircle, Radar, Search, Sparkles, SprayCan, User, X, ZoomIn } from "lucide-react";
import { evaluate } from "@/services/conditionEngine";
import {
  BRUSH_NEEDED, TORCH_BEAM, UV_BEAM, beamStrength, strokeOn, childrenOf, choiceOpen, chooseApproach, compareEvidence, compareKey, completeStage, composure, evidenceLocked, findDetail, flagLine, hasLock, hearTestimony,
  hotspotAt, hotspotStatus, isInterviewOpen, isLocationOpen, isSceneOpen, judgeStatement, patienceOf, refusesChallenges, searchHotspot, statementResolved, statementsOf, tryDeduction, tryLock,
  unmetRequirements, walkDialogue, type DialogueLine, type DialogueStop, type PreviewState, type Verdict,
} from "@/services/previewEngine";
import { cn } from "@/lib/utils";
import type { CaseBundle, Evidence, Hotspot, Interview, SearchTool, StatementReply } from "@/types";

export interface Ctx {
  bundle: CaseBundle;
  state: PreviewState;
  getState: () => PreviewState;
  commit: (fn: (s: PreviewState) => PreviewState) => void;
  showHidden: boolean;
}

const btn = "rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black active:scale-95 disabled:opacity-40";
const ghostBtn = "rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 active:scale-95 disabled:opacity-40";
const label = "text-[10px] uppercase tracking-wide text-white/40";

/** Runs a state change and announces any notes it produced. */
function useLearn({ bundle, commit, getState }: Ctx) {
  return (fn: (s: PreviewState) => PreviewState) => {
    const before = getState().clues;
    commit(fn);
    getState().clues.filter((c) => !before.includes(c)).forEach((c) => toast(`Noted: ${bundle.clues.find((x) => x.id === c)?.title}`));
  };
}

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

/* ───────────────────────── Search surface (rooms and evidence close-ups) ───────────────────────── */

type Tool = SearchTool | undefined;
interface Target { id: string; x: number; y: number; radius?: number; tool?: Tool; label: string }
const TOOLS: Array<{ tool: Tool; name: string; icon: typeof Eye; hint: string }> = [
  { tool: undefined, name: "Look", icon: Eye, hint: "Tap what catches your eye. In the dark, drag to sweep your torch." },
  { tool: "uv", name: "UV lamp", icon: Sparkles, hint: "Sweep the beam in the dark. Wiped stains glow inside it; tap one to photograph it." },
  { tool: "powder", name: "Powder", icon: SprayCan, hint: "Hold and brush back and forth over smooth surfaces until a print develops." },
];

function ToolBar({ tool, onTool, tools = TOOLS.map((t) => t.tool) }: { tool: Tool; onTool: (t: Tool) => void; tools?: Tool[] }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Search tool">
      {TOOLS.filter((t) => tools.includes(t.tool)).map(({ tool: t, name, icon: Icon }) => (
        <button key={name} role="radio" aria-checked={tool === t} onClick={() => onTool(t)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]", tool === t ? (t === "uv" ? "bg-violet-500 text-white" : "bg-amber-500 text-black") : "bg-white/10 text-white/70")}>
          <Icon className="size-3" />{name}
        </button>
      ))}
    </div>
  );
}

/**
 * An image the player searches by hand. Nothing is marked until it is found, and each tool is used differently:
 * Look: tap what catches the eye (a torch sweeps dark rooms). UV lamp: sweep a violet beam in the dark; stains glow only inside it, tap one to photograph it.
 * Powder: hold and brush back and forth over a smooth surface until a print develops.
 */
function SearchSurface({ image, alt, targets, found, tool, dark, scan, onHit, className }: { image: string; alt: string; targets: Target[]; found: string[]; tool: Tool; dark?: boolean | undefined; scan?: boolean; onHit: (id: string) => void; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [last, setLast] = useState<{ x: number; y: number } | null>(null); // previous brush point while the pointer is down
  const [dust, setDust] = useState<Array<{ x: number; y: number; k: number }>>([]);
  const [rub, setRub] = useState<Record<string, number>>({});
  const [miss, setMiss] = useState<{ x: number; y: number; n: number } | null>(null);
  const live = targets.filter((t) => found.includes(t.id) || t.tool === tool);
  const todo = live.filter((t) => !found.includes(t.id));
  const point = (e: React.PointerEvent | React.MouseEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, aspect: r.height / r.width };
  };
  const brush = (p: { x: number; y: number; aspect: number }, from: { x: number; y: number }) => {
    setDust((d) => [...d.slice(-40), { x: p.x, y: p.y, k: performance.now() }]);
    const next = { ...rub };
    let done: string | undefined;
    for (const t of todo) {
      const add = strokeOn(t, from, p, p.aspect);
      if (!add) continue;
      next[t.id] = (next[t.id] ?? 0) + add;
      if (next[t.id]! >= BRUSH_NEEDED) done = t.id;
    }
    setRub(next);
    if (done) { setDust([]); onHit(done); }
  };
  const down = (e: React.PointerEvent) => {
    const p = point(e);
    setPos(p);
    if (tool !== "powder") return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setLast(p);
    setDust((d) => [...d.slice(-40), { x: p.x, y: p.y, k: performance.now() }]);
  };
  const move = (e: React.PointerEvent) => {
    const p = point(e);
    setPos(p);
    if (tool === "powder" && last) { brush(p, last); setLast(p); }
  };
  const click = (e: React.MouseEvent) => {
    if (tool === "powder") return; // powder only works by brushing
    const p = point(e);
    const hit = hotspotAt(live.map((t) => ({ ...t, tool })), tool, p.x, p.y, p.aspect);
    if (hit) onHit(hit.id);
    else setMiss({ x: p.x, y: p.y, n: (miss?.n ?? 0) + 1 });
  };

  const w = box.current?.clientWidth ?? 360;
  const h = box.current?.clientHeight ?? 270;
  const aspect = h / w;
  const night = !!dark || tool === "uv";
  const beam = tool === "uv" ? UV_BEAM : TORCH_BEAM;
  const beamPx = (w * beam) / 100;
  const at = pos ? { px: (pos.x / 100) * w, py: (pos.y / 100) * h } : null;
  const near = (t: Target) => scan || (!!pos && Math.hypot(t.x - pos.x, (t.y - pos.y) * aspect) < 20);
  return (
    <div ref={box} className={cn("relative touch-none select-none overflow-hidden", tool === "uv" ? "cursor-crosshair" : tool === "powder" && "cursor-cell", className)}
      onPointerDown={down} onPointerMove={move} onPointerUp={() => setLast(null)} onPointerCancel={() => setLast(null)} onPointerLeave={() => { setPos(null); setLast(null); }} onClick={click}>
      <img src={image} alt={alt} draggable={false} className="size-full object-cover" />
      {night && <div className="pointer-events-none absolute inset-0" style={{ background: at ? `radial-gradient(circle ${beamPx}px at ${at.px}px ${at.py}px, transparent 0, transparent 55%, rgba(3,3,14,.96) 100%)` : "rgba(3,3,14,.96)" }} />}
      {tool === "uv" && at && <div className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: `radial-gradient(circle ${beamPx}px at ${at.px}px ${at.py}px, rgba(139,92,246,.55), rgba(139,92,246,0) 75%)` }} />}
      {night && !pos && <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-white/60"><span className="flex items-center gap-1.5"><Flashlight className="size-4" />{tool === "uv" ? "Drag to sweep the UV lamp" : "Drag to sweep your torch"}</span></div>}
      {tool === "powder" && dust.map((d) => <span key={d.k} className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 blur-[1px]" style={{ left: `${d.x}%`, top: `${d.y}%` }} />)}
      {tool === "powder" && todo.filter((t) => rub[t.id]).map((t) => (
        // a print developing under the dust: it only shows once you have brushed that spot
        <span key={t.id} className="pointer-events-none absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${t.x}%`, top: `${t.y}%`, opacity: Math.min(1, (rub[t.id] ?? 0) / BRUSH_NEEDED), background: "repeating-radial-gradient(ellipse at 50% 55%, rgba(255,255,255,.85) 0 1.5px, transparent 1.5px 4px)", maskImage: "radial-gradient(circle, #000 35%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 35%, transparent 70%)" }} />
      ))}
      {tool === "uv" && todo.map((t) => (
        <span key={t.id} className="pointer-events-none absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen" style={{ left: `${t.x}%`, top: `${t.y}%`, opacity: scan ? 1 : beamStrength(t, pos, UV_BEAM, aspect), background: "radial-gradient(circle, rgba(200,255,90,.95), rgba(200,255,90,0) 70%)" }} />
      ))}
      {live.map((t) => found.includes(t.id)
        ? <span key={t.id} className="pointer-events-none absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-emerald-400 bg-emerald-500/40" style={{ left: `${t.x}%`, top: `${t.y}%` }}><CheckCircle2 className="size-3.5" /></span>
        : !tool && near(t) && <span key={t.id} className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-amber-200" style={{ left: `${t.x}%`, top: `${t.y}%` }} />)}
      {miss && <span key={miss.n} className="pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-white/40 [animation-iteration-count:1]" style={{ left: `${miss.x}%`, top: `${miss.y}%` }} />}
      {/* keyboard and screen-reader route: unnamed until found, so it gives nothing away */}
      <div className="sr-only">{live.map((t, i) => <button key={t.id} onClick={(e) => { e.stopPropagation(); onHit(t.id); }}>{found.includes(t.id) ? t.label : `Examine spot ${i + 1}`}</button>)}</div>
    </div>
  );
}

/* ───────────────────────── Scene ───────────────────────── */

export function SceneScreen({ ctx, sceneId, onSceneChange }: { ctx: Ctx; sceneId: string; onSceneChange: (id: string) => void }) {
  const { bundle, state, commit, getState, showHidden } = ctx;
  const [tool, setTool] = useState<Tool>(undefined);
  const [picked, setPicked] = useState<Hotspot | null>(null);
  const [code, setCode] = useState("");
  const [scan, setScan] = useState(false);
  const scenes = [...bundle.scenes].sort((a, b) => a.order - b.order);
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];

  useEffect(() => { if (scene) commit((s) => (s.locationsVisited.includes(scene.locationId) ? s : { ...s, locationsVisited: [...s.locationsVisited, scene.locationId] })); }, [scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!scan) return; const t = setTimeout(() => setScan(false), 2500); return () => clearTimeout(t); }, [scan]);
  if (!scene) return <Empty text="This case has no scenes yet." />;

  const locations = bundle.locations.filter((l) => scenes.some((s) => s.locationId === l.id));
  const rooms = scenes.filter((s) => s.locationId === scene.locationId);
  const sceneOpen = (s: typeof scene) => isSceneOpen(bundle, s, state) || showHidden;
  const present = scene.hotspots.filter((h) => hotspotStatus(h, state) !== "hidden" || showHidden);
  const surface = present.filter((h) => !h.parentId);
  const left = present.filter((h) => !state.found.includes(h.id)).length;

  const open = (h: Hotspot) => {
    setCode("");
    setPicked(h);
    if (hotspotStatus(h, getState()) !== "open" || hasLock(h, getState())) return;
    const before = getState();
    commit((s) => searchHotspot(bundle, s, h));
    if (h.evidenceId && !before.evidence.includes(h.evidenceId)) toast.success(`Evidence: ${bundle.evidence.find((x) => x.id === h.evidenceId)?.name}`);
    if (h.clueId && !before.clues.includes(h.clueId)) toast(`Noted: ${bundle.clues.find((x) => x.id === h.clueId)?.title}`);
  };
  const unlock = () => {
    if (!picked || !tryLock(picked, code)) return void toast.error("The dial does not give.");
    commit((s) => ({ ...s, opened: [...s.opened, picked.id] }));
    open(picked);
  };
  const status = picked && hotspotStatus(picked, state);
  const parent = picked?.parentId ? scene.hotspots.find((h) => h.id === picked.parentId) : undefined;

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-3">
      <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pt-2">
        {locations.map((l) => {
          const ok = isLocationOpen(bundle, l.id, state) || showHidden;
          const first = scenes.find((s) => s.locationId === l.id && sceneOpen(s));
          return (
            <button key={l.id} disabled={!ok || !first} onClick={() => first && onSceneChange(first.id)} className={cn("flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs", l.id === scene.locationId ? "bg-amber-500 text-black" : "bg-white/10 text-white/70", !ok && "opacity-40")}>
              {!ok && <Lock className="size-3" />}{l.name}
            </button>
          );
        })}
      </div>
      {rooms.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pt-1.5">
          {rooms.map((s) => (
            <button key={s.id} disabled={!sceneOpen(s)} onClick={() => onSceneChange(s.id)} className={cn("flex shrink-0 items-center gap-1 border-b-2 px-2 py-1 text-xs", s.id === scene.id ? "border-amber-400 text-white" : "border-transparent text-white/50", !sceneOpen(s) && "opacity-40")}>
              {!sceneOpen(s) && <Lock className="size-3" />}{s.name}
            </button>
          ))}
        </div>
      )}
      <SearchSurface key={scene.id} className="mx-3 mt-2 aspect-[4/3] shrink-0 rounded-xl border border-white/10" image={scene.image} alt={scene.name} dark={scene.dark} tool={tool} scan={scan}
        targets={surface.map((h) => ({ id: h.id, x: h.x, y: h.y, radius: h.radius, tool: h.tool, label: h.name }))} found={state.found} onHit={(hid) => open(scene.hotspots.find((h) => h.id === hid)!)} />
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <ToolBar tool={tool} onTool={setTool} />
        <span className="shrink-0 font-mono text-[11px] text-white/50">{left === 0 ? "Room cleared" : `${left} left`}</span>
      </div>
      <p className="px-4 pt-2 text-xs text-white/60">{scene.description}</p>
      <p className="px-4 pt-1 text-[11px] text-white/40">{TOOLS.find((t) => t.tool === tool)!.hint}</p>
      {left > 0 && <button className={cn(ghostBtn, "mx-3 mt-2 flex shrink-0 items-center justify-center gap-1.5 text-xs")} onClick={() => { commit((s) => ({ ...s, mistakes: s.mistakes + 1 })); setScan(true); }}><Radar className="size-3.5" />Ask the scene tech where to look (−10)</button>}

      {picked && (
        <Sheet onClose={() => setPicked(null)}>
          {parent && <button className="mb-2 flex items-center gap-1 text-xs text-white/50" onClick={() => setPicked(parent)}><ArrowLeft className="size-3" />{parent.name}</button>}
          <h3 className="text-base font-semibold">{picked.name}</h3>
          {status !== "open" && !showHidden ? (
            <p className="mt-2 text-sm text-white/60">{status === "needs_item" ? `This needs ${bundle.evidence.find((e) => e.id === picked.requiredItemId)?.name ?? "a specific item"}.` : "You can't get into this yet."}</p>
          ) : hasLock(picked, state) ? (
            <form className="mt-2 space-y-2" onSubmit={(e) => { e.preventDefault(); unlock(); }}>
              <p className="text-sm text-white/70">{picked.lock!.prompt}</p>
              <input autoFocus inputMode="numeric" aria-label="Combination" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-center font-mono text-lg tracking-[0.5em]" />
              <button className={cn(btn, "w-full")}>Try it</button>
            </form>
          ) : (
            <>
              <p className="mt-2 text-sm text-white/80">{picked.initialInfo || picked.description}</p>
              {picked.detailedInfo && <p className="mt-2 text-sm text-white/60">{picked.detailedInfo}</p>}
              {picked.evidenceId && <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400"><Fingerprint className="size-3.5" />Bagged: {bundle.evidence.find((e) => e.id === picked.evidenceId)?.name}. Examine it under Evidence.</p>}
              {picked.clueId && <p className="mt-3 text-xs text-sky-300">Noted: {bundle.clues.find((c) => c.id === picked.clueId)?.title}</p>}
              <div className="mt-3 space-y-1.5">
                {childrenOf(scene, picked, state).map((c) => (
                  <button key={c.id} className={cn(ghostBtn, "flex w-full items-center justify-between text-left")} onClick={() => open(c)}>
                    <span>{state.found.includes(c.id) ? c.name : "Something here…"}</span>{state.found.includes(c.id) ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Search className="size-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}

/* ───────────────────────── Evidence ───────────────────────── */

/** Steps of hands-on examination an item offers, and how many are done. */
function examineProgress(e: Evidence, state: PreviewState) {
  const keys = [...(e.details ?? []).map((d) => d.id), ...(e.document?.key ?? []).map((k) => `${e.id}:${k.line}`), ...(e.compare ?? []).map((c) => compareKey(e.id, c.withEvidenceId))];
  return { done: keys.filter((k) => state.examined.includes(k)).length + e.inspections.filter((s) => state.stagesDone.includes(s.id)).length, total: keys.length + e.inspections.length };
}

/** Pick something from the case file: evidence and, optionally, notes. */
export function FilePicker({ ctx, title, clues = true, exclude, onPick, onClose }: { ctx: Ctx; title: string; clues?: boolean; exclude?: string; onPick: (id: string) => void; onClose: () => void }) {
  const { bundle, state } = ctx;
  return (
    <Sheet onClose={onClose}>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className={label}>Evidence</div>
      <div className="mt-1 space-y-1.5">
        {bundle.evidence.filter((e) => state.evidence.includes(e.id) && e.id !== exclude).map((e) => (
          <button key={e.id} className={cn(ghostBtn, "flex w-full items-center gap-2 text-left")} onClick={() => onPick(e.id)}>{e.image && <img src={e.image} alt="" className="size-8 rounded object-cover" />}{e.name}</button>
        ))}
      </div>
      {clues && <><div className={cn(label, "mt-3")}>Notes</div>
        <div className="mt-1 space-y-1.5">
          {bundle.clues.filter((c) => state.clues.includes(c.id)).map((c) => <button key={c.id} className={cn(ghostBtn, "w-full text-left")} onClick={() => onPick(c.id)}>{c.title}</button>)}
        </div></>}
    </Sheet>
  );
}

export function EvidenceScreen({ ctx }: { ctx: Ctx }) {
  const { bundle, state, commit } = ctx;
  const learn = useLearn(ctx);
  const [openId, setOpenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ src: string; title: string } | null>(null);
  const [tool, setTool] = useState<Tool>(undefined);
  const [comparing, setComparing] = useState(false);
  const items = bundle.evidence.filter((e) => state.evidence.includes(e.id));
  const open = bundle.evidence.find((e) => e.id === openId);

  if (open) {
    const locked = evidenceLocked(open, state) && !ctx.showHidden;
    const details = open.details ?? [];
    const flag = (line: number) => learn((s) => { const r = flagLine(s, open, line); if (!r.ok) toast.error("Nothing in that line. (−10)"); return r.state; });
    const compare = (other: string) => {
      setComparing(false);
      learn((s) => { const r = compareEvidence(bundle, s, open.id, other); if (!r.note) toast.error("They have nothing to say to each other. (−10)"); return r.state; });
    };
    const pairs = bundle.evidence.flatMap((e) => (e.compare ?? []).map((c) => ({ key: compareKey(e.id, c.withEvidenceId), ids: [e.id, c.withEvidenceId], note: c.note }))).filter((m) => m.ids.includes(open.id));
    return (
      <div className="h-full overflow-y-auto pb-4">
        <button onClick={() => { setOpenId(null); setTool(undefined); }} className="flex items-center gap-1 px-4 py-3 text-sm text-white/70"><ArrowLeft className="size-4" />Evidence</button>
        {open.image && (details.length && !locked
          ? <SearchSurface className="mx-4 aspect-video rounded-xl" image={open.image} alt={open.name} tool={tool} targets={details.map((d) => ({ ...d, radius: 10 }))} found={state.examined} onHit={(did) => learn((s) => findDetail(s, open, did))} />
          : <img src={open.image} alt={open.name} className="mx-4 aspect-video w-[calc(100%-2rem)] rounded-xl object-cover" />)}
        <div className="px-4 pt-3"><h2 className="text-lg font-semibold">{open.name}</h2><p className="mt-1 text-sm text-white/70">{open.description}</p></div>
        {locked ? <p className="mx-4 mt-3 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60"><Lock className="mt-0.5 size-4 shrink-0" />{open.lockedText ?? "You can't examine this yet."}</p> : (
          <div className="space-y-4 px-4 pt-4">
            {details.length > 0 && (
              <section>
                <div className="flex items-center justify-between"><span className={label}>Look it over · {details.filter((d) => state.examined.includes(d.id)).length}/{details.length}</span><ToolBar tool={tool} onTool={setTool} tools={[undefined, ...new Set(details.map((d) => d.tool))]} /></div>
                <ul className="mt-2 space-y-1.5">{details.filter((d) => state.examined.includes(d.id)).map((d) => <li key={d.id} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs"><span className="font-medium">{d.label}.</span> <span className="text-white/70">{d.note}</span></li>)}</ul>
              </section>
            )}
            {open.document && (
              <section>
                <span className={label}>Read it · tap the lines that matter</span>
                <ol className="mt-2 divide-y divide-black/10 overflow-hidden rounded-lg bg-[#f4ecd8] font-mono text-[11px] leading-snug text-neutral-900">
                  {open.document.lines.map((line, i) => {
                    const tried = state.examined.includes(`${open.id}:${i}`);
                    const key = open.document!.key.find((k) => k.line === i);
                    return (
                      <li key={i}>
                        <button disabled={tried} onClick={() => flag(i)} className={cn("block w-full px-2.5 py-1.5 text-left", tried && key && "bg-amber-300/70", tried && !key && "text-neutral-400 line-through")}>{line}</button>
                        {tried && key && <p className="bg-amber-100 px-2.5 pb-1.5 font-sans text-[11px] italic text-amber-900">{key.note}</p>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
            {pairs.length > 0 && (
              <section>
                {pairs.filter((m) => state.examined.includes(m.key)).map((m) => <p key={m.key} className="mb-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-white/80">{m.note}</p>)}
                <button className={cn(ghostBtn, "flex w-full items-center justify-center gap-1.5")} onClick={() => setComparing(true)}><GitCompareArrows className="size-4" />Hold it against another item</button>
              </section>
            )}
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
          </div>
        )}
        {comparing && <FilePicker ctx={ctx} title={`Compare ${open.name} with…`} clues={false} exclude={open.id} onPick={compare} onClose={() => setComparing(false)} />}
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
      {items.length === 0 && <Empty text="No evidence yet. Search the rooms." />}
      <div className="grid grid-cols-2 gap-2">
        {items.map((e) => {
          const p = examineProgress(e, state);
          return (
            <button key={e.id} onClick={() => setOpenId(e.id)} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
              {e.image ? <img src={e.image} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-white/10" />}
              <div className="p-2"><div className="truncate text-xs font-medium">{e.name}</div><div className={cn("text-[10px]", p.done < p.total ? "text-amber-300" : "text-white/40")}>{evidenceLocked(e, state) ? "Locked" : p.done < p.total ? "More to find" : "Examined"}</div></div>
            </button>
          );
        })}
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

/* ───────────────────────── Interrogation (ask, read the face, call it) ───────────────────────── */

type Emotion = NonNullable<StatementReply["emotion"]>;
/** One portrait, six faces: the image is posed with filters and motion until real expression art exists. */
const FACE: Record<Emotion, { img: string; veil: string; word: string }> = {
  calm: { img: "motion-safe:animate-[tell-breathe_5s_ease-in-out_infinite]", veil: "", word: "Composed" },
  nervous: { img: "motion-safe:animate-[tell-nervous_0.9s_ease-in-out_infinite]", veil: "bg-sky-300/10", word: "Uneasy" },
  defensive: { img: "scale-95 brightness-75 contrast-125", veil: "bg-black/25", word: "Guarded" },
  angry: { img: "saturate-150 contrast-125 motion-safe:animate-[tell-angry_1.4s_ease-in-out_infinite]", veil: "bg-red-600/25 mix-blend-multiply", word: "Angry" },
  sad: { img: "translate-y-1.5 rotate-1 grayscale-[.55] brightness-75", veil: "bg-blue-900/30", word: "Shaken" },
  relieved: { img: "brightness-110 saturate-110", veil: "bg-amber-200/10", word: "At ease" },
};

function Face({ src, emotion, name }: { src?: string | undefined; emotion: Emotion; name: string }) {
  const f = FACE[emotion];
  return (
    // Size is inline on purpose: the portrait must never be able to grow past its frame and push the conversation off the screen.
    <div className="relative shrink-0 overflow-hidden bg-black" style={{ height: 216, flex: "none" }} role="img" aria-label={`${name} looks ${f.word.toLowerCase()}`}>
      {src ? <img key={emotion} src={src} alt="" className={cn("absolute inset-0 size-full object-cover transition-[filter,transform] duration-500", f.img)} style={{ objectPosition: "50% 45%" }} /> : <div className="grid size-full place-items-center"><User className="size-10 text-white/30" /></div>}
      <div className={cn("pointer-events-none absolute inset-0 transition-colors duration-500", f.veil)} />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0d1117] via-transparent to-transparent" />
      <span className="absolute bottom-2 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80">{f.word}</span>
    </div>
  );
}

/** The detective's side of the table. */
function Asked({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-amber-500 px-3 py-2 text-sm text-black">{children}</p>
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-amber-400/60 bg-[#1b2330]" aria-hidden><Search className="size-4 text-amber-300" /></span>
    </div>
  );
}

function Answer({ who, r, caught }: { who: string; r: StatementReply; caught?: boolean }) {
  return (
    <div className={cn("max-w-[88%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-300", caught && "ring-1 ring-red-400/60")}>
      <div className="mb-0.5 text-[10px] uppercase tracking-wide text-white/40">{who}</div>{r.text}
    </div>
  );
}

function Interrogation({ ctx, interview, onExit }: { ctx: Ctx; interview: Interview; onExit: () => void }) {
  const { bundle, state, commit, getState } = ctx;
  const learn = useLearn(ctx);
  const [askedId, setAskedId] = useState<string | null>(null);
  const [proving, setProving] = useState(false);
  const [wrong, setWrong] = useState<Verdict | null>(null);
  const suspect = bundle.suspects.find((s) => s.id === interview.suspectId);
  const who = suspect?.name.split(" ")[0] ?? "They";
  useEffect(() => { commit((s) => hearTestimony(interview, s)); }, [interview.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const statements = statementsOf(interview, state);
  const st = statements.find((x) => x.id === askedId);
  const comp = composure(interview, state);
  const refuses = refusesChallenges(interview, state);
  const full = interview.patience ?? 3;
  const patience = refuses ? 0 : state.lockout[interview.id] !== undefined ? full : patienceOf(interview, state);
  const notebook = () => { setAskedId(null); setWrong(null); };

  const judge = (verdict: Verdict, itemId?: string) => {
    if (!st) return;
    setProving(false);
    const r = judgeStatement(interview, getState(), st, verdict, itemId);
    learn(() => r.state);
    setWrong(r.ok ? null : verdict);
    if (r.ok) toast.success(verdict === "truth" ? "Correct. They were telling the truth." : verdict === "doubt" ? "Correct. They were holding back." : "Correct. Caught in a lie.");
    else toast.error(refusesChallenges(interview, r.state) ? `Wrong call. ${who} is done being accused. Come back when you know more.` : "Wrong call. (−10)");
  };

  const exposed = !!st && state.exposed.includes(st.id);
  const heard = !!st && state.questionsAnswered.includes(st.id);
  const done = !!st && statementResolved(st, state);
  const chosen = st?.choices?.find((c) => state.choices.includes(c.id));
  const caught = st && exposed ? (st.exposed ?? st.doubt) : undefined;
  const emotion: Emotion = chosen?.emotion ?? caught?.emotion ?? (heard ? st?.press?.emotion : undefined) ?? st?.tell?.emotion ?? "calm";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onClick={st ? notebook : onExit} aria-label={st ? "Notebook" : "Back"}><ArrowLeft className="size-4" /></button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{interview.title}</div>
          <div className="flex items-center gap-3 text-[10px] text-white/50">
            <span className="flex items-center gap-1" aria-label={`Patience ${patience} of ${full}`}>Patience {Array.from({ length: full }, (_, i) => <span key={i} className={cn("size-1.5 rounded-full", i < patience ? "bg-amber-400" : "bg-white/15")} />)}</span>
            {comp.total > 0 && <span className="flex items-center gap-1" aria-label={`Composure ${comp.left} of ${comp.total}`}>Composure {Array.from({ length: comp.total }, (_, i) => <span key={i} className={cn("h-1.5 w-3 rounded-sm", i < comp.left ? "bg-sky-400" : "bg-red-500/60")} />)}</span>}
          </div>
        </div>
      </div>
      <Face src={suspect?.portrait} emotion={emotion} name={who} />

      {!st ? (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {interview.opening && <p className="text-sm italic text-white/60">"{interview.opening}"</p>}
          {refuses && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">{who} will not be accused of anything more tonight. Find something new and they will have to listen.</p>}
          <div className={cn(label, "pt-1")}>Your notebook</div>
          {statements.map((x) => (
            <button key={x.id} onClick={() => { setAskedId(x.id); setWrong(null); }} className={cn(ghostBtn, "flex w-full items-center justify-between gap-2 text-left", statementResolved(x, state) && "text-white/45")}>
              <span>{x.ask ?? "Go on."}</span>
              {statementResolved(x, state) ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" /> : <ChevronRight className="size-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            <Asked>{st.ask ?? "Go on."}</Asked>
            <Answer who={who} r={{ text: st.text }} />
            {st.tell && <p className="px-1 text-xs italic text-white/50">{st.tell.text}</p>}
            {heard && st.press && <><Asked>{st.press.question}</Asked><Answer who={who} r={st.press} /></>}
            {caught && <Answer who={who} r={caught} caught />}
            {chosen && <><Asked>{chosen.label}</Asked><Answer who={who} r={chosen} /></>}
            {wrong && !done && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">{wrong === "truth" ? `You took ${who} at their word, and they relaxed. Something in that answer does not hold.` : `"${interview.rebuff ?? "I don't see what that has to do with anything."}"`}</p>}
          </div>
          <div className="space-y-1.5 border-t border-white/10 p-3">
            {choiceOpen(st, state) ? (
              <>
                <div className={label}>Your call. You cannot take it back.</div>
                {st.choices!.map((c) => <button key={c.id} className={cn(ghostBtn, "w-full text-left")} onClick={() => learn((s) => chooseApproach(s, st, c.id))}>{c.label}</button>)}
              </>
            ) : done ? (
              <button className={cn(ghostBtn, "w-full")} onClick={notebook}>Back to the notebook</button>
            ) : (
              <>
                <div className={label}>How do you read that?</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button className="rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold active:scale-95" onClick={() => judge("truth")}>Truth</button>
                  <button className="rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black active:scale-95 disabled:opacity-40" disabled={refuses} onClick={() => judge("doubt")}>Doubt</button>
                  <button className="rounded-lg bg-red-600 py-2.5 text-sm font-semibold active:scale-95 disabled:opacity-40" disabled={refuses} onClick={() => setProving(true)}>Lie</button>
                </div>
                <p className="text-center text-[11px] text-white/35">Doubt: they are holding back. Lie: you can prove it.</p>
              </>
            )}
          </div>
        </div>
      )}
      {proving && <FilePicker ctx={ctx} title="Prove it. What shows this is a lie?" onPick={(itemId) => judge("lie", itemId)} onClose={() => setProving(false)} />}
    </div>
  );
}

export function PeopleScreen({ ctx, jumpInterviewId }: { ctx: Ctx; jumpInterviewId?: string | null }) {
  const { bundle, state, showHidden } = ctx;
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  useEffect(() => { if (jumpInterviewId) setInterviewId(jumpInterviewId); }, [jumpInterviewId]);

  const interview = bundle.interviews.find((i) => i.id === interviewId);
  if (interview?.testimony?.length) return <Interrogation key={interview.id} ctx={ctx} interview={interview} onExit={() => setInterviewId(null)} />;
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

/* ───────────────────────── Notes (deduction board, clues, hints) & timeline ───────────────────────── */

export function NotesScreen({ ctx }: { ctx: Ctx }) {
  const { bundle, state, commit, getState, showHidden } = ctx;
  const [picked, setPicked] = useState<string[]>([]);
  const clues = bundle.clues.filter((c) => state.clues.includes(c.id));
  const hints = [...bundle.hints].sort((a, b) => a.order - b.order);
  const nextHint = hints.find((h) => !state.hintsUsed.includes(h.id));
  const usable = !!nextHint && (evaluate(nextHint.unlockCondition, state) || showHidden);
  const used = hints.filter((h) => state.hintsUsed.includes(h.id));
  // a question only appears once the player holds at least one of its pieces, so the board never spoils a branch
  const questions = (bundle.deductions ?? []).filter((d) => state.deductions.includes(d.id) || d.clueIds.some((id) => state.clues.includes(id)));
  const link = () => {
    const r = tryDeduction(bundle, getState(), picked);
    commit(() => r.state);
    setPicked([]);
    if (r.deduction) toast.success(`Deduced: ${bundle.clues.find((c) => c.id === r.deduction!.conclusionClueId)?.title}`);
    else toast.error("Those facts don't add up to anything yet. (−10)");
  };

  return (
    <div className="h-full space-y-4 overflow-y-auto p-3">
      {questions.length > 0 && (
        <section>
          <h3 className={cn(label, "mb-1.5")}>Open questions</h3>
          <div className="space-y-1.5">
            {questions.map((d) => {
              const done = state.deductions.includes(d.id);
              return (
                <div key={d.id} className={cn("rounded-xl border p-2.5 text-sm", done ? "border-emerald-500/30 bg-emerald-500/10" : "border-dashed border-amber-400/40")}>
                  <div className="flex items-center justify-between gap-2"><span>{d.question}</span>{done ? <CheckCircle2 className="size-4 shrink-0 text-emerald-400" /> : <span className="shrink-0 text-[10px] text-amber-300">link {d.clueIds.length}</span>}</div>
                  {done && <p className="mt-1 text-xs text-white/60">{bundle.clues.find((c) => c.id === d.conclusionClueId)?.title}</p>}
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-white/40">Select the notes that answer a question, then link them.</p>
        </section>
      )}
      <section>
        <h3 className={cn(label, "mb-1.5")}>Notes · {clues.length}</h3>
        {clues.length === 0 && <Empty text="Nothing noted yet." />}
        <div className="space-y-1.5">
          {clues.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button key={c.id} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))} className={cn("block w-full rounded-xl border p-2.5 text-left", on ? "border-amber-400 bg-amber-400/15" : "border-white/10 bg-white/5")}>
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{c.title}</span><span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] capitalize text-white/60">{c.category.replace("_", " ")}</span></div>
                <p className="mt-1 text-xs text-white/60">{c.description}</p>
                {showHidden && c.isRedHerring && <p className="mt-1 text-[10px] text-amber-300">Debug · red herring</p>}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h3 className={cn(label, "mb-1.5")}>Hints</h3>
        {used.map((h) => <div key={h.id} className="mb-1.5 flex gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-xs"><Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-300" />{h.text}</div>)}
        {nextHint ? (
          <button disabled={!usable} className={cn(ghostBtn, "w-full")} onClick={() => commit((s) => ({ ...s, hintsUsed: [...s.hintsUsed, nextHint.id] }))}>
            {usable ? `Use a hint (−${nextHint.scorePenalty} points)` : "No hint available right now"}
          </button>
        ) : hints.length > 0 ? <p className="text-xs text-white/40">No more hints.</p> : <p className="text-xs text-white/40">This case has no hints.</p>}
      </section>
      {picked.length >= 2 && <button className={cn(btn, "sticky bottom-0 z-10 flex w-full items-center justify-center gap-1.5 shadow-lg")} onClick={link}><Link2 className="size-4" />Link {picked.length} notes</button>}
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
