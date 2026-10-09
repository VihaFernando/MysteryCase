import type { ServerEvent } from "./types";

export const SERVER_EVENTS: readonly ServerEvent[] = [
  "case.updated",
  "case.published",
  "case.deleted",
  "case.review_requested",
  "player.case_started",
  "player.case_completed",
  "analytics.updated",
  "notification.created",
] as const;

/** Which React Query keys each realtime event invalidates. */
export const EVENT_INVALIDATIONS: Partial<Record<ServerEvent, (payload: { caseId?: string }) => unknown[][]>> = {
  "case.updated": (p) => [["cases"], ["case", p.caseId]],
  "case.published": (p) => [["cases"], ["case", p.caseId]],
  "case.deleted": () => [["cases"]],
  "analytics.updated": (p) => [["analytics", p.caseId]],
  "notification.created": () => [["notifications"]],
};
