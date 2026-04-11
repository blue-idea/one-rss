import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import { AuthApiError } from "@/modules/auth/api/authApiError";
import {
  fetchFeedCategories,
  fetchFeeds,
  type FeedCategory,
  type FeedSource,
} from "@/modules/explore/api";

const USER_SAFE_EXPLORE_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "NOT_CONFIGURED",
  "SESSION_ERROR",
  "NETWORK_ERROR",
]);

function userFacingExploreError(err: unknown): string {
  if (
    err instanceof AuthApiError &&
    USER_SAFE_EXPLORE_ERROR_CODES.has(err.code)
  ) {
    return err.message;
  }
  return "加载失败，请稍后重试";
}

export default function ExploreScreen() {
  const [categories, setCategories] = useState<FeedCategory[]>([]);
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  // Build display categories list
  const displayCategories = useMemo(() => {
    const categoryTitles = categories.map((c) => c.title);
    return ["全部", ...categoryTitles];
  }, [categories]);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchFeedCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
        // Fall back to empty - UI will still show "全部"
        setCategories([]);
      }
    }
    loadCategories();
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch feeds
  const loadFeeds = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        setError(null);
        if (pageNum === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const currentCategory =
          selectedCategory === "全部" ? undefined : selectedCategory;
        const result = await fetchFeeds({
          categorySlug: currentCategory,
          keyword: debouncedSearch.trim() || undefined,
          page: pageNum,
          pageSize: 20,
        });

        if (append) {
          setFeeds((prev) => [...prev, ...result.feeds]);
        } else {
          setFeeds(result.feeds);
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to load feeds:", err);
        setError(userFacingExploreError(err));
        if (!append) {
          setFeeds([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, debouncedSearch],
  );

  // Initial load and reload on filter change
  useEffect(() => {
    loadFeeds(1, false);
  }, [loadFeeds]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      loadFeeds(page + 1, true);
    }
  }, [isLoadingMore, hasMore, isLoading, page, loadFeeds]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const isNearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
      if (isNearBottom) {
        handleLoadMore();
      }
    },
    [handleLoadMore],
  );

  // Filter feeds by search query (client-side for immediate feedback)
  const filteredFeeds = useMemo(() => {
    if (!debouncedSearch.trim()) return feeds;
    const q = debouncedSearch.trim().toLowerCase();
    return feeds.filter(
      (feed) =>
        feed.title.toLowerCase().includes(q) ||
        (feed.description?.toLowerCase().includes(q) ?? false),
    );
  }, [feeds, debouncedSearch]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 104,
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
      marginBottom: Spacing.xl,
    },
    searchIconWrap: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      paddingVertical: 0,
      paddingRight: 106,
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
    },
    addButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    categoriesContainer: {
      marginBottom: Spacing.xl,
    },
    categoryScroll: {
      paddingRight: Spacing.xs,
    },
    categoryTag: {
      paddingHorizontal: 20,
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
      fontWeight: "500",
    },
    categoryTextActive: {
      color: colors.onPrimary,
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
      minHeight: 198,
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
      overflow: "hidden",
      marginBottom: Spacing.md,
    },
    logo: {
      width: "100%",
      height: "100%",
    },
    cardTitle: {
      fontSize: 20,
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
      minHeight: 38,
      marginBottom: Spacing.md,
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
    menuIcon: {
      color: colors.onSurfaceVariant,
      fontSize: 24,
    },
    categorySection: {
      marginBottom: Spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xxxl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xxxl,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    retryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xxxl,
    },
    emptyText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    loadingMore: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.lg,
      gap: Spacing.sm,
    },
    loadingMoreText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.categorySection}>
            <Text style={styles.title}>发现源</Text>
            <View style={styles.searchContainer}>
              <View style={styles.searchIconWrap}>
                <MaterialIcons name="link" size={20} style={styles.menuIcon} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="添加 RSS 地址或搜索"
                placeholderTextColor={`${colors.onSurfaceVariant}99`}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>添加订阅</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {displayCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTag,
                    selectedCategory === category && styles.categoryTagActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadFeeds(1, false)}
              >
                <Text style={styles.retryButtonText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : filteredFeeds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "没有找到匹配的订阅源"
                  : "暂无订阅源，去发现页探索吧"}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {filteredFeeds.map((source) => (
                  <View key={source.id} style={styles.gridItem}>
                    <View style={styles.card}>
                      <View style={styles.logoWrap}>
                        <Image
                          source={{ uri: source.imageUrl || undefined }}
                          style={styles.logo}
                          contentFit="cover"
                        />
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {source.title}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {source.description}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.subscribeBtn,
                          source.isSubscribed && styles.subscribeBtnActive,
                        ]}
                      >
                        <MaterialIcons
                          name={source.isSubscribed ? "check" : "add"}
                          size={16}
                          color={
                            source.isSubscribed
                              ? colors.onPrimary
                              : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.subscribeBtnText,
                            source.isSubscribed &&
                              styles.subscribeBtnTextActive,
                          ]}
                        >
                          {source.isSubscribed ? "已订阅" : "订阅"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              {isLoadingMore && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingMoreText}>加载更多...</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
