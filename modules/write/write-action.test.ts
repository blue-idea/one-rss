import { describe, expect, it } from "vitest";

import {
  OFFLINE_WRITE_BLOCKED_CODE,
  OFFLINE_WRITE_BLOCKED_MESSAGE,
  WRITE_FAILED_CODE,
  WRITE_FAILED_MESSAGE,
  WriteActionError,
  createWriteFailedError,
  getWriteActionMessage,
  guardWriteAction,
} from "@/modules/write/write-action";

describe("guardWriteAction", () => {
  it("blocks write operations when offline", async () => {
    await expect(
      guardWriteAction(false, async () => "ok"),
    ).rejects.toMatchObject({
      code: OFFLINE_WRITE_BLOCKED_CODE,
      message: OFFLINE_WRITE_BLOCKED_MESSAGE,
    });
  });

  it("returns the action result when online", async () => {
    await expect(guardWriteAction(true, async () => "ok")).resolves.toBe("ok");
  });

  it("wraps unexpected failures with generic write semantics", async () => {
    await expect(
      guardWriteAction(true, async () => {
        throw new Error("boom");
      }),
    ).rejects.toMatchObject({
      code: WRITE_FAILED_CODE,
      message: WRITE_FAILED_MESSAGE,
    });
  });

  it("preserves explicit write action errors", async () => {
    const explicitError = createWriteFailedError(new Error("storage"));

    await expect(
      guardWriteAction(true, async () => {
        throw explicitError;
      }),
    ).rejects.toBe(explicitError);
  });
});

describe("getWriteActionMessage", () => {
  it("returns write action messages for known errors", () => {
    expect(getWriteActionMessage(new WriteActionError("x", WRITE_FAILED_CODE))).toBe(
      "x",
    );
  });

  it("falls back to the generic message for unknown errors", () => {
    expect(getWriteActionMessage(new Error("boom"))).toBe(
      WRITE_FAILED_MESSAGE,
    );
  });
});
