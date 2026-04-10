import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
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

const filterChips = ["全部", "收藏", "设计", "科技", "文化", "建筑", "商业"];

type ShelfFeed = {
  id: string;
  name: string;
  tag: string;
  updateAt: string;
  unread: number;
  logo: string;
};

type BookmarkedArticle = {
  id: string;
  source: string;
  title: string;
  time: string;
};

const shelfFeeds: ShelfFeed[] = [
  {
    id: "1",
    name: "Wallpaper*",
    tag: "设计",
    updateAt: "12分钟前更新",
    unread: 24,
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvhLCab4T6VKp3d1HHeUdcZuCOEYkXg4uZMuZ_ozua9ztYfAkHAqUDqEkkklSaC11hNLnY9iorx2WXNKVOiya3swzjywG22BuVkUSSdkvn5sEEprbxsc3rPZJWwdG_9oA9hRHjyRR3JYar92YEfzMzCnZ7WCtzCH69LrD0JvqF8Llp8eAtlvtp2LnjPD8raV0LMCKLUIX8FF1wTuV-7ybONB5yeL0vSGavw_opORGn1m39879h11cMRwKGld8pX8oACkGCc3HM37IH",
  },
  {
    id: "2",
    name: "The Verge",
    tag: "科技",
    updateAt: "1小时前更新",
    unread: 156,
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoVIR3FYI2p6sXeQTAI6q5TgAkheuzsL8qK_GO_jlsgeXQ2ZbM8fFHNUNd_yLEcoDRF0z5uqaJqXgiwuTmIyA18jjMBmLGKbr2RL0L273fdN3uhtAye_2HtPF57_ggsSuHLUggPipUANGdyR11Cf8mTNUOAX-LWdOd1ZbTbmeM90hKMDhNmrNh42PlMbwO4hivEe-S32J2GUl5nZuiNw5cqnWQoOD4tN0KNktKjLaVBKODutE5eez4SjSyWLyTmGTEOro6LeD_w_nv",
  },
  {
    id: "3",
    name: "National Geographic",
    tag: "文化",
    updateAt: "4小时前更新",
    unread: 8,
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDA17fSUHKVCk1AkVj6jHJPs_Z0yZxN9x8RlPdyoyHom2JDLbsr_dJ2tXDUv7aHcUAIsoiPsNSKPUvvCmfKNHBsAswpwP3bDLO4keqBS9f6SkloZLh-Gh5jRh9cxhvTSPRRF4QxCgmqYDQLtHCGsL5GhfBtM3KPQcaArlh5Ti2a7vTS4bCovQGclIeox2cFF2Jog8HAceG5oj8eZ6hajdYWiIJygk7oXJuE8umYrsw3jdr-C7C9mUNYP12hlwg6XPY4xNjf947rHjKU",
  },
  {
    id: "4",
    name: "Architectural Digest",
    tag: "建筑",
    updateAt: "1天前更新",
    unread: 31,
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNNXuL6lSSbJnv8Hay9RUKjrnLGOFcGsXk9XWXUEnySdp9yI-l0P1CpdmmJG9vh0Z1M5slABJaPzuLRRg5UYO-4fVZlpLmnBo-OtZeGkJW5U9HiX98rXBV52-RSRD6fxv0o7Ne2hm9p2WrWSFGlBoMkzg4s_8oJVlwHCMK-GNIYE2GEDrF3iKzIvd1AMlmFRchc9Pc-8rUQiZYeHDeYkHVqoMJntjj1cO4nWnskoWXjr6TAim7vdKpLibwetFhF7aHQl9JC2xm42B0",
  },
  {
    id: "5",
    name: "Stripe Engineering",
    tag: "科技",
    updateAt: "3天前更新",
    unread: 2,
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlX4BGUHPmwL65u6fGLiDe6O16S8yAUaYx3NjRyu8fHZ6jNAvHjBymixBQ0DPxfQXI_Iq6bCcR8-nhF0nY4kVQdTYDUbkUHRK_Ip_Kc5Sj13ulrStczCxbU8DQR5YUM6RLOOhW6nuwvXQ8h-_6NlKu-wZ9YtM19ShLTQs30_MPXV0mxPSi1j1W0gva6Ctk-fcPL2uGeJIulLgtVkDAt5kLH_-pBX1RrzOb7kq-zJj7hjZXQjpZIsXnRcgaZa7fLQYbGdnF8GUJX1JY",
  },
];

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 25 };

function createStyles(colors: (typeof Colors)["light"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 120,
    },
    heroTitle: {
      fontSize: 44,
      lineHeight: 50,
      fontWeight: "800",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    heroSubTitle: {
      fontSize: 22,
      lineHeight: 28,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      marginBottom: Spacing.xl,
      fontStyle: "italic",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    chipList: {
      paddingBottom: Spacing.sm,
    },
    chip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: Spacing.sm,
      backgroundColor: colors.surfaceContainerHigh,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.onSurfaceVariant,
    },
    chipTextActive: {
      color: colors.onPrimary,
    },
    row: {
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: Spacing.sm,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: Spacing.md,
    },
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      padding: Spacing.sm,
      marginRight: Spacing.lg,
      overflow: "hidden",
    },
    logo: {
      width: "100%",
      height: "100%",
    },
    articleInfo: {
      flex: 1,
    },
    feedTitle: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.xs,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    sourceName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.onSurfaceVariant,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    tag: {
      borderRadius: 4,
      backgroundColor: colors.surfaceContainerHighest,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      fontWeight: "700",
    },
    updateText: {
      fontSize: 12,
      color: `${colors.onSurfaceVariant}AA`,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    unread: {
      minWidth: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor: `${colors.primary}1A`,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    emptyWrap: {
      marginTop: Spacing.xxl,
      borderRadius: 32,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: `${colors.outlineVariant}66`,
      padding: Spacing.xxxl,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyBookmarkWrap: {
      marginTop: Spacing.xl,
      borderRadius: 24,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.xxxl,
      alignItems: "center",
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: 4,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    emptyDesc: {
      textAlign: "center",
      color: colors.onSurfaceVariant,
      fontSize: 18,
      lineHeight: 26,
      marginBottom: Spacing.lg,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    cta: {
      borderRadius: 24,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xxl,
      paddingVertical: 12,
    },
    ctaText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}

type ShelfItem =
  | { type: "feed"; feed: ShelfFeed }
  | { type: "article"; article: BookmarkedArticle };

type ShelfRowProps = {
  item: ShelfItem;
  styles: ReturnType<typeof createStyles>;
  colors: (typeof Colors)["light"];
  shouldLoadImage: boolean;
  onArticlePress: (articleId: string) => void;
  onFeedPress: (feedId: string) => void;
};

const ShelfRow = memo(function ShelfRow({
  item,
  styles,
  colors,
  shouldLoadImage,
  onArticlePress,
  onFeedPress,
}: ShelfRowProps) {
  if (item.type === "article") {
    return (
      <Pressable
        style={styles.row}
        onPress={() => onArticlePress(item.article.id)}
      >
        <View style={styles.rowLeft}>
          <View style={styles.articleInfo}>
            <Text style={styles.feedTitle} numberOfLines={2}>
              {item.article.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.sourceName}>{item.article.source}</Text>
              <Text style={styles.updateText}>{item.article.time}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rowRight}>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.outlineVariant}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.row} onPress={() => onFeedPress(item.feed.id)}>
      <View style={styles.rowLeft}>
        <View style={styles.logoWrap}>
          <LazyImage
            uri={item.feed.logo}
            shouldLoad={shouldLoadImage}
            style={styles.logo}
            contentFit="contain"
            placeholderColor="#ffffff"
          />
        </View>
        <View style={styles.articleInfo}>
          <Text style={styles.feedTitle} numberOfLines={1}>
            {item.feed.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.feed.tag}</Text>
            </View>
            <Text style={styles.updateText}>{item.feed.updateAt}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{item.feed.unread}</Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.outlineVariant}
        />
      </View>
    </Pressable>
  );
});

export default function ShelfScreen() {
  const router = useRouter();
  const [selectedChip, setSelectedChip] = useState("全部");
  const colors = Colors.light;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { bookmarkedIds } = useBookmarks();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const visibleFeeds = useMemo(
    () =>
      shelfFeeds.filter((item) => {
        if (selectedChip === "全部") return true;
        if (selectedChip === "收藏") return false;
        return item.tag === selectedChip;
      }),
    [selectedChip],
  );

  const bookmarkedArticles = useMemo(() => {
    const articles: BookmarkedArticle[] = [
      {
        id: "1",
        source: "建筑评论",
        title: "沉默的建筑师：设计没有视觉噪音的城市",
        time: "阅读时间 12 分钟",
      },
      {
        id: "5",
        source: "大西洋月刊",
        title: "慢读革命：深度专注的抗争",
        time: "8小时前",
      },
    ];
    return articles.filter((article) => bookmarkedIds.has(article.id));
  }, [bookmarkedIds]);

  const showBookmarks = selectedChip === "收藏";
  const listData = useMemo<ShelfItem[]>(
    () =>
      showBookmarks
        ? bookmarkedArticles.map((article) => ({ type: "article", article }))
        : visibleFeeds.map((feed) => ({ type: "feed", feed })),
    [bookmarkedArticles, showBookmarks, visibleFeeds],
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

  const handleFeedPress = useCallback(
    (feedId: string) => {
      router.push({
        pathname: "/read",
        params: { feedId },
      } as Href);
    },
    [router],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds(
        new Set(
          viewableItems
            .map((token) => {
              const item = token.item as ShelfItem | undefined;
              if (!item || item.type !== "feed") return "";
              return item.feed.id;
            })
            .filter((id) => id.length > 0),
        ),
      );
    },
  );

  const renderHeader = useCallback(
    () => (
      <>
        <Text style={styles.heroTitle}>书架</Text>
        <Text style={styles.heroSubTitle}>您收藏的数字之声。</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {filterChips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, selectedChip === chip && styles.chipActive]}
              onPress={() => setSelectedChip(chip)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedChip === chip && styles.chipTextActive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    ),
    [selectedChip, styles],
  );

  const renderFooter = useCallback(
    () => (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons name="rss-feed" size={30} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>发现更多声音</Text>
        <Text style={styles.emptyDesc}>
          寻找并关注世界上最优秀的作家和出版物。
        </Text>
        <TouchableOpacity style={styles.cta}>
          <Text style={styles.ctaText}>探索目录</Text>
        </TouchableOpacity>
      </View>
    ),
    [colors.primary, styles],
  );

  const renderEmpty = useCallback(() => {
    if (!showBookmarks) return null;
    return (
      <View style={styles.emptyBookmarkWrap}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons
            name="bookmark-border"
            size={30}
            color={colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>暂无收藏</Text>
        <Text style={styles.emptyDesc}>
          在今日页或阅读页点击收藏按钮来保存文章。
        </Text>
      </View>
    );
  }, [colors.primary, showBookmarks, styles]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ShelfItem>) => (
      <ShelfRow
        item={item}
        styles={styles}
        colors={colors}
        shouldLoadImage={
          item.type === "feed" ? visibleIds.has(item.feed.id) : false
        }
        onArticlePress={handleArticlePress}
        onFeedPress={handleFeedPress}
      />
    ),
    [colors, handleArticlePress, handleFeedPress, styles, visibleIds],
  );

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <FlatList
        data={listData}
        keyExtractor={(item) =>
          item.type === "feed"
            ? `feed-${item.feed.id}`
            : `article-${item.article.id}`
        }
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />
    </View>
  );
}
