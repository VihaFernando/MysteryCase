import { casesApi } from "@/api/endpoints";
import type { Case, CaseBundle, CaseStatus } from "@/types";
import { createBlankBundle } from "@/services/caseFactory";

export interface CaseRepository {
  list(): Promise<Case[]>;
  get(id: string): Promise<CaseBundle | null>;
  create(input: Partial<Case>): Promise<CaseBundle>;
  save(bundle: CaseBundle): Promise<CaseBundle>;
  updateMeta(id: string, patch: Partial<Case>): Promise<Case>;
  setStatus(id: string, status: CaseStatus): Promise<Case>;
  duplicate(id: string): Promise<CaseBundle>;
  remove(id: string): Promise<void>;
}

const newId = () => `case-${Date.now().toString(36)}`;
const nextCode = (existing: Case[]) => `CASE-${String(existing.length + 1).padStart(3, "0")}`;

export const caseRepository: CaseRepository = {
  list: () => casesApi.list(),
  get: (id) => casesApi.get(id),
  async create(input) { return casesApi.put(createBlankBundle(newId(), nextCode(await casesApi.list()), input)); },
  save: (bundle) => casesApi.put(bundle),
  async updateMeta(id, patch) {
    const b = await casesApi.get(id);
    return (await casesApi.put({ ...b, case: { ...b.case, ...patch } })).case;
  },
  async setStatus(id, status) { return status === "published" ? casesApi.publish(id) : this.updateMeta(id, { status }); },
  async duplicate(id) {
    const [b, all] = await Promise.all([casesApi.get(id), casesApi.list()]);
    const { publishedAt: _drop, ...rest } = b.case;
    return casesApi.put({ ...b, case: { ...rest, id: newId(), code: nextCode(all), title: `${b.case.title} (Copy)`, status: "draft", version: "0.1", createdAt: new Date().toISOString() } });
  },
  remove: (id) => casesApi.remove(id),
};
