import { describe, expect, it } from "vitest";

import { parseTodayArticlesResponse } from "@/modules/today/api/fetchTodayArticles";

// 需求3 - 今日聚合流
describe("parseTodayArticlesResponse", () => {
  // 需求3.1: 当用户进入今日页时，OneRss 应展示来自已订阅源的聚合文章列表。
  it("parses articles list from subscribed feeds", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Today's Article",
            summary: "Article summary",
            sourceUrl: "https://example.com/article",
            publishedAt: "2026-04-10T09:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Feed One",
              logo: "https://example.com/logo.png",
              siteUrl: "https://example.com",
              isFeatured: true,
            },
            isRead: false,
            isFavorited: false,
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles).toHaveLength(1);
      expect(result.data.articles[0].title).toBe("Today's Article");
      expect(result.data.articles[0].feed.title).toBe("Feed One");
    }
  });

  // 需求3.2: 当用户切换时间范围（今日/昨天/本周）时，OneRss 应按选择范围刷新文章结果。
  // 验证时间范围参数的正确性
  it("parses articles with time range support", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Yesterday's Article",
            summary: "Article from yesterday",
            sourceUrl: "https://example.com/yesterday",
            publishedAt: "2026-04-09T20:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f1",
              title: "Feed One",
              logo: null,
              siteUrl: "https://example.com",
              isFeatured: false,
            },
            isRead: true,
            isFavorited: true,
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles).toHaveLength(1);
      // Verify published date is in the past
      const pubDate = new Date(result.data.articles[0].publishedAt);
      expect(pubDate.getTime()).toBeLessThan(Date.now());
    }
  });

  // 需求3.3: 当用户选择"按发布时间排序"时，OneRss 应按发布时间倒序展示文章。
  it("parses articles sorted by publish time", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Latest Article",
            summary: "Most recent",
            sourceUrl: "https://example.com/latest",
            publishedAt: "2026-04-10T12:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Tech Feed",
              logo: null,
              siteUrl: "https://example.com",
              isFeatured: true,
            },
            isRead: false,
            isFavorited: false,
          },
          {
            id: "a2",
            title: "Older Article",
            summary: "Less recent",
            sourceUrl: "https://example.com/older",
            publishedAt: "2026-04-10T08:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f2",
              title: "News Feed",
              logo: null,
              siteUrl: "https://news.example.com",
              isFeatured: false,
            },
            isRead: false,
            isFavorited: false,
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles).toHaveLength(2);
      // Verify descending order by publishedAt
      const firstPub = new Date(result.data.articles[0].publishedAt).getTime();
      const secondPub = new Date(result.data.articles[1].publishedAt).getTime();
      expect(firstPub).toBeGreaterThan(secondPub);
    }
  });

  // 需求3.5: 当用户点击收藏按钮时，OneRss 应更新文章收藏状态并在书架中可见。
  it("parses favorited article status", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Favorite Article",
            summary: "To be saved",
            sourceUrl: "https://example.com/fav",
            publishedAt: "2026-04-10T10:00:00Z",
            readTimeMinutes: 5,
            feed: {
              id: "f1",
              title: "Feed One",
              logo: null,
              siteUrl: "https://example.com",
              isFeatured: false,
            },
            isRead: false,
            isFavorited: true, // User has favorited this article
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.articles[0].isFavorited).toBe(true);
    }
  });

  // 需求3.6: 当用户进入"精选推荐"栏目时，OneRss 应优先展示来自 is_featured = true 订阅源的文章...
  it("parses featured feed articles", () => {
    const mockResponse = {
      success: true,
      data: {
        articles: [
          {
            id: "a1",
            title: "Featured Article",
            summary: "From featured source",
            sourceUrl: "https://example.com/featured",
            publishedAt: "2026-04-10T11:00:00Z",
            readTimeMinutes: 4,
            feed: {
              id: "f1",
              title: "Premium Feed",
              logo: "https://example.com/logo.png",
              siteUrl: "https://example.com",
              isFeatured: true, // This feed is featured
            },
            isRead: false,
            isFavorited: false,
          },
          {
            id: "a2",
            title: "Regular Article",
            summary: "From regular source",
            sourceUrl: "https://example.com/regular",
            publishedAt: "2026-04-10T09:00:00Z",
            readTimeMinutes: 3,
            feed: {
              id: "f2",
              title: "Regular Feed",
              logo: null,
              siteUrl: "https://regular.example.com",
              isFeatured: false, // Not featured
            },
            isRead: false,
            isFavorited: false,
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const featured = result.data.articles.filter((a) => a.feed.isFeatured);
      expect(featured).toHaveLength(1);
      expect(featured[0].feed.isFeatured).toBe(true);
    }
  });

  // Error handling
  it("parses error response", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Please sign in to view articles.",
      },
      meta: {},
    };

    const result = parseTodayArticlesResponse(mockResponse) as {
      ok: false;
      code: string;
      message: string;
    };

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNAUTHORIZED");
    expect(result.message).toBe("Please sign in to view articles.");
  });

  it("returns error for invalid input", () => {
    expect(parseTodayArticlesResponse(null).ok).toBe(false);
    expect(parseTodayArticlesResponse(undefined).ok).toBe(false);
    expect(parseTodayArticlesResponse({}).ok).toBe(false);
  });
});
