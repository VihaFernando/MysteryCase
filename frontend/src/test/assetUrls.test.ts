import { describe, expect, it } from "vitest";
import { IMG } from "@/data/demo/images";
import { refreshAssetUrls } from "@/api/assets";

describe("refreshAssetUrls", () => {
  it("keeps every bundled image pointing at its own file", () => {
    const stored = JSON.stringify({ a: IMG.sceneLiving, b: IMG.sceneKitchen, c: IMG.sceneEntrance, d: IMG.evPhone, e: IMG.evGlass });
    const out = JSON.parse(refreshAssetUrls(stored));
    expect(out).toEqual({ a: IMG.sceneLiving, b: IMG.sceneKitchen, c: IMG.sceneEntrance, d: IMG.evPhone, e: IMG.evGlass });
    expect(new Set(Object.values(out)).size).toBe(5);
  });

  it("re-points stale content-hashed URLs from an older build to the matching current file", () => {
    const stale = JSON.stringify({ a: "/assets/scene-living-room-Ab12Cd34.jpg", b: "/assets/scene-kitchen-Zz99Yy88.jpg", c: "/assets/scene-entrance-Qq11Ww22.jpg" });
    const out = JSON.parse(refreshAssetUrls(stale));
    expect(out).toEqual({ a: IMG.sceneLiving, b: IMG.sceneKitchen, c: IMG.sceneEntrance });
  });

  it("leaves unrelated and user-uploaded URLs untouched", () => {
    const raw = JSON.stringify({ a: "https://example.com/photo.jpg", b: "blob:http://localhost/abc" });
    expect(refreshAssetUrls(raw)).toBe(raw);
  });
});
