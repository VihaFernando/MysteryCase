import { z } from "zod";

export const basicInfoSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80),
  tagline: z.string().trim().max(120),
  type: z.enum(["Murder Mystery", "Missing Person", "Theft", "Fraud", "Cold Case"]),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  minMinutes: z.number({ invalid_type_error: "Must be a number" }).int().min(5).max(240),
  maxMinutes: z.number({ invalid_type_error: "Must be a number" }).int().min(5).max(300),
  location: z.string().trim().min(2, "Location is required").max(80),
  incidentDate: z.string().min(1, "Incident date is required"),
  tags: z.string().max(200),
  description: z.string().trim().max(600),
}).refine((v) => v.maxMinutes >= v.minMinutes, { message: "Max must be ≥ min", path: ["maxMinutes"] });

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const storySchema = z.object({
  story: z.string().trim().min(20, "Write at least a short story setup").max(4000),
  victimName: z.string().trim().min(2, "Victim name is required"),
  victimAge: z.number({ invalid_type_error: "Must be a number" }).int().min(0).max(120),
  victimOccupation: z.string().trim().max(80),
  victimDescription: z.string().trim().max(400),
  objectives: z.string().trim().max(600),
});
export type StoryValues = z.infer<typeof storySchema>;

export const suspectSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  age: z.number({ invalid_type_error: "Must be a number" }).int().min(1).max(120),
  occupation: z.string().trim().max(80),
  relationship: z.string().trim().max(120),
  publicInfo: z.string().trim().max(600),
  claim: z.string().trim().max(600),
  hiddenInfo: z.string().max(2000),
  motive: z.string().max(400),
  personality: z.string().max(400),
  isKiller: z.boolean(),
  isRedHerring: z.boolean(),
  role: z.enum(["suspect", "witness", "victim", "investigator", "other"]),
});
export type SuspectValues = z.infer<typeof suspectSchema>;

export const evidenceSchema = z.object({
  code: z.string().trim().regex(/^EVID-\d{3}$/, "Format: EVID-000"),
  name: z.string().trim().min(2, "Name is required"),
  type: z.enum(["physical", "digital", "document", "forensic", "testimony", "footage"]),
  description: z.string().trim().max(800),
  foundAtLocationId: z.string(),
  discoveredBy: z.string().max(120),
  isKey: z.boolean(),
  isRedHerring: z.boolean(),
});
export type EvidenceValues = z.infer<typeof evidenceSchema>;
