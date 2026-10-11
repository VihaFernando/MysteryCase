import type { Case, CaseBundle } from "@/types";
import { IMG } from "@/data/demo/images";

export function createBlankBundle(id: string, code: string, input: Partial<Case>): CaseBundle {
  const now = new Date().toISOString();
  return {
    case: {
      id, code,
      title: input.title ?? "Untitled Case",
      tagline: input.tagline ?? "",
      description: input.description ?? "",
      story: input.story ?? "",
      type: input.type ?? "Murder Mystery",
      difficulty: input.difficulty ?? "medium",
      status: "draft",
      version: "0.1",
      versions: [{ version: "0.1", createdAt: now, author: "Admin", summary: "Case created." }],
      coverImage: input.coverImage ?? IMG.coverLastCall,
      estimatedMinutes: input.estimatedMinutes ?? [30, 45],
      location: input.location ?? "",
      incidentDate: input.incidentDate ?? now.slice(0, 10),
      tags: input.tags ?? [],
      victim: input.victim ?? { name: "", age: 0, occupation: "", description: "" },
      objectives: input.objectives ?? ["Who did it?", "Why?", "How?"],
      createdBy: "Admin", createdAt: now, updatedAt: now,
      visibility: "private",
      stats: { players: 0, completions: 0, completionRate: 0, avgScore: 0, rating: 0 },
    },
    locations: [], scenes: [], suspects: [], evidence: [], documents: [], interviews: [], clues: [], clueConnections: [], triggers: [], timeline: [], flowNodes: [], flowEdges: [], theories: [], hints: [],
    solution: {
      killerId: "", motive: "", method: "", weapon: "", correctTimelineIds: [], requiredEvidenceIds: [], supportingEvidenceIds: [], acceptableAlternatives: [], partialCredit: [],
      scoring: { maxScore: 1000, correctKiller: 400, correctMotive: 200, correctMethod: 150, timelineAccuracy: 150, perRequiredEvidence: 20, timeBonusUnderMinutes: 40, timeBonus: 100, wrongAccusationPenalty: 300 },
      explanation: "",
    },
    reveal: [],
  };
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
