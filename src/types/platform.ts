export type MediaKind = "image" | "crime_scene" | "evidence" | "portrait" | "audio" | "video" | "document" | "music" | "sfx";

export interface MediaUsage {
  caseId: string;
  entity: string;
  entityId: string;
  label: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  sizeKb: number;
  dimensions?: string | undefined;
  durationSec?: number | undefined;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  usage: MediaUsage[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedBy: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface PlayerProgress {
  playerId: string;
  name: string;
  rank: string;
  casesCompleted: number;
  avgScore: number;
  totalMinutes: number;
  lastActive: string;
  platform: "android" | "ios";
}

export interface DailyMetric {
  date: string;
  starts: number;
  completions: number;
  avgScore: number;
}

export interface Analytics {
  caseId: string;
  starts: number;
  completions: number;
  completionRate: number;
  avgScore: number;
  avgPlayMinutes: number;
  evidenceDiscovery: Array<{ id: string; name: string; rate: number }>;
  mostMissedClue: string;
  mostFailedInterview: string;
  wrongSuspects: Array<{ name: string; count: number }>;
  dropOff: Array<{ step: string; players: number }>;
  hintUsage: Array<{ hint: string; uses: number }>;
  timelineMistakes: Array<{ event: string; mistakes: number }>;
  daily: DailyMetric[];
}

export type NotificationKind = "player_activity" | "case_published" | "review_requested" | "validation_failed" | "scheduled_release" | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  caseId?: string | undefined;
}

export type Permission =
  | "cases.create"
  | "cases.edit"
  | "cases.delete"
  | "cases.publish"
  | "cases.review"
  | "media.upload"
  | "media.delete"
  | "analytics.view"
  | "users.manage"
  | "settings.manage";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarColor: string;
  status: "online" | "away" | "offline";
  lastActive: string;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  oldValue?: string | undefined;
  newValue?: string | undefined;
}

export interface ActivityItem {
  id: string;
  actor: string;
  text: string;
  at: string;
  kind: "edit" | "publish" | "media" | "review" | "create";
}
