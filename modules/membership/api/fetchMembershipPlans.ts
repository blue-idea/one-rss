import { AuthApiError } from "@/modules/auth/api/authApiError";
import type { MembershipPlan } from "@/modules/membership/api/fetchMembershipStatus";
import { getSupabaseAccessToken } from "@/modules/supabase/client";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/modules/today/api/getSupabaseConfig";

type PlansResponse =
  | { ok: true; plans: MembershipPlan[] }
  | { ok: false; code: string; message: string };

function parsePlansResponse(body: unknown): PlansResponse {
  if (!body || typeof body !== "object") {
    return { ok: false, code: "INTERNAL_ERROR", message: "Invalid response." };
  }

  const rec = body as Record<string, unknown>;
  if (rec.success === true && rec.data && typeof rec.data === "object") {
    const data = rec.data as Record<string, unknown>;
    return {
      ok: true,
      plans: Array.isArray(data.plans) ? (data.plans as MembershipPlan[]) : [],
    };
  }

  const error = rec.error as Record<string, unknown> | undefined;
  return {
    ok: false,
    code: typeof error?.code === "string" ? error.code : "INTERNAL_ERROR",
    message:
      typeof error?.message === "string" ? error.message : "Request failed.",
  };
}

export async function fetchMembershipPlans(): Promise<MembershipPlan[]> {
  const supabaseUrl = getSupabaseUrl();
  const accessToken = await getSupabaseAccessToken();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !accessToken) {
    return [];
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
    res = await fetch(`${supabaseUrl}/functions/v1/membership-plans`, {
      method: "GET",
      headers,
    });
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

  const parsed = parsePlansResponse(body);
  if (!parsed.ok) {
    throw new AuthApiError(parsed.message, parsed.code, res.status);
  }

  return parsed.plans;
}
