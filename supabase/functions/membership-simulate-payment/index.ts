import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { errorResponse, json } from "../_shared/http.ts";
import {
  processMembershipWebhook,
  type ActivateMembershipInput,
  type CheckoutCompletedPayload,
  type CheckoutSessionStatus,
  type PlanRecord,
  type RegisterEventInput,
} from "../_shared/membership.ts";

type SimulatePaymentRequest = {
  sessionId?: unknown;
  action?: unknown;
};

function createRepo(supabase: ReturnType<typeof createClient>) {
  return {
    async findSessionByProviderSessionId(providerSessionId: string) {
      const { data } = await supabase
        .from("payment_sessions")
        .select("id, user_id, plan_id, provider, provider_session_id, status")
        .eq("provider_session_id", providerSessionId)
        .maybeSingle();
      return data;
    },
    async findPlanById(planId: string) {
      const { data } = await supabase
        .from("plans")
        .select(
          "id, code, name, description, billing_cycle, price_cents, currency, is_active",
        )
        .eq("id", planId)
        .maybeSingle();
      return data as PlanRecord | null;
    },
    async registerEvent(input: RegisterEventInput) {
      const { error } = await supabase.from("payment_events").insert({
        event_key: input.eventKey,
        provider: "mockpay",
        provider_event_id: input.providerEventId,
        provider_session_id: input.providerSessionId,
        event_type: input.eventType,
        session_id: input.sessionId,
        payload: input.payload,
      });

      if (error?.code === "23505") {
        return "duplicate" as const;
      }

      if (error) {
        throw error;
      }

      return "created" as const;
    },
    async markSessionStatus(
      sessionId: string,
      status: CheckoutSessionStatus,
      completedAt?: string,
    ) {
      const payload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (completedAt) {
        payload.completed_at = completedAt;
      }

      const { error } = await supabase
        .from("payment_sessions")
        .update(payload)
        .eq("id", sessionId);

      if (error) {
        throw error;
      }
    },
    async activateMembership(input: ActivateMembershipInput) {
      const { error } = await supabase.from("memberships").upsert(
        {
          user_id: input.userId,
          plan_id: input.plan.id,
          tier: "premium",
          status: "active",
          started_at: input.startedAt,
          expires_at: input.expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        throw error;
      }
    },
  };
}

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

  let body: SimulatePaymentRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Invalid JSON body.", 422);
  }

  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const action =
    typeof body.action === "string" ? body.action.trim() : "completed";
  if (!sessionId || (action !== "completed" && action !== "canceled")) {
    return errorResponse("VALIDATION_FAILED", "Invalid payment action.", 422);
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

  const { data: session, error: sessionError } = await supabase
    .from("payment_sessions")
    .select("id, user_id, plan_id, provider_session_id")
    .eq("id", sessionId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return errorResponse(
      "SESSION_NOT_FOUND",
      "Payment session was not found.",
      404,
    );
  }

  const event: CheckoutCompletedPayload = {
    id: `evt_${crypto.randomUUID()}`,
    type:
      action === "completed"
        ? "checkout.session.completed"
        : "checkout.session.canceled",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: session.provider_session_id,
        status: action === "completed" ? "paid" : "canceled",
        metadata: {
          source: "membership-simulate-payment",
        },
      },
    },
  };

  try {
    const result = await processMembershipWebhook(
      createRepo(supabase),
      event,
      new Date(event.created * 1000),
    );

    if (!result.ok) {
      return errorResponse(result.code, result.message, 422);
    }

    return json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("membership-simulate-payment failed", error);
    return errorResponse("INTERNAL_ERROR", "Payment simulation failed.", 500);
  }
});
