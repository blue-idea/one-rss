import { describe, expect, it } from "vitest";

import {
  processMembershipWebhook,
  type ActivateMembershipInput,
  type CheckoutCompletedPayload,
  type CheckoutSessionStatus,
  type PaymentSessionRecord,
  type PlanRecord,
  type RegisterEventInput,
} from "./membership";

function createRepo() {
  const session: PaymentSessionRecord = {
    id: "session-1",
    user_id: "user-1",
    plan_id: "plan-yearly",
    provider: "mockpay",
    provider_session_id: "provider-session-1",
    status: "pending",
  };

  const plan: PlanRecord = {
    id: "plan-yearly",
    code: "yearly",
    name: "年付会员",
    description: "",
    billing_cycle: "year",
    price_cents: 16800,
    currency: "CNY",
    is_active: true,
  };

  const seen = new Set<string>();
  const state = {
    sessionStatus: session.status as CheckoutSessionStatus,
    activationCalls: 0,
  };

  return {
    state,
    repo: {
      async findSessionByProviderSessionId(providerSessionId: string) {
        return providerSessionId === session.provider_session_id ? session : null;
      },
      async findPlanById(planId: string) {
        return planId === plan.id ? plan : null;
      },
      async registerEvent(input: RegisterEventInput) {
        if (seen.has(input.eventKey)) {
          return "duplicate" as const;
        }
        seen.add(input.eventKey);
        return "created" as const;
      },
      async markSessionStatus(_sessionId: string, status: CheckoutSessionStatus) {
        state.sessionStatus = status;
      },
      async activateMembership(_input: ActivateMembershipInput) {
        state.activationCalls += 1;
      },
    },
  };
}

describe("processMembershipWebhook", () => {
  it("processes a completed session only once", async () => {
    const { repo, state } = createRepo();
    const payload: CheckoutCompletedPayload = {
      id: "evt_same",
      type: "checkout.session.completed",
      created: 1_744_281_600,
      data: {
        object: {
          id: "provider-session-1",
          status: "paid",
        },
      },
    };

    const first = await processMembershipWebhook(repo, payload, new Date("2026-04-10T00:00:00.000Z"));
    const second = await processMembershipWebhook(repo, payload, new Date("2026-04-10T00:00:00.000Z"));

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.membershipApplied).toBe(true);
      expect(second.duplicate).toBe(true);
      expect(second.membershipApplied).toBe(false);
    }
    expect(state.sessionStatus).toBe("succeeded");
    expect(state.activationCalls).toBe(1);
  });
});
