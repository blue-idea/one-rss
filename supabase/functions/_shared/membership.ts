export type BillingCycle = "month" | "year";
export type MembershipTier = "free" | "premium";
export type MembershipStatus =
  | "inactive"
  | "pending"
  | "active"
  | "expired"
  | "canceled";
export type CheckoutSessionStatus =
  | "pending"
  | "succeeded"
  | "canceled"
  | "expired";

export type PlanRecord = {
  id: string;
  code: "monthly" | "yearly";
  name: string;
  description: string;
  billing_cycle: BillingCycle;
  price_cents: number;
  currency: string;
  is_active: boolean;
};

export type PaymentSessionRecord = {
  id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  provider_session_id: string;
  status: CheckoutSessionStatus;
};

export type CheckoutCompletedPayload = {
  id: string;
  type: "checkout.session.completed" | "checkout.session.canceled";
  created: number;
  data: {
    object: {
      id: string;
      status?: string;
      metadata?: Record<string, string>;
    };
  };
};

export type RegisterEventInput = {
  eventKey: string;
  providerEventId: string;
  providerSessionId: string;
  eventType: string;
  sessionId: string | null;
  payload: CheckoutCompletedPayload;
};

export type ActivateMembershipInput = {
  userId: string;
  plan: PlanRecord;
  paymentSessionId: string;
  startedAt: string;
  expiresAt: string;
};

export type MembershipWebhookRepo = {
  findSessionByProviderSessionId(
    providerSessionId: string,
  ): Promise<PaymentSessionRecord | null>;
  findPlanById(planId: string): Promise<PlanRecord | null>;
  registerEvent(input: RegisterEventInput): Promise<"created" | "duplicate">;
  markSessionStatus(
    sessionId: string,
    status: CheckoutSessionStatus,
    completedAt?: string,
  ): Promise<void>;
  activateMembership(input: ActivateMembershipInput): Promise<void>;
};

export type MembershipWebhookResult =
  | {
      ok: true;
      duplicate: boolean;
      paymentStatus: CheckoutSessionStatus;
      membershipApplied: boolean;
      startedAt?: string;
      expiresAt?: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function addBillingCycle(
  fromIso: string,
  billingCycle: BillingCycle,
): string {
  const date = new Date(fromIso);
  const next = new Date(date);

  if (billingCycle === "month") {
    next.setUTCMonth(next.getUTCMonth() + 1);
  } else {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  }

  return next.toISOString();
}

export async function hmacSha256Hex(
  secret: string,
  value: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyWebhookSignature(input: {
  body: string;
  timestamp: string;
  signature: string;
  secret: string;
  toleranceSeconds?: number;
  now?: Date;
}): Promise<boolean> {
  const {
    body,
    timestamp,
    signature,
    secret,
    toleranceSeconds = 300,
    now = new Date(),
  } = input;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }

  if (Math.abs(now.getTime() - ts * 1000) > toleranceSeconds * 1000) {
    return false;
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${body}`);
  return expected === signature;
}

export function buildMembershipResponse(input: {
  membership: {
    tier: MembershipTier;
    status: MembershipStatus;
    started_at: string | null;
    expires_at: string | null;
    checked_at: string;
    is_expired: boolean;
    subscription_limit: number;
  };
  plan: PlanRecord | null;
}) {
  return {
    tier: input.membership.tier,
    status: input.membership.status,
    plan: input.plan
      ? {
          id: input.plan.id,
          code: input.plan.code,
          name: input.plan.name,
          description: input.plan.description,
          billingCycle: input.plan.billing_cycle,
          priceCents: input.plan.price_cents,
          currency: input.plan.currency,
          isActive: input.plan.is_active,
        }
      : null,
    startedAt: input.membership.started_at,
    expiresAt: input.membership.expires_at,
    subscriptionLimit: input.membership.subscription_limit,
    isExpired: input.membership.is_expired,
    checkedAt: input.membership.checked_at,
  };
}

export async function processMembershipWebhook(
  repo: MembershipWebhookRepo,
  payload: CheckoutCompletedPayload,
  now = new Date(),
): Promise<MembershipWebhookResult> {
  const providerSessionId = payload.data.object.id;
  const session = await repo.findSessionByProviderSessionId(providerSessionId);

  if (!session) {
    return {
      ok: false,
      code: "SESSION_NOT_FOUND",
      message: "Payment session was not found.",
    };
  }

  const eventKey = payload.id || `${payload.type}:${providerSessionId}`;
  const eventState = await repo.registerEvent({
    eventKey,
    providerEventId: payload.id,
    providerSessionId,
    eventType: payload.type,
    sessionId: session.id,
    payload,
  });

  if (eventState === "duplicate") {
    return {
      ok: true,
      duplicate: true,
      paymentStatus: session.status,
      membershipApplied: false,
    };
  }

  if (payload.type === "checkout.session.canceled") {
    await repo.markSessionStatus(session.id, "canceled");
    return {
      ok: true,
      duplicate: false,
      paymentStatus: "canceled",
      membershipApplied: false,
    };
  }

  const plan = await repo.findPlanById(session.plan_id);
  if (!plan) {
    return {
      ok: false,
      code: "PLAN_NOT_FOUND",
      message: "Plan was not found for payment session.",
    };
  }

  const startedAt = now.toISOString();
  const expiresAt = addBillingCycle(startedAt, plan.billing_cycle);

  await repo.markSessionStatus(session.id, "succeeded", startedAt);
  await repo.activateMembership({
    userId: session.user_id,
    plan,
    paymentSessionId: session.id,
    startedAt,
    expiresAt,
  });

  return {
    ok: true,
    duplicate: false,
    paymentStatus: "succeeded",
    membershipApplied: true,
    startedAt,
    expiresAt,
  };
}
