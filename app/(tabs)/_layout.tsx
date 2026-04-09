import { Tabs } from "expo-router";

import { AppTabBar } from "@/components/app-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state }) => (
        <AppTabBar
          activeKey={
            state.routes[state.index]?.name as
              | "index"
              | "explore"
              | "shelf"
              | "profile"
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
