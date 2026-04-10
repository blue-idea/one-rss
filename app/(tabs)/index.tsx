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
  fetchCuratedArticles,
  type CuratedArticle,
} from "@/modules/curated/api/fetchCuratedArticles";
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

const todayArticles: Article[] = [
  {
    id: "1",
    source: "建筑评论",
    time: "阅读时间 12 分钟",
    title: "沉默的建筑师：设计没有视觉噪音的城市",
    summary:
      "在持续连接的时代，新一代城市设计师正在优先考虑“宁静权”。本文探讨声学景观设计如何影响心理健康，并分析减少视觉干扰对生活质量的提升。",
    featured: true,
    sourceBadge: "ARC",
  },
  {
    id: "2",
    source: "纽约时报",
    time: "2小时前",
    title: "全球经济：向再生金融模式的转型",
    summary:
      "全球投资机构开始放弃季度增长，转而关注未来 50 年的生态系统稳定性。再生金融不仅是道德选择，也正在成为新的风险管理框架。",
    actionLabel: "阅读全文",
  },
  {
    id: "3",
    source: "TechCrunch",
    time: "4小时前",
    title: "超越硅基：首台碳纳米管计算机上线",
    summary:
      "新型计算架构实现更高性能和更低功耗，标志着计算科学进入新阶段，并有望从底层改写 AI 训练与边缘计算的硬件版图。",
    tags: ["基础研究", "量子物理"],
  },
  {
    id: "4",
    source: "Dezeen",
    time: "5小时前",
    title: "粗野主义的伦理：为什么原始混凝土正在现代回归",
    summary:
      "新一代建筑师将粗野主义重新定义为可持续方案，通过材料寿命与结构诚实性回应“一次性设计”文化，探索更长期的建筑价值。",
  },
  {
    id: "5",
    source: "大西洋月刊",
    time: "8小时前",
    title: "慢读革命：深度专注的抗争",
    summary:
      "在碎片化信息流中，深度阅读正在成为稀缺能力。研究表明，长篇阅读不仅提升认知连接能力，也帮助我们重新夺回注意力主权。",
    showDeepTag: true,
  },
];

export default function TodayScreen() {
  const router = useRouter();
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const [selectedTab, setSelectedTab] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [curatedArticles, setCuratedArticles] = useState<CuratedArticle[]>([]);
  const [isLoadingCurated, setIsLoadingCurated] = useState(false);

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

  // Helper to transform CuratedArticle to Article
  const transformToArticle = (curated: CuratedArticle): Article => ({
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
    selectedTab === 3 ? curatedArticles.map(transformToArticle) : todayArticles;

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
            {isLoadingCurated ? (
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
