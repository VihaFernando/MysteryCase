import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCaseDraft } from "@/features/cases/CaseDraftProvider";
import { uid } from "@/services/caseFactory";
import type { Evidence, EvidenceInspection, InspectionRequirement } from "@/types";

const REQ_KINDS: Array<{ kind: InspectionRequirement["kind"]; label: string }> = [
  { kind: "previous_stage", label: "Previous stage" }, { kind: "clue", label: "Clue" }, { kind: "player_action", label: "Player action" },
  { kind: "evidence", label: "Evidence" }, { kind: "location", label: "Location" },
];

export function InspectionStagesEditor({ ev, onChange }: { ev: Evidence; onChange: (e: Evidence) => void }) {
  const { bundle } = useCaseDraft();
  const stages = [...ev.inspections].sort((a, b) => a.stage - b.stage);
  const write = (list: EvidenceInspection[]) => onChange({ ...ev, inspections: list.map((s, i) => ({ ...s, stage: i + 1 })) });
  const setStage = (id: string, patch: Partial<EvidenceInspection>) => write(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, d: number) => { const c = stages.slice(); const a = c[i], b = c[i + d]; if (!a || !b) return; c[i] = b; c[i + d] = a; write(c); };

  const targetOpts = (k: InspectionRequirement["kind"]) =>
    k === "clue" ? bundle.clues.map((c) => ({ v: c.id, l: `${c.code} ${c.title}` })) : k === "evidence" ? bundle.evidence.filter((e) => e.id !== ev.id).map((e) => ({ v: e.id, l: e.name })) : k === "location" ? bundle.locations.map((l) => ({ v: l.id, l: l.name })) : [];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label-caps">Inspection stages</span>
        <Button variant="outline" size="sm" className="h-7" onClick={() => write([...stages, { id: uid("ins"), stage: stages.length + 1, title: `Stage ${stages.length + 1}`, description: "", requirements: stages.length ? [{ kind: "previous_stage", label: `Stage ${stages.length} viewed` }] : [] }])}><Plus className="size-3" />Add stage</Button>
      </div>
      <ol className="relative space-y-2 border-l-2 border-info/40 pl-4">
        {stages.map((s, i) => (
          <li key={s.id} className="relative rounded-md border border-border bg-background p-3">
            <span className="absolute -left-[27px] top-3 grid size-5 place-items-center rounded-full border-2 border-info bg-card font-mono text-[10px] text-info">{s.stage}</span>
            <div className="flex items-center gap-2">
              <Input value={s.title} onChange={(e) => setStage(s.id, { title: e.target.value })} className="h-7 text-xs font-medium" />
              <Button variant="ghost" size="icon" className="size-7" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp className="size-3" /></Button>
              <Button variant="ghost" size="icon" className="size-7" disabled={i === stages.length - 1} onClick={() => move(i, 1)}><ChevronDown className="size-3" /></Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => write(stages.filter((x) => x.id !== s.id))}><Trash2 className="size-3" /></Button>
            </div>
            <Textarea rows={2} className="mt-2 text-xs" value={s.description} onChange={(e) => setStage(s.id, { description: e.target.value })} placeholder="What the player learns at this stage" />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="label-caps">Requires</span>
              {s.requirements.length === 0 && <span className="text-[11px] text-muted-foreground">Nothing</span>}
              {s.requirements.map((r, ri) => (
                <span key={ri} className="inline-flex items-center gap-1 rounded-sm border border-info/30 bg-info-soft px-1.5 py-0.5 text-[11px] text-info">
                  {r.label}<button onClick={() => setStage(s.id, { requirements: s.requirements.filter((_, j) => j !== ri) })}><X className="size-2.5" /></button>
                </span>
              ))}
              <Select value="" onValueChange={(k) => {
                const kind = k as InspectionRequirement["kind"];
                const t = targetOpts(kind)[0];
                const label = kind === "previous_stage" ? `Stage ${Math.max(1, s.stage - 1)} viewed` : kind === "player_action" ? "Player action" : `${REQ_KINDS.find((x) => x.kind === kind)?.label}: ${t?.l ?? "—"}`;
                setStage(s.id, { requirements: [...s.requirements, { kind, targetId: t?.v, label }] });
              }}>
                <SelectTrigger className="h-6 w-28 text-[11px]"><SelectValue placeholder="+ Requirement" /></SelectTrigger>
                <SelectContent>{REQ_KINDS.map((r) => <SelectItem key={r.kind} value={r.kind} className="text-xs">{r.label}</SelectItem>)}</SelectContent>
              </Select>
              {s.requirements.filter((r) => r.targetId && r.kind !== "previous_stage").map((r, ri) => (
                <Select key={`t${ri}`} value={r.targetId ?? ""} onValueChange={(v) => setStage(s.id, { requirements: s.requirements.map((x) => x === r ? { ...x, targetId: v, label: `${REQ_KINDS.find((k) => k.kind === x.kind)?.label}: ${targetOpts(x.kind).find((o) => o.v === v)?.l}` } : x) })}>
                  <SelectTrigger className="h-6 w-40 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{targetOpts(r.kind).map((o) => <SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="label-caps">Zoom image</span>
              <Input value={s.image ?? ""} onChange={(e) => setStage(s.id, { image: e.target.value || undefined })} className="h-6 text-[11px]" placeholder="Image URL of a closer look (optional)" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="label-caps">Reveals clue</span>
              <Select value={s.revealsClueId ?? "none"} onValueChange={(v) => setStage(s.id, { revealsClueId: v === "none" ? undefined : v })}>
                <SelectTrigger className="h-6 w-56 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none" className="text-xs">None</SelectItem>{bundle.clues.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.code} {c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
