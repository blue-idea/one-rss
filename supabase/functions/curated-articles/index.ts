import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  source_url: string;
  published_at: string;
  read_time_minutes: number | null;
  created_at: string;
  feed_id: string;
  feed_title: string;
  feed_image_url: string | null;
  feed_site_url: string | null;
  is_featured: boolean;
};

type CuratedArticle = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
  readTimeMinutes: number | null;
  feed: {
    id: string;
    title: string;
    imageUrl: string | null;
    siteUrl: string | null;
    isFeatured: boolean;
  };
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

function unauthorizedError(): Response {
  return json(
    {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization token.",
      },
      meta: meta(),
    },
    401,
    corsHeaders,
  );
}

function parsePaginationParams(url: URL): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  return { limit, offset };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Method not allowed.",
        },
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
        error: {
          code: "INTERNAL_ERROR",
          message: "Service misconfiguration.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  // Extract user from authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorizedError();
  }

  const accessToken = authHeader.slice(7);

  // Create client with user's token to get user context
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the token and get user
  const { data: userData, error: authError } = await supabase.auth.getUser(
    accessToken,
  );

  if (authError || !userData.user) {
    return unauthorizedError();
  }

  const userId = userData.user.id;
  const url = new URL(req.url);
  const { limit, offset } = parsePaginationParams(url);

  // Query: user's subscribed articles, ordered by is_featured desc, published_at desc
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      summary,
      content,
      source_url,
      published_at,
      read_time_minutes,
      created_at,
      feed_id,
      feeds!inner (
        id: id,
        title: title,
        image_url: image_url,
        site_url: site_url,
        is_featured: is_featured
      )
    `)
    .innerJoin("subscriptions", "articles.feed_id", "subscriptions.feed_id")
    .eq("subscriptions.user_id", userId)
    .order("feeds.is_featured", { ascending: false })
    .order("articles.published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (articlesError) {
    console.error("curated-articles: query failed", articlesError);
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch articles.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  // Transform to response format
  const curatedArticles: CuratedArticle[] = (articles ?? []).map((row: ArticleRow) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    readTimeMinutes: row.read_time_minutes,
    feed: {
      id: row.feed_id,
      title: row.feeds.title,
      imageUrl: row.feeds.image_url,
      siteUrl: row.feeds.site_url,
      isFeatured: row.feeds.is_featured,
    },
  }));

  return json(
    {
      success: true,
      data: {
        articles: curatedArticles,
        pagination: {
          limit,
          offset,
          hasMore: articles?.length === limit,
        },
      },
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});