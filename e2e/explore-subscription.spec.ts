import { expect, test } from "@playwright/test";

import {
  createInitialSubscriptionState,
  importFeedByUrl,
  subscribeToFeed,
  unsubscribeFromFeed,
} from "@/modules/subscription/domain/subscription-service";

test("accepts RSS import and keeps subscription toggles consistent", async () => {
  const initialState = createInitialSubscriptionState();

  const imported = importFeedByUrl(
    initialState,
    "https://design.example.com/feed.xml",
  );
  expect(imported.notice.message).toBe("已导入并订阅 Design。");
  expect(imported.feed?.name).toBe("Design");
  expect(imported.state.subscribedFeedIds).toContain(imported.feed?.id);

  const unsubscribed = unsubscribeFromFeed(
    imported.state,
    imported.feed?.id ?? "",
  );
  expect(unsubscribed.notice.message).toBe("已取消订阅 Design。");
  expect(unsubscribed.state.subscribedFeedIds).not.toContain(imported.feed?.id);

  const resubscribed = subscribeToFeed(
    unsubscribed.state,
    imported.feed?.id ?? "",
  );
  expect(resubscribed.notice.message).toBe("已订阅 Design。");
  expect(resubscribed.state.subscribedFeedIds).toContain(imported.feed?.id);
});

test("surfaces explicit reasons when RSS import fails", async () => {
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

test("keeps importing the same RSS url idempotent", async () => {
  const initialState = createInitialSubscriptionState();

  const first = importFeedByUrl(initialState, "https://design.example.com/feed.xml");
  const second = importFeedByUrl(
    first.state,
    "https://design.example.com/feed.xml#duplicate",
  );

  expect(first.changed).toBe(true);
  expect(second.changed).toBe(false);
  expect(second.notice.message).toBe("Design 已在订阅列表中。");
  expect(
    second.state.feeds.filter((feed) => feed.url === "https://design.example.com/feed.xml"),
  ).toHaveLength(1);
});
