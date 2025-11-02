// app/record.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
// ✅ expo-audio 올바른 임포트
import {
  AudioModule,
  RecordingOptions,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export default function RecordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const targetText = Array.isArray(params.text) ? params.text[0] : params.text;

  // ✅ expo-audio 훅 사용 (16kHz 커스텀 설정)
  const recordingOptions: RecordingOptions = {
    // 최상위 레벨 필수 속성들
    extension: ".m4a",
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,

    // 플랫폼별 추가 설정
    android: {
      outputFormat: "mpeg4",
      audioEncoder: "aac",
    },
    ios: {
      audioQuality: 96,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
      outputFormat: "mpeg4aac",
    },
    web: {
      mimeType: "audio/webm",
      bitsPerSecond: 256000,
    },
  };

  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);

  // 타이머 관련 상태
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. 권한 요청 및 초기 설정 ---
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("권한 필요", "녹음을 위해 마이크 접근 권한이 필요합니다.");
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

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

  // --- 2. 녹음 시작 및 중지 함수 ---
  async function startRecording() {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      startTimer(); // 타이머 시작
    } catch (err) {
      console.error("녹음 시작 실패:", err);
      Alert.alert("오류", "녹음을 시작하는 데 실패했습니다.");
      stopTimer();
    }
  }

  async function stopRecording() {
    try {
      stopTimer(); // 타이머 중지

      // 녹음 중지
      await audioRecorder.stop();

      const uri = audioRecorder.uri;

      if (uri) {
        console.log("녹음 파일 저장 경로:", uri);

        // 3. 결과 페이지로 이동 (녹음 파일 URI와 목표 문장 전달)
        router.replace({
          pathname: "/results",
          params: {
            audioUri: uri,
            targetText: targetText || "입력 문장 없음",
          },
        });
      } else {
        Alert.alert("오류", "녹음 파일 URI를 얻을 수 없습니다.");
      }
    } catch (err) {
      console.error("녹음 중지 실패:", err);
      Alert.alert("오류", "녹음을 중지하는 데 실패했습니다.");
    }
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      stopTimer();
      if (recorderState.isRecording) {
        audioRecorder.stop();
      }
    };
  }, [recorderState.isRecording]);

  // --- 3. UI 렌더링 ---
  return (
    <View
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
        {recorderState.isRecording ? (
          <>
            {/* 녹음 중 피드백: 애니메이션 및 타이머 */}
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
        onPress={recorderState.isRecording ? stopRecording : startRecording}
        style={styles.button}
        buttonColor={
          recorderState.isRecording ? theme.colors.error : theme.colors.primary
        }
        icon={recorderState.isRecording ? "stop" : "microphone"}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
        disabled={!targetText} // 목표 문장이 없으면 녹음 불가능
      >
        {recorderState.isRecording ? "녹음 중지 및 분석" : "녹음 시작"}
      </Button>
    </View>
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
});
