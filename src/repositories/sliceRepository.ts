import { config } from "@/constants/config";
import type { CaseBundle } from "@/types";
import { clone, delay, getDb, persistDb } from "./localDb";

type SliceKey = "suspects" | "evidence" | "interviews" | "clues" | "timeline" | "locations";
type Item<K extends SliceKey> = CaseBundle[K][number];

export interface SliceRepository<T extends { id: string }> {
  list(caseId: string): Promise<T[]>;
  listAll(): Promise<Array<T & { caseId: string; caseCode: string; caseTitle: string }>>;
  upsert(caseId: string, item: T): Promise<T>;
  remove(caseId: string, id: string): Promise<void>;
}

interface RemoteSlice<T> {
  list(caseId: string): Promise<T[]>;
  upsert(caseId: string, item: T): Promise<T>;
  remove(caseId: string, id: string): Promise<void>;
}

/** Builds a repository for a per-case collection. Demo mode reads/writes the local DB. */
export function createSliceRepository<K extends SliceKey>(key: K, remote?: RemoteSlice<Item<K>>): SliceRepository<Item<K>> {
  const find = (caseId: string) => {
    const b = getDb().bundles.find((x) => x.case.id === caseId);
    if (!b) throw new Error(`Case ${caseId} not found`);
    return b;
  };
  if (config.dataSource === "api" && remote) {
    return {
      list: remote.list,
      upsert: remote.upsert,
      remove: remote.remove,
      async listAll() { throw new Error("listAll requires a dedicated endpoint"); },
    };
  }
  return {
    async list(caseId) {
      await delay(120);
      return clone(find(caseId)[key] as Item<K>[]);
    },
    async listAll() {
      await delay(150);
      return clone(getDb().bundles.flatMap((b) => (b[key] as Item<K>[]).map((i) => ({ ...i, caseId: b.case.id, caseCode: b.case.code, caseTitle: b.case.title }))));
    },
    async upsert(caseId, item) {
      await delay(150);
      const b = find(caseId);
      const arr = b[key] as Item<K>[];
      const i = arr.findIndex((x) => x.id === item.id);
      if (i >= 0) arr[i] = clone(item);
      else arr.push(clone(item));
      b.case.updatedAt = new Date().toISOString();
      persistDb();
      return clone(item);
    },
    async remove(caseId, id) {
      await delay(120);
      const b = find(caseId);
      (b as unknown as Record<K, Item<K>[]>)[key] = (b[key] as Item<K>[]).filter((x) => x.id !== id);
      persistDb();
    },
  };
}
