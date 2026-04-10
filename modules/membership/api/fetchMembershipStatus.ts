import { AuthApiError } from "@/modules/auth/api/authApiError";
import { getSupabaseAccessToken } from "@/modules/supabase/client";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/modules/today/api/getSupabaseConfig";

export type MembershipTier = "free" | "premium";
export type MembershipState =
  | "inactive"
  | "pending"
  | "active"
  | "expired"
  | "canceled";

export type MembershipPlan = {
  id: string;
  code: "monthly" | "yearly";
  name: string;
  billingCycle: "month" | "year";
  priceCents: number;
  currency: string;
  description: string;
  isActive: boolean;
};

export type MembershipStatus = {
  tier: MembershipTier;
  status: MembershipState;
  plan: MembershipPlan | null;
  startedAt: string | null;
  expiresAt: string | null;
  subscriptionLimit: number;
  isExpired: boolean;
  checkedAt: string;
};

function getMembershipStatusUrl(): string | undefined {
  const supabaseUrl = getSupabaseUrl();
  return supabaseUrl
    ? `${supabaseUrl}/functions/v1/membership-status`
    : undefined;
}

function parseMembershipStatusResponse(
  body: unknown,
):
  | { ok: true; data: MembershipStatus }
  | { ok: false; code: string; message: string } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }

  const rec = body as Record<string, unknown>;
  if (rec.success !== true || !rec.data || typeof rec.data !== "object") {
    const error = rec.error as Record<string, unknown> | undefined;
    return {
      ok: false,
      code: typeof error?.code === "string" ? error.code : "INTERNAL_ERROR",
      message:
        typeof error?.message === "string" ? error.message : "Request failed.",
    };
  }

  return {
    ok: true,
    data: rec.data as MembershipStatus,
  };
}

export function getEffectiveMembershipState(
  membership: MembershipStatus | null,
  now = new Date(),
): MembershipStatus {
  if (!membership) {
    return {
      tier: "free",
      status: "inactive",
      plan: null,
      startedAt: null,
      expiresAt: null,
      subscriptionLimit: 10,
      isExpired: false,
      checkedAt: now.toISOString(),
    };
  }

  const expiresAt = membership.expiresAt
    ? new Date(membership.expiresAt)
    : null;
  const isExpired =
    membership.status === "expired" ||
    membership.status === "canceled" ||
    (expiresAt !== null &&
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt <= now);

  if (!isExpired) {
    return membership;
  }

  return {
    ...membership,
    tier: "free",
    status: "expired",
    subscriptionLimit: 10,
    isExpired: true,
  };
}

export async function fetchMembershipStatus(): Promise<MembershipStatus> {
  const url = getMembershipStatusUrl();
  const accessToken = await getSupabaseAccessToken();
  const anonKey = getSupabaseAnonKey();

  if (!url || !accessToken) {
    return getEffectiveMembershipState(null);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  if (anonKey) {
    headers.apikey = anonKey;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch {
    throw new AuthApiError(
      "Network error. Please try again.",
      "NETWORK_ERROR",
      0,
    );
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  const parsed = parseMembershipStatusResponse(body);
  if (!parsed.ok) {
    throw new AuthApiError(parsed.message, parsed.code, res.status);
  }

  return getEffectiveMembershipState(parsed.data);
}
