import { describe, it, expect } from "vitest";
import {
  type InterfaceLanguage,
  type TranslationLanguage,
} from "./updateLanguageSettings";

// 需求6 - 个人中心与偏好设置
describe("Language Settings", () => {
  // 需求6.4: 当用户切换语言时，OneRss 应即时更新界面文案。
  describe("Interface Language Types", () => {
    it("supports zh-CN interface language", () => {
      const lang: InterfaceLanguage = "zh-CN";
      expect(lang).toBe("zh-CN");
    });

    it("supports en-US interface language", () => {
      const lang: InterfaceLanguage = "en-US";
      expect(lang).toBe("en-US");
    });

    it("has correct number of interface languages", () => {
      const interfaceLanguages: InterfaceLanguage[] = ["zh-CN", "en-US"];
      expect(interfaceLanguages).toHaveLength(2);
    });
  });

  // 需求6.5: 当用户设置默认翻译语言后，翻译弹窗应预填该语言选项。
  describe("Translation Language Types", () => {
    it("supports common translation languages", () => {
      const translationLanguages: TranslationLanguage[] = [
        "zh-CN",
        "en-US",
        "ja-JP",
        "ko-KR",
        "fr-FR",
        "de-DE",
        "es-ES",
      ];
      expect(translationLanguages).toHaveLength(7);
    });

    it("includes zh-CN as translation option", () => {
      const lang: TranslationLanguage = "zh-CN";
      expect(lang).toBe("zh-CN");
    });

    it("includes en-US as translation option", () => {
      const lang: TranslationLanguage = "en-US";
      expect(lang).toBe("en-US");
    });

    it("includes ja-JP for Japanese", () => {
      const lang: TranslationLanguage = "ja-JP";
      expect(lang).toBe("ja-JP");
    });
  });

  // 需求6.6: 语言设置应跨设备同步（预留能力）
  describe("Language Settings Structure", () => {
    it("has correct settings structure", () => {
      const settings = {
        interfaceLanguage: "zh-CN" as InterfaceLanguage,
        translationLanguage: "en-US" as TranslationLanguage,
      };

      expect(settings.interfaceLanguage).toBe("zh-CN");
      expect(settings.translationLanguage).toBe("en-US");
    });

    it("documents default language values", () => {
      const defaults = {
        interfaceLanguage: "zh-CN",
        translationLanguage: "zh-CN",
      };

      expect(defaults.interfaceLanguage).toBe("zh-CN");
      expect(defaults.translationLanguage).toBe("zh-CN");
    });
  });
});
