import { analyticsApi } from "@/api/endpoints";
import type { Achievement, ActivityItem, Analytics, PlayerProgress } from "@/types";

export interface AnalyticsRepository {
  forCase(caseId: string): Promise<Analytics>;
  players(): Promise<PlayerProgress[]>;
  achievements(): Promise<Achievement[]>;
  activity(): Promise<ActivityItem[]>;
}

export const analyticsRepository: AnalyticsRepository = analyticsApi;
