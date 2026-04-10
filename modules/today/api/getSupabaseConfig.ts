// Supabase configuration utilities for client-side API calls

function getSupabaseUrl(): string | undefined {
  const direct = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim().replace(/\/+$/, "");
  }

  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;
  try {
    const parsed = new URL(send.trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

function getSupabaseAnonKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof key === "string" && key.trim().length > 0
    ? key.trim()
    : undefined;
}

export { getSupabaseUrl, getSupabaseAnonKey };
