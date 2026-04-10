import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { Header } from "@/components/header";
import { useAuth } from "@/contexts/auth-context";
import {
  usePreferences,
  INTERFACE_LANGUAGES,
  TRANSLATION_LANGUAGES,
} from "@/contexts/preference-context";
import { Colors, Spacing } from "@/constants/theme";
import {
  createMembershipCheckout,
  type MembershipCheckoutSession,
} from "@/modules/membership/api/createMembershipCheckout";
import { fetchMembershipPlans } from "@/modules/membership/api/fetchMembershipPlans";
import { submitMockMembershipPayment } from "@/modules/membership/api/submitMockMembershipPayment";
import {
  fetchUserProfileStats,
  type UserProfileStats,
} from "@/modules/profile/api/fetchUserProfileStats";

const profileStats = [
  { id: "sources", value: "0", label: "订阅源" },
  { id: "read", value: "0", label: "已读" },
  { id: "fav", value: "0", label: "收藏" },
];

export default function ProfileScreen() {
  const { signOut, session, membership, refreshMembership } = useAuth();
  const { interfaceLanguage, translationLanguage } = usePreferences();
  const router = useRouter();
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [plans, setPlans] = useState<MembershipCheckoutSession["plan"][]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [activeCheckout, setActiveCheckout] =
    useState<MembershipCheckoutSession | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<string | null>(
    null,
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Get display labels for current languages
  const interfaceLangLabel =
    INTERFACE_LANGUAGES.find((l) => l.value === interfaceLanguage)?.label ??
    "中文 (简体)";
  const translationLangLabel =
    TRANSLATION_LANGUAGES.find((l) => l.value === translationLanguage)?.label ??
    "English";

  // Dynamic settings items based on preferences
  const dynamicSettingsItems = [
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

  const handleSettingPress = (item: (typeof dynamicSettingsItems)[0]) => {
    if (item.id === "lang" || item.id === "translation") {
      router.push(item.route as any);
    }
    // Reading and notify settings would be handled in future tasks
  };

  const loadProfileData = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const [userStats, nextPlans] = await Promise.all([
        fetchUserProfileStats(),
        fetchMembershipPlans(),
        refreshMembership(),
      ]);
      setStats(userStats);
      setPlans(nextPlans);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [refreshMembership]);

  useEffect(() => {
    (async () => {
      try {
        await loadProfileData();
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      }
    })();
  }, [loadProfileData]);

  // Update stats display when fetched
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
    : profileStats;

  const memberTagText = useMemo(() => {
    if (!membership || membership.tier === "free") {
      return membership?.status === "pending" ? "支付处理中" : "普通用户";
    }
    return membership.plan?.name ?? "高级会员";
  }, [membership]);

  const membershipSummary = useMemo(() => {
    if (!membership || membership.tier === "free") {
      if (membership?.status === "expired") {
        return "会员已失效，订阅上限和增值能力已按普通用户规则降级。";
      }
      return "升级后可解锁更高订阅上限、翻译与朗读能力。";
    }

    const expiryText = membership.expiresAt
      ? new Date(membership.expiresAt).toLocaleDateString("zh-CN")
      : "长期有效";
    return `当前为高级会员，权益有效至 ${expiryText}。`;
  }, [membership]);

  const handleCheckoutPress = async (planCode: "monthly" | "yearly") => {
    setIsCreatingCheckout(planCode);
    try {
      const checkout = await createMembershipCheckout(planCode);
      setActiveCheckout(checkout);
    } catch (error) {
      console.error("Failed to create membership checkout:", error);
      Alert.alert("创建支付会话失败", "请稍后重试。");
    } finally {
      setIsCreatingCheckout(null);
    }
  };

  const handleMockPayment = async (action: "completed" | "canceled") => {
    if (!activeCheckout) return;

    setIsSubmittingPayment(true);
    try {
      await submitMockMembershipPayment(activeCheckout.sessionId, action);
      await refreshMembership();
      await loadProfileData();
      setActiveCheckout(null);

      if (action === "completed") {
        Alert.alert("支付成功", "会员状态已刷新并即时生效。");
      } else {
        Alert.alert("支付已取消", "你仍可稍后重新发起购买。");
      }
    } catch (error) {
      console.error("Failed to submit mock payment:", error);
      Alert.alert("支付操作失败", "请稍后重试。");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

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
    membershipPanel: {
      marginBottom: Spacing.xxl,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerLow,
      padding: Spacing.xl,
    },
    membershipHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    membershipTitle: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: "800",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    membershipStatusText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    membershipSummary: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    planGrid: {
      gap: Spacing.md,
    },
    planCard: {
      borderRadius: 16,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${colors.primary}20`,
    },
    planHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    planName: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "700",
      color: colors.onSurface,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    planPrice: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.primary,
    },
    planDesc: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: Spacing.md,
    },
    planAction: {
      height: 44,
      borderRadius: 999,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: Spacing.sm,
    },
    planActionText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    planSecondary: {
      color: colors.onSurfaceVariant,
      fontSize: 11,
      marginTop: Spacing.sm,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.48)",
      justifyContent: "center",
      padding: Spacing.xl,
    },
    modalCard: {
      borderRadius: 24,
      backgroundColor: colors.surface,
      padding: Spacing.xl,
    },
    modalTitle: {
      fontSize: 26,
      lineHeight: 30,
      fontWeight: "800",
      color: colors.onSurface,
      marginBottom: Spacing.sm,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    modalDesc: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    modalAmount: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: "900",
      color: colors.primary,
      marginBottom: Spacing.lg,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    modalActions: {
      gap: Spacing.sm,
    },
    modalPrimary: {
      height: 48,
      borderRadius: 999,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    modalPrimaryText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    modalGhost: {
      height: 48,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    modalGhostText: {
      color: colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: "700",
    },
  });

  const formatCurrency = (priceCents: number, currency: string) =>
    new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(priceCents / 100);

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
              <Text style={styles.userName}>
                {session?.user.email ?? "Reader 101"}
              </Text>
              <View style={styles.memberTag}>
                <Text style={styles.memberTagText}>{memberTagText}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {displayStats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.membershipPanel}>
            <View style={styles.membershipHeader}>
              <Text style={styles.membershipTitle}>会员中心</Text>
              <Text style={styles.membershipStatusText}>
                {membership?.status ?? "inactive"}
              </Text>
            </View>
            <Text style={styles.membershipSummary}>{membershipSummary}</Text>
            <View style={styles.planGrid}>
              {plans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {formatCurrency(plan.priceCents, plan.currency)}
                    </Text>
                  </View>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                  <TouchableOpacity
                    style={styles.planAction}
                    onPress={() => void handleCheckoutPress(plan.code)}
                    disabled={isCreatingCheckout !== null}
                  >
                    {isCreatingCheckout === plan.code ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <>
                        <MaterialIcons
                          name="workspace-premium"
                          size={18}
                          color={colors.onPrimary}
                        />
                        <Text style={styles.planActionText}>创建支付会话</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.planSecondary}>
                    {plan.billingCycle === "month"
                      ? "月付续费"
                      : "年付一次解锁更长周期"}
                  </Text>
                </View>
              ))}
              {!plans.length && !isLoadingPlans ? (
                <Text style={styles.planSecondary}>当前没有可售套餐。</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.sectionTitle}>账户设置</Text>
          <View style={styles.settingsList}>
            {dynamicSettingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingsItem}
                onPress={() => handleSettingPress(item)}
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

      <Modal visible={activeCheckout !== null} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !isSubmittingPayment && setActiveCheckout(null)}
        >
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>模拟支付</Text>
            <Text style={styles.modalDesc}>
              当前接入的是 mock
              checkout。确认后会通过服务端回调更新会员状态，取消则保持普通用户规则。
            </Text>
            <Text style={styles.modalAmount}>
              {activeCheckout
                ? formatCurrency(
                    activeCheckout.plan.priceCents,
                    activeCheckout.plan.currency,
                  )
                : ""}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={() => void handleMockPayment("completed")}
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryText}>确认支付成功</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => void handleMockPayment("canceled")}
                disabled={isSubmittingPayment}
              >
                <Text style={styles.modalGhostText}>取消支付</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
