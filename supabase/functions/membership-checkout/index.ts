import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { errorResponse, json } from "../_shared/http.ts";

type CheckoutRequest = {
  planCode?: unknown;
  successUrl?: unknown;
  cancelUrl?: unknown;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (req.method !== "POST") {
    return errorResponse("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceKey || !authHeader) {
    return errorResponse("UNAUTHORIZED", "Unauthorized.", 401);
  }

  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Invalid JSON body.", 422);
  }

  const planCode =
    typeof body.planCode === "string" ? body.planCode.trim() : "";
  if (planCode !== "monthly" && planCode !== "yearly") {
    return errorResponse("VALIDATION_FAILED", "Invalid plan code.", 422);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData, error: authError } =
    await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    return errorResponse("UNAUTHORIZED", "Unauthorized.", 401);
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      "id, code, name, description, billing_cycle, price_cents, currency, is_active",
    )
    .eq("code", planCode)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    return errorResponse(
      "PLAN_NOT_FOUND",
      "Selected plan is not available.",
      404,
    );
  }

  const providerSessionId = `mockpay_${crypto.randomUUID()}`;
  const { data: inserted, error: insertError } = await supabase
    .from("payment_sessions")
    .insert({
      user_id: userData.user.id,
      plan_id: plan.id,
      provider: "mockpay",
      provider_session_id: providerSessionId,
      status: "pending",
      success_url: typeof body.successUrl === "string" ? body.successUrl : null,
      cancel_url: typeof body.cancelUrl === "string" ? body.cancelUrl : null,
      metadata: {
        planCode: plan.code,
      },
    })
    .select("id, provider_session_id, status, created_at")
    .single();

  if (insertError || !inserted) {
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to create checkout session.",
      500,
    );
  }

  return json(
    {
      success: true,
      data: {
        sessionId: inserted.id,
        provider: "mockpay",
        providerSessionId: inserted.provider_session_id,
        status: inserted.status,
        createdAt: inserted.created_at,
        plan: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          billingCycle: plan.billing_cycle,
          priceCents: plan.price_cents,
          currency: plan.currency,
        },
      },
    },
    201,
  );
});
