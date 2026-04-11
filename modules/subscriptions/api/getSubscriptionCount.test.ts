import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  getSubscriptionCount,
  checkSubscriptionLimit,
  parseSubscriptionCountResponse,
} from "./getSubscriptionCount";

// Mock dependencies
vi.mock("./createSupabaseClient", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-token"),
}));

vi.mock("@/modules/today/api/getSupabaseConfig", () => ({
  getSupabaseUrl: vi.fn().mockReturnValue("https://mock.supabase.co"),
  getSupabaseAnonKey: vi.fn().mockReturnValue("mock-anon-key"),
}));

describe("parseSubscriptionCountResponse", () => {
  it("should parse a successful response with count", () => {
    const body = {
      success: true,
      data: { count: 5 },
    };
    const result = parseSubscriptionCountResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(5);
      expect(result.data.limit).toBe(10);
      expect(result.data.isAtLimit).toBe(false);
      expect(result.data.isOverLimit).toBe(false);
    }
  });

  it("should handle response at limit (10)", () => {
    const body = {
      success: true,
      data: { count: 10 },
    };
    const result = parseSubscriptionCountResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(10);
      expect(result.data.isAtLimit).toBe(true);
      expect(result.data.isOverLimit).toBe(false);
    }
  });

  it("should handle response over limit (11)", () => {
    const body = {
      success: true,
      data: { count: 11 },
    };
    const result = parseSubscriptionCountResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(11);
      expect(result.data.isAtLimit).toBe(true);
      expect(result.data.isOverLimit).toBe(true);
    }
  });

  it("should handle empty array response", () => {
    const body: unknown[] = [];
    const result = parseSubscriptionCountResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(0);
      expect(result.data.isAtLimit).toBe(false);
      expect(result.data.isOverLimit).toBe(false);
    }
  });

  it("should handle invalid response", () => {
    const result = parseSubscriptionCountResponse(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INTERNAL_ERROR");
    }
  });

  it("should handle error response", () => {
    const body = {
      success: false,
      error: {
        code: "ERROR_CODE",
        message: "Error message",
      },
    };
    const result = parseSubscriptionCountResponse(body);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ERROR_CODE");
      expect(result.message).toBe("Error message");
    }
  });
});

describe("getSubscriptionCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should fetch and return subscription count", async () => {
    const mockResponse = {
      success: true,
      data: { count: 5 },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getSubscriptionCount();
    expect(result.count).toBe(5);
    expect(result.limit).toBe(10);
    expect(result.isAtLimit).toBe(false);
    expect(result.isOverLimit).toBe(false);
  });

  it("should throw AuthApiError when not configured", async () => {
    const { getSupabaseUrl } =
      await import("@/modules/today/api/getSupabaseConfig");
    vi.mocked(getSupabaseUrl).mockReturnValueOnce("");

    await expect(getSubscriptionCount()).rejects.toThrow(
      "Supabase is not configured.",
    );
  });

  it("should throw AuthApiError on network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    await expect(getSubscriptionCount()).rejects.toThrow("Network error");
  });

  it("should throw AuthApiError on non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(getSubscriptionCount()).rejects.toThrow(AuthApiError);
  });
});

describe("checkSubscriptionLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should not throw when under limit", async () => {
    const mockResponse = {
      success: true,
      data: { count: 5 },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(checkSubscriptionLimit()).resolves.toBeUndefined();
  });

  it("should throw when at limit", async () => {
    const mockResponse = {
      success: true,
      data: { count: 10 },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(checkSubscriptionLimit()).rejects.toThrow(
      /maximum subscription limit.*10/,
    );
  });

  it("should throw when over limit", async () => {
    const mockResponse = {
      success: true,
      data: { count: 11 },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(checkSubscriptionLimit()).rejects.toThrow(
      /maximum subscription limit.*10/,
    );
  });
});
