/**
 * 语言设置 API
 * 支持界面语言和默认翻译语言设置
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const INTERFACE_LANGUAGE_KEY = "@one_rss_interface_language";
const TRANSLATION_LANGUAGE_KEY = "@one_rss_translation_language";

export type InterfaceLanguage = "zh-CN" | "en-US";

export type TranslationLanguage =
  | "zh-CN"
  | "en-US"
  | "ja-JP"
  | "ko-KR"
  | "fr-FR"
  | "de-DE"
  | "es-ES";

export interface LanguageSettings {
  interfaceLanguage: InterfaceLanguage;
  translationLanguage: TranslationLanguage;
}

const DEFAULT_INTERFACE_LANGUAGE: InterfaceLanguage = "zh-CN";
const DEFAULT_TRANSLATION_LANGUAGE: TranslationLanguage = "zh-CN";

/**
 * 获取语言设置
 */
export async function getLanguageSettings(): Promise<LanguageSettings> {
  try {
    const [interfaceLang, translationLang] = await Promise.all([
      AsyncStorage.getItem(INTERFACE_LANGUAGE_KEY),
      AsyncStorage.getItem(TRANSLATION_LANGUAGE_KEY),
    ]);

    return {
      interfaceLanguage:
        (interfaceLang as InterfaceLanguage) || DEFAULT_INTERFACE_LANGUAGE,
      translationLanguage:
        (translationLang as TranslationLanguage) ||
        DEFAULT_TRANSLATION_LANGUAGE,
    };
  } catch {
    return {
      interfaceLanguage: DEFAULT_INTERFACE_LANGUAGE,
      translationLanguage: DEFAULT_TRANSLATION_LANGUAGE,
    };
  }
}

/**
 * 更新界面语言设置
 */
export async function setInterfaceLanguage(
  language: InterfaceLanguage,
): Promise<void> {
  await AsyncStorage.setItem(INTERFACE_LANGUAGE_KEY, language);
}

/**
 * 更新默认翻译语言设置
 */
export async function setTranslationLanguage(
  language: TranslationLanguage,
): Promise<void> {
  await AsyncStorage.setItem(TRANSLATION_LANGUAGE_KEY, language);
}

/**
 * 重置语言设置为默认值
 */
export async function resetLanguageSettings(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(INTERFACE_LANGUAGE_KEY),
    AsyncStorage.removeItem(TRANSLATION_LANGUAGE_KEY),
  ]);
}
