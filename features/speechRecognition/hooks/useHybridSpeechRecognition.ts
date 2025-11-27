/**
 * @file features/speechRecognition/hooks/useHybridSpeechRecognition.ts
 * @description 하이브리드 음성 인식 Hook
 *
 * Android 13+/iOS: expo-speech-recognition (실시간 STT + WAV 녹음)
 * Android 12-: react-native-audio-record (WAV 녹음만)
 *
 * 두 방식 모두 16kHz WAV 파일을 생성하여 ONNX 모델에서 사용할 수 있습니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import AudioRecord from 'react-native-audio-record';
import { Paths } from 'expo-file-system';

import { useSpeechRecognition as useSpeechRecognitionContext } from '../speechRecognitionContext';
import { KOREAN_LOCALE } from '../utils/koreanModelManager';

/**
 * 녹음 상태
 */
export type RecognitionStatus =
  | 'idle'           // 대기 중
  | 'starting'       // 시작 중
  | 'recognizing'    // 인식 중
  | 'stopping'       // 종료 중
  | 'completed'      // 완료
  | 'error';         // 오류

/**
 * 하이브리드 음성 인식 결과
 */
export interface HybridRecognitionResult {
  /** 실시간 STT 결과 (Google/Siri 자연어 처리) - Android 13+/iOS만 */
  realtimeTranscript: string | null;
  /** WAV 파일 경로 (ONNX 처리용) */
  audioUri: string | null;
  /** 녹음 시간 (초) */
  duration: number;
}

/**
 * Hook 반환 타입
 */
interface UseHybridSpeechRecognitionReturn {
  /** 현재 상태 */
  status: RecognitionStatus;
  /** 실시간 STT 결과 (말하는 동안 업데이트) */
  realtimeTranscript: string;
  /** 최종 STT 결과 */
  finalTranscript: string;
  /** WAV 파일 URI */
  audioUri: string | null;
  /** 녹음 시간 (초) */
  duration: number;
  /** 에러 메시지 */
  error: string | null;
  /** 하이브리드 모드 사용 가능 여부 */
  canUseHybridMode: boolean;
  /** 녹음 시작 */
  startRecognition: () => Promise<void>;
  /** 녹음 중지 */
  stopRecognition: () => Promise<HybridRecognitionResult>;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 하이브리드 음성 인식 Hook
 *
 * @description
 * Android 13+/iOS에서는 expo-speech-recognition을 사용하여:
 * - 실시간 STT (Google/Siri)
 * - WAV 파일 녹음 (16kHz)
 *
 * Android 12 이하에서는 react-native-audio-record를 사용하여:
 * - WAV 파일 녹음만 (16kHz)
 * - 실시간 STT 없음
 */
export function useHybridSpeechRecognition(): UseHybridSpeechRecognitionReturn {
  const { canUseHybridMode, capabilities } = useSpeechRecognitionContext();

  // 상태
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 타이머 ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 폴백 모드 사용 여부 (Android 12 이하)
  const useFallbackMode = Platform.OS === 'android' && !canUseHybridMode;

  /**
   * expo-speech-recognition 이벤트 리스너
   */
  useSpeechRecognitionEvent('start', () => {
    console.log('[HybridSTT] 🎤 인식 시작');
    setStatus('recognizing');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    console.log('[HybridSTT] 📝 결과:', transcript, 'isFinal:', event.isFinal);

    if (event.isFinal) {
      setFinalTranscript(transcript);
    } else {
      setRealtimeTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('audioend', (event) => {
    console.log('[HybridSTT] 🔊 오디오 종료, URI:', event.uri);
    if (event.uri) {
      setAudioUri(event.uri);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('[HybridSTT] ✅ 인식 종료');
    stopTimer();
    setStatus('completed');
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('[HybridSTT] ❌ 에러:', event.error, event.message);
    // 'aborted' 에러는 정상 종료로 처리
    if (event.error !== 'aborted') {
      setError(event.message || event.error);
      setStatus('error');
    }
    stopTimer();
  });

  /**
   * 타이머 시작
   */
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setDuration(0);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDuration(elapsed);
    }, 100);
  }, []);

  /**
   * 타이머 중지
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const finalDuration = (Date.now() - startTimeRef.current) / 1000;
    setDuration(finalDuration);
    return finalDuration;
  }, []);

  /**
   * 폴백 모드 녹음 초기화 (Android 12 이하)
   */
  const initFallbackRecording = useCallback(() => {
    const fileName = `recording_${Date.now()}.wav`;
    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6, // VOICE_RECOGNITION
      wavFile: fileName,
    });
    console.log('[HybridSTT] 📼 폴백 녹음 초기화:', fileName);
  }, []);

  /**
   * 녹음 시작
   */
  const startRecognition = useCallback(async () => {
    console.log('[HybridSTT] 🚀 녹음 시작 요청...');
    console.log('[HybridSTT] 하이브리드 모드:', canUseHybridMode);
    console.log('[HybridSTT] 폴백 모드:', useFallbackMode);

    // 상태 초기화
    setStatus('starting');
    setRealtimeTranscript('');
    setFinalTranscript('');
    setAudioUri(null);
    setError(null);
    setDuration(0);

    try {
      if (useFallbackMode) {
        // Android 12 이하: react-native-audio-record 사용
        console.log('[HybridSTT] 📼 폴백 모드로 녹음 시작');
        initFallbackRecording();
        AudioRecord.start();
        setStatus('recognizing');
        startTimer();
      } else {
        // Android 13+/iOS: expo-speech-recognition 사용
        console.log('[HybridSTT] 🎤 하이브리드 모드로 녹음 시작');

        // 권한 요청
        const permissionResult =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permissionResult.granted) {
          throw new Error('마이크 권한이 필요합니다.');
        }

        // 녹음 시작 (실시간 STT + WAV 저장)
        ExpoSpeechRecognitionModule.start({
          lang: KOREAN_LOCALE,
          interimResults: true,
          continuous: true,
          requiresOnDeviceRecognition: true, // 로컬 전용
          addsPunctuation: true,
          recordingOptions: {
            persist: true,
            outputDirectory: Paths.cache.uri,
            outputFileName: `recording_${Date.now()}.wav`,
            outputSampleRate: 16000, // ONNX 모델용 16kHz
            outputEncoding: 'pcmFormatInt16', // 16-bit PCM
          },
        });

        startTimer();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '녹음 시작 실패';
      console.error('[HybridSTT] ❌ 시작 실패:', errorMessage);
      setError(errorMessage);
      setStatus('error');
    }
  }, [canUseHybridMode, useFallbackMode, initFallbackRecording, startTimer]);

  /**
   * 녹음 중지
   */
  const stopRecognition = useCallback(async (): Promise<HybridRecognitionResult> => {
    console.log('[HybridSTT] 🛑 녹음 중지 요청...');
    setStatus('stopping');

    const finalDuration = stopTimer();

    try {
      if (useFallbackMode) {
        // Android 12 이하: react-native-audio-record 중지
        const audioFile = await AudioRecord.stop();
        let fileUri = audioFile;
        if (Platform.OS === 'android' && !audioFile.startsWith('file://')) {
          fileUri = `file://${audioFile}`;
        }

        console.log('[HybridSTT] 📼 폴백 녹음 완료:', fileUri);
        setAudioUri(fileUri);
        setStatus('completed');

        return {
          realtimeTranscript: null, // 폴백 모드에서는 실시간 STT 없음
          audioUri: fileUri,
          duration: finalDuration,
        };
      } else {
        // Android 13+/iOS: expo-speech-recognition 중지
        ExpoSpeechRecognitionModule.stop();

        // 'end' 이벤트에서 상태가 업데이트됨
        // audioUri는 'audioend' 이벤트에서 설정됨

        // 결과 대기 (이벤트가 비동기로 처리됨)
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
          realtimeTranscript: finalTranscript || realtimeTranscript,
          audioUri,
          duration: finalDuration,
        };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '녹음 중지 실패';
      console.error('[HybridSTT] ❌ 중지 실패:', errorMessage);
      setError(errorMessage);
      setStatus('error');

      return {
        realtimeTranscript: null,
        audioUri: null,
        duration: finalDuration,
      };
    }
  }, [
    useFallbackMode,
    stopTimer,
    finalTranscript,
    realtimeTranscript,
    audioUri,
  ]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    console.log('[HybridSTT] 🔄 상태 초기화');
    setStatus('idle');
    setRealtimeTranscript('');
    setFinalTranscript('');
    setAudioUri(null);
    setDuration(0);
    setError(null);
    stopTimer();
  }, [stopTimer]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    realtimeTranscript,
    finalTranscript,
    audioUri,
    duration,
    error,
    canUseHybridMode,
    startRecognition,
    stopRecognition,
    reset,
  };
}
