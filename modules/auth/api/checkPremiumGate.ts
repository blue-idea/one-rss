/**
 * 会员门禁 API
 * 检查用户是否为 premium，free 用户调用 premium 功能时阻断并引导升级
 */

import { AuthApiError } from "@/modules/auth/api/authApiError";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl =
    typeof process !== "undefined"
      ? process.env.EXPO_PUBLIC_SUPABASE_URL
      : undefined;
  const supabaseAnonKey =
    typeof process !== "undefined"
      ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export type PremiumGateResult =
  | { ok: true; isPremium: boolean; expiresAt: string | null }
  | { ok: false; code: string; message: string };

/**
 * 检查用户是否为 premium 会员
 * @returns premium 状态信息
 * @throws AuthApiError 如果用户未登录
 */
export async function checkPremiumGate(): Promise<PremiumGateResult> {
  const supabase = getSupabaseClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("checkPremiumGate: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError(
      "Please sign in to access premium features.",
      "UNAUTHORIZED",
      0,
    );
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new AuthApiError("Failed to get user information.", "USER_ERROR", 0);
  }

  const metadata = userData.user.user_metadata || {};
  const isPremium =
    typeof metadata.isPremium === "boolean" ? metadata.isPremium : false;
  const premiumExpiresAt =
    typeof metadata.premiumExpiresAt === "string"
      ? metadata.premiumExpiresAt
      : null;

  // Check if premium has expired
  if (isPremium && premiumExpiresAt) {
    const expiresAt = new Date(premiumExpiresAt);
    if (expiresAt.getTime() < Date.now()) {
      return {
        ok: true,
        isPremium: false,
        expiresAt: premiumExpiresAt,
      };
    }
  }

  return {
    ok: true,
    isPremium,
    expiresAt: premiumExpiresAt,
  };
}

/**
 * 验证 premium 功能访问
 * @param featureName 功能名称（用于错误提示）
 * @throws AuthApiError 如果用户不是 premium
 */
export async function requirePremium(featureName: string): Promise<void> {
  const result = await checkPremiumGate();

  if (!result.ok) {
    throw new AuthApiError(result.message, result.code, 0);
  }

  if (!result.isPremium) {
    throw new AuthApiError(
      `${featureName} is a premium feature. Please upgrade to access.`,
      "PREMIUM_REQUIRED",
      0,
    );
  }
}

export const PREMIUM_GATE_ERROR_CODE = "PREMIUM_REQUIRED";

export const PREMIUM_UPGRADE_URL = "/premium";
