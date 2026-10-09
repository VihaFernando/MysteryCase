import { useCallback } from "react";
import { useCaseDraft } from "../CaseDraftProvider";
import { BasicInfoForm, fromBasicValues, toBasicValues } from "../forms/BasicInfoForm";
import { Field, Panel } from "@/components/common/Page";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMedia } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { BasicInfoValues } from "@/schemas/case";

export function BasicInfoSection() {
  const { bundle, update } = useCaseDraft();
  const c = bundle.case;
  const { data: media = [] } = useMedia();
  const covers = media.filter((m) => (m.kind === "image" || m.kind === "crime_scene") && m.url);

  const onBasic = useCallback((v: BasicInfoValues) => update((b) => ({ ...b, case: { ...b.case, ...fromBasicValues(v) } })), [update]);
  const setCase = (patch: Partial<typeof c>) => update((b) => ({ ...b, case: { ...b.case, ...patch } }));

  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Panel title="Basic information"><BasicInfoForm key={c.id} initial={toBasicValues(c)} onValidChange={onBasic} /></Panel>
        <Panel title="Story setup">
          <div className="space-y-4">
            <Field label="Story (shown in the case briefing)"><Textarea rows={6} value={c.story} onChange={(e) => setCase({ story: e.target.value })} /></Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Victim"><Input value={c.victim.name} onChange={(e) => setCase({ victim: { ...c.victim, name: e.target.value } })} /></Field>
              <Field label="Age"><Input type="number" value={c.victim.age} onChange={(e) => setCase({ victim: { ...c.victim, age: Number(e.target.value) } })} /></Field>
              <Field label="Occupation"><Input value={c.victim.occupation} onChange={(e) => setCase({ victim: { ...c.victim, occupation: e.target.value } })} /></Field>
            </div>
            <Field label="Victim description"><Textarea rows={2} value={c.victim.description} onChange={(e) => setCase({ victim: { ...c.victim, description: e.target.value } })} /></Field>
            <Field label="Player objectives" hint="One per line"><Textarea rows={4} value={c.objectives.join("\n")} onChange={(e) => setCase({ objectives: e.target.value.split("\n") })} /></Field>
          </div>
        </Panel>
      </div>
      <Panel title="Cover image">
        <img src={c.coverImage} alt="Cover" className="aspect-[4/5] w-full rounded-sm object-cover" />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {covers.map((m) => (
            <button key={m.id} onClick={() => setCase({ coverImage: m.url })} className={cn("overflow-hidden rounded-sm border-2", c.coverImage === m.url ? "border-amber" : "border-transparent hover:border-border")}>
              <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Pick from the Media Library. Upload new art in Media.</p>
      </Panel>
    </div>
  );
}
