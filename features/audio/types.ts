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
 * Audio recording configuration
 *
 * 🔍 These settings match the requirements of the Wav2Vec2 model:
 * - 16kHz sample rate (model requirement)
 * - Mono channel (model processes single channel)
 * - High quality AAC encoding
 */
export interface AudioRecordingConfig {
  /** Sample rate in Hz (must be 16000 for Wav2Vec2) */
  sampleRate: 16000;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  numberOfChannels: 1 | 2;
  /** Bit rate for encoding (higher = better quality) */
  bitRate: number;
  /** File extension for the output file */
  extension: '.m4a' | '.wav';
}

/**
 * Audio recording state (from useAudioRecorder)
 *
 * 🔍 This wraps expo-audio's RecorderState with app-specific info
 */
export interface RecordingState {
  /** Whether recording is currently in progress */
  isRecording: boolean;
  /** Current recording duration in seconds */
  currentTime: number;
  /** URI of the recorded file (available after stopping) */
  uri: string | null;
  /** Whether the recorder can record (permissions + ready state) */
  canRecord: boolean;
  /** Current audio level/volume (if metering enabled) */
  metering?: number;
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
