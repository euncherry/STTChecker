// app/record.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import AudioRecord from "react-native-audio-record";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import KaraokeText from "../components/KaraokeText";
import {
  DEFAULT_DURATION_PER_CHARACTER,
  getTimingPreset,
} from "../utils/karaoke/timingPresets";

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetText = Array.isArray(params.text) ? params.text[0] : params.text;

  const [isRecording, setIsRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false); // ✅ 카운트다운 상태
  const [countdown, setCountdown] = useState(3); // ✅ 3초 카운트다운
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const recordingStartTime = useRef<number>(0);

  const referenceTimings = targetText ? getTimingPreset(targetText) : undefined;

  const estimatedTotalDuration = React.useMemo(() => {
    if (!targetText) return 5;

    if (referenceTimings && referenceTimings.length > 0) {
      return Math.max(...referenceTimings.map((t) => t.end));
    } else {
      return targetText.length * DEFAULT_DURATION_PER_CHARACTER;
    }
  }, [targetText, referenceTimings]);

  const autoStopDuration = estimatedTotalDuration + 1;

  useEffect(() => {
    initializeRecording();
    return () => {
      stopTimer();
      clearAutoStopTimer();
    };
  }, []);

  const initializeRecording = async () => {
    try {
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: `recording_${Date.now()}.wav`,
      };

      console.log("[RecordScreen] 🎤 녹음 설정:", options);
      AudioRecord.init(options);

      if (Platform.OS === "android") {
        const { PermissionsAndroid } = require("react-native");
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "마이크 권한",
            message: "발음 연습을 위해 마이크 권한이 필요합니다.",
            buttonNeutral: "나중에",
            buttonNegative: "거부",
            buttonPositive: "허용",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("권한 거부", "마이크 권한이 거부되었습니다.");
        }
      }
    } catch (error) {
      console.error("[RecordScreen] 초기화 실패:", error);
      Alert.alert("오류", "녹음 초기화에 실패했습니다.");
    }
  };

  const startTimer = () => {
    setTimer(0);
    recordingStartTime.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - recordingStartTime.current) / 1000
      );
      setTimer(elapsed);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAutoStopTimer = () => {
    console.log(
      `[RecordScreen] ⏰ 자동 종료 타이머 설정: ${autoStopDuration}초 후`
    );

    autoStopTimerRef.current = setTimeout(() => {
      console.log("[RecordScreen] ⏰ 자동 녹음 종료!");
      stopRecording(true);
    }, autoStopDuration * 1000);
  };

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  // ✅ 카운트다운 시작
  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // 카운트다운 종료 후 녹음 시작
          setTimeout(() => {
            setIsCountingDown(false);
            startRecordingAfterCountdown();
          }, 1000); // "시작!" 표시 후 녹음 시작
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ✅ 카운트다운 후 실제 녹음 시작
  const startRecordingAfterCountdown = async () => {
    try {
      console.log("[RecordScreen] 🎙️ 녹음 시작...");
      AudioRecord.start();
      setIsRecording(true);
      startTimer();
      startAutoStopTimer();
      console.log("[RecordScreen] ✅ 녹음 시작됨");
    } catch (error) {
      console.error("[RecordScreen] ❌ 녹음 시작 실패:", error);
      Alert.alert("오류", "녹음을 시작하는 데 실패했습니다.");
      stopTimer();
      clearAutoStopTimer();
    }
  };

  const stopRecording = async (isAutoStop = false) => {
    try {
      const exactTime = (Date.now() - recordingStartTime.current) / 1000;
      stopTimer();
      clearAutoStopTimer();

      console.log(
        `[RecordScreen] 🛑 녹음 중지 중... (${isAutoStop ? "자동" : "수동"})`
      );

      const audioFile = await AudioRecord.stop();
      setIsRecording(false);

      console.log("[RecordScreen] 📁 WAV 파일 저장됨:", audioFile);
      console.log("[RecordScreen] ⏱️ 녹음 시간:", exactTime);

      let fileUri = audioFile;
      if (Platform.OS === "android" && !audioFile.startsWith("file://")) {
        fileUri = `file://${audioFile}`;
      }

      router.replace({
        pathname: "/results",
        params: {
          audioUri: fileUri,
          targetText: targetText || "입력 문장 없음",
          recordingDuration: Math.floor(exactTime).toString(),
        },
      });
    } catch (error) {
      console.error("[RecordScreen] ❌ 녹음 중지 실패:", error);
      Alert.alert("오류", "녹음을 중지하는 데 실패했습니다.");
      setIsRecording(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topContent}>
        <Text variant="headlineSmall" style={styles.title}>
          목표 문장
        </Text>

        <View style={styles.karaokeWrapper}>
          <KaraokeText
            text={targetText || "문장을 가져오는 중..."}
            referenceTimings={referenceTimings}
            isPlaying={isRecording} // ✅ 카운트다운 중에는 false
            durationPerCharacter={DEFAULT_DURATION_PER_CHARACTER}
            textColor="#374151"
            fillColor={theme.colors.primary}
            fontSize={24}
          />
        </View>

        <Text variant="bodySmall" style={styles.autoStopInfo}>
          ⏰ {autoStopDuration.toFixed(1)}초 후 자동 종료
        </Text>

        {__DEV__ && (
          <Text variant="bodySmall" style={styles.debugInfo}>
            {referenceTimings
              ? `🎯 정밀 타이밍 (${estimatedTotalDuration.toFixed(1)}초)`
              : `⚡ 자동 타이밍 (${estimatedTotalDuration.toFixed(1)}초)`}
          </Text>
        )}
      </View>

      <View style={styles.feedbackContainer}>
        {/* ✅ 카운트다운 중 */}
        {isCountingDown ? (
          <>
            <Text
              variant="displayLarge"
              style={[styles.countdownText, { color: theme.colors.primary }]}
            >
              {countdown > 0 ? countdown : "시작!"}
            </Text>
            <Text variant="bodyLarge" style={styles.countdownHint}>
              준비하세요...
            </Text>
          </>
        ) : isRecording ? (
          <>
            <ActivityIndicator
              animating={true}
              color={theme.colors.error}
              size={120}
              style={styles.micIcon}
            />
            <Text
              variant="displaySmall"
              style={[styles.timer, { color: theme.colors.error }]}
            >
              {formatTime(timer)}
            </Text>
            <Text variant="bodyMedium" style={styles.remainingTime}>
              {Math.max(0, autoStopDuration - timer).toFixed(0)}초 후 자동 종료
            </Text>
            <Text variant="bodyLarge" style={styles.recordingHint}>
              문장을 따라 읽으세요...
            </Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="microphone-outline"
              size={120}
              color={theme.colors.primary}
              style={styles.micIcon}
            />
            <Text
              variant="displaySmall"
              style={[styles.timer, { color: theme.colors.primary }]}
            >
              {formatTime(timer)}
            </Text>
            <Text variant="bodyLarge" style={styles.recordingHint}>
              버튼을 눌러 녹음을 시작하세요.
            </Text>
          </>
        )}
      </View>

      <Button
        mode="contained"
        onPress={
          isRecording ? () => stopRecording(false) : startCountdown // ✅ 카운트다운 시작
        }
        style={styles.button}
        buttonColor={isRecording ? theme.colors.error : theme.colors.primary}
        icon={isRecording ? "stop" : "microphone"}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        disabled={!targetText || isCountingDown} // ✅ 카운트다운 중 비활성화
      >
        {isRecording ? "녹음 중지 및 분석" : "녹음 시작"}
      </Button>

      <Text
        variant="bodySmall"
        style={[styles.debugText, { paddingBottom: insets.bottom + 5 }]}
      >
        {Platform.OS === "android" ? "🤖 Android (WAV)" : "🍎 iOS (WAV)"}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topContent: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    marginBottom: 16,
    color: "#374151",
    fontWeight: "600",
  },
  karaokeWrapper: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
    justifyContent: "center",
  },
  autoStopInfo: {
    marginTop: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },
  debugInfo: {
    marginTop: 4,
    opacity: 0.6,
    fontStyle: "italic",
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  micIcon: {
    marginBottom: 20,
  },
  timer: {
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  remainingTime: {
    marginTop: 8,
    color: "#F59E0B",
    fontWeight: "500",
  },
  recordingHint: {
    marginTop: 10,
    color: "#6B7280",
  },
  // ✅ 카운트다운 스타일
  countdownText: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
  },
  countdownHint: {
    marginTop: 10,
    color: "#6B7280",
  },
  button: {
    width: "100%",
    borderRadius: 30,
    marginBottom: 40,
    elevation: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  debugText: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    opacity: 0.5,
  },
});
