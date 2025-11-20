/**
 * @file features/karaoke/index.ts
 * @description Public API for the karaoke text animation feature
 */

// Utils
export {
  getTimingPreset,
  generateAutoTimings,
  KARAOKE_TIMING_PRESETS,
  DEFAULT_DURATION_PER_CHARACTER,
} from './utils/timingPresets';

// Types
export type { SyllableTiming, KaraokeConfig } from './types';
