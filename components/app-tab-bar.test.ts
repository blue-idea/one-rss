import { describe, expect, it } from "vitest";

import { getActiveFromPath } from "@/components/app-tab-bar.utils";

describe("getActiveFromPath", () => {
  it("maps root and tab paths to the active tab key", () => {
    expect(getActiveFromPath("/")).toBe("index");
    expect(getActiveFromPath("/index")).toBe("index");
    expect(getActiveFromPath("/explore")).toBe("explore");
    expect(getActiveFromPath("/shelf")).toBe("shelf");
    expect(getActiveFromPath("/profile/settings")).toBe("profile");
  });

  it("returns undefined for non-tab routes", () => {
    expect(getActiveFromPath("/read")).toBeUndefined();
    expect(getActiveFromPath("/login")).toBeUndefined();
  });
});
