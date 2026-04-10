import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import {
  FEED_DIRECTORY_PAGE_SIZE,
  fetchFeedDirectory,
  getFeedCategories,
  type FeedCategory,
  type FeedDirectoryItem,
} from "@/modules/discovery/repository/feed-directory";
import {
  buildFeedDirectoryRouteParams,
  parseFeedDirectoryRouteState,
} from "@/modules/discovery/repository/feed-directory-route-state";

const allCategory: FeedCategory = {
  slug: "all",
  title: "全部",
  sort: 0,
  feedCount: 0,
};

function getInitials(title: string): string {
  return title
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ExploreScreen() {
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string | string[];
    q?: string | string[];
    page?: string | string[];
  }>();
  const categories = [allCategory, ...getFeedCategories()];
  const routeState = parseFeedDirectoryRouteState(
    params,
    categories.map((category) => category.slug),
  );
  const [selectedCategory, setSelectedCategory] = useState(
    routeState.categorySlug,
  );
  const [searchQuery, setSearchQuery] = useState(routeState.keyword);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [items, setItems] = useState<FeedDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [page, setPage] = useState(routeState.page);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const totalFeedCount = categories
    .filter((category) => category.slug !== "all")
    .reduce((sum, category) => sum + category.feedCount, 0);
  const activeCategory =
    categories.find((category) => category.slug === selectedCategory) ??
    allCategory;
  const normalizedKeyword = deferredSearchQuery.trim();

  useEffect(() => {
    setSelectedCategory(routeState.categorySlug);
    setSearchQuery(routeState.keyword);
    setPage(routeState.page);
  }, [routeState.categorySlug, routeState.keyword, routeState.page]);

  useEffect(() => {
    router.setParams({
      category: undefined,
      q: undefined,
      page: undefined,
      ...buildFeedDirectoryRouteParams({
        categorySlug: selectedCategory,
        keyword: searchQuery,
        page,
      }),
    });
  }, [page, router, searchQuery, selectedCategory]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const firstResponse = await fetchFeedDirectory({
        categorySlug: selectedCategory,
        keyword: normalizedKeyword,
        page: 1,
        pageSize: FEED_DIRECTORY_PAGE_SIZE,
      });

      if (cancelled) {
        return;
      }

      const safePage = Math.min(page, firstResponse.totalPages);
      const mergedItems = [...firstResponse.items];
      let lastResponse = firstResponse;

      for (let currentPage = 2; currentPage <= safePage; currentPage += 1) {
        const nextResponse = await fetchFeedDirectory({
          categorySlug: selectedCategory,
          keyword: normalizedKeyword,
          page: currentPage,
          pageSize: FEED_DIRECTORY_PAGE_SIZE,
        });

        if (cancelled) {
          return;
        }

        mergedItems.push(...nextResponse.items);
        lastResponse = nextResponse;
      }

      if (safePage !== page) {
        setPage(safePage);
      }

      setItems(mergedItems);
      setTotal(lastResponse.total);
      setTotalPages(lastResponse.totalPages);
      setDisplayedCount(Math.min(mergedItems.length, lastResponse.total));
      setHasMore(safePage < lastResponse.totalPages);
      setIsLoading(false);
      setIsLoadingMore(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [normalizedKeyword, page, selectedCategory]);

  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  };

  const handleCategoryPress = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 120,
    },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      marginBottom: Spacing.lg,
    },
    searchContainer: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerHighest,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 56,
      marginBottom: Spacing.md,
    },
    searchIconWrap: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      paddingVertical: 0,
      paddingRight: 88,
    },
    addButton: {
      position: "absolute",
      right: 8,
      top: 8,
      bottom: 8,
      borderRadius: 9,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.md,
      justifyContent: "center",
      alignItems: "center",
    },
    addButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    summaryCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      gap: Spacing.xs,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    summaryText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurfaceVariant,
    },
    summaryHighlight: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    categoriesContainer: {
      marginBottom: Spacing.lg,
    },
    categoryScroll: {
      paddingRight: Spacing.xs,
    },
    categoryTag: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      marginRight: Spacing.sm,
      backgroundColor: colors.surfaceContainerHigh,
    },
    categoryTagActive: {
      backgroundColor: colors.primary,
    },
    categoryText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontWeight: "600",
    },
    categoryTextActive: {
      color: colors.onPrimary,
    },
    loadingWrap: {
      paddingVertical: Spacing.xxxl,
      alignItems: "center",
      gap: Spacing.sm,
    },
    loadingText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -Spacing.xs,
    },
    gridItem: {
      width: "50%",
      paddingHorizontal: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.06)",
      padding: Spacing.md,
      minHeight: 224,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.surfaceContainerHigh,
    },
    featuredBadge: {
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
    },
    featuredBadgeText: {
      color: colors.onPrimary,
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: 14,
      backgroundColor: colors.primaryContainer,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    logoText: {
      color: colors.onPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    cardTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: 4,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    cardDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.onSurfaceVariant,
      minHeight: 54,
      marginBottom: Spacing.md,
    },
    metaText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    subscribeBtn: {
      marginTop: "auto",
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 4,
      backgroundColor: colors.surfaceContainerLow,
    },
    subscribeBtnActive: {
      backgroundColor: colors.primary,
    },
    subscribeBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    subscribeBtnTextActive: {
      color: colors.onPrimary,
    },
    emptyState: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 16,
      padding: Spacing.xl,
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.onSurface,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    loadMoreButton: {
      marginTop: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceContainerLow,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: Spacing.sm,
    },
    loadMoreText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onSurface,
    },
    menuIcon: {
      color: colors.onSurfaceVariant,
      fontSize: 24,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView
        testID="explore-screen"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>发现源</Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchIconWrap}>
              <MaterialIcons
                name="travel-explore"
                size={20}
                style={styles.menuIcon}
              />
            </View>
            <TextInput
              testID="explore-search-input"
              style={styles.searchInput}
              placeholder="搜索目录关键词"
              placeholderTextColor={`${colors.onSurfaceVariant}99`}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>公开目录</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>状态回显</Text>
            <Text testID="explore-summary-primary" style={styles.summaryText}>
              目录模式：<Text style={styles.summaryHighlight}>公开目录</Text>，
              当前分类：
              <Text style={styles.summaryHighlight}>
                {activeCategory.title}
              </Text>
              ， 关键词：
              <Text style={styles.summaryHighlight}>
                {normalizedKeyword || "未输入"}
              </Text>
              。
            </Text>
            <Text
              testID="explore-summary-pagination"
              style={styles.summaryText}
            >
              已展示
              <Text style={styles.summaryHighlight}> {displayedCount} </Text>/
              <Text style={styles.summaryHighlight}> {total} </Text>
              个订阅源，当前第
              <Text style={styles.summaryHighlight}> {page} </Text>/
              <Text style={styles.summaryHighlight}> {totalPages} </Text>
              页，每页 {FEED_DIRECTORY_PAGE_SIZE} 条。
            </Text>
            <Text testID="explore-summary-remaining" style={styles.summaryText}>
              目录总量
              <Text style={styles.summaryHighlight}> {totalFeedCount} </Text>
              个，当前还剩
              <Text style={styles.summaryHighlight}>
                {" "}
                {Math.max(total - displayedCount, 0)}{" "}
              </Text>
              个结果未加载。
            </Text>
          </View>

          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((category) => {
                const isActive = category.slug === selectedCategory;
                const count =
                  category.slug === "all" ? totalFeedCount : category.feedCount;

                return (
                  <Pressable
                    key={category.slug}
                    testID={`explore-category-${category.slug}`}
                    onPress={() => handleCategoryPress(category.slug)}
                    style={[
                      styles.categoryTag,
                      isActive && styles.categoryTagActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isActive && styles.categoryTextActive,
                      ]}
                    >
                      {category.title} {count}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>正在同步公开目录…</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="search-off"
                size={24}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.emptyTitle}>没有找到匹配结果</Text>
              <Text style={styles.emptyText}>
                当前筛选为 {activeCategory.title} /{" "}
                {normalizedKeyword || "未输入"}
                。试试切换分类，或改搜名称、分类、站点网址。
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {items.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    <View style={styles.card}>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.badge,
                            item.isFeatured && styles.featuredBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              item.isFeatured && styles.featuredBadgeText,
                            ]}
                          >
                            {item.isFeatured ? "精选" : item.categoryTitle}
                          </Text>
                        </View>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.subscribed ? "已订阅" : "可订阅"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.logoWrap}>
                        <Text style={styles.logoText}>
                          {getInitials(item.title)}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDescription}>
                        {item.description}
                      </Text>
                      <Text style={styles.metaText}>{item.categoryTitle}</Text>
                      <Text style={styles.metaText}>
                        {item.language.toUpperCase()}
                      </Text>

                      <View
                        style={[
                          styles.subscribeBtn,
                          item.subscribed && styles.subscribeBtnActive,
                        ]}
                      >
                        <MaterialIcons
                          name={item.subscribed ? "check" : "rss-feed"}
                          size={16}
                          color={
                            item.subscribed ? colors.onPrimary : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.subscribeBtnText,
                            item.subscribed && styles.subscribeBtnTextActive,
                          ]}
                        >
                          {item.subscribed ? "已订阅" : "查看源"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {hasMore && (
                <Pressable
                  testID="explore-load-more"
                  onPress={handleLoadMore}
                  style={styles.loadMoreButton}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons
                      name="expand-more"
                      size={18}
                      color={colors.onSurface}
                    />
                  )}
                  <Text style={styles.loadMoreText}>
                    {isLoadingMore ? "加载中…" : "加载更多"}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
