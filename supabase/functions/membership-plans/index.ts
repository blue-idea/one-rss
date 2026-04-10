import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { errorResponse, json } from "../_shared/http.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (req.method !== "GET") {
    return errorResponse("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceKey || !authHeader) {
    return errorResponse("UNAUTHORIZED", "Unauthorized.", 401);
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

  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, code, name, description, billing_cycle, price_cents, currency, is_active",
    )
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (error) {
    return errorResponse("INTERNAL_ERROR", "Failed to load plans.", 500);
  }

  return json({
    success: true,
    data: {
      plans: (data ?? []).map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        billingCycle: plan.billing_cycle,
        priceCents: plan.price_cents,
        currency: plan.currency,
        isActive: plan.is_active,
      })),
    },
  });
});
