/**
 * @file features/audio/hooks/useAudioRecording.ts
 * @description Custom hook for audio recording using react-native-audio-record
 *
 * 🎯 Why this hook exists:
 * - Provides a clean, reusable interface for WAV recording
 * - Handles permissions, lifecycle, and error states automatically
 * - Encapsulates react-native-audio-record logic away from UI components
 * - Maintains feature-based architecture while using the right library
 *
 * ⚠️ IMPORTANT: Why react-native-audio-record (not expo-audio)?
 * - Wav2Vec2 model REQUIRES WAV format input
 * - expo-audio can only record m4a/aac format (not WAV)
 * - react-native-audio-record provides native WAV recording
 * - Audio preprocessor (parseWAVFile) expects WAV format
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

import { useEffect, useState, useCallback, useRef } from 'react';
import AudioRecord from 'react-native-audio-record';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Paths } from 'expo-file-system';
import {
  KOREAN_STT_RECORDING_CONFIG,
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
  /** Request microphone permissions */
  requestPermissions: () => Promise<boolean>;
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Custom hook for managing audio recordings using react-native-audio-record
 *
 * 🏗️ Architecture:
 * 1. Initializes AudioRecord with WAV config on mount
 * 2. Manages permission state
 * 3. Tracks recording state with manual timer
 * 4. Provides clean API for start/stop operations
 *
 * ⚙️ Key features:
 * - WAV format recording (required by Wav2Vec2 model)
 * - 16kHz sample rate (model requirement)
 * - Automatic permission handling
 * - TypeScript-first design
 * - Feature-based architecture
 *
 * 🔍 Differences from expo-audio approach:
 * - Imperative API (AudioRecord.start/stop) instead of declarative hooks
 * - Manual state management instead of useAudioRecorderState
 * - Platform-specific permission handling
 * - Generates WAV files instead of m4a/aac
 *
 * @returns Recording controls and state
 */
export function useAudioRecording(): UseAudioRecordingReturn {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<AudioPermissions | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer for tracking recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  /**
   * Initialize AudioRecord on mount
   *
   * 🔍 Why useEffect here:
   * - Sets up AudioRecord configuration when component mounts
   * - Checks permission status automatically
   * - Cleans up when component unmounts
   */
  useEffect(() => {
    initializeRecorder();

    return () => {
      // Cleanup: stop timer if running
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Initialize AudioRecord with WAV configuration
   *
   * 🎯 What this does:
   * 1. Configures AudioRecord with model-compatible settings
   * 2. Checks current microphone permissions
   * 3. Prepares the recorder for use
   */
  const initializeRecorder = async (): Promise<void> => {
    try {
      console.log('[useAudioRecording] 🚀 Initializing AudioRecord...');

      // 1. Initialize AudioRecord with WAV config
      const options = {
        ...KOREAN_STT_RECORDING_CONFIG,
        wavFile: generateRecordingFileName(),  // Generate unique filename
      };

      AudioRecord.init(options);
      console.log('[useAudioRecording] ✅ AudioRecord initialized with WAV config');
      console.log('[useAudioRecording] 📋 Config:', options);

      // 2. Check current permission status
      await checkPermissions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      console.error('[useAudioRecording] ❌ Initialization failed:', errorMessage);
      setError(errorMessage);
    }
  };

  /**
   * Check microphone permission status
   *
   * 🔍 Platform-specific:
   * - Android: Uses PermissionsAndroid API
   * - iOS: Assumes permission will be requested on first use
   */
  const checkPermissions = async (): Promise<void> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        setPermissions({
          granted,
          canAskAgain: true,  // Android always allows asking
          status: granted ? 'granted' : 'undetermined',
        });

        console.log('[useAudioRecording] 📋 Permission status:', granted ? 'granted' : 'not granted');
      } else {
        // iOS: Permission will be requested on first AudioRecord.start()
        setPermissions({
          granted: true,  // Assume granted for iOS (will fail at runtime if not)
          canAskAgain: true,
          status: 'undetermined',
        });
      }
    } catch (err) {
      console.error('[useAudioRecording] ❌ Permission check failed:', err);
    }
  };

  /**
   * Request microphone permissions from the user
   *
   * 🔍 This shows the system permission dialog on Android
   * Should be called before startRecording() if permissions not granted
   *
   * @returns True if permission was granted
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAudioRecording] 🔐 Requesting microphone permissions...');

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '마이크 권한 필요',
            message: '발음 연습을 위해 마이크 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

        setPermissions({
          granted: isGranted,
          canAskAgain: granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          status: isGranted ? 'granted' : 'denied',
        });

        if (!isGranted) {
          console.warn('[useAudioRecording] ⚠️ Microphone permission denied');
          Alert.alert(
            '마이크 권한 필요',
            '발음 연습을 위해 마이크 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [{ text: '확인' }]
          );
        } else {
          console.log('[useAudioRecording] ✅ Microphone permission granted');
        }

        return isGranted;
      } else {
        // iOS: Permission is requested automatically by AudioRecord
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission request failed';
      console.error('[useAudioRecording] ❌ Permission request error:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Start the recording timer
   *
   * 🔍 Tracks elapsed time during recording
   */
  const startTimer = (): void => {
    recordingStartTimeRef.current = Date.now();
    setCurrentTime(0);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
      setCurrentTime(elapsed);
    }, 100);  // Update every 100ms for smooth display
  };

  /**
   * Stop the recording timer
   */
  const stopTimer = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Start recording audio
   *
   * 🎯 What happens:
   * 1. Checks permissions
   * 2. Starts AudioRecord
   * 3. Starts timer for duration tracking
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // 1. Verify permissions
      if (Platform.OS === 'android' && !permissions?.granted) {
        console.log('[useAudioRecording] ⚠️ No permission, requesting...');
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required to record');
        }
      }

      // 2. Start AudioRecord
      console.log('[useAudioRecording] 🎤 Starting recording...');
      AudioRecord.start();
      setIsRecording(true);
      startTimer();
      console.log('[useAudioRecording] ✅ Recording started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('[useAudioRecording] ❌ Start recording error:', errorMessage);
      setError(errorMessage);
      setIsRecording(false);
      stopTimer();
      Alert.alert('녹음 시작 실패', errorMessage);
    }
  }, [permissions, requestPermissions]);

  /**
   * Stop recording and return the file URI
   *
   * 🎯 What happens:
   * 1. Stops AudioRecord
   * 2. Gets the file path
   * 3. Formats URI properly (Android needs file:// prefix)
   * 4. Returns result with URI and duration
   *
   * @returns Recording result with URI and metadata, or null if failed
   */
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      console.log('[useAudioRecording] 🛑 Stopping recording...');

      // 1. Stop the timer first to get accurate duration
      const finalDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      stopTimer();

      // 2. Stop AudioRecord
      const audioFile = await AudioRecord.stop();

      // 3. Format file URI
      // Android returns absolute path without file:// prefix
      let fileUri = audioFile;
      if (Platform.OS === 'android' && !audioFile.startsWith('file://')) {
        fileUri = `file://${audioFile}`;
      }

      setIsRecording(false);
      setRecordingUri(fileUri);
      setCurrentTime(0);

      console.log('[useAudioRecording] ✅ Recording stopped');
      console.log(`[useAudioRecording] 📁 File: ${fileUri}`);
      console.log(`[useAudioRecording] ⏱️ Duration: ${finalDuration.toFixed(2)}s`);

      return {
        uri: fileUri,
        duration: finalDuration,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      console.error('[useAudioRecording] ❌ Stop recording error:', errorMessage);
      setError(errorMessage);
      setIsRecording(false);
      stopTimer();
      setCurrentTime(0);
      return null;
    }
  }, []);

  // Construct RecordingState object
  const state: RecordingState = {
    isRecording,
    currentTime,
    uri: recordingUri,
    canRecord: permissions?.granted ?? false,
  };

  return {
    state,
    permissions,
    startRecording,
    stopRecording,
    requestPermissions,
    error,
  };
}
