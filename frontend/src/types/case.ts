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
  /** Search tool needed to notice this spot. Omitted = plain sight (or torchlight). */
  tool?: SearchTool | undefined;
  /** This spot is inside another hotspot (a drawer, a basket…) and only shows once that one is opened. */
  parentId?: string | undefined;
  /** Combination the player must enter before a container opens. */
  lock?: { code: string; prompt: string } | undefined;
}

export type SearchTool = "uv" | "powder";

export interface Scene {
  id: string;
  name: string;
  locationId: string;
  image: string;
  description: string;
  ambientAudio?: string | undefined;
  hotspots: Hotspot[];
  order: number;
  /** Unlit room: the player searches by torchlight. */
  dark?: boolean | undefined;
  /** Room stays shut until this holds (the location itself may already be open). */
  unlockCondition?: ConditionGroup | undefined;
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
  /** What this person answers when accused. The player must beat each objection with something from the case file. */
  objections?: Objection[] | undefined;
}

export interface Objection {
  text: string;
  /** Evidence or clue IDs that defeat the objection. Empty = it cannot be beaten (a sound alibi). */
  beatenBy: string[];
  /** Shown when the player fails to beat it. */
  fail: string;
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
  /** Spots on the item's image the player has to find for themselves. */
  details?: EvidenceDetail[] | undefined;
  /** A text the player reads; they must flag the lines that matter. */
  document?: { lines: string[]; key: Array<{ line: number; note: string; clueIds: string[] }> } | undefined;
  /** Other items this one can be compared against. */
  compare?: Array<{ withEvidenceId: string; note: string; clueIds: string[] }> | undefined;
  /** The item cannot be examined until this holds (a locked phone, a sealed file…). */
  lockedUntil?: ConditionGroup | undefined;
  lockedText?: string | undefined;
  isKey: boolean;
  isRedHerring: boolean;
}

export interface EvidenceDetail {
  id: string;
  /** Percentage 0–100 of the evidence image. */
  x: number;
  y: number;
  label: string;
  note: string;
  clueIds: string[];
  tool?: SearchTool | undefined;
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
  /** Interrogation: statements the player can press or challenge. When present it replaces the question menu. */
  testimony?: Statement[] | undefined;
  opening?: string | undefined;
  /** Wrong challenges allowed before the person stops answering accusations (default 3). */
  patience?: number | undefined;
  /** What they say to a challenge that proves nothing. */
  rebuff?: string | undefined;
}

export interface StatementReply {
  text: string;
  clueIds?: string[] | undefined;
  emotion?: Reaction["emotion"] | undefined;
}

export interface StatementChoice extends StatementReply {
  /** Recorded as a player choice, so conditions can branch on it. */
  id: string;
  label: string;
}

export interface Statement {
  id: string;
  /** The question in the detective's notebook that draws this statement out. */
  ask?: string | undefined;
  text: string;
  /** How they look and behave while saying it. The player reads this before judging. */
  tell?: { emotion: Reaction["emotion"]; text: string } | undefined;
  /** They are holding something back that pressure alone will shake loose: "Doubt" is the right call. */
  doubt?: StatementReply | undefined;
  /** The statement is only made once this holds. */
  condition?: ConditionGroup | undefined;
  /** Asking for more detail. */
  press?: (StatementReply & { question: string }) | undefined;
  /** Evidence or clue IDs that prove this statement false: "Lie" is the right call, backed by one of these. */
  contradictedBy?: string[] | undefined;
  /** What they say once caught. */
  exposed?: StatementReply | undefined;
  /** A one-time decision offered after the statement is exposed (or pressed, if it cannot be exposed). */
  choices?: StatementChoice[] | undefined;
}

/** A conclusion the player reaches by linking the right clues on the board. */
export interface Deduction {
  id: string;
  question: string;
  clueIds: string[];
  conclusionClueId: string;
}

export interface StoryEnding {
  id: string;
  outcome: "solved" | "incomplete" | "incorrect";
  title: string;
  text: string;
  condition?: ConditionGroup | undefined;
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
  /** Optional authored outcomes for a supported solution, an unproven suspect, or a wrong accusation. */
  endings?: Record<"solved" | "incomplete" | "incorrect", { title: string; text: string }>;
  /** Branch-specific endings; the first whose outcome and condition match wins over `endings`. */
  storyEndings?: StoryEnding[];
  /** Extra closing lines appended to the ending when their condition holds. */
  epilogues?: Array<{ condition: ConditionGroup; text: string }>;
  deductions?: Deduction[];
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
