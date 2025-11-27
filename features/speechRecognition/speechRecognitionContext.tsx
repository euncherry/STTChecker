/**
 * @file features/speechRecognition/speechRecognitionContext.tsx
 * @description 음성 인식 기능 상태 관리 Context
 *
 * ONNX 모델과 함께 사용되며, 플랫폼별 음성 인식 기능을 관리합니다.
 * - Android 13+: expo-speech-recognition (실시간 STT + 녹음)
 * - Android 12-: react-native-audio-record (녹음만)
 * - iOS: expo-speech-recognition (실시간 STT + 녹음)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getPlatformCapabilities,
  logPlatformCapabilities,
  type PlatformCapabilities,
} from './utils/platformCapabilities';
import {
  checkKoreanModelInstalled,
  triggerKoreanModelDownload,
  type KoreanModelStatus,
} from './utils/koreanModelManager';

/** AsyncStorage 키 */
const UPGRADE_MODAL_DISMISSED_KEY = '@sttchecker_upgrade_modal_dismissed';

/**
 * SpeechRecognition Context 타입
 */
interface SpeechRecognitionContextType {
  /** 플랫폼 기능 정보 */
  capabilities: PlatformCapabilities | null;
  /** 한국어 모델 상태 */
  koreanModelStatus: KoreanModelStatus | null;
  /** 초기화 중 여부 */
  isInitializing: boolean;
  /** 초기화 완료 여부 */
  isInitialized: boolean;
  /** 하이브리드 모드 사용 가능 여부 (실시간 STT + 녹음 + ONNX) */
  canUseHybridMode: boolean;
  /** Android 업그레이드 모달 표시 여부 */
  showUpgradeModal: boolean;
  /** Android 업그레이드 모달 닫기 */
  dismissUpgradeModal: () => void;
  /** 한국어 모델 다운로드 트리거 */
  downloadKoreanModel: () => Promise<void>;
  /** 초기화 재시도 */
  reinitialize: () => Promise<void>;
}

const SpeechRecognitionContext = createContext<SpeechRecognitionContextType>({
  capabilities: null,
  koreanModelStatus: null,
  isInitializing: true,
  isInitialized: false,
  canUseHybridMode: false,
  showUpgradeModal: false,
  dismissUpgradeModal: () => {},
  downloadKoreanModel: async () => {},
  reinitialize: async () => {},
});

export const useSpeechRecognition = () => {
  const context = useContext(SpeechRecognitionContext);
  if (!context) {
    throw new Error(
      'useSpeechRecognition must be used within SpeechRecognitionProvider'
    );
  }
  return context;
};

interface SpeechRecognitionProviderProps {
  children: React.ReactNode;
}

export function SpeechRecognitionProvider({
  children,
}: SpeechRecognitionProviderProps) {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities | null>(
    null
  );
  const [koreanModelStatus, setKoreanModelStatus] =
    useState<KoreanModelStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  /**
   * 초기화 로직
   */
  const initialize = useCallback(async () => {
    console.log('[SpeechRecognitionProvider] 🚀 초기화 시작...');
    setIsInitializing(true);

    try {
      // 1. 플랫폼 기능 확인
      const caps = getPlatformCapabilities();
      setCapabilities(caps);
      logPlatformCapabilities();

      // 2. 웹은 음성 인식 미지원
      if (Platform.OS === 'web') {
        console.log('[SpeechRecognitionProvider] ⚠️ 웹 환경 - 음성 인식 미지원');
        setIsInitialized(true);
        setIsInitializing(false);
        return;
      }

      // 3. Android 12 이하 체크 - 업그레이드 모달 표시 여부 확인
      if (Platform.OS === 'android' && !caps.isAndroid13OrAbove) {
        console.log('[SpeechRecognitionProvider] ⚠️ Android 12 이하 감지');

        // 이전에 모달을 닫은 적이 있는지 확인
        const dismissed = await AsyncStorage.getItem(UPGRADE_MODAL_DISMISSED_KEY);
        if (dismissed !== 'true') {
          setShowUpgradeModal(true);
        }

        setIsInitialized(true);
        setIsInitializing(false);
        return;
      }

      // 4. Android 13+ 또는 iOS - 한국어 모델 상태 확인
      console.log('[SpeechRecognitionProvider] 🔍 한국어 모델 상태 확인 중...');
      const modelStatus = await checkKoreanModelInstalled();
      setKoreanModelStatus(modelStatus);
      console.log('[SpeechRecognitionProvider] 한국어 모델 상태:', modelStatus);

      // 5. Android 13+에서 모델이 설치되어 있지 않으면 다운로드 트리거
      if (
        Platform.OS === 'android' &&
        caps.isAndroid13OrAbove &&
        !modelStatus.isInstalled &&
        modelStatus.canTriggerDownload
      ) {
        console.log(
          '[SpeechRecognitionProvider] 📥 한국어 모델 다운로드 트리거...'
        );
        await triggerKoreanModelDownload();

        // 다운로드 후 상태 재확인 (Android 14+에서는 결과 확인 가능)
        const updatedStatus = await checkKoreanModelInstalled();
        setKoreanModelStatus(updatedStatus);
      }

      setIsInitialized(true);
      console.log('[SpeechRecognitionProvider] ✅ 초기화 완료');
    } catch (error) {
      console.error('[SpeechRecognitionProvider] ❌ 초기화 실패:', error);
      setIsInitialized(true); // 에러가 있어도 앱은 진행
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * Android 업그레이드 모달 닫기
   */
  const dismissUpgradeModal = useCallback(async () => {
    setShowUpgradeModal(false);
    // 다시 표시하지 않도록 저장
    await AsyncStorage.setItem(UPGRADE_MODAL_DISMISSED_KEY, 'true');
    console.log('[SpeechRecognitionProvider] 업그레이드 모달 닫힘');
  }, []);

  /**
   * 한국어 모델 수동 다운로드
   */
  const downloadKoreanModel = useCallback(async () => {
    console.log('[SpeechRecognitionProvider] 📥 수동 한국어 모델 다운로드...');
    const result = await triggerKoreanModelDownload();
    console.log('[SpeechRecognitionProvider] 다운로드 결과:', result);

    // 상태 업데이트
    const updatedStatus = await checkKoreanModelInstalled();
    setKoreanModelStatus(updatedStatus);
  }, []);

  /**
   * 재초기화
   */
  const reinitialize = useCallback(async () => {
    console.log('[SpeechRecognitionProvider] 🔄 재초기화...');
    setIsInitialized(false);
    await initialize();
  }, [initialize]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 하이브리드 모드 사용 가능 여부 계산
  const canUseHybridMode =
    (capabilities?.canUseHybridMode ?? false) ||
    (Platform.OS === 'ios' && isInitialized);

  return (
    <SpeechRecognitionContext.Provider
      value={{
        capabilities,
        koreanModelStatus,
        isInitializing,
        isInitialized,
        canUseHybridMode,
        showUpgradeModal,
        dismissUpgradeModal,
        downloadKoreanModel,
        reinitialize,
      }}
    >
      {children}
    </SpeechRecognitionContext.Provider>
  );
}
