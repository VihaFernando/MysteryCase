import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { caseRepository } from "@/repositories/CaseRepository";
import { mediaRepository } from "@/repositories/MediaRepository";
import { analyticsRepository } from "@/repositories/AnalyticsRepository";
import { notificationRepository, userRepository } from "@/repositories/UserRepository";
import { suspectRepository, locationRepository } from "@/repositories/SuspectRepository";
import { evidenceRepository } from "@/repositories/EvidenceRepository";
import { interviewRepository } from "@/repositories/InterviewRepository";
import { clueRepository } from "@/repositories/ClueRepository";
import { timelineRepository } from "@/repositories/TimelineRepository";
import type { Case, CaseStatus, MediaAsset, Role, User } from "@/types";

export const qk = {
  cases: ["cases"] as const,
  case: (id: string) => ["case", id] as const,
  media: ["media"] as const,
  analytics: (id: string) => ["analytics", id] as const,
  players: ["players"] as const,
  achievements: ["achievements"] as const,
  activity: ["activity"] as const,
  users: ["users"] as const,
  roles: ["roles"] as const,
  audit: ["audit"] as const,
  notifications: ["notifications"] as const,
  all: (slice: string) => ["all", slice] as const,
};

export const useCases = () => useQuery({ queryKey: qk.cases, queryFn: () => caseRepository.list() });
export const useCaseBundle = (id: string) => useQuery({ queryKey: qk.case(id), queryFn: () => caseRepository.get(id) });

export function useCaseActions() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: qk.cases });
    if (id) qc.invalidateQueries({ queryKey: qk.case(id) });
    qc.invalidateQueries({ queryKey: ["all"] });
  };
  return {
    create: useMutation({ mutationFn: (input: Partial<Case>) => caseRepository.create(input), onSuccess: () => invalidate() }),
    duplicate: useMutation({ mutationFn: (id: string) => caseRepository.duplicate(id), onSuccess: () => invalidate() }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: CaseStatus }) => caseRepository.setStatus(id, status),
      onSuccess: (c) => {
        invalidate(c.id);
        userRepository.log({ userId: "u-admin", action: "Status change", resource: c.code, newValue: c.status });
        if (c.status === "published") notificationRepository.push({ kind: "case_published", title: "Case published", body: `${c.code} ${c.title} v${c.version} is live.`, caseId: c.id }).then(() => qc.invalidateQueries({ queryKey: qk.notifications }));
      },
    }),
    remove: useMutation({ mutationFn: (id: string) => caseRepository.remove(id), onSuccess: () => invalidate() }),
  };
}

const allQuery = <T,>(slice: string, fn: () => Promise<T>) => ({ queryKey: qk.all(slice), queryFn: fn });
export const useAllSuspects = () => useQuery(allQuery("suspects", () => suspectRepository.listAll()));
export const useAllLocations = () => useQuery(allQuery("locations", () => locationRepository.listAll()));
export const useAllEvidence = () => useQuery(allQuery("evidence", () => evidenceRepository.listAll()));
export const useAllInterviews = () => useQuery(allQuery("interviews", () => interviewRepository.listAll()));
export const useAllClues = () => useQuery(allQuery("clues", () => clueRepository.listAll()));
export const useAllTimeline = () => useQuery(allQuery("timeline", () => timelineRepository.listAll()));

export const useMedia = () => useQuery({ queryKey: qk.media, queryFn: () => mediaRepository.list() });
export function useMediaActions() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: qk.media });
  return {
    upsert: useMutation({ mutationFn: (a: MediaAsset) => mediaRepository.upsert(a), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => mediaRepository.remove(id), onSuccess: done }),
  };
}

export const useAnalytics = (caseId: string) => useQuery({ queryKey: qk.analytics(caseId), queryFn: () => analyticsRepository.forCase(caseId) });
export const usePlayers = () => useQuery({ queryKey: qk.players, queryFn: () => analyticsRepository.players() });
export const useAchievements = () => useQuery({ queryKey: qk.achievements, queryFn: () => analyticsRepository.achievements() });
export const useActivity = () => useQuery({ queryKey: qk.activity, queryFn: () => analyticsRepository.activity() });

export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => userRepository.list() });
export const useRoles = () => useQuery({ queryKey: qk.roles, queryFn: () => userRepository.roles() });
export const useAudit = () => useQuery({ queryKey: qk.audit, queryFn: () => userRepository.audit() });
export function useUserActions() {
  const qc = useQueryClient();
  return {
    updateUser: useMutation({ mutationFn: (u: User) => userRepository.update(u), onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }) }),
    updateRole: useMutation({ mutationFn: (r: Role) => userRepository.updateRole(r), onSuccess: () => qc.invalidateQueries({ queryKey: qk.roles }) }),
  };
}

export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: () => notificationRepository.list() });
export function useNotificationActions() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: qk.notifications });
  return {
    markRead: useMutation({ mutationFn: (id: string) => notificationRepository.markRead(id), onSuccess: done }),
    markAll: useMutation({ mutationFn: () => notificationRepository.markAllRead(), onSuccess: done }),
  };
}
