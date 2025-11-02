// app/_layout.tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar"; // StatusBar 임포트
import { useEffect } from "react";
import { PaperProvider, useTheme } from "react-native-paper"; // useTheme 임포트
import { theme } from "../constants/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      {/* 상태표시줄 스타일을 'light' (흰색 글씨)로 설정합니다.
        보라색 커스텀 헤더와 네이티브 헤더 모두에 적용됩니다.
      */}
      <StatusBar style="light" />
      <RootLayoutNav />
    </PaperProvider>
  );
}

function RootLayoutNav() {
  // 테마 색상을 가져옵니다.
  const { colors } = useTheme();

  return (
    // <ModelProvider>
    <Stack>
      {/* 1. 탭 스크린 (메인, 히스토리) - 네이티브 헤더 숨김 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 2. 녹음 페이지 (모달) - 네이티브 헤더를 테마색으로 스타일링 */}
      <Stack.Screen
        name="record"
        options={{
          presentation: "modal",
          title: "녹음 진행",
          headerStyle: { backgroundColor: colors.primary }, // 헤더 배경 보라색
          headerTintColor: colors.onPrimary, // 헤더 글씨 흰색
        }}
      />

      {/* 3. 결과 페이지 - 네이티브 헤더를 테마색으로 스타일링 */}
      <Stack.Screen
        name="results"
        options={{
          title: "분석 결과",
          headerStyle: { backgroundColor: colors.primary }, // 헤더 배경 보라색
          headerTintColor: colors.onPrimary, // 헤더 글씨 흰색
        }}
      />
    </Stack>
    // </ModelProvider>
  );
}
