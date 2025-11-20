/**
 * @file features/stt/index.ts
 * @description 음성-텍스트 변환(STT) 기능 모듈을 위한 공개 API
 *
 * 🎯 STT 기능을 위한 배럴 익스포트:
 * - 오디오 전처리
 * - ONNX 추론
 * - 평가 메트릭
 *
 * 📚 사용법:
 * ```tsx
 * import { preprocessAudioFile, runSTTInference, calculateCER } from '@/features/stt';
 * ```
 */

// 유틸리티
export { preprocessAudioFile } from './utils/audioPreprocessor';
export { runSTTInference } from './utils/inference';
export { calculateCER, calculateWER } from './utils/metrics';

// 타입
export type { PreprocessResult, InferenceResult, MetricsResult } from './types';
