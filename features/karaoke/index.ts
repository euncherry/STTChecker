/**
 * @file features/karaoke/index.ts
 * @description 가라오케 텍스트 애니메이션 기능을 위한 공개 API
 */

// 유틸리티
export {
  getTimingPreset,
  generateAutoTimings,
  KARAOKE_TIMING_PRESETS,
  DEFAULT_DURATION_PER_CHARACTER,
} from './utils/timingPresets';

// 타입
export type { SyllableTiming, KaraokeConfig } from './types';
