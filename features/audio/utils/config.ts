/**
 * @file features/audio/utils/config.ts
 * @description react-native-audio-record를 위한 오디오 설정 상수
 *
 * 🎯 설정을 중앙화하는 이유:
 * - 오디오 설정을 위한 단일 진실 공급원
 * - 앱 전체에서 품질/형식을 쉽게 조정 가능
 * - 모델 요구사항과의 일관성 보장
 *
 * ⚠️ 중요: WAV 형식 필수
 * - Wav2Vec2 모델은 WAV 형식 입력 필요
 * - expo-audio는 WAV 녹음을 지원하지 않음 (m4a/aac만 가능)
 * - 따라서 WAV를 지원하는 react-native-audio-record 사용
 */

import type { AudioRecordingConfig } from '../types';

/**
 * 한국어 STT(Wav2Vec2 모델)에 최적화된 오디오 녹음 설정
 *
 * 🔍 Wav2Vec2 모델 요구사항 기반:
 * - 16kHz 샘플레이트 (모델이 이 샘플레이트로 학습됨)
 * - 모노 채널 (모델은 단일 채널 처리)
 * - 16비트 PCM (WAV 표준)
 * - WAV 형식 (모델의 오디오 전처리 파이프라인에서 필요)
 *
 * 📊 기술 세부사항:
 * - 샘플레이트: 16000 Hz (모델 학습 데이터와 일치)
 * - 채널: 1 (모노 - 파일 크기 감소, 모델과 일치)
 * - 샘플당 비트: 16 (표준 PCM 품질)
 * - 형식: WAV (비압축 PCM, 모델 필수)
 * - 오디오 소스: 6 (VOICE_RECOGNITION - Android에서 음성에 최적화)
 *
 * 🎤 오디오 소스 값 (Android):
 * - 0: DEFAULT
 * - 1: MIC
 * - 6: VOICE_RECOGNITION (STT에 권장 - 노이즈 감소 적용)
 * - 7: VOICE_COMMUNICATION
 */
export const KOREAN_STT_RECORDING_CONFIG: AudioRecordingConfig = {
  sampleRate: 16000,        // ⚠️ 중요: 모델의 예상 입력과 일치해야 함
  channels: 1,              // 모노 오디오
  bitsPerSample: 16,        // 16비트 PCM
  audioSource: 6,           // VOICE_RECOGNITION (Android 전용, STT에 최적)
};

/**
 * 최대 녹음 시간(초)
 *
 * 🔍 시간을 제한하는 이유:
 * - 실수로 긴 녹음 방지
 * - 파일 크기를 관리 가능하게 유지
 * - 모델은 짧은 클립에서 더 나은 성능 (<30초 권장)
 * - 녹음 화면의 기본 자동 중지는 이를 참고로 사용
 */
export const MAX_RECORDING_DURATION = 30;

/**
 * 오디오 파일 이름 지정 패턴
 *
 * ⚠️ 중요: .wav 확장자를 사용해야 함
 * - react-native-audio-record는 WAV 파일 생성
 * - 오디오 전처리기는 WAV 형식 필요
 * - 확장자를 .m4a나 다른 형식으로 변경하지 말 것
 *
 * @param timestamp - 고유 이름 지정을 위한 Unix 타임스탬프
 * @returns 녹음을 위한 파일명 (WAV 형식)
 */
export function generateRecordingFileName(timestamp: number = Date.now()): string {
  return `recording_${timestamp}.wav`;
}
