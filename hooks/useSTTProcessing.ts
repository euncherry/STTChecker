/**
 * useSTTProcessing - STT 처리를 위한 Custom Hook
 *
 * @description
 * 오디오 파일을 텍스트로 변환하는 전체 STT 파이프라인을 관리합니다.
 * 기존에 Screen 컴포넌트에 직접 구현되어 있던 70줄 이상의 처리 로직을
 * 재사용 가능한 Hook으로 추상화했습니다.
 *
 * **처리 단계**:
 * 1. 오디오 전처리: WAV 파일 → Float32Array (16kHz, 모노, 정규화)
 * 2. ONNX 추론: Float32Array → Logits (시간 × 어휘 크기)
 * 3. CTC 디코딩: Logits → 텍스트
 * 4. 메트릭 계산: CER, WER 계산 (선택적)
 *
 * **장점**:
 * - 코드 재사용: results.tsx, test.tsx 등 여러 곳에서 사용 가능
 * - 관심사 분리: UI와 비즈니스 로직 분리
 * - 테스트 용이: Hook만 독립적으로 테스트 가능
 * - 타입 안전성: TypeScript 제네릭 활용
 *
 * @example
 * ```typescript
 * function ResultsScreen() {
 *   const {
 *     processAudio,
 *     result,
 *     cerScore,
 *     werScore,
 *     isProcessing,
 *     error
 *   } = useSTTProcessing();
 *
 *   useEffect(() => {
 *     if (audioUri) {
 *       processAudio(audioUri, {
 *         targetText: "안녕하세요",
 *         onProgress: (stage, progress) => {
 *           console.log(`${stage}: ${progress}%`);
 *         }
 *       });
 *     }
 *   }, [audioUri]);
 *
 *   if (isProcessing) return <ActivityIndicator />;
 *   if (error) return <Text>Error: {error}</Text>;
 *
 *   return <Text>{result?.recognizedText}</Text>;
 * }
 * ```
 *
 * @author Claude (Senior RN Engineer)
 * @see ARCHITECTURE_REVIEW.md - Section 5.1
 */

import { useState, useCallback } from "react";
import type {
  STTResult,
  STTProcessOptions,
  EvaluationMetrics,
} from "@/types";
import { useONNX } from "@/utils/onnx/onnxContext";
import { preprocessAudioFile } from "@/utils/stt/audioPreprocessor";
import { runSTTInference } from "@/utils/stt/inference";
import { calculateCER, calculateWER } from "@/utils/stt/metrics";

/**
 * useSTTProcessing Hook의 반환 타입
 */
interface UseSTTProcessingReturn {
  // 데이터
  result: STTResult | null;
  metrics: EvaluationMetrics | null;

  // 상태
  isProcessing: boolean;
  error: string | null;

  // 액션
  processAudio: (
    audioUri: string,
    options?: STTProcessOptions
  ) => Promise<STTResult | null>;
  reset: () => void;
}

/**
 * STT 처리를 위한 Custom Hook
 *
 * @returns {UseSTTProcessingReturn} STT 처리 상태 및 함수들
 */
export function useSTTProcessing(): UseSTTProcessingReturn {
  const { modelInfo, vocabInfo } = useONNX();

  // 상태 관리
  const [result, setResult] = useState<STTResult | null>(null);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 오디오 파일을 STT 처리합니다
   *
   * @param audioUri - 오디오 파일 URI (file:// or content://)
   * @param options - 처리 옵션
   * @returns STT 처리 결과 또는 null (실패 시)
   *
   * @throws {Error} 모델이 로드되지 않았거나 처리 중 오류 발생 시
   *
   * @example
   * ```typescript
   * const { processAudio } = useSTTProcessing();
   *
   * const result = await processAudio(
   *   "file:///path/to/audio.wav",
   *   {
   *     targetText: "안녕하세요",
   *     onProgress: (stage, progress) => {
   *       console.log(`${stage}: ${progress}%`);
   *     }
   *   }
   * );
   *
   * if (result) {
   *   console.log('인식 결과:', result.recognizedText);
   * }
   * ```
   */
  const processAudio = useCallback(
    async (
      audioUri: string,
      options: STTProcessOptions = {}
    ): Promise<STTResult | null> => {
      // 1. 사전 조건 체크
      if (!modelInfo || !vocabInfo) {
        const errorMsg = "모델이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.";
        console.error("[useSTTProcessing] ❌", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsProcessing(true);
      setError(null);
      const startTime = Date.now();

      try {
        console.log("==========================================");
        console.log("[useSTTProcessing] 🎯 STT 처리 시작");
        console.log("[useSTTProcessing] 📁 파일:", audioUri);
        if (options.targetText) {
          console.log("[useSTTProcessing] 📝 목표:", options.targetText);
        }
        console.log("==========================================");

        // 2. 오디오 전처리
        console.log("[useSTTProcessing] 1️⃣ 오디오 전처리 중...");
        options.onProgress?.("preprocessing", 0);

        const audioData = await preprocessAudioFile(audioUri);

        options.onProgress?.("preprocessing", 100);
        console.log(
          `[useSTTProcessing] ✅ 전처리 완료 (${audioData.length} samples)`
        );

        // 3. ONNX 추론
        console.log("[useSTTProcessing] 2️⃣ ONNX 추론 중...");
        options.onProgress?.("inference", 0);

        const transcription = await runSTTInference(
          modelInfo.session,
          audioData,
          vocabInfo,
          modelInfo.inputName,
          modelInfo.outputName
        );

        options.onProgress?.("inference", 100);
        console.log(`[useSTTProcessing] ✅ 인식 완료: "${transcription}"`);

        // 4. 메트릭 계산 (선택적)
        let cerScore: number | null = null;
        let werScore: number | null = null;

        if (options.targetText) {
          console.log("[useSTTProcessing] 3️⃣ 메트릭 계산 중...");
          options.onProgress?.("metrics", 0);

          cerScore = calculateCER(options.targetText, transcription);
          werScore = calculateWER(options.targetText, transcription);

          setMetrics({ cer: cerScore, wer: werScore });

          options.onProgress?.("metrics", 100);
          console.log("[useSTTProcessing] 📊 평가 결과:");
          console.log(`  - CER: ${(cerScore * 100).toFixed(1)}%`);
          console.log(`  - WER: ${(werScore * 100).toFixed(1)}%`);
          console.log(
            `  - 정확도: ${((1 - cerScore) * 100).toFixed(1)}% (문자 기준)`
          );
        }

        // 5. 처리 시간 계산
        const processingTime = (Date.now() - startTime) / 1000;

        // 6. 결과 객체 생성
        const sttResult: STTResult = {
          recognizedText: transcription,
          processingTime,
          sampleCount: audioData.length,
        };

        setResult(sttResult);

        console.log("==========================================");
        console.log("[useSTTProcessing] 🎉 STT 처리 완료!");
        console.log(`[useSTTProcessing] ⏱️ 소요 시간: ${processingTime.toFixed(2)}초`);
        console.log("==========================================");

        return sttResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";

        console.error("==========================================");
        console.error("[useSTTProcessing] ❌ 처리 실패:", errorMessage);
        console.error("==========================================");

        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [modelInfo, vocabInfo] // Dependencies: 모델 정보가 변경되면 함수 재생성
  );

  /**
   * 상태 초기화
   *
   * @description
   * 모든 상태를 초기값으로 리셋합니다.
   * 새로운 오디오를 처리하기 전에 호출하면 유용합니다.
   *
   * @example
   * ```typescript
   * const { reset, processAudio } = useSTTProcessing();
   *
   * // 이전 결과 초기화 후 새 오디오 처리
   * reset();
   * await processAudio(newAudioUri);
   * ```
   */
  const reset = useCallback(() => {
    console.log("[useSTTProcessing] 🔄 상태 초기화");
    setResult(null);
    setMetrics(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    // 데이터
    result,
    metrics,

    // 상태
    isProcessing,
    error,

    // 액션
    processAudio,
    reset,
  };
}

/**
 * 💡 React Hooks 교육: useCallback의 의미
 *
 * @description
 * `useCallback`은 함수를 메모이제이션하여 불필요한 재생성을 방지합니다.
 *
 * **문제 상황**:
 * ```typescript
 * function MyComponent() {
 *   const [count, setCount] = useState(0);
 *
 *   // ❌ 매 렌더링마다 새 함수 생성
 *   const handleClick = () => {
 *     console.log(count);
 *   };
 *
 *   // useEffect의 dependency로 함수 사용 시 문제
 *   useEffect(() => {
 *     // handleClick이 매번 바뀌므로 무한 루프!
 *   }, [handleClick]);
 * }
 * ```
 *
 * **해결**:
 * ```typescript
 * // ✅ useCallback으로 함수 메모이제이션
 * const handleClick = useCallback(() => {
 *   console.log(count);
 * }, [count]);  // count가 변경될 때만 함수 재생성
 * ```
 *
 * **사용 시기**:
 * 1. useEffect의 dependency로 사용되는 함수
 * 2. Props로 전달되는 함수 (자식 컴포넌트 리렌더링 방지)
 * 3. Context에 포함된 함수
 *
 * **사용하지 않아도 되는 경우**:
 * - 단순 이벤트 핸들러 (onClick 등)
 * - 한 번만 호출되는 함수
 * - dependency가 없는 함수
 */

/**
 * 💡 React Hooks 교육: Custom Hook 작성 패턴
 *
 * @description
 * Custom Hook을 작성할 때 따라야 할 Best Practices:
 *
 * **1. 이름은 항상 `use`로 시작**
 * ```typescript
 * // ✅ Good
 * function useSTTProcessing() { ... }
 * function useAudioPlayback() { ... }
 *
 * // ❌ Bad
 * function sttProcessing() { ... }  // React가 Hook으로 인식 안 함
 * ```
 *
 * **2. 명확한 반환 타입 정의**
 * ```typescript
 * interface UseMyHookReturn {
 *   data: string | null;
 *   isLoading: boolean;
 *   fetch: () => Promise<void>;
 * }
 *
 * function useMyHook(): UseMyHookReturn { ... }
 * ```
 *
 * **3. 상태와 액션 분리**
 * ```typescript
 * return {
 *   // 데이터
 *   result,
 *   metrics,
 *
 *   // 상태
 *   isProcessing,
 *   error,
 *
 *   // 액션
 *   processAudio,
 *   reset
 * };
 * ```
 *
 * **4. useCallback 활용**
 * - 외부에서 dependency로 사용될 함수는 useCallback으로 감싸기
 *
 * **5. 에러 처리**
 * - try-catch로 감싸고 error 상태 관리
 *
 * **6. 로깅**
 * - 디버깅을 위한 console.log 추가
 */

/**
 * 💡 TypeScript 교육: Interface 작성 패턴
 *
 * @description
 * Interface 작성 시 주석을 통해 의도를 명확히 전달:
 *
 * ```typescript
 * interface UseMyHookReturn {
 *   // 📊 데이터 - 처리 결과
 *   data: string | null;
 *
 *   // 🔄 상태 - 처리 진행 여부
 *   isLoading: boolean;
 *
 *   // ❌ 에러 - 오류 메시지
 *   error: string | null;
 *
 *   // 🎬 액션 - 데이터 가져오기
 *   fetch: () => Promise<void>;
 * }
 * ```
 *
 * **Props 타입 작성 시**:
 * ```typescript
 * interface ButtonProps {
 *   /** 버튼에 표시될 텍스트 */
 *   title: string;
 *
 *   /** 클릭 시 실행될 콜백 (선택적) */
 *   onPress?: () => void;
 *
 *   /** 비활성화 여부 (기본값: false) */
 *   disabled?: boolean;
 * }
 * ```
 *
 * **JSDoc 활용**:
 * - VSCode에서 마우스 오버 시 설명 표시
 * - 자동완성 시 힌트 제공
 */
