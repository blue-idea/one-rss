import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

type VerifyPayload = {
  email?: unknown;
  code?: unknown;
};

type OtpChallengeRow = {
  id: string;
  code_hash: string;
  expires_at: string;
  consumed_at: string | null;
};

function json(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function meta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashOtp(
  email: string,
  code: string,
  pepper: string,
): Promise<string> {
  return sha256Hex(`${email}:${code}:${pepper}`);
}

function bytesToBase64Url(input: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < input.length; i += 1) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function utf8ToBase64Url(input: string): string {
  return bytesToBase64Url(new TextEncoder().encode(input));
}

async function signTicket(payloadB64: string, secret: string): Promise<string> {
  const sigHex = await sha256Hex(`${secret}:${payloadB64}`);
  return utf8ToBase64Url(sigHex);
}

async function createRegistrationCredential(
  email: string,
  challengeId: string,
  secret: string,
): Promise<{ token: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const payload = {
    sub: "registration_credential",
    email,
    challengeId,
    exp: expiresAt,
    nonce: crypto.randomUUID(),
  };
  const payloadB64 = utf8ToBase64Url(JSON.stringify(payload));
  const signature = await signTicket(payloadB64, secret);
  return { token: `${payloadB64}.${signature}`, expiresAt };
}

function verificationError(): Response {
  return json(
    {
      success: false,
      error: {
        code: "INVALID_OTP",
        message: "Verification code is invalid or expired.",
      },
      meta: meta(),
    },
    422,
    corsHeaders,
  );
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Method not allowed.",
        },
        meta: meta(),
      },
      405,
      corsHeaders,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const pepper = Deno.env.get("OTP_PEPPER");
  const ticketSecret = Deno.env.get("REGISTRATION_TICKET_SECRET") ?? pepper;

  if (!supabaseUrl || !serviceKey || !pepper || !ticketSecret) {
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Service misconfiguration.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  let payload: VerifyPayload;
  try {
    payload = await req.json();
  } catch {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid JSON body.",
        },
        meta: meta(),
      },
      422,
      corsHeaders,
    );
  }

  const emailRaw = typeof payload.email === "string" ? payload.email : "";
  const codeRaw = typeof payload.code === "string" ? payload.code : "";
  const email = normalizeEmail(emailRaw);
  const code = codeRaw.trim();

  if (!isValidEmail(email) || !isValidOtp(code)) {
    return verificationError();
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: challenge, error: challengeErr } = await supabase
    .from("email_otp_challenges")
    .select("id, code_hash, expires_at, consumed_at")
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedChallenge = challenge as OtpChallengeRow | null;

  if (challengeErr) {
    console.error("verify-email-code: read challenge failed");
    return json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Database error." },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  if (!typedChallenge) {
    return verificationError();
  }

  const now = Date.now();
  if (new Date(typedChallenge.expires_at).getTime() <= now) {
    return verificationError();
  }

  const expectedHash = await hashOtp(email, code, pepper);
  if (expectedHash !== typedChallenge.code_hash) {
    return verificationError();
  }

  const { error: consumeErr } = await supabase
    .from("email_otp_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", typedChallenge.id)
    .is("consumed_at", null);

  if (consumeErr) {
    return json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Database error." },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  const registrationCredential = await createRegistrationCredential(
    email,
    typedChallenge.id,
    ticketSecret,
  );

  return json(
    {
      success: true,
      data: {
        registrationCredential: registrationCredential.token,
        expiresAt: registrationCredential.expiresAt,
      },
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});
