import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseVerifyCodeResponse,
  verifyEmailCode,
} from "@/modules/auth/api/verifyEmailCode";

describe("parseVerifyCodeResponse", () => {
  it("parses success payload", () => {
    const out = parseVerifyCodeResponse({
      success: true,
      data: {
        registrationCredential: "ticket",
        expiresAt: "2026-04-09T12:00:00.000Z",
      },
      meta: {},
    });
    expect(out).toEqual({
      ok: true,
      data: {
        registrationCredential: "ticket",
        expiresAt: "2026-04-09T12:00:00.000Z",
      },
    });
  });

  it("parses error payload", () => {
    const out = parseVerifyCodeResponse({
      success: false,
      error: {
        code: "INVALID_OTP",
        message: "Verification code is invalid or expired.",
      },
      meta: {},
    });
    expect(out).toEqual({
      ok: false,
      code: "INVALID_OTP",
      message: "Verification code is invalid or expired.",
      details: undefined,
    });
  });
});

describe("verifyEmailCode", () => {
  const originalUrl = process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL;
  const originalSendUrl = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL = "https://auth.test/verify";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL;
    } else {
      process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL = originalUrl;
    }
    if (originalSendUrl === undefined) {
      delete process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
    } else {
      process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL = originalSendUrl;
    }
  });

  it("returns credential on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: {
          registrationCredential: "ticket",
          expiresAt: "2026-04-09T12:00:00.000Z",
        },
        meta: {},
      }),
    } as unknown as Response);

    const out = await verifyEmailCode("who@example.com", "123456");
    expect(out.registrationCredential).toBe("ticket");
  });

  it("throws on invalid otp", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 422,
      json: async () => ({
        success: false,
        error: {
          code: "INVALID_OTP",
          message: "Verification code is invalid or expired.",
        },
        meta: {},
      }),
    } as unknown as Response);

    await expect(verifyEmailCode("who@example.com", "000000")).rejects.toThrow(
      "Verification code is invalid or expired.",
    );
  });

  it("uses send-code url fallback when verify url is missing", async () => {
    delete process.env.EXPO_PUBLIC_AUTH_VERIFY_CODE_URL;
    process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL =
      "https://auth.test/functions/v1/send-email-code";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: {
          registrationCredential: "ticket",
          expiresAt: "2026-04-09T12:00:00.000Z",
        },
        meta: {},
      }),
    } as unknown as Response);

    await verifyEmailCode("who@example.com", "123456");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://auth.test/functions/v1/verify-email-code",
      expect.any(Object),
    );
  });
});
