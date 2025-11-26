/**
 * @file types/global.ts
 * @description Global type definitions used across multiple features
 *
 * 🎯 Why this file exists:
 * - Centralizes commonly-used types that span multiple features
 * - Prevents circular dependencies between feature modules
 * - Provides a single source of truth for shared data structures
 */

/**
 * Generic error with a message
 */
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Generic loading state wrapper
 *
 * 🔍 Use this pattern for async data fetching:
 * ```tsx
 * const [data, setData] = useState<LoadingState<MyData>>({
 *   isLoading: true
 * });
 * ```
 */
export interface LoadingState<T> {
  isLoading: boolean;
  data?: T;
  error?: AppError;
}

/**
 * Progress tracking (0-100%)
 */
export interface ProgressState {
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional status message */
  message?: string;
}

/**
 * Audio source types supported by the app
 *
 * 🔍 This can be:
 * - Local file URI (file://...)
 * - Asset from require()
 * - Remote URL (https://...)
 */
export type AudioSource =
  | string
  | { uri: string }
  | number;  // From require('path/to/file')

/**
 * Time range for filtering/queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
