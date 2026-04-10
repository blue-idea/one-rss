import { useCallback, useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "@/components/header";
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
  fetchCuratedArticles,
  type CuratedArticle,
} from "@/modules/curated/api/fetchCuratedArticles";
import {
  fetchTodayArticles,
  type TimeRange,
  type TodayArticle,
} from "@/modules/today/api/fetchTodayArticles";

type Article = {
  id: string;
  source: string;
  time: string;
  title: string;
  summary: string;
  featured?: boolean;
  sourceBadge?: string;
};

const timelineTabs = ["今日", "昨天", "本周", "精选推荐"] as const;
const tabIndexToTimeRange: (TimeRange | null)[] = [
  "today",
  "yesterday",
  "week",
  null,
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "刚刚";
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return date.toLocaleDateString("zh-CN");
}

const todayToArticle = (today: TodayArticle): Article => ({
  id: today.id,
  source: today.feed.title,
  time: today.readTimeMinutes
    ? `阅读时间 ${today.readTimeMinutes} 分钟`
    : formatRelativeTime(today.publishedAt),
  title: today.title,
  summary: today.summary,
  featured: today.feed.isFeatured,
  sourceBadge: today.feed.title.substring(0, 3).toUpperCase(),
});

const curatedToArticle = (curated: CuratedArticle): Article => ({
  id: curated.id,
  source: curated.feed.title,
  time: curated.readTimeMinutes
    ? `阅读时间 ${curated.readTimeMinutes} 分钟`
    : new Date(curated.publishedAt).toLocaleDateString("zh-CN"),
  title: curated.title,
  summary: curated.summary,
  featured: curated.feed.isFeatured,
  sourceBadge: curated.feed.title.substring(0, 3).toUpperCase(),
});

export default function TodayScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [selectedTab, setSelectedTab] = useState(0);
  const [todayArticles, setTodayArticles] = useState<TodayArticle[]>([]);
  const [curatedArticles, setCuratedArticles] = useState<CuratedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedTab === 3) {
        const data = await fetchCuratedArticles();
        setCuratedArticles(data);
        return;
      }

      const timeRange = tabIndexToTimeRange[selectedTab];
      if (!timeRange) {
        return;
      }

      const data = await fetchTodayArticles({ timeRange });
      setTodayArticles(data);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setError("网络暂时不可用，请重新加载内容。");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const currentArticles =
    selectedTab === 3
      ? curatedArticles.map(curatedToArticle)
      : todayArticles.map(todayToArticle);

  const handleArticlePress = (articleId: string) => {
    router.push({
      pathname: "/read",
      params: { id: articleId },
    } as Href);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 132,
      gap: Spacing.lg,
    },
    heroBlock: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.xl,
    },
    eyebrow: {
      ...Typography.micro,
      color: colors.primary,
      textTransform: "uppercase",
      marginBottom: Spacing.sm,
    },
    title: {
      ...Typography.display,
      color: colors.onSurface,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
    },
    filterBlock: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerHigh,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    tabsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    timelineTabButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: Radii.pill,
      backgroundColor: colors.surfaceContainerLowest,
    },
    timelineTabActive: {
      backgroundColor: colors.primary,
    },
    timelineTabText: {
      ...Typography.label,
      color: colors.onSurfaceVariant,
      fontFamily: Fonts?.sans,
    },
    timelineTabTextActive: {
      color: colors.onPrimary,
    },
    helperRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    helperText: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
      flex: 1,
      marginRight: Spacing.md,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      borderRadius: Radii.pill,
      backgroundColor: colors.surfaceContainerLowest,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    sortText: {
      ...Typography.label,
      color: colors.onSurface,
    },
    articleList: {
      gap: Spacing.md,
    },
    articleItem: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLowest,
      padding: Spacing.xl,
      ...Elevation.card,
    },
    articleMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    sourceUpper: {
      ...Typography.micro,
      color: colors.primary,
      textTransform: "uppercase",
      flex: 1,
    },
    timeText: {
      ...Typography.micro,
      color: colors.onSurfaceVariant,
    },
    articleTitle: {
      ...Typography.title,
      color: colors.onSurface,
      marginBottom: Spacing.md,
    },
    articleSummary: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
      marginBottom: Spacing.lg,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    sourceInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
    },
    sourceBadge: {
      width: 28,
      height: 28,
      borderRadius: Radii.sm,
      backgroundColor: colors.surfaceContainerLow,
      justifyContent: "center",
      alignItems: "center",
    },
    sourceBadgeText: {
      ...Typography.micro,
      color: colors.onSurfaceVariant,
    },
    sourceName: {
      ...Typography.bodyStrong,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    bookmarkButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
    },
    stateWrap: {
      marginTop: Spacing.sm,
    },
    fab: {
      position: "absolute",
      right: Spacing.xl,
      bottom: 108,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      ...Elevation.floating,
    },
  });

  return (
    <View testID="screen-today" style={styles.container}>
      <Header title="今日摘要" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>每日编排</Text>
            <Text style={styles.title}>按节奏阅读今天。</Text>
            <Text style={styles.subtitle}>
              使用统一主题卡片组织文章流，减少线性分隔，强化内容层级。
            </Text>
          </View>

          <View style={styles.filterBlock}>
            <View style={styles.tabsRow}>
              {timelineTabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.timelineTabButton,
                    index === selectedTab && styles.timelineTabActive,
                  ]}
                  onPress={() => setSelectedTab(index)}
                >
                  <Text
                    style={[
                      styles.timelineTabText,
                      index === selectedTab && styles.timelineTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>
                {selectedTab === 3
                  ? "精选推荐按编辑权重与发布时间编排。"
                  : "按发布时间快速切换视角，保留统一阅读密度。"}
              </Text>
              <TouchableOpacity style={styles.sortButton}>
                <MaterialIcons name="sort" size={16} color={colors.onSurface} />
                <Text style={styles.sortText}>最新</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.stateWrap}>
              <StatePanel
                icon="wifi-off"
                tone="error"
                title="加载失败"
                message={error}
                actionLabel="重新加载"
                onAction={() => void loadArticles()}
              />
            </View>
          ) : null}

          {!error && isLoading ? (
            <View style={styles.stateWrap}>
              <StatePanel
                compact
                icon="hourglass-top"
                title="正在整理内容"
                message="文章流正在更新，请稍候。"
              />
            </View>
          ) : null}

          {!error && !isLoading && currentArticles.length === 0 ? (
            <View style={styles.stateWrap}>
              <StatePanel
                icon="library-books"
                title="暂时没有内容"
                message="切换时间范围或稍后再试，新的文章会继续补充进来。"
                actionLabel="重新加载"
                onAction={() => void loadArticles()}
              />
            </View>
          ) : null}

          {!error && !isLoading && currentArticles.length > 0 ? (
            <View style={styles.articleList}>
              {currentArticles.map((article) => {
                const bookmarked = isBookmarked(article.id);
                return (
                  <Pressable
                    key={article.id}
                    style={styles.articleItem}
                    onPress={() => handleArticlePress(article.id)}
                  >
                    <View style={styles.articleMetaRow}>
                      <MaterialIcons
                        name={article.featured ? "star" : "article"}
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.sourceUpper}>
                        {article.featured ? "精选推荐" : article.source}
                      </Text>
                      <Text style={styles.timeText}>{article.time}</Text>
                    </View>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleSummary}>{article.summary}</Text>
                    <View style={styles.bottomRow}>
                      <View style={styles.sourceInfo}>
                        <View style={styles.sourceBadge}>
                          <Text style={styles.sourceBadgeText}>
                            {article.sourceBadge ?? "RSS"}
                          </Text>
                        </View>
                        <Text style={styles.sourceName}>{article.source}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={() => toggleBookmark(article.id)}
                      >
                        <MaterialIcons
                          name={bookmarked ? "bookmark" : "bookmark-border"}
                          size={20}
                          color={
                            bookmarked
                              ? colors.primary
                              : colors.onSurfaceVariant
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="tune" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
