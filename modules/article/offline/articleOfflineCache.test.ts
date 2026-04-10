import { describe, expect, it, vi } from "vitest";

import type { Article } from "@/modules/article/api/fetchArticle";

import { cacheArticleForOffline, getCachedArticle } from "./articleOfflineCache";

const article: Article = {
  id: "article-1",
  title: "离线阅读",
  summary: "测试摘要",
  content: [
    "<p>第一段</p>",
    '<img src="https://cdn.example.com/cover.jpg" alt="封面图" />',
    "<p>第二段</p>",
  ].join("\n"),
  sourceUrl: "https://example.com/articles/1",
  publishedAt: "2026-04-10T08:00:00.000Z",
  readTimeMinutes: 6,
  feed: {
    id: "feed-1",
    title: "Example Feed",
    imageUrl: null,
    siteUrl: "https://example.com",
    isFeatured: true,
  },
  isRead: false,
  isFavorited: false,
};

describe("articleOfflineCache", () => {
  it("stores cached metadata and offline image uris", async () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    };

    const cached = await cacheArticleForOffline(article, {
      storage,
      downloadImage: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
    });

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(cached.offlineSource).toBe("cache");
    expect(cached.cachedImages).toEqual([
      {
        originalUrl: "https://cdn.example.com/cover.jpg",
        alt: "封面图",
        offlineUri: "data:image/png;base64,abc",
      },
    ]);
  });

  it("returns null when cache is missing", async () => {
    const storage = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn(),
      error: vi.fn(),
    };

    await expect(
      getCachedArticle("missing", {
        storage,
        downloadImage: vi.fn(),
      }),
    ).resolves.toBeNull();
  });
});
