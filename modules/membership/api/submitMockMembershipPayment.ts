import { AuthApiError } from "@/modules/auth/api/authApiError";
import { getSupabaseAccessToken } from "@/modules/supabase/client";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/modules/today/api/getSupabaseConfig";

export async function submitMockMembershipPayment(
  sessionId: string,
  action: "completed" | "canceled",
): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const accessToken = await getSupabaseAccessToken();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !accessToken) {
    throw new AuthApiError("Please sign in first.", "UNAUTHORIZED", 401);
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
    res = await fetch(
      `${supabaseUrl}/functions/v1/membership-simulate-payment`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, action }),
      },
    );
  } catch {
    throw new AuthApiError(
      "Network error. Please try again.",
      "NETWORK_ERROR",
      0,
    );
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      throw new AuthApiError(
        "Payment request failed.",
        "INTERNAL_ERROR",
        res.status,
      );
    }

    const rec = body as Record<string, unknown>;
    const error = rec.error as Record<string, unknown> | undefined;
    throw new AuthApiError(
      typeof error?.message === "string"
        ? error.message
        : "Payment request failed.",
      typeof error?.code === "string" ? error.code : "INTERNAL_ERROR",
      res.status,
    );
  }
}
