export type ConditionKind =
  | "evidence_discovered"
  | "clue_discovered"
  | "interview_completed"
  | "question_answered"
  | "location_visited"
  | "suspect_interviewed"
  | "timeline_event_discovered"
  | "player_choice"
  | "case_progress";

export interface ConditionRule {
  type: "rule";
  id: string;
  kind: ConditionKind;
  /** Referenced entity ID, or a percentage string for case_progress. */
  targetId: string;
  negate?: boolean | undefined;
}

export interface ConditionGroup {
  type: "group";
  id: string;
  operator: "AND" | "OR";
  negate?: boolean | undefined;
  children: Array<ConditionRule | ConditionGroup>;
}

export type Condition = ConditionRule | ConditionGroup;

export type TriggerActionKind =
  | "unlock_question"
  | "unlock_interview"
  | "unlock_location"
  | "unlock_clue"
  | "reveal_contradiction"
  | "unlock_timeline_event"
  | "show_notification";

export interface TriggerAction {
  id: string;
  kind: TriggerActionKind;
  targetId: string;
  label: string;
}

export interface Trigger {
  id: string;
  name: string;
  description: string;
  condition: ConditionGroup;
  actions: TriggerAction[];
  enabled: boolean;
}
