// app/(tabs)/test.tsx
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomHeader from "../../components/CustomHeader";
import WaveSurferWebView from "../../components/WaveSurferWebView";
import { useONNX } from "../../utils/onnx/onnxContext";
import { preprocessAudioFile } from "../../utils/stt/audioPreprocessor";
import { runSTTInference } from "../../utils/stt/inference";

export default function TestScreen() {
  const theme = useTheme();
  const { modelInfo, vocabInfo, isLoading: modelLoading } = useONNX();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [showGraphs, setShowGraphs] = useState(false); // 그래프 표시 여부

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0].uri);
        setResult(null);
        console.log("✅ 파일 선택:", result.assets[0].name);
      }
    } catch (error) {
      console.error("파일 선택 에러:", error);
      Alert.alert("오류", "파일 선택 중 오류가 발생했습니다.");
    }
  };

  const processAudio = async () => {
    if (!selectedFile) {
      Alert.alert("알림", "먼저 오디오 파일을 선택해주세요.");
      return;
    }

    if (!modelInfo || !vocabInfo) {
      Alert.alert("알림", "모델이 아직 로딩 중입니다.");
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      console.log("🎤 STT 처리 시작...");

      // 1. 오디오 전처리
      console.log("1️⃣ 오디오 전처리 중...");
      const audioData = await preprocessAudioFile(selectedFile);
      console.log(`✅ 전처리 완료: ${audioData.length} samples`);

      // 2. ONNX 추론
      console.log("2️⃣ ONNX 추론 실행 중...");
      const transcription = await runSTTInference(
        modelInfo.session,
        audioData,
        vocabInfo,
        modelInfo.inputName,
        modelInfo.outputName
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setProcessingTime(parseFloat(elapsed));
      setResult(transcription);

      console.log(`✅ STT 완료! 결과: "${transcription}"`);
      console.log(`⏱️ 처리 시간: ${elapsed}초`);
    } catch (error) {
      console.error("❌ STT 처리 실패:", error);
      Alert.alert(
        "오류",
        `처리 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (modelLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>모델 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <CustomHeader title="ONNX 모델 테스트" />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView style={styles.container}>
          <Card style={styles.card}>
            <Card.Title title="🤖 ONNX 모델 테스트" />
            <Card.Content>
              <Text variant="bodyMedium" style={styles.description}>
                WAV 파일을 선택하여 한국어 음성인식(STT)을 테스트하세요.
              </Text>

              <View style={styles.section}>
                <Button
                  mode="contained"
                  onPress={pickAudioFile}
                  icon="file-music"
                  style={styles.button}
                >
                  오디오 파일 선택
                </Button>

                {selectedFile && (
                  <View style={styles.fileInfo}>
                    <Text variant="bodySmall" style={styles.fileText}>
                      📁 선택된 파일:
                    </Text>
                    <Text variant="bodySmall" numberOfLines={2}>
                      {selectedFile.split("/").pop()}
                    </Text>
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />

              <Button
                mode="contained"
                onPress={processAudio}
                icon="play"
                disabled={!selectedFile || isProcessing}
                loading={isProcessing}
                style={styles.button}
              >
                {isProcessing ? "처리 중..." : "STT 실행"}
              </Button>
            </Card.Content>
          </Card>

          {result && (
            <>
              <Card style={styles.card}>
                <Card.Title title="✅ 인식 결과" />
                <Card.Content>
                  <View style={styles.resultBox}>
                    <Text variant="titleLarge" style={styles.resultText}>
                      {result}
                    </Text>
                  </View>
                  <Text
                    variant="bodySmall"
                    style={[styles.timeText, { color: theme.colors.primary }]}
                  >
                    ⏱️ 처리 시간: {processingTime}초
                  </Text>
                </Card.Content>
              </Card>

              {/* 음성 분석 그래프 카드 */}
              <Card style={styles.card}>
                <Card.Title
                  title="📊 음성 분석 그래프"
                  subtitle="파형, 음정, 주파수 스펙트럼 분석"
                />
                <Card.Content>
                  <Button
                    mode={showGraphs ? "outlined" : "contained"}
                    onPress={() => setShowGraphs(!showGraphs)}
                    icon={showGraphs ? "chevron-up" : "chart-line"}
                    style={styles.button}
                  >
                    {showGraphs ? "그래프 숨기기" : "그래프 보기"}
                  </Button>

                  {showGraphs && selectedFile && (
                    <View style={styles.graphContainer}>
                      <WaveSurferWebView
                        userAudioPath={selectedFile}
                        onReady={() => {
                          console.log(
                            "[TestScreen] ✅ WaveSurfer 그래프 준비 완료"
                          );
                        }}
                        onError={(error) => {
                          console.error("[TestScreen] ❌ WaveSurfer 에러:", error);
                          Alert.alert("그래프 오류", error);
                        }}
                      />
                    </View>
                  )}

                  {showGraphs && !selectedFile && (
                    <View style={styles.graphPlaceholder}>
                      <Text variant="bodyMedium" style={styles.placeholderText}>
                        ⚠️ 오디오 파일이 없습니다
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </>
          )}

          {!modelInfo && (
            <Card
              style={[
                styles.card,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Card.Content>
                <Text style={{ color: theme.colors.error }}>
                  ⚠️ 모델이 로드되지 않았습니다.
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#E8E6FF",
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  fileInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  fileText: {
    marginBottom: 4,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 16,
  },
  resultBox: {
    padding: 16,
    backgroundColor: "rgba(0,128,0,0.1)",
    borderRadius: 8,
    marginBottom: 12,
  },
  resultText: {
    fontWeight: "bold",
  },
  timeText: {
    textAlign: "right",
    marginTop: 8,
  },
  graphContainer: {
    marginTop: 16,
    height: 500, // 그래프를 표시하기 위한 충분한 높이
    borderRadius: 8,
    overflow: "hidden",
  },
  graphPlaceholder: {
    marginTop: 16,
    padding: 32,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    opacity: 0.6,
  },
});
