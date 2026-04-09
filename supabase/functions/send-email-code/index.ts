import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.16";

type ApiMeta = { requestId: string; timestamp: string };

function isDebugEnabled(): boolean {
  return Deno.env.get("DEBUG_SMTP") === "true";
}

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

function randomSixDigit(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(100_000 + (n[0] % 900_000));
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
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  /**
   * 163 SMTP 常见限制：MAIL FROM 必须等于鉴权账号，否则会返回
   * `553 Mail from must equal authorized user`。
   *
   * 因此发件人 address 强制使用 SMTP_USER，仅允许可选显示名。
   */
  const smtpFromName = Deno.env.get("SMTP_FROM_NAME") ?? undefined;
  const smtpFromAddress = smtpUser;

  if (
    !supabaseUrl ||
    !serviceKey ||
    !pepper ||
    !smtpHost ||
    !smtpUser ||
    !smtpPass
  ) {
    console.error("send-email-code: missing required secrets");
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

  let payload: { email?: unknown };
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
  const email = normalizeEmail(emailRaw);
  if (!email || !isValidEmail(email)) {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid email address.",
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

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: hourlyErr } = await supabase
    .from("email_otp_challenges")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", hourAgo);

  if (hourlyErr) {
    console.error("send-email-code: hourly count", hourlyErr);
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Database error.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  if (hourlyCount !== null && hourlyCount >= 10) {
    return json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many verification codes requested. Try again later.",
        },
        meta: meta(),
      },
      429,
      corsHeaders,
    );
  }

  const { data: lastRow, error: lastErr } = await supabase
    .from("email_otp_challenges")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) {
    console.error("send-email-code: last row", lastErr);
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Database error.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  const minIntervalMs = 60_000;
  if (lastRow?.created_at) {
    const elapsed = Date.now() - new Date(lastRow.created_at).getTime();
    if (elapsed < minIntervalMs) {
      const cooldownSeconds = Math.max(
        1,
        Math.ceil((minIntervalMs - elapsed) / 1000),
      );
      return json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Please wait before requesting another code.",
            details: { cooldownSeconds },
          },
          meta: meta(),
        },
        429,
        corsHeaders,
      );
    }
  }

  const code = randomSixDigit();
  const codeHash = await hashOtp(email, code, pepper);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: inserted, error: insertErr } = await supabase
    .from("email_otp_challenges")
    .insert({ email, code_hash: codeHash, expires_at: expiresAt })
    .select("id")
    .single();

  if (insertErr || !inserted?.id) {
    console.error("send-email-code: insert", insertErr);
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to persist challenge.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  const rowId = inserted.id as string;

  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const secureEnv = Deno.env.get("SMTP_SECURE");
  const secure = secureEnv === "true" || port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFromName
        ? { name: smtpFromName, address: smtpFromAddress }
        : smtpFromAddress,
      to: email,
      subject: "Your OneRss verification code",
      text: `Your verification code is: ${code}\nIt expires in 10 minutes.`,
      html: `<p>Your verification code is:</p><p style="font-size:20px;font-weight:bold;">${code}</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (e) {
    console.error("send-email-code: smtp", e);
    await supabase.from("email_otp_challenges").delete().eq("id", rowId);
    const debug = isDebugEnabled();
    const details = debug
      ? {
          reason:
            e instanceof Error
              ? e.message
              : typeof e === "string"
                ? e
                : "Unknown error",
        }
      : undefined;
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send email. Please try again later.",
          ...(details ? { details } : {}),
        },
        meta: meta(),
      },
      502,
      corsHeaders,
    );
  }

  return json(
    {
      success: true,
      data: {
        cooldownSeconds: 60,
      },
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});
