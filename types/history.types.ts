/**
 * 히스토리 관련 TypeScript 타입 정의
 *
 * @description
 * 발음 연습 히스토리 저장 및 관리를 위한 타입들입니다.
 *
 * @author Claude (Senior RN Engineer)
 */

/**
 * 히스토리 아이템
 *
 * @description
 * 한 번의 발음 연습 세션 정보를 저장하는 인터페이스입니다.
 * AsyncStorage에 JSON으로 직렬화되어 저장됩니다.
 *
 * @property id - 고유 식별자 (timestamp 기반)
 * @property targetText - 목표 문장
 * @property recognizedText - STT로 인식된 텍스트
 * @property audioFilePath - 저장된 WAV 파일 URI
 * @property cerScore - CER (문자 오류율, 0~1)
 * @property werScore - WER (단어 오류율, 0~1)
 * @property tags - 사용자 정의 태그 또는 자동 생성 태그
 * @property recordingDuration - 녹음 길이 (초)
 * @property processingTime - STT 처리 시간 (초)
 * @property createdAt - 생성 일시 (ISO 8601 문자열)
 *
 * @example
 * ```typescript
 * const item: HistoryItem = {
 *   id: "1732080000000",
 *   targetText: "안녕하세요",
 *   recognizedText: "안녕하세요",
 *   audioFilePath: "file:///data/user/0/.../audio/recording_123.wav",
 *   cerScore: 0.0,    // 완벽! (0% 오류)
 *   werScore: 0.0,
 *   tags: ["완벽함", "인사말"],
 *   recordingDuration: 2.5,
 *   processingTime: 1.2,
 *   createdAt: "2025-11-20T10:30:00.000Z"
 * };
 * ```
 */
export interface HistoryItem {
  id: string;
  targetText: string;
  recognizedText: string;
  audioFilePath: string;
  cerScore: number;
  werScore: number;
  tags: string[];
  recordingDuration: number;
  processingTime: number;
  createdAt: string;
}

/**
 * 히스토리 저장 입력 데이터
 *
 * @description
 * `saveHistory()` 함수에 전달하는 데이터입니다.
 * `id`와 `createdAt`은 자동 생성되므로 제외됩니다.
 *
 * @example
 * ```typescript
 * const input: HistoryItemInput = {
 *   targetText: "안녕하세요",
 *   recognizedText: "안녕하세요",
 *   audioFilePath: "file:///...",
 *   cerScore: 0.05,
 *   werScore: 0.10,
 *   tags: ["우수"],
 *   recordingDuration: 2.5,
 *   processingTime: 1.2
 * };
 *
 * const saved = await saveHistory(input);
 * console.log(saved.id);  // "1732080000000" (자동 생성)
 * ```
 *
 * 💡 **TypeScript Utility Type: Omit**
 *
 * `Omit<T, K>`는 타입 T에서 키 K를 제외한 타입을 생성합니다.
 *
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // id 제외 (회원가입 시)
 * type UserInput = Omit<User, 'id'>;
 * // { name: string; email: string; }
 *
 * // id, email 제외
 * type UserName = Omit<User, 'id' | 'email'>;
 * // { name: string; }
 * ```
 *
 * **다른 Utility Types**:
 * - `Pick<T, K>`: K만 선택
 * - `Partial<T>`: 모든 프로퍼티 optional
 * - `Required<T>`: 모든 프로퍼티 required
 * - `Readonly<T>`: 모든 프로퍼티 읽기 전용
 */
export type HistoryItemInput = Omit<HistoryItem, "id" | "createdAt">;

/**
 * 스토리지 정보
 *
 * @description
 * 히스토리 저장소의 현재 상태 정보입니다.
 *
 * @property itemCount - 저장된 항목 수
 * @property totalSizeMB - 총 사용 용량 (MB)
 * @property audioDir - 오디오 파일 디렉토리 경로
 *
 * @example
 * ```typescript
 * const info: StorageInfo = {
 *   itemCount: 15,
 *   totalSizeMB: "12.34",
 *   audioDir: "file:///data/user/0/.../Documents/audio"
 * };
 * ```
 */
export interface StorageInfo {
  itemCount: number;
  totalSizeMB: string;
  audioDir: string;
}

/**
 * 히스토리 필터 옵션
 *
 * @description
 * 히스토리 목록을 필터링하기 위한 옵션입니다.
 *
 * @property tags - 태그로 필터링
 * @property startDate - 시작 날짜
 * @property endDate - 종료 날짜
 * @property minCER - 최소 CER (이 값 이상만 표시)
 * @property maxCER - 최대 CER (이 값 이하만 표시)
 *
 * @example
 * ```typescript
 * const filter: HistoryFilterOptions = {
 *   tags: ["완벽함"],
 *   startDate: new Date("2025-11-01"),
 *   endDate: new Date("2025-11-30"),
 *   maxCER: 0.1  // CER 10% 이하만 (90% 이상 정확도)
 * };
 *
 * const filtered = filterHistories(histories, filter);
 * ```
 *
 * 💡 **Optional Properties**
 *
 * `?`를 붙이면 optional property가 됩니다.
 *
 * ```typescript
 * interface FilterOptions {
 *   tags?: string[];      // optional
 *   minCER?: number;      // optional
 *   required: string;     // required
 * }
 *
 * const opts1: FilterOptions = { required: "yes" };  // ✅ OK
 * const opts2: FilterOptions = {
 *   required: "yes",
 *   tags: ["완벽함"]
 * };  // ✅ OK
 * const opts3: FilterOptions = {};  // ❌ 에러! (required 누락)
 * ```
 */
export interface HistoryFilterOptions {
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  minCER?: number;
  maxCER?: number;
}

/**
 * 히스토리 정렬 기준
 *
 * @description
 * 히스토리 목록의 정렬 방식을 지정합니다.
 *
 * @example
 * ```typescript
 * type SortBy =
 *   | 'date-desc'     // 최신순 (기본값)
 *   | 'date-asc'      // 오래된 순
 *   | 'cer-asc'       // CER 낮은 순 (정확도 높은 순)
 *   | 'cer-desc'      // CER 높은 순 (정확도 낮은 순)
 *   | 'duration-desc';  // 녹음 시간 긴 순
 *
 * function sortHistories(items: HistoryItem[], sortBy: SortBy) {
 *   switch (sortBy) {
 *     case 'date-desc':
 *       return items.sort((a, b) =>
 *         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 *       );
 *     case 'cer-asc':
 *       return items.sort((a, b) => a.cerScore - b.cerScore);
 *     // ...
 *   }
 * }
 * ```
 */
export type HistorySortBy =
  | "date-desc"
  | "date-asc"
  | "cer-asc"
  | "cer-desc"
  | "duration-desc"
  | "duration-asc";

/**
 * 태그 통계
 *
 * @description
 * 태그별 사용 빈도 정보입니다.
 *
 * @property tag - 태그 이름
 * @property count - 사용 횟수
 *
 * @example
 * ```typescript
 * const tagStats: TagStatistics[] = [
 *   { tag: "완벽함", count: 5 },
 *   { tag: "우수", count: 10 },
 *   { tag: "양호", count: 3 }
 * ];
 *
 * // 가장 많이 사용된 태그 찾기
 * const mostUsed = tagStats.reduce((prev, current) =>
 *   current.count > prev.count ? current : prev
 * );
 * console.log(mostUsed.tag);  // "우수"
 * ```
 */
export interface TagStatistics {
  tag: string;
  count: number;
}

/**
 * 히스토리 통계
 *
 * @description
 * 전체 히스토리의 통계 정보입니다.
 *
 * @property totalItems - 총 항목 수
 * @property averageCER - 평균 CER
 * @property averageWER - 평균 WER
 * @property totalRecordingTime - 총 녹음 시간 (초)
 * @property totalProcessingTime - 총 처리 시간 (초)
 * @property tagStatistics - 태그별 통계
 *
 * @example
 * ```typescript
 * const stats: HistoryStatistics = {
 *   totalItems: 15,
 *   averageCER: 0.12,     // 평균 88% 정확도
 *   averageWER: 0.18,     // 평균 82% 정확도
 *   totalRecordingTime: 45.5,
 *   totalProcessingTime: 18.2,
 *   tagStatistics: [
 *     { tag: "완벽함", count: 5 },
 *     { tag: "우수", count: 10 }
 *   ]
 * };
 *
 * console.log(`평균 정확도: ${(1 - stats.averageCER) * 100}%`);
 * ```
 */
export interface HistoryStatistics {
  totalItems: number;
  averageCER: number;
  averageWER: number;
  totalRecordingTime: number;
  totalProcessingTime: number;
  tagStatistics: TagStatistics[];
}

/**
 * 💡 TypeScript 교육: Type Guards
 *
 * @description
 * 런타임에 타입을 체크하는 함수입니다.
 *
 * @example
 * ```typescript
 * function isHistoryItem(obj: unknown): obj is HistoryItem {
 *   return (
 *     typeof obj === 'object' &&
 *     obj !== null &&
 *     'id' in obj &&
 *     'targetText' in obj &&
 *     'cerScore' in obj &&
 *     typeof (obj as HistoryItem).cerScore === 'number'
 *   );
 * }
 *
 * // 사용
 * const data: unknown = JSON.parse(jsonString);
 *
 * if (isHistoryItem(data)) {
 *   // 이 블록 안에서 data는 HistoryItem 타입
 *   console.log(data.targetText);  // ✅ OK
 * } else {
 *   console.error("Invalid data");
 * }
 * ```
 *
 * **장점**:
 * - 런타임 타입 안전성 확보
 * - JSON 파싱 후 검증
 * - API 응답 검증
 */
