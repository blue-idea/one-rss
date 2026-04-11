import { describe, expect, it } from "vitest";

import { parseSubscribeResponse } from "@/modules/subscriptions/api/subscribeToFeed";

// 需求2.4 - 当用户点击未订阅源的"订阅"，OneRss 应将源状态更新为"已订阅"
describe("parseSubscribeResponse", () => {
  // 需求2.4: 订阅成功后返回订阅关系
  it("parses success response with subscription", () => {
    const mockResponse = {
      success: true,
      data: {
        subscription: {
          id: "sub-123",
          userId: "user-456",
          feedId: "feed-789",
          isMuted: false,
          createdAt: "2026-04-11T12:00:00Z",
        },
        isNew: true,
      },
    };

    const result = parseSubscribeResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.subscription.id).toBe("sub-123");
      expect(result.data.subscription.feedId).toBe("feed-789");
      expect(result.data.isNew).toBe(true);
    }
  });

  // 需求2.6: 网络异常或地址无效时返回错误信息
  it("parses error response with code and message", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        message: "Free plan can subscribe up to 10 feeds.",
        details: { current: 10, limit: 10 },
      },
    };

    const result = parseSubscribeResponse(mockResponse);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("SUBSCRIPTION_LIMIT_EXCEEDED");
      expect(result.message).toBe("Free plan can subscribe up to 10 feeds.");
    }
  });

  // 需求2.6: 无效响应格式返回内部错误
  it("returns error for invalid response", () => {
    expect(parseSubscribeResponse(null).ok).toBe(false);
    expect(parseSubscribeResponse(undefined).ok).toBe(false);
    expect(parseSubscribeResponse({}).ok).toBe(false);
  });

  // 需求2.5: 取消订阅后再次订阅应成功（幂等性）
  it("parses success response when re-subscribing after unsubscribe", () => {
    const mockResponse = {
      success: true,
      data: {
        subscription: {
          id: "sub-456",
          userId: "user-123",
          feedId: "feed-789",
          isMuted: false,
          createdAt: "2026-04-11T13:00:00Z",
        },
        isNew: true,
      },
    };

    const result = parseSubscribeResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isNew).toBe(true);
    }
  });
});

// 需求2.5 - 当用户点击已订阅源的按钮，OneRss 应允许取消订阅
describe("Subscription State Transitions", () => {
  // 验证订阅状态可以从"未订阅"变为"已订阅"
  it("validates subscribed state can be reached", () => {
    const mockResponse = {
      success: true,
      data: {
        subscription: {
          id: "sub-123",
          userId: "user-456",
          feedId: "feed-789",
          isMuted: false,
          createdAt: "2026-04-11T12:00:00Z",
        },
        isNew: true,
      },
    };

    const result = parseSubscribeResponse(mockResponse);
    expect(result.ok).toBe(true);
  });
});
