function readAuthApiEnv(envKey: keyof NodeJS.ProcessEnv): string | undefined {
  switch (envKey) {
    case "EXPO_PUBLIC_AUTH_SEND_CODE_URL":
      return process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
    case "EXPO_PUBLIC_AUTH_VERIFY_CODE_URL":
      return process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL;
    case "EXPO_PUBLIC_AUTH_REGISTER_URL":
      return process.env.EXPO_PUBLIC_AUTH_REGISTER_URL;
    case "EXPO_PUBLIC_AUTH_OAUTH_SIGN_IN_URL":
      return process.env.EXPO_PUBLIC_AUTH_OAUTH_SIGN_IN_URL;
    case "EXPO_PUBLIC_AUTH_OAUTH_COMPLETE_URL":
      return process.env.EXPO_PUBLIC_AUTH_OAUTH_COMPLETE_URL;
    case "EXPO_PUBLIC_SUPABASE_URL":
      return process.env.EXPO_PUBLIC_SUPABASE_URL;
    case "EXPO_PUBLIC_SUPABASE_ANON_KEY":
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    default:
      return undefined;
  }
}

export function getAuthApiUrl(
  envKey: keyof NodeJS.ProcessEnv,
  fallbackPattern?: RegExp,
  fallbackReplacement?: string,
): string | undefined {
  const direct = readAuthApiEnv(envKey);
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }

  if (!fallbackPattern || !fallbackReplacement) {
    return undefined;
  }

  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;

  const trimmed = send.trim();
  const derived = trimmed.replace(fallbackPattern, fallbackReplacement);
  return derived !== trimmed ? derived : undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof key === "string" && key.trim().length > 0
    ? key.trim()
    : undefined;
}

export function createAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const anon = getSupabaseAnonKey();
  if (anon) {
    headers.Authorization = `Bearer ${anon}`;
    headers.apikey = anon;
  }

  return headers;
}
