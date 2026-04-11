export type FeedCategory = {
  id: string;
  title: string;
  slug: string;
  sort: number;
};

export type FeedSource = {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  siteUrl: string | null;
  category: string;
  categoryId: string;
  isSubscribed: boolean;
};

export type FeedsResponse = {
  feeds: FeedSource[];
  categories: FeedCategory[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
    total: number;
  };
};

export type FetchFeedsOptions = {
  categorySlug?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};
