import { describe, expect, it } from "vitest";

import { parseRegisterResponse } from "@/modules/auth/api/registerWithEmailPassword";

describe("parseRegisterResponse", () => {
  it("returns ok for success payload", () => {
    const out = parseRegisterResponse({
      success: true,
      data: { email: "user@example.com" },
      meta: {},
    });
    expect(out).toEqual({ ok: true });
  });

  it("returns code and message for error payload", () => {
    const out = parseRegisterResponse({
      success: false,
      error: {
        code: "CONFLICT",
        message: "This email has already been registered.",
      },
      meta: {},
    });
    expect(out).toEqual({
      ok: false,
      code: "CONFLICT",
      message: "This email has already been registered.",
      details: undefined,
    });
  });
});
