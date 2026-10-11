import { Type, type Static, type TSchema } from "@sinclair/typebox";
import { DefaultErrorFunction, SetErrorFunction } from "@sinclair/typebox/errors";

// Per-field messages: pass `{ errorMessage }` to any schema; falls back to TypeBox's default text.
SetErrorFunction((e) => (e.schema as { errorMessage?: string }).errorMessage ?? DefaultErrorFunction(e));

// ponytail: no auto-trim (zod's .trim()); TypeBox validates only. Trim on submit if whitespace-only input matters.
const Str = (min: number, max: number, errorMessage?: string) =>
  Type.String({ minLength: min, maxLength: max, ...(errorMessage && { errorMessage }) });
const Num = (min: number, max: number) =>
  Type.Integer({ minimum: min, maximum: max, errorMessage: "Must be a number" } as object);
const Enum = <T extends string[]>(...v: T) => Type.Union(v.map((x) => Type.Literal(x)) as TSchema[]) as unknown as TSchema & { static: T[number] };

export const basicInfoSchema = Type.Object({
  title: Str(3, 80, "Title must be at least 3 characters"),
  tagline: Str(0, 120),
  type: Enum("Murder Mystery", "Missing Person", "Theft", "Fraud", "Cold Case"),
  difficulty: Enum("easy", "medium", "hard", "expert"),
  minMinutes: Num(5, 240),
  maxMinutes: Num(5, 300),
  location: Str(2, 80, "Location is required"),
  incidentDate: Str(1, 100, "Incident date is required"),
  tags: Str(0, 200),
  description: Str(0, 600),
});
export type BasicInfoValues = Static<typeof basicInfoSchema>;

export const storySchema = Type.Object({
  story: Str(20, 4000, "Write at least a short story setup"),
  victimName: Str(2, 200, "Victim name is required"),
  victimAge: Num(0, 120),
  victimOccupation: Str(0, 80),
  victimDescription: Str(0, 400),
  objectives: Str(0, 600),
});
export type StoryValues = Static<typeof storySchema>;

export const suspectSchema = Type.Object({
  name: Str(2, 200, "Name is required"),
  age: Num(1, 120),
  occupation: Str(0, 80),
  relationship: Str(0, 120),
  publicInfo: Str(0, 600),
  claim: Str(0, 600),
  hiddenInfo: Str(0, 2000),
  motive: Str(0, 400),
  personality: Str(0, 400),
  isKiller: Type.Boolean(),
  isRedHerring: Type.Boolean(),
  role: Enum("suspect", "witness", "victim", "investigator", "other"),
});
export type SuspectValues = Static<typeof suspectSchema>;

export const evidenceSchema = Type.Object({
  code: Type.String({ pattern: "^EVID-\\d{3}$", errorMessage: "Format: EVID-000" } as object),
  name: Str(2, 200, "Name is required"),
  type: Enum("physical", "digital", "document", "forensic", "testimony", "footage"),
  description: Str(0, 800),
  foundAtLocationId: Type.String(),
  discoveredBy: Str(0, 120),
  isKey: Type.Boolean(),
  isRedHerring: Type.Boolean(),
});
export type EvidenceValues = Static<typeof evidenceSchema>;

/** Cross-field rule TypeBox can't express; call from the form's submit/validate step. */
export const maxMinutesError = (v: Pick<BasicInfoValues, "minMinutes" | "maxMinutes">) =>
  v.maxMinutes >= v.minMinutes ? undefined : "Max must be ≥ min";
