import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "zh" | "en" | "fr" | "es" | "de" | "ja" | "ko";

export const INTERFACE_LANGUAGES: { value: Language; label: string }[] = [
  { value: "zh", label: "简体中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

export const TRANSLATION_LANGUAGES: { value: Language; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "法语" },
  { value: "es", label: "西班牙语" },
  { value: "de", label: "德语" },
  { value: "ja", label: "日语" },
  { value: "ko", label: "韩语" },
];

export type ReaderTheme = "light" | "dark" | "deep";

export type ReaderFontSize = 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28;

export type ReaderLineHeight = 1.4 | 1.5 | 1.6 | 1.8 | 2.0;

const PREFERENCE_STORAGE_KEY = "@one_rss_preferences";

interface PreferenceState {
  interfaceLanguage: Language;
  translationLanguage: Language;
  readerTheme: ReaderTheme;
  readerFontSize: ReaderFontSize;
  readerLineHeight: ReaderLineHeight;
}

const DEFAULT_PREFERENCES: PreferenceState = {
  interfaceLanguage: "zh",
  translationLanguage: "en",
  readerTheme: "light",
  readerFontSize: 18,
  readerLineHeight: 1.6,
};

export interface PreferenceContextValue {
  interfaceLanguage: Language;
  translationLanguage: Language;
  readerTheme: ReaderTheme;
  readerFontSize: ReaderFontSize;
  readerLineHeight: ReaderLineHeight;
  setInterfaceLanguage: (lang: Language) => Promise<void>;
  setTranslationLanguage: (lang: Language) => Promise<void>;
  setReaderTheme: (theme: ReaderTheme) => Promise<void>;
  setReaderFontSize: (size: ReaderFontSize) => Promise<void>;
  setReaderLineHeight: (height: ReaderLineHeight) => Promise<void>;
  isLoading: boolean;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<PreferenceState>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PreferenceState>;
          setPreferences({
            interfaceLanguage:
              parsed.interfaceLanguage ?? DEFAULT_PREFERENCES.interfaceLanguage,
            translationLanguage:
              parsed.translationLanguage ??
              DEFAULT_PREFERENCES.translationLanguage,
            readerTheme: parsed.readerTheme ?? DEFAULT_PREFERENCES.readerTheme,
            readerFontSize:
              parsed.readerFontSize ?? DEFAULT_PREFERENCES.readerFontSize,
            readerLineHeight:
              parsed.readerLineHeight ?? DEFAULT_PREFERENCES.readerLineHeight,
          });
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const savePreferences = useCallback((newPrefs: PreferenceState) => {
    AsyncStorage.setItem(
      PREFERENCE_STORAGE_KEY,
      JSON.stringify(newPrefs),
    ).catch((error) => console.error("Failed to save preferences:", error));
  }, []);

  const setInterfaceLanguage = useCallback(
    async (lang: Language) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, interfaceLanguage: lang };
        savePreferences(newPrefs);
        return newPrefs;
      });
    },
    [savePreferences],
  );

  const setTranslationLanguage = useCallback(
    async (lang: Language) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, translationLanguage: lang };
        savePreferences(newPrefs);
        return newPrefs;
      });
    },
    [savePreferences],
  );

  const setReaderTheme = useCallback(
    async (theme: ReaderTheme) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, readerTheme: theme };
        savePreferences(newPrefs);
        return newPrefs;
      });
    },
    [savePreferences],
  );

  const setReaderFontSize = useCallback(
    async (size: ReaderFontSize) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, readerFontSize: size };
        savePreferences(newPrefs);
        return newPrefs;
      });
    },
    [savePreferences],
  );

  const setReaderLineHeight = useCallback(
    async (height: ReaderLineHeight) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, readerLineHeight: height };
        savePreferences(newPrefs);
        return newPrefs;
      });
    },
    [savePreferences],
  );

  const value = useMemo(
    () => ({
      interfaceLanguage: preferences.interfaceLanguage,
      translationLanguage: preferences.translationLanguage,
      readerTheme: preferences.readerTheme,
      readerFontSize: preferences.readerFontSize,
      readerLineHeight: preferences.readerLineHeight,
      setInterfaceLanguage,
      setTranslationLanguage,
      setReaderTheme,
      setReaderFontSize,
      setReaderLineHeight,
      isLoading,
    }),
    [
      preferences,
      setInterfaceLanguage,
      setTranslationLanguage,
      setReaderTheme,
      setReaderFontSize,
      setReaderLineHeight,
      isLoading,
    ],
  );

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferenceProvider");
  }
  return ctx;
}
