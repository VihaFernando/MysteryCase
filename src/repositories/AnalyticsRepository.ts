import { analyticsApi } from "@/api/endpoints";
import { config } from "@/constants/config";
import { createDemoAnalytics, demoAchievements, demoActivity, demoPlayers } from "@/data/demo/analytics";
import type { Achievement, ActivityItem, Analytics, PlayerProgress } from "@/types";
import { delay } from "./localDb";

export interface AnalyticsRepository {
  forCase(caseId: string): Promise<Analytics>;
  players(): Promise<PlayerProgress[]>;
  achievements(): Promise<Achievement[]>;
  activity(): Promise<ActivityItem[]>;
}

const demo: AnalyticsRepository = {
  async forCase() { await delay(250); return createDemoAnalytics(); },
  async players() { await delay(); return demoPlayers; },
  async achievements() { await delay(); return demoAchievements; },
  async activity() { await delay(); return demoActivity; },
};

export const analyticsRepository: AnalyticsRepository =
  config.dataSource === "api" ? { ...demo, forCase: analyticsApi.forCase } : demo;
