import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseSendCodeResponse,
  sendEmailCode,
} from "@/modules/auth/api/sendEmailCode";

describe("parseSendCodeResponse", () => {
  it("parses success with cooldown", () => {
    const r = parseSendCodeResponse({
      success: true,
      data: { cooldownSeconds: 55 },
      meta: {},
    });
    expect(r).toEqual({ ok: true, cooldownSeconds: 55 });
  });

  it("uses fallback cooldown when missing", () => {
    const r = parseSendCodeResponse({
      success: true,
      data: {},
      meta: {},
    });
    expect(r).toEqual({ ok: true, cooldownSeconds: 60 });
  });

  it("parses error with details", () => {
    const r = parseSendCodeResponse({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Slow down.",
        details: { cooldownSeconds: 42 },
      },
      meta: {},
    });
    expect(r).toEqual({
      ok: false,
      code: "RATE_LIMITED",
      message: "Slow down.",
      details: { cooldownSeconds: 42 },
    });
  });
});

describe("sendEmailCode", () => {
  const originalUrl = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL = "https://auth.test/send";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
    } else {
      process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL = originalUrl;
    }
  });

  it("returns cooldown on 200", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        data: { cooldownSeconds: 48 },
        meta: {},
      }),
    } as unknown as Response);

    const out = await sendEmailCode("who@example.com");
    expect(out).toEqual({ cooldownSeconds: 48 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://auth.test/send",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "who@example.com" }),
      }),
    );
  });

  it("throws AuthApiError on error JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 429,
      json: async () => ({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Wait.",
          details: { cooldownSeconds: 12 },
        },
        meta: {},
      }),
    } as unknown as Response);

    await expect(sendEmailCode("who@example.com")).rejects.toThrow("Wait.");
  });
});
