import { casesApi } from "@/api/endpoints";
import type { CaseBundle } from "@/types";

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

/** Builds a repository for a per-case collection backed by the REST API. */
export function createSliceRepository<K extends SliceKey>(key: K, remote: RemoteSlice<Item<K>>): SliceRepository<Item<K>> {
  return {
    ...remote,
    async listAll() {
      const bundles = await casesApi.bundles();
      return bundles.flatMap((b) => (b[key] as Item<K>[]).map((i) => ({ ...i, caseId: b.case.id, caseCode: b.case.code, caseTitle: b.case.title })));
    },
  };
}
