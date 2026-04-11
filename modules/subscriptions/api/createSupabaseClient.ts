import { createClient } from "@supabase/supabase-js";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/modules/today/api/getSupabaseConfig";

/**
 * Creates an authenticated Supabase client for making authenticated requests.
 * @throws AuthApiError if Supabase is not configured
 */
export function createSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthApiError("Supabase is not configured.", "NOT_CONFIGURED", 0);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
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
