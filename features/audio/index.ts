/**
 * @file features/audio/index.ts
 * @description 오디오 기능 모듈을 위한 공개 API
 *
 * 🎯 이 배럴 익스포트의 목적:
 * - 오디오 기능을 임포트하기 위한 단일 진입점
 * - 내부 구현 세부사항 숨기기
 * - 리팩토링을 더 쉽게 만듦 (임포트를 깨지 않고 내부 변경 가능)
 * - 깔끔한 임포트: import { useAudioRecording } from '@/features/audio'
 *
 * 📚 사용법:
 * ```tsx
 * import { useAudioRecording, useAudioPlayback } from '@/features/audio';
 * import type { RecordingState, PlaybackState } from '@/features/audio';
 * ```
 */

// 훅
export { useAudioRecording } from './hooks/useAudioRecording';
export { useAudioPlayback } from './hooks/useAudioPlayback';

// 타입
export type {
  AudioRecordingConfig,
  RecordingState,
  PlaybackState,
  RecordingResult,
  AudioPermissions,
} from './types';

// 유틸리티/설정 (고급 사용 사례용)
export {
  KOREAN_STT_RECORDING_CONFIG,
  MAX_RECORDING_DURATION,
  generateRecordingFileName,
} from './utils/config';
