import { getDb } from "@/repositories/localDb";
import { delay } from "@/repositories/localDb";

export type SearchType = "Case" | "Suspect" | "Evidence" | "Interview" | "Clue" | "Location" | "Document";

export interface SearchResult {
  id: string;
  type: SearchType;
  name: string;
  caseId: string;
  caseCode: string;
  status: string;
  updatedAt: string;
  to: string;
}

/** Global search. Swap for GET /api/search?q= once the backend exists. */
export async function searchAll(q: string): Promise<SearchResult[]> {
  await delay(60);
  const term = q.trim().toLowerCase();
  if (!term) return [];
  const out: SearchResult[] = [];
  for (const b of getDb().bundles) {
    const c = b.case;
    const base = { caseId: c.id, caseCode: c.code, status: c.status, updatedAt: c.updatedAt };
    const push = (id: string, type: SearchType, name: string, section: string) => {
      if (name.toLowerCase().includes(term) || id.toLowerCase().includes(term)) out.push({ ...base, id, type, name, to: section });
    };
    push(c.code, "Case", `${c.code} — ${c.title}`, "basic-info");
    b.suspects.forEach((s) => push(s.id, "Suspect", s.name, "suspects"));
    b.evidence.forEach((e) => push(e.code, "Evidence", `${e.code} ${e.name}`, "evidence"));
    b.interviews.forEach((i) => push(i.code, "Interview", i.title, "interviews"));
    b.clues.forEach((cl) => push(cl.code, "Clue", `${cl.code} ${cl.title}`, "clues"));
    b.locations.forEach((l) => push(l.id, "Location", l.name, "scenes"));
    b.documents.forEach((d) => push(d.id, "Document", d.title, "evidence"));
  }
  return out.slice(0, 40);
}
