/**
 * @file features/stt/types.ts
 * @description Type definitions for Speech-to-Text feature
 *
 * 🎯 Feature-specific types for STT pipeline:
 * - Audio preprocessing types
 * - ONNX inference types
 * - Evaluation metrics types
 */

/**
 * Audio statistics for validation/debugging
 */
export interface AudioStats {
  /** Minimum sample value */
  min: number;
  /** Maximum sample value */
  max: number;
  /** Mean (average) sample value */
  mean: number;
  /** Variance of sample values */
  variance: number;
  /** Root Mean Square (RMS) - measure of audio loudness */
  rms: number;
}

/**
 * Result of audio preprocessing
 */
export interface PreprocessingResult {
  /** Preprocessed audio data ready for model input */
  audioData: Float32Array;
  /** Original sample rate (before resampling) */
  originalSampleRate: number;
  /** Original number of channels */
  originalChannels: number;
  /** Audio statistics (for debugging) */
  stats: AudioStats;
}

/**
 * STT inference result
 */
export interface STTResult {
  /** Recognized text from speech */
  transcription: string;
  /** Inference time in seconds */
  inferenceTime: number;
  /** Model confidence (if available) */
  confidence?: number;
}

/**
 * Evaluation metrics result
 */
export interface EvaluationMetrics {
  /** Character Error Rate (0-1, lower is better) */
  cer: number;
  /** Word Error Rate (0-1, lower is better) */
  wer: number;
  /** Character accuracy percentage (0-100) */
  cerAccuracy: number;
  /** Word accuracy percentage (0-100) */
  werAccuracy: number;
}

/**
 * Complete STT pipeline result
 */
export interface STTPipelineResult {
  /** Recognized text */
  transcription: string;
  /** Evaluation metrics (if target text provided) */
  metrics?: EvaluationMetrics;
  /** Total processing time in seconds */
  processingTime: number;
  /** Individual stage timings (for performance analysis) */
  timings: {
    preprocessing: number;
    inference: number;
    evaluation?: number;
  };
}
