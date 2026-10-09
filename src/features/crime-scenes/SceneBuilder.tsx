import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { toast } from "sonner";
import { Crosshair, Eye, EyeOff, Lock, MapPin, MousePointer2, Plus, Trash2, Volume2 } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConditionBuilder, emptyGroup } from "@/components/editors/ConditionBuilder";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { uid } from "@/services/caseFactory";
import { describe } from "@/services/conditionEngine";
import { useMedia } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { DiscoveryState, Hotspot, HotspotType, Scene } from "@/types";

const TYPE_STYLE: Record<HotspotType, string> = {
  evidence: "border-amber bg-amber/25 text-amber",
  body: "border-crimson bg-crimson/25 text-crimson",
  inspect: "border-info bg-info/20 text-info",
  navigation: "border-success bg-success/20 text-success",
  dialogue: "border-violet bg-violet/20 text-violet",
  decor: "border-muted-foreground bg-muted-foreground/20 text-muted-foreground",
};
const STATE_ICON: Record<DiscoveryState, typeof Eye> = { visible: Eye, hidden: EyeOff, locked: Lock, requires_item: Lock };
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

export function SceneBuilder() {
  const { bundle, update } = useCaseDraft();
  const { data: media = [] } = useMedia();
  const [sceneId, setSceneId] = useState(bundle.scenes[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(bundle.scenes[0]?.hotspots[0]?.id ?? null);
  const [confirmDel, setConfirmDel] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);

  const scene = bundle.scenes.find((s) => s.id === sceneId);
  const hotspot = scene?.hotspots.find((h) => h.id === selected);

  const saveScene = (s: Scene) => update((b) => ({ ...b, scenes: replaceById(b.scenes, s) }));
  const saveHotspot = (h: Hotspot) => scene && saveScene({ ...scene, hotspots: replaceById(scene.hotspots, h) });

  const pctFromEvent = (e: { clientX: number; clientY: number }) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };

  const addHotspot = (pos = { x: 50, y: 50 }) => {
    if (!scene) return;
    const h: Hotspot = { id: uid("hs"), name: `Hotspot ${scene.hotspots.length + 1}`, type: "inspect", description: "", ...pos, radius: 4, initialInfo: "", detailedInfo: "", discoveryState: "visible", extraImages: [] };
    saveScene({ ...scene, hotspots: [...scene.hotspots, h] });
    setSelected(h.id);
  };

  const onPointerDown = (e: RPointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, moved: false };
    setSelected(id);
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (!drag.current || !scene) return;
    drag.current.moved = true;
    const pos = pctFromEvent(e);
    const h = scene.hotspots.find((x) => x.id === drag.current!.id);
    if (h) saveHotspot({ ...h, ...pos });
  };
  const onPointerUp = () => { drag.current = null; };

  const addScene = () => {
    const img = media.find((m) => m.kind === "crime_scene")?.url ?? bundle.case.coverImage;
    const s: Scene = { id: uid("scn"), name: `New Scene ${bundle.scenes.length + 1}`, locationId: bundle.locations[0]?.id ?? "", image: img, description: "", hotspots: [], order: bundle.scenes.length + 1 };
    update((b) => ({ ...b, scenes: [...b.scenes, s] }));
    setSceneId(s.id); setSelected(null);
  };

  const evidenceOpts = bundle.evidence;
  const set = <K extends keyof Hotspot>(k: K, v: Hotspot[K]) => hotspot && saveHotspot({ ...hotspot, [k]: v });

  return (
    <div className="grid h-[calc(100vh-148px)] grid-cols-[220px_1fr_340px] overflow-hidden">
      {/* Scene list */}
      <aside className="flex flex-col border-r border-border bg-card/40">
        <div className="flex items-center justify-between border-b border-border px-3 py-2"><span className="label-caps">Scenes</span><Button variant="ghost" size="icon" className="size-6" onClick={addScene} aria-label="Add scene"><Plus className="size-3.5" /></Button></div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {bundle.scenes.map((s) => {
            const loc = bundle.locations.find((l) => l.id === s.locationId);
            return (
              <button key={s.id} onClick={() => { setSceneId(s.id); setSelected(s.hotspots[0]?.id ?? null); }} className={cn("w-full rounded-md border p-2 text-left", s.id === sceneId ? "border-amber/60 bg-accent" : "border-transparent hover:bg-accent/50")}>
                <div className="text-xs font-medium">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted-foreground"><MapPin className="size-2.5" />{loc?.name ?? "No location"} · {s.hotspots.length} hotspots</div>
              </button>
            );
          })}
        </div>
        {scene && (
          <div className="space-y-2 border-t border-border p-3">
            <Field label="Scene name"><Input className="h-7 text-xs" value={scene.name} onChange={(e) => saveScene({ ...scene, name: e.target.value })} /></Field>
            <Field label="Location">
              <Select value={scene.locationId} onValueChange={(v) => saveScene({ ...scene, locationId: v })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>{bundle.locations.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </aside>

      {/* Canvas */}
      <section className="flex min-w-0 flex-col bg-canvas">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
          <MousePointer2 className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Drag to move · double-click image to place a hotspot</span>
          <Button size="sm" variant="outline" className="ml-auto h-7" onClick={() => addHotspot()} disabled={!scene}><Crosshair className="size-3.5" />Add hotspot</Button>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          {scene ? (
            <div ref={canvas} className="relative aspect-video w-full max-w-[1100px] select-none overflow-hidden rounded-md border border-border shadow-panel"
              onDoubleClick={(e) => addHotspot(pctFromEvent(e))} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
              <img src={scene.image} alt={scene.name} className="pointer-events-none h-full w-full object-cover" draggable={false} />
              {scene.hotspots.map((h) => {
                const Icon = STATE_ICON[h.discoveryState];
                return (
                  <div key={h.id} onPointerDown={(e) => onPointerDown(e, h.id)}
                    className={cn("absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 transition-shadow active:cursor-grabbing", TYPE_STYLE[h.type], h.id === selected && "ring-2 ring-foreground ring-offset-2 ring-offset-transparent", h.discoveryState !== "visible" && "border-dashed")}
                    style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.radius * 2}%`, aspectRatio: "1" }}>
                    <span className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-sm bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {h.discoveryState !== "visible" && <Icon className="size-2.5" />}{h.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : <div className="text-sm text-muted-foreground">Add a scene to begin.</div>}
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-border p-2">
          {bundle.scenes.map((s) => (
            <button key={s.id} onClick={() => setSceneId(s.id)} className={cn("w-32 shrink-0 overflow-hidden rounded-sm border-2", s.id === sceneId ? "border-amber" : "border-transparent opacity-70 hover:opacity-100")}>
              <img src={s.image} alt={s.name} className="aspect-video w-full object-cover" loading="lazy" />
            </button>
          ))}
          {scene && media.filter((m) => m.kind === "crime_scene" && m.url !== scene.image).map((m) => (
            <button key={m.id} onClick={() => saveScene({ ...scene, image: m.url })} title={`Use ${m.name} for this scene`} className="relative w-32 shrink-0 overflow-hidden rounded-sm border border-dashed border-border opacity-50 hover:opacity-100">
              <img src={m.url} alt={m.name} className="aspect-video w-full object-cover" loading="lazy" />
              <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 text-[9px] text-white">Replace image</span>
            </button>
          ))}
        </div>
      </section>

      {/* Hotspot editor */}
      <aside className="overflow-y-auto border-l border-border bg-card/40">
        {!hotspot ? (
          <div className="space-y-3 p-4">
            <div className="label-caps">Hotspots</div>
            {scene?.hotspots.map((h) => <button key={h.id} onClick={() => setSelected(h.id)} className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"><span>{h.name}</span><Pill>{h.type}</Pill></button>)}
            <p className="text-xs text-muted-foreground">Select a hotspot to edit it.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between"><span className="label-caps">Hotspot · {hotspot.id}</span>
              <Button variant="ghost" size="icon" className="size-7 text-crimson" onClick={() => setConfirmDel(true)} aria-label="Delete hotspot"><Trash2 className="size-3.5" /></Button></div>
            <Field label="Name"><Input className="h-8" value={hotspot.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Type">
                <Select value={hotspot.type} onValueChange={(v) => set("type", v as HotspotType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(TYPE_STYLE).map((t) => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Discovery state">
                <Select value={hotspot.discoveryState} onValueChange={(v) => set("discoveryState", v as DiscoveryState)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["visible", "hidden", "locked", "requires_item"].map((t) => <SelectItem key={t} value={t} className="text-xs">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="X %"><Input className="h-8 font-mono" type="number" step={0.5} value={hotspot.x} onChange={(e) => set("x", clamp(Number(e.target.value)))} /></Field>
              <Field label="Y %"><Input className="h-8 font-mono" type="number" step={0.5} value={hotspot.y} onChange={(e) => set("y", clamp(Number(e.target.value)))} /></Field>
              <Field label="Radius %"><Input className="h-8 font-mono" type="number" step={0.5} value={hotspot.radius} onChange={(e) => set("radius", Math.max(1, Number(e.target.value)))} /></Field>
            </div>
            <Field label="Description"><Input className="h-8" value={hotspot.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Initial information"><Textarea rows={2} value={hotspot.initialInfo} onChange={(e) => set("initialInfo", e.target.value)} /></Field>
            <Field label="Detailed information"><Textarea rows={3} value={hotspot.detailedInfo} onChange={(e) => set("detailedInfo", e.target.value)} /></Field>
            <Field label="Evidence connection">
              <Select value={hotspot.evidenceId ?? "none"} onValueChange={(v) => set("evidenceId", v === "none" ? undefined : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none" className="text-xs">None</SelectItem>{evidenceOpts.map((e) => <SelectItem key={e.id} value={e.id} className="text-xs">{e.code} · {e.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Clue generated">
              <Select value={hotspot.clueId ?? "none"} onValueChange={(v) => set("clueId", v === "none" ? undefined : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none" className="text-xs">None</SelectItem>{bundle.clues.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.code} · {c.title}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Required item">
              <Select value={hotspot.requiredItemId ?? "none"} onValueChange={(v) => set("requiredItemId", v === "none" ? undefined : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none" className="text-xs">None</SelectItem>{evidenceOpts.map((e) => <SelectItem key={e.id} value={e.id} className="text-xs">{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Unlock condition" hint={hotspot.unlockCondition ? describe(hotspot.unlockCondition, bundle) : "Always available"}>
              <ConditionBuilder value={hotspot.unlockCondition ?? emptyGroup()} bundle={bundle} onChange={(g) => set("unlockCondition", g.children.length ? g : undefined)} />
            </Field>
            <Field label="Audio">
              <Select value={hotspot.audio ?? "none"} onValueChange={(v) => set("audio", v === "none" ? undefined : v)}>
                <SelectTrigger className="h-8 text-xs"><Volume2 className="size-3" /><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none" className="text-xs">None</SelectItem>{media.filter((m) => m.kind === "sfx" || m.kind === "audio").map((m) => <SelectItem key={m.id} value={m.name} className="text-xs">{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Additional images">
              <div className="grid grid-cols-4 gap-1">
                {media.filter((m) => m.kind === "evidence" && m.url).slice(0, 8).map((m) => {
                  const on = hotspot.extraImages.includes(m.url);
                  return <button key={m.id} onClick={() => set("extraImages", on ? hotspot.extraImages.filter((x) => x !== m.url) : [...hotspot.extraImages, m.url])} className={cn("overflow-hidden rounded-sm border-2", on ? "border-amber" : "border-transparent opacity-60 hover:opacity-100")}><img src={m.url} alt={m.name} className="aspect-square w-full object-cover" loading="lazy" /></button>;
                })}
              </div>
            </Field>
          </div>
        )}
      </aside>
      <ConfirmDialog open={confirmDel} onOpenChange={setConfirmDel} title={`Delete hotspot "${hotspot?.name}"?`} destructive confirmLabel="Delete"
        onConfirm={() => { if (scene && hotspot) { saveScene({ ...scene, hotspots: scene.hotspots.filter((h) => h.id !== hotspot.id) }); setSelected(null); toast.success("Hotspot deleted"); } setConfirmDel(false); }} />
    </div>
  );
}
