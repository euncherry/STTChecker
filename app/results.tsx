// app/results.tsx
import type { ResultsScreenParams } from "@/types/navigation";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import WaveSurferWebView from "../components/WaveSurferWebView";
import { useONNX } from "../utils/onnx/onnxContext";
import { saveHistory } from "../utils/storage/historyManager";
import { preprocessAudioFile } from "../utils/stt/audioPreprocessor";
import { runSTTInference } from "../utils/stt/inference";
import { calculateCER, calculateWER, calculateFinalScore } from "../utils/stt/metrics";

// 점수에 따른 별점 계산 (0~5개)
const getStarRating = (score: number): { filled: number; empty: number } => {
  const stars = Math.round(score / 20); // 0~100점 → 0~5개
  return { filled: Math.min(5, Math.max(0, stars)), empty: 5 - Math.min(5, Math.max(0, stars)) };
};

export default function ResultsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<ResultsScreenParams>();
  const { modelInfo, vocabInfo, isLoading: modelLoading } = useONNX();

  // 파라미터 추출
  const audioUri = Array.isArray(params.audioUri)
    ? params.audioUri[0]
    : params.audioUri;
  const targetText = Array.isArray(params.targetText)
    ? params.targetText[0]
    : params.targetText;
  const recordingDuration = Array.isArray(params.recordingDuration)
    ? params.recordingDuration[0]
    : params.recordingDuration;
  const realtimeTranscript = Array.isArray(params.realtimeTranscript)
    ? params.realtimeTranscript[0]
    : params.realtimeTranscript;

  // 플랫폼별 음성인식 엔진 이름
  const nativeSTTEngineName =
    Platform.OS === "ios" ? "Siri 발음인식" : "Google 발음인식";

  // ✅ 오디오 플레이어 추가
  const audioPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  // ✅ 실시간 재생 상태 추적 (UI 업데이트를 위해 필수)
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  // ONNX 모델 기반 CER/WER
  const [cerScore, setCerScore] = useState<number | null>(null);
  const [werScore, setWerScore] = useState<number | null>(null);
  // 네이티브 STT (Google/Siri) 기반 CER/WER
  const [nativeCerScore, setNativeCerScore] = useState<number | null>(null);
  const [nativeWerScore, setNativeWerScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showGraphs, setShowGraphs] = useState(false); // 그래프 표시 여부

  // 컴포넌트 마운트 시 STT 처리
  useEffect(() => {
    if (audioUri && modelInfo && vocabInfo && !modelLoading) {
      processAudio();
    }
  }, [audioUri, modelInfo, vocabInfo, modelLoading]);

  const processAudio = async () => {
    if (!audioUri || !modelInfo || !vocabInfo) {
      console.error("[ResultsScreen] 필수 데이터 누락");
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      console.log("========================================");
      console.log("[ResultsScreen] 🎤 STT 처리 시작");
      console.log("[ResultsScreen] 📁 오디오 파일:", audioUri);
      console.log("[ResultsScreen] 📝 목표 문장:", targetText);
      console.log("[ResultsScreen] ⏱️ 녹음 시간:", recordingDuration, "초");
      console.log("========================================");

      // 1. 오디오 전처리
      console.log("[ResultsScreen] 1️⃣ 오디오 전처리 중...");
      const audioData = await preprocessAudioFile(audioUri);
      console.log(
        `[ResultsScreen] ✅ 전처리 완료: ${audioData.length} samples`
      );

      // 2. ONNX 추론
      console.log("[ResultsScreen] 2️⃣ ONNX 추론 실행 중...");
      const transcription = await runSTTInference(
        modelInfo.session,
        audioData,
        vocabInfo,
        modelInfo.inputName,
        modelInfo.outputName
      );

      setRecognizedText(transcription);

      // 3. 평가 메트릭 계산
      if (targetText && targetText !== "입력 문장 없음") {
        // ONNX 모델 기반 CER/WER
        const cer = calculateCER(targetText, transcription);
        const wer = calculateWER(targetText, transcription);
        setCerScore(cer);
        setWerScore(wer);

        console.log("[ResultsScreen] 📊 ONNX 모델 평가 결과:");
        console.log(`  - CER: ${(cer * 100).toFixed(1)}%`);
        console.log(`  - WER: ${(wer * 100).toFixed(1)}%`);

        // 네이티브 STT (Google/Siri) 기반 CER/WER
        if (realtimeTranscript) {
          const nativeCer = calculateCER(targetText, realtimeTranscript);
          const nativeWer = calculateWER(targetText, realtimeTranscript);
          setNativeCerScore(nativeCer);
          setNativeWerScore(nativeWer);

          console.log("[ResultsScreen] 📊 네이티브 STT 평가 결과:");
          console.log(`  - Native CER: ${(nativeCer * 100).toFixed(1)}%`);
          console.log(`  - Native WER: ${(nativeWer * 100).toFixed(1)}%`);
        } else {
          // 네이티브 인식 결과 없음 → 100% 오류
          setNativeCerScore(1.0);
          setNativeWerScore(1.0);
          console.log("[ResultsScreen] ⚠️ 네이티브 STT 결과 없음 → CER/WER 100%");
        }

        // 자동 태그 제안
        suggestAutoTags(cer, wer);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setProcessingTime(parseFloat(elapsed));

      console.log("========================================");
      console.log(`[ResultsScreen] ✅ STT 완료!`);
      console.log(`[ResultsScreen] 📝 인식 결과: "${transcription}"`);
      console.log(`[ResultsScreen] ⏱️ 처리 시간: ${elapsed}초`);
      console.log("========================================");
    } catch (error) {
      console.error("[ResultsScreen] ❌ STT 처리 실패:", error);
      Alert.alert(
        "오류",
        `음성 인식 처리 중 오류가 발생했습니다:\n${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestAutoTags = (cer: number, wer: number) => {
    const autoTags: string[] = [];

    if (cer < 0.1) autoTags.push("완벽함");
    else if (cer < 0.2) autoTags.push("우수");
    else if (cer < 0.3) autoTags.push("양호");
    else autoTags.push("연습필요");

    if (wer > 0.3) autoTags.push("단어연습");

    setTags(autoTags);
  };

  // ✅ 재생/일시정지 토글
  const togglePlayback = () => {
    console.log("========================================");
    console.log("[AudioPlayer] 🎵 재생 토글 요청");
    // console.log("[AudioPlayer] 현재 상태:", {
    //   playing: playerStatus.playing,
    //   paused: playerStatus.playbackState === "paused",
    //   currentTime: playerStatus.currentTime,
    //   duration: playerStatus.duration,
    // });

    if (playerStatus.playing) {
      console.log("[AudioPlayer] ⏸️ 일시정지");
      audioPlayer.pause();
    } else {
      // 끝까지 재생된 경우 처음부터 재생
      if (
        playerStatus.duration &&
        playerStatus.currentTime >= playerStatus.duration - 0.1
      ) {
        console.log("[AudioPlayer] 🔄 끝까지 재생됨 → 처음부터 재생");
        audioPlayer.seekTo(0);
      }
      console.log("[AudioPlayer] ▶️ 재생 시작");
      audioPlayer.play();
    }
    console.log("========================================");
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const saveToHistory = async () => {
    if (
      !recognizedText ||
      cerScore === null ||
      werScore === null ||
      !audioUri
    ) {
      Alert.alert("알림", "저장할 데이터가 부족합니다.");
      return;
    }

    // ✅ 로딩 상태 추가
    setIsProcessing(true);

    try {
      console.log("[ResultsScreen] 💾 히스토리 저장 시작...");

      // 히스토리 메타데이터 저장
      const savedItem = await saveHistory({
        targetText: targetText || "",
        recognizedText,
        audioFilePath: audioUri,
        cerScore,
        werScore,
        // 네이티브 STT 데이터 추가
        nativeRecognizedText: realtimeTranscript || undefined,
        nativeCerScore: nativeCerScore ?? undefined,
        nativeWerScore: nativeWerScore ?? undefined,
        tags,
        recordingDuration: parseInt(recordingDuration || "0"),
        processingTime,
      });

      console.log("[ResultsScreen] ✅ 히스토리 저장 완료:", savedItem.id);

      Alert.alert("저장 완료", "연습 기록이 저장되었습니다.", [
        {
          text: "히스토리 보기",
          onPress: () => router.push("/(tabs)/history"),
        },
        {
          text: "확인",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("[ResultsScreen] ❌ 저장 실패:", error);
      Alert.alert(
        "저장 실패",
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 로딩 화면
  if (modelLoading || isProcessing) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {modelLoading ? "모델 로딩 중..." : "음성 분석 중..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ✅ 녹음 파일 재생 카드 (맨 위에 추가) */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="🎧 녹음 파일 확인"
            subtitle="녹음이 제대로 되었는지 확인하세요"
          />
          <Card.Content>
            <View style={styles.audioControls}>
              <Button
                mode="contained-tonal"
                onPress={togglePlayback}
                icon={playerStatus.playing ? "pause" : "play"}
                disabled={!audioUri}
                style={styles.playButton}
              >
                {playerStatus.playing ? "일시정지" : "녹음 듣기"}
              </Button>

              {playerStatus.playing && (
                <View style={styles.playingIndicator}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text variant="bodySmall" style={styles.playingText}>
                    재생 중...
                  </Text>
                </View>
              )}
            </View>

            {audioUri && (
              <View style={styles.fileInfo}>
                <Text variant="bodySmall" style={styles.fileLabel}>
                  📁 파일 정보:
                </Text>
                <Text variant="bodySmall" numberOfLines={2}>
                  {audioUri.split("/").pop()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 🏆 최종 점수 카드 */}
        {cerScore !== null && nativeCerScore !== null && nativeWerScore !== null && (() => {
          // 최종 점수 계산: ONNX CER (발음) + NLP CER/WER (의미 전달 + 패널티)
          const finalScore = calculateFinalScore(cerScore, nativeCerScore, nativeWerScore);
          const { filled, empty } = getStarRating(finalScore);
          return (
            <Card style={styles.finalScoreCard} mode="elevated">
              <LinearGradient
                colors={["#EADDFF", "#F3EDFF", "#FAF8FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.finalScoreGradient}
              >
                <Text style={styles.finalScoreLabel}>최종 점수</Text>
                <Text style={styles.finalScoreValue}>{finalScore}점</Text>
                <View style={styles.starContainer}>
                  <Text style={styles.starText}>
                    {"★".repeat(filled)}{"☆".repeat(empty)}
                  </Text>
                </View>
                <Text style={styles.finalScoreSubtext}>
                  발음 정확도 종합 평가
                </Text>
              </LinearGradient>
            </Card>
          );
        })()}

        {/* 점수 카드 */}
        {cerScore !== null && werScore !== null && (
          <Card style={styles.card} mode="elevated">
            <Card.Title title="🧠 ONNX 모델 정확도" titleStyle={styles.scoreCardTitle} />
            <Card.Content style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text variant="headlineLarge" style={styles.score}>
                  {((1 - cerScore) * 100).toFixed(0)}점
                </Text>
                <Text variant="labelLarge">문자 정확도</Text>
                <Text variant="bodySmall" style={styles.scoreDetail}>
                  CER: {(cerScore * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text variant="headlineLarge" style={styles.score}>
                  {((1 - werScore) * 100).toFixed(0)}점
                </Text>
                <Text variant="labelLarge">단어 정확도</Text>
                <Text variant="bodySmall" style={styles.scoreDetail}>
                  WER: {(werScore * 100).toFixed(1)}%
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 네이티브 STT 점수 카드 */}
        {nativeCerScore !== null && nativeWerScore !== null && (
          <Card style={styles.card} mode="elevated">
            <Card.Title
              title={Platform.OS === "ios" ? "🍎 Siri 발음인식 정확도" : "🤖 Google 발음인식 정확도"}
              titleStyle={styles.scoreCardTitle}
            />
            <Card.Content style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text variant="headlineLarge" style={styles.score}>
                  {((1 - nativeCerScore) * 100).toFixed(0)}점
                </Text>
                <Text variant="labelLarge">문자 정확도</Text>
                <Text variant="bodySmall" style={styles.scoreDetail}>
                  CER: {(nativeCerScore * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text variant="headlineLarge" style={styles.score}>
                  {((1 - nativeWerScore) * 100).toFixed(0)}점
                </Text>
                <Text variant="labelLarge">단어 정확도</Text>
                <Text variant="bodySmall" style={styles.scoreDetail}>
                  WER: {(nativeWerScore * 100).toFixed(1)}%
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 문장 비교 카드 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium">📝 목표 문장</Text>
            <Text variant="bodyLarge" style={styles.sentence}>
              {targetText}
            </Text>

            <View style={styles.divider} />

            {/* 네이티브 음성인식 결과 (Google/Siri) */}
            <View style={styles.sttResultHeader}>
              <Text variant="titleMedium">
                {Platform.OS === "ios" ? "🍎" : "🤖"} {nativeSTTEngineName}
              </Text>
              <Chip compact style={styles.engineChip}>
                {Platform.OS === "ios" ? "iOS" : "Android"} 내장
              </Chip>
            </View>
            <Text
              variant="bodyLarge"
              style={[
                styles.sentence,
                realtimeTranscript ? {} : styles.emptySentence,
              ]}
            >
              {realtimeTranscript || "실시간 인식 결과 없음"}
            </Text>

            <View style={styles.divider} />

            {/* ONNX 모델 기반 인식 결과 */}
            <View style={styles.sttResultHeader}>
              <Text variant="titleMedium">🧠 ONNX 모델 기반 인식결과</Text>
              <Chip compact style={styles.engineChipOnnx}>
                Wav2Vec2
              </Chip>
            </View>
            <Text
              variant="bodyLarge"
              style={[
                styles.sentence,
                recognizedText ? {} : styles.emptySentence,
              ]}
            >
              {recognizedText === null
                ? "처리 중..."
                : recognizedText === ""
                  ? "ONNX 인식 결과 없음"
                  : recognizedText}
            </Text>
          </Card.Content>
        </Card>

        {/* 음성 분석 그래프 카드 */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="📊 음성 분석 그래프"
            subtitle="파형, 음정, 주파수 스펙트럼 분석"
          />
          <Card.Content>
            <Button
              mode={showGraphs ? "outlined" : "contained"}
              onPress={() => setShowGraphs(!showGraphs)}
              icon={showGraphs ? "chevron-up" : "chart-line"}
              style={styles.graphToggleButton}
            >
              {showGraphs ? "그래프 숨기기" : "그래프 보기"}
            </Button>

            {showGraphs && audioUri && (
              <View style={styles.graphContainer}>
                <WaveSurferWebView
                  userAudioPath={audioUri}
                  onReady={() => {
                    console.log(
                      "[ResultsScreen] ✅ WaveSurfer 그래프 준비 완료"
                    );
                  }}
                  onError={(error) => {
                    console.error("[ResultsScreen] ❌ WaveSurfer 에러:", error);
                    Alert.alert("그래프 오류", error);
                  }}
                />
              </View>
            )}

            {showGraphs && !audioUri && (
              <View style={styles.graphPlaceholder}>
                <Text variant="bodyMedium" style={styles.placeholderText}>
                  ⚠️ 오디오 파일이 없습니다
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 태그 카드 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.tagTitle}>
              🏷️ 태그
            </Text>

            <View style={styles.chipContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => removeTag(tag)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {tag}
                </Chip>
              ))}
            </View>

            <View style={styles.tagInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="태그 추가"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                style={styles.tagInput}
                dense
              />
              <Button
                mode="contained-tonal"
                onPress={addTag}
                style={styles.addButton}
              >
                추가
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 처리 시간 */}
        {processingTime > 0 && (
          <Text variant="bodySmall" style={styles.processingTime}>
            ⏱️ 처리 시간: {processingTime}초
          </Text>
        )}

        {/* 버튼들 */}
        <Button
          mode="contained"
          onPress={saveToHistory}
          style={styles.button}
          disabled={!recognizedText}
        >
          히스토리에 저장
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.button}
        >
          다시 녹음하기
        </Button>

        <Button
          mode="text"
          onPress={() => router.push("/(tabs)")}
          style={styles.button}
        >
          홈으로
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  // ✅ 오디오 재생 관련 스타일
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  playButton: {
    flex: 1,
  },
  playingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playingText: {
    opacity: 0.7,
  },
  fileInfo: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginTop: 8,
  },
  fileLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  // 기존 스타일들
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  scoreBox: {
    alignItems: "center",
  },
  score: {
    fontWeight: "bold",
  },
  scoreDetail: {
    opacity: 0.7,
    marginTop: 4,
  },
  scoreCardTitle: {
    fontSize: 16,
  },
  sentence: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    lineHeight: 24,
  },
  emptySentence: {
    opacity: 0.5,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  sttResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  engineChip: {
    backgroundColor: "#E3F2FD",
  },
  engineChipOnnx: {
    backgroundColor: "#FFF3E0",
  },
  tagTitle: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginBottom: 4,
    minHeight: 28,
    maxHeight: 36,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tagInputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 4,
  },
  processingTime: {
    textAlign: "center",
    opacity: 0.7,
    marginVertical: 8,
  },
  button: {
    marginTop: 10,
  },
  graphToggleButton: {
    marginBottom: 12,
  },
  graphContainer: {
    height: 420,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  graphPlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  placeholderText: {
    opacity: 0.7,
  },
  // 🏆 최종 점수 스타일 (theme.ts 보라색 테마 기반)
  finalScoreCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6A00FF", // primary
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  finalScoreGradient: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  finalScoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6A00FF", // primary
    marginBottom: 4,
    letterSpacing: 1,
  },
  finalScoreValue: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#21005D", // onPrimaryContainer (진한 보라)
    letterSpacing: -1,
  },
  starContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  starText: {
    fontSize: 24,
    color: "#FBBF24", // 골드 (별점은 노란색 유지)
    letterSpacing: 4,
  },
  finalScoreSubtext: {
    fontSize: 13,
    color: "#49454F", // onSurfaceVariant
    marginTop: 4,
  },
});
