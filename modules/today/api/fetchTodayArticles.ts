import { createSupabaseClient as getSupabaseClient } from "@/modules/subscriptions/api/createSupabaseClient";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import { getSupabaseAnonKey, getTodayArticlesUrl } from "./getSupabaseConfig";

export type Feed = {
  id: string;
  title: string;
  logo: string | null;
  siteUrl: string | null;
  isFeatured: boolean;
};

export type TodayArticle = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
  readTimeMinutes: number | null;
  feed: Feed;
  isRead: boolean;
  isFavorited: boolean;
};

export type TodayArticlesResponse = {
  articles: TodayArticle[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type TimeRange = "today" | "yesterday" | "week";

export type FetchTodayArticlesOptions = {
  timeRange?: TimeRange;
  limit?: number;
  offset?: number;
};

export function parseTodayArticlesResponse(body: unknown):
  | { ok: true; data: TodayArticlesResponse }
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
    const articles = data.articles;
    const pagination = data.pagination;
    if (
      !Array.isArray(articles) ||
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
        articles: articles as TodayArticle[],
        pagination: pagination as TodayArticlesResponse["pagination"],
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

export async function fetchTodayArticles(
  options: FetchTodayArticlesOptions = {},
): Promise<TodayArticle[]> {
  const { timeRange = "today", limit = 20, offset = 0 } = options;

  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("fetchTodayArticles: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to view articles.",
      "UNAUTHORIZED",
      0,
    );
  }

  const baseUrl = getTodayArticlesUrl();
  if (!baseUrl) {
    throw new AuthApiError(
      "Today articles service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  const params = new URLSearchParams();
  params.set("timeRange", timeRange);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const url = `${baseUrl}?${params.toString()}`;

  const anonKey = getSupabaseAnonKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonKey) {
    headers.apikey = anonKey;
  }
  // Use the user's access token for authorization
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

  const parsed = parseTodayArticlesResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data.articles;
  }

  // Handle 401 specially
  if (res.status === 401) {
    throw new AuthApiError(
      "Please sign in to view articles.",
      "UNAUTHORIZED",
      res.status,
    );
  }

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
