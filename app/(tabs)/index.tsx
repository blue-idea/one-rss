import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  fetchTodayArticles,
  type Article,
  type TimeRange,
} from "@/modules/today/api/fetchTodayArticles";

const TIMELINE_TABS: { key: TimeRange; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "yesterday", label: "昨天" },
  { key: "week", label: "本周" },
];

function formatRelativeTime(text: string): string {
  return text;
}

export default function TodayScreen() {
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async (range: TimeRange) => {
    try {
      setError(null);
      const data = await fetchTodayArticles({ timeRange: range });
      setArticles(data);
    } catch (err) {
      console.error("loadArticles: failed", err);
      setError("加载失败，请稍后重试");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadArticles(timeRange);
  }, [timeRange, loadArticles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(timeRange);
  }, [timeRange, loadArticles]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const handleArticlePress = useCallback((article: Article) => {
    router.push({
      pathname: "/read",
      params: { articleId: article.id },
    });
  }, []);

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
    sortDropdown: {
      position: "absolute",
      top: 40,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 100,
      minWidth: 120,
    },
    sortOption: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    sortOptionText: {
      fontSize: 14,
      color: colors.onSurface,
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
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    emptyText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      textAlign: "center",
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
          <Text style={styles.timeText}>
            {formatRelativeTime(article.time)}
          </Text>
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
        <Text style={styles.timeText}>{formatRelativeTime(article.time)}</Text>
      </View>
    );
  };

  const renderBottomRow = (article: Article) => {
    return (
      <View style={styles.bottomRow}>
        <View style={styles.sourceInfo}>
          {article.sourceBadge && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>{article.sourceBadge}</Text>
            </View>
          )}
          <Text style={styles.sourceName}>{article.source}</Text>
        </View>
        <TouchableOpacity style={styles.bookmarkButton} onPress={() => {}}>
          <MaterialIcons
            name="bookmark-border"
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View testID="screen-today" style={styles.container}>
      <Header title="今日摘要" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.tabsSection}>
            <View style={styles.tabsRow}>
              {TIMELINE_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.timelineTabButton,
                    timeRange === tab.key && styles.timelineTabActive,
                  ]}
                  onPress={() => handleTimeRangeChange(tab.key)}
                >
                  <Text
                    style={[
                      styles.timelineTabText,
                      timeRange === tab.key && styles.timelineTabTextActive,
                    ]}
                  >
                    {tab.label}
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

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : articles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无文章</Text>
            </View>
          ) : (
            <View style={styles.articleList}>
              {articles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleItem}
                  onPress={() => handleArticlePress(article)}
                  activeOpacity={0.7}
                >
                  {renderArticleMeta(article)}
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleSummary} numberOfLines={5}>
                    {article.summary}
                  </Text>
                  {renderBottomRow(article)}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="edit-note" size={26} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
