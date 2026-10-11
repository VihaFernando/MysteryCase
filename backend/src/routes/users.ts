import { get, list, put } from "../lib/db";
import { json, type Handler } from "../lib/http";

/** Users, roles and the audit log. */
export const users: Handler = async ({ method, parts: [a, id], body }) => {
  if (a === "users") {
    if (!id && method === "GET") return json(await list("user"));
    if (id && method === "PUT") { const v = { ...(await body()), id }; await put("user", id, v); return json(v); }
    if (id && method === "PATCH") { const v = { ...(await get("user", id)), ...(await body()) }; await put("user", id, v); return json(v); }
  }
  if (a === "roles") {
    if (!id && method === "GET") return json(await list("role"));
    if (id && method === "PUT") { const v = { ...(await body()), id }; await put("role", id, v); return json(v); }
  }
  if (a === "audit") {
    if (method === "GET") return json(await list("audit"));
    if (method === "POST") { const v = { ...(await body()), id: `al-${Date.now()}`, timestamp: new Date().toISOString() }; await put("audit", v.id, v); return json(v, 201); }
  }
  return null;
};
