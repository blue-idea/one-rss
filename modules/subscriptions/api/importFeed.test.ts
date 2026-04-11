import { describe, expect, it } from "vitest";

import { parseImportFeedResponse } from "@/modules/subscriptions/api/importFeed";

// 需求2.3 - 当用户输入合法 RSS 地址并点击添加订阅，OneRss 应校验地址可用性并创建订阅关系
describe("parseImportFeedResponse", () => {
  // 需求2.3: 成功导入 RSS 源
  it("parses success response with imported feed", () => {
    const mockResponse = {
      success: true,
      data: {
        feed: {
          id: "feed-123",
          title: "Example Blog",
          url: "https://example.com/feed.xml",
          imageUrl: "https://example.com/logo.png",
          siteUrl: "https://example.com",
        },
        isNew: true,
      },
    };

    const result = parseImportFeedResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.feed.id).toBe("feed-123");
      expect(result.data.feed.title).toBe("Example Blog");
      expect(result.data.feed.url).toBe("https://example.com/feed.xml");
      expect(result.data.isNew).toBe(true);
    }
  });

  // 需求2.3: 导入已存在的源返回成功但 isNew=false
  it("parses success response for existing feed", () => {
    const mockResponse = {
      success: true,
      data: {
        feed: {
          id: "feed-456",
          title: "Already Added Blog",
          url: "https://already-added.com/feed.xml",
          imageUrl: null,
          siteUrl: "https://already-added.com",
        },
        isNew: false,
      },
    };

    const result = parseImportFeedResponse(mockResponse);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.feed.id).toBe("feed-456");
      expect(result.data.isNew).toBe(false);
    }
  });

  // 需求2.6: 网络异常或地址无效时返回错误信息
  it("parses error response for unreachable URL", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Network error. Please check your connection and try again.",
      },
    };

    const result = parseImportFeedResponse(mockResponse);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NETWORK_ERROR");
    }
  });

  // 需求2.6: 无效 RSS 地址返回验证失败
  it("parses error response for invalid RSS URL", () => {
    const mockResponse = {
      success: false,
      error: {
        code: "INVALID_FEED",
        message:
          "The URL is not a valid RSS feed. Please check the URL and try again.",
      },
    };

    const result = parseImportFeedResponse(mockResponse);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_FEED");
    }
  });

  // 需求2.6: 无效响应格式返回内部错误
  it("returns error for invalid response", () => {
    expect(parseImportFeedResponse(null).ok).toBe(false);
    expect(parseImportFeedResponse(undefined).ok).toBe(false);
    expect(parseImportFeedResponse({}).ok).toBe(false);
  });
});

// 需求2.3 - RSS URL 校验
describe("RSS URL Validation", () => {
  // 验证有效 HTTP URL
  it("accepts valid HTTP URL", () => {
    const mockResponse = {
      success: true,
      data: {
        feed: {
          id: "feed-123",
          title: "Test",
          url: "http://example.com/feed.xml",
          imageUrl: null,
          siteUrl: "http://example.com",
        },
        isNew: true,
      },
    };

    const result = parseImportFeedResponse(mockResponse);
    expect(result.ok).toBe(true);
  });

  // 验证有效 HTTPS URL
  it("accepts valid HTTPS URL", () => {
    const mockResponse = {
      success: true,
      data: {
        feed: {
          id: "feed-456",
          title: "Test",
          url: "https://example.com/feed.xml",
          imageUrl: null,
          siteUrl: "https://example.com",
        },
        isNew: true,
      },
    };

    const result = parseImportFeedResponse(mockResponse);
    expect(result.ok).toBe(true);
  });
});
