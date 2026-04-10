import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from "react-native";

import { Header } from "@/components/header";
import { LazyImage } from "@/components/lazy-image";
import { Colors, Spacing } from "@/constants/theme";

const categories = ["精选", "科技", "设计", "商业"];

type FeedSource = {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  subscribed?: boolean;
};

const sourceList: FeedSource[] = [
  {
    id: "1",
    name: "TechCrunch",
    description: "最新科技新闻与洞察",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE-ta2S57fKuTKEAeBLvTNL1f1YP7tx8_gqYn4ZOK6cF-MlmWHqg4ePp5vJEy91XnEf5zVk7TA4avOovmNsiZGmeOh_4Utwz364QD9tPXw97wRe6uOaR9tE_d4bpKxsIc6x4JxytkhbK9MWrS3frL30GHpmvdnRc1CA-nxzwQZqalVCNP6QOtzhhyW4zYR2r0J_cijGfARsg6eLOJJ3GWqqZkDvmT7yj-UqGgha6CI4RyG8PMViAh7pRgGlssWetzQnFtwb2Y3lWIE",
    subscribed: true,
  },
  {
    id: "2",
    name: "The Verge",
    description: "科技、科学和文化新闻",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuACNGO6mztpymOfaeA_nrL7ClnVvu3wrSmGhqq_Xvji5S5DufhKZj0hlicllgblQ0w5mUKCFyZqESdc9RaxMNbTeLp0gXxKjxrI7ro2Fkr05J-mlgKG-HeMXNsFpxdxd88NFU0ve3FqUJi5G3Rqut4Rxm1Yc-8LmF4Opvp021Jf2T2HVmTe0KFtbViKCEpT8Y2HrDgaPRvcAvg2XNQDLvwRSTWV3JvU3yKRJR5YEcb1RJQWbENepve8T8G18S6tRof5vPYp0bLyTvHm",
  },
  {
    id: "3",
    name: "Wired",
    description: "前沿科技新闻报道",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJOjJKINC_fwY7mGb0wd7O5FP7-oQ-0hVyEtW23vnN0lBu3L7LiE-hm_mcUPviFgCC9ByanJhyMH8Zsw4Lo9TkxYBxO42Q3kzMnnGvl48VFn-AfSJIU3KxfSRtyFpdn41XWYbHq7ogl6M-mPU-3yx4yNJ9aJOflAU1FKnphccQEJWdmonQ8zkfIA8LZGUhCJMpdoL1kJ6YppdzwXHHyqVAmDBwe4tss-mVcHncYWinsbPGUVm5g0IS0cSwe9xC-4OJCVjBqiLy0o51",
  },
  {
    id: "4",
    name: "Ars Technica",
    description: "深度科技分析",
    category: "科技",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOUd4Hn9TvUhIGFzCxNDp2KGEDSbWax5KGNsM5uPMMAtW8oCcthhjM2Lxdgibtwsa07orPOUB_AWUEJvpPsBcx0M-lq4Gfq_rTH6xDuW4pGnoIrjHsAXksz-x_tCSz4B3rdpWjZEAKCeYf2XIAynK9jFnH7wZtBre3y1gM8u2t4OWgjjbBG00Pa9pVM8W_ants9xFFG4XUU_jP-EIhaIEs8oxb9dWNYrlgjrFuJRlXdfwgpbjJz4HXuX5HEjaHbBsc9ey0M_prNQdD",
  },
  {
    id: "5",
    name: "Dezeen",
    description: "最具影响力的建筑杂志",
    category: "设计",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuALRuqkmw061d0myJ3L_XRMzUHZIQPLz8DhIouSbsZMpF_Vioel2-hb_HX2WWhLpKjQ0c37ODXkZ-6Fynu6KqjyTThakksmtz9FTXOzWzMoekRSL1gCoOEwsirP7XQrCYiSK0JK8w8Y3YkaGFkjvjQf6Coexoeh2iIvXcCWVC8vy74PbPSRe6uBVhHKuzbpi7I2MVEx0g_LDAKhsm-vLAgXh3WK6SrLNJJUrfoHvElRxjz3xDMrXDl3T-lhGr7fx1vAQUj6_9M0KOv4",
  },
  {
    id: "6",
    name: "Bloomberg",
    description: "全球金融市场实时新闻",
    category: "商业",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoyEbPUIMFSpJtMdMdldzDqZ_6d6WcoHrYh1Qh8KcswnfeS1YxT5atew-2mPJ68nh2k48vc4wKY7CsoQwiWOLZ09UmT04FtlS-hHN8lYWtR9rLA7xDEIIYDxjduBqi5l3Ny2KPL4ybYz3l-kaF1lFXtlakFaNJEl9IljzaLUDWk_68E786BaDjBAPydLszVYj2Bt1TMRcSjylw10Ll4U_3G6WqZpNopAsMGGrcUSPrNexz7ZAISq-P5SXJdeE10Bxyz3PZohdwc0hA",
  },
];

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 20 };

function createStyles(colors: (typeof Colors)["light"]) {
  return StyleSheet.create({
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
    gridItem: {
      flex: 1,
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
  });
}

type ExploreCardProps = {
  source: FeedSource;
  styles: ReturnType<typeof createStyles>;
  colors: (typeof Colors)["light"];
  shouldLoadImage: boolean;
};

const ExploreCard = memo(function ExploreCard({
  source,
  styles,
  colors,
  shouldLoadImage,
}: ExploreCardProps) {
  return (
    <View style={styles.gridItem}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <LazyImage
            uri={source.logo}
            shouldLoad={shouldLoadImage}
            style={styles.logo}
            contentFit="cover"
            placeholderColor={colors.surfaceContainerLow}
          />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {source.name}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {source.description}
        </Text>
        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            source.subscribed && styles.subscribeBtnActive,
          ]}
        >
          <MaterialIcons
            name={source.subscribed ? "check" : "add"}
            size={16}
            color={source.subscribed ? colors.onPrimary : colors.primary}
          />
          <Text
            style={[
              styles.subscribeBtnText,
              source.subscribed && styles.subscribeBtnTextActive,
            ]}
          >
            {source.subscribed ? "已订阅" : "订阅"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("精选");
  const [searchQuery, setSearchQuery] = useState("");
  const colors = Colors.light;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const filteredSources = useMemo(() => {
    return sourceList.filter((source) => {
      const matchesCategory =
        selectedCategory === "精选" || source.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        source.name.toLowerCase().includes(q) ||
        source.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

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

        <View style={styles.categoriesContainer}>
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
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    ),
    [colors.onSurfaceVariant, searchQuery, selectedCategory, styles],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedSource>) => (
      <ExploreCard
        source={item}
        styles={styles}
        colors={colors}
        shouldLoadImage={visibleIds.has(item.id)}
      />
    ),
    [colors, styles, visibleIds],
  );

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <FlatList
        data={filteredSources}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        numColumns={2}
        columnWrapperStyle={{ alignItems: "stretch" }}
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
