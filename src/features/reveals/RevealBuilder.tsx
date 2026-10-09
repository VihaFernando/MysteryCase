import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Clapperboard, ImageOff, Pause, Play, Plus, RotateCcw, SkipBack, SkipForward, Trash2, Volume2 } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { useMedia } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel, EmptyState } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { uid } from "@/services/caseFactory";
import { cn } from "@/lib/utils";
import type { CaseBundle, RevealScene } from "@/types";

const TRANSITIONS: RevealScene["transition"][] = ["fade", "cut", "dissolve", "slide"];
const IMAGE_KINDS = ["image", "crime_scene", "evidence", "portrait"];
const AUDIO_KINDS = ["audio", "music", "sfx"];
const NONE = "__none__";

const TRANSITION_CLASS: Record<RevealScene["transition"], string> = {
  cut: "",
  fade: "animate-in fade-in duration-700",
  dissolve: "animate-in fade-in zoom-in-95 duration-1000",
  slide: "animate-in slide-in-from-right duration-500",
};

const sortedScenes = (b: CaseBundle) => [...b.reveal].sort((a, c) => a.order - c.order);
const renumber = (list: RevealScene[]) => list.map((s, i) => ({ ...s, order: i + 1 }));

/* ───────────────────────── Scene form ───────────────────────── */

function SceneForm({ scene, bundle, onSave }: { scene: RevealScene; bundle: CaseBundle; onSave: (s: RevealScene) => void }) {
  const media = useMedia();
  const set = (patch: Partial<RevealScene>) => onSave({ ...scene, ...patch });
  const images = (media.data ?? []).filter((m) => IMAGE_KINDS.includes(m.kind) && m.url);
  const audio = (media.data ?? []).filter((m) => AUDIO_KINDS.includes(m.kind));
  // The scene stores the image URL and the audio file name; keep a value that is not in the library selectable.
  const imageKnown = !scene.image || images.some((m) => m.url === scene.image);
  const audioKnown = !scene.audio || audio.some((m) => m.name === scene.audio);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Title"><Input value={scene.title} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="In-story time"><Input value={scene.time} placeholder="10:27 PM" className="font-mono" onChange={(e) => set({ time: e.target.value })} /></Field>
      <Field label="Narration / text" className="md:col-span-2"><Textarea rows={3} value={scene.text} onChange={(e) => set({ text: e.target.value })} /></Field>
      <Field label="Image">
        <Select value={scene.image ?? NONE} onValueChange={(v) => set({ image: v === NONE ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Choose from media library" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No image</SelectItem>
            {!imageKnown && <SelectItem value={scene.image!}>Current image (not in library)</SelectItem>}
            {images.map((m) => <SelectItem key={m.id} value={m.url}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Audio">
        <Select value={scene.audio ?? NONE} onValueChange={(v) => set({ audio: v === NONE ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Choose from media library" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No audio</SelectItem>
            {!audioKnown && <SelectItem value={scene.audio!}>{scene.audio} (not in library)</SelectItem>}
            {audio.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Character on screen">
        <Select value={scene.characterId ?? NONE} onValueChange={(v) => set({ characterId: v === NONE ? undefined : v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {bundle.suspects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Evidence shown">
        <Select value={scene.evidenceId ?? NONE} onValueChange={(v) => set({ evidenceId: v === NONE ? undefined : v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {bundle.evidence.map((e) => <SelectItem key={e.id} value={e.id}>{e.code} · {e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration (seconds)"><Input type="number" min={1} max={120} value={scene.durationSec} onChange={(e) => set({ durationSec: Math.min(120, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
      <Field label="Transition in">
        <Select value={scene.transition} onValueChange={(v) => set({ transition: v as RevealScene["transition"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{TRANSITIONS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}

/* ───────────────────────── Play-through preview ───────────────────────── */

function Preview({ scenes, bundle, startIndex }: { scenes: RevealScene[]; bundle: CaseBundle; startIndex: number }) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scene = scenes[index];

  // Jump to a scene when it is selected in the list.
  useEffect(() => { setPlaying(false); setIndex(Math.min(startIndex, Math.max(0, scenes.length - 1))); setElapsed(0); }, [startIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || !scene) return;
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [playing, scene]);

  useEffect(() => {
    if (!playing || !scene || elapsed < scene.durationSec) return;
    if (index >= scenes.length - 1) { setPlaying(false); setElapsed(0); return; }
    setIndex(index + 1);
    setElapsed(0);
  }, [elapsed, playing, scene, index, scenes.length]);

  if (!scene) return <div className="grid h-64 place-items-center text-xs text-muted-foreground">Nothing to preview.</div>;

  const character = bundle.suspects.find((s) => s.id === scene.characterId);
  const evidence = bundle.evidence.find((e) => e.id === scene.evidenceId);
  const total = scenes.reduce((t, s) => t + s.durationSec, 0);
  const go = (i: number) => { setIndex(Math.max(0, Math.min(scenes.length - 1, i))); setElapsed(0); };
  const pct = Math.min(100, (elapsed / scene.durationSec) * 100);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-black">
        <div key={`${scene.id}-${index}`} className={cn("absolute inset-0", playing && TRANSITION_CLASS[scene.transition])}>
          {scene.image ? <img src={scene.image} alt="" className="size-full object-cover opacity-80" /> : <div className="grid size-full place-items-center text-muted-foreground"><ImageOff className="size-6" /></div>}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-4 text-white">
            <div className="font-mono text-[11px] text-amber">{scene.time}</div>
            <div className="font-display text-lg font-semibold">{scene.title}</div>
            <p className="mt-1 max-w-xl text-sm text-white/85">{scene.text}</p>
          </div>
          {character && <div className="absolute left-3 top-3 rounded-sm bg-black/60 px-2 py-1 text-[11px] text-white">{character.name}</div>}
          {evidence && <div className="absolute right-3 top-3 rounded-sm bg-black/60 px-2 py-1 text-[11px] text-amber">{evidence.code} · {evidence.name}</div>}
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-border"><div className="h-full bg-amber transition-[width] duration-100" style={{ width: `${pct}%` }} /></div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous scene"><SkipBack className="size-3.5" /></Button>
        <Button size="sm" onClick={() => { if (!playing && index >= scenes.length - 1 && elapsed === 0) go(0); setPlaying((p) => !p); }}>{playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{playing ? "Pause" : "Play"}</Button>
        <Button variant="outline" size="icon" className="size-8" onClick={() => go(index + 1)} disabled={index >= scenes.length - 1} aria-label="Next scene"><SkipForward className="size-3.5" /></Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => { setPlaying(false); go(0); }} aria-label="Restart"><RotateCcw className="size-3.5" /></Button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">Scene {index + 1}/{scenes.length} · total {total}s</span>
      </div>
      {scene.audio && <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Volume2 className="size-3" />Audio cue: {scene.audio} <span className="opacity-70">(not played in preview)</span></div>}
    </div>
  );
}

/* ───────────────────────── Section ───────────────────────── */

export function RevealBuilder() {
  const { bundle, update } = useCaseDraft();
  const scenes = useMemo(() => sortedScenes(bundle), [bundle]);
  const [selId, setSelId] = useState(scenes[0]?.id ?? "");
  const [del, setDel] = useState<RevealScene | null>(null);
  const sel = bundle.reveal.find((s) => s.id === selId);
  const selIndex = Math.max(0, scenes.findIndex((s) => s.id === selId));

  const save = (s: RevealScene) => update((b) => ({ ...b, reveal: replaceById(b.reveal, s) }));
  const add = () => {
    const s: RevealScene = { id: uid("rv"), order: scenes.length + 1, time: "", title: "New scene", text: "", durationSec: 5, transition: "fade" };
    update((b) => ({ ...b, reveal: [...b.reveal, s] }));
    setSelId(s.id);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= scenes.length) return;
    const next = scenes.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    update((b) => ({ ...b, reveal: renumber(next) }));
  };
  const remove = (s: RevealScene) => {
    update((b) => ({ ...b, reveal: renumber(sortedScenes(b).filter((x) => x.id !== s.id)) }));
    setSelId(scenes.find((x) => x.id !== s.id)?.id ?? "");
    toast.success("Scene deleted");
  };

  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Reveal <span className="ml-1 font-mono text-xs text-muted-foreground">{scenes.length}</span></h2>
          <Button size="sm" onClick={add}><Plus className="size-3.5" />Add scene</Button>
        </div>
        {scenes.length === 0 && <EmptyState icon={Clapperboard} title="No reveal scenes" body="The reveal plays after a correct accusation and shows what really happened." action={<Button size="sm" onClick={add}>Add scene</Button>} />}
        <ol className="space-y-2">
          {scenes.map((s, i) => (
            <li key={s.id} className={cn("flex gap-2 rounded-md border bg-card p-2", s.id === selId ? "border-amber/60" : "border-border")}>
              <button className="flex min-w-0 flex-1 gap-2 text-left" onClick={() => setSelId(s.id)}>
                {s.image ? <img src={s.image} alt="" className="h-12 w-20 shrink-0 rounded-sm object-cover" /> : <div className="grid h-12 w-20 shrink-0 place-items-center rounded-sm bg-muted"><ImageOff className="size-4 text-muted-foreground" /></div>}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5"><span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span><span className="truncate text-sm font-medium">{s.title}</span></div>
                  <div className="flex flex-wrap gap-1 pt-0.5"><Pill>{s.durationSec}s</Pill><Pill tone="info">{s.transition}</Pill>{s.audio && <Pill tone="violet">audio</Pill>}</div>
                </div>
              </button>
              <div className="flex shrink-0 flex-col">
                <Button variant="ghost" size="icon" className="size-6" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-3" /></Button>
                <Button variant="ghost" size="icon" className="size-6" disabled={i === scenes.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-3" /></Button>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-5">
        <Panel title="Play-through preview" icon={Play}><Preview scenes={scenes} bundle={bundle} startIndex={selIndex} /></Panel>
        {sel && (
          <Panel title={`Edit — ${sel.title || "scene"}`} actions={<Button variant="ghost" size="sm" className="text-crimson" onClick={() => setDel(sel)}><Trash2 className="size-3.5" />Delete</Button>}>
            <SceneForm key={sel.id} scene={sel} bundle={bundle} onSave={save} />
          </Panel>
        )}
      </div>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete "${del?.title}"?`} description="The remaining scenes are renumbered." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) remove(del); setDel(null); }} />
    </div>
  );
}
