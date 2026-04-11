import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type SubscriptionWithFeed = {
  id: string;
  userId: string;
  feedId: string;
  isMuted: boolean;
  createdAt: string;
  feed: {
    id: string;
    title: string;
    url: string;
    imageUrl: string | null;
    siteUrl: string | null;
    isFeatured: boolean;
    category: string | null;
  };
  unreadCount?: number;
  lastUpdatedAt?: string;
};

export type FetchSubscriptionsResponse =
  | { ok: true; data: SubscriptionWithFeed[] }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseFetchSubscriptionsResponse(
  body: unknown,
): FetchSubscriptionsResponse {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }
  const rec = body as Record<string, unknown>;
  if (Array.isArray(rec.data)) {
    return {
      ok: true,
      data: rec.data as SubscriptionWithFeed[],
    };
  }
  if (rec.success === true && Array.isArray((rec as { data?: unknown }).data)) {
    return {
      ok: true,
      data: (rec as { data: SubscriptionWithFeed[] }).data,
    };
  }
  const err = rec.error as Record<string, unknown> | undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err?.message === "string" ? err.message : "Request failed.";
  return { ok: false, code, message };
}

export async function fetchSubscriptions(): Promise<SubscriptionWithFeed[]> {
  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("fetchSubscriptions: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to view your subscriptions.",
      "UNAUTHORIZED",
      0,
    );
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  // Fetch subscriptions with feed details using PostgREST
  const url = `${supabaseUrl}/rest/v1/subscriptions?select=*,feed:feeds(*)`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
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

  if (!res.ok) {
    if (res.status === 401) {
      throw new AuthApiError(
        "Please sign in to view your subscriptions.",
        "UNAUTHORIZED",
        res.status,
      );
    }
    const err = (jsonBody as Record<string, unknown>)?.error as
      | Record<string, unknown>
      | undefined;
    throw new AuthApiError(
      typeof err?.message === "string"
        ? (err.message as string)
        : "Failed to fetch subscriptions.",
      typeof err?.code === "string" ? (err.code as string) : "FETCH_ERROR",
      res.status,
    );
  }

  const parsed = parseFetchSubscriptionsResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data;
  }

  throw new AuthApiError(parsed.message, parsed.code, res.status);
}
