/**
 * @file features/audio/utils/config.ts
 * @description Audio configuration constants and presets
 *
 * 🎯 Why centralize configuration:
 * - Single source of truth for audio settings
 * - Easy to adjust quality/format across the app
 * - Ensures consistency with model requirements
 */

import { RecordingPresets } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import type { AudioRecordingConfig } from '../types';

/**
 * High-quality audio recording configuration optimized for Korean STT
 *
 * 🔍 Based on Wav2Vec2 model requirements:
 * - 16kHz sample rate (model was trained on this rate)
 * - Mono channel (model expects single channel)
 * - AAC encoding for good quality/size balance
 *
 * 📊 Technical details:
 * - Sample rate: 16000 Hz (matches model training data)
 * - Channels: 1 (mono - reduces file size, matches model)
 * - Bit rate: 128kbps (good quality for speech)
 * - Format: AAC in M4A container (widely supported, good compression)
 */
export const KOREAN_STT_RECORDING_CONFIG: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  // Override with our specific requirements
  sampleRate: 16000,  // ⚠️ CRITICAL: Must match model's expected input
  numberOfChannels: 1,  // Mono audio
  bitRate: 128000,  // 128 kbps
  extension: '.m4a',  // AAC format
  isMeteringEnabled: true,  // Enable audio level monitoring

  // Platform-specific settings
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 16000,  // Ensure 16kHz on Android too
  },
  ios: {
    outputFormat: 'mpeg4aac',
    audioQuality: 'max' as any,
    sampleRate: 16000,  // Ensure 16kHz on iOS too
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

/**
 * Default audio mode configuration for the app
 *
 * 🔍 AudioMode controls global audio behavior:
 * - playsInSilentMode: Allow playback even when phone is on silent
 * - allowsRecording: Enable microphone access
 * - shouldPlayInBackground: Continue playback when app goes to background (not needed for this app)
 */
export const DEFAULT_AUDIO_MODE = {
  playsInSilentMode: true,  // Important for pronunciation practice
  allowsRecording: true,  // Required for recording feature
  shouldPlayInBackground: false,  // We don't need background playback
} as const;

/**
 * Maximum recording duration (in seconds)
 *
 * 🔍 Why limit duration:
 * - Prevents accidentally long recordings
 * - Keeps file sizes manageable
 * - Model performs better on shorter clips (<30s recommended)
 */
export const MAX_RECORDING_DURATION = 30;

/**
 * Audio file naming pattern
 *
 * @param timestamp - Unix timestamp for unique naming
 * @returns Filename for the recording
 */
export function generateRecordingFileName(timestamp: number = Date.now()): string {
  return `recording_${timestamp}.m4a`;
}
