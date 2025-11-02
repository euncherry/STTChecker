// components/CustomHeader.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomHeaderProps = {
  title: string;
};

export default function CustomHeader({ title }: CustomHeaderProps) {
  const theme = useTheme();
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.colors.primary,
          paddingTop: top + 26,
        },
      ]}
    >
      <Text
        variant="headlineLarge"
        style={[styles.title, { color: theme.colors.onPrimary }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    // [핵심 변경] 하단 좌우 모서리만 둥글게 처리합니다.
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // 그림자 추가 (선택 사항, 디자인 시안처럼 깊은 느낌을 줄 때 유용)
    elevation: 5,
  },
  title: {
    fontWeight: "bold",
  },
});
