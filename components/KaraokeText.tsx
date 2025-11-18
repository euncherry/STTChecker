// components/KaraokeText.tsx
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { DEFAULT_DURATION_PER_CHARACTER } from "../utils/karaoke/timingPresets";
export type SyllableTiming = {
  syllable: string;
  start: number;
  end: number;
};

interface KaraokeTextProps {
  text: string;
  referenceTimings?: SyllableTiming[];
  isPlaying: boolean;
  currentTime?: number; // 외부에서 currentTime 전달 가능 (옵션)
  durationPerCharacter?: number; // ✅ 글자당 시간 (기본 0.3초)
  textColor?: string;
  fillColor?: string;
  fontSize?: number;
}

export default function KaraokeText({
  text,
  referenceTimings,
  isPlaying,
  currentTime: externalCurrentTime,
  durationPerCharacter = DEFAULT_DURATION_PER_CHARACTER, // ✅ 기본값 0.3초
  textColor = "#374151",
  fillColor = "#3B82F6",
  fontSize = 24,
}: KaraokeTextProps) {
  // 내부 타이머 (externalCurrentTime이 없을 때만 사용)
  const [internalCurrentTime, setInternalCurrentTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // 외부 currentTime이 있으면 그것을 사용, 없으면 내부 타이머
  const currentTime =
    externalCurrentTime !== undefined
      ? externalCurrentTime
      : internalCurrentTime;

  // 내부 타이머 관리 (externalCurrentTime이 없을 때만)
  useEffect(() => {
    if (externalCurrentTime !== undefined) {
      return;
    }

    if (isPlaying) {
      startTimeRef.current = Date.now() - internalCurrentTime * 1000;

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setInternalCurrentTime(elapsed);
      }, 16);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, externalCurrentTime]);

  // text 변경 시 리셋
  useEffect(() => {
    if (externalCurrentTime === undefined) {
      setInternalCurrentTime(0);
    }
  }, [text, externalCurrentTime]);

  // ✅ referenceTimings가 없으면 자동으로 생성
  const timings = React.useMemo(() => {
    if (referenceTimings && referenceTimings.length > 0) {
      return referenceTimings;
    }

    // 자동 생성: 각 글자당 durationPerCharacter초씩 균등 배분
    const syllables = text.split("");
    return syllables.map((syllable, index) => ({
      syllable,
      start: index * durationPerCharacter,
      end: (index + 1) * durationPerCharacter,
    }));
  }, [text, referenceTimings, durationPerCharacter]);

  return (
    <View style={styles.container}>
      <View style={styles.karaokeContainer}>
        {timings.map((item, index) => {
          const progress =
            currentTime < item.start
              ? 0
              : currentTime > item.end
                ? 100
                : ((currentTime - item.start) / (item.end - item.start)) * 100;

          const animatedStyle = useAnimatedStyle(() => ({
            width: withTiming(`${progress}%`, {
              duration: 50,
              easing: Easing.linear,
            }),
          }));

          return (
            <View key={index} style={styles.syllableContainer}>
              <Text
                style={[styles.backgroundText, { color: textColor, fontSize }]}
              >
                {item.syllable}
              </Text>
              <Animated.View style={[styles.fillContainer, animatedStyle]}>
                <Text style={[styles.fillText, { color: fillColor, fontSize }]}>
                  {item.syllable}
                </Text>
              </Animated.View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  karaokeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  syllableContainer: {
    position: "relative",
    marginHorizontal: 4,
    marginVertical: 2,
  },
  backgroundText: {
    fontWeight: "bold",
    opacity: 0.3,
  },
  fillContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  fillText: {
    fontWeight: "bold",
  },
});
