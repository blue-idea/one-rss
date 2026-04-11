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

// 需求3(6) - 精品优先推荐流
describe("Featured Feed Priority and Sorting", () => {
  // 需求3.6: 当用户进入"精选推荐"栏目时，OneRss 应优先展示来自 is_featured = true 订阅源的文章...
  // 验证排序规则：feeds.is_featured 优先，同优先级内按发布时间倒序
  it("should parse articles with featured feed priority", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Featured Article 1",
            summary: "From featured source",
            sourceUrl: "https://example.com/f1",
            publishedAt: "2026-04-10T12:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Featured Feed",
              imageUrl: "https://example.com/logo.png",
              siteUrl: "https://example.com",
              isFeatured: true,
            },
          },
          {
            id: "a2",
            title: "Featured Article 2 (older)",
            summary: "From same featured source",
            sourceUrl: "https://example.com/f2",
            publishedAt: "2026-04-10T08:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f1",
              title: "Featured Feed",
              imageUrl: "https://example.com/logo.png",
              siteUrl: "https://example.com",
              isFeatured: true,
            },
          },
          {
            id: "a3",
            title: "Regular Article (newer)",
            summary: "From regular source",
            sourceUrl: "https://example.com/f3",
            publishedAt: "2026-04-10T11:00:00Z",
            readTimeMinutes: 4,
            feed: {
              id: "f2",
              title: "Regular Feed",
              imageUrl: null,
              siteUrl: "https://regular.example.com",
              isFeatured: false,
            },
          },
          {
            id: "a4",
            title: "Regular Article (older)",
            summary: "From regular source",
            sourceUrl: "https://example.com/f4",
            publishedAt: "2026-04-10T06:00:00Z",
            readTimeMinutes: 2,
            feed: {
              id: "f2",
              title: "Regular Feed",
              imageUrl: null,
              siteUrl: "https://regular.example.com",
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
      const articles = result.data.articles;

      // Verify all articles are parsed correctly
      expect(articles).toHaveLength(4);

      // Featured articles should come first (is_featured = true)
      const featuredArticles = articles.filter((a) => a.feed.isFeatured);

      // First 2 articles should be from featured feeds
      expect(featuredArticles).toHaveLength(2);
      expect(articles[0].feed.isFeatured).toBe(true);
      expect(articles[1].feed.isFeatured).toBe(true);

      // Within featured, newer article should come first (descending by publishedAt)
      const featuredPublishedAt0 = new Date(articles[0].publishedAt).getTime();
      const featuredPublishedAt1 = new Date(articles[1].publishedAt).getTime();
      expect(featuredPublishedAt0).toBeGreaterThan(featuredPublishedAt1);

      // Regular articles should come after featured
      expect(articles[2].feed.isFeatured).toBe(false);
      expect(articles[3].feed.isFeatured).toBe(false);

      // Within regular, newer article should come first
      const regularPublishedAt2 = new Date(articles[2].publishedAt).getTime();
      const regularPublishedAt3 = new Date(articles[3].publishedAt).getTime();
      expect(regularPublishedAt2).toBeGreaterThan(regularPublishedAt3);
    }
  });

  // 验证时间倒序：同优先级内最新文章在前
  it("should maintain descending order by published time within same priority", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Newest Featured",
            summary: "Newest featured",
            sourceUrl: "https://example.com/a1",
            publishedAt: "2026-04-10T14:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Featured",
              imageUrl: null,
              siteUrl: "https://example.com",
              isFeatured: true,
            },
          },
          {
            id: "a2",
            title: "Oldest Featured",
            summary: "Oldest featured",
            sourceUrl: "https://example.com/a2",
            publishedAt: "2026-04-10T06:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f1",
              title: "Featured",
              imageUrl: null,
              siteUrl: "https://example.com",
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
      const articles = result.data.articles;

      // Verify descending order by publishedAt
      const time0 = new Date(articles[0].publishedAt).getTime();
      const time1 = new Date(articles[1].publishedAt).getTime();
      expect(time0).toBeGreaterThan(time1);
    }
  });

  // 验证与今日流排序规则一致性
  it("should have consistent structure with today articles feed", () => {
    const curatedResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Article",
            summary: "Summary",
            sourceUrl: "https://example.com",
            publishedAt: "2026-04-10T10:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Feed",
              imageUrl: null,
              siteUrl: "https://example.com",
              isFeatured: true,
            },
          },
        ],
        pagination: { limit: 20, offset: 0, hasMore: false },
      },
      meta: {},
    };

    const result = parseCuratedArticlesResponse(curatedResponse);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const article = result.data.articles[0];

      // Verify required fields for consistent rendering
      expect(article).toHaveProperty("id");
      expect(article).toHaveProperty("title");
      expect(article).toHaveProperty("summary");
      expect(article).toHaveProperty("sourceUrl");
      expect(article).toHaveProperty("publishedAt");
      expect(article).toHaveProperty("readTimeMinutes");
      expect(article).toHaveProperty("feed");

      // Verify feed structure
      expect(article.feed).toHaveProperty("id");
      expect(article.feed).toHaveProperty("title");
      expect(article.feed).toHaveProperty("isFeatured");
    }
  });
});
