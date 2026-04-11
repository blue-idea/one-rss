import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { logSupabaseRestError } from "./logSupabaseRestError";
import type {
  FeedCategory,
  FeedSource,
  FeedsResponse,
  FetchFeedsOptions,
} from "./types";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type FetchFeedsResult = {
  feeds: FeedSource[];
  hasMore: boolean;
  total: number;
};

export function parseFeedsResponse(body: unknown):
  | { ok: true; data: FeedsResponse }
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
    const feeds = data.feeds;
    const categories = data.categories;
    const pagination = data.pagination;
    if (
      !Array.isArray(feeds) ||
      !Array.isArray(categories) ||
      !pagination ||
      typeof pagination !== "object"
    ) {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format.",
      };
    }
    return {
      ok: true,
      data: {
        feeds: (feeds as Record<string, unknown>[]).map((f) => ({
          ...f,
          imageUrl: f.image_url,
          siteUrl: f.site_url,
          isSubscribed: f.is_subscribed,
        })) as FeedsResponse["feeds"],
        categories: categories as FeedCategory[],
        pagination: pagination as FeedsResponse["pagination"],
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

export async function fetchFeeds(
  options: FetchFeedsOptions = {},
): Promise<FetchFeedsResult> {
  const { categorySlug, keyword, page = 1, pageSize = 20 } = options;

  try {
    const supabase = getSupabaseClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("fetchFeeds: getSession error", sessionError);
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

    // Build query parameters
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("order", "title.asc");
    params.set("limit", String(pageSize));
    params.set("offset", String((page - 1) * pageSize));

    // Filter by category if provided
    if (categorySlug && categorySlug !== "all") {
      params.set("category_slug", categorySlug);
    }

    // Search by keyword if provided
    if (keyword && keyword.trim()) {
      params.set("keyword", keyword.trim());
    }

    const url = `${supabaseUrl}/rest/v1/rpc/fetch_feeds_with_categories?${params.toString()}`;

    const anonKey = getSupabaseAnonKey();

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
    } catch (networkErr) {
      console.error("fetchFeeds: network error", networkErr);
      throw new AuthApiError(
        "Network error. Please try again.",
        "NETWORK_ERROR",
        0,
      );
    }

    if (!res.ok) {
      await logSupabaseRestError("fetchFeeds", res);
      throw new AuthApiError(
        "Failed to fetch feeds.",
        "FETCH_ERROR",
        res.status,
      );
    }

    let jsonBody: unknown;
    try {
      jsonBody = await res.json();
    } catch (parseErr) {
      console.error("fetchFeeds: invalid JSON body", parseErr);
      throw new AuthApiError(
        "Invalid response from server.",
        "INTERNAL_ERROR",
        res.status,
      );
    }

    const parsed = parseFeedsResponse(jsonBody);
    if (parsed.ok) {
      return {
        feeds: parsed.data.feeds,
        hasMore: parsed.data.pagination.hasMore,
        total: parsed.data.pagination.total,
      };
    }

    console.error(
      "fetchFeeds: unexpected payload or wrapped error",
      parsed.message,
      parsed.details,
    );
    throw new AuthApiError("Failed to fetch feeds.", parsed.code, res.status);
  } catch (e) {
    if (e instanceof AuthApiError) throw e;
    console.error("fetchFeeds: unexpected error", e);
    throw new AuthApiError("Failed to fetch feeds.", "INTERNAL_ERROR", 0);
  }
}
