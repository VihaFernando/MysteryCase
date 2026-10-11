import { get, list } from "../lib/db";
import { err, json, type Handler } from "../lib/http";

/** Read-only dashboards: per-case analytics plus player, achievement and activity feeds. */
export const analytics: Handler = async ({ method, parts: [a, b, id] }) => {
  if (method !== "GET") return null;
  if (a === "analytics" && b === "cases" && id) {
    const doc = (await get("analytics", id)) ?? (await list("analytics"))[0]; // ponytail: cases without their own numbers fall back to the first set
    return doc ? json(doc) : err(404, "No analytics");
  }
  if (a === "players" || a === "achievements" || a === "activity") return json(await list(a === "players" ? "player" : a === "achievements" ? "achievement" : "activity"));
  return null;
};
