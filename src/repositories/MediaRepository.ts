import { mediaApi } from "@/api/endpoints";
import { config } from "@/constants/config";
import type { MediaAsset } from "@/types";
import { clone, delay, getDb, persistDb } from "./localDb";

export interface MediaRepository {
  list(): Promise<MediaAsset[]>;
  upsert(asset: MediaAsset): Promise<MediaAsset>;
  remove(id: string): Promise<void>;
}

const demo: MediaRepository = {
  async list() { await delay(); return clone(getDb().media); },
  async upsert(asset) {
    await delay(200);
    const db = getDb();
    const i = db.media.findIndex((m) => m.id === asset.id);
    if (i >= 0) db.media[i] = asset; else db.media.unshift(asset);
    persistDb();
    return clone(asset);
  },
  async remove(id) { await delay(); const db = getDb(); db.media = db.media.filter((m) => m.id !== id); persistDb(); },
};

export const mediaRepository: MediaRepository = config.dataSource === "api" ? mediaApi : demo;
