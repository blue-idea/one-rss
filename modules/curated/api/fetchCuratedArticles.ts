import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";

function getCuratedArticlesUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_CURATED_ARTICLES_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

function getSupabaseUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

function getSupabaseAnonKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type CuratedFeed = {
  id: string;
  title: string;
  imageUrl: string | null;
  siteUrl: string | null;
  isFeatured: boolean;
};

export type CuratedArticle = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
  readTimeMinutes: number | null;
  feed: CuratedFeed;
};

export type CuratedArticlesResponse = {
  articles: CuratedArticle[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export function parseCuratedArticlesResponse(body: unknown):
  | { ok: true; data: CuratedArticlesResponse }
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
    if (!Array.isArray(articles) || !pagination || typeof pagination !== "object") {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format.",
      };
    }
    return {
      ok: true,
      data: {
        articles: articles as CuratedArticle[],
        pagination: pagination as CuratedArticlesResponse["pagination"],
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

interface FetchCuratedArticlesOptions {
  limit?: number;
  offset?: number;
}

export async function fetchCuratedArticles(
  options: FetchCuratedArticlesOptions = {},
): Promise<CuratedArticle[]> {
  const { limit = 20, offset = 0 } = options;

  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("fetchCuratedArticles: getSession error", sessionError);
    throw new AuthApiError(
      "Failed to get user session.",
      "SESSION_ERROR",
      0,
    );
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to view curated articles.",
      "UNAUTHORIZED",
      0,
    );
  }

  const baseUrl = getCuratedArticlesUrl();
  if (!baseUrl) {
    throw new AuthApiError(
      "Curated articles service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  const params = new URLSearchParams();
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

  const parsed = parseCuratedArticlesResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data.articles;
  }

  // Handle 401 specially
  if (res.status === 401) {
    throw new AuthApiError(
      "Please sign in to view curated articles.",
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