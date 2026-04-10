import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Article } from "@/modules/article/api/fetchArticle";

import { extractArticleImages } from "./articleContent";

const OFFLINE_CACHE_KEY_PREFIX = "@one_rss_article_offline:";

export type CachedArticleImage = {
  originalUrl: string;
  offlineUri: string | null;
  alt: string | null;
};

export type CachedArticle = Article & {
  offlineSource: "cache";
  cachedAt: string;
  cachedImages: CachedArticleImage[];
};

type CacheStorage = Pick<Console, "error"> & {
  getItem: typeof AsyncStorage.getItem;
  setItem: typeof AsyncStorage.setItem;
};

type CacheImageDownloader = (url: string) => Promise<string | null>;

type ArticleOfflineCacheDependencies = {
  storage: CacheStorage;
  downloadImage: CacheImageDownloader;
};

const defaultDependencies: ArticleOfflineCacheDependencies = {
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
    error: console.error,
  },
  downloadImage: cacheImageAsset,
};

function getCacheKey(articleId: string) {
  return `${OFFLINE_CACHE_KEY_PREFIX}${articleId}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image blob."));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Invalid blob result."));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(blob);
  });
}

async function cacheImageAsset(url: string): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return await blobToDataUrl(blob);
    }

    const { Image } = await import("expo-image");
    const didCache = await Image.prefetch(url, "disk");
    if (!didCache) {
      return null;
    }
    return await Image.getCachePathAsync(url);
  } catch {
    return null;
  }
}

export async function getCachedArticle(
  articleId: string,
  dependencies: ArticleOfflineCacheDependencies = defaultDependencies,
): Promise<CachedArticle | null> {
  try {
    const stored = await dependencies.storage.getItem(getCacheKey(articleId));
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as CachedArticle;
    if (!parsed || typeof parsed !== "object" || parsed.id !== articleId) {
      return null;
    }

    return {
      ...parsed,
      offlineSource: "cache",
      cachedImages: Array.isArray(parsed.cachedImages)
        ? parsed.cachedImages
        : [],
    };
  } catch (error) {
    dependencies.storage.error("Failed to read offline article cache:", error);
    return null;
  }
}

export async function cacheArticleForOffline(
  article: Article,
  dependencies: ArticleOfflineCacheDependencies = defaultDependencies,
): Promise<CachedArticle> {
  const images = extractArticleImages(article.content);
  const cachedImages = await Promise.all(
    images.map(async (image) => ({
      originalUrl: image.url,
      alt: image.alt,
      offlineUri: await dependencies.downloadImage(image.url),
    })),
  );

  const cachedArticle: CachedArticle = {
    ...article,
    offlineSource: "cache",
    cachedAt: new Date().toISOString(),
    cachedImages,
  };

  await dependencies.storage.setItem(
    getCacheKey(article.id),
    JSON.stringify(cachedArticle),
  );

  return cachedArticle;
}
