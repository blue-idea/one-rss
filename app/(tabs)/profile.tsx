import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Header } from "@/components/header";
import { useAuth } from "@/contexts/auth-context";
import { Colors, Spacing } from "@/constants/theme";

const profileStats = [
  { id: "sources", value: "42", label: "订阅源" },
  { id: "read", value: "1.2k", label: "已读" },
  { id: "fav", value: "86", label: "收藏" },
];

const settingsItems = [
  {
    id: "reading",
    icon: "menu-book",
    title: "阅读偏好",
    desc: "字体大小，行高，主题",
  },
  {
    id: "notify",
    icon: "notifications-active",
    title: "通知设置",
    desc: "重大新闻，每日摘要",
  },
  { id: "lang", icon: "language", title: "界面语言", desc: "中文 (简体)" },
  {
    id: "translation",
    icon: "translate",
    title: "翻译语言",
    desc: "自动翻译为 法语",
  },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const colorScheme = "light";
  const colors = Colors[colorScheme];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 112,
    },
    profileSection: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: Spacing.xl,
    },
    profileInner: {
      alignItems: "center",
    },
    mainAvatarWrap: {
      width: 112,
      height: 112,
      borderRadius: 56,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.md,
      position: "relative",
    },
    mainAvatar: {
      width: "100%",
      height: "100%",
    },
    verifiedBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    userName: {
      fontSize: 38,
      lineHeight: 42,
      color: colors.onSurface,
      fontWeight: "800",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    memberTag: {
      marginTop: Spacing.sm,
      borderRadius: 999,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      backgroundColor: colors.surfaceContainerHigh,
    },
    memberTagText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xxl,
    },
    statCard: {
      width: "31%",
      borderRadius: 14,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xl,
    },
    statValue: {
      fontSize: 30,
      lineHeight: 34,
      color: colors.primary,
      fontWeight: "900",
      marginBottom: 4,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
      color: colors.onSurfaceVariant,
    },
    sectionTitle: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "700",
      color: colors.onSurface,
      paddingHorizontal: Spacing.xs,
      marginBottom: Spacing.md,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    settingsList: {
      gap: 8,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 14,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: Spacing.md,
    },
    settingIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    settingTitle: {
      fontSize: 22,
      lineHeight: 24,
      fontWeight: "700",
      color: colors.onSurface,
      marginBottom: 2,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    settingDesc: {
      fontSize: 12,
      color: "#6b7280",
    },
    logoutWrap: {
      marginTop: Spacing.xxl,
      paddingTop: Spacing.lg,
      alignItems: "center",
    },
    logoutBtn: {
      width: "100%",
      borderRadius: 999,
      borderWidth: 2,
      borderColor: `${colors.error}1A`,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    logoutText: {
      color: colors.error,
      fontSize: 24,
      lineHeight: 26,
      fontWeight: "700",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    version: {
      marginTop: Spacing.lg,
      fontSize: 10,
      color: colors.onSurfaceVariant,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.profileInner}>
              <View style={styles.mainAvatarWrap}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5TyUeGUezGxfEjFjzDwqdTDcwMfBR70QBCQjH0KwZQxjEbrNatuR-5Md-KdGlmsArPP8toZ-5HqLoOsdngVUzxz4Du0RCWlPSOevqrYIH_lfDOwSSIrqtjjK1lnNHIsKi1UMKGeEn5TcbGNQ7EUmfK62MzCe7oRO8S80fYah9Pr0PdnpYpieLYxQgJQJlXqS2lVUzufSSrLvljja2l4blGDhpG_UU0v3SjSR5Qoz268rEWks6j7xgRnz5qypvzsIXhsjQ1GsLEAVG",
                  }}
                  style={styles.mainAvatar}
                  contentFit="cover"
                />
                <View style={styles.verifiedBadge}>
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color={colors.onPrimary}
                  />
                </View>
              </View>
              <Text style={styles.userName}>Reader 101</Text>
              <View style={styles.memberTag}>
                <Text style={styles.memberTagText}>高级会员</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {profileStats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>账户设置</Text>
          <View style={styles.settingsList}>
            {settingsItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.settingsItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconWrap}>
                    <MaterialIcons
                      name={item.icon as never}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.logoutWrap}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => void signOut()}
            >
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
            <Text style={styles.version}>THE CURATOR 版本 2.4.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
