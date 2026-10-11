import { apiClient } from "../ApiClient";
import type {
  Achievement, ActivityItem, Analytics, AuditEntry, Case, CaseBundle, Clue, Evidence, Interview, Location, MediaAsset, Notification, PlayerProgress, Role, Suspect, TimelineEvent, User,
} from "@/types";

/** Typed REST endpoint map for the future Bun backend. Components never call these directly. */
export const casesApi = {
  list: () => apiClient.get<Case[]>("/cases"),
  get: (id: string) => apiClient.get<CaseBundle>(`/cases/${id}`),
  bundles: () => apiClient.get<CaseBundle[]>("/bundles"),
  /** Creates or fully replaces a case bundle. */
  put: (bundle: CaseBundle) => apiClient.put<CaseBundle>(`/cases/${bundle.case.id}`, bundle),
  remove: (id: string) => apiClient.delete<void>(`/cases/${id}`),
  publish: (id: string) => apiClient.post<Case>(`/cases/${id}/publish`),
};

const nested = <T extends { id: string }>(resource: string) => ({
  list: (caseId: string) => apiClient.get<T[]>(`/cases/${caseId}/${resource}`),
  upsert: (caseId: string, item: T) => apiClient.put<T>(`/cases/${caseId}/${resource}/${item.id}`, item),
  remove: (caseId: string, id: string) => apiClient.delete<void>(`/cases/${caseId}/${resource}/${id}`),
});

export const suspectsApi = nested<Suspect>("suspects");
export const evidenceApi = nested<Evidence>("evidence");
export const interviewsApi = nested<Interview>("interviews");
export const cluesApi = nested<Clue>("clues");
export const timelineApi = nested<TimelineEvent>("timeline");
export const locationsApi = nested<Location>("locations");

export const mediaApi = {
  list: () => apiClient.get<MediaAsset[]>("/media"),
  remove: (id: string) => apiClient.delete<void>(`/media/${id}`),
  upsert: (asset: MediaAsset) => apiClient.put<MediaAsset>(`/media/${asset.id}`, asset),
};
export const analyticsApi = {
  forCase: (caseId: string) => apiClient.get<Analytics>(`/analytics/cases/${caseId}`),
  players: () => apiClient.get<PlayerProgress[]>("/players"),
  achievements: () => apiClient.get<Achievement[]>("/achievements"),
  activity: () => apiClient.get<ActivityItem[]>("/activity"),
};
export const usersApi = {
  list: () => apiClient.get<User[]>("/users"),
  update: (u: User) => apiClient.put<User>(`/users/${u.id}`, u),
  roles: () => apiClient.get<Role[]>("/roles"),
  updateRole: (r: Role) => apiClient.put<Role>(`/roles/${r.id}`, r),
  audit: () => apiClient.get<AuditEntry[]>("/audit"),
  log: (entry: Omit<AuditEntry, "id" | "timestamp">) => apiClient.post<AuditEntry>("/audit", entry),
};
export const notificationsApi = {
  list: () => apiClient.get<Notification[]>("/notifications"),
  push: (n: Omit<Notification, "id" | "createdAt" | "read">) => apiClient.post<Notification>("/notifications", n),
  markRead: (id: string) => apiClient.post<void>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post<void>("/notifications/read-all"),
};
