import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";

export type HeaderProps = {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showAvatar?: boolean;
  rightText?: string;
  onRightPress?: () => void;
  avatarText?: string;
  leftIcon?: string;
  onLeftPress?: () => void;
  backgroundColor?: string;
};

export function Header({
  title,
  showBack = false,
  showSearch = true,
  showAvatar = true,
  rightText,
  onRightPress,
  avatarText = "👤",
  leftIcon,
  onLeftPress,
  backgroundColor,
}: HeaderProps) {
  const router = useRouter();
  const colorScheme = "light";
  const colors = Colors[colorScheme];
  const bgColor = backgroundColor || colors.surface;

  const topPadding =
    Platform.OS === "android"
      ? (StatusBar.currentHeight ?? 0) + Spacing.xs
      : 20;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: topPadding,
      paddingBottom: Spacing.md,
      backgroundColor: bgColor,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(193, 198, 215, 0.3)",
    },
    leftContainer: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 48,
    },
    iconButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    leftText: {
      fontSize: showBack ? 20 : 24,
      color: colors.primary,
      fontWeight: showBack ? "300" : "400",
    },
    centerContainer: {
      flex: 1,
      paddingHorizontal: Spacing.md,
    },
    title: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "800",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: -0.2,
    },
    rightContainer: {
      minWidth: 74,
      alignItems: "flex-end",
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    iconText: {
      fontSize: 18,
      color: colors.onSurfaceVariant,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 14,
    },
    rightButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    rightText: {
      fontSize: 15,
      color: colors.primary,
    },
  });

  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else if (showBack) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {(showBack || leftIcon) && (
          <TouchableOpacity style={styles.iconButton} onPress={handleLeftPress}>
            {leftIcon ? (
              <Text style={styles.leftText}>{leftIcon}</Text>
            ) : showBack ? (
              <Text style={styles.leftText}>‹</Text>
            ) : (
              <MaterialIcons name="menu" size={24} color={colors.onSurface} />
            )}
          </TouchableOpacity>
        )}
        {!showBack && !leftIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onLeftPress}>
            <MaterialIcons name="menu" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {rightText ? (
          <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
            <Text style={styles.rightText}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.rightActions}>
            {showSearch && (
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons
                  name="search"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            )}
            {showAvatar && (
              <TouchableOpacity style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarText}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
