import type { Hint, RevealScene, Solution, Theory } from "@/types";
import { IMG } from "./images";

export const demoTheories: Theory[] = [
  { id: "th-1", name: "Michael — financial cover-up", killerId: "sus-michael", motive: "Financial dispute", method: "Wine bottle", supportingEvidenceIds: ["ev-005", "ev-003", "ev-006", "ev-007"], contradictingEvidenceIds: [], requiredClueIds: ["clue-004", "clue-006", "clue-009"], isCorrect: true },
  { id: "th-2", name: "Sarah — jealousy", killerId: "sus-sarah", motive: "Jealousy after breakup", method: "Wine glass", supportingEvidenceIds: ["ev-001"], contradictingEvidenceIds: ["ev-003", "ev-005"], requiredClueIds: ["clue-013"], isCorrect: false },
  { id: "th-3", name: "Nuwan — burglary gone wrong", killerId: "sus-nuwan", motive: "Robbery", method: "Blunt object", supportingEvidenceIds: ["ev-004"], contradictingEvidenceIds: ["ev-006", "ev-008"], requiredClueIds: [], isCorrect: false },
];

export const demoHints: Hint[] = [
  { id: "hint-1", order: 1, text: "Take another look at Daniel's phone.", cost: 1, scorePenalty: 50 },
  { id: "hint-2", order: 2, text: "Who did Daniel contact shortly before his death?", cost: 2, scorePenalty: 100, unlockCondition: { type: "group", id: "h2", operator: "AND", children: [{ type: "rule", id: "h2a", kind: "evidence_discovered", targetId: "ev-001" }] } },
  { id: "hint-3", order: 3, text: "Check the 10:17 PM call.", cost: 3, scorePenalty: 150, unlockCondition: { type: "group", id: "h3", operator: "AND", children: [{ type: "rule", id: "h3a", kind: "interview_completed", targetId: "int-sarah", negate: true }] } },
];

export const demoSolution: Solution = {
  killerId: "sus-michael",
  motive: "Financial dispute",
  method: "Struck with a wine bottle during an argument",
  weapon: "Wine bottle",
  correctTimelineIds: ["tl-00", "tl-01", "tl-03", "tl-05", "tl-06", "tl-07", "tl-08", "tl-09", "tl-10"],
  requiredEvidenceIds: ["ev-003", "ev-005", "ev-007", "ev-006", "ev-001"],
  supportingEvidenceIds: ["ev-002", "ev-008", "ev-004"],
  acceptableAlternatives: ["Embezzlement cover-up", "Silencing the whistleblower"],
  partialCredit: [
    { label: "Correct killer, wrong motive", points: 500 },
    { label: "Correct killer + motive, wrong weapon", points: 750 },
    { label: "Correct timeline ≥ 80%", points: 150 },
  ],
  scoring: { maxScore: 1000, correctKiller: 400, correctMotive: 200, correctMethod: 150, timelineAccuracy: 150, perRequiredEvidence: 20, timeBonusUnderMinutes: 40, timeBonus: 100, wrongAccusationPenalty: 300 },
  explanation: "Michael returned at 9:42 PM after Daniel threatened to go to the auditors. When Daniel's call to Sarah revealed he was not alone, the argument escalated. Michael struck him with the wine bottle, cleaned the spill, and left via the parking stairwell at 10:31 PM.",
};

export const demoReveal: RevealScene[] = [
  { id: "rv-1", order: 1, time: "10:21 PM", title: "Confrontation", text: "Michael confronts Daniel.", image: IMG.sceneLiving, characterId: "sus-michael", durationSec: 6, transition: "fade", evidenceId: "ev-006", audio: "tension-low.ogg" },
  { id: "rv-2", order: 2, time: "10:24 PM", title: "Escalation", text: "Argument escalates.", image: IMG.sceneKitchen, characterId: "sus-michael", durationSec: 5, transition: "cut", evidenceId: "ev-007" },
  { id: "rv-3", order: 3, time: "10:27 PM", title: "The blow", text: "Michael attacks Daniel with the wine bottle.", image: IMG.evGlass, characterId: "sus-michael", durationSec: 4, transition: "cut", evidenceId: "ev-005", audio: "glass-shatter.ogg" },
  { id: "rv-4", order: 4, time: "10:29 PM", title: "Cover-up", text: "Michael attempts to remove evidence.", image: IMG.sceneKitchen, characterId: "sus-michael", durationSec: 6, transition: "dissolve", evidenceId: "ev-002" },
  { id: "rv-5", order: 5, time: "10:42 PM", title: "Discovery", text: "Body is discovered.", image: IMG.sceneEntrance, durationSec: 7, transition: "fade" },
];
