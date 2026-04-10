import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

type ArticleRow = {
  id: string;
  feed_id: string;
  title: string;
  author: string | null;
  summary: string | null;
  content: string | null;
  source_url: string | null;
  published_at: string | null;
  read_time_minutes: number | null;
  created_at: string;
  feed_title: string | null;
  feed_image_url: string | null;
  feed_site_url: string | null;
  is_featured: boolean;
};

type TodayArticle = {
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

function json(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function meta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins < 1 ? "刚刚" : `${diffMins}分钟前`;
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}

function mapRowToArticle(row: ArticleRow): TodayArticle {
  const readTime = row.read_time_minutes
    ? `阅读时间 ${row.read_time_minutes} 分钟`
    : formatRelativeTime(row.published_at);

  return {
    id: row.id,
    source: row.feed_title ?? "未知来源",
    time: readTime,
    title: row.title,
    summary: row.summary ?? "",
    url: row.source_url ?? "",
    featured: row.is_featured,
    sourceBadge: row.feed_title?.substring(0, 3).toUpperCase(),
    author: row.author ?? undefined,
  };
}

function getDateRange(timeRange: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeRange) {
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      return { start: weekStart, end: today };
    }
    case "today":
    default:
      return { start: today, end: new Date(today.getTime() + 86400000) };
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json(
      {
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Method not allowed." },
        meta: meta(),
      },
      405,
      corsHeaders,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Service misconfiguration." },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  const url = new URL(req.url);
  const timeRange = url.searchParams.get("time") ?? "today";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  if (!["today", "yesterday", "week"].includes(timeRange)) {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid time range. Use: today, yesterday, or week.",
        },
        meta: meta(),
      },
      422,
      corsHeaders,
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { start, end } = getDateRange(timeRange);

  const offset = (page - 1) * limit;
  const { data: articles, error: articlesErr } = await supabase
    .from("articles")
    .select(
      `
      id,
      feed_id,
      title,
      author,
      summary,
      content,
      source_url,
      published_at,
      read_time_minutes,
      created_at,
      feeds:feeds(
        title,
        image_url,
        site_url,
        is_featured
      )
    `,
    )
    .gte("published_at", start.toISOString())
    .lt("published_at", end.toISOString())
    .order("feeds.is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (articlesErr) {
    console.error("today-articles: query failed", articlesErr);
    return json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Database error." },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  const mapped = (articles ?? []).map((row) => {
    const feeds = row.feeds?.[0] as Record<string, unknown> | undefined;
    return {
      id: row.id,
      feed_id: row.feed_id,
      title: row.title,
      author: row.author,
      summary: row.summary,
      content: row.content,
      source_url: row.source_url,
      published_at: row.published_at,
      read_time_minutes: row.read_time_minutes,
      created_at: row.created_at,
      feed_title: feeds?.title ?? null,
      feed_image_url: feeds?.image_url ?? null,
      feed_site_url: feeds?.site_url ?? null,
      is_featured: (feeds?.is_featured as boolean) ?? false,
    } as ArticleRow;
  });

  // Sort: is_featured DESC, published_at DESC (server already sorts, but ensure client-side fallback)
  const sorted = mapped.sort((a, b) => {
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }
    const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bTime - aTime;
  });

  const articleList = sorted.map(mapRowToArticle);

  return json(
    {
      success: true,
      data: {
        articles: articleList,
        pagination: {
          page,
          limit,
          timeRange,
        },
      },
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});
