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

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetText = Array.isArray(params.text) ? params.text[0] : params.text;

  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  // 1. 녹음 설정 초기화
  useEffect(() => {
    initializeRecording();
    return () => {
      stopTimer();
    };
  }, []);

  const initializeRecording = async () => {
    try {
      // ✅ react-native-audio-record 설정
      const options = {
        sampleRate: 16000, // ✅ 16kHz (모델 요구사항)
        channels: 1, // ✅ 모노
        bitsPerSample: 16, // ✅ 16bit
        audioSource: 6, // VOICE_RECOGNITION (Android)
        wavFile: `recording_${Date.now()}.wav`, // 고유한 파일명
      };

      console.log("[RecordScreen] 🎤 녹음 설정:", options);
      AudioRecord.init(options);

      // 권한 요청 (Platform별 처리)
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

  // 타이머 로직
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

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  // 2. 녹음 시작
  const startRecording = async () => {
    try {
      console.log("[RecordScreen] 🎙️ 녹음 시작...");

      // react-native-audio-record 녹음 시작
      AudioRecord.start();

      setIsRecording(true);
      startTimer();

      console.log("[RecordScreen] ✅ 녹음 시작됨");
    } catch (error) {
      console.error("[RecordScreen] ❌ 녹음 시작 실패:", error);
      Alert.alert("오류", "녹음을 시작하는 데 실패했습니다.");
      stopTimer();
    }
  };

  // 3. 녹음 중지 및 결과 페이지로 이동
  const stopRecording = async () => {
    try {
      stopTimer();
      console.log("[RecordScreen] 🛑 녹음 중지 중...");

      // ✅ WAV 파일 경로 받기
      const audioFile = await AudioRecord.stop();

      setIsRecording(false);

      console.log("[RecordScreen] 📁 WAV 파일 저장됨:", audioFile);
      console.log("[RecordScreen] ⏱️ 녹음 시간:", formatTime(timer));

      // Platform별 파일 경로 처리
      let fileUri = audioFile;
      if (Platform.OS === "android" && !audioFile.startsWith("file://")) {
        fileUri = `file://${audioFile}`;
      }

      console.log("[RecordScreen] 📍 최종 파일 URI:", fileUri);
      console.log("[RecordScreen] ✅ 녹음 설정 확인:");
      console.log("  - 샘플레이트: 16000Hz (모델 요구사항)");
      console.log("  - 채널: 1 (모노)");
      console.log("  - 비트 깊이: 16-bit PCM");
      console.log("  - 포맷: WAV");
      console.log("[RecordScreen] ℹ️ STT 전처리에서 다음 검증이 수행됩니다:");
      console.log("  1️⃣ 16kHz 리샘플링 (필요시)");
      console.log("  2️⃣ 모노 채널 변환 (필요시)");
      console.log("  3️⃣ Float32 정규화 (PCM → [-1.0, 1.0])");

      // 4. 결과 페이지로 이동
      router.replace({
        pathname: "/results",
        params: {
          audioUri: fileUri,
          targetText: targetText || "입력 문장 없음",
          recordingDuration: timer.toString(),
        },
      });
    } catch (error) {
      console.error("[RecordScreen] ❌ 녹음 중지 실패:", error);
      Alert.alert("오류", "녹음을 중지하는 데 실패했습니다.");
      setIsRecording(false);
    }
  };

  // UI 렌더링
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topContent}>
        <Text variant="headlineSmall" style={styles.title}>
          목표 문장
        </Text>
        <Text variant="titleMedium" style={styles.sentence}>
          {targetText || "문장을 가져오는 중..."}
        </Text>
      </View>

      <View style={styles.feedbackContainer}>
        {isRecording ? (
          <>
            {/* 녹음 중 피드백 */}
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
            <Text variant="bodyLarge" style={styles.recordingHint}>
              발음을 시작하세요...
            </Text>
          </>
        ) : (
          <>
            {/* 녹음 대기 상태 */}
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
        onPress={isRecording ? stopRecording : startRecording}
        style={styles.button}
        buttonColor={isRecording ? theme.colors.error : theme.colors.primary}
        icon={isRecording ? "stop" : "microphone"}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        disabled={!targetText}
      >
        {isRecording ? "녹음 중지 및 분석" : "녹음 시작"}
      </Button>

      {/* 디버깅용 플랫폼 표시 */}
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
    marginBottom: 8,
    color: "#374151",
  },
  sentence: {
    padding: 16,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    textAlign: "center",
    fontWeight: "bold",
    elevation: 2,
    lineHeight: 25,
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
  recordingHint: {
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
