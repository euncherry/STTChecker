/**
 * Custom Hooks Barrel Export
 *
 * @description
 * 모든 Custom Hooks를 한 곳에서 import할 수 있도록 하는 barrel export 파일입니다.
 *
 * @example
 * ```typescript
 * // ❌ Before (개별 import)
 * import { useSTTProcessing } from '@/hooks/useSTTProcessing';
 * import { useAudioPlayback } from '@/hooks/useAudioPlayback';
 *
 * // ✅ After (barrel export 사용)
 * import { useSTTProcessing, useAudioPlayback } from '@/hooks';
 * ```
 *
 * @author Claude (Senior RN Engineer)
 */

// ==================== STT 처리 Hook ====================
export { useSTTProcessing } from "./useSTTProcessing";

// ==================== 오디오 재생 Hook ====================
export { useAudioPlayback } from "./useAudioPlayback";

/**
 * 💡 프로젝트 구조: Hooks 디렉토리
 *
 * ```
 * hooks/
 * ├── index.ts                  # Barrel export (이 파일)
 * ├── useSTTProcessing.ts       # STT 처리 로직
 * ├── useAudioPlayback.ts       # 오디오 재생 관리
 * ├── useHistoryManager.ts      # 히스토리 CRUD (향후 추가)
 * └── useRecording.ts           # 녹음 관리 (향후 추가)
 * ```
 *
 * **향후 추가 가능한 Hooks**:
 *
 * 1. `useHistoryManager` - 히스토리 관리
 *    - 히스토리 CRUD 로직을 Hook으로 추상화
 *    - history.tsx에서 사용
 *
 * 2. `useRecording` - 녹음 관리
 *    - 녹음 시작/중지, 카운트다운 등
 *    - record.tsx에서 사용
 *
 * 3. `usePermissions` - 권한 관리
 *    - 마이크, 파일 시스템 권한 요청
 *    - 여러 화면에서 재사용
 *
 * 4. `useAutoTags` - 자동 태그 생성
 *    - CER/WER 기반 태그 제안
 *    - results.tsx, history.tsx에서 사용
 */

/**
 * 💡 Custom Hooks 작성 가이드
 *
 * ### 1. 단일 책임 원칙 (Single Responsibility)
 * - 하나의 Hook은 하나의 기능만
 * - ❌ `useEverything` (모든 기능)
 * - ✅ `useSTTProcessing`, `useAudioPlayback` (기능별 분리)
 *
 * ### 2. 명확한 인터페이스
 * - 반환 타입을 Interface로 명시
 * - 파라미터에 기본값 제공
 *
 * ```typescript
 * interface UseMyHookReturn {
 *   data: string | null;
 *   loading: boolean;
 *   error: string | null;
 *   fetch: () => Promise<void>;
 * }
 *
 * function useMyHook(
 *   initialValue?: string  // 기본값: undefined
 * ): UseMyHookReturn {
 *   // ...
 * }
 * ```
 *
 * ### 3. 에러 처리
 * - try-catch로 감싸기
 * - error 상태 관리
 * - 사용자에게 친절한 에러 메시지
 *
 * ```typescript
 * const [error, setError] = useState<string | null>(null);
 *
 * try {
 *   await doSomething();
 * } catch (err) {
 *   const msg = err instanceof Error ? err.message : '알 수 없는 오류';
 *   setError(msg);
 * }
 * ```
 *
 * ### 4. 로깅
 * - console.log로 디버깅 정보 제공
 * - 이모지 사용으로 가독성 향상
 *
 * ```typescript
 * console.log('[useMyHook] 🚀 작업 시작');
 * console.log('[useMyHook] ✅ 성공');
 * console.error('[useMyHook] ❌ 실패:', error);
 * ```
 *
 * ### 5. useCallback 활용
 * - dependency로 사용될 함수는 useCallback
 * - 불필요한 재렌더링 방지
 *
 * ```typescript
 * const fetchData = useCallback(async () => {
 *   // ...
 * }, [dependency1, dependency2]);
 * ```
 *
 * ### 6. TypeScript 타입 안전성
 * - 모든 파라미터, 반환값에 타입 명시
 * - `any` 사용 금지
 * - 제네릭 활용
 *
 * ```typescript
 * function useAsync<T>(
 *   asyncFn: () => Promise<T>
 * ): { data: T | null; loading: boolean } {
 *   // ...
 * }
 * ```
 */

/**
 * 💡 Hook 테스트
 *
 * @description
 * Custom Hook은 `@testing-library/react-hooks`로 테스트할 수 있습니다.
 *
 * @example
 * ```typescript
 * import { renderHook, act } from '@testing-library/react-hooks';
 * import { useSTTProcessing } from './useSTTProcessing';
 *
 * test('should process audio file', async () => {
 *   const { result } = renderHook(() => useSTTProcessing());
 *
 *   await act(async () => {
 *     await result.current.processAudio('file:///test.wav');
 *   });
 *
 *   expect(result.current.result).not.toBeNull();
 *   expect(result.current.error).toBeNull();
 * });
 * ```
 */
