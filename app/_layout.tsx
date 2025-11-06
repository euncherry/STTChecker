// app/_layout.tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { PaperProvider, useTheme } from "react-native-paper";
import ModelLoadingScreen from "../components/ModelLoadingScreen";
import { theme } from "../constants/theme";
import { ONNXProvider, useONNX } from "../utils/onnx/onnxContext";

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
      <StatusBar style="light" />
      <ONNXProvider>
        <RootLayoutNav />
      </ONNXProvider>
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isLoading, loadingProgress, error } = useONNX(); // ✅ 이제 작동함

  // 모델 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return <ModelLoadingScreen progress={loadingProgress} error={error} />;
  }

  return (
    <Stack>
      {/* 1. 탭 스크린 (메인, 히스토리) - 네이티브 헤더 숨김 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 2. 녹음 페이지 (모달) - 네이티브 헤더를 테마색으로 스타일링 */}
      <Stack.Screen
        name="record"
        options={{
          presentation: "modal",
          title: "녹음 진행",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
        }}
      />

      {/* 3. 결과 페이지 - 네이티브 헤더를 테마색으로 스타일링 */}
      <Stack.Screen
        name="results"
        options={{
          title: "분석 결과",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
        }}
      />
    </Stack>
  );
}
