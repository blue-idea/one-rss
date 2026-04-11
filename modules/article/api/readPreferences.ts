/**
 * 阅读偏好持久化 API
 * 支持字体大小、主题、行高切换并持久化
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@one_rss_read_preferences";

export type ThemeMode = "light" | "dark" | "system";

export type FontSize = "small" | "medium" | "large";

export type LineHeight = "compact" | "normal" | "relaxed";

export type ReadPreferences = {
  fontSize: FontSize;
  theme: ThemeMode;
  lineHeight: LineHeight;
};

const DEFAULT_PREFERENCES: ReadPreferences = {
  fontSize: "medium",
  theme: "system",
  lineHeight: "normal",
};

const FONT_SIZE_VALUES: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

const LINE_HEIGHT_VALUES: Record<LineHeight, number> = {
  compact: 1.2,
  normal: 1.5,
  relaxed: 1.8,
};

export type ReadPreferencesResponse =
  | { ok: true; data: ReadPreferences }
  | { ok: false; code: string; message: string };

/**
 * 获取阅读偏好设置
 */
export async function getReadPreferences(): Promise<ReadPreferences> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(stored) as Partial<ReadPreferences>;
    return {
      fontSize: parsed.fontSize ?? DEFAULT_PREFERENCES.fontSize,
      theme: parsed.theme ?? DEFAULT_PREFERENCES.theme,
      lineHeight: parsed.lineHeight ?? DEFAULT_PREFERENCES.lineHeight,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * 保存阅读偏好设置
 */
export async function saveReadPreferences(
  preferences: Partial<ReadPreferences>,
): Promise<void> {
  const current = await getReadPreferences();
  const updated: ReadPreferences = {
    ...current,
    ...preferences,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * 获取字体大小数值（px）
 */
export function getFontSizeValue(fontSize: FontSize): number {
  return FONT_SIZE_VALUES[fontSize] ?? 16;
}

/**
 * 获取行高数值
 */
export function getLineHeightValue(lineHeight: LineHeight): number {
  return LINE_HEIGHT_VALUES[lineHeight] ?? 1.5;
}

/**
 * 重置偏好为默认值
 */
export async function resetReadPreferences(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
