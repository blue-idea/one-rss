import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { StatePanel } from "@/components/ui/state-panel";
import {
  Colors,
  Elevation,
  Fonts,
  Radii,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useBookmarks } from "@/contexts/bookmark-context";
import {
  usePreferences,
  type ReaderFontSize,
  type ReaderLineHeight,
  type ReaderTheme,
} from "@/contexts/preference-context";
import { fetchArticle, type Article } from "@/modules/article/api/fetchArticle";
import { updateReadingProgress } from "@/modules/article/api/updateReadingProgress";

const readerThemes = {
  light: {
    background: Colors.light.background,
    text: Colors.light.onSurface,
    secondary: Colors.light.onSurfaceVariant,
    accent: Colors.light.primary,
    surface: Colors.light.surfaceContainerLow,
    surfaceHigh: Colors.light.surfaceContainerHighest,
    border: Colors.light.outlineVariant,
  },
  dark: {
    background: Colors.dark.surface,
    text: Colors.dark.onSurface,
    secondary: Colors.dark.onSurfaceVariant,
    accent: Colors.dark.primary,
    surface: Colors.dark.surfaceContainerLow,
    surfaceHigh: Colors.dark.surfaceContainerHighest,
    border: Colors.dark.outlineVariant,
  },
  deep: {
    background: "#10151d",
    text: "#d7dde7",
    secondary: "#98a2b3",
    accent: "#7db7ff",
    surface: "#17202c",
    surfaceHigh: "#233041",
    border: "#2d3a4c",
  },
} satisfies Record<
  ReaderTheme,
  {
    background: string;
    text: string;
    secondary: string;
    accent: string;
    surface: string;
    surfaceHigh: string;
    border: string;
  }
>;

const fontSizes: ReaderFontSize[] = [14, 16, 18, 20, 22, 24, 26, 28];
const lineHeights: ReaderLineHeight[] = [1.4, 1.5, 1.6, 1.8, 2.0];

const themeLabels: Record<ReaderTheme, string> = {
  light: "日间",
  dark: "夜间",
  deep: "深邃",
};

export default function ReadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; feedId?: string }>();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const {
    readerTheme,
    readerFontSize,
    readerLineHeight,
    setReaderTheme,
    setReaderFontSize,
    setReaderLineHeight,
  } = usePreferences();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(
    params.id ? isBookmarked(params.id) : false,
  );
  const [scrollProgress, setScrollProgress] = useState(0);

  const theme = readerThemes[readerTheme];

  const loadArticle = useCallback(async () => {
    if (!params.id) {
      setError("缺少文章标识，无法打开内容。");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchArticle(params.id);
      setArticle(data);
    } catch (err) {
      console.error("Failed to fetch article:", err);
      setError("文章加载失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  const reportProgress = useCallback(
    async (progress: number) => {
      if (!params.id) return;
      try {
        await updateReadingProgress({ articleId: params.id, progress });
      } catch (err) {
        console.log("Failed to report progress:", err);
      }
    },
    [params.id],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      if (scrollableHeight <= 0) return;

      const progress = Math.min(
        Math.round((contentOffset.y / scrollableHeight) * 100),
        100,
      );
      setScrollProgress(progress);
      if (progress % 10 === 0 || progress === 100) {
        void reportProgress(progress);
      }
    },
    [reportProgress],
  );

  const handleBookmarkToggle = useCallback(() => {
    if (!params.id) return;
    toggleBookmark(params.id);
    setLocalBookmarked((prev) => !prev);
  }, [params.id, toggleBookmark]);

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.feed.title}\n\n${article.summary?.substring(0, 100) ?? ""}...`,
        url: params.id ? `one-rss://article/${params.id}` : undefined,
      });
    } catch {
      Alert.alert("无法分享", "请尝试通过系统分享菜单手动分享这篇文章。", [
        { text: "确定" },
      ]);
    }
  };

  const contentParagraphs = useMemo(() => {
    if (!article?.content) return [];
    return article.content.split(/\n+/).filter((p) => p.trim());
  }, [article?.content]);

  const formattedDate = article
    ? new Date(article.publishedAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const readTime = article?.readTimeMinutes
    ? `${article.readTimeMinutes}分钟阅读`
    : "";

  const metaText =
    formattedDate && readTime
      ? `发布于 ${formattedDate} • ${readTime}`
      : formattedDate || readTime || "";

  const displayBookmarked = params.id ? localBookmarked : false;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
    },
    topBar: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 20,
      paddingBottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
    },
    topAction: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
    },
    topCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
      marginHorizontal: Spacing.md,
    },
    topCenterIcon: {
      width: 34,
      height: 34,
      borderRadius: Radii.md,
      backgroundColor: theme.surfaceHigh,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      ...Typography.label,
      color: theme.text,
      flex: 1,
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: 144,
      gap: Spacing.lg,
    },
    articleShell: {
      borderRadius: Radii.xl,
      backgroundColor: theme.surface,
      padding: Spacing.xl,
      ...Elevation.card,
      shadowColor: "#000000",
    },
    metaPanel: {
      borderRadius: Radii.lg,
      backgroundColor: theme.surfaceHigh,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    headerMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    sourceIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    sourceBlock: {
      flex: 1,
    },
    sourceName: {
      ...Typography.micro,
      color: theme.accent,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    sourceMeta: {
      ...Typography.body,
      color: theme.secondary,
    },
    articleTitle: {
      fontFamily: Fonts?.serif,
      fontSize: readerFontSize + 16,
      lineHeight: Math.round(readerFontSize * readerLineHeight + 20),
      fontWeight: "700",
      color: theme.text,
      marginBottom: Spacing.lg,
    },
    summaryText: {
      fontFamily: Fonts?.serif,
      fontSize: readerFontSize + 1,
      lineHeight: Math.round((readerFontSize + 1) * readerLineHeight),
      color: theme.secondary,
      marginBottom: Spacing.xl,
    },
    paragraph: {
      fontFamily: Fonts?.serif,
      fontSize: readerFontSize,
      lineHeight: Math.round(readerFontSize * readerLineHeight),
      color: theme.text,
      marginBottom: Math.round(readerFontSize * readerLineHeight),
    },
    readerToolbarWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 18,
      borderRadius: Radii.pill,
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.border,
      ...Elevation.floating,
      shadowColor: "#000000",
    },
    toolbarGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toolButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    toolLabel: {
      ...Typography.micro,
      color: theme.secondary,
      marginTop: 1,
    },
    speakButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.accent}22`,
    },
    speakLabel: {
      ...Typography.micro,
      color: theme.accent,
      marginTop: 1,
    },
    progressTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 4,
      backgroundColor: theme.surfaceHigh,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "flex-end",
    },
    panelContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
    },
    panelTitle: {
      ...Typography.sectionTitle,
      color: theme.text,
      marginBottom: Spacing.lg,
      textAlign: "center",
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
    },
    optionItem: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radii.lg,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    optionItemActive: {
      borderColor: theme.accent,
      backgroundColor: `${theme.accent}18`,
    },
    optionText: {
      ...Typography.body,
      color: theme.text,
    },
    optionTextActive: {
      color: theme.accent,
      fontWeight: "600",
    },
    sliderContainer: {
      marginBottom: Spacing.lg,
    },
    sliderLabel: {
      ...Typography.bodyStrong,
      color: theme.secondary,
      marginBottom: Spacing.sm,
    },
    sliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    sliderButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceHigh,
      justifyContent: "center",
      alignItems: "center",
    },
    sliderValue: {
      ...Typography.cardTitle,
      color: theme.text,
      minWidth: 60,
      textAlign: "center",
    },
    currentValue: {
      ...Typography.micro,
      color: theme.accent,
      marginTop: Spacing.xs,
      textAlign: "center",
    },
  });

  const progressFillStyle = {
    width: `${scrollProgress}%` as const,
    height: "100%" as const,
    backgroundColor: theme.accent,
  };

  const renderThemePanel = () => (
    <Modal
      visible={showThemePanel}
      transparent
      animationType="slide"
      onRequestClose={() => setShowThemePanel(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowThemePanel(false)}
      >
        <Pressable
          style={styles.panelContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.panelTitle}>选择阅读主题</Text>
          <View style={styles.optionGrid}>
            {(["light", "dark", "deep"] as ReaderTheme[]).map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionItem,
                  readerTheme === value && styles.optionItemActive,
                ]}
                onPress={() => {
                  void setReaderTheme(value);
                  setShowThemePanel(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    readerTheme === value && styles.optionTextActive,
                  ]}
                >
                  {themeLabels[value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderFontPanel = () => (
    <Modal
      visible={showFontPanel}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFontPanel(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowFontPanel(false)}
      >
        <Pressable
          style={styles.panelContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.panelTitle}>阅读设置</Text>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>字体大小</Text>
            <View style={styles.sliderRow}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => {
                  const index = fontSizes.indexOf(readerFontSize);
                  if (index > 0) {
                    void setReaderFontSize(fontSizes[index - 1]);
                  }
                }}
              >
                <MaterialIcons name="remove" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.sliderValue}>{readerFontSize}</Text>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => {
                  const index = fontSizes.indexOf(readerFontSize);
                  if (index < fontSizes.length - 1) {
                    void setReaderFontSize(fontSizes[index + 1]);
                  }
                }}
              >
                <MaterialIcons name="add" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.currentValue}>当前: {readerFontSize}px</Text>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>行高</Text>
            <View style={styles.optionGrid}>
              {lineHeights.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionItem,
                    readerLineHeight === value && styles.optionItemActive,
                  ]}
                  onPress={() => void setReaderLineHeight(value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      readerLineHeight === value && styles.optionTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <StatePanel
          compact
          icon="hourglass-top"
          title="正在载入文章"
          message="正文、摘要和阅读元信息正在同步。"
        />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.loadingWrap}>
        <StatePanel
          icon="wifi-off"
          tone="error"
          title="无法打开文章"
          message={error || "内容暂时不可用，请稍后再试。"}
          actionLabel="重新加载"
          onAction={() => void loadArticle()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topAction}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.topCenterIcon}>
            <MaterialIcons name="auto-stories" size={16} color={theme.accent} />
          </View>
          <Text style={styles.topTitle} numberOfLines={1}>
            {article.feed.title}
          </Text>
        </View>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topAction}
            onPress={handleBookmarkToggle}
          >
            <MaterialIcons
              name={displayBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={displayBookmarked ? theme.accent : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topAction} onPress={handleShare}>
            <MaterialIcons name="share" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        <View style={styles.content}>
          <View style={styles.articleShell}>
            <View style={styles.metaPanel}>
              <View style={styles.headerMetaRow}>
                <View style={styles.sourceIconWrap}>
                  <MaterialIcons
                    name="newspaper"
                    size={18}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.sourceBlock}>
                  <Text style={styles.sourceName}>{article.feed.title}</Text>
                  <Text style={styles.sourceMeta}>{metaText}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.articleTitle}>{article.title}</Text>
            {article.summary ? (
              <Text style={styles.summaryText}>{article.summary}</Text>
            ) : null}
            {contentParagraphs.map((paragraph, index) => (
              <Text
                key={`${index}-${paragraph.slice(0, 12)}`}
                style={styles.paragraph}
              >
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.readerToolbarWrap}>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowThemePanel(true)}
          >
            <MaterialIcons name="palette" size={22} color={theme.secondary} />
            <Text style={styles.toolLabel}>主题</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowFontPanel(true)}
          >
            <MaterialIcons
              name="format-size"
              size={22}
              color={theme.secondary}
            />
            <Text style={styles.toolLabel}>字体</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.speakButton}>
          <MaterialIcons name="volume-up" size={24} color={theme.accent} />
          <Text style={styles.speakLabel}>朗读</Text>
        </TouchableOpacity>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="translate" size={22} color={theme.secondary} />
            <Text style={styles.toolLabel}>翻译</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="more-vert" size={22} color={theme.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={progressFillStyle} />
      </View>

      {renderThemePanel()}
      {renderFontPanel()}
    </View>
  );
}
