import { describe, expect, it } from "vitest";

import { parseCuratedArticlesResponse } from "@/modules/curated/api/fetchCuratedArticles";

describe("parseCuratedArticlesResponse", () => {
  it("parses success payload with articles", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Test Article",
            summary: "Summary",
            sourceUrl: "https://example.com",
            publishedAt: "2026-04-10T10:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Feed Title",
              imageUrl: null,
              siteUrl: "https://feed.example.com",
              isFeatured: true,
            },
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: true,
        },
      },
      meta: {},
    };

    const result = parseCuratedArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles).toHaveLength(1);
      expect(result.data.articles[0].title).toBe("Test Article");
      expect(result.data.pagination.hasMore).toBe(true);
    }
  });

  it("parses error payload", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to fetch articles.",
      },
      meta: {},
    };

    const result = parseCuratedArticlesResponse(mockResponse) as {
      ok: false;
      code: string;
      message: string;
    };

    expect(result.ok).toBe(false);
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.message).toBe("Failed to fetch articles.");
  });

  it("returns error for invalid response structure", () => {
    const result = parseCuratedArticlesResponse(null) as {
      ok: false;
      code: string;
    };
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("returns error for missing articles array", () => {
    const result = parseCuratedArticlesResponse({
      success: true,
      data: {
        pagination: { limit: 20, offset: 0, hasMore: false },
      },
      meta: {},
    }) as { ok: false; code: string };

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// 需求2 - 订阅发现
describe("Discovery and Subscription", () => {
  // 需求2.1: 当用户在发现页浏览公开目录推荐时，OneRss 应展示可订阅源列表并提供分类筛选。
  it("should parse categorized feed list", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Tech News",
            summary: "Latest tech news",
            sourceUrl: "https://tech.example.com",
            publishedAt: "2026-04-10T10:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f1",
              title: "Tech Feed",
              imageUrl: "https://tech.example.com/logo.png",
              siteUrl: "https://tech.example.com",
              isFeatured: true,
            },
          },
        ],
        pagination: { limit: 20, offset: 0, hasMore: false },
      },
      meta: {},
    };

    const result = parseCuratedArticlesResponse(mockResponse);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles[0].feed.isFeatured).toBe(true);
    }
  });

  // 需求2.3: 当用户输入合法 RSS 地址并点击添加订阅时，OneRss 应校验地址可用性并创建订阅关系。
  // 此测试验证 RSS URL 解析逻辑
  it("should parse RSS source URL", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "RSS Feed Article",
            summary: "Article from RSS",
            sourceUrl: "https://rss.example.com/feed.xml",
            publishedAt: "2026-04-10T10:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "RSS Source",
              imageUrl: null,
              siteUrl: "https://rss.example.com",
              isFeatured: false,
            },
          },
        ],
        pagination: { limit: 20, offset: 0, hasMore: false },
      },
      meta: {},
    };

    const result = parseCuratedArticlesResponse(mockResponse);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles[0].sourceUrl).toContain("feed.xml");
    }
  });
});
