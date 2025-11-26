/**
 * @file features/history/index.ts
 * @description 히스토리/저장소 기능 모듈을 위한 공개 API
 */

// 유틸리티
export {
  saveHistory,
  loadHistories,
  deleteHistory,
  clearAllHistories,
  getStorageInfo,
  filterHistoriesByTag,
  filterHistoriesByDateRange,
  shareAudioFile,
  saveAudioFile,
} from './utils/historyManager';

// 타입
export type { HistoryItem, CreateHistoryInput, StorageInfo } from './types';
