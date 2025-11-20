/**
 * @file features/audio/types.ts
 * @description Type definitions for audio recording and playback feature
 *
 * 🎯 Feature-specific types:
 * - Keep audio-related types isolated from other features
 * - Easy to modify audio implementation without affecting other code
 * - Clear contract for what data the audio feature produces/consumes
 */

import type { AudioSource } from '@/types/global';

/**
 * Audio recording configuration for react-native-audio-record
 *
 * 🔍 These settings match the requirements of the Wav2Vec2 model:
 * - 16kHz sample rate (model requirement)
 * - Mono channel (model processes single channel)
 * - 16-bit PCM in WAV format
 *
 * ⚠️ IMPORTANT: Uses react-native-audio-record (not expo-audio)
 * - expo-audio cannot record WAV format
 * - Wav2Vec2 model requires WAV input
 * - react-native-audio-record provides native WAV recording
 */
export interface AudioRecordingConfig {
  /** Sample rate in Hz (must be 16000 for Wav2Vec2) */
  sampleRate: number;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  channels: number;
  /** Bits per sample (8 or 16) */
  bitsPerSample: number;
  /** Audio source (Android-specific, 6 = VOICE_RECOGNITION) */
  audioSource: number;
}

/**
 * Audio recording state
 *
 * 🔍 Managed by useAudioRecording hook (wraps react-native-audio-record)
 */
export interface RecordingState {
  /** Whether recording is currently in progress */
  isRecording: boolean;
  /** Current recording duration in seconds */
  currentTime: number;
  /** URI of the recorded file (available after stopping) */
  uri: string | null;
  /** Whether the recorder can record (permissions granted) */
  canRecord: boolean;
}

/**
 * Audio playback state (from useAudioPlayerStatus)
 *
 * 🔍 This wraps expo-audio's AudioStatus with simplified properties
 */
export interface PlaybackState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is paused */
  isPaused: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether audio is buffering */
  isBuffering: boolean;
  /** Whether audio has finished playing */
  didJustFinish: boolean;
}

/**
 * Result of a recording session
 */
export interface RecordingResult {
  /** URI of the recorded audio file */
  uri: string;
  /** Duration of the recording in seconds */
  duration: number;
  /** File size in bytes */
  size?: number;
}

/**
 * Audio permission status
 */
export interface AudioPermissions {
  /** Whether the user has granted microphone permission */
  granted: boolean;
  /** Whether we can ask the user for permission */
  canAskAgain: boolean;
  /** Current permission status string */
  status: 'granted' | 'denied' | 'undetermined';
}
