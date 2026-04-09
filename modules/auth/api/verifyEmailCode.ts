import { AuthApiError } from "@/modules/auth/api/authApiError";

function getVerifyUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL;
  if (typeof u === "string" && u.trim().length > 0) {
    return u.trim();
  }

  // Backward-compatible fallback: derive verify endpoint from send endpoint.
  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;
  return send.trim().replace(/\/send-email-code\/?$/i, "/verify-email-code");
}

function getSupabaseAnonKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

export type VerifyEmailCodeResult = {
  registrationCredential: string;
  expiresAt: string;
};

export function parseVerifyCodeResponse(body: unknown):
  | { ok: true; data: VerifyEmailCodeResult }
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
    const registrationCredential =
      typeof data?.registrationCredential === "string"
        ? data.registrationCredential
        : "";
    const expiresAt = typeof data?.expiresAt === "string" ? data.expiresAt : "";
    if (!registrationCredential || !expiresAt) {
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Invalid response.",
      };
    }
    return { ok: true, data: { registrationCredential, expiresAt } };
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

export async function verifyEmailCode(
  email: string,
  code: string,
  options?: { signal?: AbortSignal },
): Promise<VerifyEmailCodeResult> {
  const url = getVerifyUrl();
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
      body: JSON.stringify({
        email: email.trim(),
        code: code.trim(),
      }),
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

  const parsed = parseVerifyCodeResponse(jsonBody);
  if (parsed.ok) return parsed.data;

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
