import type { Achievement, ActivityItem, Analytics, PlayerProgress } from "@/types";

export function createDemoAnalytics(): Analytics {
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 8, 9 + i));
    const wave = Math.sin(i / 3) * 60 + (i % 7 === 5 || i % 7 === 6 ? 120 : 0);
    const starts = Math.round(380 + i * 6 + wave);
    return { date: d.toISOString().slice(0, 10), starts, completions: Math.round(starts * (0.62 + (i % 5) * 0.015)), avgScore: Math.round(720 + Math.cos(i / 4) * 30) };
  });
  return {
    caseId: "case-001",
    starts: 12840, completions: 8732, completionRate: 68, avgScore: 742, avgPlayMinutes: 43,
    evidenceDiscovery: [
      { id: "ev-001", name: "Phone", rate: 97 }, { id: "ev-002", name: "Wine Glass", rate: 94 }, { id: "ev-003", name: "CCTV", rate: 81 },
      { id: "ev-004", name: "Receipt", rate: 54 }, { id: "ev-005", name: "Fingerprint", rate: 76 }, { id: "ev-006", name: "Statement", rate: 61 },
      { id: "ev-007", name: "Records", rate: 69 }, { id: "ev-008", name: "Parking", rate: 38 },
    ],
    mostMissedClue: "CLU-012 — Man left via parking stairs",
    mostFailedInterview: "INT-002 — Michael Perera (CCTV not presented)",
    wrongSuspects: [{ name: "Sarah Fernando", count: 2210 }, { name: "Nuwan Silva", count: 640 }],
    dropOff: [
      { step: "Briefing", players: 12840 }, { step: "Living Room", players: 12510 }, { step: "Sarah Interview", players: 11300 },
      { step: "CCTV", players: 10420 }, { step: "Witness", players: 9380 }, { step: "Timeline", players: 9010 }, { step: "Accusation", players: 8732 },
    ],
    hintUsage: [{ hint: "Hint 1", uses: 4120 }, { hint: "Hint 2", uses: 2380 }, { hint: "Hint 3", uses: 1270 }],
    timelineMistakes: [{ event: "22:04 Pharmacy", mistakes: 3120 }, { event: "21:42 CCTV", mistakes: 2140 }, { event: "22:21 Argument", mistakes: 1880 }, { event: "22:33 Car exit", mistakes: 1460 }],
    daily,
  };
}

export const demoPlayers: PlayerProgress[] = [
  { playerId: "p-1", name: "inspector_kavi", rank: "Chief Inspector", casesCompleted: 6, avgScore: 912, totalMinutes: 304, lastActive: "2026-10-08T15:40:00Z", platform: "android" },
  { playerId: "p-2", name: "nadee.reads", rank: "Inspector", casesCompleted: 5, avgScore: 861, totalMinutes: 251, lastActive: "2026-10-08T14:12:00Z", platform: "ios" },
  { playerId: "p-3", name: "colombo_sleuth", rank: "Sergeant", casesCompleted: 4, avgScore: 790, totalMinutes: 220, lastActive: "2026-10-08T12:00:00Z", platform: "android" },
  { playerId: "p-4", name: "hiru_m", rank: "Sergeant", casesCompleted: 3, avgScore: 744, totalMinutes: 160, lastActive: "2026-10-07T21:30:00Z", platform: "ios" },
  { playerId: "p-5", name: "tharindu.p", rank: "Constable", casesCompleted: 2, avgScore: 612, totalMinutes: 140, lastActive: "2026-10-07T18:22:00Z", platform: "android" },
  { playerId: "p-6", name: "amaya_writes", rank: "Constable", casesCompleted: 1, avgScore: 488, totalMinutes: 61, lastActive: "2026-10-06T09:15:00Z", platform: "ios" },
  { playerId: "p-7", name: "rookie_dee", rank: "Cadet", casesCompleted: 1, avgScore: 312, totalMinutes: 74, lastActive: "2026-10-05T20:02:00Z", platform: "android" },
];

export const demoAchievements: Achievement[] = [
  { id: "ach-1", name: "First Call", description: "Discover the 10:17 PM call", unlockedBy: 12450, rarity: "common" },
  { id: "ach-2", name: "Broken Alibi", description: "Expose Michael's lie with CCTV", unlockedBy: 7820, rarity: "rare" },
  { id: "ach-3", name: "Perfect Timeline", description: "Order every event correctly", unlockedBy: 1210, rarity: "epic" },
  { id: "ach-4", name: "No Hints Needed", description: "Solve without hints over 900 points", unlockedBy: 402, rarity: "legendary" },
];

export const demoActivity: ActivityItem[] = [
  { id: "a-1", actor: "Sarah K.", text: "updated CASE-001 · Hint penalties", at: "2026-10-08T15:12:00Z", kind: "edit" },
  { id: "a-2", actor: "Admin", text: "published CASE-004 v2.0", at: "2026-10-08T13:02:00Z", kind: "publish" },
  { id: "a-3", actor: "Media Team", text: "uploaded 6 evidence images", at: "2026-10-08T11:48:00Z", kind: "media" },
  { id: "a-4", actor: "Sarah K.", text: "moved CASE-002 to review", at: "2026-10-08T11:40:00Z", kind: "review" },
  { id: "a-5", actor: "Ravi D.", text: "created CASE-005 Kitchen Fire at No. 9", at: "2026-10-07T13:55:00Z", kind: "create" },
  { id: "a-6", actor: "Ravi D.", text: "scheduled CASE-003 for Oct 20", at: "2026-10-06T16:20:00Z", kind: "publish" },
];
