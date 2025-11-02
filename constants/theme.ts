// constants/theme.ts
import { DefaultTheme, MD3Theme } from "react-native-paper";

// 첨부된 디자인 기반의 새로운 보라색 테마
export const theme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6A00FF", // 메인 보라색
    onPrimary: "#FFFFFF", // 보라색 위의 텍스트 (흰색)
    primaryContainer: "#EADDFF",
    onPrimaryContainer: "#21005D",
    secondary: "#625B71",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E8DEF8",
    onSecondaryContainer: "#1E192B",
    tertiary: "#7D5260",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#FFD8E4",
    onTertiaryContainer: "#31111D",
    error: "#B3261E",
    onError: "#FFFFFF",
    errorContainer: "#F9DEDC",
    onErrorContainer: "#410E0B",
    background: "#FAF8FF", // 콘텐츠 영역 배경 (아주 연한 라벤더)
    onBackground: "#1C1B1F",
    surface: "#FFFFFF", // 카드 배경 (흰색)
    onSurface: "#1C1B1F", // 카드 위 텍스트 (검정)
    surfaceVariant: "#E7E0EC",
    onSurfaceVariant: "#49454F",
    outline: "#AEAEB2", // 비활성 탭 아이콘 (회색)
    outlineVariant: "#CAC4D0",
    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#313033",
    inverseOnSurface: "#F4EFF4",
    inversePrimary: "#D0BCFF",
    elevation: {
      level0: "transparent",
      level1: "#F7F2FA",
      level2: "#F3EDF7", // 카드 표면 (흰색에 가까움)
      level3: "#EEEEF4",
      level4: "#EDEBF2",
      level5: "#EAE7F0",
    },
    surfaceDisabled: "rgba(28, 27, 31, 0.12)",
    onSurfaceDisabled: "rgba(28, 27, 31, 0.38)",
    backdrop: "rgba(50, 48, 51, 0.4)",
  },
};
