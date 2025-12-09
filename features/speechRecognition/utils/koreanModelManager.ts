/**
 * @file features/speechRecognition/utils/koreanModelManager.ts
 * @description 한국어 온디바이스 음성 인식 모델 관리 유틸리티
 */

import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { isAndroid13OrAbove } from './platformCapabilities';

/** 한국어 로케일 코드 */
export const KOREAN_LOCALE = 'ko-KR';

/**
 * 한국어 모델 상태
 */
export interface KoreanModelStatus {
  /** 모델이 설치되어 있는지 여부 */
  isInstalled: boolean;
  /** 설치 확인 가능 여부 (Android 13+ 또는 iOS) */
  canCheck: boolean;
  /** 다운로드 트리거 가능 여부 */
  canTriggerDownload: boolean;
  /** 상태 메시지 */
  message: string;
}

/**
 * 한국어 모델 다운로드 결과
 */
export interface KoreanModelDownloadResult {
  success: boolean;
  status: 'opened_dialog' | 'download_success' | 'download_canceled' | 'not_supported' | 'error';
  message: string;
}

/**
 * 한국어 온디바이스 모델이 설치되어 있는지 확인
 */
export async function checkKoreanModelInstalled(): Promise<KoreanModelStatus> {
  // iOS는 기본적으로 온디바이스 인식 지원
  if (Platform.OS === 'ios') {
    return {
      isInstalled: true,
      canCheck: true,
      canTriggerDownload: false,
      message: 'iOS는 기본적으로 온디바이스 음성 인식을 지원합니다.',
    };
  }

  // Android 12 이하는 온디바이스 인식 미지원
  if (Platform.OS === 'android' && !isAndroid13OrAbove()) {
    return {
      isInstalled: false,
      canCheck: false,
      canTriggerDownload: false,
      message: 'Android 13 이상에서 온디바이스 음성 인식이 지원됩니다.',
    };
  }

  // Android 13+ - 설치된 로케일 확인
  try {
    const supportedLocales = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: 'com.google.android.as',
    });

    const installedLocales = supportedLocales.installedLocales || [];
    const isKoreanInstalled = installedLocales.some(
      (locale) => locale.toLowerCase().startsWith('ko')
    );

    console.log('[KoreanModelManager] 설치된 로케일:', installedLocales.join(', '));
    console.log('[KoreanModelManager] 한국어 설치 여부:', isKoreanInstalled);

    return {
      isInstalled: isKoreanInstalled,
      canCheck: true,
      canTriggerDownload: true,
      message: isKoreanInstalled
        ? '한국어 온디바이스 모델이 설치되어 있습니다.'
        : '한국어 온디바이스 모델이 설치되어 있지 않습니다.',
    };
  } catch (error) {
    console.error('[KoreanModelManager] 로케일 확인 실패:', error);
    return {
      isInstalled: false,
      canCheck: false,
      canTriggerDownload: true,
      message: '모델 상태를 확인할 수 없습니다. 다운로드를 시도해주세요.',
    };
  }
}

/**
 * 한국어 온디바이스 모델 다운로드 트리거
 *
 * @description Android에서 시스템 다이얼로그를 열어 모델 다운로드 진행
 * iOS에서는 기본 지원되므로 호출 불필요
 */
export async function triggerKoreanModelDownload(): Promise<KoreanModelDownloadResult> {
  // iOS는 다운로드 불필요
  if (Platform.OS === 'ios') {
    return {
      success: true,
      status: 'download_success',
      message: 'iOS는 기본적으로 한국어 음성 인식을 지원합니다.',
    };
  }

  // Android 12 이하는 미지원
  if (Platform.OS === 'android' && !isAndroid13OrAbove()) {
    return {
      success: false,
      status: 'not_supported',
      message: 'Android 13 이상에서만 온디바이스 모델 다운로드가 가능합니다.',
    };
  }

  // Android 13+ - 다운로드 트리거
  try {
    console.log('[KoreanModelManager] 🚀 한국어 모델 다운로드 시작...');

    const result = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({
      locale: KOREAN_LOCALE,
    });

    console.log('[KoreanModelManager] 다운로드 결과:', result);

    switch (result.status) {
      case 'opened_dialog':
        // Android 13에서는 다이얼로그만 열림
        return {
          success: true,
          status: 'opened_dialog',
          message: '모델 다운로드 다이얼로그가 열렸습니다. 다운로드를 진행해주세요.',
        };

      case 'download_success':
        // Android 14+에서 다운로드 완료
        return {
          success: true,
          status: 'download_success',
          message: '한국어 모델 다운로드가 완료되었습니다.',
        };

      case 'download_canceled':
        // Android 14+에서 사용자가 취소
        return {
          success: false,
          status: 'download_canceled',
          message: '모델 다운로드가 취소되었습니다.',
        };

      default:
        return {
          success: false,
          status: 'error',
          message: '알 수 없는 결과입니다.',
        };
    }
  } catch (error) {
    console.error('[KoreanModelManager] ❌ 다운로드 실패:', error);
    return {
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 한국어 모델 초기화 (앱 시작 시 호출)
 * ONNX 모델 로딩과 함께 호출하여 한국어 음성 모델도 준비
 */
export async function initializeKoreanModel(): Promise<{
  status: KoreanModelStatus;
  downloadTriggered: boolean;
}> {
  console.log('[KoreanModelManager] 🚀 한국어 모델 초기화 시작...');

  // 1. 현재 상태 확인
  const status = await checkKoreanModelInstalled();
  console.log('[KoreanModelManager] 현재 상태:', status);

  // 2. 설치 안 되어 있고 다운로드 가능하면 트리거
  if (!status.isInstalled && status.canTriggerDownload) {
    console.log('[KoreanModelManager] 모델 미설치, 다운로드 트리거...');
    const downloadResult = await triggerKoreanModelDownload();
    console.log('[KoreanModelManager] 다운로드 결과:', downloadResult);

    return {
      status,
      downloadTriggered: true,
    };
  }

  return {
    status,
    downloadTriggered: false,
  };
}
