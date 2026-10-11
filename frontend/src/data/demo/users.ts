import type { AuditEntry, Notification, Permission, Role, User } from "@/types";

export const ALL_PERMISSIONS: Permission[] = ["cases.create", "cases.edit", "cases.delete", "cases.publish", "cases.review", "media.upload", "media.delete", "analytics.view", "users.manage", "settings.manage"];

export const demoRoles: Role[] = [
  { id: "role-super", name: "Super Admin", description: "Full access to the workspace.", permissions: ALL_PERMISSIONS },
  { id: "role-creator", name: "Case Creator", description: "Builds full cases end-to-end.", permissions: ["cases.create", "cases.edit", "media.upload", "analytics.view"] },
  { id: "role-writer", name: "Writer", description: "Writes story, dialogue and clues.", permissions: ["cases.edit"] },
  { id: "role-media", name: "Media Manager", description: "Manages the media library.", permissions: ["media.upload", "media.delete"] },
  { id: "role-reviewer", name: "Reviewer", description: "Reviews cases before release.", permissions: ["cases.review", "analytics.view"] },
  { id: "role-publisher", name: "Publisher", description: "Schedules and publishes cases.", permissions: ["cases.publish", "cases.review"] },
  { id: "role-analyst", name: "Analyst", description: "Read-only analytics access.", permissions: ["analytics.view"] },
];

export const demoUsers: User[] = [
  { id: "u-admin", name: "Admin", email: "admin@mysterycase.studio", roleId: "role-super", avatarColor: "oklch(0.55 0.15 25)", status: "online", lastActive: "2026-10-08T16:20:00Z" },
  { id: "u-sarah", name: "Sarah K.", email: "sarah@mysterycase.studio", roleId: "role-creator", avatarColor: "oklch(0.6 0.12 250)", status: "online", lastActive: "2026-10-08T15:12:00Z" },
  { id: "u-ravi", name: "Ravi D.", email: "ravi@mysterycase.studio", roleId: "role-writer", avatarColor: "oklch(0.65 0.13 80)", status: "away", lastActive: "2026-10-08T12:00:00Z" },
  { id: "u-media", name: "Media Team", email: "media@mysterycase.studio", roleId: "role-media", avatarColor: "oklch(0.6 0.12 160)", status: "offline", lastActive: "2026-10-08T11:48:00Z" },
  { id: "u-ishara", name: "Ishara W.", email: "ishara@mysterycase.studio", roleId: "role-reviewer", avatarColor: "oklch(0.6 0.1 300)", status: "online", lastActive: "2026-10-08T14:30:00Z" },
  { id: "u-dilan", name: "Dilan P.", email: "dilan@mysterycase.studio", roleId: "role-publisher", avatarColor: "oklch(0.55 0.1 200)", status: "offline", lastActive: "2026-10-07T18:00:00Z" },
  { id: "u-mala", name: "Mala R.", email: "mala@mysterycase.studio", roleId: "role-analyst", avatarColor: "oklch(0.65 0.1 120)", status: "away", lastActive: "2026-10-08T09:00:00Z" },
];

export const demoNotifications: Notification[] = [
  { id: "n-1", kind: "review_requested", title: "Review requested", body: "Sarah K. requested review for CASE-002 Mist over Haputale.", createdAt: "2026-10-08T11:40:00Z", read: false, caseId: "case-002" },
  { id: "n-2", kind: "case_published", title: "Case published", body: "CASE-004 The Galle Fort Ledger v2.0 is live.", createdAt: "2026-10-08T13:02:00Z", read: false, caseId: "case-004" },
  { id: "n-3", kind: "validation_failed", title: "Validation failed", body: "CASE-005 has 4 errors: missing solution, no scenes.", createdAt: "2026-10-07T14:00:00Z", read: false, caseId: "case-005" },
  { id: "n-4", kind: "player_activity", title: "Milestone", body: "CASE-001 passed 12,000 players.", createdAt: "2026-10-07T09:00:00Z", read: true, caseId: "case-001" },
  { id: "n-5", kind: "scheduled_release", title: "Scheduled release", body: "CASE-003 releases Oct 20, 2026 at 5:30 PM.", createdAt: "2026-10-06T16:20:00Z", read: true, caseId: "case-003" },
  { id: "n-6", kind: "system", title: "Maintenance window", body: "Media CDN maintenance Oct 12, 02:00–03:00 UTC.", createdAt: "2026-10-05T08:00:00Z", read: true },
];

export const demoAudit: AuditEntry[] = [
  { id: "al-1", userId: "u-admin", action: "Updated", resource: "Evidence EVID-005", timestamp: "2026-10-08T15:12:00Z", oldValue: "isKey: false", newValue: "isKey: true" },
  { id: "al-2", userId: "u-sarah", action: "Updated", resource: "Hint hint-3 (CASE-001)", timestamp: "2026-10-08T14:58:00Z", oldValue: "scorePenalty: 100", newValue: "scorePenalty: 150" },
  { id: "al-3", userId: "u-admin", action: "Published", resource: "CASE-004", timestamp: "2026-10-08T13:02:00Z", oldValue: "status: scheduled", newValue: "status: published" },
  { id: "al-4", userId: "u-media", action: "Uploaded", resource: "Media evid-parking.jpg", timestamp: "2026-10-08T11:48:00Z", newValue: "126 KB" },
  { id: "al-5", userId: "u-sarah", action: "Status change", resource: "CASE-002", timestamp: "2026-10-08T11:40:00Z", oldValue: "draft", newValue: "review" },
  { id: "al-6", userId: "u-ravi", action: "Created", resource: "CASE-005", timestamp: "2026-10-07T13:55:00Z" },
  { id: "al-7", userId: "u-ishara", action: "Commented", resource: "Interview INT-002", timestamp: "2026-10-07T10:20:00Z", newValue: "Michael breaks too early?" },
];
