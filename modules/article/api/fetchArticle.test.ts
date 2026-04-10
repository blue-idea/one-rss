import { describe, expect, it, vi } from "vitest";

import { AuthApiError } from "@/modules/auth/api/authApiError";
import type { Article } from "@/modules/article/api/fetchArticle";
import { createArticleFetcher } from "@/modules/article/api/fetchArticle";
import type { CachedArticle } from "@/modules/article/offline/articleOfflineCache";

const remoteArticle: Article = {
  id: "article-1",
  title: "在线正文",
  summary: "摘要",
  content: "正文",
  sourceUrl: "https://example.com/articles/1",
  publishedAt: "2026-04-10T08:00:00.000Z",
  readTimeMinutes: 5,
  feed: {
    id: "feed-1",
    title: "Example Feed",
    imageUrl: null,
    siteUrl: "https://example.com",
    isFeatured: false,
  },
  isRead: false,
  isFavorited: false,
};

const cachedArticle: CachedArticle = {
  ...remoteArticle,
  offlineSource: "cache",
  cachedAt: "2026-04-10T09:00:00.000Z",
  cachedImages: [],
};

describe("fetchArticle", () => {
  it("returns remote article when network succeeds", async () => {
    const fetchArticle = createArticleFetcher({
      fetchRemoteArticle: vi.fn().mockResolvedValue(remoteArticle),
      getCachedArticle: vi.fn(),
    });

    await expect(fetchArticle("article-1")).resolves.toEqual({
      ...remoteArticle,
      offlineSource: "remote",
    });
  });

  it("falls back to cached article on network failure", async () => {
    const fetchArticle = createArticleFetcher({
      fetchRemoteArticle: vi.fn().mockRejectedValue(
        new AuthApiError("Network error. Please try again.", "NETWORK_ERROR", 0),
      ),
      getCachedArticle: vi.fn().mockResolvedValue(cachedArticle),
    });

    await expect(fetchArticle("article-1")).resolves.toEqual(cachedArticle);
  });

  it("rethrows when network fails and cache is empty", async () => {
    const error = new AuthApiError("Network error. Please try again.", "NETWORK_ERROR", 0);
    const fetchArticle = createArticleFetcher({
      fetchRemoteArticle: vi.fn().mockRejectedValue(error),
      getCachedArticle: vi.fn().mockResolvedValue(null),
    });

    await expect(fetchArticle("article-1")).rejects.toBe(error);
  });
});
