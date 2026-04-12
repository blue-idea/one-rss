import { AuthApiError } from "@/modules/auth/api/authApiError";
import { createSupabaseClient as getSupabaseClient } from "@/modules/subscriptions/api/createSupabaseClient";

import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";

export type Feed = {
  id: string;
  title: string;
  logo: string | null;
  siteUrl: string | null;
  isFeatured: boolean;
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  sourceUrl: string;
  publishedAt: string;
  readTimeMinutes: number | null;
  feed: Feed;
  isRead: boolean;
  isFavorited: boolean;
};

export function parseArticleResponse(
  body: unknown,
): { ok: true; data: Article } | { ok: false; code: string; message: string } {
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
      data: data as Article,
    };
  }
  const err = rec.error as Record<string, unknown> | undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err?.message === "string" ? err.message : "Request failed.";
  return { ok: false, code, message };
}

export async function fetchArticle(articleId: string): Promise<Article> {
  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("fetchArticle: getSession error", sessionError);
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

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError(
      "Article service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  const url = `${supabaseUrl}/functions/v1/get-article?id=${encodeURIComponent(articleId)}`;

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

  const parsed = parseArticleResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data;
  }

  // Handle 401 and 404 specially
  if (res.status === 401) {
    throw new AuthApiError(
      "Please sign in to view articles.",
      "UNAUTHORIZED",
      res.status,
    );
  }
  if (res.status === 404) {
    throw new AuthApiError(parsed.message, "NOT_FOUND", res.status);
  }

  throw new AuthApiError(parsed.message, parsed.code, res.status);
}
