export function getSupabaseUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const k = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : undefined;
}

export function getTodayArticlesUrl(): string | undefined {
  const u = process.env.EXPO_PUBLIC_TODAY_ARTICLES_URL;
  return typeof u === "string" && u.trim().length > 0 ? u.trim() : undefined;
}