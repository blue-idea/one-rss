import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { MAX_FONT_SCALE } from "@/utils/accessibility";

type TabKey = "index" | "explore" | "shelf" | "profile";

type TabItem = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  href: "/" | "/explore" | "/shelf" | "/profile";
};

const TAB_ITEMS: TabItem[] = [
  { key: "index", label: "今日", icon: "library-books", href: "/" },
  { key: "explore", label: "发现", icon: "explore", href: "/explore" },
  { key: "shelf", label: "书架", icon: "collections-bookmark", href: "/shelf" },
  { key: "profile", label: "我的", icon: "account-circle", href: "/profile" },
];

type AppTabBarProps = {
  activeKey?: TabKey;
};

const getActiveFromPath = (pathname: string): TabKey | undefined => {
  if (pathname === "/" || pathname === "/index") return "index";
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/shelf")) return "shelf";
  if (pathname.startsWith("/profile")) return "profile";
  return undefined;
};

export function AppTabBar({ activeKey }: AppTabBarProps) {
  const colors = Colors.light;
  const router = useRouter();
  const pathname = usePathname();
  const resolvedActive = activeKey ?? getActiveFromPath(pathname);

  const styles = StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderTopColor: "rgba(193, 198, 215, 0.3)",
      backgroundColor: colors.surface,
      height: 64,
      paddingBottom: 8,
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    item: {
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      minWidth: 60,
      minHeight: 48,
      paddingHorizontal: 6,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
  });

  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((item) => {
        const focused = item.key === resolvedActive;
        const color = focused ? colors.primary : "rgba(65, 71, 85, 0.6)";
        return (
          <Pressable
            key={item.key}
            testID={`app-tab-${item.key}`}
            style={styles.item}
            onPress={() => router.replace(item.href)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={`切换到${item.label}`}
          >
            <MaterialIcons name={item.icon} size={22} color={color} />
            <Text
              style={[styles.label, { color }]}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
