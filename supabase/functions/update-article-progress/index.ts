import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApiMeta = { requestId: string; timestamp: string };

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

function validationError(message: string): Response {
  return json(
    {
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message,
      },
      meta: meta(),
    },
    400,
    corsHeaders,
  );
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

  // Create client with service role to bypass RLS for progress updates
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

  // Parse request body
  let body: { article_id: string; progress: number };
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body.");
  }

  const { article_id, progress } = body;

  if (!article_id || typeof article_id !== "string") {
    return validationError("Missing or invalid article_id.");
  }

  if (typeof progress !== "number" || isNaN(progress) || progress < 0 || progress > 100) {
    return validationError("Invalid progress value. Must be 0-100.");
  }

  // Store reading progress in a dedicated table
  // First check if progress record exists
  const { data: existingProgress } = await supabase
    .from("reading_progress")
    .select("progress")
    .eq("user_id", userId)
    .eq("article_id", article_id)
    .single();

  let error: Error | null = null;

  if (existingProgress) {
    // Update existing progress
    const { error: updateError } = await supabase
      .from("reading_progress")
      .update({
        progress: progress,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("article_id", article_id);

    error = updateError;
  } else {
    // Insert new progress record
    const { error: insertError } = await supabase
      .from("reading_progress")
      .insert({
        user_id: userId,
        article_id: article_id,
        progress: progress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    error = insertError;
  }

  if (error) {
    console.error("update-article-progress: failed", error);
    return json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update reading progress.",
        },
        meta: meta(),
      },
      500,
      corsHeaders,
    );
  }

  return json(
    {
      success: true,
      meta: meta(),
    },
    200,
    corsHeaders,
  );
});