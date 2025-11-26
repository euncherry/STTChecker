/**
 * @file app/record.tsx
 * @description Recording screen with react-native-audio-record (WAV format)
 *
 * 🔄 REFACTORED:
 * - Uses feature-based imports (@/features/audio, @/features/karaoke)
 * - Improved type safety with navigation types
 * - Cleaner separation of concerns with custom hook
 *
 * ⚠️ IMPORTANT: WAV format recording
 * - Uses react-native-audio-record (not expo-audio)
 * - Wav2Vec2 model requires WAV format input
 * - expo-audio cannot record WAV (only m4a/aac)
 *
 * 📚 Key changes:
 * BEFORE: Direct AudioRecord.init() / AudioRecord.start() / AudioRecord.stop()
 * AFTER: useAudioRecording() hook with clean API (wraps AudioRecord)
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ✅ NEW: Feature-based imports
import KaraokeText from "@/components/KaraokeText";
import { useAudioRecording } from "@/features/audio";
import {
  DEFAULT_DURATION_PER_CHARACTER,
  getTimingPreset,
} from "@/features/karaoke";
import type { RecordScreenParams } from "@/types/navigation";

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  // ✅ Type-safe route params using generics
  const params = useLocalSearchParams<RecordScreenParams>();
  const targetText = Array.isArray(params.text) ? params.text[0] : params.text;

  // ✅ REFACTORED: Use custom audio recording hook (wraps react-native-audio-record)
  // This provides: state, permissions, startRecording, stopRecording
  const {
    state: recordingState,
    permissions,
    startRecording,
    stopRecording,
    requestPermissions,
    error: recordingError,
  } = useAudioRecording();

  // Local UI state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);

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
   * 🔍 Effect: Request permissions on mount
   *
   * Why this is better than the old approach:
   * - Declarative permission check
   * - Automatic cleanup
   * - Centralized permission logic in the hook
   */
  useEffect(() => {
    // Check and request permissions if needed
    if (permissions && !permissions.granted && permissions.canAskAgain) {
      requestPermissions();
    }

    return () => {
      stopTimer();
      clearAutoStopTimer();
    };
  }, [permissions]);

  /**
   * 🔍 Effect: Handle recording errors
   */
  useEffect(() => {
    if (recordingError) {
      Alert.alert("녹음 오류", recordingError);
    }
  }, [recordingError]);

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

    autoStopTimerRef.current = setTimeout(() => {
      console.log("[RecordScreen] ⏰ Auto-stopping recording");
      handleStopRecording(true);
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
   * ✅ REFACTORED: Start recording with custom hook
   *
   * 🔄 Before (direct react-native-audio-record):
   * ```tsx
   * AudioRecord.start();
   * ```
   *
   * 🆕 After (custom hook wrapping AudioRecord):
   * ```tsx
   * await startRecording();
   * ```
   *
   * 🎯 Benefits:
   * - Automatic permission handling
   * - Better error handling
   * - Type-safe API
   * - Automatic state management
   * - Feature-based architecture
   */
  const handleStartRecording = async () => {
    try {
      console.log("[RecordScreen] 🎙️ Starting recording...");

      // ✅ NEW: Single function call replaces AudioRecord.start()
      await startRecording();

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
   * ✅ REFACTORED: Stop recording with custom hook
   *
   * 🔄 Before (direct react-native-audio-record):
   * ```tsx
   * const audioFile = await AudioRecord.stop();
   * let fileUri = audioFile;
   * if (Platform.OS === "android" && !audioFile.startsWith("file://")) {
   *   fileUri = `file://${audioFile}`;
   * }
   * ```
   *
   * 🆕 After (custom hook wrapping AudioRecord):
   * ```tsx
   * const result = await stopRecording();
   * const fileUri = result.uri;  // Already properly formatted by hook
   * ```
   *
   * 🎯 Benefits:
   * - Platform-specific URI formatting handled in hook
   * - Returns structured result with metadata
   * - Automatic error handling
   * - Feature-based architecture
   */
  const handleStopRecording = async (isAutoStop = false) => {
    try {
      const exactTime = timer;
      stopTimer();
      clearAutoStopTimer();

      console.log(
        `[RecordScreen] 🛑 Stopping recording (${isAutoStop ? "auto" : "manual"})`
      );

      // ✅ NEW: stopRecording() returns RecordingResult with uri and duration
      const result = await stopRecording();

      if (!result) {
        throw new Error("Failed to get recording result");
      }

      console.log("[RecordScreen] 📁 Recording saved:", result.uri);
      console.log(
        "[RecordScreen] ⏱️ Duration:",
        result.duration.toFixed(2),
        "s"
      );

      // Navigate to results screen with recording data
      router.replace({
        pathname: "/results",
        params: {
          audioUri: result.uri, // ✅ Already properly formatted
          targetText: targetText || "입력 문장 없음",
          recordingDuration: Math.floor(result.duration).toString(),
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
            isPlaying={recordingState.isRecording}
            //{/* ✅ NEW: Use hook state */}
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
        ) : recordingState.isRecording ? (
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
          recordingState.isRecording
            ? () => handleStopRecording(false)
            : startCountdown
        }
        style={styles.button}
        buttonColor={
          recordingState.isRecording ? theme.colors.error : theme.colors.primary
        }
        icon={recordingState.isRecording ? "stop" : "microphone"}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        disabled={!targetText || isCountingDown || !recordingState.canRecord}
        // {/* ✅ NEW: Check canRecord */}
      >
        {recordingState.isRecording ? "녹음 중지 및 분석" : "녹음 시작"}
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
