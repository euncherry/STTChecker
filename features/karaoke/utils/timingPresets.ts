// utils/karaoke/timingPresets.ts
export type SyllableTiming = {
  syllable: string;
  start: number;
  end: number;
};

export const DEFAULT_DURATION_PER_CHARACTER = 0.3;

/**
 * 정밀한 발음 타이밍이 필요한 문장들의 레퍼런스 타이밍
 * 여기에 없는 문장은 자동으로 균등 분배됩니다.
 */
export const KARAOKE_TIMING_PRESETS: Record<string, SyllableTiming[]> = {
  // 예제 1: 안녕하세요
  안녕하세요: [
    { syllable: "안", start: 0.0, end: 0.4 },
    { syllable: "녕", start: 0.4, end: 0.8 },
    { syllable: "하", start: 0.8, end: 1.2 },
    { syllable: "세", start: 1.2, end: 1.6 },
    { syllable: "요", start: 1.6, end: 2.0 },
  ],

  // 예제 2: 감사합니다
  감사합니다: [
    { syllable: "감", start: 0.0, end: 0.25 },
    { syllable: "사", start: 0.25, end: 0.6 },
    { syllable: "합", start: 0.6, end: 0.9 },
    { syllable: "니", start: 0.9, end: 1.2 },
    { syllable: "다", start: 1.2, end: 1.6 },
  ],

  // 예제 3: 좋은 아침입니다
  "좋은 아침입니다": [
    { syllable: "좋", start: 0.0, end: 0.3 },
    { syllable: "은", start: 0.3, end: 0.6 },
    { syllable: " ", start: 0.6, end: 0.7 },
    { syllable: "아", start: 0.7, end: 0.9 },
    { syllable: "침", start: 0.9, end: 1.3 },
    { syllable: "입", start: 1.3, end: 1.6 },
    { syllable: "니", start: 1.6, end: 1.9 },
    { syllable: "다", start: 1.9, end: 2.3 },
  ],
};

/**
 * 특정 문장의 레퍼런스 타이밍을 가져옵니다.
 * 없으면 undefined를 반환하여 자동 생성되도록 합니다.
 */
export function getTimingPreset(text: string): SyllableTiming[] | undefined {
  return KARAOKE_TIMING_PRESETS[text];
}

/**
 * 레퍼런스 타이밍이 있는 문장 목록을 반환합니다.
 */
export function getAvailablePresets(): string[] {
  return Object.keys(KARAOKE_TIMING_PRESETS);
}

/**
 * 특정 문장에 레퍼런스 타이밍이 있는지 확인합니다.
 */
export function hasTimingPreset(text: string): boolean {
  return text in KARAOKE_TIMING_PRESETS;
}
