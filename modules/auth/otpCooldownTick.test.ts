import { describe, expect, it } from "vitest";

import { nextCooldownTick } from "@/modules/auth/otpCooldownTick";

describe("nextCooldownTick", () => {
  it("decrements until zero", () => {
    expect(nextCooldownTick(3)).toBe(2);
    expect(nextCooldownTick(1)).toBe(0);
    expect(nextCooldownTick(0)).toBe(0);
  });
});
