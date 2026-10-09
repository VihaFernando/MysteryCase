import { casesApi } from "@/api/endpoints";
import { config } from "@/constants/config";
import type { Case, CaseBundle, CaseStatus } from "@/types";
import { clone, delay, getDb, persistDb } from "./localDb";
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

class DemoCaseRepository implements CaseRepository {
  async list() {
    await delay();
    return clone(getDb().bundles.map((b) => b.case));
  }
  async get(id: string) {
    await delay(120);
    const b = getDb().bundles.find((x) => x.case.id === id);
    return b ? clone(b) : null;
  }
  async create(input: Partial<Case>) {
    await delay();
    const db = getDb();
    const n = db.bundles.length + 1;
    const bundle = createBlankBundle(`case-${Date.now().toString(36)}`, `CASE-${String(n).padStart(3, "0")}`, input);
    db.bundles.unshift(bundle);
    persistDb();
    return clone(bundle);
  }
  async save(bundle: CaseBundle) {
    await delay(250);
    const db = getDb();
    const next = { ...clone(bundle), case: { ...bundle.case, updatedAt: new Date().toISOString() } };
    const i = db.bundles.findIndex((b) => b.case.id === bundle.case.id);
    if (i >= 0) db.bundles[i] = next;
    else db.bundles.unshift(next);
    persistDb();
    return clone(next);
  }
  async updateMeta(id: string, patch: Partial<Case>) {
    const b = await this.get(id);
    if (!b) throw new Error(`Case ${id} not found`);
    const saved = await this.save({ ...b, case: { ...b.case, ...patch } });
    return saved.case;
  }
  async setStatus(id: string, status: CaseStatus) {
    const patch: Partial<Case> = { status };
    if (status === "published") patch.publishedAt = new Date().toISOString();
    return this.updateMeta(id, patch);
  }
  async duplicate(id: string) {
    const b = await this.get(id);
    if (!b) throw new Error(`Case ${id} not found`);
    const db = getDb();
    const copy: CaseBundle = clone(b);
    copy.case = { ...copy.case, id: `case-${Date.now().toString(36)}`, code: `CASE-${String(db.bundles.length + 1).padStart(3, "0")}`, title: `${b.case.title} (Copy)`, status: "draft", version: "0.1", publishedAt: undefined, createdAt: new Date().toISOString() };
    db.bundles.unshift(copy);
    persistDb();
    return clone(copy);
  }
  async remove(id: string) {
    await delay();
    const db = getDb();
    db.bundles = db.bundles.filter((b) => b.case.id !== id);
    persistDb();
  }
}

class ApiCaseRepository implements CaseRepository {
  list() { return casesApi.list(); }
  get(id: string) { return casesApi.get(id); }
  create(input: Partial<Case>) { return casesApi.create(input); }
  save(bundle: CaseBundle) { return casesApi.update(bundle.case.id, bundle); }
  async updateMeta(id: string, patch: Partial<Case>) { return (await casesApi.update(id, { case: patch as Case })).case; }
  async setStatus(id: string, status: CaseStatus) { return status === "published" ? casesApi.publish(id) : this.updateMeta(id, { status }); }
  async duplicate(id: string) { const b = await casesApi.get(id); return casesApi.create({ ...b.case, title: `${b.case.title} (Copy)` }); }
  remove(id: string) { return casesApi.remove(id); }
}

export const caseRepository: CaseRepository = config.dataSource === "api" ? new ApiCaseRepository() : new DemoCaseRepository();
