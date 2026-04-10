import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

type ArticleResponse = {
  id: string;
  title: string;
  summary: string;
  content: string | null;
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
  isRead: boolean;
  isFavorited: boolean;
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

function notFoundError(): Response {
  return json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Article not found.",
      },
      meta: meta(),
    },
    404,
    corsHeaders,
  );
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

  // Create client with service key
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
  const articleId = url.searchParams.get("id");

  if (!articleId) {
    return json(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Article ID is required.",
        },
        meta: meta(),
      },
      400,
      corsHeaders,
    );
  }

  // Query article by ID, ensuring user has subscription to the feed
  const { data: article, error: articleError } = await supabase
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
      is_read,
      is_favorited,
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
    .eq("articles.id", articleId)
    .single();

  if (articleError) {
    console.error("get-article: query failed", articleError);
    if (articleError.code === "PGRST116") {
      return notFoundError();
    }
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch article.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  // Transform to response format
  const articleResponse: ArticleResponse = {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    sourceUrl: article.source_url,
    publishedAt: article.published_at,
    readTimeMinutes: article.read_time_minutes,
    feed: {
      id: article.feed_id,
      title: article.feeds.title,
      imageUrl: article.feeds.image_url,
      siteUrl: article.feeds.site_url,
      isFeatured: article.feeds.is_featured,
    },
    isRead: article.is_read,
    isFavorited: article.is_favorited,
  };

  return json(
    {
      success: true,
      data: articleResponse,
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});