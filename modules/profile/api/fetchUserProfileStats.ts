import { getSupabaseClient } from "@/modules/supabase/client";

export type UserProfileStats = {
  subscriptionCount: number;
  readCount: number;
  bookmarkCount: number;
};

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      subscriptionCount: 0,
      readCount: 0,
      bookmarkCount: 0,
    };
  }

  const [subscriptionsResult, readingResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("reading_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("progress", 100),
  ]);

  return {
    subscriptionCount: subscriptionsResult.count ?? 0,
    readCount: readingResult.count ?? 0,
    bookmarkCount: 0,
  };
}
