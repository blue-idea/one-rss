/**
 * 退出登录 API
 */

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export type LogoutResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * 退出登录
 * 清除本地存储并调用 Supabase 登出
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const supabase = getSupabaseClient();

    // Clear local storage
    const keysToRemove = [
      "@one_rss_bookmarks",
      "@one_rss_read_preferences",
      "@one_rss_interface_language",
      "@one_rss_translation_language",
    ];

    await AsyncStorage.multiRemove(keysToRemove);

    // Call Supabase sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("logout: signOut error", error);
      return {
        ok: false,
        code: "SIGNOUT_ERROR",
        message: error.message || "Failed to sign out.",
      };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to logout.";
    return {
      ok: false,
      code: "LOGOUT_ERROR",
      message,
    };
  }
}
