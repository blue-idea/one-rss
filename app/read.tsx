import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Spacing } from "@/constants/theme";
import { useBookmarks } from "@/contexts/bookmark-context";
import {
  usePreferences,
  type ReaderTheme,
  type ReaderFontSize,
  type ReaderLineHeight,
} from "@/contexts/preference-context";
import { fetchArticle, type Article } from "@/modules/article/api/fetchArticle";
import { updateReadingProgress } from "@/modules/article/api/updateReadingProgress";
import {
  getBookmarkAccessibilityLabel,
  MAX_FONT_SCALE,
} from "@/utils/accessibility";

// 主题配色
const themeColors = {
  light: {
    background: "#ffffff",
    text: "rgba(26, 28, 30, 0.9)",
    secondary: "rgba(26, 28, 30, 0.7)",
    accent: "#0058bc",
    surface: "#f9f9fc",
    surfaceHigh: "#e8e8ea",
    border: "rgba(193, 198, 215, 0.2)",
  },
  dark: {
    background: "#1a1c1e",
    text: "rgba(226, 226, 229, 0.95)",
    secondary: "rgba(193, 198, 215, 0.7)",
    accent: "#adc6ff",
    surface: "#232528",
    surfaceHigh: "#2d2f32",
    border: "rgba(65, 71, 85, 0.3)",
  },
  deep: {
    background: "#0d1117",
    text: "rgba(148, 163, 184, 0.95)",
    secondary: "rgba(110, 118, 129, 0.7)",
    accent: "#58a6ff",
    surface: "#161b22",
    surfaceHigh: "#21262d",
    border: "rgba(48, 54, 61, 0.4)",
  },
};

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

  // 文章数据
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 偏好面板状态
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);

  // 收藏状态
  const initialBookmarked = params.id ? isBookmarked(params.id) : false;
  const [localBookmarked, setLocalBookmarked] = useState(initialBookmarked);

  // 滚动进度
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef(0);
  const scrollViewHeightRef = useRef(0);

  // 获取文章数据
  useEffect(() => {
    if (!params.id) return;

    setIsLoading(true);
    setError(null);

    fetchArticle(params.id)
      .then((data) => {
        setArticle(data);
      })
      .catch((err) => {
        console.error("Failed to fetch article:", err);
        setError("加载文章失败");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params.id]);

  // 报告阅读进度
  const reportProgress = useCallback(
    async (progress: number) => {
      if (params.id) {
        try {
          await updateReadingProgress({ articleId: params.id, progress });
        } catch (error) {
          console.log("Failed to report progress:", error);
        }
      }
    },
    [params.id],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      if (scrollableHeight > 0) {
        const progress = Math.min(
          Math.round((contentOffset.y / scrollableHeight) * 100),
          100,
        );
        setScrollProgress(progress);
        if (progress % 10 === 0 || progress === 100) {
          reportProgress(progress);
        }
      }
    },
    [reportProgress],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height;
    },
    [],
  );

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      scrollViewHeightRef.current = event.nativeEvent.layout.height;
    },
    [],
  );

  const handleBookmarkToggle = useCallback(() => {
    if (params.id) {
      toggleBookmark(params.id);
      setLocalBookmarked((prev) => !prev);
    }
  }, [params.id, toggleBookmark]);

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.feed.title}\n\n${article.summary?.substring(0, 100) || ""}...`,
        url: params.id ? `one-rss://article/${params.id}` : undefined,
      });
    } catch {
      Alert.alert("无法分享", "请尝试通过系统分享菜单手动分享这篇文章。", [
        { text: "确定" },
      ]);
    }
  };

  const displayBookmarked = params.id ? localBookmarked : false;

  // 根据当前主题获取配色
  const theme = themeColors[readerTheme];

  // 解析正文内容为段落
  const contentParagraphs = useMemo(() => {
    if (!article?.content) return [];
    return article.content.split(/\n+/).filter((p) => p.trim());
  }, [article?.content]);

  // 格式化发布时间
  const formattedDate = article
    ? new Date(article.publishedAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // 格式化阅读时长
  const readTime = article?.readTimeMinutes
    ? `${article.readTimeMinutes}分钟阅读`
    : "";

  const metaText =
    formattedDate && readTime
      ? `发布于 ${formattedDate} • ${readTime}`
      : formattedDate || readTime || "";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: 132,
    },
    topBar: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 20,
      paddingBottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    topAction: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    topCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    topCenterIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.surfaceHigh,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    headerMetaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    sourceIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceHigh,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    sourceBlock: {
      flex: 1,
    },
    sourceName: {
      fontSize: 11,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: theme.accent,
      fontWeight: "700",
    },
    sourceMeta: {
      marginTop: 4,
      fontSize: 11,
      color: theme.secondary,
    },
    articleTitle: {
      fontSize: readerFontSize + 24,
      lineHeight: Math.round(readerFontSize * readerLineHeight + 24),
      fontWeight: "700",
      color: theme.text,
      marginBottom: Spacing.xl,
    },
    summaryText: {
      fontSize: readerFontSize + 2,
      lineHeight: Math.round((readerFontSize + 2) * readerLineHeight),
      color: theme.secondary,
      marginBottom: Spacing.xl,
    },
    paragraph: {
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
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: Spacing.xs,
      flexWrap: "wrap",
    },
    toolbarGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toolButton: {
      minWidth: 48,
      minHeight: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    toolLabel: {
      fontSize: 8,
      fontWeight: "700",
      color: theme.secondary,
      marginTop: 1,
    },
    speakButton: {
      minWidth: 56,
      minHeight: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accent + "20",
    },
    speakLabel: {
      fontSize: 8,
      fontWeight: "700",
      color: theme.accent,
      marginTop: 1,
    },
    progressTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 4,
      backgroundColor: theme.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      fontSize: 16,
      color: theme.secondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
      padding: Spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.secondary,
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    panelContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: "700",
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
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    optionItemActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accent + "15",
    },
    optionText: {
      fontSize: 14,
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
      fontSize: 14,
      color: theme.secondary,
      marginBottom: Spacing.sm,
    },
    sliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    sliderButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 18,
      backgroundColor: theme.surfaceHigh,
      justifyContent: "center",
      alignItems: "center",
    },
    sliderValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      minWidth: 50,
      textAlign: "center",
    },
    currentValue: {
      fontSize: 12,
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

  // 渲染主题选择面板
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
          <Text
            style={styles.panelTitle}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            选择阅读主题
          </Text>
          <View style={styles.optionGrid}>
            {(["light", "dark", "deep"] as ReaderTheme[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.optionItem,
                  readerTheme === t && styles.optionItemActive,
                ]}
                onPress={() => {
                  setReaderTheme(t);
                  setShowThemePanel(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    readerTheme === t && styles.optionTextActive,
                  ]}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {themeLabels[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // 渲染字体设置面板
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
          <Text
            style={styles.panelTitle}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            阅读设置
          </Text>

          {/* 字号设置 */}
          <View style={styles.sliderContainer}>
            <Text
              style={styles.sliderLabel}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              字体大小
            </Text>
            <View style={styles.sliderRow}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => {
                  const idx = fontSizes.indexOf(readerFontSize);
                  if (idx > 0) setReaderFontSize(fontSizes[idx - 1]);
                }}
                accessibilityRole="button"
                accessibilityLabel="减小字体大小"
              >
                <MaterialIcons name="remove" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text
                style={styles.sliderValue}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {readerFontSize}
              </Text>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => {
                  const idx = fontSizes.indexOf(readerFontSize);
                  if (idx < fontSizes.length - 1)
                    setReaderFontSize(fontSizes[idx + 1]);
                }}
                accessibilityRole="button"
                accessibilityLabel="增大字体大小"
              >
                <MaterialIcons name="add" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text
              style={styles.currentValue}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              当前: {readerFontSize}px
            </Text>
          </View>

          {/* 行高设置 */}
          <View style={styles.sliderContainer}>
            <Text
              style={styles.sliderLabel}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              行高
            </Text>
            <View style={styles.optionGrid}>
              {lineHeights.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.optionItem,
                    readerLineHeight === h && styles.optionItemActive,
                  ]}
                  onPress={() => setReaderLineHeight(h)}
                  accessibilityRole="button"
                  accessibilityLabel={`设置行高 ${h}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      readerLineHeight === h && styles.optionTextActive,
                    ]}
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // 加载中状态
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          加载中...
        </Text>
      </View>
    );
  }

  // 错误状态
  if (error || !article) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {error || "无法加载文章"}
        </Text>
        <TouchableOpacity
          style={[styles.topAction, { marginTop: Spacing.lg }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回上一页"
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topAction}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="返回上一页"
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.topCenterIcon}>
            <MaterialIcons name="auto-stories" size={16} color={theme.accent} />
          </View>
          <Text style={styles.topTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {article.feed.title}
          </Text>
        </View>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topAction}
            onPress={handleBookmarkToggle}
            accessibilityRole="button"
            accessibilityLabel={getBookmarkAccessibilityLabel(
              article.title,
              displayBookmarked,
            )}
          >
            <MaterialIcons
              name={displayBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={displayBookmarked ? theme.accent : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topAction}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={`分享《${article.title}》`}
          >
            <MaterialIcons name="share" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 滚动内容区 */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        ref={scrollViewRef}
      >
        <View style={styles.content}>
          {/* 元信息 */}
          <View style={styles.headerMetaRow}>
            <View style={styles.sourceIconWrap}>
              <MaterialIcons name="newspaper" size={18} color={theme.accent} />
            </View>
            <View style={styles.sourceBlock}>
              <Text
                style={styles.sourceName}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {article.feed.title}
              </Text>
              <Text
                style={styles.sourceMeta}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {metaText}
              </Text>
            </View>
          </View>

          {/* 标题 */}
          <Text
            style={styles.articleTitle}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            {article.title}
          </Text>

          {/* 摘要/导语 */}
          {article.summary && (
            <Text
              style={styles.summaryText}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              {article.summary}
            </Text>
          )}

          {/* 正文段落 */}
          {contentParagraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={styles.paragraph}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* 底部工具栏 */}
      <View style={styles.readerToolbarWrap}>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowThemePanel(true)}
            accessibilityRole="button"
            accessibilityLabel="打开阅读主题设置"
          >
            <MaterialIcons name="palette" size={22} color={theme.secondary} />
            <Text
              style={styles.toolLabel}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              主题
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowFontPanel(true)}
            accessibilityRole="button"
            accessibilityLabel="打开字体与行高设置"
          >
            <MaterialIcons
              name="format-size"
              size={22}
              color={theme.secondary}
            />
            <Text
              style={styles.toolLabel}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              字体
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.speakButton}
          accessibilityRole="button"
          accessibilityLabel="朗读文章"
        >
          <MaterialIcons name="volume-up" size={24} color={theme.accent} />
          <Text
            style={styles.speakLabel}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            朗读
          </Text>
        </TouchableOpacity>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity
            style={styles.toolButton}
            accessibilityRole="button"
            accessibilityLabel="翻译文章"
          >
            <MaterialIcons name="translate" size={22} color={theme.secondary} />
            <Text
              style={styles.toolLabel}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              翻译
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            accessibilityRole="button"
            accessibilityLabel="更多操作"
          >
            <MaterialIcons name="more-vert" size={22} color={theme.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 阅读进度条 */}
      <View style={styles.progressTrack}>
        <View style={progressFillStyle} />
      </View>

      {/* 偏好设置面板 */}
      {renderThemePanel()}
      {renderFontPanel()}
    </View>
  );
}
