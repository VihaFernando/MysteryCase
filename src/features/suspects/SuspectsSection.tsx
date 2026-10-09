import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Skull, Trash2, UserRound, Eye, EyeOff } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { suspectSchema, type SuspectValues } from "@/schemas/case";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, Panel, EmptyState } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uid } from "@/services/caseFactory";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Suspect } from "@/types";

const toValues = (s: Suspect): SuspectValues => ({ name: s.name, age: s.age, occupation: s.occupation, relationship: s.relationship, publicInfo: s.publicInfo, claim: s.claim, hiddenInfo: s.hiddenInfo.join("\n"), motive: s.motive ?? "", personality: s.personality, isKiller: s.isKiller, isRedHerring: s.isRedHerring, role: s.role });

function SuspectForm({ suspect, onSave }: { suspect: Suspect; onSave: (s: Suspect) => void }) {
  const form = useForm<SuspectValues>({ resolver: zodResolver(suspectSchema), defaultValues: toValues(suspect), mode: "onChange" });
  const { register, watch, setValue, formState: { errors } } = form;
  useEffect(() => {
    const sub = watch(async () => {
      if (!(await form.trigger())) return;
      const v = form.getValues();
      onSave({ ...suspect, ...v, hiddenInfo: v.hiddenInfo.split("\n").filter(Boolean), motive: v.motive || undefined });
    });
    return () => sub.unsubscribe();
  }, [watch, form, suspect, onSave]);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Full name"><Input {...register("name")} />{errors.name && <span className="text-[11px] text-crimson">{errors.name.message}</span>}</Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Age"><Input type="number" {...register("age", { valueAsNumber: true })} /></Field>
        <Field label="Role">
          <Select value={watch("role")} onValueChange={(v) => setValue("role", v as SuspectValues["role"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["suspect", "witness", "victim", "investigator", "other"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Occupation"><Input {...register("occupation")} /></Field>
      <Field label="Relationship to victim"><Input {...register("relationship")} /></Field>
      <Field label="Public information" className="md:col-span-2"><Textarea rows={2} {...register("publicInfo")} /></Field>
      <Field label="Claim / alibi" className="md:col-span-2"><Textarea rows={2} {...register("claim")} /></Field>
      <Field label="Hidden information" hint="One fact per line — revealed through evidence and interviews" className="md:col-span-2"><Textarea rows={4} className="border-crimson/30" {...register("hiddenInfo")} /></Field>
      <Field label="Motive"><Input {...register("motive")} /></Field>
      <Field label="Personality / acting notes"><Input {...register("personality")} /></Field>
      <div className="flex items-center gap-6 md:col-span-2">
        <label className="flex items-center gap-2 text-xs"><Switch checked={watch("isKiller")} onCheckedChange={(v) => setValue("isKiller", v, { shouldValidate: true })} />Is the killer</label>
        <label className="flex items-center gap-2 text-xs"><Switch checked={watch("isRedHerring")} onCheckedChange={(v) => setValue("isRedHerring", v, { shouldValidate: true })} />Red herring</label>
      </div>
    </div>
  );
}

export function SuspectsSection() {
  const { bundle, update } = useCaseDraft();
  const [selId, setSelId] = useState(bundle.suspects[0]?.id ?? "");
  const [showHidden, setShowHidden] = useState(true);
  const [del, setDel] = useState<Suspect | null>(null);
  const sel = bundle.suspects.find((s) => s.id === selId);

  const save = (s: Suspect) => update((b) => ({ ...b, suspects: replaceById(b.suspects, s) }));
  const add = () => {
    const s: Suspect = { id: uid("sus"), name: "New Character", age: 30, occupation: "", role: "suspect", relationship: "", publicInfo: "", claim: "", hiddenInfo: [], isKiller: false, isRedHerring: false, personality: "", interviewIds: [] };
    update((b) => ({ ...b, suspects: [...b.suspects, s] }));
    setSelId(s.id);
  };

  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Suspects & characters <span className="ml-1 font-mono text-xs text-muted-foreground">{bundle.suspects.length}</span></h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHidden((v) => !v)}>{showHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{showHidden ? "Hide" : "Show"} secrets</Button>
            <Button size="sm" onClick={add}><Plus className="size-3.5" />Add suspect</Button>
          </div>
        </div>
        {bundle.suspects.length === 0 && <EmptyState icon={UserRound} title="No suspects yet" action={<Button size="sm" onClick={add}>Add suspect</Button>} />}
        {bundle.suspects.map((s) => {
          const evidence = bundle.evidence.filter((e) => e.relatedSuspectIds.includes(s.id));
          const interviews = bundle.interviews.filter((i) => i.suspectId === s.id);
          return (
            <button key={s.id} onClick={() => setSelId(s.id)} className={cn("flex w-full gap-3 rounded-md border bg-card p-3 text-left transition-colors", s.id === selId ? "border-amber/60" : "border-border hover:border-muted-foreground/40")}>
              {s.portrait ? <img src={s.portrait} alt={s.name} className="h-20 w-16 rounded-sm object-cover grayscale-[30%]" /> : <div className="grid h-20 w-16 place-items-center rounded-sm bg-muted font-mono text-sm">{initials(s.name)}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.age}</span>
                  {showHidden && s.isKiller && <Pill tone="crimson"><Skull className="size-2.5" />Killer</Pill>}
                  {showHidden && s.isRedHerring && <Pill tone="amber">Red herring</Pill>}
                  <Pill tone={s.role === "witness" ? "info" : "neutral"}>{s.role}</Pill>
                </div>
                <div className="text-xs text-muted-foreground">{s.occupation} · {s.relationship}</div>
                <div className="mt-1.5 text-xs"><span className="label-caps mr-1">Claim</span>{s.claim}</div>
                {showHidden && s.hiddenInfo[0] && <div className="mt-1 text-xs text-crimson/90"><span className="label-caps mr-1 text-crimson">Hidden</span>{s.hiddenInfo[0]}{s.hiddenInfo.length > 1 && ` (+${s.hiddenInfo.length - 1})`}</div>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {interviews.map((i) => <Pill key={i.id} tone="violet">{i.code}</Pill>)}
                  {evidence.map((e) => <Pill key={e.id} tone="amber">{e.code}</Pill>)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {sel && (
        <Panel title={`Edit — ${sel.name}`} actions={<Button variant="ghost" size="sm" className="text-crimson" onClick={() => setDel(sel)}><Trash2 className="size-3.5" />Delete</Button>}>
          <SuspectForm key={sel.id} suspect={sel} onSave={save} />
        </Panel>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete ${del?.name}?`} description="Interviews and evidence links to this character will be left orphaned and flagged by validation." destructive confirmLabel="Delete"
        onConfirm={() => { if (del) { update((b) => ({ ...b, suspects: b.suspects.filter((s) => s.id !== del.id) })); toast.success(`${del.name} deleted`); setSelId(bundle.suspects.find((s) => s.id !== del.id)?.id ?? ""); } setDel(null); }} />
    </div>
  );
}
