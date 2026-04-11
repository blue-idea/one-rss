import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { logSupabaseRestError } from "./logSupabaseRestError";
import type { FeedCategory } from "./types";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type FeedCategoriesResponse = {
  categories: FeedCategory[];
};

export function parseFeedCategoriesResponse(body: unknown):
  | { ok: true; data: FeedCategoriesResponse }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    } {
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
    const categories = data.categories;
    if (!Array.isArray(categories)) {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format.",
      };
    }
    return {
      ok: true,
      data: {
        categories: categories as FeedCategory[],
      },
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

export async function fetchFeedCategories(): Promise<FeedCategory[]> {
  try {
    const supabase = getSupabaseClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("fetchFeedCategories: getSession error", sessionError);
      throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
    }

    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      throw new AuthApiError(
        "Please sign in to browse feeds.",
        "UNAUTHORIZED",
        0,
      );
    }

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) {
      throw new AuthApiError(
        "Supabase is not configured.",
        "NOT_CONFIGURED",
        0,
      );
    }

    const url = `${supabaseUrl}/rest/v1/feed_categories?select=*&order=sort.asc`;

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
      res = await fetch(url, {
        method: "GET",
        headers,
      });
    } catch (networkErr) {
      console.error("fetchFeedCategories: network error", networkErr);
      throw new AuthApiError(
        "Network error. Please try again.",
        "NETWORK_ERROR",
        0,
      );
    }

    if (!res.ok) {
      await logSupabaseRestError("fetchFeedCategories", res);
      throw new AuthApiError(
        "Failed to fetch categories.",
        "FETCH_ERROR",
        res.status,
      );
    }

    let jsonBody: unknown;
    try {
      jsonBody = await res.json();
    } catch (parseErr) {
      console.error("fetchFeedCategories: invalid JSON body", parseErr);
      throw new AuthApiError(
        "Invalid response from server.",
        "INTERNAL_ERROR",
        res.status,
      );
    }

    // Supabase REST API returns raw array directly
    if (Array.isArray(jsonBody)) {
      return jsonBody as FeedCategory[];
    }

    const parsed = parseFeedCategoriesResponse(jsonBody);
    if (parsed.ok) {
      return parsed.data.categories;
    }

    console.error(
      "fetchFeedCategories: unexpected payload",
      parsed.message,
      parsed.details,
    );
    throw new AuthApiError(
      "Failed to fetch categories.",
      parsed.code,
      res.status,
    );
  } catch (e) {
    if (e instanceof AuthApiError) throw e;
    console.error("fetchFeedCategories: unexpected error", e);
    throw new AuthApiError("Failed to fetch categories.", "INTERNAL_ERROR", 0);
  }
}
