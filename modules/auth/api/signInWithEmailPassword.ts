import { AuthApiError } from "@/modules/auth/api/authApiError";
import { createSupabaseClient } from "@/modules/subscriptions/api/createSupabaseClient";

function getSupabaseUrl(): string | undefined {
  const direct = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim().replace(/\/+$/, "");
  }

  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;
  try {
    const parsed = new URL(send.trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

function getSupabaseAnonKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof key === "string" && key.trim().length > 0
    ? key.trim()
    : undefined;
}

export function parseSignInResponse(
  body: unknown,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, code: "INTERNAL_ERROR", message: "Invalid response." };
  }

  const rec = body as Record<string, unknown>;
  const accessToken = rec.access_token;
  if (typeof accessToken === "string" && accessToken.length > 0) {
    return { ok: true };
  }

  const errorCode = typeof rec.error === "string" ? rec.error : "";
  const errorDescription =
    typeof rec.error_description === "string" ? rec.error_description : "";
  if (
    errorCode === "invalid_grant" ||
    errorDescription.toLowerCase().includes("invalid login credentials")
  ) {
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
  }

  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Sign in failed.",
  };
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!supabaseUrl || !anon) {
    throw new AuthApiError(
      "Auth service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
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

  const parsed = parseSignInResponse(body);
  if (!parsed.ok) {
    throw new AuthApiError(parsed.message, parsed.code, res.status);
  }

  const rec = body as Record<string, unknown>;
  const accessToken =
    typeof rec.access_token === "string" ? rec.access_token : "";
  const refreshToken =
    typeof rec.refresh_token === "string" ? rec.refresh_token : "";
  if (!accessToken || !refreshToken) {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  const supabase = createSupabaseClient();
  const { error: persistError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (persistError) {
    console.error("signInWithEmailPassword: setSession error", persistError);
    throw new AuthApiError(
      persistError.message || "Failed to persist session.",
      "SESSION_ERROR",
      0,
    );
  }
}
