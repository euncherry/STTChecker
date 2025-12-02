// app/results.tsx
import type { ResultsScreenParams } from "@/types/navigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  ProgressBar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import WaveSurferWebView from "../components/WaveSurferWebView";
import { useONNX } from "../utils/onnx/onnxContext";
import { saveHistory } from "../utils/storage/historyManager";
import { preprocessAudioFile } from "../utils/stt/audioPreprocessor";
import { runSTTInference } from "../utils/stt/inference";
import { calculateCER, calculateWER } from "../utils/stt/metrics";

/**
 * 점수에 따른 색상 반환
 */
const getScoreColor = (accuracy: number): string => {
  if (accuracy >= 90) return "#4CAF50"; // 초록
  if (accuracy >= 70) return "#8BC34A"; // 연두
  if (accuracy >= 50) return "#FFC107"; // 노랑
  if (accuracy >= 30) return "#FF9800"; // 주황
  return "#F44336"; // 빨강
};

/**
 * 점수에 따른 등급 텍스트 반환
 */
const getScoreGrade = (accuracy: number): string => {
  if (accuracy >= 90) return "완벽해요!";
  if (accuracy >= 70) return "훌륭해요!";
  if (accuracy >= 50) return "좋아요!";
  if (accuracy >= 30) return "조금 더!";
  return "연습해요!";
};

/**
 * 점수에 따른 이모지 반환
 */
const getScoreEmoji = (accuracy: number): string => {
  if (accuracy >= 90) return "🎉";
  if (accuracy >= 70) return "😊";
  if (accuracy >= 50) return "👍";
  if (accuracy >= 30) return "💪";
  return "📚";
};

/**
 * 원형 점수 표시 컴포넌트
 */
const CircularScore = ({
  score,
  label,
  sublabel,
  size = 100,
}: {
  score: number;
  label: string;
  sublabel: string;
  size?: number;
}) => {
  const accuracy = Math.round((1 - score) * 100);
  const color = getScoreColor(accuracy);

  return (
    <View style={[styles.circularScoreContainer, { width: size + 20 }]}>
      <Surface style={[styles.circularScore, { width: size, height: size, borderColor: color }]} elevation={2}>
        <Text style={[styles.circularScoreText, { color, fontSize: size * 0.3 }]}>
          {accuracy}%
        </Text>
      </Surface>
      <Text variant="labelLarge" style={styles.circularScoreLabel}>
        {label}
      </Text>
      <Text variant="bodySmall" style={styles.circularScoreSublabel}>
        {sublabel}: {(score * 100).toFixed(1)}%
      </Text>
    </View>
  );
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

  // 오디오 플레이어
  const audioPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [cerScore, setCerScore] = useState<number | null>(null);
  const [werScore, setWerScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showGraphs, setShowGraphs] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
      setProcessingStep("오디오 분석 중...");
      console.log("[ResultsScreen] 1️⃣ 오디오 전처리 중...");
      const audioData = await preprocessAudioFile(audioUri);
      console.log(
        `[ResultsScreen] ✅ 전처리 완료: ${audioData.length} samples`
      );

      // 2. ONNX 추론
      setProcessingStep("AI 모델 추론 중...");
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
      setProcessingStep("점수 계산 중...");
      if (targetText && targetText !== "입력 문장 없음") {
        const cer = calculateCER(targetText, transcription);
        const wer = calculateWER(targetText, transcription);

        setCerScore(cer);
        setWerScore(wer);

        console.log("[ResultsScreen] 📊 평가 결과:");
        console.log(`  - CER: ${(cer * 100).toFixed(1)}%`);
        console.log(`  - WER: ${(wer * 100).toFixed(1)}%`);

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
      setProcessingStep("");
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

  // 재생/일시정지 토글
  const togglePlayback = () => {
    if (playerStatus.playing) {
      audioPlayer.pause();
    } else {
      if (
        playerStatus.duration &&
        playerStatus.currentTime >= playerStatus.duration - 0.1
      ) {
        audioPlayer.seekTo(0);
      }
      audioPlayer.play();
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
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

    setIsProcessing(true);
    setProcessingStep("저장 중...");

    try {
      console.log("[ResultsScreen] 💾 히스토리 저장 시작...");

      const savedItem = await saveHistory({
        targetText: targetText || "",
        recognizedText,
        audioFilePath: audioUri,
        cerScore,
        werScore,
        tags,
        recordingDuration: parseInt(recordingDuration || "0"),
        processingTime,
      });

      console.log("[ResultsScreen] ✅ 히스토리 저장 완료:", savedItem.id);
      setIsSaved(true);

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
      setProcessingStep("");
    }
  };

  // 종합 점수 계산
  const overallAccuracy =
    cerScore !== null && werScore !== null
      ? Math.round((1 - (cerScore + werScore) / 2) * 100)
      : null;

  // 로딩 화면
  if (modelLoading || isProcessing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centerContainer]}>
          <Surface style={styles.loadingCard} elevation={3}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.loadingTitle}>
              {modelLoading ? "AI 모델 준비 중" : "음성 분석 중"}
            </Text>
            <Text variant="bodyMedium" style={styles.loadingStep}>
              {processingStep || "잠시만 기다려주세요..."}
            </Text>
            <ProgressBar
              indeterminate
              style={styles.loadingProgress}
              color={theme.colors.primary}
            />
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 종합 점수 헤더 */}
        {overallAccuracy !== null && (
          <Surface style={styles.headerCard} elevation={4}>
            <View style={styles.headerContent}>
              <Text style={styles.headerEmoji}>
                {getScoreEmoji(overallAccuracy)}
              </Text>
              <View style={styles.headerTextContainer}>
                <Text
                  variant="displaySmall"
                  style={[
                    styles.headerScore,
                    { color: getScoreColor(overallAccuracy) },
                  ]}
                >
                  {overallAccuracy}점
                </Text>
                <Text variant="titleMedium" style={styles.headerGrade}>
                  {getScoreGrade(overallAccuracy)}
                </Text>
              </View>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.scoreRow}>
              <CircularScore
                score={cerScore!}
                label="문자 정확도"
                sublabel="CER"
                size={80}
              />
              <CircularScore
                score={werScore!}
                label="단어 정확도"
                sublabel="WER"
                size={80}
              />
            </View>
          </Surface>
        )}

        {/* 오디오 플레이어 카드 */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.audioPlayerHeader}>
              <MaterialCommunityIcons
                name="waveform"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={styles.audioPlayerTitle}>
                녹음 파일
              </Text>
              <Text variant="bodySmall" style={styles.audioDuration}>
                {formatTime(playerStatus.duration || 0)}
              </Text>
            </View>

            <View style={styles.audioPlayerControls}>
              <IconButton
                icon={playerStatus.playing ? "pause-circle" : "play-circle"}
                size={56}
                iconColor={theme.colors.primary}
                onPress={togglePlayback}
                disabled={!audioUri}
              />
              <View style={styles.audioProgressContainer}>
                <ProgressBar
                  progress={
                    playerStatus.duration
                      ? playerStatus.currentTime / playerStatus.duration
                      : 0
                  }
                  style={styles.audioProgressBar}
                  color={theme.colors.primary}
                />
                <View style={styles.audioTimeRow}>
                  <Text variant="bodySmall" style={styles.audioTime}>
                    {formatTime(playerStatus.currentTime || 0)}
                  </Text>
                  <Text variant="bodySmall" style={styles.audioTime}>
                    {formatTime(playerStatus.duration || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 문장 비교 카드 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            {/* 목표 문장 */}
            <View style={styles.sentenceSection}>
              <View style={styles.sentenceHeader}>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color="#6366F1"
                />
                <Text variant="titleSmall" style={styles.sentenceLabel}>
                  목표 문장
                </Text>
              </View>
              <Surface style={styles.sentenceBox} elevation={1}>
                <Text variant="bodyLarge" style={styles.sentenceText}>
                  {targetText}
                </Text>
              </Surface>
            </View>

            <View style={styles.sentenceDivider}>
              <View style={styles.dividerLine} />
              <MaterialCommunityIcons
                name="arrow-down"
                size={20}
                color="#9CA3AF"
              />
              <View style={styles.dividerLine} />
            </View>

            {/* 네이티브 STT 결과 */}
            <View style={styles.sentenceSection}>
              <View style={styles.sentenceHeader}>
                <MaterialCommunityIcons
                  name={Platform.OS === "ios" ? "apple" : "google"}
                  size={20}
                  color="#10B981"
                />
                <Text variant="titleSmall" style={styles.sentenceLabel}>
                  {nativeSTTEngineName}
                </Text>
                <Chip compact style={styles.engineChipNative}>
                  실시간
                </Chip>
              </View>
              <Surface
                style={[
                  styles.sentenceBox,
                  styles.sentenceBoxNative,
                  !realtimeTranscript && styles.sentenceBoxEmpty,
                ]}
                elevation={1}
              >
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.sentenceText,
                    !realtimeTranscript && styles.sentenceTextEmpty,
                  ]}
                >
                  {realtimeTranscript || "실시간 인식 결과 없음"}
                </Text>
              </Surface>
            </View>

            <View style={styles.sentenceDivider}>
              <View style={styles.dividerLine} />
              <MaterialCommunityIcons
                name="compare-horizontal"
                size={20}
                color="#9CA3AF"
              />
              <View style={styles.dividerLine} />
            </View>

            {/* ONNX 모델 결과 */}
            <View style={styles.sentenceSection}>
              <View style={styles.sentenceHeader}>
                <MaterialCommunityIcons
                  name="brain"
                  size={20}
                  color="#F59E0B"
                />
                <Text variant="titleSmall" style={styles.sentenceLabel}>
                  AI 발음 분석
                </Text>
                <Chip compact style={styles.engineChipOnnx}>
                  Wav2Vec2
                </Chip>
              </View>
              <Surface
                style={[
                  styles.sentenceBox,
                  styles.sentenceBoxOnnx,
                  !recognizedText && styles.sentenceBoxEmpty,
                ]}
                elevation={1}
              >
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.sentenceText,
                    !recognizedText && styles.sentenceTextEmpty,
                  ]}
                >
                  {recognizedText || "처리 중..."}
                </Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* 음성 분석 그래프 */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.graphHeader}>
              <MaterialCommunityIcons
                name="chart-line"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={styles.graphTitle}>
                음성 분석 그래프
              </Text>
            </View>

            <Button
              mode={showGraphs ? "outlined" : "contained-tonal"}
              onPress={() => setShowGraphs(!showGraphs)}
              icon={showGraphs ? "chevron-up" : "chart-areaspline"}
              style={styles.graphToggleButton}
            >
              {showGraphs ? "그래프 숨기기" : "파형 & 스펙트럼 보기"}
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
          </Card.Content>
        </Card>

        {/* 태그 섹션 */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.tagHeader}>
              <MaterialCommunityIcons
                name="tag-multiple"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={styles.tagTitle}>
                태그
              </Text>
            </View>

            <View style={styles.chipContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => removeTag(tag)}
                  style={styles.chip}
                  icon="tag"
                >
                  {tag}
                </Chip>
              ))}
              {tags.length === 0 && (
                <Text variant="bodySmall" style={styles.noTagsText}>
                  태그를 추가해보세요
                </Text>
              )}
            </View>

            <View style={styles.tagInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="새 태그"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                style={styles.tagInput}
                dense
                left={<TextInput.Icon icon="plus" />}
              />
              <Button mode="contained-tonal" onPress={addTag} compact>
                추가
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 처리 정보 */}
        <View style={styles.metaInfo}>
          <Text variant="bodySmall" style={styles.metaText}>
            ⏱️ 처리 시간: {processingTime}초
          </Text>
          <Text variant="bodySmall" style={styles.metaText}>
            🎙️ 녹음 길이: {recordingDuration}초
          </Text>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={saveToHistory}
            style={styles.primaryButton}
            icon={isSaved ? "check" : "content-save"}
            disabled={!recognizedText || isSaved}
          >
            {isSaved ? "저장됨" : "히스토리에 저장"}
          </Button>

          <View style={styles.secondaryButtonsRow}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.secondaryButton}
              icon="microphone"
            >
              다시 녹음
            </Button>
            <Button
              mode="text"
              onPress={() => router.push("/(tabs)")}
              style={styles.secondaryButton}
              icon="home"
            >
              홈으로
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 20,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // 로딩 화면
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  loadingTitle: {
    marginTop: 20,
    fontWeight: "600",
  },
  loadingStep: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: "center",
  },
  loadingProgress: {
    marginTop: 20,
    width: "100%",
    height: 4,
    borderRadius: 2,
  },

  // 헤더 점수 카드
  headerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  headerEmoji: {
    fontSize: 48,
  },
  headerTextContainer: {
    alignItems: "flex-start",
  },
  headerScore: {
    fontWeight: "bold",
  },
  headerGrade: {
    opacity: 0.8,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  // 원형 점수
  circularScoreContainer: {
    alignItems: "center",
  },
  circularScore: {
    borderRadius: 999,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  circularScoreText: {
    fontWeight: "bold",
  },
  circularScoreLabel: {
    marginTop: 8,
    fontWeight: "600",
  },
  circularScoreSublabel: {
    opacity: 0.6,
    marginTop: 2,
  },

  // 카드 공통
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },

  // 오디오 플레이어
  audioPlayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  audioPlayerTitle: {
    flex: 1,
    fontWeight: "600",
  },
  audioDuration: {
    opacity: 0.6,
  },
  audioPlayerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioProgressContainer: {
    flex: 1,
  },
  audioProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  audioTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  audioTime: {
    opacity: 0.6,
    fontSize: 11,
  },

  // 문장 비교
  sentenceSection: {
    marginVertical: 8,
  },
  sentenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sentenceLabel: {
    flex: 1,
    fontWeight: "600",
  },
  sentenceBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  sentenceBoxNative: {
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  sentenceBoxOnnx: {
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  sentenceBoxEmpty: {
    opacity: 0.6,
  },
  sentenceText: {
    lineHeight: 26,
  },
  sentenceTextEmpty: {
    fontStyle: "italic",
  },
  sentenceDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  engineChipNative: {
    backgroundColor: "#D1FAE5",
  },
  engineChipOnnx: {
    backgroundColor: "#FEF3C7",
  },

  // 그래프
  graphHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  graphTitle: {
    fontWeight: "600",
  },
  graphToggleButton: {
    marginBottom: 12,
  },
  graphContainer: {
    height: 500,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },

  // 태그
  tagHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tagTitle: {
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    minHeight: 32,
  },
  chip: {
    marginBottom: 4,
  },
  noTagsText: {
    opacity: 0.5,
    fontStyle: "italic",
  },
  tagInputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
  },

  // 메타 정보
  metaInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginVertical: 8,
  },
  metaText: {
    opacity: 0.6,
  },

  // 액션 버튼
  actionButtons: {
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
  },
});
