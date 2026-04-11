import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";
import { getAccessToken } from "./createSupabaseClient";
import type { ImportFeedResult } from "./types";

export type ImportFeedResponse =
  | { ok: true; data: ImportFeedResult }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

export function parseImportFeedResponse(body: unknown): ImportFeedResponse {
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
      data: data as ImportFeedResult,
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

export async function importFeed(url: string): Promise<ImportFeedResult> {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new AuthApiError(
        "Invalid URL. Please enter a valid HTTP or HTTPS URL.",
        "VALIDATION_FAILED",
        0,
      );
    }
  } catch (err) {
    if (err instanceof AuthApiError) {
      throw err;
    }
    throw new AuthApiError(
      "Invalid URL format. Please enter a valid URL.",
      "VALIDATION_FAILED",
      0,
    );
  }

  const accessToken = await getAccessToken();

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  const importUrl = `${supabaseUrl}/rest/v1/rpc/import_feed`;

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
    res = await fetch(importUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        feed_url: url,
      }),
    });
  } catch {
    throw new AuthApiError(
      "Network error. Please check your connection and try again.",
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

  const parsed = parseImportFeedResponse(jsonBody);
  if (parsed.ok) {
    return parsed.data;
  }

  // Handle specific error codes
  if (res.status === 422) {
    throw new AuthApiError(
      parsed.message,
      "VALIDATION_FAILED",
      res.status,
      parsed.details,
    );
  }

  if (res.status === 400) {
    throw new AuthApiError(
      "The URL is not a valid RSS feed. Please check the URL and try again.",
      "INVALID_FEED",
      res.status,
      parsed.details,
    );
  }

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
