// app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTheme } from "react-native-paper";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return (
    <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        // (tabs)의 모든 네이티브 헤더를 숨깁니다 (커스텀 헤더 사용)
        headerShown: false,

        // 탭 바 스타일링
        tabBarActiveTintColor: theme.colors.primary, // 활성 (보라색)
        tabBarInactiveTintColor: theme.colors.outline, // 비활성 (회색)
        tabBarStyle: {
          backgroundColor: theme.colors.surface, // 탭 바 배경 (흰색)
          borderTopWidth: 1, // 상단 경계선 제거
          elevation: 0, // 그림자
          height: 60, // 탭 바 높이 조절
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "메인",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"} // 아이콘
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "히스토리",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "history" : "history"} // 아이콘 (focused일 때 채워진 아이콘이 있다면 변경)
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
