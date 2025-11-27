/**
 * @file features/speechRecognition/index.ts
 * @description 음성 인식 기능 모듈 내보내기
 */

// Context
export {
  SpeechRecognitionProvider,
  useSpeechRecognition,
} from './speechRecognitionContext';

// Hooks
export {
  useHybridSpeechRecognition,
  type RecognitionStatus,
  type HybridRecognitionResult,
} from './hooks/useHybridSpeechRecognition';

// Utils
export {
  getPlatformCapabilities,
  isAndroid13OrAbove,
  getAndroidApiLevel,
  logPlatformCapabilities,
  ANDROID_API_LEVEL,
  type PlatformCapabilities,
} from './utils/platformCapabilities';

export {
  checkKoreanModelInstalled,
  triggerKoreanModelDownload,
  initializeKoreanModel,
  KOREAN_LOCALE,
  type KoreanModelStatus,
  type KoreanModelDownloadResult,
} from './utils/koreanModelManager';
