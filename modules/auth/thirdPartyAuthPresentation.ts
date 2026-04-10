import { type ThirdPartyProvider } from "@/modules/auth/api/thirdPartyAuth";

export function getThirdPartyProviderLabel(
  provider: ThirdPartyProvider,
): string {
  switch (provider) {
    case "apple":
      return "Apple";
    case "google":
      return "Google";
    case "wechat":
      return "微信";
  }
}

export function getThirdPartyErrorMessage(
  code: string,
  fallback: string,
): string {
  switch (code) {
    case "AUTH_CANCELLED":
      return "Authorization was cancelled. Please try again.";
    case "ACCOUNT_LINK_CONFLICT":
      return "Account merge failed. Sign in with email first, then link this provider from your account settings.";
    case "THIRD_PARTY_AUTH_FAILED":
      return "Third-party sign in failed. Please try again.";
    case "NOT_CONFIGURED":
      return "Third-party auth service is not configured.";
    case "NETWORK_ERROR":
      return "Network error. Please try again.";
    default:
      return fallback;
  }
}
