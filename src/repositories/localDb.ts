import { STORAGE_KEYS } from "@/constants/config";
import { createDemoBundles } from "@/data/demo/cases";
import { demoMedia } from "@/data/demo/media";
import { demoAudit, demoNotifications, demoRoles, demoUsers } from "@/data/demo/users";
import type { AuditEntry, CaseBundle, MediaAsset, Notification, Role, User } from "@/types";

interface DbShape {
  bundles: CaseBundle[];
  media: MediaAsset[];
  users: User[];
  roles: Role[];
  notifications: Notification[];
  audit: AuditEntry[];
}

let db: DbShape | null = null;

const bundledAssets = import.meta.glob("/src/assets/*.{jpg,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
/** Real file stems with their current URLs, longest first so "scene-living-room" wins over any shorter prefix. */
const ASSETS = Object.entries(bundledAssets)
  .map(([path, url]) => ({ stem: (path.split("/").pop() ?? "").replace(/\.(jpg|png)$/i, ""), url }))
  .sort((a, b) => b.stem.length - a.stem.length);

/**
 * Bundled asset URLs are content-hashed (`scene-kitchen-Ab12Cd34.jpg`); re-point stored URLs to the current build's.
 * Matching uses the real file names, so names that merely look like a hash suffix are never stripped.
 */
export function refreshAssetUrls(raw: string): string {
  return raw.replace(/"([^"]*\/)([a-z0-9._-]+)\.(jpg|png)"/gi, (m, _dir: string, file: string) => {
    const hit = ASSETS.find((a) => file === a.stem || file.startsWith(`${a.stem}-`));
    return hit ? JSON.stringify(hit.url) : m;
  });
}

function seed(): DbShape {
  return {
    bundles: createDemoBundles(),
    media: structuredClone(demoMedia),
    users: structuredClone(demoUsers),
    roles: structuredClone(demoRoles),
    notifications: structuredClone(demoNotifications),
    audit: structuredClone(demoAudit),
  };
}

/** Local persistence backing the demo repositories. Lazily initialised (never at module scope). */
export function getDb(): DbShape {
  if (db) return db;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.db);
      if (raw) {
        db = JSON.parse(refreshAssetUrls(raw)) as DbShape;
        return db;
      }
    } catch {
      /* corrupted storage — reseed */
    }
  }
  db = structuredClone(seed());
  return db;
}

export function persistDb() {
  if (typeof window === "undefined" || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.db, JSON.stringify(db));
  } catch {
    /* quota exceeded — keep in memory */
  }
}

export function resetDb() {
  db = seed();
  persistDb();
}

/** Simulated network latency so loading states are exercised. */
export const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

export const clone = <T,>(v: T): T => structuredClone(v);
