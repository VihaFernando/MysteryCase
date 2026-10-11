import { useForm } from "react-hook-form";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useEffect } from "react";
import { basicInfoSchema, maxMinutesError, type BasicInfoValues } from "@/schemas/case";
import type { Case } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/Page";

export const toBasicValues = (c: Partial<Case>): BasicInfoValues => ({
  title: c.title ?? "", tagline: c.tagline ?? "", type: c.type ?? "Murder Mystery", difficulty: c.difficulty ?? "medium",
  minMinutes: c.estimatedMinutes?.[0] ?? 30, maxMinutes: c.estimatedMinutes?.[1] ?? 45, location: c.location ?? "",
  incidentDate: c.incidentDate ?? "", tags: (c.tags ?? []).join(", "), description: c.description ?? "",
});

export const fromBasicValues = (v: BasicInfoValues): Partial<Case> => ({
  title: v.title, tagline: v.tagline, type: v.type, difficulty: v.difficulty, estimatedMinutes: [v.minMinutes, v.maxMinutes],
  location: v.location, incidentDate: v.incidentDate, description: v.description, tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
});

/** Validated basic-info form. Emits valid values on every change for autosave. */
export function BasicInfoForm({ initial, onValidChange }: { initial: BasicInfoValues; onValidChange: (v: BasicInfoValues) => void }) {
  const form = useForm<BasicInfoValues>({ resolver: async (values, ctx, opts) => {
    const base = typeboxResolver(basicInfoSchema);
    const res = await base(values, ctx, opts);
    const message = Object.keys(res.errors).length ? undefined : maxMinutesError(values);
    return message ? { values: {}, errors: { maxMinutes: { type: "validate", message } } } : res;
  }, defaultValues: initial, mode: "onChange" });
  const { register, formState: { errors }, watch, setValue } = form;

  useEffect(() => {
    const sub = watch(async () => {
      const ok = await form.trigger();
      if (ok) onValidChange(form.getValues());
    });
    return () => sub.unsubscribe();
  }, [watch, form, onValidChange]);

  const err = (k: keyof BasicInfoValues) => errors[k]?.message && <span className="text-[11px] text-crimson">{errors[k]?.message}</span>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Case title" className="md:col-span-2"><Input {...register("title")} />{err("title")}</Field>
      <Field label="Tagline" className="md:col-span-2"><Input {...register("tagline")} placeholder="One sentence hook shown in the app store card" /></Field>
      <Field label="Case type">
        <Select value={watch("type")} onValueChange={(v) => setValue("type", v as BasicInfoValues["type"], { shouldDirty: true, shouldValidate: true })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["Murder Mystery", "Missing Person", "Theft", "Fraud", "Cold Case"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Difficulty">
        <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v as BasicInfoValues["difficulty"], { shouldDirty: true, shouldValidate: true })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["easy", "medium", "hard", "expert"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Estimated play time (min)">
        <div className="flex items-center gap-2"><Input type="number" {...register("minMinutes", { valueAsNumber: true })} /><span className="text-muted-foreground">–</span><Input type="number" {...register("maxMinutes", { valueAsNumber: true })} /></div>
        {err("maxMinutes")}
      </Field>
      <Field label="Incident date"><Input type="date" {...register("incidentDate")} />{err("incidentDate")}</Field>
      <Field label="Location"><Input {...register("location")} />{err("location")}</Field>
      <Field label="Tags" hint="Comma separated"><Input {...register("tags")} /></Field>
      <Field label="Description" className="md:col-span-2"><Textarea rows={3} {...register("description")} /></Field>
    </div>
  );
}
