import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthApiError } from "@/modules/auth/api/authApiError";

function getSupabaseUrl(): string | undefined {
  const direct = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim().replace(/\/+$/, "");
  }

  const send = process.env.EXPO_PUBLIC_AUTH_SEND_CODE_URL;
  if (typeof send !== "string" || send.trim().length === 0) return undefined;
  try {
    const parsed = new URL(send.trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

function getSupabaseAnonKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return typeof key === "string" && key.trim().length > 0
    ? key.trim()
    : undefined;
}

export interface ShelfFeedItem {
  id: string;
  name: string;
  category: string;
  logo: string;
  unreadCount: number;
  lastReadAt: string | null;
  lastArticleAt: string | null;
}

export interface ShelfResponse {
  feeds: ShelfFeedItem[];
  categories: string[];
}

export async function getShelfFeeds(): Promise<ShelfResponse> {
  const supabaseUrl = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!supabaseUrl || !anon) {
    throw new AuthApiError(
      "Auth service is not configured.",
      "NOT_CONFIGURED",
      0,
    );
  }

  let accessToken: string | null;
  try {
    accessToken = await AsyncStorage.getItem("access_token");
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    throw new AuthApiError("User is not authenticated.", "UNAUTHORIZED", 401);
  }

  let res: Response;
  try {
    res = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?select=id,unread_count,last_read_at,feed_id,feeds(id,name,category,logo,last_article_at)`,
      {
        method: "GET",
        headers: {
          apikey: anon,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch {
    throw new AuthApiError(
      "Network error. Please try again.",
      "NETWORK_ERROR",
      0,
    );
  }

  if (!res.ok) {
    throw new AuthApiError(
      "Failed to fetch shelf data.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  if (!Array.isArray(body)) {
    throw new AuthApiError(
      "Invalid response from server.",
      "INTERNAL_ERROR",
      res.status,
    );
  }

  const items = body as Record<string, unknown>[];
  const feeds: ShelfFeedItem[] = items.map((item) => {
    const feed = item.feed_id as Record<string, unknown>;
    return {
      id: typeof feed?.id === "string" ? feed.id : "",
      name: typeof feed?.name === "string" ? feed.name : "",
      category: typeof feed?.category === "string" ? feed.category : "",
      logo: typeof feed?.logo === "string" ? feed.logo : "",
      unreadCount:
        typeof item.unread_count === "number" ? item.unread_count : 0,
      lastReadAt:
        typeof item.last_read_at === "string" ? item.last_read_at : null,
      lastArticleAt:
        typeof feed?.last_article_at === "string" ? feed.last_article_at : null,
    };
  });

  const categoriesSet = new Set<string>();
  feeds.forEach((feed) => {
    if (feed.category) {
      categoriesSet.add(feed.category);
    }
  });

  return {
    feeds,
    categories: Array.from(categoriesSet).sort(),
  };
}
