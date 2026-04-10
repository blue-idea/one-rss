import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  createAuthHeaders,
  getAuthApiUrl,
} from "@/modules/auth/api/authApiConfig";

export type ThirdPartyProvider = "apple" | "google" | "wechat";

export type ThirdPartySignInResult =
  | {
      status: "signed_in";
      message: string;
      isMerged: boolean;
    }
  | {
      status: "cancelled";
      message: string;
    }
  | {
      status: "needs_email";
      message: string;
      flowId: string;
      suggestedEmail?: string;
    };

type ThirdPartyApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ThirdPartyApiSuccess = {
  ok: true;
  result: ThirdPartySignInResult;
};

type ThirdPartyApiFailure = {
  ok: false;
  error: ThirdPartyApiError;
};

function getThirdPartySignInUrl(): string | undefined {
  return getAuthApiUrl(
    "EXPO_PUBLIC_AUTH_OAUTH_SIGN_IN_URL",
    /\/send-email-code\/?$/i,
    "/oauth/sign-in",
  );
}

function getThirdPartyCompleteUrl(): string | undefined {
  return getAuthApiUrl(
    "EXPO_PUBLIC_AUTH_OAUTH_COMPLETE_URL",
    /\/send-email-code\/?$/i,
    "/oauth/complete",
  );
}

function getProviderName(provider: ThirdPartyProvider): string {
  switch (provider) {
    case "apple":
      return "Apple";
    case "google":
      return "Google";
    case "wechat":
      return "WeChat";
  }
}

function defaultCancelledMessage(provider: ThirdPartyProvider): string {
  return `${getProviderName(provider)} authorization was cancelled. Please try again.`;
}

function parseErrorPayload(rec: Record<string, unknown>): ThirdPartyApiFailure {
  const err = rec.error as Record<string, unknown> | undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err?.message === "string"
      ? err.message
      : "Third-party sign in failed.";
  const details =
    err?.details !== undefined &&
    err.details !== null &&
    typeof err.details === "object" &&
    !Array.isArray(err.details)
      ? (err.details as Record<string, unknown>)
      : undefined;

  return {
    ok: false,
    error: { code, message, details },
  };
}

export function parseThirdPartyAuthResponse(
  body: unknown,
  provider: ThirdPartyProvider,
): ThirdPartyApiSuccess | ThirdPartyApiFailure {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Invalid response.",
      },
    };
  }

  const rec = body as Record<string, unknown>;
  if (rec.success !== true) {
    return parseErrorPayload(rec);
  }

  const data = rec.data as Record<string, unknown> | undefined;
  const rawStatus =
    typeof data?.status === "string" ? data.status.toLowerCase() : "";
  const message =
    typeof data?.message === "string" && data.message.trim().length > 0
      ? data.message.trim()
      : undefined;

  if (rawStatus === "signed_in") {
    return {
      ok: true,
      result: {
        status: "signed_in",
        message:
          message ??
          `${getProviderName(provider)} sign-in completed successfully.`,
        isMerged: data?.merged === true || data?.isMerged === true,
      },
    };
  }

  if (rawStatus === "cancelled") {
    return {
      ok: true,
      result: {
        status: "cancelled",
        message: message ?? defaultCancelledMessage(provider),
      },
    };
  }

  if (rawStatus === "needs_email") {
    const flowId = typeof data?.flowId === "string" ? data.flowId.trim() : "";
    if (!flowId) {
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Invalid response.",
        },
      };
    }

    const suggestedEmail =
      typeof data?.suggestedEmail === "string" &&
      data.suggestedEmail.trim().length > 0
        ? data.suggestedEmail.trim()
        : undefined;

    return {
      ok: true,
      result: {
        status: "needs_email",
        message:
          message ??
          `${getProviderName(provider)} did not return a usable email. Verify an email address to continue.`,
        flowId,
        suggestedEmail,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Invalid response.",
    },
  };
}

async function postThirdPartyAuth<T extends ThirdPartySignInResult>(
  url: string | undefined,
  payload: Record<string, unknown>,
  provider: ThirdPartyProvider,
  options?: { signal?: AbortSignal },
): Promise<T> {
  if (!url) {
    throw new AuthApiError(
      "Third-party auth service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(payload),
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

  const parsed = parseThirdPartyAuthResponse(body, provider);
  if (parsed.ok) {
    return parsed.result as T;
  }

  throw new AuthApiError(
    parsed.error.message,
    parsed.error.code,
    res.status,
    parsed.error.details,
  );
}

export async function signInWithThirdParty(
  provider: ThirdPartyProvider,
  options?: {
    signal?: AbortSignal;
  },
): Promise<ThirdPartySignInResult> {
  return postThirdPartyAuth<ThirdPartySignInResult>(
    getThirdPartySignInUrl(),
    { provider },
    provider,
    options,
  );
}

export async function completeThirdPartySignIn(
  provider: ThirdPartyProvider,
  params: {
    flowId: string;
    email: string;
    registrationCredential: string;
  },
  options?: {
    signal?: AbortSignal;
  },
): Promise<Extract<ThirdPartySignInResult, { status: "signed_in" }>> {
  const result = await postThirdPartyAuth<ThirdPartySignInResult>(
    getThirdPartyCompleteUrl(),
    {
      provider,
      flowId: params.flowId,
      email: params.email.trim(),
      registrationCredential: params.registrationCredential,
    },
    provider,
    options,
  );

  if (result.status !== "signed_in") {
    throw new AuthApiError("Invalid response.", "INTERNAL_ERROR", 200);
  }

  return result;
}
