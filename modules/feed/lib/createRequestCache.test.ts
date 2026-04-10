import { describe, expect, it, vi } from "vitest";

import { createRequestCache } from "./createRequestCache";

describe("createRequestCache", () => {
  it("reuses the inflight request for the same key", async () => {
    let resolve: ((value: string) => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<string>((res) => {
          resolve = res;
        }),
    );
    const cache = createRequestCache(fetcher);

    const first = cache.load("today");
    const second = cache.load("today");

    expect(fetcher).toHaveBeenCalledTimes(1);

    resolve?.("payload");

    await expect(first).resolves.toBe("payload");
    await expect(second).resolves.toBe("payload");
    expect(cache.peek("today")).toBe("payload");
  });

  it("returns cached data without refetching", async () => {
    const fetcher = vi.fn(async (key: string) => `${key}-data`);
    const cache = createRequestCache(fetcher);

    await expect(cache.load("week")).resolves.toBe("week-data");
    await expect(cache.load("week")).resolves.toBe("week-data");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("clears rejected requests so the next call can retry", async () => {
    const fetcher = vi
      .fn<(_: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");
    const cache = createRequestCache(fetcher);

    await expect(cache.load("curated")).rejects.toThrow("boom");
    await expect(cache.load("curated")).resolves.toBe("recovered");

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
