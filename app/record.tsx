/**
 * @file app/record.tsx
 * @description 하이브리드 음성 인식 녹음 화면
 *
 * 🎯 하이브리드 방식:
 * - Android 13+/iOS: expo-speech-recognition (실시간 STT + WAV 녹음)
 * - Android 12-: react-native-audio-record (WAV 녹음만)
 *
 * 📊 결과:
 * - 실시간 STT: Google/Siri 자연어 처리 결과 (Android 13+/iOS만)
 * - WAV 파일: ONNX 모델용 16kHz 오디오
 *
 * ⚠️ IMPORTANT: WAV format recording
 * - Wav2Vec2 모델은 16kHz WAV 형식 입력 필요
 * - expo-speech-recognition: Android 13+ 기본 16kHz WAV
 * - react-native-audio-record: Android 12- 폴백용 16kHz WAV
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Text,
  useTheme,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Feature-based imports
import KaraokeText from "@/components/KaraokeText";
import {
  DEFAULT_DURATION_PER_CHARACTER,
  getTimingPreset,
} from "@/features/karaoke";
import {
  useHybridSpeechRecognition,
  useSpeechRecognition,
} from "@/features/speechRecognition";
import type { RecordScreenParams } from "@/types/navigation";

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  // Type-safe route params
  const params = useLocalSearchParams<RecordScreenParams>();
  const targetText = Array.isArray(params.text) ? params.text[0] : params.text;

  // 음성 인식 Context (플랫폼 기능 정보)
  const { canUseHybridMode, capabilities } = useSpeechRecognition();

  // 하이브리드 음성 인식 Hook
  const {
    status,
    realtimeTranscript,
    finalTranscript,
    audioUri,
    duration,
    error: recognitionError,
    startRecognition,
    stopRecognition,
    reset,
  } = useHybridSpeechRecognition();

  // Local UI state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 녹음 중 여부
  const isRecording = status === "recognizing";

  // Karaoke timing configuration
  const referenceTimings = targetText ? getTimingPreset(targetText) : undefined;

  // Calculate estimated duration for auto-stop
  const estimatedTotalDuration = React.useMemo(() => {
    if (!targetText) return 5;

    if (referenceTimings && referenceTimings.length > 0) {
      return Math.max(...referenceTimings.map((t) => t.end));
    } else {
      return targetText.length * DEFAULT_DURATION_PER_CHARACTER;
    }
  }, [targetText, referenceTimings]);

  const autoStopDuration = estimatedTotalDuration + 1;

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTimer();
      clearAutoStopTimer();
      reset();
    };
  }, []);

  /**
   * Effect: Handle recognition errors
   */
  useEffect(() => {
    if (recognitionError) {
      Alert.alert("녹음 오류", recognitionError);
    }
  }, [recognitionError]);

  /**
   * Timer management (unchanged from original)
   */
  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAutoStopTimer = () => {
    console.log(`[RecordScreen] ⏰ Auto-stop timer: ${autoStopDuration}s`);

    // autoStopTimerRef.current = setTimeout(() => {
    //   console.log("[RecordScreen] ⏰ Auto-stopping recording");
    //   handleStopRecording(true);
    // }, autoStopDuration * 1000);
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

  /**
   * ✅ NEW: Countdown logic (unchanged but documented)
   */
  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setIsCountingDown(false);
            handleStartRecording();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * 녹음 시작 (하이브리드 방식)
   *
   * Android 13+/iOS: expo-speech-recognition (실시간 STT + WAV 녹음)
   * Android 12-: react-native-audio-record (WAV 녹음만)
   */
  const handleStartRecording = async () => {
    try {
      console.log("[RecordScreen] 🎙️ Starting recording...");
      console.log("[RecordScreen] Hybrid mode:", canUseHybridMode);

      await startRecognition();

      startTimer();
      startAutoStopTimer();

      console.log("[RecordScreen] ✅ Recording started");
    } catch (error) {
      console.error("[RecordScreen] ❌ Failed to start recording:", error);
      Alert.alert("오류", "녹음을 시작하는 데 실패했습니다.");
      stopTimer();
      clearAutoStopTimer();
    }
  };

  /**
   * 녹음 중지 (하이브리드 방식)
   *
   * 결과:
   * - audioUri: WAV 파일 경로 (ONNX 처리용)
   * - realtimeTranscript: 실시간 STT 결과 (Android 13+/iOS만)
   */
  const handleStopRecording = async (isAutoStop = false) => {
    try {
      const exactTime = timer;
      stopTimer();
      clearAutoStopTimer();

      console.log(
        `[RecordScreen] 🛑 Stopping recording (${isAutoStop ? "auto" : "manual"})`
      );

      const result = await stopRecognition();

      console.log("[RecordScreen] 📁 Recording saved:", result.audioUri);
      console.log(
        "[RecordScreen] ⏱️ Duration:",
        result.duration.toFixed(2),
        "s"
      );
      console.log(
        "[RecordScreen] 📝 Realtime transcript:",
        result.realtimeTranscript
      );

      if (!result.audioUri) {
        throw new Error("Failed to get audio file");
      }

      // 결과 화면으로 이동
      router.replace({
        pathname: "/results",
        params: {
          audioUri: result.audioUri,
          targetText: targetText || "입력 문장 없음",
          recordingDuration: Math.floor(result.duration).toString(),
          // 실시간 STT 결과 전달 (Android 13+/iOS만)
          realtimeTranscript: result.realtimeTranscript || "",
        },
      });
    } catch (error) {
      console.error("[RecordScreen] ❌ Failed to stop recording:", error);
      Alert.alert("오류", "녹음을 중지하는 데 실패했습니다.");
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
            isPlaying={isRecording}
            durationPerCharacter={DEFAULT_DURATION_PER_CHARACTER}
            textColor="#374151"
            fillColor={theme.colors.primary}
            fontSize={24}
          />
        </View>

        <Text variant="bodySmall" style={styles.autoStopInfo}>
          ⏰ {autoStopDuration.toFixed(1)}초 후 자동 종료
        </Text>

        {/* 하이브리드 모드 표시 */}
        <View style={styles.modeChipContainer}>
          {canUseHybridMode ? (
            <Chip icon="microphone" compact style={styles.modeChip}>
              실시간 음성 인식
            </Chip>
          ) : (
            <Chip icon="microphone-off" compact style={styles.modeChipDisabled}>
              녹음 전용 모드
            </Chip>
          )}
        </View>

        {__DEV__ && (
          <Text variant="bodySmall" style={styles.debugInfo}>
            {referenceTimings
              ? `🎯 정밀 타이밍 (${estimatedTotalDuration.toFixed(1)}초)`
              : `⚡ 자동 타이밍 (${estimatedTotalDuration.toFixed(1)}초)`}
          </Text>
        )}
      </View>

      <View style={styles.feedbackContainer}>
        {/* Countdown UI */}
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

            {/* 실시간 STT 결과 표시 (Android 13+/iOS) */}
            {canUseHybridMode ? (
              <View style={styles.realtimeTranscriptContainer}>
                <Text variant="labelSmall" style={styles.realtimeLabel}>
                  실시간 인식 결과
                </Text>
                <Text variant="bodyLarge" style={styles.realtimeTranscript}>
                  {realtimeTranscript || finalTranscript || "말씀해 주세요..."}
                </Text>
              </View>
            ) : (
              <View style={styles.realtimeTranscriptContainer}>
                <MaterialCommunityIcons
                  name="android"
                  size={20}
                  color="#9CA3AF"
                />
                <Text variant="bodySmall" style={styles.noRealtimeMessage}>
                  Android 13 이상에서 실시간 인식이 표시됩니다
                </Text>
              </View>
            )}
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
          isRecording ? () => handleStopRecording(false) : startCountdown
        }
        style={styles.button}
        buttonColor={isRecording ? theme.colors.error : theme.colors.primary}
        icon={isRecording ? "stop" : "microphone"}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        disabled={!targetText || isCountingDown || status === "starting"}
      >
        {isRecording ? "녹음 중지 및 분석" : "녹음 시작"}
      </Button>

      <Text
        variant="bodySmall"
        style={[styles.debugText, { paddingBottom: insets.bottom + 5 }]}
      >
        {Platform.OS === "android"
          ? `🤖 Android ${capabilities?.androidApiLevel || ""} (WAV)`
          : "🍎 iOS (WAV)"}
        {canUseHybridMode ? " + 실시간 STT" : ""}
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
  modeChipContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
  modeChip: {
    backgroundColor: "#E8F5E9",
  },
  modeChipDisabled: {
    backgroundColor: "#F3F4F6",
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
  realtimeTranscriptContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    minHeight: 80,
  },
  realtimeLabel: {
    color: "#9CA3AF",
    marginBottom: 8,
  },
  realtimeTranscript: {
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  noRealtimeMessage: {
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
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
