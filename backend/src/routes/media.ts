import { del, list, put } from "../lib/db";
import { json, noContent, type Handler } from "../lib/http";

export const media: Handler = async ({ method, parts: [a, id], body }) => {
  if (a !== "media") return null;
  if (!id && method === "GET") return json(await list("media"));
  if (id && method === "PUT") { const v = await body(); await put("media", id, v); return json(v); }
  if (id && method === "DELETE") { await del("media", id); return noContent(); }
  return null;
};
