declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_AUTH_SEND_CODE_URL?: string;
    EXPO_PUBLIC_AUTH_VERIFY_CODE_URL?: string;
    EXPO_PUBLIC_AUTH_REGISTER_URL?: string;
    EXPO_PUBLIC_AUTH_OAUTH_SIGN_IN_URL?: string;
    EXPO_PUBLIC_AUTH_OAUTH_COMPLETE_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
