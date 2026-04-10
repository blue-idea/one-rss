import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { errorResponse, json } from "../_shared/http.ts";
import {
  processMembershipWebhook,
  verifyWebhookSignature,
  type ActivateMembershipInput,
  type CheckoutCompletedPayload,
  type CheckoutSessionStatus,
  type PlanRecord,
  type RegisterEventInput,
} from "../_shared/membership.ts";

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
        {
          onConflict: "user_id",
        },
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
  const webhookSecret = Deno.env.get("MEMBERSHIP_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceKey || !webhookSecret) {
    return errorResponse("INTERNAL_ERROR", "Service misconfiguration.", 500);
  }

  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const bodyText = await req.text();

  const isValid = await verifyWebhookSignature({
    body: bodyText,
    timestamp,
    signature,
    secret: webhookSecret,
  });

  if (!isValid) {
    return errorResponse(
      "INVALID_SIGNATURE",
      "Webhook signature is invalid.",
      401,
    );
  }

  let payload: CheckoutCompletedPayload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return errorResponse("VALIDATION_FAILED", "Invalid JSON body.", 422);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const result = await processMembershipWebhook(
      createRepo(supabase),
      payload,
      new Date(payload.created * 1000),
    );

    if (!result.ok) {
      return errorResponse(result.code, result.message, 422);
    }

    return json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("membership-webhook failed", error);
    return errorResponse("INTERNAL_ERROR", "Webhook processing failed.", 500);
  }
});
