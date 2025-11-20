/**
 * 오디오 관련 TypeScript 타입 정의
 *
 * @description
 * STT 처리, 오디오 재생, 녹음 등 오디오 관련 모든 타입을 정의합니다.
 *
 * @author Claude (Senior RN Engineer)
 */

import type { AudioSource } from "expo-audio";

/**
 * STT 처리 결과
 *
 * @description
 * 음성 인식(STT) 처리의 최종 결과를 담는 인터페이스입니다.
 *
 * @property recognizedText - 인식된 텍스트
 * @property processingTime - 처리 시간 (초 단위)
 * @property sampleCount - 오디오 데이터의 샘플 수
 *
 * @example
 * ```typescript
 * const result: STTResult = {
 *   recognizedText: "안녕하세요",
 *   processingTime: 2.34,
 *   sampleCount: 48000
 * };
 * ```
 */
export interface STTResult {
  recognizedText: string;
  processingTime: number;
  sampleCount: number;
}

/**
 * STT 처리 옵션
 *
 * @description
 * STT 처리 시 추가로 전달할 수 있는 옵션들입니다.
 *
 * @property targetText - 목표 문장 (CER/WER 계산용)
 * @property onProgress - 진행 상황 콜백
 *
 * @example
 * ```typescript
 * const options: STTProcessOptions = {
 *   targetText: "안녕하세요",
 *   onProgress: (stage, progress) => {
 *     console.log(`${stage}: ${progress}%`);
 *   }
 * };
 * ```
 */
export interface STTProcessOptions {
  targetText?: string;
  onProgress?: (stage: STTProcessingStage, progress: number) => void;
}

/**
 * STT 처리 단계
 *
 * @description
 * STT 파이프라인의 각 처리 단계를 나타내는 Union Type입니다.
 *
 * - `preprocessing`: 오디오 전처리 (WAV → Float32Array)
 * - `inference`: ONNX 추론 (Float32Array → Logits)
 * - `decoding`: CTC 디코딩 (Logits → Text)
 * - `metrics`: 평가 메트릭 계산 (CER, WER)
 *
 * @example
 * ```typescript
 * function updateProgress(stage: STTProcessingStage, progress: number) {
 *   switch (stage) {
 *     case 'preprocessing':
 *       console.log(`전처리 중: ${progress}%`);
 *       break;
 *     case 'inference':
 *       console.log(`추론 중: ${progress}%`);
 *       break;
 *     // ...
 *   }
 * }
 * ```
 *
 * 💡 **Union Type 설명**:
 * - 여러 타입 중 하나만 가질 수 있는 타입
 * - 허용된 값만 사용 가능 (오타 방지)
 * - IDE 자동완성 지원
 * - switch문과 함께 사용하면 exhaustiveness checking 가능
 */
export type STTProcessingStage =
  | "preprocessing"
  | "inference"
  | "decoding"
  | "metrics";

/**
 * 오디오 재생 상태
 *
 * @description
 * `useAudioPlayback` Hook에서 반환하는 재생 상태 정보입니다.
 *
 * @property isPlaying - 재생 중인지 여부
 * @property isLoading - 오디오 로딩 중인지 여부
 * @property currentTime - 현재 재생 위치 (초)
 * @property duration - 전체 길이 (초)
 * @property source - 현재 오디오 소스
 *
 * @example
 * ```typescript
 * const state: AudioPlaybackState = {
 *   isPlaying: true,
 *   isLoading: false,
 *   currentTime: 5.2,
 *   duration: 10.0,
 *   source: { uri: "file:///..." }
 * };
 * ```
 */
export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  source: AudioSource | null;
}

/**
 * 평가 메트릭 (CER, WER)
 *
 * @description
 * 발음 평가를 위한 메트릭 정보입니다.
 *
 * @property cer - Character Error Rate (문자 오류율, 0~1)
 * @property wer - Word Error Rate (단어 오류율, 0~1)
 *
 * @example
 * ```typescript
 * const metrics: EvaluationMetrics = {
 *   cer: 0.05,  // 5% 오류 → 95% 정확도
 *   wer: 0.10   // 10% 오류 → 90% 정확도
 * };
 *
 * const cerAccuracy = (1 - metrics.cer) * 100;  // 95%
 * ```
 */
export interface EvaluationMetrics {
  cer: number;
  wer: number;
}

/**
 * 녹음 옵션 (Android)
 *
 * @description
 * `react-native-audio-record` 또는 `expo-audio`의 녹음 설정입니다.
 *
 * @property sampleRate - 샘플레이트 (Hz) - 권장: 16000 (모델 요구사항)
 * @property channels - 채널 수 (1: 모노, 2: 스테레오)
 * @property bitsPerSample - 비트 깊이 (16 권장)
 * @property audioSource - Android AudioSource (6: VOICE_RECOGNITION)
 * @property wavFile - 출력 파일 이름
 *
 * @example
 * ```typescript
 * const options: RecordingOptions = {
 *   sampleRate: 16000,
 *   channels: 1,
 *   bitsPerSample: 16,
 *   audioSource: 6,  // VOICE_RECOGNITION
 *   wavFile: `recording_${Date.now()}.wav`
 * };
 * ```
 */
export interface RecordingOptions {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  audioSource: number;
  wavFile: string;
}

/**
 * 녹음 상태
 *
 * @description
 * 녹음 진행 상황을 나타내는 상태입니다.
 *
 * @example
 * ```typescript
 * type RecordingState = 'idle' | 'countdown' | 'recording' | 'stopped';
 *
 * let state: RecordingState = 'idle';
 * state = 'countdown';  // ✅ OK
 * state = 'unknown';    // ❌ 컴파일 에러!
 * ```
 */
export type RecordingState = "idle" | "countdown" | "recording" | "stopped";

/**
 * 오디오 파일 URI
 *
 * @description
 * 오디오 파일의 URI 타입입니다.
 * Android에서는 file:// 또는 content:// 스킴을 사용합니다.
 *
 * @example
 * ```typescript
 * const fileUri: AudioFileURI = "file:///data/user/0/.../recording.wav";
 * const contentUri: AudioFileURI = "content://media/external/audio/media/123";
 * ```
 */
export type AudioFileURI = string;

/**
 * 💡 TypeScript 교육: Branded Types (고급)
 *
 * @description
 * 일반 string을 AudioFileURI로 사용하지만, 실수로 다른 string을
 * 전달하는 것을 방지하고 싶다면 Branded Type을 사용할 수 있습니다.
 *
 * @example
 * ```typescript
 * // 기본 방식 (현재)
 * type AudioFileURI = string;
 * const uri: AudioFileURI = "any string";  // ✅ OK
 *
 * // Branded Type (고급)
 * type AudioFileURI = string & { __brand: "AudioFileURI" };
 *
 * function createAudioFileURI(uri: string): AudioFileURI {
 *   if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
 *     throw new Error("Invalid audio file URI");
 *   }
 *   return uri as AudioFileURI;
 * }
 *
 * const uri = createAudioFileURI("file:///...");  // ✅ OK
 * const badUri: AudioFileURI = "random string";   // ❌ 컴파일 에러!
 * ```
 *
 * **장점**: 타입 안전성 극대화
 * **단점**: 보일러플레이트 코드 증가
 * **결론**: 프로젝트 크기에 따라 선택
 */

/**
 * 💡 TypeScript 교육: Readonly와 Immutability
 *
 * @description
 * 불변성(Immutability)을 보장하고 싶다면 Readonly를 사용합니다.
 *
 * @example
 * ```typescript
 * // 일반 객체 (변경 가능)
 * const metrics: EvaluationMetrics = {
 *   cer: 0.05,
 *   wer: 0.10
 * };
 * metrics.cer = 0.20;  // ✅ OK (변경 가능)
 *
 * // Readonly 객체 (변경 불가)
 * const metrics: Readonly<EvaluationMetrics> = {
 *   cer: 0.05,
 *   wer: 0.10
 * };
 * metrics.cer = 0.20;  // ❌ 컴파일 에러! (변경 불가)
 *
 * // DeepReadonly (중첩 객체까지 불변)
 * type DeepReadonly<T> = {
 *   readonly [P in keyof T]: T[P] extends object
 *     ? DeepReadonly<T[P]>
 *     : T[P];
 * };
 * ```
 *
 * **사용 시기**:
 * - Redux State
 * - Props
 * - Config 객체
 */
