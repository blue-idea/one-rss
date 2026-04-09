import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

type RegisterPayload = {
  email?: unknown;
  password?: unknown;
  registrationCredential?: unknown;
};

type RegistrationTicketPayload = {
  sub: string;
  email: string;
  challengeId: string;
  exp: string;
  nonce: string;
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

function isValidPassword(value: string): boolean {
  return value.length >= 8;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padLength)}`;
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function parseRegistrationCredential(
  token: string,
): { payloadB64: string; signatureB64: string } | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(".");
  if (parts.length !== 2) return null;
  if (!parts[0] || !parts[1]) return null;
  return { payloadB64: parts[0], signatureB64: parts[1] };
}

async function verifyRegistrationCredential(
  token: string,
  secret: string,
): Promise<RegistrationTicketPayload | null> {
  const parsed = parseRegistrationCredential(token);
  if (!parsed) return null;

  const expectedSigHex = await sha256Hex(`${secret}:${parsed.payloadB64}`);
  const expectedSigB64 = btoa(expectedSigHex)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  if (expectedSigB64 !== parsed.signatureB64) {
    return null;
  }

  let payloadRaw = "";
  try {
    payloadRaw = new TextDecoder().decode(base64UrlToBytes(parsed.payloadB64));
  } catch {
    return null;
  }

  let payloadObj: unknown;
  try {
    payloadObj = JSON.parse(payloadRaw);
  } catch {
    return null;
  }

  if (!payloadObj || typeof payloadObj !== "object") {
    return null;
  }

  const p = payloadObj as Record<string, unknown>;
  const out: RegistrationTicketPayload = {
    sub: typeof p.sub === "string" ? p.sub : "",
    email: typeof p.email === "string" ? p.email : "",
    challengeId: typeof p.challengeId === "string" ? p.challengeId : "",
    exp: typeof p.exp === "string" ? p.exp : "",
    nonce: typeof p.nonce === "string" ? p.nonce : "",
  };

  if (
    out.sub !== "registration_credential" ||
    !out.email ||
    !out.challengeId ||
    !out.exp ||
    !out.nonce
  ) {
    return null;
  }

  if (!isValidEmail(out.email)) return null;
  if (new Date(out.exp).getTime() <= Date.now()) return null;

  return out;
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
  const ticketSecret =
    Deno.env.get("REGISTRATION_TICKET_SECRET") ?? Deno.env.get("OTP_PEPPER");

  if (!supabaseUrl || !serviceKey || !ticketSecret) {
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

  let payload: RegisterPayload;
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
  const password = typeof payload.password === "string" ? payload.password : "";
  const registrationCredential =
    typeof payload.registrationCredential === "string"
      ? payload.registrationCredential
      : "";
  const email = normalizeEmail(emailRaw);

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid registration payload.",
        },
        meta: meta(),
      },
      422,
      corsHeaders,
    );
  }

  const ticket = await verifyRegistrationCredential(
    registrationCredential,
    ticketSecret,
  );
  if (!ticket || normalizeEmail(ticket.email) !== email) {
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

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const msg = createErr.message.toLowerCase();
    const isAlreadyExists =
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("taken");
    return json(
      {
        success: false,
        error: {
          code: isAlreadyExists ? "CONFLICT" : "INTERNAL_ERROR",
          message: isAlreadyExists
            ? "This email has already been registered."
            : "Failed to create account.",
        },
        meta: meta(),
      },
      isAlreadyExists ? 409 : 500,
      corsHeaders,
    );
  }

  return json(
    {
      success: true,
      data: { email },
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});
