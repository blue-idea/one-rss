import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import type { UnsubscribeResult } from "./types";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type UnsubscribeResponse =
  | { ok: true; data: UnsubscribeResult }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseUnsubscribeResponse(body: unknown): UnsubscribeResponse {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }
  const rec = body as Record<string, unknown>;
  if (rec.success === true) {
    return {
      ok: true,
      data: { success: true },
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

export async function unsubscribeFromFeed(
  feedId: string,
): Promise<UnsubscribeResult> {
  const supabase = getSupabaseClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("unsubscribeFromFeed: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError("Please sign in to unsubscribe.", "UNAUTHORIZED", 0);
  }

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  // First, get the subscription ID
  const anonKey = getSupabaseAnonKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  headers.Authorization = `Bearer ${accessToken}`;

  // Find subscription
  let res: Response;
  try {
    const selectUrl = `${supabaseUrl}/rest/v1/subscriptions?feed_id=eq.${encodeURIComponent(feedId)}&select=id`;
    res = await fetch(selectUrl, {
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
      "Failed to find subscription.",
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

  const subscriptions = jsonBody as { id: string }[];
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    // Already unsubscribed - return success (idempotent)
    return { success: true };
  }

  const subscriptionId = subscriptions[0].id;

  // Delete subscription
  try {
    const deleteUrl = `${supabaseUrl}/rest/v1/subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`;
    res = await fetch(deleteUrl, {
      method: "DELETE",
      headers,
    });
  } catch {
    throw new AuthApiError(
      "Network error. Please try again.",
      "NETWORK_ERROR",
      0,
    );
  }

  if (!res.ok && res.status !== 404) {
    throw new AuthApiError(
      "Failed to unsubscribe.",
      "DELETE_ERROR",
      res.status,
    );
  }

  return { success: true };
}
