// app/(tabs)/history.tsx
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import CustomHeader from "../../components/CustomHeader";
import {
  clearAllHistories,
  deleteHistory,
  getStorageInfo,
  HistoryItem,
  loadHistories,
  shareAudioFile,
} from "../../utils/storage/historyManager";

export default function HistoryScreen() {
  const theme = useTheme();
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState({
    itemCount: 0,
    totalSizeMB: "0",
    audioDir: "",
  });
  const [playingId, setPlayingId] = useState<string | null>(null);

  // ✅ 오디오 플레이어 추가
  const audioPlayer = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // ✅ 화면 포커스 시 자동 새로고침
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 히스토리 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[HistoryScreen] 📖 데이터 로드 시작...");

      const data = await loadHistories();
      setHistories(data);

      const info = await getStorageInfo();
      setStorageInfo(info);

      console.log(`[HistoryScreen] ✅ ${data.length}개 로드 완료`);
    } catch (error) {
      console.error("[HistoryScreen] ❌ 데이터 로드 실패:", error);
      Alert.alert("오류", "데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ✅ 개선된 오디오 재생/정지 로직
  const togglePlayback = useCallback(
    async (item: HistoryItem) => {
      if (!item.audioFilePath) {
        Alert.alert("알림", "오디오 파일을 찾을 수 없습니다.");
        return;
      }

      try {
        console.log("[HistoryScreen] 🎵 재생 토글:", item.id);

        if (playingId === item.id) {
          // 같은 파일 - 재생/일시정지 토글
          if (playerStatus.playing) {
            console.log("[HistoryScreen] ⏸️ 일시정지");
            audioPlayer.pause();
          } else {
            console.log("[HistoryScreen] ▶️ 재생 재개");
            // 끝까지 재생된 경우 처음부터
            if (
              playerStatus.currentTime >= playerStatus.duration - 0.1 &&
              playerStatus.duration > 0
            ) {
              audioPlayer.seekTo(0);
            }
            audioPlayer.play();
          }
        } else {
          // 다른 파일 - 소스 교체 후 재생
          console.log("[HistoryScreen] 📁 새 파일 로드:", item.audioFilePath);

          // 기존 재생 중이면 일시정지
          if (playerStatus.playing) {
            audioPlayer.pause();
          }

          // 새 소스로 교체
          audioPlayer.replace({ uri: item.audioFilePath });
          setPlayingId(item.id);
        }
      } catch (error) {
        console.error("[HistoryScreen] ❌ 재생 실패:", error);
        Alert.alert("오류", "오디오 재생 중 문제가 발생했습니다.");
        setPlayingId(null);
      }
    },
    [playingId, playerStatus, audioPlayer]
  );

  // ✅ 로드 완료 시 자동 재생
  useEffect(() => {
    if (
      playingId !== null &&
      playerStatus.isLoaded &&
      !playerStatus.playing &&
      playerStatus.currentTime === 0
    ) {
      console.log("[HistoryScreen] ✅ 로드 완료 - 자동 재생 시작");
      audioPlayer.play();
    }
  }, [
    playingId,
    playerStatus.isLoaded,
    playerStatus.playing,
    playerStatus.currentTime,
    audioPlayer,
  ]);

  // ✅ 재생 완료 감지
  useEffect(() => {
    if (
      playerStatus.currentTime >= playerStatus.duration - 0.1 &&
      playerStatus.duration > 0 &&
      playingId !== null &&
      playerStatus.playing
    ) {
      console.log("[HistoryScreen] ✅ 재생 완료");
      setPlayingId(null);
    }
  }, [
    playerStatus.currentTime,
    playerStatus.duration,
    playingId,
    playerStatus.playing,
  ]);

  // ✅ 공유/저장 (알림 제거)
  const handleShare = useCallback(async (item: HistoryItem) => {
    if (!item.audioFilePath) {
      Alert.alert("알림", "오디오 파일을 찾을 수 없습니다.");
      return;
    }

    try {
      console.log("[HistoryScreen] 📤 공유 시작:", item.id);
      await shareAudioFile(item.audioFilePath);
      console.log("[HistoryScreen] ✅ 공유 완료");
      // ✅ 알림 제거 - 공유 메뉴가 자체 설명이므로 불필요
    } catch (error) {
      console.error("[HistoryScreen] ❌ 공유 실패:", error);
      Alert.alert("오류", "파일 공유에 실패했습니다.");
    }
  }, []);

  // ✅ 삭제
  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "삭제 확인",
        "이 기록을 삭제하시겠습니까?\n오디오 파일도 함께 삭제됩니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: async () => {
              try {
                console.log("[HistoryScreen] 🗑️ 삭제 시작:", id);

                // 재생 중인 파일이면 정지
                if (playingId === id) {
                  audioPlayer.pause();
                  setPlayingId(null);
                }

                await deleteHistory(id);
                await loadData();
                console.log("[HistoryScreen] ✅ 삭제 완료");
              } catch (error) {
                console.error("[HistoryScreen] ❌ 삭제 실패:", error);
                Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
              }
            },
          },
        ]
      );
    },
    [loadData, playingId, audioPlayer]
  );

  // ✅ 전체 삭제
  const handleClearAll = useCallback(() => {
    Alert.alert(
      "전체 삭제",
      `모든 기록(${histories.length}개)과 오디오 파일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "전체 삭제",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[HistoryScreen] 🗑️ 전체 삭제 시작");

              // 재생 정지
              if (playingId !== null) {
                audioPlayer.pause();
                setPlayingId(null);
              }

              await clearAllHistories();
              await loadData();
              console.log("[HistoryScreen] ✅ 전체 삭제 완료");
            } catch (error) {
              console.error("[HistoryScreen] ❌ 전체 삭제 실패:", error);
              Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
            }
          },
        },
      ]
    );
  }, [histories.length, loadData, playingId, audioPlayer]);

  // ✅ 점수에 따른 색상
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "#C8E6C9";
    if (score >= 80) return "#FFF9C4";
    if (score >= 70) return "#FFE0B2";
    return "#FFCDD2";
  };

  // ✅ 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return `오늘 ${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        "0"
      )}`;
    } else if (diffDays === 1) {
      return `어제 ${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        "0"
      )}`;
    } else if (diffDays < 7) {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return `${days[date.getDay()]}요일 ${date.getHours()}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    }
  };

  // ✅ 히스토리 아이템 렌더링
  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      const cerAccuracy = ((1 - item.cerScore) * 100).toFixed(0);
      const werAccuracy = ((1 - item.werScore) * 100).toFixed(0);
      const isPlaying = playingId === item.id && playerStatus.playing;
      const isLoadingAudio = playingId === item.id && !playerStatus.isLoaded;

      return (
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            {/* 헤더 */}
            <View style={styles.cardHeader}>
              <Text
                variant="titleMedium"
                numberOfLines={1}
                style={styles.targetText}
              >
                {item.targetText}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            {/* 인식 결과 */}
            <Text
              variant="bodyMedium"
              style={styles.recognizedText}
              numberOfLines={2}
            >
              🎤 {item.recognizedText}
            </Text>

            {/* CER/WER 점수 */}
            <View style={styles.scoreRow}>
              <Chip
                mode="flat"
                compact
                style={[
                  styles.scoreChip,
                  { backgroundColor: getScoreColor(parseFloat(cerAccuracy)) },
                ]}
                textStyle={styles.scoreText}
              >
                CER : {cerAccuracy}%
              </Chip>
              <Chip
                mode="flat"
                compact
                style={[
                  styles.scoreChip,
                  { backgroundColor: getScoreColor(parseFloat(werAccuracy)) },
                ]}
                textStyle={styles.scoreText}
              >
                WER : {werAccuracy}%
              </Chip>
            </View>

            {/* 추가 정보 */}
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.infoText}>
                ⏱️ {item.recordingDuration}초
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                🔄 {item.processingTime.toFixed(1)}초
              </Text>
            </View>

            {/* 태그 */}
            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    compact
                    style={styles.tag}
                    textStyle={styles.tagText}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            )}

            {/* ✅ 액션 버튼 */}
            <View style={styles.actions}>
              {isLoadingAudio ? (
                <ActivityIndicator size={28} color={theme.colors.primary} />
              ) : (
                <IconButton
                  icon={isPlaying ? "pause-circle" : "play-circle"}
                  mode="contained-tonal"
                  onPress={() => togglePlayback(item)}
                  disabled={!item.audioFilePath}
                  size={28}
                />
              )}

              <IconButton
                icon="export-variant"
                onPress={() => handleShare(item)}
                disabled={!item.audioFilePath}
                size={24}
              />

              <IconButton
                icon="delete-outline"
                onPress={() => handleDelete(item.id)}
                size={24}
              />
            </View>
          </Card.Content>
        </Card>
      );
    },
    [
      playingId,
      playerStatus,
      togglePlayback,
      handleShare,
      handleDelete,
      theme.colors.primary,
    ]
  );

  // ✅ 로딩 화면
  if (isLoading) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.primary }]}>
        <CustomHeader title="연습 히스토리" />
        <View
          style={[
            styles.centerContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.primary }]}>
      <CustomHeader title="연습 히스토리" />

      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* 스토리지 정보 카드 */}
        <Card style={styles.infoCard} mode="outlined">
          <Card.Content>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text variant="labelSmall" style={styles.infoLabel}>
                  총 기록
                </Text>
                <Text variant="titleLarge" style={styles.infoValue}>
                  {storageInfo.itemCount}개
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="labelSmall" style={styles.infoLabel}>
                  사용 용량
                </Text>
                <Text variant="titleLarge" style={styles.infoValue}>
                  {storageInfo.totalSizeMB}MB
                </Text>
              </View>
              {histories.length > 0 && (
                <Button
                  mode="text"
                  onPress={handleClearAll}
                  compact
                  textColor={theme.colors.error}
                  style={styles.clearButton}
                >
                  전체삭제
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 리스트 or 빈 화면 */}
        {histories.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <Text variant="displaySmall" style={styles.emptyIcon}>
              📝
            </Text>
            <Text variant="titleLarge" style={styles.emptyText}>
              아직 저장된 연습 기록이 없습니다
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubText}>
              발음 연습을 완료하고 저장해 보세요
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={histories}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  infoValue: {
    fontWeight: "bold",
    color: "#1976D2",
  },
  clearButton: {
    marginLeft: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  targetText: {
    flex: 1,
    fontWeight: "600",
  },
  date: {
    opacity: 0.6,
    marginLeft: 8,
  },
  recognizedText: {
    marginVertical: 8,
    opacity: 0.8,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  scoreChip: {
    minHeight: 28,
    maxHeight: 30,
    paddingHorizontal: 2,
  },
  scoreText: {
    fontSize: 14,
    lineHeight: 18,
  },
  infoText: {
    opacity: 0.7,
    fontSize: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    minHeight: 24,
    maxHeight: 32,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubText: {
    textAlign: "center",
    marginTop: 12,
    opacity: 0.7,
    lineHeight: 20,
  },
});
