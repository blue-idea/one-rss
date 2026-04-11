import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { getAccessToken } from "./createSupabaseClient";

const FREE_USER_SUBSCRIPTION_LIMIT = 10;

export type SubscriptionCount = {
  count: number;
  limit: number;
  isAtLimit: boolean;
  isOverLimit: boolean;
};

export type SubscriptionCountResponse =
  | { ok: true; data: SubscriptionCount }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function parseSubscriptionCountResponse(
  body: unknown,
): SubscriptionCountResponse {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }
  const rec = body as Record<string, unknown>;
  if (Array.isArray(body)) {
    return {
      ok: true,
      data: {
        count: (body as unknown[]).length,
        limit: FREE_USER_SUBSCRIPTION_LIMIT,
        isAtLimit: (body as unknown[]).length >= FREE_USER_SUBSCRIPTION_LIMIT,
        isOverLimit: (body as unknown[]).length > FREE_USER_SUBSCRIPTION_LIMIT,
      },
    };
  }
  if (rec.success === true) {
    const data = rec.data as { count?: number };
    const count = typeof data.count === "number" ? data.count : 0;
    return {
      ok: true,
      data: {
        count,
        limit: FREE_USER_SUBSCRIPTION_LIMIT,
        isAtLimit: count >= FREE_USER_SUBSCRIPTION_LIMIT,
        isOverLimit: count > FREE_USER_SUBSCRIPTION_LIMIT,
      },
    };
  }
  const err = rec.error as Record<string, unknown> | undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err?.message === "string" ? err.message : "Request failed.";
  return { ok: false, code, message };
}

/**
 * Gets the current subscription count for the authenticated user.
 * @throws AuthApiError if not authenticated or network error
 */
export async function getSubscriptionCount(): Promise<SubscriptionCount> {
  const accessToken = await getAccessToken();

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const anonKey = getSupabaseAnonKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Prefer: "count=exact",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    const url = `${supabaseUrl}/rest/v1/subscriptions?select=id`;
    res = await fetch(url, {
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

  if (!res.ok) {
    throw new AuthApiError(
      "Failed to get subscription count.",
      "FETCH_ERROR",
      res.status,
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = await res.json();
  } catch {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  const parsed = parseSubscriptionCountResponse(jsonBody);
  if (!parsed.ok) {
    throw new AuthApiError(parsed.message, parsed.code, res.status);
  }

  return parsed.data;
}

/**
 * Checks if the user can subscribe to more feeds.
 * Throws AuthApiError if at or over the limit.
 */
export async function checkSubscriptionLimit(): Promise<void> {
  const { isAtLimit, isOverLimit } = await getSubscriptionCount();

  if (isOverLimit) {
    throw new AuthApiError(
      `You have reached the maximum subscription limit (${FREE_USER_SUBSCRIPTION_LIMIT}). Please upgrade to premium to subscribe to more feeds.`,
      "SUBSCRIPTION_LIMIT_EXCEEDED",
      0,
    );
  }

  if (isAtLimit) {
    throw new AuthApiError(
      `You have reached the maximum subscription limit (${FREE_USER_SUBSCRIPTION_LIMIT}) for free accounts. Upgrade to premium for unlimited subscriptions.`,
      "SUBSCRIPTION_LIMIT_EXCEEDED",
      0,
    );
  }
}
