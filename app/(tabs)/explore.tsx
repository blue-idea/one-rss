import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
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
import { useSubscription } from "@/modules/subscription/context/subscription-context";

const categories = ["精选", "科技", "设计", "商业"];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("精选");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    clearNotice,
    discoverableFeeds,
    importByUrl,
    notice,
    toggleSubscription,
  } = useSubscription();
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const filteredSources = useMemo(() => {
    return discoverableFeeds.filter((source) => {
      const matchesCategory =
        selectedCategory === "精选" || source.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        source.name.toLowerCase().includes(q) ||
        source.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [discoverableFeeds, searchQuery, selectedCategory]);

  const handleImport = () => {
    const result = importByUrl(searchQuery);
    if (result.notice.kind === "success") {
      setSearchQuery("");
      setSelectedCategory("精选");
    }
  };

  const handleToggleSubscription = (feedId: string, subscribed: boolean) => {
    toggleSubscription(feedId, subscribed);
  };

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
    noticeBox: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      backgroundColor:
        notice?.kind === "error" ? colors.errorContainer : "#dff3e5",
    },
    noticeText: {
      color: notice?.kind === "error" ? colors.onErrorContainer : "#14532d",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
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
      minHeight: 214,
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
      marginBottom: Spacing.sm,
    },
    cardMeta: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.onSurfaceVariant,
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
    emptyState: {
      width: "100%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderStyle: "dashed",
      padding: Spacing.xl,
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
    },
    emptyTitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.xs,
    },
    emptyText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView showsVerticalScrollIndicator={false}>
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
                onChangeText={(value) => {
                  setSearchQuery(value);
                  if (notice) {
                    clearNotice();
                  }
                }}
                testID="explore-search-input"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleImport}
                testID="explore-add-button"
              >
                <Text style={styles.addButtonText}>添加订阅</Text>
              </TouchableOpacity>
            </View>
            {notice ? (
              <View style={styles.noticeBox} testID="explore-notice">
                <Text style={styles.noticeText}>{notice.message}</Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((category) => (
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

          <View style={styles.grid}>
            {filteredSources.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>没有匹配的订阅源</Text>
                <Text style={styles.emptyText}>
                  试试搜索其他关键词，或输入完整 RSS 地址后点击“添加订阅”。
                </Text>
              </View>
            ) : null}

            {filteredSources.map((source) => (
              <View key={source.id} style={styles.gridItem}>
                <View style={styles.card}>
                  <View style={styles.logoWrap}>
                    <Image
                      source={{ uri: source.logo }}
                      style={styles.logo}
                      contentFit="cover"
                    />
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {source.name}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {source.description}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {source.subscribed ? "已订阅" : source.category}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.subscribeBtn,
                      source.subscribed && styles.subscribeBtnActive,
                    ]}
                    onPress={() =>
                      handleToggleSubscription(source.id, source.subscribed)
                    }
                    accessibilityLabel={`${source.subscribed ? "取消订阅" : "订阅"} ${source.name}`}
                  >
                    <MaterialIcons
                      name={source.subscribed ? "check" : "add"}
                      size={16}
                      color={
                        source.subscribed ? colors.onPrimary : colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.subscribeBtnText,
                        source.subscribed && styles.subscribeBtnTextActive,
                      ]}
                    >
                      {source.subscribed ? "取消订阅" : "订阅"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
