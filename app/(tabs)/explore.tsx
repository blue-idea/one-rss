import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "@/components/header";
import {
  Colors,
  Elevation,
  Radii,
  Spacing,
  Typography,
} from "@/constants/theme";

const categories = ["精选", "科技", "设计", "商业"] as const;

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

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("精选");
  const [searchQuery, setSearchQuery] = useState("");
  const colors = Colors.light;

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 104,
      gap: Spacing.lg,
    },
    heroBlock: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.xl,
      gap: Spacing.sm,
    },
    title: {
      ...Typography.display,
      color: colors.onSurface,
    },
    subtitle: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
    },
    searchSection: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerHigh,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    searchContainer: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radii.lg,
      paddingHorizontal: 14,
      minHeight: 58,
    },
    searchInput: {
      flex: 1,
      ...Typography.body,
      color: colors.onSurface,
      paddingVertical: 0,
      paddingRight: 110,
    },
    addButton: {
      position: "absolute",
      right: 8,
      top: 8,
      bottom: 8,
      borderRadius: Radii.md,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.md,
      justifyContent: "center",
    },
    addButtonText: {
      ...Typography.label,
      color: colors.onPrimary,
    },
    categoriesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    categoryTag: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: Radii.pill,
      backgroundColor: colors.surfaceContainerLowest,
    },
    categoryTagActive: {
      backgroundColor: colors.primary,
    },
    categoryText: {
      ...Typography.label,
      color: colors.onSurfaceVariant,
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
      minHeight: 214,
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLowest,
      padding: Spacing.lg,
      ...Elevation.card,
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: Radii.md,
      backgroundColor: colors.surfaceContainerLow,
      overflow: "hidden",
      marginBottom: Spacing.md,
    },
    logo: {
      width: "100%",
      height: "100%",
    },
    cardTitle: {
      ...Typography.cardTitle,
      color: colors.onSurface,
      marginBottom: 4,
    },
    cardDescription: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
      minHeight: 48,
      marginBottom: Spacing.md,
    },
    subscribeBtn: {
      marginTop: "auto",
      borderRadius: Radii.lg,
      paddingVertical: 12,
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
      ...Typography.label,
      color: colors.primary,
    },
    subscribeBtnTextActive: {
      color: colors.onPrimary,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchIconColor: {
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroBlock}>
            <Text style={styles.title}>发现源</Text>
            <Text style={styles.subtitle}>
              以统一令牌组织搜索、分类和订阅卡片，用色块层次代替碎片化线框。
            </Text>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIcon}>
                <MaterialIcons
                  name="link"
                  size={20}
                  style={styles.searchIconColor}
                />
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

            <View style={styles.categoriesRow}>
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
            </View>
          </View>

          <View style={styles.grid}>
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
                  <TouchableOpacity
                    style={[
                      styles.subscribeBtn,
                      source.subscribed && styles.subscribeBtnActive,
                    ]}
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
                      {source.subscribed ? "已订阅" : "订阅"}
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
