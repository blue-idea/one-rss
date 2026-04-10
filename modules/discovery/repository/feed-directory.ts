import {
  feedCategorySeeds,
  feedSeeds,
} from "@/modules/discovery/data/rsshub-routes";

export const FEED_DIRECTORY_PAGE_SIZE = 6;

export type FeedCategory = {
  slug: string;
  title: string;
  sort: number;
  feedCount: number;
};

export type FeedDirectoryItem = {
  id: string;
  categorySlug: string;
  categoryTitle: string;
  title: string;
  description: string;
  rssUrl: string;
  siteUrl: string;
  language: string;
  isFeatured: boolean;
  subscribed: boolean;
};

export type FeedDirectoryQuery = {
  categorySlug?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type FeedDirectoryResponse = {
  items: FeedDirectoryItem[];
  total: number;
  totalPages: number;
  displayedCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  categorySlug: string;
  keyword: string;
  categories: FeedCategory[];
};

const mockSubscribedFeedIds = new Set<string>([
  "techcrunch-startups",
  "dezeen-architecture",
  "stratechery",
  "aeon-ideas",
]);

const categoryIndex = new Map(
  feedCategorySeeds.map((category) => [category.slug, category]),
);

const directoryItems: FeedDirectoryItem[] = feedSeeds
  .map((feed) => {
    const category = categoryIndex.get(feed.categorySlug);
    if (!category) {
      throw new Error(`未知订阅源分类: ${feed.categorySlug}`);
    }

    return {
      id: feed.id,
      categorySlug: category.slug,
      categoryTitle: category.title,
      title: feed.title,
      description: feed.description,
      rssUrl: feed.rssUrl,
      siteUrl: feed.siteUrl,
      language: feed.language,
      isFeatured: feed.isFeatured,
      subscribed: mockSubscribedFeedIds.has(feed.id),
    };
  })
  .sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    const categoryDelta =
      (categoryIndex.get(left.categorySlug)?.sort ?? 0) -
      (categoryIndex.get(right.categorySlug)?.sort ?? 0);
    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    return left.title.localeCompare(right.title);
  });

const categories: FeedCategory[] = feedCategorySeeds.map((category) => ({
  ...category,
  feedCount: directoryItems.filter(
    (item) => item.categorySlug === category.slug,
  ).length,
}));

const searchableFields = (item: FeedDirectoryItem): string[] => [
  item.title,
  item.description,
  item.categoryTitle,
  item.language,
  item.rssUrl,
  item.siteUrl,
];

export function getFeedCategories(): FeedCategory[] {
  return categories;
}

export function queryFeedDirectory({
  categorySlug = "all",
  keyword = "",
  page = 1,
  pageSize = FEED_DIRECTORY_PAGE_SIZE,
}: FeedDirectoryQuery = {}): FeedDirectoryResponse {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : FEED_DIRECTORY_PAGE_SIZE;

  const filtered = directoryItems.filter((item) => {
    const matchesCategory =
      categorySlug === "all" || item.categorySlug === categorySlug;
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      searchableFields(item).some((field) =>
        field.toLowerCase().includes(normalizedKeyword),
      );

    return matchesCategory && matchesKeyword;
  });

  const start = (safePage - 1) * safePageSize;
  const items = filtered.slice(start, start + safePageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));

  return {
    items,
    total: filtered.length,
    totalPages,
    displayedCount: Math.min(start + items.length, filtered.length),
    page: safePage,
    pageSize: safePageSize,
    hasMore: start + safePageSize < filtered.length,
    categorySlug,
    keyword: normalizedKeyword,
    categories,
  };
}

export async function fetchFeedDirectory(
  query: FeedDirectoryQuery = {},
): Promise<FeedDirectoryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return queryFeedDirectory(query);
}
