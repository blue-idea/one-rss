import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { errorResponse, json } from "../_shared/http.ts";
import { buildMembershipResponse } from "../_shared/membership.ts";

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

  const { data: refreshData, error: refreshError } = await supabase.rpc(
    "refresh_membership_state",
    { p_user_id: userData.user.id },
  );

  if (refreshError || !Array.isArray(refreshData) || refreshData.length === 0) {
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to refresh membership.",
      500,
    );
  }

  const membership = refreshData[0];
  let plan = null;

  if (membership.plan_id) {
    const { data: planData } = await supabase
      .from("plans")
      .select(
        "id, code, name, description, billing_cycle, price_cents, currency, is_active",
      )
      .eq("id", membership.plan_id)
      .maybeSingle();
    plan = planData;
  }

  return json({
    success: true,
    data: buildMembershipResponse({
      membership,
      plan,
    }),
  });
});
