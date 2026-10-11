import { mediaApi } from "@/api/endpoints";
import type { MediaAsset } from "@/types";

export interface MediaRepository {
  list(): Promise<MediaAsset[]>;
  upsert(asset: MediaAsset): Promise<MediaAsset>;
  remove(id: string): Promise<void>;
}

export const mediaRepository: MediaRepository = mediaApi;
