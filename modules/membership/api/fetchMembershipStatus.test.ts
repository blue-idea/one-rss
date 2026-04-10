import { describe, expect, it } from "vitest";

import { getEffectiveMembershipState, type MembershipStatus } from "./fetchMembershipStatus";

describe("getEffectiveMembershipState", () => {
  it("degrades expired premium membership to free", () => {
    const membership: MembershipStatus = {
      tier: "premium",
      status: "active",
      plan: {
        id: "plan-1",
        code: "monthly",
        name: "月付会员",
        billingCycle: "month",
        priceCents: 1800,
        currency: "CNY",
        description: "",
        isActive: true,
      },
      startedAt: "2026-03-01T00:00:00.000Z",
      expiresAt: "2026-04-01T00:00:00.000Z",
      subscriptionLimit: 1000,
      isExpired: false,
      checkedAt: "2026-03-01T00:00:00.000Z",
    };

    const effective = getEffectiveMembershipState(
      membership,
      new Date("2026-04-10T00:00:00.000Z"),
    );

    expect(effective.tier).toBe("free");
    expect(effective.status).toBe("expired");
    expect(effective.subscriptionLimit).toBe(10);
    expect(effective.isExpired).toBe(true);
  });
});
