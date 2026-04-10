import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchTodayArticles,
  type TimeRange,
  type TodayArticle,
} from "@/modules/today/api/fetchTodayArticles";
import { fetchCuratedArticles, type CuratedArticle } from "@/modules/curated/api/fetchCuratedArticles";
import { useBookmarks } from "@/contexts/bookmark-context";

type Article = {
  id: string;
  source: string;
  time: string;
  title: string;
  summary: string;
  featured?: boolean;
  sourceBadge?: string;
  tags?: string[];
  actionLabel?: string;
  showDeepTag?: boolean;
  isBookmarked?: boolean;
};

const timelineTabs = ["今日", "昨天", "本周", "精选推荐"];

// 时间范围 tab 索引到 TimeRange 的映射
const tabIndexToTimeRange: (TimeRange | null)[] = [
  "today",
  "yesterday",
  "week",
  null, // 精选推荐不使用时间范围
];

// 格式化相对时间
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

export default function TodayScreen() {
  const router = useRouter();
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const [selectedTab, setSelectedTab] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [todayArticles, setTodayArticles] = useState<TodayArticle[]>([]);
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [curatedArticles, setCuratedArticles] = useState<CuratedArticle[]>([]);
  const [isLoadingCurated, setIsLoadingCurated] = useState(false);

  // 获取今日文章数据
  useEffect(() => {
    const timeRange = tabIndexToTimeRange[selectedTab];
    if (timeRange) {
      setIsLoadingToday(true);
      fetchTodayArticles({ timeRange })
        .then((articles) => {
          setTodayArticles(articles);
        })
        .catch((err) => {
          console.error("Failed to fetch today articles:", err);
        })
        .finally(() => {
          setIsLoadingToday(false);
        });
    }
  }, [selectedTab]);

  // 获取精选推荐数据
  useEffect(() => {
    if (selectedTab === 3) {
      // 精选推荐 tab
      setIsLoadingCurated(true);
      fetchCuratedArticles()
        .then((articles) => {
          setCuratedArticles(articles);
        })
        .catch((err) => {
          console.error("Failed to fetch curated articles:", err);
        })
        .finally(() => {
          setIsLoadingCurated(false);
        });
    }
  }, [selectedTab]);

  // Helper: 将 TodayArticle 转换为 Article 格式（用于时间范围过滤）
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

// Helper: 将 CuratedArticle 转换为 Article 格式（用于精选推荐）
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

  const handleBookmarkToggle = (articleId: string) => {
    toggleBookmark(articleId);
  };

  const checkBookmark = (articleId: string) => isBookmarked(articleId);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 132,
    },
    tabsSection: {
      marginTop: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
      paddingBottom: Spacing.sm,
    },
    tabsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    timelineTabButton: {
      marginRight: Spacing.xl,
      paddingBottom: Spacing.sm,
    },
    timelineTabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    timelineTabText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: "500",
    },
    timelineTabTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    divider: {
      width: 1,
      height: 16,
      marginRight: Spacing.md,
      backgroundColor: colors.outlineVariant,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    sortIcon: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    sortText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: "500",
    },
    articleList: {
      marginTop: Spacing.md,
    },
    articleItem: {
      paddingVertical: 26,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    articleMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    metaIcon: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    featuredIcon: {
      color: colors.primary,
    },
    sourceUpper: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    timeText: {
      marginLeft: "auto",
      fontSize: 10,
      color: colors.onSurfaceVariant,
    },
    articleTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      marginBottom: Spacing.md,
    },
    articleSummary: {
      fontSize: 16,
      lineHeight: 28,
      color: colors.onSurfaceVariant,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      marginBottom: Spacing.lg,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sourceInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    sourceBadge: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLow,
      justifyContent: "center",
      alignItems: "center",
    },
    sourceBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
    },
    sourceName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.onSurfaceVariant,
    },
    actionText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    tagsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    tag: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      textTransform: "uppercase",
    },
    deepTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    deepTagText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    bookmarkButton: {
      padding: Spacing.xs,
    },
    fab: {
      position: "absolute",
      right: Spacing.xl,
      bottom: 108,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
  });

  const renderArticleMeta = (article: Article) => {
    if (article.featured) {
      return (
        <View style={styles.articleMetaRow}>
          <MaterialIcons name="star" size={14} color={colors.primary} />
          <Text style={styles.sourceUpper}>精选推荐</Text>
          <Text style={styles.timeText}>{article.time}</Text>
        </View>
      );
    }

    return (
      <View style={styles.articleMetaRow}>
        <MaterialIcons
          name="article"
          size={14}
          color={colors.onSurfaceVariant}
        />
        <Text style={styles.sourceUpper}>{article.source}</Text>
        <Text style={styles.timeText}>{article.time}</Text>
      </View>
    );
  };

  const renderBottomRow = (article: Article, bookmarked: boolean) => {
    const handleBookmarkPress = () => {
      handleBookmarkToggle(article.id);
    };
    if (article.featured) {
      return (
        <View style={styles.bottomRow}>
          <View style={styles.sourceInfo}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {article.sourceBadge ?? "ARC"}
              </Text>
            </View>
            <Text style={styles.sourceName}>{article.source}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleBookmarkPress}
          >
            <MaterialIcons
              name={bookmarked ? "bookmark" : "bookmark-border"}
              size={20}
              color={bookmarked ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (article.actionLabel) {
      return (
        <View style={styles.bottomRow}>
          <TouchableOpacity>
            <Text style={styles.actionText}>{article.actionLabel} →</Text>
          </TouchableOpacity>
          <View style={styles.sourceInfo}>
            <TouchableOpacity style={styles.bookmarkButton}>
              <MaterialIcons
                name="ios-share"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={handleBookmarkPress}
            >
              <MaterialIcons
                name={bookmarked ? "bookmark" : "bookmark-border"}
                size={20}
                color={bookmarked ? colors.primary : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (article.tags && article.tags.length > 0) {
      return (
        <View style={styles.bottomRow}>
          <View style={styles.tagsRow}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleBookmarkPress}
          >
            <MaterialIcons
              name={bookmarked ? "bookmark" : "bookmark-border"}
              size={20}
              color={bookmarked ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (article.showDeepTag) {
      return (
        <View style={styles.bottomRow}>
          <View style={styles.deepTag}>
            <MaterialIcons name="verified" size={12} color={colors.primary} />
            <Text style={styles.deepTagText}>深度解析</Text>
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleBookmarkPress}
          >
            <MaterialIcons
              name={bookmarked ? "bookmark" : "bookmark-border"}
              size={20}
              color={bookmarked ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.bottomRow}>
        <View />
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmarkPress}
        >
          <MaterialIcons
            name={bookmarked ? "bookmark" : "bookmark-border"}
            size={20}
            color={bookmarked ? colors.primary : colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View testID="screen-today" style={styles.container}>
      <Header title="今日摘要" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.tabsSection}>
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
              <View style={styles.divider} />
              <TouchableOpacity style={styles.sortButton}>
                <MaterialIcons
                  name="sort"
                  size={14}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.sortText}>排序</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.articleList}>
            {isLoadingCurated || isLoadingToday ? (
              <View style={styles.articleItem}>
                <Text style={styles.articleMetaRow}>加载中...</Text>
              </View>
            ) : (
              currentArticles.map((article) => (
                <Pressable
                  key={article.id}
                  style={styles.articleItem}
                  onPress={() => handleArticlePress(article.id)}
                >
                  {renderArticleMeta(article)}
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleSummary} numberOfLines={5}>
                    {article.summary}
                  </Text>
                  {renderBottomRow(article, checkBookmark(article.id))}
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="edit-note" size={26} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
