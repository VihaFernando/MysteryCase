const bundledAssets = import.meta.glob("/src/assets/*.{jpg,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
/** Real file stems with their current URLs, longest first so "scene-living-room" wins over any shorter prefix. */
const ASSETS = Object.entries(bundledAssets)
  .map(([path, url]) => ({ stem: (path.split("/").pop() ?? "").replace(/\.(jpg|png)$/i, ""), url }))
  .sort((a, b) => b.stem.length - a.stem.length);

/**
 * The server stores bundled images as "/assets/<file>.jpg" (or a stale content-hashed URL from an older build);
 * re-point them to the current build's URL. Matching uses the real file names, so names that merely look like a hash suffix are never stripped.
 */
export function refreshAssetUrls(raw: string): string {
  return raw.replace(/"([^"]*\/)([a-z0-9._-]+)\.(jpg|png)"/gi, (m, _dir: string, file: string) => {
    const hit = ASSETS.find((a) => file === a.stem || file.startsWith(`${a.stem}-`));
    return hit ? JSON.stringify(hit.url) : m;
  });
}
