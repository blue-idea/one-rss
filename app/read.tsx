import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Spacing } from "@/constants/theme";
import { useBookmarks } from "@/contexts/bookmark-context";

const articleData = {
  source: "大西洋月刊 (The Atlantic)",
  meta: "发布于 2023年10月24日 • 12分钟阅读",
  title: "宁静的建筑：为何现代城市正缺失静谧空间",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDthO0lRqO5_hYl35LE4styW1Z8a1LksY_-CJAlOD6Do_jf74bbUmvwG3Y9ufMoDwMuTRA2z_HA1RA44gQpBGrhm-gfp1_k7-Z8HkH6JPizQKwkJqCXyTy1Wh20N-XqVTET-0s5YWipyYlEJdFEUqxr03ElicMWLGebUvInT-m8K38xrll0MKxSzmdrg-Z_h8MMVJPoAt-C0DkMeafEv8RFuTCR1I5aVL_cEZOW0wSGId13KTWDTx7b6FltPeh33-vMhxRclT-sGx_W",
  caption: "摄影：Elena Krane。斯德哥尔摩公共图书馆中央中庭。",
  paragraphs: [
    "在城市的心脏地带，宁静已成为最昂贵的奢侈品。随着城市密度增加，数字连接的嗡嗡声渗透到最偏远的街道角落，建筑师们开始重新审视声学隔离的核心价值。过去的“安静地带”——图书馆、大教堂和画廊——正被重新设计，以适应当下的后分心时代。",
    "几十年来，公共空间的设计一直由视觉主导。我们为美学、流动性和“网红打卡”时刻进行了优化。但随着神经科学家发现环境噪音对皮质醇水平和认知功能的深远影响，一场修复性建筑的新运动正将声音置于蓝图的中心。",
    "当代城市规划通常将安静视为隔离的副产品——即远离噪音源。然而，下一代策展人正将宁静融入结构本身。通过使用多孔材料、算法几何图案和动力学隔音墙，这些新空间不仅阻挡噪音，还主动中和噪音。",
    "展望2030年代，“静默图书馆”可能不再仅是一座建筑，而是一种哲学。我们正在学习，要策划一个有意识的生活，首先必须策划我们周围振动的空气。",
  ],
  quote:
    "“真正的宁静并非声音的缺失，而是空间的呈现，在其中思想终能听见自己的声音。”",
  quoteAuthor: "— 安藤忠雄，建筑师",
  pillars: [
    "材料孔隙率：摆脱传统的混凝土，转向能吸收而非反射声波的有机纹理。",
    "地下容积：利用大地的自然热能和声学质量打造冥想室。",
    "主动扩散：集成能与城市混乱频率相协调的白噪音发生器。",
  ],
};

export default function ReadScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; feedId?: string }>();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Get initial bookmark state from context based on article ID
  const initialBookmarked = params.id ? isBookmarked(params.id) : false;
  const [localBookmarked, setLocalBookmarked] = useState(initialBookmarked);

  const handleBookmarkToggle = () => {
    if (params.id) {
      toggleBookmark(params.id);
      setLocalBookmarked((prev) => !prev);
    }
  };

  // Use local state for immediate UI update, synced with context
  const displayBookmarked = params.id ? localBookmarked : false;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: 132,
    },
    topBar: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 20,
      paddingBottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(249, 249, 252, 0.92)",
    },
    topAction: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    topCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    topCenterIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.onSurface,
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    headerMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    sourceIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: "rgba(193, 198, 215, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    sourceBlock: {
      flex: 1,
    },
    sourceName: {
      fontSize: 11,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: colors.primary,
      fontWeight: "700",
    },
    sourceMeta: {
      marginTop: 4,
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    articleTitle: {
      fontSize: 42,
      lineHeight: 47,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.xl,
    },
    heroWrap: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: colors.surfaceContainerLow,
      aspectRatio: 16 / 10,
      marginBottom: Spacing.md,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroCaption: {
      fontSize: 12,
      fontStyle: "italic",
      textAlign: "center",
      color: colors.onSurfaceVariant,
      marginBottom: 44,
    },
    paragraphLead: {
      fontSize: 24,
      lineHeight: 38,
      color: "rgba(26, 28, 30, 0.9)",
      marginBottom: 30,
    },
    paragraph: {
      fontSize: 24,
      lineHeight: 38,
      color: "rgba(26, 28, 30, 0.9)",
      marginBottom: 30,
    },
    quoteWrap: {
      borderLeftWidth: 4,
      borderLeftColor: "rgba(0, 88, 188, 0.2)",
      paddingLeft: Spacing.lg,
      marginVertical: Spacing.xl,
    },
    quoteText: {
      fontSize: 30,
      lineHeight: 40,
      color: colors.primary,
      fontWeight: "500",
    },
    quoteAuthor: {
      marginTop: Spacing.md,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: colors.onSurfaceVariant,
    },
    infoBox: {
      marginVertical: Spacing.xl,
      borderRadius: 24,
      padding: Spacing.xl,
      backgroundColor: colors.surfaceContainerLow,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: Spacing.lg,
    },
    pillarRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    pillarText: {
      flex: 1,
      fontSize: 20,
      lineHeight: 30,
      color: "rgba(26, 28, 30, 0.8)",
    },
    readerToolbarWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 18,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(193, 198, 215, 0.15)",
      backgroundColor: "rgba(249, 249, 252, 0.92)",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toolbarGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toolButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    toolLabel: {
      fontSize: 8,
      fontWeight: "700",
      color: colors.onSurfaceVariant,
      marginTop: 1,
    },
    speakButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryContainer,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    speakLabel: {
      fontSize: 8,
      fontWeight: "700",
      color: colors.onPrimary,
      marginTop: 1,
    },
    progressTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 4,
      backgroundColor: colors.surfaceContainerLow,
    },
    progressFill: {
      width: "33%",
      height: "100%",
      backgroundColor: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topAction}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.topCenterIcon}>
            <MaterialIcons
              name="auto-stories"
              size={16}
              color={colors.primary}
            />
          </View>
          <Text style={styles.topTitle}>The Curator</Text>
        </View>
        <View style={styles.topRightActions}>
          <TouchableOpacity style={styles.topAction} onPress={handleBookmarkToggle}>
            <MaterialIcons
              name={displayBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={displayBookmarked ? colors.primary : colors.onSurface}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topAction}>
            <MaterialIcons name="share" size={22} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerMetaRow}>
            <View style={styles.sourceIconWrap}>
              <MaterialIcons
                name="newspaper"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.sourceBlock}>
              <Text style={styles.sourceName}>{articleData.source}</Text>
              <Text style={styles.sourceMeta}>{articleData.meta}</Text>
            </View>
          </View>
          <Text style={styles.articleTitle}>{articleData.title}</Text>
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: articleData.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.heroCaption}>{articleData.caption}</Text>
          <Text style={styles.paragraphLead}>{articleData.paragraphs[0]}</Text>
          <Text style={styles.paragraph}>{articleData.paragraphs[1]}</Text>
          <View style={styles.quoteWrap}>
            <Text style={styles.quoteText}>{articleData.quote}</Text>
            <Text style={styles.quoteAuthor}>{articleData.quoteAuthor}</Text>
          </View>
          <Text style={styles.paragraph}>{articleData.paragraphs[2]}</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>声学圣殿的三大支柱</Text>
            {articleData.pillars.map((item) => (
              <View key={item} style={styles.pillarRow}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.pillarText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.paragraph}>{articleData.paragraphs[3]}</Text>
        </View>
      </ScrollView>
      <View style={styles.readerToolbarWrap}>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons
              name="palette"
              size={22}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.toolLabel}>主题</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons
              name="format-size"
              size={22}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.toolLabel}>字体</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.speakButton}>
          <MaterialIcons name="volume-up" size={24} color={colors.onPrimary} />
          <Text style={styles.speakLabel}>朗读</Text>
        </TouchableOpacity>
        <View style={styles.toolbarGroup}>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons
              name="translate"
              size={22}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.toolLabel}>翻译</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons
              name="more-vert"
              size={22}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}
