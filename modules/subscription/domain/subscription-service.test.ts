import { describe, expect, it } from "vitest";

import {
  createInitialSubscriptionState,
  getShelfFeeds,
  importFeedByUrl,
  subscribeToFeed,
  unsubscribeFromFeed,
} from "@/modules/subscription/domain/subscription-service";

describe("subscription-service", () => {
  it("imports a valid rss url and subscribes to it", () => {
    const initialState = createInitialSubscriptionState();

    const result = importFeedByUrl(
      initialState,
      "https://design.example.com/feed.xml",
    );

    expect(result.changed).toBe(true);
    expect(result.notice.kind).toBe("success");
    expect(result.notice.message).toBe("已导入并订阅 Design。");
    expect(result.feed?.name).toBe("Design");
    expect(result.state.subscribedFeedIds).toContain(result.feed?.id);
  });

  it("keeps repeated rss imports idempotent", () => {
    const initialState = createInitialSubscriptionState();

    const first = importFeedByUrl(
      initialState,
      "https://design.example.com/feed.xml",
    );
    const second = importFeedByUrl(
      first.state,
      "https://design.example.com/feed.xml#duplicate",
    );

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(second.notice.message).toBe("Design 已在订阅列表中。");
    expect(
      second.state.feeds.filter(
        (feed) => feed.url === "https://design.example.com/feed.xml",
      ),
    ).toHaveLength(1);
  });

  it("keeps subscribe and unsubscribe idempotent", () => {
    const initialState = createInitialSubscriptionState();

    const duplicateSubscribe = subscribeToFeed(initialState, "techcrunch");
    expect(duplicateSubscribe.changed).toBe(false);
    expect(duplicateSubscribe.notice.message).toBe(
      "TechCrunch 已在订阅列表中。",
    );

    const firstUnsubscribe = unsubscribeFromFeed(initialState, "techcrunch");
    expect(firstUnsubscribe.changed).toBe(true);
    expect(firstUnsubscribe.state.subscribedFeedIds).not.toContain("techcrunch");

    const duplicateUnsubscribe = unsubscribeFromFeed(
      firstUnsubscribe.state,
      "techcrunch",
    );
    expect(duplicateUnsubscribe.changed).toBe(false);
    expect(duplicateUnsubscribe.notice.message).toBe(
      "TechCrunch 已处于未订阅状态。",
    );
  });

  it("returns explicit reasons for invalid rss imports", () => {
    const initialState = createInitialSubscriptionState();

    const unreachable = importFeedByUrl(
      initialState,
      "https://timeout.example.com/feed.xml",
    );
    expect(unreachable.reason).toBe("network_error");
    expect(unreachable.notice.message).toBe(
      "订阅地址暂时无法访问，请检查网络后重试。",
    );

    const invalidFeed = importFeedByUrl(
      initialState,
      "https://example.com/post/123",
    );
    expect(invalidFeed.reason).toBe("invalid_feed");
    expect(invalidFeed.notice.message).toBe(
      "该地址未返回可识别的 RSS/Atom 订阅源。",
    );

    const invalidUrl = importFeedByUrl(initialState, "not-a-url");
    expect(invalidUrl.reason).toBe("invalid_url");
    expect(invalidUrl.notice.message).toBe(
      "请输入有效的 RSS 地址（需以 http/https 开头）。",
    );
  });

  it("projects subscribed feeds into shelf data", () => {
    const initialState = createInitialSubscriptionState();

    const imported = importFeedByUrl(
      initialState,
      "https://design.example.com/feed.xml",
    );
    const shelfFeeds = getShelfFeeds(imported.state);

    expect(shelfFeeds.map((feed) => feed.id)).toContain("techcrunch");
    expect(shelfFeeds.map((feed) => feed.id)).toContain(imported.feed?.id);
    expect(
      shelfFeeds.find((feed) => feed.id === imported.feed?.id)?.latestUpdateLabel,
    ).toBe("刚刚更新");
  });
});
