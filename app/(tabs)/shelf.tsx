import { useMemo, useState } from "react";
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
import { useSubscription } from "@/modules/subscription/context/subscription-context";

export default function ShelfScreen() {
  const [selectedChip, setSelectedChip] = useState("全部");
  const { shelfFeeds } = useSubscription();
  const router = useRouter();
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const filterChips = useMemo(
    () => ["全部", ...new Set(shelfFeeds.map((feed) => feed.category))],
    [shelfFeeds],
  );
  const visibleFeeds = useMemo(
    () =>
      shelfFeeds.filter(
        (item) => selectedChip === "全部" || item.category === selectedChip,
      ),
    [selectedChip, shelfFeeds],
  );

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
            {filterChips.map((chip) => (
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
              <View key={feed.id} style={styles.row}>
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
                        {feed.latestUpdateLabel}
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
              </View>
            ))}
          </View>

          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="rss-feed" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>发现更多声音</Text>
            <Text style={styles.emptyDesc}>
              寻找并关注世界上最优秀的作家和出版物。
            </Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push("/explore")}
            >
              <Text style={styles.ctaText}>探索目录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
