import { describe, expect, it } from "vitest";

import { parseUnsubscribeResponse } from "@/modules/subscriptions/api/unsubscribeFromFeed";

// 需求2.5 - 当用户点击已订阅源的按钮，OneRss 应允许取消订阅并同步更新状态
describe("parseUnsubscribeResponse", () => {
  // 需求2.5: 取消订阅成功
  it("parses success response", () => {
    const mockResponse = {
      success: true,
      data: {
        success: true,
      },
    };

    const result = parseUnsubscribeResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
  });

  // 需求2.5: 取消订阅是幂等的（重复取消仍返回成功）
  it("parses success for idempotent unsubscribe", () => {
    const mockResponse = {
      success: true,
    };

    const result = parseUnsubscribeResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
  });

  // 需求2.6: 取消订阅失败时返回错误信息
  it("parses error response with code and message", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Please sign in to unsubscribe.",
      },
    };

    const result = parseUnsubscribeResponse(mockResponse);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNAUTHORIZED");
      expect(result.message).toBe("Please sign in to unsubscribe.");
    }
  });

  // 需求2.6: 无效响应格式返回内部错误
  it("returns error for invalid response", () => {
    expect(parseUnsubscribeResponse(null).ok).toBe(false);
    expect(parseUnsubscribeResponse(undefined).ok).toBe(false);
    expect(parseUnsubscribeResponse({}).ok).toBe(false);
  });
});

// 需求2.5 - 订阅状态从"已订阅"变为"未订阅"
describe("Unsubscribe State Transition", () => {
  it("validates unsubscribed state can be reached", () => {
    const mockResponse = {
      success: true,
      data: { success: true },
    };

    const result = parseUnsubscribeResponse(mockResponse);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
  });
});
