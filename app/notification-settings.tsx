import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "@/components/header";
import { Colors, Spacing } from "@/constants/theme";
import { NOTIFICATION_SETTINGS_SECTIONS } from "@/modules/profile/constants/notification-settings";

export default function NotificationSettingsScreen() {
  const colors = Colors.light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 112,
    },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: 28,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    heroEyebrow: {
      color: `${colors.onPrimary}CC`,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      textTransform: "uppercase",
    },
    heroTitle: {
      color: colors.onPrimary,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800",
      marginBottom: Spacing.sm,
    },
    heroDescription: {
      color: `${colors.onPrimary}DD`,
      fontSize: 16,
      lineHeight: 24,
    },
    sectionList: {
      gap: Spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 20,
      padding: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      color: colors.onSurface,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: "700",
    },
    sectionBody: {
      color: colors.onSurfaceVariant,
      fontSize: 15,
      lineHeight: 24,
    },
    statusCard: {
      marginTop: Spacing.xl,
      borderRadius: 20,
      padding: Spacing.lg,
      backgroundColor: colors.surfaceContainerHigh,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
    },
    statusTextWrap: {
      flex: 1,
    },
    statusTitle: {
      color: colors.onSurface,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    statusBody: {
      color: colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 22,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="通知设置" showBack showAvatar={false} showSearch={false} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Notification Preview</Text>
            <Text style={styles.heroTitle}>提醒入口已预留，能力稍后接入</Text>
            <Text style={styles.heroDescription}>
              首版先提供通知设置入口与说明文案，帮助你提前了解支持方向；当前不会下发通知，也不展示可操作开关。
            </Text>
          </View>

          <View style={styles.sectionList}>
            {NOTIFICATION_SETTINGS_SECTIONS.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons
                    color={colors.primary}
                    name="notifications-none"
                    size={18}
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statusCard}>
            <MaterialIcons
              color={colors.primary}
              name="info-outline"
              size={20}
            />
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>当前未启用任何通知开关</Text>
              <Text style={styles.statusBody}>
                该页面仅为占位说明，不接入通知开关后端能力，避免用户误以为当前配置已经生效。
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
