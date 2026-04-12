import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";

let supabaseSingleton: SupabaseClient | null = null;

/**
 * 单例 Supabase 客户端，使用 AsyncStorage 持久化会话；
 * 邮箱密码登录成功后会写入同一会话存储，供各 API 通过 getSession 读取。
 *
 * @throws AuthApiError if Supabase is not configured
 */
export function createSupabaseClient(): SupabaseClient {
  if (supabaseSingleton) {
    return supabaseSingleton;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  supabaseSingleton = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // 避免依赖 react-native Platform（Vitest Node 环境无法解析 RN 入口）；
      // 本应用登录主要为邮箱密码 + setSession，不依赖 URL hash 隐式会话。
      detectSessionInUrl: false,
    },
  });

  return supabaseSingleton;
}

/**
 * Gets an access token for the current user.
 * @throws AuthApiError if not authenticated
 */
export async function getAccessToken(): Promise<string> {
  const supabase = createSupabaseClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error("getAccessToken: getSession error", sessionError);
    throw new AuthApiError("Failed to get user session.", "SESSION_ERROR", 0);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new AuthApiError("Please sign in to continue.", "UNAUTHORIZED", 0);
  }

  return accessToken;
}
