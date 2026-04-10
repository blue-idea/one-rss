import { describe, expect, it } from "vitest";

import {
  MAX_FONT_SCALE,
  getArticleCardAccessibilityLabel,
  getBookmarkAccessibilityLabel,
  getContrastRatio,
  isWcagAaCompliant,
} from "@/utils/accessibility";

describe("accessibility helpers", () => {
  it("uses 200% as the shared font scaling cap", () => {
    expect(MAX_FONT_SCALE).toBe(2);
  });

  it("computes WCAG AA contrast ratios for core theme tokens", () => {
    expect(isWcagAaCompliant("#1a1c1e", "#f9f9fc")).toBe(true);
    expect(isWcagAaCompliant("#414755", "#ffffff")).toBe(true);
    expect(isWcagAaCompliant("#0058bc", "#f9f9fc")).toBe(true);
    expect(getContrastRatio("#000000", "#ffffff")).toBe(21);
  });

  it("builds descriptive screen reader labels", () => {
    expect(
      getBookmarkAccessibilityLabel("无障碍实践", false),
    ).toBe("收藏《无障碍实践》");
    expect(
      getBookmarkAccessibilityLabel("无障碍实践", true),
    ).toBe("取消收藏《无障碍实践》");
    expect(
      getArticleCardAccessibilityLabel("动态字体指南", "设计周刊", "8 分钟阅读"),
    ).toBe("动态字体指南，来源 设计周刊，8 分钟阅读");
  });
});
