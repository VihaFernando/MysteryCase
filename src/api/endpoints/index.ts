import { apiClient } from "../ApiClient";
import type {
  Analytics, Case, CaseBundle, Clue, Evidence, Interview, MediaAsset, Notification, Suspect, TimelineEvent, User,
} from "@/types";

/** Typed REST endpoint map for the future Bun backend. Components never call these directly. */
export const casesApi = {
  list: () => apiClient.get<Case[]>("/cases"),
  get: (id: string) => apiClient.get<CaseBundle>(`/cases/${id}`),
  create: (body: Partial<Case>) => apiClient.post<CaseBundle>("/cases", body),
  update: (id: string, body: Partial<CaseBundle>) => apiClient.patch<CaseBundle>(`/cases/${id}`, body),
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

export const mediaApi = {
  list: () => apiClient.get<MediaAsset[]>("/media"),
  remove: (id: string) => apiClient.delete<void>(`/media/${id}`),
  upsert: (asset: MediaAsset) => apiClient.put<MediaAsset>(`/media/${asset.id}`, asset),
};
export const analyticsApi = { forCase: (caseId: string) => apiClient.get<Analytics>(`/analytics/cases/${caseId}`) };
export const usersApi = { list: () => apiClient.get<User[]>("/users"), update: (u: User) => apiClient.patch<User>(`/users/${u.id}`, u) };
export const notificationsApi = { list: () => apiClient.get<Notification[]>("/notifications"), markRead: (id: string) => apiClient.post<void>(`/notifications/${id}/read`) };
