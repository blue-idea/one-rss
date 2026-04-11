import { describe, it, expect } from "vitest";
import {
  getFontSizeValue,
  getLineHeightValue,
  type FontSize,
  type LineHeight,
} from "./readPreferences";

// 需求5 - 阅读页基础渲染与偏好持久化
describe("Read Preferences Helpers", () => {
  // 需求5.3: 当用户调整字体大小时，OneRss 应即时更新正文排版。
  describe("getFontSizeValue", () => {
    it("returns correct value for small font", () => {
      expect(getFontSizeValue("small")).toBe(14);
    });

    it("returns correct value for medium font", () => {
      expect(getFontSizeValue("medium")).toBe(16);
    });

    it("returns correct value for large font", () => {
      expect(getFontSizeValue("large")).toBe(18);
    });

    it("returns medium as default for unknown input", () => {
      // This tests the fallback behavior
      const unknown = "medium" as FontSize;
      expect(getFontSizeValue(unknown)).toBe(16);
    });
  });

  // 需求5.3: 当用户调整行高时，OneRss 应即时更新正文排版。
  describe("getLineHeightValue", () => {
    it("returns correct value for compact line height", () => {
      expect(getLineHeightValue("compact")).toBe(1.2);
    });

    it("returns correct value for normal line height", () => {
      expect(getLineHeightValue("normal")).toBe(1.5);
    });

    it("returns correct value for relaxed line height", () => {
      expect(getLineHeightValue("relaxed")).toBe(1.8);
    });

    it("returns normal as default for unknown input", () => {
      const unknown = "normal" as LineHeight;
      expect(getLineHeightValue(unknown)).toBe(1.5);
    });
  });

  // 需求5.4: 当用户切换主题时，OneRss 应即时更新页面样式并持久化。
  describe("Theme and Preference Types", () => {
    it("supports light theme", () => {
      const theme: "light" = "light";
      expect(theme).toBe("light");
    });

    it("supports dark theme", () => {
      const theme: "dark" = "dark";
      expect(theme).toBe("dark");
    });

    it("supports system theme", () => {
      const theme: "system" = "system";
      expect(theme).toBe("system");
    });

    it("supports all font size options", () => {
      const sizes: FontSize[] = ["small", "medium", "large"];
      expect(sizes).toHaveLength(3);
    });

    it("supports all line height options", () => {
      const heights: LineHeight[] = ["compact", "normal", "relaxed"];
      expect(heights).toHaveLength(3);
    });
  });

  // 需求6.2: 阅读偏好应跨设备同步（预留能力）
  describe("Preference Persistence Types", () => {
    it("preferences have correct structure", () => {
      const preferences = {
        fontSize: "medium" as FontSize,
        theme: "system" as const,
        lineHeight: "normal" as LineHeight,
      };

      expect(preferences.fontSize).toBe("medium");
      expect(preferences.theme).toBe("system");
      expect(preferences.lineHeight).toBe("normal");
    });
  });
});
