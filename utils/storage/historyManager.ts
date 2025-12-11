// utils/storage/historyManager.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const HISTORY_KEY = "@pronunciation_history";
const MAX_HISTORY_ITEMS = 100;

export interface HistoryItem {
  id: string;
  targetText: string;
  // ONNX 모델 기반 인식 결과
  recognizedText: string;
  audioFilePath: string; // 저장된 WAV 파일 URI
  cerScore: number;
  werScore: number;
  // 네이티브 STT (Google/Siri) 인식 결과
  nativeRecognizedText?: string;
  nativeCerScore?: number;
  nativeWerScore?: number;
  // 기타 메타데이터
  tags: string[];
  recordingDuration: number;
  processingTime: number;
  createdAt: string;
}

/**
 * ✅ 새로운 API: 오디오 디렉토리 초기화
 */
function getAudioDirectory(): Directory {
  return new Directory(Paths.document, "audio");
}

/**
 * ✅ 새로운 API: WAV 파일을 영구 저장소로 복사
 */
export async function saveAudioFile(
  tempUri: string,
  historyId: string
): Promise<{ uri: string; size: number }> {
  try {
    console.log("[HistoryManager] 📥 WAV 파일 저장 시작");
    console.log(`  - 원본: ${tempUri}`);

    // 오디오 디렉토리 생성 (없으면)
    const audioDir = getAudioDirectory();
    if (!audioDir.exists) {
      audioDir.create({ intermediates: true });
      console.log("[HistoryManager] 📁 오디오 디렉토리 생성");
    }

    // 파일 복사
    const fileName = `recording_${historyId}.wav`;
    const sourceFile = new File(tempUri);
    const targetFile = new File(audioDir, fileName);

    sourceFile.copy(targetFile);

    console.log(`[HistoryManager] ✅ 파일 저장 완료`);
    console.log(`  - 대상: ${targetFile.uri}`);
    console.log(`  - 크기: ${(targetFile.size / 1024).toFixed(2)}KB`);

    return {
      uri: targetFile.uri,
      size: targetFile.size,
    };
  } catch (error) {
    console.error("[HistoryManager] ❌ 오디오 파일 저장 실패:", error);
    throw new Error(
      `오디오 파일 저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * ✅ 히스토리 항목 저장
 */
export async function saveHistory(
  item: Omit<HistoryItem, "id" | "createdAt">
): Promise<HistoryItem> {
  try {
    const id = Date.now().toString();
    const newItem: HistoryItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
    };

    console.log("[HistoryManager] 💾 히스토리 저장 중...");

    // 기존 히스토리 불러오기
    const histories = await loadHistories();

    // 새 항목 추가 (최신순)
    histories.unshift(newItem);

    // 최대 개수 제한 및 오래된 파일 삭제
    if (histories.length > MAX_HISTORY_ITEMS) {
      const oldItems = histories.slice(MAX_HISTORY_ITEMS);
      console.log(`[HistoryManager] 🗑️ ${oldItems.length}개 오래된 항목 삭제`);

      for (const oldItem of oldItems) {
        await deleteAudioFile(oldItem.audioFilePath);
      }

      histories.splice(MAX_HISTORY_ITEMS);
    }

    // AsyncStorage에 저장
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(histories));

    console.log(`[HistoryManager] ✅ 히스토리 저장 완료 (ID: ${id})`);
    return newItem;
  } catch (error) {
    console.error("[HistoryManager] ❌ 히스토리 저장 실패:", error);
    throw new Error(
      `히스토리 저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * ✅ 모든 히스토리 불러오기 (파일 검증 포함)
 */
export async function loadHistories(): Promise<HistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (!data) return [];

    const histories = JSON.parse(data) as HistoryItem[];
    console.log(`[HistoryManager] 📖 ${histories.length}개 히스토리 로드`);

    // 오디오 파일 존재 여부 확인 및 누락된 파일 처리
    const validHistories: HistoryItem[] = [];
    const invalidIds: string[] = [];

    for (const item of histories) {
      if (item.audioFilePath) {
        const file = new File(item.audioFilePath);
        if (file.exists) {
          validHistories.push(item);
        } else {
          console.warn(`[HistoryManager] ⚠️ 오디오 파일 없음: ${item.id}`);
          invalidIds.push(item.id);
        }
      } else {
        validHistories.push(item);
      }
    }

    // 파일이 없는 항목들을 제거하고 업데이트
    if (invalidIds.length > 0) {
      console.log(
        `[HistoryManager] 🧹 ${invalidIds.length}개 손상된 항목 제거`
      );
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(validHistories));
    }

    return validHistories;
  } catch (error) {
    console.error("[HistoryManager] ❌ 히스토리 로드 실패:", error);
    return [];
  }
}

/**
 * ✅ 특정 히스토리 삭제
 */
export async function deleteHistory(id: string): Promise<void> {
  try {
    console.log(`[HistoryManager] 🗑️ 히스토리 삭제 중 (ID: ${id})`);

    const histories = await loadHistories();
    const itemToDelete = histories.find((h) => h.id === id);

    if (!itemToDelete) {
      throw new Error("삭제할 항목을 찾을 수 없습니다");
    }

    // 오디오 파일 삭제
    await deleteAudioFile(itemToDelete.audioFilePath);

    // 히스토리에서 제거
    const updatedHistories = histories.filter((h) => h.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistories));

    console.log(`[HistoryManager] ✅ 히스토리 삭제 완료`);
  } catch (error) {
    console.error("[HistoryManager] ❌ 히스토리 삭제 실패:", error);
    throw new Error(
      `히스토리 삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * ✅ 새로운 API: 오디오 파일 삭제
 */
async function deleteAudioFile(filePath: string): Promise<void> {
  if (!filePath) return;

  try {
    const file = new File(filePath);
    if (file.exists) {
      file.delete();
      console.log(`[HistoryManager] 🗑️ 오디오 파일 삭제: ${filePath}`);
    }
  } catch (error) {
    console.error("[HistoryManager] ⚠️ 오디오 파일 삭제 실패:", error);
    // 파일 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * ✅ 모든 히스토리 삭제
 */
export async function clearAllHistories(): Promise<void> {
  try {
    console.log("[HistoryManager] 🗑️ 전체 삭제 시작");

    // 오디오 디렉토리 전체 삭제
    const audioDir = getAudioDirectory();
    if (audioDir.exists) {
      audioDir.delete();
      console.log("[HistoryManager] 🗑️ 오디오 디렉토리 삭제");
    }

    // AsyncStorage 클리어
    await AsyncStorage.removeItem(HISTORY_KEY);

    console.log("[HistoryManager] ✅ 전체 삭제 완료");
  } catch (error) {
    console.error("[HistoryManager] ❌ 전체 삭제 실패:", error);
    throw new Error(
      `전체 삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

/**
 * ✅ 스토리지 정보 계산
 */
export async function getStorageInfo(): Promise<{
  itemCount: number;
  totalSizeMB: string;
  audioDir: string;
}> {
  try {
    const histories = await loadHistories();
    let totalSize = 0;

    for (const item of histories) {
      if (item.audioFilePath) {
        const file = new File(item.audioFilePath);
        if (file.exists) {
          totalSize += file.size;
        }
      }
    }

    const audioDir = getAudioDirectory();

    return {
      itemCount: histories.length,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      audioDir: audioDir.uri,
    };
  } catch (error) {
    console.error("[HistoryManager] ❌ 스토리지 정보 조회 실패:", error);
    return {
      itemCount: 0,
      totalSizeMB: "0",
      audioDir: "",
    };
  }
}

/**
 * ✅ 태그별 필터링
 */
export async function filterHistoriesByTag(
  tag: string
): Promise<HistoryItem[]> {
  const histories = await loadHistories();
  return histories.filter((item) => item.tags.includes(tag));
}

/**
 * ✅ 날짜 범위로 필터링
 */
export async function filterHistoriesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<HistoryItem[]> {
  const histories = await loadHistories();
  return histories.filter((item) => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= startDate && itemDate <= endDate;
  });
}
/**
 * ✅ 파일 공유/저장하기
 */
export async function shareAudioFile(audioFilePath: string): Promise<void> {
  try {
    const file = new File(audioFilePath);
    if (!file.exists) {
      throw new Error("파일을 찾을 수 없습니다");
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("공유 기능을 사용할 수 없습니다");
    }

    await Sharing.shareAsync(audioFilePath, {
      mimeType: "audio/wav",
      dialogTitle: "녹음 파일 저장 또는 공유",
      UTI: "public.audio", // iOS용
    });

    console.log("[Share] ✅ 파일 공유 완료");
  } catch (error) {
    console.error("[Share] ❌ 공유 실패:", error);
    throw error;
  }
}
