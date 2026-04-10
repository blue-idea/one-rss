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

export type SpeechSynthesisRequest = {
  articleId: string;
  text: string;
  language?: string;
};

export type SpeechSynthesisResponse = {
  audioUrl: string;
  duration: number;
};

function parseSpeechSynthesisResponse(body: unknown):
  | { ok: true; data: SpeechSynthesisResponse }
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
    const audioUrl = data.audioUrl;
    const duration = data.duration;
    if (typeof audioUrl !== "string") {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format: missing audioUrl.",
      };
    }
    if (typeof duration !== "number") {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid data format: missing duration.",
      };
    }
    return {
      ok: true,
      data: {
        audioUrl,
        duration,
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

function getSpeechSynthesisUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_SPEECH_SYNTHESIS_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

export async function speechSynthesis(
  request: SpeechSynthesisRequest,
): Promise<SpeechSynthesisResponse> {
  const { articleId, text, language = "zh-CN" } = request;

  const supabase = getSupabaseClient();

  // Get current session to extract access token
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("speechSynthesis: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to use speech synthesis.",
      "UNAUTHORIZED",
      0,
    );
  }

  const baseUrl = getSpeechSynthesisUrl();
  if (!baseUrl) {
    throw new AuthApiError(
      "Speech synthesis service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  const params = new URLSearchParams();
  params.set("articleId", articleId);
  params.set("language", language);
  const url = `${baseUrl}?${params.toString()}`;

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
      body: JSON.stringify({ text }),
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

  const parsed = parseSpeechSynthesisResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data;
  }

  // Handle 403 for premium gate
  if (res.status === 403) {
    throw new AuthApiError(
      "高级会员才可使用朗读功能，请升级会员。",
      "PREMIUM_REQUIRED",
      res.status,
    );
  }

  // Handle 401 specially
  if (res.status === 401) {
    throw new AuthApiError(
      "Please sign in to use speech synthesis.",
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
