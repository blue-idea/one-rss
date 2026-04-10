export type FeedSource = {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  url: string;
};

export type DiscoverableFeed = FeedSource & {
  subscribed: boolean;
};

export type ShelfFeed = FeedSource & {
  unreadCount: number;
  latestUpdateLabel: string;
};

export type SubscriptionState = {
  feeds: FeedSource[];
  subscribedFeedIds: string[];
};

export type SubscriptionNotice = {
  kind: "success" | "error";
  message: string;
};

export type SubscriptionMutationResult = {
  changed: boolean;
  notice: SubscriptionNotice;
  state: SubscriptionState;
  feed?: FeedSource;
  reason?: "invalid_url" | "invalid_feed" | "network_error" | "not_found";
};

const DEFAULT_IMPORTED_LOGO =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=200&q=80";

export const initialFeedCatalog: FeedSource[] = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    description: "最新科技新闻与洞察",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE-ta2S57fKuTKEAeBLvTNL1f1YP7tx8_gqYn4ZOK6cF-MlmWHqg4ePp5vJEy91XnEf5zVk7TA4avOovmNsiZGmeOh_4Utwz364QD9tPXw97wRe6uOaR9tE_d4bpKxsIc6x4JxytkhbK9MWrS3frL30GHpmvdnRc1CA-nxzwQZqalVCNP6QOtzhhyW4zYR2r0J_cijGfARsg6eLOJJ3GWqqZkDvmT7yj-UqGgha6CI4RyG8PMViAh7pRgGlssWetzQnFtwb2Y3lWIE",
    url: "https://techcrunch.com/feed",
  },
  {
    id: "the-verge",
    name: "The Verge",
    description: "科技、科学和文化新闻",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuACNGO6mztpymOfaeA_nrL7ClnVvu3wrSmGhqq_Xvji5S5DufhKZj0hlicllgblQ0w5mUKCFyZqESdc9RaxMNbTeLp0gXxKjxrI7ro2Fkr05J-mlgKG-HeMXNsFpxdxd88NFU0ve3FqUJi5G3Rqut4Rxm1Yc-8LmF4Opvp021Jf2T2HVmTe0KFtbViKCEpT8Y2HrDgaPRvcAvg2XNQDLvwRSTWV3JvU3yKRJR5YEcb1RJQWbENepve8T8G18S6tRof5vPYp0bLyTvHm",
    url: "https://www.theverge.com/rss/index.xml",
  },
  {
    id: "wired",
    name: "Wired",
    description: "前沿科技新闻报道",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJOjJKINC_fwY7mGb0wd7O5FP7-oQ-0hVyEtW23vnN0lBu3L7LiE-hm_mcUPviFgCC9ByanJhyMH8Zsw4Lo9TkxYBxO42Q3kzMnnGvl48VFn-AfSJIU3KxfSRtyFpdn41XWYbHq7ogl6M-mPU-3yx4yNJ9aJOflAU1FKnphccQEJWdmonQ8zkfIA8LZGUhCJMpdoL1kJ6YppdzwXHHyqVAmDBwe4tss-mVcHncYWinsbPGUVm5g0IS0cSwe9xC-4OJCVjBqiLy0o51",
    url: "https://www.wired.com/feed/rss",
  },
  {
    id: "ars-technica",
    name: "Ars Technica",
    description: "深度科技分析",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOUd4Hn9TvUhIGFzCxNDp2KGEDSbWax5KGNsM5uPMMAtW8oCcthhjM2Lxdgibtwsa07orPOUB_AWUEJvpPsBcx0M-lq4Gfq_rTH6xDuW4pGnoIrjHsAXksz-x_tCSz4B3rdpWjZEAKCeYf2XIAynK9jFnH7wZtBre3y1gM8u2t4OWgjjbBG00Pa9pVM8W_ants9xFFG4XUU_jP-EIhaIEs8oxb9dWNYrlgjrFuJRlXdfwgpbjJz4HXuX5HEjaHbBsc9ey0M_prNQdD",
    url: "https://feeds.arstechnica.com/arstechnica/index",
  },
  {
    id: "dezeen",
    name: "Dezeen",
    description: "最具影响力的建筑杂志",
    category: "设计",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuALRuqkmw061d0myJ3L_XRMzUHZIQPLz8DhIouSbsZMpF_Vioel2-hb_HX2WWhLpKjQ0c37ODXkZ-6Fynu6KqjyTThakksmtz9FTXOzWzMoekRSL1gCoOEwsirP7XQrCYiSK0JK8w8Y3YkaGFkjvjQf6Coexoeh2iIvXcCWVC8vy74PbPSRe6uBVhHKuzbpi7I2MVEx0g_LDAKhsm-vLAgXh3WK6SrLNJJUrfoHvElRxjz3xDMrXDl3T-lhGr7fx1vAQUj6_9M0KOv4",
    url: "https://www.dezeen.com/feed",
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    description: "全球金融市场实时新闻",
    category: "商业",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoyEbPUIMFSpJtMdMdldzDqZ_6d6WcoHrYh1Qh8KcswnfeS1YxT5atew-2mPJ68nh2k48vc4wKY7CsoQwiWOLZ09UmT04FtlS-hHN8lYWtR9rLA7xDEIIYDxjduBqi5l3Ny2KPL4ybYz3l-kaF1lFXtlakFaNJEl9IljzaLUDWk_68E786BaDjBAPydLszVYj2Bt1TMRcSjylw10Ll4U_3G6WqZpNopAsMGGrcUSPrNexz7ZAISq-P5SXJdeE10Bxyz3PZohdwc0hA",
    url: "https://feeds.bloomberg.com/markets/news.rss",
  },
];

const initialSubscribedFeedIds = ["techcrunch"];

export function createInitialSubscriptionState(): SubscriptionState {
  return {
    feeds: initialFeedCatalog,
    subscribedFeedIds: initialSubscribedFeedIds,
  };
}

export function getDiscoverableFeeds(
  state: SubscriptionState,
): DiscoverableFeed[] {
  const subscribedSet = new Set(state.subscribedFeedIds);
  return state.feeds.map((feed) => ({
    ...feed,
    subscribed: subscribedSet.has(feed.id),
  }));
}

const shelfMetaByFeedId: Record<
  string,
  { unreadCount: number; latestUpdateLabel: string }
> = {
  techcrunch: { unreadCount: 24, latestUpdateLabel: "12分钟前更新" },
  "the-verge": { unreadCount: 156, latestUpdateLabel: "1小时前更新" },
  wired: { unreadCount: 8, latestUpdateLabel: "4小时前更新" },
  "ars-technica": { unreadCount: 31, latestUpdateLabel: "1天前更新" },
  dezeen: { unreadCount: 12, latestUpdateLabel: "38分钟前更新" },
  bloomberg: { unreadCount: 2, latestUpdateLabel: "3天前更新" },
};

function createShelfMeta(feed: FeedSource) {
  const preset = shelfMetaByFeedId[feed.id];
  if (preset) {
    return preset;
  }

  const unreadSeed =
    feed.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    27;

  return {
    unreadCount: Math.max(1, unreadSeed),
    latestUpdateLabel: "刚刚更新",
  };
}

export function getShelfFeeds(state: SubscriptionState): ShelfFeed[] {
  const subscribedSet = new Set(state.subscribedFeedIds);

  return state.feeds
    .filter((feed) => subscribedSet.has(feed.id))
    .map((feed) => {
      const meta = createShelfMeta(feed);
      return {
        ...feed,
        unreadCount: meta.unreadCount,
        latestUpdateLabel: meta.latestUpdateLabel,
      };
    });
}

function cloneState(state: SubscriptionState): SubscriptionState {
  return {
    feeds: [...state.feeds],
    subscribedFeedIds: [...state.subscribedFeedIds],
  };
}

function normalizeFeedUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.pathname =
    parsed.pathname.length > 1
      ? parsed.pathname.replace(/\/+$/, "") || "/"
      : parsed.pathname;

  return parsed.toString();
}

function titleFromHost(hostname: string): string {
  const primary = hostname.replace(/^www\./, "").split(".")[0] ?? hostname;
  return primary
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferCategory(url: URL): string {
  const hint = `${url.hostname}${url.pathname}`.toLowerCase();
  if (hint.includes("design")) return "设计";
  if (hint.includes("finance") || hint.includes("market")) return "商业";
  return "科技";
}

function createImportedFeed(url: URL): FeedSource {
  const normalized = normalizeFeedUrl(url.toString()) ?? url.toString();
  const name = titleFromHost(url.hostname);
  const slug = normalized
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return {
    id: `imported-${slug}`,
    name,
    description: `${name} 的 RSS 导入源`,
    category: inferCategory(url),
    logo: DEFAULT_IMPORTED_LOGO,
    url: normalized,
  };
}

function resolveImportTarget(
  normalizedUrl: string,
  state: SubscriptionState,
):
  | { ok: true; feed: FeedSource; isExistingFeed: boolean }
  | { ok: false; reason: "invalid_feed" | "network_error"; message: string } {
  const existingFeed = state.feeds.find((feed) => feed.url === normalizedUrl);
  if (existingFeed) {
    return { ok: true, feed: existingFeed, isExistingFeed: true };
  }

  const parsed = new URL(normalizedUrl);
  const urlHint = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  if (
    urlHint.includes("timeout") ||
    urlHint.includes("offline") ||
    urlHint.includes("unreachable")
  ) {
    return {
      ok: false,
      reason: "network_error",
      message: "订阅地址暂时无法访问，请检查网络后重试。",
    };
  }

  if (!/(rss|feed|atom|xml)/i.test(`${parsed.pathname}${parsed.search}`)) {
    return {
      ok: false,
      reason: "invalid_feed",
      message: "该地址未返回可识别的 RSS/Atom 订阅源。",
    };
  }

  return {
    ok: true,
    feed: createImportedFeed(parsed),
    isExistingFeed: false,
  };
}

export function subscribeToFeed(
  state: SubscriptionState,
  feedId: string,
): SubscriptionMutationResult {
  const feed = state.feeds.find((item) => item.id === feedId);
  if (!feed) {
    return {
      changed: false,
      notice: { kind: "error", message: "未找到对应的订阅源。" },
      state,
      reason: "not_found",
    };
  }

  if (state.subscribedFeedIds.includes(feedId)) {
    return {
      changed: false,
      notice: { kind: "success", message: `${feed.name} 已在订阅列表中。` },
      state,
      feed,
    };
  }

  const nextState = cloneState(state);
  nextState.subscribedFeedIds.push(feedId);

  return {
    changed: true,
    notice: { kind: "success", message: `已订阅 ${feed.name}。` },
    state: nextState,
    feed,
  };
}

export function unsubscribeFromFeed(
  state: SubscriptionState,
  feedId: string,
): SubscriptionMutationResult {
  const feed = state.feeds.find((item) => item.id === feedId);
  if (!feed) {
    return {
      changed: false,
      notice: { kind: "error", message: "未找到对应的订阅源。" },
      state,
      reason: "not_found",
    };
  }

  if (!state.subscribedFeedIds.includes(feedId)) {
    return {
      changed: false,
      notice: {
        kind: "success",
        message: `${feed.name} 已处于未订阅状态。`,
      },
      state,
      feed,
    };
  }

  const nextState = cloneState(state);
  nextState.subscribedFeedIds = nextState.subscribedFeedIds.filter(
    (id) => id !== feedId,
  );

  return {
    changed: true,
    notice: { kind: "success", message: `已取消订阅 ${feed.name}。` },
    state: nextState,
    feed,
  };
}

export function importFeedByUrl(
  state: SubscriptionState,
  rawUrl: string,
): SubscriptionMutationResult {
  const normalizedUrl = normalizeFeedUrl(rawUrl);
  if (!normalizedUrl) {
    return {
      changed: false,
      notice: {
        kind: "error",
        message: "请输入有效的 RSS 地址（需以 http/https 开头）。",
      },
      state,
      reason: "invalid_url",
    };
  }

  const resolved = resolveImportTarget(normalizedUrl, state);
  if (!resolved.ok) {
    return {
      changed: false,
      notice: { kind: "error", message: resolved.message },
      state,
      reason: resolved.reason,
    };
  }

  const nextState = cloneState(state);
  const subscribed = nextState.subscribedFeedIds.includes(resolved.feed.id);
  if (!resolved.isExistingFeed) {
    nextState.feeds = [...nextState.feeds, resolved.feed];
  }

  if (subscribed) {
    return {
      changed: !resolved.isExistingFeed,
      notice: {
        kind: "success",
        message: `${resolved.feed.name} 已在订阅列表中。`,
      },
      state: nextState,
      feed: resolved.feed,
    };
  }

  nextState.subscribedFeedIds.push(resolved.feed.id);

  return {
    changed: true,
    notice: {
      kind: "success",
      message: resolved.isExistingFeed
        ? `已订阅 ${resolved.feed.name}。`
        : `已导入并订阅 ${resolved.feed.name}。`,
    },
    state: nextState,
    feed: resolved.feed,
  };
}
