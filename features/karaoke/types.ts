/**
 * @file features/karaoke/types.ts
 * @description Type definitions for karaoke text animation feature
 */

/**
 * Timing information for a single syllable/character
 */
export interface SyllableTiming {
  /** The syllable/character text */
  syllable: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/**
 * Karaoke animation configuration
 */
export interface KaraokeConfig {
  /** Text to animate */
  text: string;
  /** Duration per character (for auto-generated timings) */
  durationPerCharacter: number;
  /** Optional preset timings (overrides auto-generation) */
  referenceTimings?: SyllableTiming[];
}
