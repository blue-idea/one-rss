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

export type UpdateReadProgressOptions = {
  articleId: string;
  progress: number; // 0-100
};

function getReadProgressApiUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_READ_PROGRESS_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

export async function updateReadProgress(
  options: UpdateReadProgressOptions,
): Promise<{ success: boolean }> {
  const { articleId, progress } = options;

  const supabase = getSupabaseClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("updateReadProgress: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    // Silently fail for progress tracking - don't throw, just return success
    console.warn(
      "updateReadProgress: No access token, skipping progress update",
    );
    return { success: false };
  }

  const baseUrl = getReadProgressApiUrl();
  if (!baseUrl) {
    console.warn("updateReadProgress: API URL not configured, skipping");
    return { success: false };
  }

  const url = `${baseUrl}/articles/${articleId}/progress`;

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
      method: "POST",
      headers,
      body: JSON.stringify({ progress }),
    });
  } catch {
    // Network error - silently fail for progress tracking
    console.warn("updateReadProgress: Network error");
    return { success: false };
  }

  if (res.status >= 200 && res.status < 300) {
    return { success: true };
  }

  // Server error - silently fail
  console.warn("updateReadProgress: Server error", res.status);
  return { success: false };
}
