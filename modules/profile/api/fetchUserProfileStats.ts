import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl, getSupabaseAnonKey } from "@/modules/today/api/getSupabaseConfig";

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export interface UserProfileStats {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
}

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  const supabase = getSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get subscription count
  const { count: subscriptionCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Get bookmark count from local storage
  let bookmarkCount = 0;
  try {
    const stored = await AsyncStorage.getItem("@one_rss_bookmarks");
    if (stored) {
      const parsed = JSON.parse(stored);
      bookmarkCount = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    bookmarkCount = 0;
  }

  // Get read count - for now return 0 (would need read tracking in future)
  const readCount = 0;

  return {
    subscriptionCount: subscriptionCount ?? 0,
    readCount,
    bookmarkCount,
  };
}