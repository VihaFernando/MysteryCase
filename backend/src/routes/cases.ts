import { del, get, list, put, type Doc } from "../lib/db";
import { err, json, noContent, type Handler } from "../lib/http";
import { emit } from "../lib/realtime";

const SLICES = ["suspects", "evidence", "interviews", "clues", "timeline", "locations"];

export const cases: Handler = async ({ method, parts: [a, id, sub, itemId], body }) => {
  if (a === "bundles" && method === "GET") return json(await list("case")); // everything at once, for search and cross-case lists
  if (a !== "cases") return null;

  if (!id) {
    if (method === "GET") return json((await list("case")).map((x) => x.case));
    if (method === "POST") {
      const input = await body();
      const newId = input.id ?? `case-${Date.now().toString(36)}`;
      const now = new Date().toISOString();
      const bundle = {
        case: { id: newId, code: `CASE-${String((await list("case")).length + 1).padStart(3, "0")}`, status: "draft", version: "0.1", createdAt: now, updatedAt: now, ...input },
        ...Object.fromEntries(SLICES.map((s) => [s, []])),
      };
      await put("case", newId, bundle);
      emit("case.updated", { caseId: newId });
      return json(bundle, 201);
    }
    return null;
  }

  if (!sub && method === "PUT") { // create or fully replace a case bundle
    const incoming = await body();
    const prev = await get("case", id);
    const now = new Date().toISOString();
    const next = { ...incoming, case: { ...incoming.case, id, createdAt: prev?.case.createdAt ?? incoming.case?.createdAt ?? now, updatedAt: now } };
    await put("case", id, next);
    emit("case.updated", { caseId: id });
    return json(next, prev ? 200 : 201);
  }

  const bundle = await get("case", id);
  if (!bundle) return err(404, "Case not found");
  const save = async () => { bundle.case.updatedAt = new Date().toISOString(); await put("case", id, bundle); emit("case.updated", { caseId: id }); };

  if (!sub) {
    if (method === "GET") return json(bundle);
    if (method === "DELETE") { await del("case", id); emit("case.deleted", { caseId: id }); return noContent(); }
    if (method === "PATCH") {
      const patch = await body();
      Object.assign(bundle, patch, { case: { ...bundle.case, ...patch.case } });
      await save();
      return json(bundle);
    }
  }

  if (sub === "publish" && method === "POST") {
    bundle.case = { ...bundle.case, status: "published", publishedAt: new Date().toISOString() };
    await put("case", id, bundle);
    emit("case.published", { caseId: id });
    return json(bundle.case);
  }

  if (sub && SLICES.includes(sub)) {
    const arr: Doc[] = bundle[sub] ?? [];
    if (method === "GET" && !itemId) return json(arr);
    if (method === "PUT" && itemId) {
      const item = await body();
      bundle[sub] = arr.some((x) => x.id === itemId) ? arr.map((x) => (x.id === itemId ? item : x)) : [...arr, item];
      await save();
      return json(item);
    }
    if (method === "DELETE" && itemId) { bundle[sub] = arr.filter((x) => x.id !== itemId); await save(); return noContent(); }
  }
  return null;
};
