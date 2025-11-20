/**
 * @file features/audio/types.ts
 * @description 오디오 녹음 및 재생 기능을 위한 타입 정의
 *
 * 🎯 기능별 타입:
 * - 오디오 관련 타입을 다른 기능과 분리하여 유지
 * - 다른 코드에 영향을 주지 않고 오디오 구현을 쉽게 수정 가능
 * - 오디오 기능이 생성/소비하는 데이터에 대한 명확한 계약
 */

import type { AudioSource } from '@/types/global';

/**
 * react-native-audio-record를 위한 오디오 녹음 설정
 *
 * 🔍 이 설정은 Wav2Vec2 모델의 요구사항과 일치합니다:
 * - 16kHz 샘플레이트 (모델 요구사항)
 * - 모노 채널 (모델은 단일 채널 처리)
 * - WAV 형식의 16비트 PCM
 *
 * ⚠️ 중요: react-native-audio-record 사용 (expo-audio 아님)
 * - expo-audio는 WAV 형식 녹음 불가
 * - Wav2Vec2 모델은 WAV 입력 필요
 * - react-native-audio-record는 네이티브 WAV 녹음 제공
 */
export interface AudioRecordingConfig {
  /** 샘플레이트(Hz) (Wav2Vec2의 경우 16000이어야 함) */
  sampleRate: number;
  /** 오디오 채널 수 (1 = 모노, 2 = 스테레오) */
  channels: number;
  /** 샘플당 비트 수 (8 또는 16) */
  bitsPerSample: number;
  /** 오디오 소스 (Android 전용, 6 = VOICE_RECOGNITION) */
  audioSource: number;
}

/**
 * 오디오 녹음 상태
 *
 * 🔍 useAudioRecording 훅에서 관리 (react-native-audio-record 래핑)
 */
export interface RecordingState {
  /** 현재 녹음 중인지 여부 */
  isRecording: boolean;
  /** 현재 녹음 시간(초) */
  currentTime: number;
  /** 녹음된 파일의 URI (중지 후 사용 가능) */
  uri: string | null;
  /** 녹음 가능 여부 (권한 허용됨) */
  canRecord: boolean;
}

/**
 * 오디오 재생 상태 (useAudioPlayerStatus에서)
 *
 * 🔍 expo-audio의 AudioStatus를 단순화된 속성으로 래핑
 */
export interface PlaybackState {
  /** 현재 재생 중인지 여부 */
  isPlaying: boolean;
  /** 일시정지 상태인지 여부 */
  isPaused: boolean;
  /** 현재 재생 위치(초) */
  currentTime: number;
  /** 전체 재생 시간(초) */
  duration: number;
  /** 버퍼링 중인지 여부 */
  isBuffering: boolean;
  /** 재생이 막 끝났는지 여부 */
  didJustFinish: boolean;
}

/**
 * 녹음 세션의 결과
 */
export interface RecordingResult {
  /** 녹음된 오디오 파일의 URI */
  uri: string;
  /** 녹음 시간(초) */
  duration: number;
  /** 파일 크기(바이트) */
  size?: number;
}

/**
 * 오디오 권한 상태
 */
export interface AudioPermissions {
  /** 사용자가 마이크 권한을 허용했는지 여부 */
  granted: boolean;
  /** 사용자에게 권한을 요청할 수 있는지 여부 */
  canAskAgain: boolean;
  /** 현재 권한 상태 문자열 */
  status: 'granted' | 'denied' | 'undetermined';
}
