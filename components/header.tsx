import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";
import { MAX_FONT_SCALE } from "@/utils/accessibility";

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
      minWidth: 44,
      minHeight: 44,
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
      minHeight: 44,
      justifyContent: "center",
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
          <Pressable
            style={styles.iconButton}
            onPress={handleLeftPress}
            accessibilityRole="button"
            accessibilityLabel={showBack ? "返回上一页" : "打开菜单"}
          >
            {leftIcon ? (
              <Text
                style={styles.leftText}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {leftIcon}
              </Text>
            ) : showBack ? (
              <Text
                style={styles.leftText}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                ‹
              </Text>
            ) : (
              <MaterialIcons name="menu" size={24} color={colors.onSurface} />
            )}
          </Pressable>
        )}
        {!showBack && !leftIcon && (
          <Pressable
            style={styles.iconButton}
            onPress={onLeftPress}
            accessibilityRole="button"
            accessibilityLabel="打开菜单"
          >
            <MaterialIcons name="menu" size={24} color={colors.onSurface} />
          </Pressable>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text
          style={styles.title}
          numberOfLines={2}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {rightText ? (
          <Pressable
            style={styles.rightButton}
            onPress={onRightPress}
            accessibilityRole="button"
            accessibilityLabel={rightText}
          >
            <Text
              style={styles.rightText}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              {rightText}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.rightActions}>
            {showSearch && (
              <Pressable
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="搜索"
              >
                <MaterialIcons
                  name="search"
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            )}
            {showAvatar && (
              <Pressable
                style={styles.avatar}
                accessibilityRole="button"
                accessibilityLabel="打开个人资料"
              >
                <Text
                  style={styles.avatarText}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {avatarText}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
