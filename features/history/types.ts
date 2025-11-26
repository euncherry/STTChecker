/**
 * @file features/history/types.ts
 * @description Type definitions for history/storage feature
 */

/**
 * A single pronunciation practice history item
 *
 * 🔍 Stored in AsyncStorage and represents one recording session
 */
export interface HistoryItem {
  /** Unique identifier (timestamp-based) */
  id: string;
  /** The target sentence that was supposed to be pronounced */
  targetText: string;
  /** The text recognized by the STT model */
  recognizedText: string;
  /** URI of the saved audio file */
  audioFilePath: string;
  /** Character Error Rate (0-1) */
  cerScore: number;
  /** Word Error Rate (0-1) */
  werScore: number;
  /** User-defined and auto-generated tags */
  tags: string[];
  /** Duration of the recording in seconds */
  recordingDuration: number;
  /** Time taken to process the audio (in seconds) */
  processingTime: number;
  /** ISO timestamp when the recording was created */
  createdAt: string;
}

/**
 * Input for creating a new history item (omits auto-generated fields)
 */
export type CreateHistoryInput = Omit<HistoryItem, 'id' | 'createdAt'>;

/**
 * Storage information summary
 */
export interface StorageInfo {
  /** Number of history items stored */
  itemCount: number;
  /** Total size in megabytes */
  totalSizeMB: string;
  /** Path to audio directory */
  audioDir: string;
}
