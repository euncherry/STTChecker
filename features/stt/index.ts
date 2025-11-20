/**
 * @file features/stt/index.ts
 * @description Public API for the Speech-to-Text feature module
 *
 * 🎯 Barrel export for STT functionality:
 * - Audio preprocessing
 * - ONNX inference
 * - Evaluation metrics
 *
 * 📚 Usage:
 * ```tsx
 * import { preprocessAudioFile, runSTTInference, calculateCER } from '@/features/stt';
 * ```
 */

// Utils
export { preprocessAudioFile } from './utils/audioPreprocessor';
export { runSTTInference } from './utils/inference';
export { calculateCER, calculateWER } from './utils/metrics';

// Types
export type {
  AudioStats,
  PreprocessingResult,
  STTResult,
  EvaluationMetrics,
  STTPipelineResult,
} from './types';
