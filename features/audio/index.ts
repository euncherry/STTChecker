/**
 * @file features/audio/index.ts
 * @description Public API for the audio feature module
 *
 * 🎯 Why this barrel export:
 * - Single entry point for importing audio functionality
 * - Hides internal implementation details
 * - Makes refactoring easier (change internals without affecting imports)
 * - Clean imports: import { useAudioRecording } from '@/features/audio'
 *
 * 📚 Usage:
 * ```tsx
 * import { useAudioRecording, useAudioPlayback } from '@/features/audio';
 * import type { RecordingState, PlaybackState } from '@/features/audio';
 * ```
 */

// Hooks
export { useAudioRecording } from './hooks/useAudioRecording';
export { useAudioPlayback } from './hooks/useAudioPlayback';

// Types
export type {
  AudioRecordingConfig,
  RecordingState,
  PlaybackState,
  RecordingResult,
  AudioPermissions,
} from './types';

// Utils/Config (for advanced use cases)
export {
  KOREAN_STT_RECORDING_CONFIG,
  DEFAULT_AUDIO_MODE,
  MAX_RECORDING_DURATION,
  generateRecordingFileName,
} from './utils/config';
