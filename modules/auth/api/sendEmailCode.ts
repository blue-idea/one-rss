import { AuthApiError } from "@/modules/auth/api/authApiError";

const FALLBACK_COOLDOWN = 60;

function getSendCodeUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

function getSupabaseAnonKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

export function parseSendCodeResponse(body: unknown):
  | { ok: true; cooldownSeconds: number }
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
    const raw = data?.cooldownSeconds;
    const n = typeof raw === "number" ? raw : Number(raw);
    const cooldownSeconds =
      Number.isFinite(n) && n > 0 ? Math.floor(n) : FALLBACK_COOLDOWN;
    return { ok: true, cooldownSeconds };
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

export async function sendEmailCode(
  email: string,
  options?: { signal?: AbortSignal },
): Promise<{ cooldownSeconds: number }> {
  const url = getSendCodeUrl();
  if (!url) {
    throw new AuthApiError(
      "Auth service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  const anon = getSupabaseAnonKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (anon) {
    headers.Authorization = `Bearer ${anon}`;
    headers.apikey = anon;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: email.trim() }),
      signal: options?.signal,
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

  const parsed = parseSendCodeResponse(jsonBody);
  if (parsed.ok) {
    return { cooldownSeconds: parsed.cooldownSeconds };
  }

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
