import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { getAccessToken } from "./createSupabaseClient";
import type { UnsubscribeResult } from "./types";

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
  const accessToken = await getAccessToken();

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const anonKey = getSupabaseAnonKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  headers.Authorization = `Bearer ${accessToken}`;

  // Use single filtered DELETE - more efficient than find-then-delete
  const deleteUrl = `${supabaseUrl}/rest/v1/subscriptions?feed_id=eq.${encodeURIComponent(feedId)}`;

  let res: Response;
  try {
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

  // 200/204/404 are all acceptable for idempotent delete
  if (res.ok || res.status === 404) {
    return { success: true };
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

  const parsed = parseUnsubscribeResponse(jsonBody);
  if (!parsed.ok) {
    throw new AuthApiError(
      parsed.message,
      parsed.code,
      res.status,
      parsed.details,
    );
  }

  return { success: true };
}
