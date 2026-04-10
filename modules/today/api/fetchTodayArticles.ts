import { getSupabaseUrl, getSupabaseAnonKey } from "./getSupabaseConfig";

export type Article = {
  id: string;
  source: string;
  time: string;
  title: string;
  summary: string;
  url: string;
  featured: boolean;
  sourceBadge?: string;
  readTime?: string;
  author?: string;
};

type TodayArticlesResponse = {
  success: boolean;
  data: {
    articles: Article[];
    pagination: {
      page: number;
      limit: number;
      timeRange: string;
    };
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
};

export type TimeRange = "today" | "yesterday" | "week";

interface FetchTodayArticlesOptions {
  timeRange?: TimeRange;
  page?: number;
  limit?: number;
}

export async function fetchTodayArticles(
  options: FetchTodayArticlesOptions = {},
): Promise<Article[]> {
  const { timeRange = "today", page = 1, limit = 20 } = options;

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const params = new URLSearchParams({
    time: timeRange,
    page: page.toString(),
    limit: limit.toString(),
  });

  const functionUrl = `${supabaseUrl}/functions/v1/today-articles?${params}`;

  let res: Response;
  try {
    res = await fetch(functionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
    });
  } catch (err) {
    console.error("fetchTodayArticles: network error", err);
    throw new Error("网络错误，请检查网络连接");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  const data = body as TodayArticlesResponse | ApiError;

  if (!data || !data.success) {
    const err = data as ApiError;
    console.error("fetchTodayArticles: API error", err.error?.message);
    throw new Error(err.error?.message ?? "获取文章失败");
  }

  return data.data.articles;
}
