import { AuthApiError } from "@/modules/auth/api/authApiError";

function getRegisterUrl(): string | undefined {
  const direct = process.env.EXPO_PUBLIC_AUTH_REGISTER_URL;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }

  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;
  return send
    .trim()
    .replace(/\/send-email-code\/?$/i, "/register-email-password");
}

function getSupabaseAnonKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof key === "string" && key.trim().length > 0
    ? key.trim()
    : undefined;
}

export function parseRegisterResponse(body: unknown):
  | { ok: true }
  | {
      ok: false;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    } {
  if (!body || typeof body !== "object") {
    return { ok: false, code: "INTERNAL_ERROR", message: "Invalid response." };
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

export async function registerWithEmailPassword(
  email: string,
  password: string,
  registrationCredential: string,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const url = getRegisterUrl();
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
        password,
        registrationCredential,
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

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  const parsed = parseRegisterResponse(body);
  if (parsed.ok) return;

  throw new AuthApiError(
    parsed.message,
    parsed.code,
    res.status,
    parsed.details,
  );
}
