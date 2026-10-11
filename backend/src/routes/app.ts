import { list } from "../lib/db";
import { err, json, type Handler } from "../lib/http";

/** Player-app API: published cases only, read-only, no auth. */
export const app: Handler = async ({ method, parts: [a, b, id] }) => {
  if (a !== "app" || b !== "cases" || method !== "GET") return null;
  const published = (await list("case")).filter((x) => x.case.status === "published");
  if (!id) return json(published.map((x) => x.case));
  const hit = published.find((x) => x.case.id === id);
  return hit ? json(hit) : err(404, "Not found");
};
