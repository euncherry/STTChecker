// app/(tabs)/sing.tsx
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const referenceTimings = [
  { syllable: "안", start: 0.0, end: 0.3 },
  { syllable: "녕", start: 0.3, end: 0.8 },
  { syllable: "하", start: 0.8, end: 1.2 },
  { syllable: "세", start: 1.2, end: 1.8 },
  { syllable: "요", start: 1.8, end: 2.5 },
];

function KaraokeWithReset() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now() - currentTime * 1000;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(elapsed);

      if (elapsed > 2.5) {
        setIsRunning(false);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    setCurrentTime(0);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      {/* 노래방 애니메이션 */}
      <View style={styles.karaokeContainer}>
        {referenceTimings.map((item, index) => {
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
              {/* 배경 글자 */}
              <Text style={styles.backgroundText}>{item.syllable}</Text>

              {/* 채워지는 글자 (Animated) */}
              <Animated.View style={[styles.fillContainer, animatedStyle]}>
                <Text style={styles.fillText}>{item.syllable}</Text>
              </Animated.View>
            </View>
          );
        })}
      </View>

      {/* 타이머 표시 */}
      <Text style={styles.timer}>{currentTime.toFixed(2)}초 / 2.50초</Text>

      {/* 컨트롤 버튼 */}
      <View style={styles.buttonContainer}>
        {!isRunning ? (
          currentTime === 0 ? (
            <Button title="시작" onPress={handleStart} />
          ) : (
            <>
              <Button title="계속" onPress={handleResume} />
              <View style={{ width: 10 }} />
              <Button title="처음부터" onPress={handleStart} />
            </>
          )
        ) : (
          <Button title="일시정지" onPress={handlePause} />
        )}

        {currentTime > 0 && (
          <>
            <View style={{ width: 10 }} />
            <Button title="초기화" onPress={handleReset} color="#FF6B6B" />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  karaokeContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  syllableContainer: {
    position: "relative",
    marginHorizontal: 8,
  },
  backgroundText: {
    fontSize: 50,
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: "#666666",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  fillContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  fillText: {
    fontSize: 50,
    color: "#FFD700",
    fontWeight: "bold",
    textShadowColor: "#FF6B00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  timer: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
});

export default KaraokeWithReset;
