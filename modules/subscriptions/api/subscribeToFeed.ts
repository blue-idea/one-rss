import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { getAccessToken } from "./createSupabaseClient";
import { checkSubscriptionLimit } from "./getSubscriptionCount";
import type { SubscribeResult } from "./types";

export type SubscribeToFeedResponse =
  | { ok: true; data: SubscribeResult }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseSubscribeResponse(body: unknown): SubscribeToFeedResponse {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }
  const rec = body as Record<string, unknown>;
  if (rec.success === true) {
    const data = rec.data as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format.",
      };
    }
    return {
      ok: true,
      data: data as SubscribeResult,
    };
  }
  const err = rec.error as Record<string, unknown> | undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err?.message === "string" ? err.message : "Request failed.";
  const details =
    err?.details !== undefined &&
    err.details !== null &&
    typeof err.details === "object" &&
    !Array.isArray(err.details)
      ? (err.details as Record<string, unknown>)
      : undefined;
  return { ok: false, code, message, details };
}

export async function subscribeToFeed(
  feedId: string,
): Promise<SubscribeResult> {
  // Client-side check: verify user hasn't exceeded subscription limit
  await checkSubscriptionLimit();

  const accessToken = await getAccessToken();

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const url = `${supabaseUrl}/rest/v1/subscriptions`;

  const anonKey = getSupabaseAnonKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        feed_id: feedId,
      }),
    });
  } catch {
    throw new AuthApiError(
      "Network error. Please try again.",
      "NETWORK_ERROR",
      0,
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

  const parsed = parseSubscribeResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data;
  }

  // Handle specific error codes
  if (res.status === 409) {
    throw new AuthApiError(
      parsed.message,
      "ALREADY_SUBSCRIBED",
      res.status,
      parsed.details,
    );
  }

  if (res.status === 422) {
    throw new AuthApiError(
      parsed.message,
      "SUBSCRIPTION_LIMIT_EXCEEDED",
      res.status,
      parsed.details,
    );
  }

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
