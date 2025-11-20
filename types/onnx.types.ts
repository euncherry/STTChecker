/**
 * ONNX 관련 TypeScript 타입 정의
 *
 * @description
 * ONNX Runtime React Native 라이브러리와 관련된 모든 타입을 정의합니다.
 * 기존 코드에서 사용되던 `any` 타입을 명시적 타입으로 교체하여
 * 타입 안전성을 확보합니다.
 *
 * @author Claude (Senior RN Engineer)
 * @see https://onnxruntime.ai/docs/api/js/
 */

import * as ort from "onnxruntime-react-native";

/**
 * ONNX 모델 정보를 담는 인터페이스
 *
 * @description
 * 로드된 ONNX 모델의 메타데이터와 세션 정보를 저장합니다.
 * InferenceSession은 모델 추론을 위한 핵심 객체입니다.
 *
 * @property session - ONNX Runtime 세션 인스턴스
 *   - 모델 추론을 실행하는 메인 객체
 *   - `session.run()`으로 추론 실행
 *
 * @property inputName - 모델의 입력 텐서 이름
 *   - 예: "input_values" (Wav2Vec2 모델의 경우)
 *   - session.inputNames[0]에서 가져옴
 *
 * @property outputName - 모델의 출력 텐서 이름
 *   - 예: "logits" (CTC 모델의 경우)
 *   - session.outputNames[0]에서 가져옴
 *
 * @property modelPath - 로컬 파일 시스템의 모델 경로
 *   - 예: "file:///data/user/0/.../cache/model.onnx"
 *
 * @example
 * ```typescript
 * const modelInfo: ModelInfo = {
 *   session: await ort.InferenceSession.create(modelPath),
 *   inputName: "input_values",
 *   outputName: "logits",
 *   modelPath: "file:///..."
 * };
 * ```
 */
export interface ModelInfo {
  session: ort.InferenceSession;
  inputName: string;
  outputName: string;
  modelPath: string;
}

/**
 * 모델 로딩 진행 상황 콜백 타입
 *
 * @description
 * 모델 로딩 중 진행 상황을 UI에 알리기 위한 콜백 함수 타입입니다.
 *
 * @param progress - 진행률 (0~100)
 *
 * @example
 * ```typescript
 * const onProgress: ProgressCallback = (progress) => {
 *   console.log(`로딩 중: ${progress}%`);
 *   setLoadingProgress(progress);
 * };
 *
 * await loadONNXModel(onProgress);
 * ```
 */
export type ProgressCallback = (progress: number) => void;

/**
 * CTC 디코딩을 위한 Logits 텐서 타입
 *
 * @description
 * ONNX 모델 출력(logits)의 타입입니다.
 * 실제로는 `ort.Tensor` 타입이지만, 명시적으로 별칭을 두어
 * 코드의 의도를 명확히 합니다.
 *
 * @property dims - 텐서의 차원 [batch_size, time_steps, vocab_size]
 *   - 예: [1, 312, 33] → 배치 1, 타임스텝 312, 어휘 크기 33
 *
 * @property data - 텐서 데이터 (Float32Array)
 *   - 크기: batch_size * time_steps * vocab_size
 *
 * @property type - 텐서 타입 (보통 'float32')
 *
 * @example
 * ```typescript
 * const logits: LogitsTensor = results['logits'];
 * console.log(logits.dims);  // [1, 312, 33]
 * ```
 */
export type LogitsTensor = ort.Tensor;

/**
 * Vocab 데이터 (토큰 → ID 매핑)
 *
 * @description
 * vocab.json에서 로드된 토큰 문자열 → ID 매핑 객체입니다.
 * 일반 객체 형태로, Map이 아닙니다.
 *
 * @example
 * ```typescript
 * const vocabData: VocabData = {
 *   "안": 0,
 *   "녕": 1,
 *   "[PAD]": 1204,
 *   "[UNK]": 1203,
 *   "|": 859  // blank token (공백)
 * };
 * ```
 */
export interface VocabData {
  [key: string]: number;
}

/**
 * 어휘(Vocabulary) 정보를 담는 인터페이스
 *
 * @description
 * SentencePiece 토크나이저에서 사용되는 어휘 정보를 저장합니다.
 * CTC 디코딩 시 토큰 ID를 문자열로 변환하는 데 사용됩니다.
 *
 * ⚠️ **중요**: 이 타입은 `utils/onnx/vocabLoader.ts`의 실제 반환 타입과 일치합니다!
 *
 * @property vocab - 토큰 문자열 → ID 매핑 객체 (일반 객체)
 *   - vocab.json에서 직접 로드된 객체
 *   - 예: { "안": 0, "녕": 1, ..., "|": 859 }
 *
 * @property idToToken - ID → 토큰 문자열 역매핑 (Map)
 *   - CTC 디코딩 시 사용 (ID → 문자열 변환)
 *   - 예: Map(0 => "안", 1 => "녕", ..., 859 => "|")
 *
 * @property padToken - 패딩 토큰 ID
 *   - 보통 "[PAD]" 문자의 ID
 *   - 예: 1204
 *
 * @property unkToken - Unknown 토큰 ID
 *   - 보통 "[UNK]" 문자의 ID
 *   - 예: 1203
 *
 * @property blankToken - CTC blank 토큰 ID
 *   - 보통 "|" 문자가 blank(공백)을 의미
 *   - 예: 859
 *
 * @property vocabSize - 전체 어휘 크기
 *   - Object.keys(vocab).length
 *   - 예: 1205
 *
 * @example
 * ```typescript
 * const vocabInfo: VocabInfo = {
 *   vocab: { "안": 0, "녕": 1, "|": 859, "[PAD]": 1204, "[UNK]": 1203 },
 *   idToToken: new Map([[0, "안"], [1, "녕"], [859, "|"]]),
 *   padToken: 1204,
 *   unkToken: 1203,
 *   blankToken: 859,
 *   vocabSize: 1205
 * };
 *
 * // 사용 예시 1: ID → 토큰 변환 (CTC 디코딩)
 * const tokenText = vocabInfo.idToToken.get(tokenId);  // "안"
 *
 * // 사용 예시 2: 토큰 → ID 변환
 * const tokenId = vocabInfo.vocab["안"];  // 0
 * ```
 */
export interface VocabInfo {
  vocab: VocabData;
  idToToken: Map<number, string>;
  padToken: number;
  unkToken: number;
  blankToken: number;
  vocabSize: number;
}

/**
 * 오디오 전처리 통계 정보
 *
 * @description
 * 오디오 데이터의 통계 정보를 저장합니다.
 * 디버깅 및 품질 검증에 사용됩니다.
 *
 * @property min - 최소값
 * @property max - 최대값
 * @property mean - 평균값 (정규화 후 ~0)
 * @property variance - 분산
 * @property rms - RMS (Root Mean Square, 오디오 볼륨 지표)
 *
 * @example
 * ```typescript
 * const stats: AudioStats = {
 *   min: -3.2,
 *   max: 2.8,
 *   mean: 0.0001,  // 정규화 후 거의 0
 *   variance: 0.98,
 *   rms: 0.45
 * };
 * ```
 */
export interface AudioStats {
  min: number;
  max: number;
  mean: number;
  variance: number;
  rms: number;
}

/**
 * WAV 파일 정보
 *
 * @description
 * WAV 파일 헤더에서 파싱한 정보를 저장합니다.
 *
 * @property numChannels - 채널 수 (1: 모노, 2: 스테레오)
 * @property sampleRate - 샘플레이트 (Hz) - 보통 16000, 44100, 48000
 * @property bitsPerSample - 비트 깊이 (8, 16, 24, 32)
 * @property dataSize - 오디오 데이터 크기 (bytes)
 *
 * @example
 * ```typescript
 * const wavInfo: WAVFileInfo = {
 *   numChannels: 1,      // 모노
 *   sampleRate: 16000,   // 16kHz
 *   bitsPerSample: 16,   // 16-bit PCM
 *   dataSize: 32000      // 32KB
 * };
 * ```
 */
export interface WAVFileInfo {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataSize: number;
}

/**
 * 💡 TypeScript 교육: Interface vs Type
 *
 * ### Interface
 * - 객체 구조 정의에 특화
 * - 확장(extends) 가능
 * - 병합(declaration merging) 가능
 * - 클래스와 함께 사용하기 좋음
 *
 * ### Type
 * - 유니온, 교차, 제네릭 등 복잡한 타입 정의 가능
 * - Primitive 타입, Union 타입 정의 가능
 * - 함수 타입 정의에 적합
 *
 * ### 선택 기준
 * - 객체 구조: Interface 우선 ✅
 * - 함수 타입: Type 사용 ✅
 * - Union Type: Type만 가능 ✅
 * - 확장성 필요: Interface 우선 ✅
 *
 * @example
 * ```typescript
 * // ✅ Interface - 객체 구조
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * // ✅ Type - 함수 타입
 * type Callback = (progress: number) => void;
 *
 * // ✅ Type - Union
 * type Status = 'loading' | 'success' | 'error';
 * ```
 */
