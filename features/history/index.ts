/**
 * @file features/history/index.ts
 * @description Public API for the history/storage feature module
 */

// Utils
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

// Types
export type { HistoryItem, CreateHistoryInput, StorageInfo } from './types';
