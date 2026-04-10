import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { Header } from "@/components/header";
import { StatePanel } from "@/components/ui/state-panel";
import { useAuth } from "@/contexts/auth-context";
import {
  INTERFACE_LANGUAGES,
  TRANSLATION_LANGUAGES,
  usePreferences,
} from "@/contexts/preference-context";
import {
  Colors,
  Elevation,
  Radii,
  Spacing,
  Typography,
} from "@/constants/theme";
import {
  fetchUserProfileStats,
  type UserProfileStats,
} from "@/modules/profile/api/fetchUserProfileStats";

const emptyStats = [
  { id: "sources", value: "0", label: "订阅源" },
  { id: "read", value: "0", label: "已读" },
  { id: "fav", value: "0", label: "收藏" },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { interfaceLanguage, translationLanguage } = usePreferences();
  const router = useRouter();
  const colors = Colors.light;
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const interfaceLangLabel =
    INTERFACE_LANGUAGES.find((item) => item.value === interfaceLanguage)
      ?.label ?? "简体中文";
  const translationLangLabel =
    TRANSLATION_LANGUAGES.find((item) => item.value === translationLanguage)
      ?.label ?? "English";

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
    {
      id: "lang",
      icon: "language",
      title: "界面语言",
      desc: interfaceLangLabel,
      route: "/language-settings?type=interface",
    },
    {
      id: "translation",
      icon: "translate",
      title: "翻译语言",
      desc: translationLangLabel,
      route: "/language-settings?type=translation",
    },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const userStats = await fetchUserProfileStats();
        if (!cancelled) {
          setStats(userStats);
        }
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
        if (!cancelled) {
          setError("账户统计暂时无法获取，请稍后重试。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayStats = stats
    ? [
        {
          id: "sources",
          value: String(stats.subscriptionCount),
          label: "订阅源",
        },
        { id: "read", value: String(stats.readCount), label: "已读" },
        { id: "fav", value: String(stats.bookmarkCount), label: "收藏" },
      ]
    : emptyStats;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 112,
      gap: Spacing.lg,
    },
    profileSection: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.xl,
      alignItems: "center",
      ...Elevation.card,
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
      ...Typography.display,
      color: colors.onSurface,
      fontSize: 36,
      lineHeight: 40,
    },
    memberTag: {
      marginTop: Spacing.sm,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      backgroundColor: colors.surfaceContainerHigh,
    },
    memberTagText: {
      ...Typography.micro,
      color: colors.primary,
      textTransform: "uppercase",
    },
    profileHint: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: Spacing.md,
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statCard: {
      width: "31%",
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerLowest,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xl,
      ...Elevation.card,
    },
    statValue: {
      ...Typography.title,
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      ...Typography.micro,
      textTransform: "uppercase",
      color: colors.onSurfaceVariant,
    },
    sectionWrap: {
      borderRadius: Radii.xl,
      backgroundColor: colors.surfaceContainerHigh,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    sectionTitle: {
      ...Typography.sectionTitle,
      color: colors.onSurface,
    },
    settingsList: {
      gap: Spacing.sm,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: Radii.lg,
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
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    settingTitle: {
      ...Typography.cardTitle,
      color: colors.onSurface,
      marginBottom: 2,
    },
    settingDesc: {
      ...Typography.body,
      color: colors.onSurfaceVariant,
    },
    logoutBtn: {
      width: "100%",
      borderRadius: Radii.pill,
      backgroundColor: colors.errorContainer,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    logoutText: {
      ...Typography.bodyStrong,
      color: colors.onErrorContainer,
    },
    version: {
      marginTop: Spacing.md,
      ...Typography.micro,
      color: colors.onSurfaceVariant,
      textAlign: "center",
      textTransform: "uppercase",
    },
  });

  return (
    <View style={styles.container}>
      <Header title="The Curator" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.profileSection}>
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
            <Text style={styles.profileHint}>
              账户信息、语言偏好与阅读设置共享同一套卡片层级和交互密度。
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {displayStats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {error ? (
            <StatePanel
              icon="cloud-off"
              tone="error"
              title="统计加载失败"
              message={error}
            />
          ) : null}

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>账户设置</Text>
            <View style={styles.settingsList}>
              {settingsItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingsItem}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as never);
                    }
                  }}
                >
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
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>账户动作</Text>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => void signOut()}
            >
              <MaterialIcons
                name="logout"
                size={20}
                color={colors.onErrorContainer}
              />
              <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
            <Text style={styles.version}>The Curator 版本 2.4.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
