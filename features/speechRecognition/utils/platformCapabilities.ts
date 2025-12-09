/**
 * @file features/speechRecognition/utils/platformCapabilities.ts
 * @description 플랫폼별 음성 인식 기능 지원 여부 확인 유틸리티
 */

import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

/**
 * Android API 레벨 상수
 * Android 13 (API 33) 이상에서 expo-speech-recognition 녹음 기능 지원
 */
export const ANDROID_API_LEVEL = {
  ANDROID_12: 31,  // S
  ANDROID_12L: 32, // S_V2
  ANDROID_13: 33,  // TIRAMISU
  ANDROID_14: 34,  // UPSIDE_DOWN_CAKE
} as const;

/**
 * 플랫폼 음성 인식 기능 정보
 */
export interface PlatformCapabilities {
  /** 현재 플랫폼 (android/ios/web) */
  platform: 'android' | 'ios' | 'web';
  /** Android API 레벨 (Android만) */
  androidApiLevel: number | null;
  /** Android 13 이상 여부 */
  isAndroid13OrAbove: boolean;
  /** 음성 인식 사용 가능 여부 */
  isRecognitionAvailable: boolean;
  /** 온디바이스 인식 지원 여부 */
  supportsOnDeviceRecognition: boolean;
  /** WAV 녹음 지원 여부 (expo-speech-recognition) */
  supportsRecording: boolean;
  /** 하이브리드 모드 사용 가능 여부 (실시간 STT + 녹음 + ONNX) */
  canUseHybridMode: boolean;
  /** 제한 사항 메시지 */
  limitations: string[];
}

/**
 * Android API 레벨 가져오기
 */
export function getAndroidApiLevel(): number | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  return Platform.Version as number;
}

/**
 * Android 13 이상인지 확인
 */
export function isAndroid13OrAbove(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }
  const apiLevel = getAndroidApiLevel();
  return apiLevel !== null && apiLevel >= ANDROID_API_LEVEL.ANDROID_13;
}

/**
 * 현재 플랫폼의 음성 인식 기능 정보 가져오기
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = Platform.OS as 'android' | 'ios' | 'web';
  const androidApiLevel = getAndroidApiLevel();
  const isAndroid13Plus = isAndroid13OrAbove();

  // expo-speech-recognition API 호출
  const recognitionAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
  const onDeviceSupported = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  const recordingSupported = ExpoSpeechRecognitionModule.supportsRecording();

  const limitations: string[] = [];

  // 플랫폼별 제한 사항 확인
  if (platform === 'android') {
    if (!isAndroid13Plus) {
      limitations.push('Android 13 이상에서 실시간 음성 인식이 지원됩니다.');
      limitations.push('현재 버전에서는 녹음 후 분석만 가능합니다.');
    }
    if (!recognitionAvailable) {
      limitations.push('음성 인식 서비스를 사용할 수 없습니다.');
    }
  } else if (platform === 'ios') {
    if (!recognitionAvailable) {
      limitations.push('Siri 및 받아쓰기를 활성화해주세요.');
    }
  } else if (platform === 'web') {
    limitations.push('웹에서는 음성 인식이 지원되지 않습니다.');
  }

  // 하이브리드 모드 사용 가능 여부
  // 조건: 녹음 지원 + 온디바이스 인식 지원 + 인식 사용 가능
  const canUseHybridMode =
    recordingSupported &&
    onDeviceSupported &&
    recognitionAvailable &&
    (platform === 'ios' || isAndroid13Plus);

  return {
    platform,
    androidApiLevel,
    isAndroid13OrAbove: isAndroid13Plus,
    isRecognitionAvailable: recognitionAvailable,
    supportsOnDeviceRecognition: onDeviceSupported,
    supportsRecording: recordingSupported,
    canUseHybridMode,
    limitations,
  };
}

/**
 * 콘솔에 플랫폼 기능 정보 로깅
 */
export function logPlatformCapabilities(): void {
  const caps = getPlatformCapabilities();

  console.log('[PlatformCapabilities] ============================');
  console.log(`[PlatformCapabilities] 플랫폼: ${caps.platform}`);
  if (caps.androidApiLevel !== null) {
    console.log(`[PlatformCapabilities] Android API: ${caps.androidApiLevel}`);
  }
  console.log(`[PlatformCapabilities] Android 13+: ${caps.isAndroid13OrAbove}`);
  console.log(`[PlatformCapabilities] 음성 인식 가능: ${caps.isRecognitionAvailable}`);
  console.log(`[PlatformCapabilities] 온디바이스 지원: ${caps.supportsOnDeviceRecognition}`);
  console.log(`[PlatformCapabilities] 녹음 지원: ${caps.supportsRecording}`);
  console.log(`[PlatformCapabilities] 하이브리드 모드: ${caps.canUseHybridMode}`);
  if (caps.limitations.length > 0) {
    console.log('[PlatformCapabilities] 제한 사항:');
    caps.limitations.forEach((l) => console.log(`  - ${l}`));
  }
  console.log('[PlatformCapabilities] ============================');
}
