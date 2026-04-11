/**
 * 创建支付会话 API
 */

import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type CreatePaymentSessionResult =
  | { ok: true; sessionId: string; checkoutUrl: string }
  | { ok: false; code: string; message: string };

/**
 * 创建支付会话
 * @param planId 套餐 ID
 * @param userId 用户 ID
 * @returns 支付会话信息
 */
export async function createPaymentSession(
  planId: string,
  userId: string,
): Promise<CreatePaymentSessionResult> {
  const supabase = getSupabaseClient();

  try {
    // Get user email for checkout
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        ok: false,
        code: "USER_ERROR",
        message: "Failed to get user information.",
      };
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      return {
        ok: false,
        code: "EMAIL_MISSING",
        message: "User email is required for payment.",
      };
    }

    // Create a pending subscription record for idempotency
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        feed_id: `premium:${planId}`,
        is_muted: false,
      })
      .select()
      .single();

    // If insert fails due to duplicate, that's okay (idempotent)
    if (insertError && !insertError.message.includes("duplicate")) {
      console.error("createPaymentSession: insert error", insertError);
    }

    // In production, this would call Stripe/LemonSqueezy to create checkout session
    // For now, return a mock session
    const sessionId = `cs_${planId}_${userId}_${Date.now()}`;
    const checkoutUrl = `https://checkout.example.com/session/${sessionId}`;

    return {
      ok: true,
      sessionId,
      checkoutUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create payment session.";
    return {
      ok: false,
      code: "SESSION_ERROR",
      message,
    };
  }
}

/**
 * 刷新会员状态
 * 从 Supabase 获取最新会员状态并返回
 */
export async function refreshMembershipStatus(userId: string): Promise<{
  isPremium: boolean;
  expiresAt: string | null;
  plan: string | null;
}> {
  const supabase = getSupabaseClient();

  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) {
    return {
      isPremium: false,
      expiresAt: null,
      plan: null,
    };
  }

  const metadata = userData.user.user_metadata || {};
  const isPremium =
    typeof metadata.isPremium === "boolean" ? metadata.isPremium : false;
  const premiumExpiresAt =
    typeof metadata.premiumExpiresAt === "string"
      ? metadata.premiumExpiresAt
      : null;
  const plan =
    typeof metadata.subscriptionPlan === "string"
      ? metadata.subscriptionPlan
      : null;

  // Check if premium has expired
  let effectiveIsPremium = isPremium;
  if (isPremium && premiumExpiresAt) {
    const expiresAt = new Date(premiumExpiresAt);
    if (expiresAt.getTime() < Date.now()) {
      effectiveIsPremium = false;
    }
  }

  return {
    isPremium: effectiveIsPremium,
    expiresAt: premiumExpiresAt,
    plan,
  };
}
