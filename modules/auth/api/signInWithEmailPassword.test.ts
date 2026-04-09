import { describe, expect, it } from "vitest";

import { parseSignInResponse } from "@/modules/auth/api/signInWithEmailPassword";

describe("parseSignInResponse", () => {
  it("returns ok for successful sign in payload", () => {
    const out = parseSignInResponse({
      access_token: "token",
      token_type: "bearer",
    });
    expect(out).toEqual({ ok: true });
  });

  it("maps invalid_grant to INVALID_CREDENTIALS", () => {
    const out = parseSignInResponse({
      error: "invalid_grant",
      error_description: "Invalid login credentials",
    });
    expect(out).toEqual({
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });
});
