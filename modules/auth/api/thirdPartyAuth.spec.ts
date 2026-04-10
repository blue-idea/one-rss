import { describe, expect, it } from "vitest";

import {
  parseThirdPartyAuthResponse,
  type ThirdPartyProvider,
} from "@/modules/auth/api/thirdPartyAuth";
import {
  getThirdPartyErrorMessage,
  getThirdPartyProviderLabel,
} from "@/modules/auth/thirdPartyAuthPresentation";

function expectFailureCode(
  body: unknown,
  provider: ThirdPartyProvider,
  code: string,
) {
  const result = parseThirdPartyAuthResponse(body, provider);
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("Expected failure result");
  }
  expect(result.error.code).toBe(code);
}

describe("parseThirdPartyAuthResponse", () => {
  it("parses a successful merged sign-in response", () => {
    const result = parseThirdPartyAuthResponse(
      {
        success: true,
        data: {
          status: "signed_in",
          merged: true,
          message: "Signed in successfully.",
        },
      },
      "google",
    );

    expect(result).toEqual({
      ok: true,
      result: {
        status: "signed_in",
        isMerged: true,
        message: "Signed in successfully.",
      },
    });
  });

  it("parses an authorization cancellation response", () => {
    const result = parseThirdPartyAuthResponse(
      {
        success: true,
        data: {
          status: "cancelled",
        },
      },
      "apple",
    );

    expect(result).toEqual({
      ok: true,
      result: {
        status: "cancelled",
        message: "Apple authorization was cancelled. Please try again.",
      },
    });
  });

  it("parses the supplemental email branch", () => {
    const result = parseThirdPartyAuthResponse(
      {
        success: true,
        data: {
          status: "needs_email",
          flowId: "flow-123",
          suggestedEmail: "user@example.com",
        },
      },
      "wechat",
    );

    expect(result).toEqual({
      ok: true,
      result: {
        status: "needs_email",
        flowId: "flow-123",
        suggestedEmail: "user@example.com",
        message:
          "WeChat did not return a usable email. Verify an email address to continue.",
      },
    });
  });

  it("returns api errors when the response fails", () => {
    const result = parseThirdPartyAuthResponse(
      {
        success: false,
        error: {
          code: "ACCOUNT_LINK_CONFLICT",
          message: "Conflict.",
        },
      },
      "google",
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ACCOUNT_LINK_CONFLICT",
        message: "Conflict.",
        details: undefined,
      },
    });
  });

  it("rejects supplemental email responses without a flow id", () => {
    expectFailureCode(
      {
        success: true,
        data: {
          status: "needs_email",
        },
      },
      "google",
      "INTERNAL_ERROR",
    );
  });
});

describe("getThirdPartyErrorMessage", () => {
  it("maps provider labels", () => {
    expect(getThirdPartyProviderLabel("apple")).toBe("Apple");
    expect(getThirdPartyProviderLabel("google")).toBe("Google");
    expect(getThirdPartyProviderLabel("wechat")).toBe("微信");
  });

  it("maps merge conflicts to the guidance copy", () => {
    expect(getThirdPartyErrorMessage("ACCOUNT_LINK_CONFLICT", "fallback")).toBe(
      "Account merge failed. Sign in with email first, then link this provider from your account settings.",
    );
  });

  it("maps generic third-party auth failures", () => {
    expect(
      getThirdPartyErrorMessage("THIRD_PARTY_AUTH_FAILED", "fallback"),
    ).toBe("Third-party sign in failed. Please try again.");
  });

  it("falls back for unknown errors", () => {
    expect(getThirdPartyErrorMessage("UNKNOWN", "fallback")).toBe("fallback");
  });
});
