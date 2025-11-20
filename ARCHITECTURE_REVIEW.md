# STTChecker 아키텍처 리뷰 & 리팩토링 가이드

**작성일**: 2025-11-20
**대상**: React Native 개발자, TypeScript 학습자
**목적**: 코드 품질 향상, 유지보수성 개선, TypeScript 활용도 증대

---

## 📋 목차

1. [현재 아키텍처 분석](#1-현재-아키텍처-분석)
2. [발견된 문제점](#2-발견된-문제점)
3. [개선된 아키텍처 제안](#3-개선된-아키텍처-제안)
4. [TypeScript 타입 안전성 개선](#4-typescript-타입-안전성-개선)
5. [Custom Hooks를 통한 관심사 분리](#5-custom-hooks를 통한-관심사-분리)
6. [리팩토링 로드맵](#6-리팩토링-로드맵)

---

## 1. 현재 아키텍처 분석

### 1.1 폴더 구조 (현재)

```
STTChecker/
├── app/                    # 📱 스크린 컴포넌트 (Expo Router)
│   ├── (tabs)/            # 탭 네비게이션 그룹
│   ├── _layout.tsx        # 루트 레이아웃 (모델 로딩)
│   ├── record.tsx         # 녹음 화면 (415줄)
│   ├── results.tsx        # 결과 화면 (611줄) ⚠️
│   └── ...
├── components/             # ♻️ 재사용 가능 UI 컴포넌트
│   ├── CustomHeader.tsx
│   ├── KaraokeText.tsx
│   └── WaveSurferWebView.tsx
├── utils/                  # 🔧 비즈니스 로직 & 유틸리티
│   ├── onnx/              # AI 모델 관리
│   ├── stt/               # STT 처리 로직
│   ├── storage/           # 데이터 영속성
│   └── karaoke/           # 가라오케 타이밍
└── constants/              # 🎨 테마 & 상수
```

### 1.2 장점

✅ **새로운 Expo SDK 사용**
- `expo-file-system` v19의 `File`, `Directory` 클래스 사용
- `expo-audio`의 Hook 기반 API (`useAudioPlayer`, `useAudioPlayerStatus`)

✅ **관심사 분리**
- UI(`app/`, `components/`)와 비즈니스 로직(`utils/`) 분리
- ONNX, STT, Storage가 각각 별도 디렉토리로 관리

✅ **좋은 로깅 패턴**
- 일관된 로그 포맷: `[ModuleName] 🚀 메시지`
- 이모지 사용으로 로그 가독성 향상

---

## 2. 발견된 문제점

### 2.1 TypeScript 타입 안전성 부족

#### 문제 1: `any` 타입 남발

**위치**: `utils/onnx/modelLoader.ts:8`
```typescript
export interface ModelInfo {
  session: any;  // ❌ ONNX InferenceSession 타입이 존재하는데 any 사용
  inputName: string;
  outputName: string;
  modelPath: string;
}
```

**위치**: `utils/stt/inference.ts:6`
```typescript
export async function runSTTInference(
  session: any,  // ❌ any 사용
  audioData: Float32Array,
  vocabInfo: VocabInfo,
  inputName: string,
  outputName: string
): Promise<string>
```

**왜 문제인가?**
- 타입 체크 불가 → 런타임 에러 위험 ⬆️
- IDE 자동완성 불가 → 개발자 생산성 ⬇️
- 리팩토링 시 오류 감지 불가

#### 문제 2: 타입 정의 분산

각 파일에 타입이 분산되어 있어 재사용성 낮음:
- `HistoryItem` in `historyManager.ts`
- `ModelInfo` in `modelLoader.ts`
- `VocabInfo` in `vocabLoader.ts`

### 2.2 아키텍처 문제

#### 문제 1: 비대한 스크린 컴포넌트

**`app/results.tsx`: 611줄** ⚠️

```typescript
export default function ResultsScreen() {
  // 1. 상태 관리 (8개 이상)
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  // ...

  // 2. STT 처리 로직 (70줄)
  const processAudio = async () => { /* ... */ };

  // 3. 태그 관리 로직
  const suggestAutoTags = () => { /* ... */ };

  // 4. 오디오 재생 로직
  const togglePlayback = () => { /* ... */ };

  // 5. 저장 로직
  const saveToHistory = async () => { /* ... */ };

  // 6. UI 렌더링 (200줄 이상)
  return ( /* ... */ );
}
```

**문제점**:
- UI와 비즈니스 로직 혼재
- 테스트 어려움
- 코드 재사용 불가
- 가독성 저하

#### 문제 2: 중복된 오디오 플레이어 로직

**`app/results.tsx`**:
```typescript
const audioPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
const playerStatus = useAudioPlayerStatus(audioPlayer);

const togglePlayback = () => {
  if (playerStatus.playing) {
    audioPlayer.pause();
  } else {
    if (playerStatus.currentTime >= playerStatus.duration - 0.1) {
      audioPlayer.seekTo(0);
    }
    audioPlayer.play();
  }
};
```

**`app/(tabs)/history.tsx`**:
```typescript
// ✅ 거의 동일한 코드 반복
const audioPlayer = useAudioPlayer(null);
const playerStatus = useAudioPlayerStatus(audioPlayer);

const togglePlayback = useCallback(async (item: HistoryItem) => {
  // 같은 로직 반복...
}, [playingId, playerStatus, audioPlayer]);
```

**문제점**: DRY 원칙 위반 (Don't Repeat Yourself)

### 2.3 Expo SDK 사용 현황

✅ **잘 사용된 부분**:
- `expo-file-system`: 새로운 `File`, `Directory` API 사용 ✅
- `expo-audio`: `useAudioPlayer` hooks 사용 ✅

⚠️ **개선 가능 부분**:
- `react-native-audio-record` 사용 (expo-audio의 `useAudioRecorder`로 대체 가능)

---

## 3. 개선된 아키텍처 제안

### 3.1 새로운 폴더 구조

```
STTChecker/
├── app/                    # 📱 스크린 (UI만 담당)
│   ├── (tabs)/
│   ├── _layout.tsx
│   ├── record.tsx         # ✨ Slim: ~200줄 (기존 415줄)
│   ├── results.tsx        # ✨ Slim: ~300줄 (기존 611줄)
│   └── ...
│
├── components/             # ♻️ 재사용 가능 UI 컴포넌트
│   └── ...
│
├── hooks/                  # 🎣 ✨ NEW: Custom Hooks (비즈니스 로직)
│   ├── useSTTProcessing.ts       # STT 처리 (오디오 → 텍스트)
│   ├── useAudioPlayback.ts       # 오디오 재생 관리
│   ├── useHistoryManager.ts      # 히스토리 CRUD
│   ├── useRecording.ts           # 녹음 관리
│   └── index.ts                  # 편리한 import를 위한 barrel export
│
├── types/                  # 📝 ✨ NEW: TypeScript 타입 정의
│   ├── onnx.types.ts             # ONNX 관련 타입
│   ├── audio.types.ts            # 오디오 관련 타입
│   ├── history.types.ts          # 히스토리 관련 타입
│   └── index.ts                  # Barrel export
│
├── utils/                  # 🔧 순수 유틸리티 함수 (Pure Functions)
│   ├── onnx/
│   ├── stt/
│   ├── storage/
│   └── karaoke/
│
└── constants/              # 🎨 테마 & 상수
```

### 3.2 아키텍처 원칙

#### 원칙 1: **Separation of Concerns (관심사 분리)**

```
┌─────────────┐
│   Screens   │  ← UI만 담당, 데이터 표시
└──────┬──────┘
       │ uses
┌──────▼──────┐
│ Custom Hooks│  ← 비즈니스 로직, 상태 관리
└──────┬──────┘
       │ uses
┌──────▼──────┐
│   Utils     │  ← 순수 함수, 데이터 변환
└─────────────┘
```

#### 원칙 2: **DRY (Don't Repeat Yourself)**

중복 코드를 Custom Hook으로 추상화:
- `useAudioPlayback` → 오디오 재생 로직 재사용
- `useSTTProcessing` → STT 처리 로직 재사용

#### 원칙 3: **Type Safety First**

모든 `any` 제거, 명시적 타입 정의:
- ONNX → `ort.InferenceSession`, `ort.Tensor`
- 공통 타입 → `types/` 디렉토리로 중앙화

---

## 4. TypeScript 타입 안전성 개선

### 4.1 ONNX 타입 정의 (`types/onnx.types.ts`)

#### Before ❌
```typescript
export interface ModelInfo {
  session: any;  // 타입 정보 없음
  inputName: string;
  outputName: string;
  modelPath: string;
}
```

#### After ✅
```typescript
import * as ort from 'onnxruntime-react-native';

/**
 * ONNX 모델 정보를 담는 인터페이스
 *
 * @property session - ONNX Runtime 세션 인스턴스
 * @property inputName - 모델의 입력 텐서 이름 (예: "input_values")
 * @property outputName - 모델의 출력 텐서 이름 (예: "logits")
 * @property modelPath - 로컬 파일 시스템의 모델 경로
 */
export interface ModelInfo {
  session: ort.InferenceSession;  // ✅ 명시적 타입
  inputName: string;
  outputName: string;
  modelPath: string;
}

/**
 * CTC 디코딩을 위한 Logits 텐서 타입
 */
export type LogitsTensor = ort.Tensor;

/**
 * 모델 로딩 진행 상황 콜백
 *
 * @param progress - 진행률 (0~100)
 */
export type ProgressCallback = (progress: number) => void;
```

**교육적 설명**:

**Q: 왜 `any` 대신 `ort.InferenceSession`을 사용하나요?**

A: TypeScript의 핵심 가치는 **컴파일 타임 타입 체크**입니다.

```typescript
// ❌ any 사용 시
const session: any = await loadModel();
session.invalidMethod();  // 컴파일 OK, 런타임 에러! 💥

// ✅ 명시적 타입 사용 시
const session: ort.InferenceSession = await loadModel();
session.invalidMethod();  // 컴파일 에러! IDE가 즉시 알려줌 ✅
```

**장점**:
1. IDE 자동완성 지원 (IntelliSense)
2. 리팩토링 안전성 향상
3. 버그를 런타임 전에 발견

### 4.2 오디오 타입 정의 (`types/audio.types.ts`)

```typescript
import type { AudioSource } from 'expo-audio';

/**
 * STT 처리 결과
 */
export interface STTResult {
  /** 인식된 텍스트 */
  recognizedText: string;
  /** 처리 시간 (초) */
  processingTime: number;
  /** 오디오 데이터 샘플 수 */
  sampleCount: number;
}

/**
 * STT 처리 옵션
 */
export interface STTProcessOptions {
  /** 목표 문장 (CER/WER 계산용) */
  targetText?: string;
  /** 진행 상황 콜백 */
  onProgress?: (stage: STTProcessingStage, progress: number) => void;
}

/**
 * STT 처리 단계
 */
export type STTProcessingStage =
  | 'preprocessing'  // 오디오 전처리 중
  | 'inference'      // ONNX 추론 중
  | 'decoding'       // CTC 디코딩 중
  | 'metrics';       // 메트릭 계산 중

/**
 * 오디오 재생 상태
 */
export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  source: AudioSource | null;
}
```

**교육적 설명**:

**Q: Union Type (`|`)은 무엇인가요?**

```typescript
export type STTProcessingStage =
  | 'preprocessing'
  | 'inference'
  | 'decoding'
  | 'metrics';

// 사용 예시
function updateProgress(stage: STTProcessingStage, progress: number) {
  // stage는 4가지 값 중 하나만 가능
  // 타입 안전성 보장 ✅
}

updateProgress('preprocessing', 0.5);  // ✅ OK
updateProgress('unknown', 0.5);        // ❌ 컴파일 에러!
```

**장점**:
- 허용된 값만 사용 가능 (오타 방지)
- 자동완성 지원
- 리팩토링 시 모든 사용처 추적 가능

### 4.3 제네릭(Generic) 활용

#### 상황: 여러 타입의 Async State 관리

**Before** (중복 코드):
```typescript
// 히스토리용
const [histories, setHistories] = useState<HistoryItem[]>([]);
const [historiesLoading, setHistoriesLoading] = useState(false);
const [historiesError, setHistoriesError] = useState<string | null>(null);

// STT 결과용
const [sttResult, setSTTResult] = useState<STTResult | null>(null);
const [sttLoading, setSTTLoading] = useState(false);
const [sttError, setSTTError] = useState<string | null>(null);
```

**After** (제네릭 Hook):
```typescript
/**
 * 비동기 데이터를 관리하는 제네릭 Hook
 *
 * @template T - 데이터 타입
 */
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function useAsyncState<T>(): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, setData, setLoading, setError, reset };
}

// 사용
const histories = useAsyncState<HistoryItem[]>();  // 타입 안전 ✅
const sttResult = useAsyncState<STTResult>();      // 재사용 ✅
```

**교육적 설명**:

**Q: 제네릭(Generic)이란?**

제네릭은 **타입을 파라미터로 받는 함수**입니다.

```typescript
// 일반 함수 (값 파라미터)
function identity(value: string): string {
  return value;
}

// 제네릭 함수 (타입 파라미터)
function identity<T>(value: T): T {
  return value;
}

const str = identity<string>("hello");  // T = string
const num = identity<number>(42);       // T = number
```

**장점**:
1. **코드 재사용**: 한 번 작성, 여러 타입에 사용
2. **타입 안전성**: 타입 정보 유지
3. **DRY 원칙**: 중복 제거

---

## 5. Custom Hooks를 통한 관심사 분리

### 5.1 `useSTTProcessing` Hook

#### 목적
STT 처리 로직을 Screen에서 분리 → 재사용 가능, 테스트 용이

#### Before (Screen에 직접 구현)

```typescript
// app/results.tsx (70줄)
export default function ResultsScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  // ...

  const processAudio = async () => {
    if (!audioUri || !modelInfo || !vocabInfo) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // 1. 전처리
      const audioData = await preprocessAudioFile(audioUri);

      // 2. 추론
      const transcription = await runSTTInference(
        modelInfo.session,
        audioData,
        vocabInfo,
        modelInfo.inputName,
        modelInfo.outputName
      );

      setRecognizedText(transcription);

      // 3. 메트릭 계산
      if (targetText) {
        const cer = calculateCER(targetText, transcription);
        const wer = calculateWER(targetText, transcription);
        setCerScore(cer);
        setWerScore(wer);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      setProcessingTime(elapsed);
    } catch (error) {
      Alert.alert("오류", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    processAudio();
  }, [audioUri, modelInfo, vocabInfo]);

  // ...
}
```

#### After (Custom Hook 사용)

**파일**: `hooks/useSTTProcessing.ts`

```typescript
import { useState, useCallback } from 'react';
import { useONNX } from '@/utils/onnx/onnxContext';
import { preprocessAudioFile } from '@/utils/stt/audioPreprocessor';
import { runSTTInference } from '@/utils/stt/inference';
import { calculateCER, calculateWER } from '@/utils/stt/metrics';
import type { STTResult, STTProcessOptions, STTProcessingStage } from '@/types';

/**
 * STT 처리를 위한 Custom Hook
 *
 * @description
 * 오디오 파일을 텍스트로 변환하는 전체 파이프라인을 관리합니다.
 * - 오디오 전처리 (WAV → Float32Array)
 * - ONNX 추론 (Float32Array → Logits)
 * - CTC 디코딩 (Logits → Text)
 * - 평가 메트릭 계산 (CER, WER)
 *
 * @example
 * ```tsx
 * function ResultsScreen() {
 *   const { processAudio, result, isProcessing } = useSTTProcessing();
 *
 *   useEffect(() => {
 *     processAudio(audioUri, { targetText });
 *   }, [audioUri]);
 *
 *   return <Text>{result?.recognizedText}</Text>;
 * }
 * ```
 */
export function useSTTProcessing() {
  const { modelInfo, vocabInfo } = useONNX();

  const [result, setResult] = useState<STTResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerScore, setCerScore] = useState<number | null>(null);
  const [werScore, setWerScore] = useState<number | null>(null);

  /**
   * 오디오 파일을 STT 처리합니다
   *
   * @param audioUri - 오디오 파일 URI (file:// or content://)
   * @param options - 처리 옵션 (목표 문장, 진행 콜백)
   */
  const processAudio = useCallback(async (
    audioUri: string,
    options: STTProcessOptions = {}
  ) => {
    if (!modelInfo || !vocabInfo) {
      throw new Error('모델이 로드되지 않았습니다');
    }

    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    try {
      // 1. 오디오 전처리
      console.log('[useSTTProcessing] 1️⃣ 오디오 전처리...');
      options.onProgress?.('preprocessing', 0);

      const audioData = await preprocessAudioFile(audioUri);
      options.onProgress?.('preprocessing', 100);

      // 2. ONNX 추론
      console.log('[useSTTProcessing] 2️⃣ ONNX 추론...');
      options.onProgress?.('inference', 0);

      const transcription = await runSTTInference(
        modelInfo.session,
        audioData,
        vocabInfo,
        modelInfo.inputName,
        modelInfo.outputName
      );
      options.onProgress?.('inference', 100);

      // 3. 메트릭 계산
      if (options.targetText) {
        console.log('[useSTTProcessing] 3️⃣ 메트릭 계산...');
        options.onProgress?.('metrics', 0);

        const cer = calculateCER(options.targetText, transcription);
        const wer = calculateWER(options.targetText, transcription);

        setCerScore(cer);
        setWerScore(wer);
        options.onProgress?.('metrics', 100);
      }

      const processingTime = (Date.now() - startTime) / 1000;

      const sttResult: STTResult = {
        recognizedText: transcription,
        processingTime,
        sampleCount: audioData.length,
      };

      setResult(sttResult);
      console.log('[useSTTProcessing] ✅ 처리 완료:', sttResult);

      return sttResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      console.error('[useSTTProcessing] ❌ 처리 실패:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [modelInfo, vocabInfo]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCerScore(null);
    setWerScore(null);
  }, []);

  return {
    // 데이터
    result,
    cerScore,
    werScore,

    // 상태
    isProcessing,
    error,

    // 액션
    processAudio,
    reset,
  };
}
```

**사용 (Screen)**:

```typescript
// app/results.tsx (간결해짐!)
export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const { processAudio, result, cerScore, werScore, isProcessing } = useSTTProcessing();

  // 🎯 비즈니스 로직은 Hook에 위임
  useEffect(() => {
    if (params.audioUri) {
      processAudio(params.audioUri, {
        targetText: params.targetText,
        onProgress: (stage, progress) => {
          console.log(`${stage}: ${progress}%`);
        },
      });
    }
  }, [params.audioUri]);

  // UI 렌더링만 집중!
  return (
    <View>
      {isProcessing ? (
        <ActivityIndicator />
      ) : (
        <Text>{result?.recognizedText}</Text>
      )}
    </View>
  );
}
```

**교육적 설명**:

**Q: Custom Hook을 만드는 기준은?**

Custom Hook을 만들어야 하는 상황:
1. ✅ **로직 재사용**: 여러 컴포넌트에서 같은 로직 사용
2. ✅ **복잡한 상태 관리**: 여러 state가 서로 연관됨
3. ✅ **Side Effect 분리**: useEffect가 많고 복잡함
4. ✅ **테스트 용이성**: 로직만 독립적으로 테스트하고 싶음

**Q: `useCallback`을 사용하는 이유?**

```typescript
// ❌ Without useCallback
const processAudio = async () => { /* ... */ };
// 매 렌더링마다 새 함수 생성 → useEffect dependency 변경 → 무한 루프!

// ✅ With useCallback
const processAudio = useCallback(async () => { /* ... */ }, [modelInfo, vocabInfo]);
// modelInfo, vocabInfo가 변경될 때만 함수 재생성 ✅
```

**장점**:
- 불필요한 재렌더링 방지
- useEffect dependency로 사용 시 안전

### 5.2 `useAudioPlayback` Hook

#### 목적
중복된 오디오 재생 로직 제거 (results.tsx, history.tsx)

**파일**: `hooks/useAudioPlayback.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { AudioSource } from 'expo-audio';
import type { AudioPlaybackState } from '@/types';

/**
 * 오디오 재생을 위한 Custom Hook
 *
 * @description
 * expo-audio의 useAudioPlayer를 래핑하여 사용하기 쉬운 API 제공:
 * - Play/Pause 토글
 * - 파일 교체
 * - 자동 재시작 (끝까지 재생 시)
 *
 * @example
 * ```tsx
 * function AudioCard({ audioUri }) {
 *   const { play, pause, isPlaying, currentTime } = useAudioPlayback(audioUri);
 *
 *   return (
 *     <Button onPress={isPlaying ? pause : play}>
 *       {isPlaying ? 'Pause' : 'Play'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAudioPlayback(initialSource?: AudioSource | null) {
  const player = useAudioPlayer(initialSource);
  const status = useAudioPlayerStatus(player);
  const [currentSource, setCurrentSource] = useState<AudioSource | null>(initialSource || null);

  /**
   * 재생 시작
   */
  const play = useCallback(() => {
    console.log('[useAudioPlayback] ▶️ 재생 시작');

    // 끝까지 재생된 경우 처음부터
    if (status.currentTime >= status.duration - 0.1 && status.duration > 0) {
      console.log('[useAudioPlayback] 🔄 처음부터 재생');
      player.seekTo(0);
    }

    player.play();
  }, [player, status.currentTime, status.duration]);

  /**
   * 일시정지
   */
  const pause = useCallback(() => {
    console.log('[useAudioPlayback] ⏸️ 일시정지');
    player.pause();
  }, [player]);

  /**
   * Play/Pause 토글
   */
  const toggle = useCallback(() => {
    if (status.playing) {
      pause();
    } else {
      play();
    }
  }, [status.playing, play, pause]);

  /**
   * 오디오 소스 교체
   */
  const changeSource = useCallback((newSource: AudioSource | null) => {
    if (newSource === null) {
      pause();
      setCurrentSource(null);
      return;
    }

    console.log('[useAudioPlayback] 📁 소스 교체');

    // 재생 중이면 일시정지
    if (status.playing) {
      pause();
    }

    player.replace(newSource);
    setCurrentSource(newSource);
  }, [player, status.playing, pause]);

  /**
   * 특정 위치로 이동
   */
  const seekTo = useCallback((seconds: number) => {
    console.log(`[useAudioPlayback] ⏩ ${seconds}초로 이동`);
    player.seekTo(seconds);
  }, [player]);

  // 상태 객체 생성
  const playbackState: AudioPlaybackState = {
    isPlaying: status.playing,
    isLoading: !status.isLoaded,
    currentTime: status.currentTime,
    duration: status.duration,
    source: currentSource,
  };

  return {
    // 상태
    ...playbackState,

    // 액션
    play,
    pause,
    toggle,
    changeSource,
    seekTo,

    // 원본 player (고급 사용자용)
    player,
  };
}
```

**사용 예시 (Before vs After)**:

**Before** (`results.tsx` - 30줄):
```typescript
const audioPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
const playerStatus = useAudioPlayerStatus(audioPlayer);

const togglePlayback = () => {
  if (playerStatus.playing) {
    audioPlayer.pause();
  } else {
    if (playerStatus.currentTime >= playerStatus.duration - 0.1) {
      audioPlayer.seekTo(0);
    }
    audioPlayer.play();
  }
};

return (
  <Button onPress={togglePlayback}>
    {playerStatus.playing ? 'Pause' : 'Play'}
  </Button>
);
```

**After** (`results.tsx` - 5줄):
```typescript
const audio = useAudioPlayback(audioUri ? { uri: audioUri } : null);

return (
  <Button onPress={audio.toggle}>
    {audio.isPlaying ? 'Pause' : 'Play'}
  </Button>
);
```

**절감된 코드**: 25줄 → 재사용 가능한 Hook으로 추상화 ✅

---

## 6. 리팩토링 로드맵

### Phase 1: 타입 정의 중앙화 (1-2시간)

- [ ] `types/` 디렉토리 생성
- [ ] `onnx.types.ts` 작성 (ModelInfo, LogitsTensor)
- [ ] `audio.types.ts` 작성 (STTResult, AudioPlaybackState)
- [ ] `history.types.ts` 작성 (HistoryItem)
- [ ] 모든 `any` 타입 제거

**예상 효과**:
- 타입 안전성 100% 달성
- IDE 자동완성 지원
- 리팩토링 안전성 향상

### Phase 2: Custom Hooks 작성 (3-4시간)

- [ ] `hooks/` 디렉토리 생성
- [ ] `useSTTProcessing.ts` 작성
- [ ] `useAudioPlayback.ts` 작성
- [ ] `useHistoryManager.ts` 작성
- [ ] `useRecording.ts` 작성 (선택)

**예상 효과**:
- 코드 재사용성 향상
- 테스트 용이성 증가
- Screen 파일 크기 50% 감소

### Phase 3: Screen 리팩토링 (2-3시간)

- [ ] `results.tsx` 리팩토링 (611줄 → ~300줄)
- [ ] `history.tsx` 리팩토링
- [ ] `record.tsx` 간소화

**예상 효과**:
- 가독성 향상
- 유지보수 용이
- UI 로직만 집중

### Phase 4: expo-audio 전환 (선택, 2시간)

- [ ] `react-native-audio-record` → `expo-audio`의 `useAudioRecorder`
- [ ] Android/iOS 통일된 API 사용

**예상 효과**:
- 의존성 감소
- Expo 생태계 통일

---

## 7. 마무리

### 7.1 개선 전후 비교

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| TypeScript 타입 안전성 | ⚠️ `any` 사용 | ✅ 100% 타입 정의 | 런타임 에러 ⬇️ |
| Screen 파일 크기 | results.tsx: 611줄 | ~300줄 | 50% 감소 |
| 코드 재사용성 | ❌ 중복 코드 多 | ✅ Custom Hooks | DRY 원칙 준수 |
| 테스트 용이성 | 어려움 | 쉬움 | Hook 단위 테스트 |
| 가독성 | 낮음 | 높음 | 유지보수 ⬆️ |

### 7.2 학습 포인트

이번 리팩토링을 통해 배울 수 있는 것들:

1. **TypeScript 고급 기능**
   - 제네릭(Generic)
   - Union Types
   - Type vs Interface
   - Utility Types (`Omit`, `Pick`)

2. **React Hooks 패턴**
   - Custom Hooks 설계
   - `useCallback`, `useMemo` 최적화
   - Hooks 테스트 (react-hooks-testing-library)

3. **아키텍처 설계**
   - Separation of Concerns
   - DRY 원칙
   - 관심사 분리 (UI vs 비즈니스 로직)

4. **Expo SDK**
   - 최신 API 활용 (`expo-file-system` v19, `expo-audio`)
   - Hook 기반 개발

### 7.3 다음 단계

리팩토링 완료 후 추가로 고려할 사항:

1. **Unit Testing** 추가
   - Hooks 테스트 (`@testing-library/react-hooks`)
   - Utils 함수 테스트 (Jest)

2. **Error Handling 개선**
   - Custom Error 클래스
   - Error Boundary

3. **Performance 최적화**
   - React.memo, useMemo 활용
   - 대용량 히스토리 가상화 (FlatList windowSize)

4. **Accessibility**
   - 스크린 리더 지원
   - 고대비 모드

---

**작성자**: Claude (Senior RN Engineer)
**문의**: GitHub Issues
