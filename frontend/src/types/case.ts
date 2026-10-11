import type { ConditionGroup, Trigger } from "./conditions";

export type CaseStatus = "draft" | "review" | "scheduled" | "published" | "archived";
export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type CaseType = "Murder Mystery" | "Missing Person" | "Theft" | "Fraud" | "Cold Case";
export type Visibility = "public" | "private" | "beta";

export interface CaseVersion {
  version: string;
  createdAt: string;
  author: string;
  summary: string;
}

export interface Case {
  id: string;
  code: string;
  title: string;
  tagline: string;
  description: string;
  story: string;
  type: CaseType;
  difficulty: Difficulty;
  status: CaseStatus;
  version: string;
  versions: CaseVersion[];
  coverImage: string;
  estimatedMinutes: [number, number];
  location: string;
  incidentDate: string;
  tags: string[];
  victim: { name: string; age: number; occupation: string; description: string };
  objectives: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
  scheduledFor?: string | undefined;
  visibility: Visibility;
  stats: { players: number; completions: number; completionRate: number; avgScore: number; rating: number };
}

export type HotspotType = "evidence" | "body" | "inspect" | "navigation" | "dialogue" | "decor";
export type DiscoveryState = "visible" | "hidden" | "locked" | "requires_item";

export interface Hotspot {
  id: string;
  name: string;
  type: HotspotType;
  description: string;
  /** Percentage 0–100 of the scene image width/height. */
  x: number;
  y: number;
  radius: number;
  initialInfo: string;
  detailedInfo: string;
  evidenceId?: string | undefined;
  clueId?: string | undefined;
  requiredItemId?: string | undefined;
  unlockCondition?: ConditionGroup | undefined;
  discoveryState: DiscoveryState;
  audio?: string | undefined;
  extraImages: string[];
}

export interface Scene {
  id: string;
  name: string;
  locationId: string;
  image: string;
  description: string;
  ambientAudio?: string | undefined;
  hotspots: Hotspot[];
  order: number;
}

export interface Location {
  id: string;
  name: string;
  parentId?: string | undefined;
  address: string;
  description: string;
  image?: string | undefined;
  unlockedByDefault: boolean;
  unlockCondition?: ConditionGroup | undefined;
}

export type CharacterRole = "suspect" | "witness" | "victim" | "investigator" | "other";

export interface Character {
  id: string;
  name: string;
  age: number;
  occupation: string;
  role: CharacterRole;
  portrait?: string | undefined;
  relationship: string;
}

export interface Suspect extends Character {
  publicInfo: string;
  claim: string;
  hiddenInfo: string[];
  motive?: string | undefined;
  isKiller: boolean;
  isRedHerring: boolean;
  personality: string;
  interviewIds: string[];
}

export type EvidenceType = "physical" | "digital" | "document" | "forensic" | "testimony" | "footage";

export interface InspectionRequirement {
  kind: "previous_stage" | "clue" | "player_action" | "evidence" | "location";
  targetId?: string | undefined;
  label: string;
}

export interface EvidenceInspection {
  /** Zoomed-in detail shown once the stage is inspected. */
  image?: string | undefined;
  id: string;
  stage: number;
  title: string;
  description: string;
  requirements: InspectionRequirement[];
  revealsClueId?: string | undefined;
}

export interface Evidence {
  id: string;
  code: string;
  name: string;
  type: EvidenceType;
  image?: string | undefined;
  description: string;
  foundAtLocationId?: string | undefined;
  foundInSceneId?: string | undefined;
  discoveredBy: string;
  relatedSuspectIds: string[];
  relatedClueIds: string[];
  relatedTimelineIds: string[];
  inspections: EvidenceInspection[];
  isKey: boolean;
  isRedHerring: boolean;
}

export interface CaseDocument {
  id: string;
  title: string;
  kind: "report" | "letter" | "statement" | "record";
  body: string;
  evidenceId?: string | undefined;
}

export type DialogueNodeType =
  | "start"
  | "question"
  | "response"
  | "choice"
  | "present_evidence"
  | "reaction"
  | "clue"
  | "unlock"
  | "end";

export interface DialogueChoice {
  id: string;
  label: string;
  targetNodeId: string;
}

export interface Reaction {
  emotion: "calm" | "nervous" | "defensive" | "angry" | "sad" | "relieved";
  intensity: 1 | 2 | 3;
}

export interface DialogueNode {
  id: string;
  type: DialogueNodeType;
  speaker?: string | undefined;
  text: string;
  position: { x: number; y: number };
  condition?: ConditionGroup | undefined;
  evidenceId?: string | undefined;
  clueId?: string | undefined;
  unlockTargetId?: string | undefined;
  reaction?: Reaction | undefined;
  isContradiction?: boolean | undefined;
}

export interface DialogueEdge {
  id: string;
  source: string;
  target: string;
  label?: string | undefined;
}

export interface Interview {
  id: string;
  code: string;
  title: string;
  suspectId: string;
  locationId?: string | undefined;
  description: string;
  unlockedByDefault: boolean;
  unlockCondition?: ConditionGroup | undefined;
  nodes: DialogueNode[];
  edges: DialogueEdge[];
}

export type ClueCategory = "alibi" | "motive" | "method" | "opportunity" | "contradiction" | "red_herring" | "context";

export interface Clue {
  id: string;
  code: string;
  title: string;
  description: string;
  category: ClueCategory;
  importance: "critical" | "major" | "minor";
  sourceEvidenceIds: string[];
  sourceInterviewIds: string[];
  suspectIds: string[];
  isRedHerring: boolean;
}

export interface ClueConnection {
  id: string;
  from: string;
  to: string;
  relation: "supports" | "contradicts" | "leads_to" | "explains";
  label: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  locationId?: string | undefined;
  characterIds: string[];
  evidenceIds: string[];
  source: string;
  correctOrder: number;
  visibility: "visible" | "discoverable" | "hidden";
  isClaim: boolean;
  isTrue: boolean;
}

export type FlowNodeKind = "start" | "briefing" | "scene" | "evidence" | "interview" | "contradiction" | "location" | "timeline" | "theory" | "accusation" | "reveal";

export interface InvestigationNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
  refId?: string | undefined;
  required: boolean;
  position: { x: number; y: number };
}

export interface InvestigationEdge {
  id: string;
  source: string;
  target: string;
  label?: string | undefined;
}

export interface Theory {
  id: string;
  name: string;
  killerId: string;
  motive: string;
  method: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  requiredClueIds: string[];
  isCorrect: boolean;
}

export interface Hint {
  id: string;
  order: number;
  text: string;
  image?: string | undefined;
  cost: number;
  scorePenalty: number;
  unlockCondition?: ConditionGroup | undefined;
}

export interface ScoringConfig {
  maxScore: number;
  correctKiller: number;
  correctMotive: number;
  correctMethod: number;
  timelineAccuracy: number;
  perRequiredEvidence: number;
  timeBonusUnderMinutes: number;
  timeBonus: number;
  wrongAccusationPenalty: number;
}

export interface Solution {
  killerId: string;
  motive: string;
  method: string;
  weapon: string;
  correctTimelineIds: string[];
  requiredEvidenceIds: string[];
  supportingEvidenceIds: string[];
  acceptableAlternatives: string[];
  partialCredit: Array<{ label: string; points: number }>;
  scoring: ScoringConfig;
  explanation: string;
}

export interface RevealScene {
  id: string;
  order: number;
  time: string;
  title: string;
  text: string;
  image?: string | undefined;
  characterId?: string | undefined;
  audio?: string | undefined;
  durationSec: number;
  transition: "fade" | "cut" | "dissolve" | "slide";
  evidenceId?: string | undefined;
}

/** Full authoring aggregate for a single case. */
export interface CaseBundle {
  case: Case;
  locations: Location[];
  scenes: Scene[];
  suspects: Suspect[];
  evidence: Evidence[];
  documents: CaseDocument[];
  interviews: Interview[];
  clues: Clue[];
  clueConnections: ClueConnection[];
  triggers: Trigger[];
  timeline: TimelineEvent[];
  flowNodes: InvestigationNode[];
  flowEdges: InvestigationEdge[];
  theories: Theory[];
  hints: Hint[];
  solution: Solution;
  reveal: RevealScene[];
}
