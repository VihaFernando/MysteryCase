import type { Case, CaseBundle, Solution } from "@/types";
import { IMG } from "./images";
import { demoSuspects } from "./suspects";
import { demoLocations, demoScenes } from "./locations";
import { demoDocuments, demoEvidence } from "./evidence";
import { demoInterviews } from "./interviews";
import { demoClueConnections, demoClues, demoTriggers } from "./clues";
import { demoTimeline } from "./timeline";
import { demoFlowEdges, demoFlowNodes } from "./investigationFlow";
import { demoHints, demoReveal, demoSolution, demoTheories } from "./solutions";

const lastCall: Case = {
  id: "case-001",
  code: "CASE-001",
  title: "The Last Call",
  tagline: "One phone call. Forty-three seconds. A locked door.",
  description: "Daniel Perera is found dead inside his Colombo apartment at 10:42 PM. The front door appears locked. Three people had contact with him that evening.",
  story: "Daniel Perera is found dead inside his apartment at 10:42 PM. The front door appears locked. Three people had contact with Daniel during the evening. The initial investigation finds several inconsistencies. Who killed Daniel? Why? How? What happened between 9:00 PM and 10:42 PM?",
  type: "Murder Mystery",
  difficulty: "medium",
  status: "published",
  version: "1.2",
  versions: [
    { version: "1.2", createdAt: "2026-10-07T19:12:00Z", author: "Sarah K.", summary: "Rebalanced hint penalties, added parking camera evidence." },
    { version: "1.1", createdAt: "2026-09-28T10:30:00Z", author: "Admin", summary: "Added Nuwan interview branch and pharmacy location." },
    { version: "1.0", createdAt: "2026-09-15T08:00:00Z", author: "Admin", summary: "Initial release." },
  ],
  coverImage: IMG.coverLastCall,
  estimatedMinutes: [35, 50],
  location: "Colombo, Sri Lanka",
  incidentDate: "2026-10-05",
  tags: ["murder", "colombo", "locked-room", "phone", "business"],
  victim: { name: "Daniel Perera", age: 34, occupation: "Business Owner", description: "Co-founder of Perera & Perera Logistics. Found in his living room with a head wound." },
  objectives: ["Who killed Daniel?", "Why?", "How?", "What happened between 9:00 PM and 10:42 PM?"],
  createdBy: "Admin",
  createdAt: "2026-09-02T09:00:00Z",
  updatedAt: "2026-10-08T15:12:00Z",
  publishedAt: "2026-09-15T12:00:00Z",
  visibility: "public",
  stats: { players: 12840, completions: 8732, completionRate: 68, avgScore: 742, rating: 4.7 },
};

const emptySolution = (killerId = ""): Solution => ({
  killerId, motive: "", method: "", weapon: "", correctTimelineIds: [], requiredEvidenceIds: [], supportingEvidenceIds: [], acceptableAlternatives: [], partialCredit: [],
  scoring: { maxScore: 1000, correctKiller: 400, correctMotive: 200, correctMethod: 150, timelineAccuracy: 150, perRequiredEvidence: 20, timeBonusUnderMinutes: 40, timeBonus: 100, wrongAccusationPenalty: 300 },
  explanation: "",
});

const shell = (c: Case): CaseBundle => ({
  case: c, locations: [], scenes: [], suspects: [], evidence: [], documents: [], interviews: [], clues: [], clueConnections: [], triggers: [], timeline: [], flowNodes: [], flowEdges: [], theories: [], hints: [], solution: emptySolution(), reveal: [],
});

const meta = (over: Partial<Case> & Pick<Case, "id" | "code" | "title">): Case => ({
  ...lastCall,
  versions: [{ version: over.version ?? "0.1", createdAt: over.createdAt ?? "2026-09-20T10:00:00Z", author: over.createdBy ?? "Admin", summary: "Initial draft." }],
  publishedAt: undefined,
  ...over,
});

export function createDemoBundles(): CaseBundle[] {
  return [
    {
      case: lastCall,
      locations: demoLocations, scenes: demoScenes, suspects: demoSuspects, evidence: demoEvidence, documents: demoDocuments,
      interviews: demoInterviews, clues: demoClues, clueConnections: demoClueConnections, triggers: demoTriggers, timeline: demoTimeline,
      flowNodes: demoFlowNodes, flowEdges: demoFlowEdges, theories: demoTheories, hints: demoHints, solution: demoSolution, reveal: demoReveal,
    },
    shell(meta({ id: "case-002", code: "CASE-002", title: "Mist over Haputale", tagline: "A planter vanishes from his own bungalow.", description: "A tea estate owner disappears during a monsoon night. His study is ransacked, his car still in the drive.", type: "Missing Person", difficulty: "hard", status: "review", version: "0.9", coverImage: IMG.cover2, location: "Haputale, Sri Lanka", incidentDate: "2026-07-14", tags: ["hills", "estate", "missing"], createdBy: "Sarah K.", createdAt: "2026-08-12T09:00:00Z", updatedAt: "2026-10-08T11:40:00Z", stats: { players: 0, completions: 0, completionRate: 0, avgScore: 0, rating: 0 } })),
    shell(meta({ id: "case-003", code: "CASE-003", title: "Night Mail to Badulla", tagline: "A passenger boards. Her luggage arrives alone.", description: "A journalist disappears from a sleeper carriage between Nanu Oya and Ella.", type: "Missing Person", difficulty: "expert", status: "scheduled", version: "1.0", coverImage: IMG.cover3, location: "Uva Province", incidentDate: "2026-03-02", tags: ["train", "journalist"], createdBy: "Ravi D.", createdAt: "2026-07-01T09:00:00Z", updatedAt: "2026-10-06T16:20:00Z", scheduledFor: "2026-10-20T12:00:00Z", stats: { players: 0, completions: 0, completionRate: 0, avgScore: 0, rating: 0 } })),
    shell(meta({ id: "case-004", code: "CASE-004", title: "The Galle Fort Ledger", tagline: "A forged deed. A dead notary.", description: "A notary is found in the archive room the morning before a property hearing.", type: "Fraud", difficulty: "medium", status: "published", version: "2.0", coverImage: IMG.sceneEntrance, location: "Galle, Sri Lanka", incidentDate: "2026-05-10", tags: ["fraud", "heritage"], createdBy: "Admin", createdAt: "2026-04-01T09:00:00Z", updatedAt: "2026-10-04T09:10:00Z", publishedAt: "2026-06-01T09:00:00Z", stats: { players: 9410, completions: 5270, completionRate: 56, avgScore: 688, rating: 4.4 } })),
    shell(meta({ id: "case-005", code: "CASE-005", title: "Kitchen Fire at No. 9", tagline: "An accident — or a perfect alibi?", description: "A restaurant owner dies in a kitchen fire hours before selling the business.", type: "Murder Mystery", difficulty: "easy", status: "draft", version: "0.3", coverImage: IMG.sceneKitchen, location: "Kandy, Sri Lanka", incidentDate: "2026-08-21", tags: ["fire", "restaurant"], createdBy: "Ravi D.", createdAt: "2026-09-25T09:00:00Z", updatedAt: "2026-10-07T13:55:00Z", stats: { players: 0, completions: 0, completionRate: 0, avgScore: 0, rating: 0 } })),
    shell(meta({ id: "case-006", code: "CASE-006", title: "The Pettah Exchange", tagline: "Missing gems. Three brothers. One key.", description: "A gem shop vault is emptied overnight with no signs of entry.", type: "Theft", difficulty: "medium", status: "archived", version: "1.4", coverImage: IMG.evRecords, location: "Colombo, Sri Lanka", incidentDate: "2025-12-02", tags: ["heist"], createdBy: "Admin", createdAt: "2025-11-01T09:00:00Z", updatedAt: "2026-06-30T09:00:00Z", publishedAt: "2026-01-10T09:00:00Z", stats: { players: 6120, completions: 4410, completionRate: 72, avgScore: 801, rating: 4.2 } })),
  ];
}
