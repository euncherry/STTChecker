/**
 * @file features/onnx/types.ts
 * @description Type definitions for ONNX model management
 */

import type { InferenceSession } from 'onnxruntime-react-native';

/**
 * ONNX model information
 */
export interface ModelInfo {
  /** ONNX Runtime inference session */
  session: InferenceSession;
  /** Input tensor name (from model metadata) */
  inputName: string;
  /** Output tensor name (from model metadata) */
  outputName: string;
}

/**
 * Vocabulary information for token decoding
 */
export interface VocabInfo {
  /** Map from token string to token ID */
  tokenToId: Map<string, number>;
  /** Map from token ID to token string */
  idToToken: Map<number, string>;
  /** Blank/space token ID (usually for "|") */
  blankToken: number;
  /** Padding token ID */
  padToken: number;
}

/**
 * ONNX context value (provided to all components)
 */
export interface ONNXContextValue {
  /** Model information (null if not loaded) */
  modelInfo: ModelInfo | null;
  /** Vocabulary information (null if not loaded) */
  vocabInfo: VocabInfo | null;
  /** Whether resources are currently loading */
  isLoading: boolean;
  /** Loading progress (0-100) */
  loadingProgress: number;
  /** Error message if loading failed */
  error: string | null;
  /** Function to reload the model */
  reloadModel: () => Promise<void>;
}
