import { useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import {
  getShelfFeeds,
  type ShelfFeedItem,
} from "@/modules/shelf/getShelfFeeds";

function formatUpdateTime(dateStr: string | null): string {
  if (!dateStr) return "暂无更新";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "刚刚更新";
  if (diffMinutes < 60) return `${diffMinutes}分钟前更新`;
  if (diffHours < 24) return `${diffHours}小时前更新`;
  if (diffDays < 7) return `${diffDays}天前更新`;
  return date.toLocaleDateString("zh-CN");
}

const defaultFeeds: ShelfFeedItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Wallpaper*",
    category: "设计",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvhLCab4T6VKp3d1HHeUdcZuCOEYkXg4uZMuZ_ozua9ztYfAkHAqUDqEkkklSaC11hNLnY9iorx2WXNKVOiya3swzjywG22BuVkUSSdkvn5sEEprbxsc3rPZJWwdG_9oA9hRHjyRR3JYar92YEfzMzCnZ7WCtzCH69LrD0JvqF8Llp8eAtlvtp2LnjPD8raV0LMCKLUIX8FF1wTuV-7ybONB5yeL0vSGavw_opORGn1m39879h11cMRwKGld8pX8oACkGCc3HM37IH",
    unreadCount: 24,
    lastReadAt: null,
    lastArticleAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "The Verge",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoVIR3FYI2p6sXeQTAI6q5TgAkheuzsL8qK_GO_jlsgeXQ2ZbM8fFHNUNd_yLEcoDRF0z5uqaJqXgiwuTmIyA18jjMBmLGKbr2RL0L273fdN3uhtAye_2HtPF57_ggsSuHLUggPipUANGdyR11Cf8mTNUOAX-LWdOd1ZbTbmeM90hKMDhNmrNh42PlMbwO4hivEe-S32J2GUl5nZuiNw5cqnWQoOD4tN0KNktKjLaVBKODutE5eez4SjSyWLyTmGTEOro6LeD_w_nv",
    unreadCount: 156,
    lastReadAt: null,
    lastArticleAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "National Geographic",
    category: "文化",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDA17fSUHKVCk1AkVj6jHJPs_Z0yZxN9x8RlPdyoyHom2JDLbsr_dJ2tXDUv7aHcUAIsoiPsNSKPUvvCmfKNHBsAswpwP3bDLO4keqBS9f6SkloZLh-Gh5jRh9cxhvTSPRRF4QxCgmqYDQLtHCGsL5GhfBtM3KPQcaArlh5Ti2a7vTS4bCovQGclIeox2cFF2Jog8HAceG5oj8eZ6hajdYWiIJygk7oXJuE8umYrsw3jdr-C7C9mUNYP12hlwg6XPY4xNjf947rHjKU",
    unreadCount: 8,
    lastReadAt: null,
    lastArticleAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Architectural Digest",
    category: "建筑",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNNXuL6lSSbJnv8Hay9RUKjrnLGOFcGsXk9XWXUEnySdp9yI-l0P1CpdmmJG9vh0Z1M5slABJaPzuLRRg5UYO-4fVZlpLmnBo-OtZeGkJW5U9HiX98rXBV52-RSRD6fxv0o7Ne2hm9p2WrWSFGlBoMkzg4s_8oJVlwHCMK-GNIYE2GEDrF3iKzIvd1AMlmFRchc9Pc-8rUQiZYeHDeYkHVqoMJntjj1cO4nWnskoWXjr6TAim7vdKpLibwetFhF7aHQl9JC2xm42B0",
    unreadCount: 31,
    lastReadAt: null,
    lastArticleAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Stripe Engineering",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlX4BGUHPmwL65u6fGLiDe6O16S8yAUaYx3NjRyu8fHZ6jNAvHjBymixBQ0DPxfQXI_Iq6bCcR8-nhF0nY4kVQdTYDUbkUHRK_Ip_Kc5Sj13ulrStczCxbU8DQR5YUM6RLOOhW6nuwvXQ8h-_6NlKu-wZ9YtM19ShLTQs30_MPXV0mxPSi1j1W0gva6Ctk-fcPL2uGeJIulLgtVkDAt5kLH_-pBX1RrzOb7kq-zJj7hjZXQjpZIsXnRcgaZa7fLQYbGdnF8GUJX1JY",
    unreadCount: 2,
    lastReadAt: null,
    lastArticleAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
];

export default function ShelfScreen() {
  const router = useRouter();
  const [selectedChip, setSelectedChip] = useState("全部");
  const [feeds, setFeeds] = useState<ShelfFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function loadFeeds() {
      try {
        const data = await getShelfFeeds();
        if (data.feeds.length > 0) {
          setFeeds(data.feeds);
          setHasData(true);
        }
      } catch {
        // Fallback to demo data on error
        setFeeds(defaultFeeds);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeeds();
  }, []);

  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    feeds.forEach((f) => {
      if (f.category) cats.add(f.category);
    });
    return ["全部", ...Array.from(cats).sort()];
  }, [feeds]);

  const visibleFeeds = useMemo(
    () =>
      feeds.filter(
        (item) => selectedChip === "全部" || item.category === selectedChip,
      ),
    [feeds, selectedChip],
  );

  // const handleFeedPress = (feedId: string) => {
  //   router.push(`/feed/${feedId}`);
  // };

  const handleFeedPress = (_feedId: string) => {
    // TODO: Task 15 - 书架源详情页
  };

  const handleExplorePress = () => {
    router.push("/(tabs)/explore");
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
    listWrap: {
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    row: {
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    feedTitle: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.xs,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="The Curator" />
        <View style={styles.content}>
          <Text style={styles.heroTitle}>书架</Text>
          <Text style={styles.heroSubTitle}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heroTitle}>书架</Text>
          <Text style={styles.heroSubTitle}>您收藏的数字之声。</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {categories.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[
                  styles.chip,
                  selectedChip === chip && styles.chipActive,
                ]}
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

          <View style={styles.listWrap}>
            {visibleFeeds.map((feed) => (
              <TouchableOpacity
                key={feed.id}
                style={styles.row}
                onPress={() => handleFeedPress(feed.id)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.logoWrap}>
                    <Image
                      source={{ uri: feed.logo }}
                      style={styles.logo}
                      contentFit="contain"
                    />
                  </View>
                  <View>
                    <Text style={styles.feedTitle} numberOfLines={1}>
                      {feed.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{feed.category}</Text>
                      </View>
                      <Text style={styles.updateText}>
                        {formatUpdateTime(feed.lastArticleAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{feed.unreadCount}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={colors.outlineVariant}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {visibleFeeds.length === 0 && hasData && (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons
                  name="rss-feed"
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>没有订阅</Text>
              <Text style={styles.emptyDesc}>
                还没有订阅任何内容，去发现页探索吧。
              </Text>
              <TouchableOpacity style={styles.cta} onPress={handleExplorePress}>
                <Text style={styles.ctaText}>发现更多</Text>
              </TouchableOpacity>
            </View>
          )}

          {visibleFeeds.length > 0 && (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons
                  name="rss-feed"
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>发现更多声音</Text>
              <Text style={styles.emptyDesc}>
                寻找并关注世界上最优秀的作家和出版物。
              </Text>
              <TouchableOpacity style={styles.cta} onPress={handleExplorePress}>
                <Text style={styles.ctaText}>探索目录</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
