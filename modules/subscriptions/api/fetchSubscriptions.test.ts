import { describe, it, expect } from "vitest";
import { parseFetchSubscriptionsResponse } from "./fetchSubscriptions";

// 需求4 - 书架列表
describe("parseFetchSubscriptionsResponse", () => {
  // 需求4.1: 当用户进入书架页时，OneRss 应展示已订阅源列表。
  it("parses subscriptions list", () => {
    const body = {
      success: true,
      data: [
        {
          id: "sub-1",
          userId: "user-1",
          feedId: "feed-1",
          isMuted: false,
          createdAt: "2026-04-01T00:00:00Z",
          feed: {
            id: "feed-1",
            title: "Tech News",
            url: "https://tech.example.com/feed",
            imageUrl: "https://tech.example.com/logo.png",
            siteUrl: "https://tech.example.com",
            isFeatured: true,
            category: "科技",
          },
        },
        {
          id: "sub-2",
          userId: "user-1",
          feedId: "feed-2",
          isMuted: false,
          createdAt: "2026-04-02T00:00:00Z",
          feed: {
            id: "feed-2",
            title: "Design Weekly",
            url: "https://design.example.com/feed",
            imageUrl: null,
            siteUrl: "https://design.example.com",
            isFeatured: false,
            category: "设计",
          },
        },
      ],
    };

    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].feed.title).toBe("Tech News");
      expect(result.data[1].feed.category).toBe("设计");
    }
  });

  // 需求4.2: 书架应支持分类过滤功能。
  it("parses subscriptions with category", () => {
    const body = {
      success: true,
      data: [
        {
          id: "sub-1",
          userId: "user-1",
          feedId: "feed-1",
          isMuted: false,
          createdAt: "2026-04-01T00:00:00Z",
          feed: {
            id: "feed-1",
            title: "Tech News",
            url: "https://tech.example.com/feed",
            imageUrl: null,
            siteUrl: "https://tech.example.com",
            isFeatured: true,
            category: "科技",
          },
        },
      ],
    };

    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].feed.category).toBe("科技");
    }
  });

  // 需求4.3: 书架应展示各订阅源的未读计数。
  it("parses subscriptions with unread count", () => {
    const body = {
      success: true,
      data: [
        {
          id: "sub-1",
          userId: "user-1",
          feedId: "feed-1",
          isMuted: false,
          createdAt: "2026-04-01T00:00:00Z",
          feed: {
            id: "feed-1",
            title: "Tech News",
            url: "https://tech.example.com/feed",
            imageUrl: null,
            siteUrl: "https://tech.example.com",
            isFeatured: true,
            category: "科技",
          },
          unreadCount: 24,
          lastUpdatedAt: "2026-04-10T12:00:00Z",
        },
      ],
    };

    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].unreadCount).toBe(24);
    }
  });

  // 需求4.4: 书架应展示各订阅源的最近更新时间。
  it("parses subscriptions with last updated time", () => {
    const body = {
      success: true,
      data: [
        {
          id: "sub-1",
          userId: "user-1",
          feedId: "feed-1",
          isMuted: false,
          createdAt: "2026-04-01T00:00:00Z",
          feed: {
            id: "feed-1",
            title: "Tech News",
            url: "https://tech.example.com/feed",
            imageUrl: null,
            siteUrl: "https://tech.example.com",
            isFeatured: true,
            category: "科技",
          },
          unreadCount: 24,
          lastUpdatedAt: "2026-04-10T12:00:00Z",
        },
      ],
    };

    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].lastUpdatedAt).toBe("2026-04-10T12:00:00Z");
    }
  });

  // 验证空列表处理
  it("handles empty subscriptions list", () => {
    const body = {
      success: true,
      data: [],
    };

    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(0);
    }
  });

  // 验证错误响应处理
  it("parses error response", () => {
    const body = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Please sign in to view your subscriptions.",
      },
    };

    const result = parseFetchSubscriptionsResponse(body) as {
      ok: false;
      code: string;
      message: string;
    };
    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNAUTHORIZED");
    expect(result.message).toBe("Please sign in to view your subscriptions.");
  });

  // 验证无效输入
  it("returns error for invalid input", () => {
    expect(parseFetchSubscriptionsResponse(null).ok).toBe(false);
    expect(parseFetchSubscriptionsResponse(undefined).ok).toBe(false);
    expect(parseFetchSubscriptionsResponse({}).ok).toBe(false);
  });

  // 验证缺少 data 字段
  it("returns error when data is not an array", () => {
    const body = {
      success: true,
      data: "not an array",
    };
    const result = parseFetchSubscriptionsResponse(body);
    expect(result.ok).toBe(false);
  });
});
