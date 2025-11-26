/**
 * @file features/audio/hooks/useAudioRecording.ts
 * @description react-native-audio-record를 사용한 오디오 녹음 커스텀 훅
 *
 * 🎯 이 훅이 존재하는 이유:
 * - WAV 녹음을 위한 깔끔하고 재사용 가능한 인터페이스 제공
 * - 권한, 생명주기, 에러 상태를 자동으로 처리
 * - react-native-audio-record 로직을 UI 컴포넌트와 분리
 * - 올바른 라이브러리를 사용하면서 기능 기반 아키텍처 유지
 *
 * ⚠️ 중요: react-native-audio-record를 사용하는 이유 (expo-audio 아님)?
 * - Wav2Vec2 모델은 WAV 형식 입력 필요
 * - expo-audio는 WAV 녹음 불가 (m4a/aac만 가능)
 * - react-native-audio-record는 네이티브 WAV 녹음 제공
 * - 오디오 전처리기(parseWAVFile)는 WAV 형식 필요
 *
 * 📚 사용 예시:
 * ```tsx
 * const { startRecording, stopRecording, state, error } = useAudioRecording();
 *
 * // 컴포넌트에서:
 * <Button onPress={startRecording} disabled={!state.canRecord}>
 *   녹음 시작
 * </Button>
 * <Text>{state.isRecording ? '녹음 중...' : '준비됨'}</Text>
 * <Text>{state.currentTime.toFixed(1)}초</Text>
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
 * useAudioRecording 훅의 반환 타입
 */
interface UseAudioRecordingReturn {
  /** 현재 녹음 상태 */
  state: RecordingState;
  /** 권한 상태 */
  permissions: AudioPermissions | null;
  /** 새 녹음 시작 */
  startRecording: () => Promise<void>;
  /** 현재 녹음 중지 및 파일 URI 반환 */
  stopRecording: () => Promise<RecordingResult | null>;
  /** 마이크 권한 요청 */
  requestPermissions: () => Promise<boolean>;
  /** 문제가 발생한 경우 에러 메시지 */
  error: string | null;
}

/**
 * react-native-audio-record를 사용한 오디오 녹음 관리 커스텀 훅
 *
 * 🏗️ 아키텍처:
 * 1. 마운트 시 WAV 설정으로 AudioRecord 초기화
 * 2. 권한 상태 관리
 * 3. 수동 타이머로 녹음 상태 추적
 * 4. 시작/중지 작업을 위한 깔끔한 API 제공
 *
 * ⚙️ 주요 기능:
 * - WAV 형식 녹음 (Wav2Vec2 모델 필요)
 * - 16kHz 샘플레이트 (모델 요구사항)
 * - 자동 권한 처리
 * - TypeScript 우선 설계
 * - 기능 기반 아키텍처
 *
 * 🔍 expo-audio 접근 방식과의 차이점:
 * - 선언형 훅 대신 명령형 API (AudioRecord.start/stop)
 * - useAudioRecorderState 대신 수동 상태 관리
 * - 플랫폼별 권한 처리
 * - m4a/aac 대신 WAV 파일 생성
 *
 * @returns 녹음 제어 및 상태
 */
export function useAudioRecording(): UseAudioRecordingReturn {
  // 녹음 상태
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<AudioPermissions | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 녹음 시간 추적을 위한 타이머
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  /**
   * 마운트 시 AudioRecord 초기화
   *
   * 🔍 여기서 useEffect를 사용하는 이유:
   * - 컴포넌트가 마운트될 때 AudioRecord 설정
   * - 권한 상태를 자동으로 확인
   * - 언마운트 시 정리
   */
  useEffect(() => {
    initializeRecorder();

    return () => {
      // 정리: 실행 중인 경우 타이머 중지
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * WAV 설정으로 AudioRecord 초기화
   *
   * 🎯 수행 작업:
   * 1. 모델 호환 설정으로 AudioRecord 구성
   * 2. 현재 마이크 권한 확인
   * 3. 사용을 위해 레코더 준비
   */
  const initializeRecorder = async (): Promise<void> => {
    try {
      console.log('[useAudioRecording] 🚀 AudioRecord 초기화 중...');

      // 1. WAV 설정으로 AudioRecord 초기화
      const options = {
        ...KOREAN_STT_RECORDING_CONFIG,
        wavFile: generateRecordingFileName(),  // 고유 파일명 생성
      };

      AudioRecord.init(options);
      console.log('[useAudioRecording] ✅ WAV 설정으로 AudioRecord 초기화됨');
      console.log('[useAudioRecording] 📋 설정:', options);

      // 2. 현재 권한 상태 확인
      await checkPermissions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 초기화 오류';
      console.error('[useAudioRecording] ❌ 초기화 실패:', errorMessage);
      setError(errorMessage);
    }
  };

  /**
   * 마이크 권한 상태 확인
   *
   * 🔍 플랫폼별:
   * - Android: PermissionsAndroid API 사용
   * - iOS: 첫 사용 시 권한이 요청된다고 가정
   */
  const checkPermissions = async (): Promise<void> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        setPermissions({
          granted,
          canAskAgain: true,  // Android는 항상 요청 허용
          status: granted ? 'granted' : 'undetermined',
        });

        console.log('[useAudioRecording] 📋 권한 상태:', granted ? '허용됨' : '허용 안 됨');
      } else {
        // iOS: 권한은 첫 AudioRecord.start()에서 요청됨
        setPermissions({
          granted: true,  // iOS의 경우 허용됨으로 가정 (실행 시 실패 시 거부됨)
          canAskAgain: true,
          status: 'undetermined',
        });
      }
    } catch (err) {
      console.error('[useAudioRecording] ❌ 권한 확인 실패:', err);
    }
  };

  /**
   * 사용자로부터 마이크 권한 요청
   *
   * 🔍 Android에서 시스템 권한 대화상자 표시
   * 권한이 허용되지 않은 경우 startRecording() 전에 호출해야 함
   *
   * @returns 권한이 허용되면 true
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAudioRecording] 🔐 마이크 권한 요청 중...');

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
          console.warn('[useAudioRecording] ⚠️ 마이크 권한 거부됨');
          Alert.alert(
            '마이크 권한 필요',
            '발음 연습을 위해 마이크 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [{ text: '확인' }]
          );
        } else {
          console.log('[useAudioRecording] ✅ 마이크 권한 허용됨');
        }

        return isGranted;
      } else {
        // iOS: 권한은 AudioRecord에서 자동으로 요청됨
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '권한 요청 실패';
      console.error('[useAudioRecording] ❌ 권한 요청 오류:', errorMessage);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * 녹음 타이머 시작
   *
   * 🔍 녹음 중 경과 시간 추적
   */
  const startTimer = (): void => {
    recordingStartTimeRef.current = Date.now();
    setCurrentTime(0);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
      setCurrentTime(elapsed);
    }, 100);  // 부드러운 표시를 위해 100ms마다 업데이트
  };

  /**
   * 녹음 타이머 중지
   */
  const stopTimer = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * 오디오 녹음 시작
   *
   * 🎯 수행 작업:
   * 1. 권한 확인
   * 2. AudioRecord 시작
   * 3. 시간 추적을 위한 타이머 시작
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // 1. 권한 확인
      if (Platform.OS === 'android' && !permissions?.granted) {
        console.log('[useAudioRecording] ⚠️ 권한 없음, 요청 중...');
        const granted = await requestPermissions();
        if (!granted) {
          throw new Error('녹음을 위해 마이크 권한이 필요합니다');
        }
      }

      // 2. AudioRecord 시작
      console.log('[useAudioRecording] 🎤 녹음 시작 중...');
      AudioRecord.start();
      setIsRecording(true);
      startTimer();
      console.log('[useAudioRecording] ✅ 녹음 시작됨');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '녹음 시작 실패';
      console.error('[useAudioRecording] ❌ 녹음 시작 오류:', errorMessage);
      setError(errorMessage);
      setIsRecording(false);
      stopTimer();
      Alert.alert('녹음 시작 실패', errorMessage);
    }
  }, [permissions, requestPermissions]);

  /**
   * 녹음 중지 및 파일 URI 반환
   *
   * 🎯 수행 작업:
   * 1. AudioRecord 중지
   * 2. 파일 경로 가져오기
   * 3. URI를 올바르게 포맷 (Android는 file:// 접두사 필요)
   * 4. URI 및 메타데이터와 함께 결과 반환
   *
   * @returns URI 및 메타데이터가 포함된 녹음 결과, 실패 시 null
   */
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      console.log('[useAudioRecording] 🛑 녹음 중지 중...');

      // 1. 정확한 시간을 얻기 위해 먼저 타이머 중지
      const finalDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      stopTimer();

      // 2. AudioRecord 중지
      const audioFile = await AudioRecord.stop();

      // 3. 파일 URI 포맷
      // Android는 file:// 접두사 없이 절대 경로 반환
      let fileUri = audioFile;
      if (Platform.OS === 'android' && !audioFile.startsWith('file://')) {
        fileUri = `file://${audioFile}`;
      }

      setIsRecording(false);
      setRecordingUri(fileUri);
      setCurrentTime(0);

      console.log('[useAudioRecording] ✅ 녹음 중지됨');
      console.log(`[useAudioRecording] 📁 파일: ${fileUri}`);
      console.log(`[useAudioRecording] ⏱️ 시간: ${finalDuration.toFixed(2)}초`);

      return {
        uri: fileUri,
        duration: finalDuration,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '녹음 중지 실패';
      console.error('[useAudioRecording] ❌ 녹음 중지 오류:', errorMessage);
      setError(errorMessage);
      setIsRecording(false);
      stopTimer();
      setCurrentTime(0);
      return null;
    }
  }, []);

  // RecordingState 객체 구성
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
