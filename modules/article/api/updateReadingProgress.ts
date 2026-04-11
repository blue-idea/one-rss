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

export type UpdateReadingProgressResponse =
  | { ok: true }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseUpdateReadingProgressResponse(
  body: unknown,
  status: number,
): UpdateReadingProgressResponse {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    };
  }

  const rec = body as Record<string, unknown>;

  if (rec.success === true) {
    return { ok: true };
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

export type UpdateReadingProgressOptions = {
  articleId: string;
  progress: number; // 0-100 percentage
};

export async function updateReadingProgress(
  options: UpdateReadingProgressOptions,
): Promise<void> {
  const { articleId, progress } = options;

  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("updateReadingProgress: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    // Silently skip progress update if not logged in
    console.log("updateReadingProgress: not logged in, skipping");
    return;
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const url = `${supabaseUrl}/functions/v1/update-article-progress`;

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
        progress: progress,
      }),
    });
  } catch {
    // Network error - silently fail for progress updates
    console.error("updateReadingProgress: network error");
    return;
  }

  // Silently handle errors - progress tracking should not block reading
  if (!res.ok) {
    console.error("updateReadingProgress: failed", res.status);
  }
}
