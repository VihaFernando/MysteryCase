import { get, list, put } from "../lib/db";
import { json, noContent, type Handler } from "../lib/http";

export const notifications: Handler = async ({ method, parts: [a, id, sub], body }) => {
  if (a !== "notifications") return null;
  if (!id && method === "GET") return json(await list("notification"));
  if (!id && method === "POST") {
    const n = { ...(await body()), id: `n-${Date.now()}`, createdAt: new Date().toISOString(), read: false };
    await put("notification", n.id, n);
    return json(n, 201);
  }
  if (id === "read-all" && method === "POST") { for (const n of await list("notification")) await put("notification", n.id, { ...n, read: true }); return noContent(); }
  if (id && sub === "read" && method === "POST") {
    const n = await get("notification", id);
    if (n) await put("notification", id, { ...n, read: true });
    return noContent();
  }
  return null;
};
