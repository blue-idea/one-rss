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

export type ToggleFavoriteResponse =
  | { ok: true; isFavorited: boolean }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseToggleFavoriteResponse(
  body: unknown,
): ToggleFavoriteResponse {
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
    return {
      ok: true,
      isFavorited:
        typeof data?.is_favorited === "boolean"
          ? data.is_favorited
          : typeof data?.isFavorited === "boolean"
            ? data.isFavorited
            : false,
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

export type ToggleFavoriteOptions = {
  articleId: string;
};

export async function toggleFavorite(
  options: ToggleFavoriteOptions,
): Promise<boolean> {
  const { articleId } = options;

  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("toggleFavorite: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to favorite articles.",
      "UNAUTHORIZED",
      0,
    );
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const url = `${supabaseUrl}/functions/v1/toggle-favorite`;

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
      method: "POST",
      headers,
      body: JSON.stringify({
        article_id: articleId,
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

  const parsed = parseToggleFavoriteResponse(jsonBody);
  if (parsed.ok) {
    return parsed.isFavorited;
  }

  // Handle 401 specially
  if (res.status === 401) {
    throw new AuthApiError(
      "Please sign in to favorite articles.",
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
