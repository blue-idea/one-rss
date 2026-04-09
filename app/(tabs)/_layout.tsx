import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";

import { AppTabBar } from "@/components/app-tab-bar";

type TabRouteName = "index" | "explore" | "shelf" | "profile";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props: BottomTabBarProps) => (
        <AppTabBar
          activeKey={
            props.state.routes[props.state.index]?.name as TabRouteName
          }
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "今日",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "发现",
        }}
      />
      <Tabs.Screen
        name="shelf"
        options={{
          title: "书架",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
        }}
      />
    </Tabs>
  );
}
