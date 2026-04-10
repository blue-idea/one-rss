import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";

import { Header } from "@/components/header";
import { LazyImage } from "@/components/lazy-image";
import { Colors, Spacing } from "@/constants/theme";
import { useBookmarks } from "@/contexts/bookmark-context";
import { createRequestCache } from "@/modules/feed/lib/createRequestCache";
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
  logo?: string | null;
};

const timelineTabs = ["今日", "昨天", "本周", "精选推荐"] as const;
const tabIndexToTimeRange: (TimeRange | null)[] = [
  "today",
  "yesterday",
  "week",
  null,
];
const TODAY_LIST_ESTIMATED_ITEM_HEIGHT = 236;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 25 };

const todayArticlesCache = createRequestCache<TodayArticle[]>((key) =>
  fetchTodayArticles({ timeRange: key as TimeRange }),
);
const curatedArticlesCache = createRequestCache<CuratedArticle[]>((key) =>
  fetchCuratedArticles({ limit: Number(key) || 20 }),
);

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "刚刚";
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
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
  logo: today.feed.logo,
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
  logo: curated.feed.imageUrl,
});

function createStyles(colors: (typeof Colors)["light"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    listContent: {
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
    sortText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: "500",
    },
    loadingWrap: {
      paddingVertical: Spacing.xxl,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    loadingText: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
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
    emptyWrap: {
      paddingVertical: Spacing.xxxl,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
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
      flex: 1,
    },
    sourceBadge: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLow,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    sourceBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
    },
    sourceLogo: {
      width: "100%",
      height: "100%",
    },
    sourceName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.onSurfaceVariant,
      flexShrink: 1,
    },
    bookmarkButton: {
      padding: Spacing.xs,
    },
  });
}

type TodayListItemProps = {
  article: Article;
  colors: (typeof Colors)["light"];
  styles: ReturnType<typeof createStyles>;
  bookmarked: boolean;
  shouldLoadImage: boolean;
  onPress: (articleId: string) => void;
  onToggleBookmark: (articleId: string) => void;
};

const TodayListItem = memo(function TodayListItem({
  article,
  colors,
  styles,
  bookmarked,
  shouldLoadImage,
  onPress,
  onToggleBookmark,
}: TodayListItemProps) {
  return (
    <Pressable style={styles.articleItem} onPress={() => onPress(article.id)}>
      <View style={styles.articleMetaRow}>
        <MaterialIcons
          name={article.featured ? "star" : "article"}
          size={14}
          color={article.featured ? colors.primary : colors.onSurfaceVariant}
        />
        <Text style={styles.sourceUpper}>
          {article.featured ? "精选推荐" : article.source}
        </Text>
        <Text style={styles.timeText}>{article.time}</Text>
      </View>

      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={5}>
        {article.summary}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.sourceInfo}>
          <View style={styles.sourceBadge}>
            {article.logo ? (
              <LazyImage
                uri={article.logo}
                shouldLoad={shouldLoadImage}
                style={styles.sourceLogo}
                contentFit="cover"
                placeholderColor={colors.surfaceContainerLow}
              />
            ) : (
              <Text style={styles.sourceBadgeText}>
                {article.sourceBadge ?? "ARC"}
              </Text>
            )}
          </View>
          <Text style={styles.sourceName}>{article.source}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => onToggleBookmark(article.id)}
        >
          <MaterialIcons
            name={bookmarked ? "bookmark" : "bookmark-border"}
            size={20}
            color={bookmarked ? colors.primary : colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
});

export default function TodayScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedTab, setSelectedTab] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [todayArticles, setTodayArticles] = useState<
    Record<TimeRange, TodayArticle[]>
  >({
    today: todayArticlesCache.peek("today") ?? [],
    yesterday: todayArticlesCache.peek("yesterday") ?? [],
    week: todayArticlesCache.peek("week") ?? [],
  });
  const [curatedArticles, setCuratedArticles] = useState<CuratedArticle[]>(
    curatedArticlesCache.peek("20") ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const requestIdRef = useRef(0);

  const currentTimeRange = tabIndexToTimeRange[selectedTab];

  useEffect(() => {
    let cancelled = false;
    const currentRequestId = ++requestIdRef.current;

    const loadCurrentTab = async () => {
      setIsLoading(true);
      try {
        if (currentTimeRange) {
          const articles = await todayArticlesCache.load(currentTimeRange);
          if (!cancelled && requestIdRef.current === currentRequestId) {
            setTodayArticles((prev) => ({
              ...prev,
              [currentTimeRange]: articles,
            }));
          }
        } else {
          const articles = await curatedArticlesCache.load("20");
          if (!cancelled && requestIdRef.current === currentRequestId) {
            setCuratedArticles(articles);
          }
        }
      } catch (err) {
        console.error("Failed to fetch today feed:", err);
      } finally {
        if (!cancelled && requestIdRef.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    };

    void loadCurrentTab();

    void Promise.allSettled(
      tabIndexToTimeRange
        .filter(
          (value): value is TimeRange =>
            value !== null && value !== currentTimeRange,
        )
        .map(async (timeRange) => {
          const articles = await todayArticlesCache
            .prefetch(timeRange)
            .then(() => todayArticlesCache.peek(timeRange));
          if (!cancelled && articles) {
            setTodayArticles((prev) => ({ ...prev, [timeRange]: articles }));
          }
        }),
    );

    if (selectedTab !== 3) {
      void curatedArticlesCache.prefetch("20").then(() => {
        const articles = curatedArticlesCache.peek("20");
        if (!cancelled && articles) {
          setCuratedArticles(articles);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [currentTimeRange, selectedTab]);

  const currentArticles = useMemo(
    () =>
      currentTimeRange
        ? (todayArticles[currentTimeRange] ?? []).map(todayToArticle)
        : curatedArticles.map(curatedToArticle),
    [curatedArticles, currentTimeRange, todayArticles],
  );

  const handleArticlePress = useCallback(
    (articleId: string) => {
      router.push({
        pathname: "/read",
        params: { id: articleId },
      } as Href);
    },
    [router],
  );

  const handleBookmarkToggle = useCallback(
    (articleId: string) => {
      toggleBookmark(articleId);
    },
    [toggleBookmark],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds(
        new Set(
          viewableItems
            .map((item) => String(item.item?.id ?? ""))
            .filter((id) => id.length > 0),
        ),
      );
    },
  );

  const renderHeader = useCallback(
    () => (
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
    ),
    [colors.onSurfaceVariant, selectedTab, styles],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Article>) => (
      <TodayListItem
        article={item}
        colors={colors}
        styles={styles}
        bookmarked={isBookmarked(item.id)}
        shouldLoadImage={visibleIds.has(item.id)}
        onPress={handleArticlePress}
        onToggleBookmark={handleBookmarkToggle}
      />
    ),
    [
      colors,
      handleArticlePress,
      handleBookmarkToggle,
      isBookmarked,
      styles,
      visibleIds,
    ],
  );

  return (
    <View testID="screen-today" style={styles.container}>
      <Header title="今日摘要" />

      <FlatList
        data={currentArticles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>暂无可展示内容</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={7}
        updateCellsBatchingPeriod={40}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChanged.current}
        getItemLayout={(_data, index) => ({
          length: TODAY_LIST_ESTIMATED_ITEM_HEIGHT,
          offset: TODAY_LIST_ESTIMATED_ITEM_HEIGHT * index,
          index,
        })}
      />

      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="edit-note" size={26} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
