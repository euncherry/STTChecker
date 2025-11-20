/**
 * @file features/audio/utils/config.ts
 * @description Audio configuration constants for react-native-audio-record
 *
 * 🎯 Why centralize configuration:
 * - Single source of truth for audio settings
 * - Easy to adjust quality/format across the app
 * - Ensures consistency with model requirements
 *
 * ⚠️ IMPORTANT: WAV format is REQUIRED
 * - Wav2Vec2 model requires WAV input
 * - expo-audio cannot record in WAV format (only m4a/aac)
 * - Therefore, we use react-native-audio-record which supports WAV
 */

import type { AudioRecordingConfig } from '../types';

/**
 * Audio recording configuration optimized for Korean STT (Wav2Vec2 model)
 *
 * 🔍 Based on Wav2Vec2 model requirements:
 * - 16kHz sample rate (model was trained on this rate)
 * - Mono channel (model expects single channel)
 * - 16-bit PCM (standard for WAV)
 * - WAV format (required by model's audio preprocessing pipeline)
 *
 * 📊 Technical details:
 * - Sample rate: 16000 Hz (matches model training data)
 * - Channels: 1 (mono - reduces file size, matches model)
 * - Bits per sample: 16 (standard PCM quality)
 * - Format: WAV (uncompressed PCM, required by model)
 * - Audio source: 6 (VOICE_RECOGNITION - optimized for speech on Android)
 *
 * 🎤 Audio Source Values (Android):
 * - 0: DEFAULT
 * - 1: MIC
 * - 6: VOICE_RECOGNITION (recommended for STT - applies noise reduction)
 * - 7: VOICE_COMMUNICATION
 */
export const KOREAN_STT_RECORDING_CONFIG: AudioRecordingConfig = {
  sampleRate: 16000,        // ⚠️ CRITICAL: Must match model's expected input
  channels: 1,              // Mono audio
  bitsPerSample: 16,        // 16-bit PCM
  audioSource: 6,           // VOICE_RECOGNITION (Android-specific, best for STT)
};

/**
 * Maximum recording duration (in seconds)
 *
 * 🔍 Why limit duration:
 * - Prevents accidentally long recordings
 * - Keeps file sizes manageable
 * - Model performs better on shorter clips (<30s recommended)
 * - Default auto-stop in record screen uses this as reference
 */
export const MAX_RECORDING_DURATION = 30;

/**
 * Audio file naming pattern
 *
 * ⚠️ IMPORTANT: Must use .wav extension
 * - react-native-audio-record generates WAV files
 * - Audio preprocessor expects WAV format
 * - Do not change extension to .m4a or other formats
 *
 * @param timestamp - Unix timestamp for unique naming
 * @returns Filename for the recording (WAV format)
 */
export function generateRecordingFileName(timestamp: number = Date.now()): string {
  return `recording_${timestamp}.wav`;
}
