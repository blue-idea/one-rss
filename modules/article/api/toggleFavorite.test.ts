import { describe, it, expect } from "vitest";

import { parseToggleFavoriteResponse } from "./toggleFavorite";

// 需求3.5 - 收藏状态切换
describe("parseToggleFavoriteResponse", () => {
  // 需求3.5: 当用户点击收藏按钮时，OneRss 应更新文章收藏状态并在书架中可见。
  it("parses favorited status as true", () => {
    const body = {
      success: true,
      data: { is_favorited: true },
    };
    const result = parseToggleFavoriteResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isFavorited).toBe(true);
    }
  });

  // 需求3.5: 验证取消收藏状态
  it("parses favorited status as false", () => {
    const body = {
      success: true,
      data: { is_favorited: false },
    };
    const result = parseToggleFavoriteResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isFavorited).toBe(false);
    }
  });

  // 需求4.5: 书架中的收藏文章应显示正确的收藏状态
  it("parses favorited status with camelCase", () => {
    const body = {
      success: true,
      data: { isFavorited: true },
    };
    const result = parseToggleFavoriteResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isFavorited).toBe(true);
    }
  });

  // 需求4.5: 验证默认收藏状态为 false
  it("defaults to false when is_favorited is missing", () => {
    const body = {
      success: true,
      data: {},
    };
    const result = parseToggleFavoriteResponse(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isFavorited).toBe(false);
    }
  });

  // 需求5.2: 收藏状态变更应通知用户成功或失败
  it("parses error response with code and message", () => {
    const body = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Please sign in to favorite articles.",
      },
    };
    const result = parseToggleFavoriteResponse(body) as {
      ok: false;
      code: string;
      message: string;
    };
    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNAUTHORIZED");
    expect(result.message).toBe("Please sign in to favorite articles.");
  });

  // 需求5.2: 验证无效响应处理
  it("returns error for invalid input", () => {
    expect(parseToggleFavoriteResponse(null).ok).toBe(false);
    expect(parseToggleFavoriteResponse(undefined).ok).toBe(false);
    expect(parseToggleFavoriteResponse({}).ok).toBe(false);
  });

  // 需求5.2: 验证缺少 error 字段时的默认错误信息
  it("handles error without message", () => {
    const body = {
      success: false,
      error: {
        code: "ERROR_CODE",
      },
    };
    const result = parseToggleFavoriteResponse(body) as {
      ok: false;
      code: string;
      message: string;
    };
    expect(result.ok).toBe(false);
    expect(result.code).toBe("ERROR_CODE");
    expect(result.message).toBe("Request failed.");
  });
});
