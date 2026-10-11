// Dumps the demo data to ../backend/seed.json, which the backend loads into an empty database.
// Run from frontend/: bun scripts/export-seed.ts
import { createDemoAnalytics, demoAchievements, demoActivity, demoPlayers } from "../src/data/demo/analytics";
import { createDemoBundles } from "../src/data/demo/cases";
import { demoMedia } from "../src/data/demo/media";
import { demoAudit, demoNotifications, demoRoles, demoUsers } from "../src/data/demo/users";

const bundles = createDemoBundles();
const seed = {
  case: bundles,
  media: demoMedia,
  user: demoUsers,
  role: demoRoles,
  audit: demoAudit,
  notification: demoNotifications,
  player: demoPlayers.map((p) => ({ ...p, id: p.playerId })),
  achievement: demoAchievements,
  activity: demoActivity,
  analytics: bundles.map((b) => ({ ...createDemoAnalytics(), id: b.case.id })),
};

// Bundled images arrive as file paths; keep only "/assets/<file>" — the frontend re-points those to the current build's URL.
const json = JSON.stringify(seed, null, 1).replace(/"[^"]*\/([a-z0-9._-]+\.(?:jpg|png))"/gi, '"/assets/$1"');
await Bun.write(new URL("../../backend/seed.json", import.meta.url), json);
console.log(`seed.json: ${Object.entries(seed).map(([k, v]) => `${k}=${v.length}`).join(" ")}`);
