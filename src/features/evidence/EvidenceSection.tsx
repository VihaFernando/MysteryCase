import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDown, Fingerprint, Plus, Search, Trash2, Star } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { evidenceSchema, type EvidenceValues } from "@/schemas/case";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, EmptyState } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiPicker } from "@/components/forms/MultiPicker";
import { InspectionStagesEditor } from "./InspectionStagesEditor";
import { uid } from "@/services/caseFactory";
import { fmtClock } from "@/utils/format";
import type { Evidence, EvidenceType } from "@/types";

const TYPES: EvidenceType[] = ["physical", "digital", "document", "forensic", "testimony", "footage"];

function EvidenceForm({ ev, onSave }: { ev: Evidence; onSave: (e: Evidence) => void }) {
  const { bundle } = useCaseDraft();
  const form = useForm<EvidenceValues>({ resolver: zodResolver(evidenceSchema), mode: "onChange",
    defaultValues: { code: ev.code, name: ev.name, type: ev.type, description: ev.description, foundAtLocationId: ev.foundAtLocationId ?? "", discoveredBy: ev.discoveredBy, isKey: ev.isKey, isRedHerring: ev.isRedHerring } });
  const { register, watch, setValue, formState: { errors } } = form;
  useEffect(() => {
    const sub = watch(async () => { if (await form.trigger()) { const v = form.getValues(); onSave({ ...ev, ...v, foundAtLocationId: v.foundAtLocationId || undefined }); } });
    return () => sub.unsubscribe();
  }, [watch, form, ev, onSave]);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Evidence ID"><Input className="font-mono" {...register("code")} />{errors.code && <span className="text-[11px] text-crimson">{errors.code.message}</span>}</Field>
      <Field label="Type">
        <Select value={watch("type")} onValueChange={(v) => setValue("type", v as EvidenceType, { shouldValidate: true })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Name" className="col-span-2"><Input {...register("name")} />{errors.name && <span className="text-[11px] text-crimson">{errors.name.message}</span>}</Field>
      <Field label="Description" className="col-span-2"><Textarea rows={2} {...register("description")} /></Field>
      <Field label="Found at">
        <Select value={watch("foundAtLocationId") || "none"} onValueChange={(v) => setValue("foundAtLocationId", v === "none" ? "" : v, { shouldValidate: true })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">Unknown</SelectItem>{bundle.locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Discovered by"><Input {...register("discoveredBy")} /></Field>
      <div className="col-span-2 flex gap-6">
        <label className="flex items-center gap-2 text-xs"><Switch checked={watch("isKey")} onCheckedChange={(v) => setValue("isKey", v, { shouldValidate: true })} />Key evidence</label>
        <label className="flex items-center gap-2 text-xs"><Switch checked={watch("isRedHerring")} onCheckedChange={(v) => setValue("isRedHerring", v, { shouldValidate: true })} />Red herring</label>
      </div>
    </div>
  );
}

function EvidenceDetail({ ev, onSave }: { ev: Evidence; onSave: (e: Evidence) => void }) {
  const { bundle } = useCaseDraft();
  const loc = bundle.locations.find((l) => l.id === ev.foundAtLocationId);
  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        {ev.image ? <img src={ev.image} alt={ev.name} className="size-36 rounded-sm border border-border object-cover" /> : <div className="grid size-36 place-items-center rounded-sm bg-muted"><Fingerprint className="size-6 text-muted-foreground" /></div>}
        <div className="flex-1 space-y-1 text-xs">
          <div className="font-mono text-muted-foreground">{ev.code}</div>
          <div className="font-display text-lg font-semibold">{ev.name}</div>
          <div className="flex gap-1"><Pill>{ev.type}</Pill>{ev.isKey && <Pill tone="crimson">Key</Pill>}{ev.isRedHerring && <Pill tone="amber">Red herring</Pill>}</div>
          <div className="pt-1 text-muted-foreground">Found at <span className="text-foreground">{loc?.name ?? "—"}</span> · {ev.discoveredBy}</div>
        </div>
      </div>
      <EvidenceForm key={ev.id} ev={ev} onSave={onSave} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Related suspects"><MultiPicker options={bundle.suspects.map((s) => ({ value: s.id, label: s.name }))} value={ev.relatedSuspectIds} onChange={(v) => onSave({ ...ev, relatedSuspectIds: v })} /></Field>
        <Field label="Related clues"><MultiPicker options={bundle.clues.map((c) => ({ value: c.id, label: `${c.code} ${c.title}` }))} value={ev.relatedClueIds} onChange={(v) => onSave({ ...ev, relatedClueIds: v })} /></Field>
        <Field label="Related timeline events" className="col-span-2"><MultiPicker options={bundle.timeline.map((t) => ({ value: t.id, label: `${fmtClock(t.time)} ${t.title}` }))} value={ev.relatedTimelineIds} onChange={(v) => onSave({ ...ev, relatedTimelineIds: v })} /></Field>
      </div>
      <InspectionStagesEditor ev={ev} onChange={onSave} />
    </div>
  );
}

export function EvidenceSection() {
  const { bundle, update } = useCaseDraft();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState<Evidence | null>(null);
  const save = (e: Evidence) => update((b) => ({ ...b, evidence: replaceById(b.evidence, e) }));
  const list = bundle.evidence.filter((e) => `${e.code} ${e.name} ${e.type}`.toLowerCase().includes(q.toLowerCase()));
  const current = bundle.evidence.find((e) => e.id === open);

  const add = () => {
    const e: Evidence = { id: uid("ev"), code: `EVID-${String(bundle.evidence.length + 1).padStart(3, "0")}`, name: "New evidence", type: "physical", description: "", discoveredBy: "", relatedSuspectIds: [], relatedClueIds: [], relatedTimelineIds: [], inspections: [{ id: uid("ins"), stage: 1, title: "Initial look", description: "", requirements: [] }], isKey: false, isRedHerring: false };
    update((b) => ({ ...b, evidence: [...b.evidence, e] }));
    setOpen(e.id);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">Evidence <span className="ml-1 font-mono text-xs text-muted-foreground">{bundle.evidence.length}</span></h2>
        <div className="relative ml-auto w-64"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter evidence…" className="h-8 pl-8 text-xs" /></div>
        <Button size="sm" onClick={add}><Plus className="size-3.5" />Add evidence</Button>
      </div>
      {list.length === 0 ? <EmptyState icon={Fingerprint} title="No evidence" body="Add evidence and link it to hotspots, suspects and clues." /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="label-caps border-b border-border bg-muted/40 text-left"><tr>{["", "ID", "Evidence", "Type", "Found at", "Suspects", "Clues", "Stages", ""].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40" onClick={() => setOpen(e.id)}>
                  <td className="w-12 px-3 py-2">{e.image ? <img src={e.image} alt="" className="size-9 rounded-sm object-cover" loading="lazy" /> : <div className="size-9 rounded-sm bg-muted" />}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{e.code}</td>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5 font-medium">{e.isKey && <Star className="size-3 fill-amber text-amber" />}{e.name}</span><span className="block max-w-xs truncate text-[11px] text-muted-foreground">{e.description}</span></td>
                  <td className="px-3 py-2"><Pill>{e.type}</Pill></td>
                  <td className="px-3 py-2 text-muted-foreground">{bundle.locations.find((l) => l.id === e.foundAtLocationId)?.name ?? "—"}</td>
                  <td className="px-3 py-2">{e.relatedSuspectIds.map((id) => bundle.suspects.find((s) => s.id === id)?.name.split(" ")[0]).join(", ") || "—"}</td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{e.relatedClueIds.map((id) => <Pill key={id} tone="amber">{bundle.clues.find((c) => c.id === id)?.code ?? id}</Pill>)}</div></td>
                  <td className="px-3 py-2"><span className="flex items-center gap-0.5">{e.inspections.map((s) => <span key={s.id} className="size-1.5 rounded-full bg-info" />)}<span className="ml-1 font-mono">{e.inspections.length}</span></span></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="icon" className="size-7" onClick={(x) => { x.stopPropagation(); setDel(e); }} aria-label="Delete"><Trash2 className="size-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={!!current} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-[640px] overflow-y-auto sm:max-w-[640px]">
          <SheetHeader><SheetTitle className="font-display">Evidence detail</SheetTitle></SheetHeader>
          {current && <div className="px-4 pb-6"><EvidenceDetail ev={current} onSave={save} /></div>}
        </SheetContent>
      </Sheet>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete ${del?.code}?`} description="Hotspots and solution entries referencing it will be flagged by validation." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { update((b) => ({ ...b, evidence: b.evidence.filter((x) => x.id !== del.id) })); toast.success(`${del.code} deleted`); } setDel(null); }} />
      <ArrowDown className="hidden" />
    </div>
  );
}
