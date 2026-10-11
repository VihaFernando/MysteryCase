import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Panel } from "@/components/common/Page";
import { BasicInfoForm, fromBasicValues, toBasicValues } from "../forms/BasicInfoForm";
import { createBlankBundle, uid } from "@/services/caseFactory";
import { validateCase, summarize } from "@/services/validation";
import { caseRepository } from "@/repositories/CaseRepository";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { CaseBundle } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STEPS = ["Basic Information", "Story Setup", "Crime Scene", "Characters", "Evidence", "Interviews", "Clues & Triggers", "Timeline", "Solution", "Testing", "Publish"];

type ListKey = "scenes" | "suspects" | "evidence" | "interviews" | "clues" | "timeline";

/** Minimal item factories for quick-add inside the wizard; full editing happens in the case editor. */
const makers: Record<ListKey, (name: string, b: CaseBundle) => CaseBundle> = {
  scenes: (name, b) => ({ ...b, scenes: [...b.scenes, { id: uid("scn"), name, locationId: "", image: b.case.coverImage, description: "", hotspots: [], order: b.scenes.length + 1 }] }),
  suspects: (name, b) => ({ ...b, suspects: [...b.suspects, { id: uid("sus"), name, age: 30, occupation: "", role: "suspect", relationship: "", publicInfo: "", claim: "", hiddenInfo: [], isKiller: false, isRedHerring: false, personality: "", interviewIds: [] }] }),
  evidence: (name, b) => ({ ...b, evidence: [...b.evidence, { id: uid("ev"), code: `EVID-${String(b.evidence.length + 1).padStart(3, "0")}`, name, type: "physical", description: "", discoveredBy: "", relatedSuspectIds: [], relatedClueIds: [], relatedTimelineIds: [], inspections: [], isKey: false, isRedHerring: false }] }),
  interviews: (name, b) => { const s = uid("n"); const e = uid("n"); return { ...b, interviews: [...b.interviews, { id: uid("int"), code: `INT-${String(b.interviews.length + 1).padStart(3, "0")}`, title: name, suspectId: b.suspects[0]?.id ?? "", description: "", unlockedByDefault: true, nodes: [{ id: s, type: "start", text: "Interview begins", position: { x: 200, y: 0 } }, { id: e, type: "end", text: "Interview complete", position: { x: 200, y: 200 } }], edges: [{ id: `${s}->${e}`, source: s, target: e }] }] }; },
  clues: (name, b) => ({ ...b, clues: [...b.clues, { id: uid("clue"), code: `CLU-${String(b.clues.length + 1).padStart(3, "0")}`, title: name, description: "", category: "context", importance: "minor", sourceEvidenceIds: [], sourceInterviewIds: [], suspectIds: [], isRedHerring: false }] }),
  timeline: (name, b) => ({ ...b, timeline: [...b.timeline, { id: uid("tl"), time: "21:00", title: name, description: "", characterIds: [], evidenceIds: [], source: "", correctOrder: b.timeline.length + 1, visibility: "visible", isClaim: false, isTrue: true }] }),
};

const labelOf = (b: CaseBundle, k: ListKey) => (b[k] as Array<{ id: string; name?: string; title?: string }>).map((x) => ({ id: x.id, label: x.name ?? x.title ?? "" }));

function QuickList({ bundle, k, placeholder, onChange }: { bundle: CaseBundle; k: ListKey; placeholder: string; onChange: (b: CaseBundle) => void }) {
  const [v, setV] = useState("");
  const items = labelOf(bundle, k);
  const add = () => { if (!v.trim()) return; onChange(makers[k](v.trim(), bundle)); setV(""); };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button variant="outline" onClick={add}><Plus className="size-3.5" />Add</Button>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">Nothing added yet — you can also add these later in the case editor.</li>}
        {items.map((i, idx) => (
          <li key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="font-mono text-[10px] text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
            <span className="flex-1">{i.label}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange({ ...bundle, [k]: (bundle[k] as Array<{ id: string }>).filter((x) => x.id !== i.id) })}><Trash2 className="size-3.5" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CaseWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [bundle, setBundle] = useState<CaseBundle>(() => createBlankBundle("pending", "CASE-NEW", { title: "", location: "" }));
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const results = useMemo(() => validateCase(bundle), [bundle]);
  const sum = summarize(results);

  const onBasic = useCallback((v: Parameters<typeof fromBasicValues>[0]) => setBundle((b) => ({ ...b, case: { ...b.case, ...fromBasicValues(v) } })), []);

  const save = async (openEditor = false) => {
    if (!bundle.case.title.trim()) { setStep(0); toast.error("Give the case a title before saving."); return; }
    setSaving(true);
    try {
      let id = savedId;
      if (!id) {
        const created = await caseRepository.create(bundle.case);
        id = created.case.id;
        setSavedId(id);
        await caseRepository.save({ ...bundle, case: { ...bundle.case, id, code: created.case.code } });
        setBundle((b) => ({ ...b, case: { ...b.case, id: id!, code: created.case.code } }));
      } else {
        await caseRepository.save({ ...bundle, case: { ...bundle.case, id } });
      }
      qc.invalidateQueries({ queryKey: qk.cases });
      toast.success("Draft saved");
      if (openEditor) navigate({ to: "/cases/$caseId", params: { caseId: id } });
    } finally { setSaving(false); }
  };

  const set = (patch: Partial<CaseBundle["case"]>) => setBundle((b) => ({ ...b, case: { ...b.case, ...patch } }));

  return (
    <div className="grid min-h-full grid-cols-[240px_1fr]">
      <aside className="border-r border-border bg-card/50 p-4">
        <div className="label-caps mb-3">New Case Wizard</div>
        <ol className="space-y-0.5">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button onClick={() => setStep(i)} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs", step === i ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50")}>
                <span className={cn("grid size-5 place-items-center rounded-full border font-mono text-[10px]", i < step ? "border-success bg-success-soft text-success" : step === i ? "border-amber text-amber" : "border-border")}>{i < step ? <Check className="size-3" /> : i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-md border border-border p-3 text-[11px] text-muted-foreground">Save at any step. Every section can be refined later in the full case editor.</div>
      </aside>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div>
            <div className="label-caps">Step {step + 1} of {STEPS.length}</div>
            <h1 className="font-display text-xl font-semibold">{STEPS[step]}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving}><Save className="size-3.5" />{saving ? "Saving…" : "Save draft"}</Button>
            {savedId && <Button variant="outline" size="sm" onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: savedId } })}>Open in editor</Button>}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-3xl">
            {step === 0 && <Panel><BasicInfoForm initial={toBasicValues(bundle.case)} onValidChange={onBasic} /></Panel>}
            {step === 1 && (
              <Panel className="space-y-4">
                <div className="space-y-4">
                  <Field label="Story setup"><Textarea rows={6} value={bundle.case.story} onChange={(e) => set({ story: e.target.value })} placeholder="What happened? What does the player know at the start?" /></Field>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Victim name"><Input value={bundle.case.victim.name} onChange={(e) => set({ victim: { ...bundle.case.victim, name: e.target.value } })} /></Field>
                    <Field label="Age"><Input type="number" value={bundle.case.victim.age || ""} onChange={(e) => set({ victim: { ...bundle.case.victim, age: Number(e.target.value) } })} /></Field>
                    <Field label="Occupation"><Input value={bundle.case.victim.occupation} onChange={(e) => set({ victim: { ...bundle.case.victim, occupation: e.target.value } })} /></Field>
                  </div>
                  <Field label="Player objectives" hint="One per line"><Textarea rows={3} value={bundle.case.objectives.join("\n")} onChange={(e) => set({ objectives: e.target.value.split("\n") })} /></Field>
                </div>
              </Panel>
            )}
            {step === 2 && <Panel title="Crime scenes"><QuickList bundle={bundle} k="scenes" placeholder="e.g. Living Room" onChange={setBundle} /></Panel>}
            {step === 3 && <Panel title="Characters & suspects"><QuickList bundle={bundle} k="suspects" placeholder="e.g. Sarah Fernando" onChange={setBundle} /></Panel>}
            {step === 4 && <Panel title="Evidence"><QuickList bundle={bundle} k="evidence" placeholder="e.g. Broken Wine Glass" onChange={setBundle} /></Panel>}
            {step === 5 && <Panel title="Interviews"><QuickList bundle={bundle} k="interviews" placeholder="e.g. Sarah — first interview" onChange={setBundle} /></Panel>}
            {step === 6 && <Panel title="Clues"><QuickList bundle={bundle} k="clues" placeholder="e.g. Last call at 10:17 PM" onChange={setBundle} /><p className="mt-3 text-xs text-muted-foreground">Triggers and conditions are built visually in the editor's Clues section once clues and evidence exist.</p></Panel>}
            {step === 7 && <Panel title="Timeline events"><QuickList bundle={bundle} k="timeline" placeholder="e.g. Victim makes a phone call" onChange={setBundle} /></Panel>}
            {step === 8 && (
              <Panel title="Solution">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Correct killer">
                    <Select value={bundle.solution.killerId} onValueChange={(v) => setBundle((b) => ({ ...b, solution: { ...b.solution, killerId: v } }))}>
                      <SelectTrigger><SelectValue placeholder={bundle.suspects.length ? "Select suspect" : "Add characters first"} /></SelectTrigger>
                      <SelectContent>{bundle.suspects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Motive"><Input value={bundle.solution.motive} onChange={(e) => setBundle((b) => ({ ...b, solution: { ...b.solution, motive: e.target.value } }))} /></Field>
                  <Field label="Method / weapon" className="md:col-span-2"><Input value={bundle.solution.method} onChange={(e) => setBundle((b) => ({ ...b, solution: { ...b.solution, method: e.target.value, weapon: e.target.value } }))} /></Field>
                </div>
              </Panel>
            )}
            {step === 9 && (
              <Panel title="Pre-flight check">
                <div className="mb-3 flex gap-3 text-xs"><span className="text-crimson">{sum.errors} errors</span><span className="text-amber">{sum.warnings} warnings</span><span className="text-success">{sum.passed} passed</span></div>
                <ul className="space-y-1">{results.filter((r) => r.severity !== "pass").map((r) => <li key={r.id} className="text-xs"><span className={r.severity === "error" ? "text-crimson" : "text-amber"}>●</span> {r.label}: <span className="text-muted-foreground">{r.messages[0]}</span></li>)}</ul>
              </Panel>
            )}
            {step === 10 && (
              <Panel title="Ready to continue">
                <p className="text-sm text-muted-foreground">New cases start as drafts. Save and open the full editor to build scenes, branching interviews and the reveal, then publish from the Publish step once validation passes.</p>
                <Button className="mt-4" onClick={() => save(true)} disabled={saving}>Save & open case editor</Button>
              </Panel>
            )}
          </div>
        </div>
        <div className="flex justify-between border-t border-border px-6 py-3">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ChevronLeft className="size-3.5" />Back</Button>
          {step < STEPS.length - 1 && <Button size="sm" onClick={() => setStep((s) => s + 1)}>Next<ChevronRight className="size-3.5" /></Button>}
        </div>
      </div>
    </div>
  );
}
