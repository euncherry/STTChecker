/**
 * @file features/audio/hooks/useAudioRecording.ts
 * @description Custom hook for audio recording using expo-audio
 *
 * 🎯 Why this hook exists:
 * - Replaces react-native-audio-record with modern expo-audio API
 * - Provides a clean, reusable interface for recording functionality
 * - Handles permissions, lifecycle, and error states automatically
 * - Encapsulates recording logic away from UI components
 *
 * 🔄 Migration from react-native-audio-record:
 * BEFORE (old API):
 * ```tsx
 * AudioRecord.init(options);
 * AudioRecord.start();
 * const uri = await AudioRecord.stop();
 * ```
 *
 * AFTER (new hook):
 * ```tsx
 * const { startRecording, stopRecording, state } = useAudioRecording();
 * startRecording();
 * const result = await stopRecording();
 * ```
 *
 * 📚 Usage example:
 * ```tsx
 * const { startRecording, stopRecording, state, error } = useAudioRecording();
 *
 * // In your component:
 * <Button onPress={startRecording} disabled={!state.canRecord}>
 *   Start Recording
 * </Button>
 * <Text>{state.isRecording ? 'Recording...' : 'Ready'}</Text>
 * <Text>{state.currentTime.toFixed(1)}s</Text>
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  setAudioModeAsync,
  AudioModule,
} from 'expo-audio';
import { Alert } from 'react-native';
import {
  KOREAN_STT_RECORDING_CONFIG,
  DEFAULT_AUDIO_MODE,
  generateRecordingFileName,
} from '../utils/config';
import type { RecordingState, RecordingResult, AudioPermissions } from '../types';

/**
 * Return type for useAudioRecording hook
 */
interface UseAudioRecordingReturn {
  /** Current recording state */
  state: RecordingState;
  /** Permission status */
  permissions: AudioPermissions | null;
  /** Start a new recording */
  startRecording: () => Promise<void>;
  /** Stop the current recording and return the file URI */
  stopRecording: () => Promise<RecordingResult | null>;
  /** Pause the current recording */
  pauseRecording: () => void;
  /** Resume a paused recording */
  resumeRecording: () => void;
  /** Request microphone permissions */
  requestPermissions: () => Promise<boolean>;
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Custom hook for managing audio recordings using expo-audio
 *
 * 🏗️ Architecture:
 * 1. useAudioRecorder: Creates the recorder instance (from expo-audio)
 * 2. useAudioRecorderState: Monitors recording state in real-time
 * 3. Wraps everything in a clean API with error handling
 *
 * ⚙️ Key differences from react-native-audio-record:
 * - Declarative hooks instead of imperative API
 * - Automatic state management
 * - Built-in permission handling
 * - TypeScript-first design
 * - Cross-platform consistency (iOS, Android, Web)
 *
 * @returns Recording controls and state
 */
export function useAudioRecording(): UseAudioRecordingReturn {
  // ✅ Create recorder instance with our STT-optimized config
  // This replaces: AudioRecord.init(options)
  const recorder = useAudioRecorder(KOREAN_STT_RECORDING_CONFIG);

  // ✅ Get real-time recording state (polls every 500ms by default)
  // This replaces: manual timer management with setInterval
  const recorderState = useAudioRecorderState(recorder);

  // Local state for permissions and errors
  const [permissions, setPermissions] = useState<AudioPermissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  /**
   * Initialize audio subsystem and check permissions on mount
   *
   * 🔍 Why useEffect here:
   * - Sets up audio mode when component mounts
   * - Checks permission status automatically
   * - Cleans up when component unmounts
   */
  useEffect(() => {
    initializeAudio();
  }, []);

  /**
   * Initialize audio mode and check permissions
   *
   * 🎯 What this does:
   * 1. Configures global audio mode (silent mode behavior, etc.)
   * 2. Checks current microphone permissions
   * 3. Prepares the recorder for use
   */
  const initializeAudio = async (): Promise<void> => {
    try {
      console.log('[useAudioRecording] 🚀 Initializing audio subsystem...');

      // 1. Set audio mode for recording
      // This tells iOS/Android how to handle audio in this app
      await setAudioModeAsync(DEFAULT_AUDIO_MODE);
      console.log('[useAudioRecording] ✅ Audio mode configured');

      // 2. Check current permission status (doesn't show dialog)
      const permissionStatus = await AudioModule.getRecordingPermissionsAsync();
      setPermissions({
        granted: permissionStatus.granted,
        canAskAgain: permissionStatus.canAskAgain,
        status: permissionStatus.status as AudioPermissions['status'],
      });
      console.log('[useAudioRecording] 📋 Permission status:', permissionStatus.status);

      // 3. Prepare the recorder (creates internal state, allocates resources)
      await recorder.prepareToRecordAsync();
      console.log('[useAudioRecording] ✅ Recorder prepared and ready');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      console.error('[useAudioRecording] ❌ Initialization failed:', errorMessage);
      setError(errorMessage);
    }
  };

  /**
   * Request microphone permissions from the user
   *
   * 🔍 This shows the system permission dialog
   * Should be called before startRecording() if permissions not granted
   *
   * @returns True if permission was granted
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAudioRecording] 🔐 Requesting microphone permissions...');

      const permissionResponse = await AudioModule.requestRecordingPermissionsAsync();
      const newPermissions: AudioPermissions = {
        granted: permissionResponse.granted,
        canAskAgain: permissionResponse.canAskAgain,
        status: permissionResponse.status as AudioPermissions['status'],
      };

      setPermissions(newPermissions);

      if (!permissionResponse.granted) {
        console.warn('[useAudioRecording] ⚠️ Microphone permission denied');
        Alert.alert(
          '마이크 권한 필요',
          '발음 연습을 위해 마이크 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return false;
      }

      console.log('[useAudioRecording] ✅ Microphone permission granted');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      console.error('[useAudioRecording] ❌ Permission request error:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Start recording audio
   *
   * 🔄 Replaces: AudioRecord.start()
   *
   * 🎯 What happens:
   * 1. Checks permissions
   * 2. Starts recording
   * 3. Tracks start time for duration calculation
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // 1. Verify permissions
      if (!permissions?.granted) {
        console.log('[useAudioRecording] ⚠️ No permission, requesting...');
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required to record');
        }
      }

      // 2. Ensure recorder is prepared
      if (!recorderState.canRecord) {
        console.log('[useAudioRecording] 🔄 Recorder not ready, preparing...');
        await recorder.prepareToRecordAsync();
      }

      // 3. Start recording
      console.log('[useAudioRecording] 🎤 Starting recording...');
      recorder.record();
      setRecordingStartTime(Date.now());
      console.log('[useAudioRecording] ✅ Recording started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('[useAudioRecording] ❌ Start recording error:', errorMessage);
      setError(errorMessage);
      Alert.alert('녹음 시작 실패', errorMessage);
    }
  }, [permissions, recorderState.canRecord, recorder, requestPermissions]);

  /**
   * Stop recording and return the file URI
   *
   * 🔄 Replaces: const uri = await AudioRecord.stop()
   *
   * @returns Recording result with URI and metadata, or null if failed
   */
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      console.log('[useAudioRecording] 🛑 Stopping recording...');

      // 1. Stop the recorder
      await recorder.stop();

      // 2. Get the file URI
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // 3. Calculate duration
      const duration = (Date.now() - recordingStartTime) / 1000;

      console.log('[useAudioRecording] ✅ Recording stopped');
      console.log(`[useAudioRecording] 📁 File: ${uri}`);
      console.log(`[useAudioRecording] ⏱️ Duration: ${duration.toFixed(2)}s`);

      return {
        uri,
        duration,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      console.error('[useAudioRecording] ❌ Stop recording error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [recorder, recordingStartTime]);

  /**
   * Pause the current recording
   *
   * ✨ New capability (not available in react-native-audio-record)
   */
  const pauseRecording = useCallback((): void => {
    try {
      console.log('[useAudioRecording] ⏸️ Pausing recording...');
      recorder.pause();
      console.log('[useAudioRecording] ✅ Recording paused');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause recording';
      console.error('[useAudioRecording] ❌ Pause error:', errorMessage);
      setError(errorMessage);
    }
  }, [recorder]);

  /**
   * Resume a paused recording
   *
   * ✨ New capability (not available in react-native-audio-record)
   */
  const resumeRecording = useCallback((): void => {
    try {
      console.log('[useAudioRecording] ▶️ Resuming recording...');
      recorder.record();
      console.log('[useAudioRecording] ✅ Recording resumed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume recording';
      console.error('[useAudioRecording] ❌ Resume error:', errorMessage);
      setError(errorMessage);
    }
  }, [recorder]);

  // Transform expo-audio's RecorderState into our app's RecordingState
  const state: RecordingState = {
    isRecording: recorderState.isRecording,
    currentTime: recorderState.durationMillis / 1000,  // Convert ms to seconds
    uri: recorderState.url,
    canRecord: recorderState.canRecord,
    metering: recorderState.metering,
  };

  return {
    state,
    permissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestPermissions,
    error,
  };
}
