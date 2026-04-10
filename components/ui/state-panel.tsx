import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Colors,
  Elevation,
  Fonts,
  Radii,
  Spacing,
  Typography,
} from "@/constants/theme";

type Tone = "neutral" | "error";

type StatePanelProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
  compact?: boolean;
};

export function StatePanel({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
  compact = false,
}: StatePanelProps) {
  const colors = Colors.light;
  const accentColor = tone === "error" ? colors.error : colors.primary;
  const iconSurface =
    tone === "error" ? colors.errorContainer : colors.surfaceContainerHigh;

  return (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : null,
        tone === "error" ? styles.containerError : null,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconSurface }]}>
        <MaterialIcons name={icon} size={24} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.action, { backgroundColor: accentColor }]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.surfaceContainerLowest,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    ...Elevation.card,
  },
  containerCompact: {
    paddingVertical: Spacing.xl,
  },
  containerError: {
    backgroundColor: "#fff8f7",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.light.onSurface,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  message: {
    ...Typography.body,
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  action: {
    minWidth: 132,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: Colors.light.onPrimary,
  },
});
