import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileAudio, FileText, Film, ImageIcon, Search, Trash2, Upload, X } from "lucide-react";
import { useMedia, useMediaActions } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uid } from "@/services/caseFactory";
import { fmtDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaKind } from "@/types";

const KIND_LABEL: Record<MediaKind, string> = { image: "Images", crime_scene: "Scenes", evidence: "Evidence", portrait: "Portraits", audio: "Audio", video: "Video", document: "Documents", music: "Music", sfx: "SFX" };
const VISUAL: MediaKind[] = ["image", "crime_scene", "evidence", "portrait"];

const kindFromFile = (f: File): MediaKind => (f.type.startsWith("image/") ? "image" : f.type.startsWith("audio/") ? "audio" : f.type.startsWith("video/") ? "video" : "document");
const size = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

function imageSize(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(`${img.naturalWidth}×${img.naturalHeight}`);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

function Thumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  if (VISUAL.includes(asset.kind) && asset.url) return <img src={asset.url} alt="" loading="lazy" className={cn("object-cover", className)} />;
  const Icon = asset.kind === "video" ? Film : asset.kind === "document" ? FileText : asset.kind === "audio" || asset.kind === "music" || asset.kind === "sfx" ? FileAudio : ImageIcon;
  return <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}><Icon className="size-6" /></div>;
}

function DetailDialog({ asset, onClose, onSave, onDelete }: { asset: MediaAsset | null; onClose: () => void; onSave: (a: MediaAsset) => void; onDelete: (a: MediaAsset) => void }) {
  const [tag, setTag] = useState("");
  if (!asset) return null;
  const addTag = () => {
    const t = tag.trim().toLowerCase();
    if (t && !asset.tags.includes(t)) onSave({ ...asset, tags: [...asset.tags, t] });
    setTag("");
  };
  const inUse = asset.usage.length > 0;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{asset.name}</DialogTitle>
          <DialogDescription>{KIND_LABEL[asset.kind]} · {size(asset.sizeKb)}{asset.dimensions ? ` · ${asset.dimensions}` : ""}{asset.durationSec ? ` · ${Math.floor(asset.durationSec / 60)}:${String(asset.durationSec % 60).padStart(2, "0")}` : ""}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <Thumb asset={asset} className="aspect-square w-full rounded-md border border-border" />
          <div className="space-y-4">
            <div>
              <div className="label-caps mb-1.5">Tags</div>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px]">{t}<button aria-label={`Remove tag ${t}`} onClick={() => onSave({ ...asset, tags: asset.tags.filter((x) => x !== t) })}><X className="size-2.5" /></button></span>)}
                {asset.tags.length === 0 && <span className="text-[11px] text-muted-foreground">No tags</span>}
              </div>
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addTag(); }}>
                <Input className="h-8 text-xs" placeholder="Add tag…" value={tag} onChange={(e) => setTag(e.target.value)} />
                <Button type="submit" variant="outline" size="sm" className="h-8">Add</Button>
              </form>
            </div>
            <div>
              <div className="label-caps mb-1.5">Used in · {asset.usage.length}</div>
              {inUse ? (
                <ul className="space-y-1 text-xs">{asset.usage.map((u, i) => <li key={i} className="flex gap-2"><span className="font-mono text-muted-foreground">{u.entity}</span>{u.label}</li>)}</ul>
              ) : <p className="text-xs text-muted-foreground">Not used anywhere yet.</p>}
            </div>
            <div className="text-[11px] text-muted-foreground">Uploaded by {asset.uploadedBy} on {fmtDate(asset.uploadedAt)}</div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">{inUse ? "Remove it from the places above before deleting." : ""}</span>
          <Button variant="outline" size="sm" className="text-crimson" disabled={inUse} onClick={() => onDelete(asset)}><Trash2 className="size-3.5" />Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MediaPage() {
  const { data = [], isLoading, error, refetch } = useMedia();
  const { upsert, remove } = useMediaActions();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [del, setDel] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const opened = data.find((m) => m.id === openId) ?? null;
  const kinds = useMemo(() => [...new Set(data.map((m) => m.kind))], [data]);
  const tags = useMemo(() => [...new Set(data.flatMap((m) => m.tags))].sort(), [data]);
  const list = data.filter((m) => (kind === "all" || m.kind === kind) && (!tag || m.tags.includes(tag)) && `${m.name} ${m.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = URL.createObjectURL(f);
      const k = kindFromFile(f);
      const asset: MediaAsset = { id: uid("m"), name: f.name, kind: k, url, sizeKb: Math.max(1, Math.round(f.size / 1024)), dimensions: k === "image" ? await imageSize(url) : undefined, uploadedBy: "You", uploadedAt: new Date().toISOString(), tags: [], usage: [] };
      await upsert.mutateAsync(asset);
    }
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} added`, { description: "Demo uploads are kept for this browser session only." });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Media library" subtitle={`${data.length} assets`}
        actions={<>
          <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*,.pdf" className="hidden" onChange={(e) => void onFiles(e.target.files)} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={upsert.isPending}><Upload className="size-3.5" />Upload</Button>
        </>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Search name or tag…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {(["all", ...kinds] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={cn("rounded-md border px-2.5 py-1 text-xs", kind === k ? "border-amber/60 bg-accent font-medium" : "border-border text-muted-foreground hover:text-foreground")}>
            {k === "all" ? "All" : KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="label-caps mr-1">Tags</span>
          {tags.map((t) => <button key={t} onClick={() => setTag(tag === t ? null : t)} className={cn("rounded-sm border px-1.5 py-0.5 text-[11px]", tag === t ? "border-info bg-info-soft text-info" : "border-border text-muted-foreground hover:text-foreground")}>{t}</button>)}
        </div>
      )}

      {isLoading && <TableSkeleton />}
      {error && <ErrorState message="Could not load media" onRetry={() => void refetch()} />}
      {!isLoading && !error && list.length === 0 && <EmptyState icon={ImageIcon} title="No media found" body={data.length ? "Try a different filter." : "Upload images, audio or video to get started."} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {list.map((m) => (
          <button key={m.id} onClick={() => setOpenId(m.id)} className="group overflow-hidden rounded-md border border-border bg-card text-left transition-colors hover:border-muted-foreground/50">
            <Thumb asset={m} className="aspect-video w-full" />
            <div className="space-y-1 p-2">
              <div className="truncate text-xs font-medium" title={m.name}>{m.name}</div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{size(m.sizeKb)}</span>
                {m.usage.length > 0 ? <Pill tone="success">{m.usage.length} use{m.usage.length > 1 ? "s" : ""}</Pill> : <Pill>Unused</Pill>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <DetailDialog asset={opened} onClose={() => setOpenId(null)} onSave={(a) => upsert.mutate(a)} onDelete={(a) => setDel(a)} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete ${del?.name}?`} description="This permanently removes the file from the library." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { remove.mutate(del.id, { onSuccess: () => toast.success("Asset deleted") }); setOpenId(null); } setDel(null); }} />
    </div>
  );
}
