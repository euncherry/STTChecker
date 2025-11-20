/**
 * @file types/navigation.ts
 * @description Global navigation type definitions for Expo Router
 *
 * 🎯 Why this file exists:
 * - Centralizes all route parameter types for type-safe navigation
 * - Provides autocomplete when using useRouter() and useLocalSearchParams()
 * - Prevents typos in route parameter names
 *
 * 📚 Usage example:
 * ```tsx
 * import { useRouter, useLocalSearchParams } from 'expo-router';
 * import type { RecordScreenParams, ResultsScreenParams } from '@/types/navigation';
 *
 * // In a component:
 * const router = useRouter();
 * const params = useLocalSearchParams<RecordScreenParams>();
 *
 * // Type-safe navigation
 * router.push({
 *   pathname: '/results',
 *   params: {
 *     audioUri: 'file://...',
 *     targetText: '안녕하세요',
 *     recordingDuration: '5'
 *   }
 * });
 * ```
 */

/**
 * Parameters for the /record screen
 */
export interface RecordScreenParams {
  /** The target text that the user should pronounce */
  text: string;
}

/**
 * Parameters for the /results screen
 */
export interface ResultsScreenParams {
  /** URI of the recorded audio file */
  audioUri: string;
  /** The target text that was supposed to be pronounced */
  targetText: string;
  /** Duration of the recording in seconds (as string for URL params) */
  recordingDuration: string;
}

/**
 * Root navigation parameter list for type-safe routing
 *
 * 🔍 This maps screen paths to their parameter types
 * Expo Router uses this for type inference
 */
export interface RootStackParamList {
  '/': undefined;  // Home screen (no params)
  '/record': RecordScreenParams;
  '/results': ResultsScreenParams;
  '/(tabs)': undefined;
  '/(tabs)/history': undefined;
  '/(tabs)/test': undefined;
  '/(tabs)/sing': undefined;
}
