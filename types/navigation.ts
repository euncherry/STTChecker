/**
 * @file types/navigation.ts
 * @description Expo Router를 위한 전역 내비게이션 타입 정의
 *
 * 🎯 이 파일이 존재하는 이유:
 * - 타입 안전한 내비게이션을 위한 모든 라우트 파라미터 타입을 중앙 집중화
 * - useRouter() 및 useLocalSearchParams() 사용 시 자동 완성 제공
 * - 라우트 파라미터 이름의 오타 방지
 *
 * 📚 사용 예시:
 * ```tsx
 * import { useRouter, useLocalSearchParams } from 'expo-router';
 * import type { RecordScreenParams, ResultsScreenParams } from '@/types/navigation';
 *
 * // 컴포넌트 내부:
 * const router = useRouter();
 * const params = useLocalSearchParams<RecordScreenParams>();
 *
 * // 타입 안전한 내비게이션
 * router.push({
 *   pathname: '/results',
 *   params: {
 *     audioUri: 'file://...',
 *     targetText: '안녕하세요',
 *     recordingDuration: '5'
 *   }
 * });
 * ```
 */

/**
 * /record 화면의 파라미터
 */
export interface RecordScreenParams extends Record<string, string | string[]> {
  /** 사용자가 발음해야 할 목표 텍스트 */
  text: string;
}

/**
 * /results 화면의 파라미터
 */
export interface ResultsScreenParams extends Record<string, string | string[]> {
  /** 녹음된 오디오 파일의 URI */
  audioUri: string;
  /** 발음해야 했던 목표 텍스트 */
  targetText: string;
  /** 녹음 지속 시간(초) (URL 파라미터를 위한 문자열) */
  recordingDuration: string;
  /** 실시간 STT 결과 (Google/Siri 자연어 처리) - Android 13+/iOS만, 미지원 시 빈 문자열 */
  realtimeTranscript: string;
}

/**
 * 타입 안전한 라우팅을 위한 루트 내비게이션 파라미터 리스트
 *
 * 🔍 화면 경로를 파라미터 타입에 매핑합니다
 * Expo Router는 이것을 타입 추론에 사용합니다
 */
export interface RootStackParamList {
  "/": undefined; // 홈 화면 (파라미터 없음)
  "/record": RecordScreenParams;
  "/results": ResultsScreenParams;
  "/(tabs)": undefined;
  "/(tabs)/history": undefined;
  "/(tabs)/test": undefined;
  "/(tabs)/sing": undefined;
}
