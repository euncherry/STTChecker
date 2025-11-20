# 🏗️ STTChecker 리팩토링 가이드

## 📋 개요

이 문서는 STTChecker 앱을 **유틸리티 기반 아키텍처**에서 최신 Expo SDK 패턴과 엄격한 TypeScript를 사용하는 현대적인 **기능 기반 아키텍처**로 리팩토링한 내용을 설명합니다.

**완료일**: 2025-11-20
**버전**: 2.0.0
**대상**: 개발자 (Claude AI 어시스턴트 포함)

---

## 🎯 달성한 리팩토링 목표

✅ **기능 기반 아키텍처**: 기술적 계층 대신 기능/도메인별로 코드 구성
✅ **최신 expo-audio**: `react-native-audio-record`에서 expo-audio 훅으로 마이그레이션
✅ **엄격한 TypeScript**: 기능별 및 전역 타입 정의, `any` 타입 제거
✅ **최신 Expo SDK**: expo-file-system v19 (File/Directory 클래스) 및 expo-audio v1.0 사용
✅ **교육적 주석**: 아키텍처 결정 이유를 설명하는 광범위한 문서화

---

## 📁 새로운 아키텍처

### 이전 (유틸리티 기반)
```
STTChecker/
├── app/                    # 화면
├── components/             # 전역 컴포넌트
├── utils/                  # ❌ 모든 것이 섞여있음
│   ├── onnx/
│   ├── stt/
│   ├── storage/
│   └── karaoke/
├── constants/
└── assets/
```

### 이후 (기능 기반)
```
STTChecker/
├── app/                    # Expo Router 화면 (변경 없음)
├── components/             # 전역 재사용 가능한 UI 컴포넌트
├── hooks/                  # ✨ 새로 추가: 전역 커스텀 훅
├── utils/                  # ✨ 새로 추가: 전역 유틸리티 함수
├── stores/                 # ✨ 새로 추가: 전역 상태 관리
├── types/                  # ✨ 새로 추가: 전역 타입 정의
│   ├── global.ts           # 기능 간 공유 타입
│   └── navigation.ts       # 라우트 파라미터 타입
│
├── features/               # ✨ 새로 추가: 기능 모듈
│   ├── audio/              # 🎤 오디오 녹음 및 재생
│   │   ├── hooks/          # useAudioRecording, useAudioPlayback
│   │   ├── utils/          # config.ts (녹음 프리셋)
│   │   ├── types.ts        # 오디오 전용 타입
│   │   └── index.ts        # 공개 API
│   │
│   ├── stt/                # 🗣️ 음성-텍스트 변환 파이프라인
│   │   ├── utils/          # 전처리, 추론, 메트릭
│   │   ├── types.ts        # STT 전용 타입
│   │   └── index.ts        # 공개 API
│   │
│   ├── history/            # 💾 녹음 히스토리 및 저장소
│   │   ├── utils/          # historyManager.ts
│   │   ├── types.ts        # HistoryItem, StorageInfo
│   │   └── index.ts        # 공개 API
│   │
│   ├── onnx/               # 🤖 모델 로딩 및 관리
│   │   ├── utils/          # modelLoader.ts, vocabLoader.ts
│   │   ├── onnxContext.tsx # React Context 프로바이더
│   │   ├── types.ts        # 모델/어휘 타입
│   │   └── index.ts        # 공개 API
│   │
│   └── karaoke/            # 🎵 가라오케 텍스트 애니메이션
│       ├── utils/          # timingPresets.ts
│       ├── types.ts        # 타이밍 타입
│       └── index.ts        # 공개 API
│
├── constants/
└── assets/
```

---

## 🔄 핵심 마이그레이션: 오디오 녹음

### 이전 (react-native-audio-record)

```tsx
import AudioRecord from "react-native-audio-record";

// 명령형 API - 수동 설정
const initializeRecording = async () => {
  const options = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    audioSource: 6,
    wavFile: `recording_${Date.now()}.wav`,
  };
  AudioRecord.init(options);

  // 수동 권한 처리 (Android 전용)
  if (Platform.OS === "android") {
    const { PermissionsAndroid } = require("react-native");
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
  }
};

// 녹음 시작
AudioRecord.start();

// 녹음 중지 (문자열 경로 반환)
const audioFile = await AudioRecord.stop();

// Android용 수동 URI 포맷팅
let fileUri = audioFile;
if (Platform.OS === "android" && !audioFile.startsWith("file://")) {
  fileUri = `file://${audioFile}`;
}
```

### 이후 (커스텀 훅을 사용한 expo-audio)

```tsx
import { useAudioRecording } from "@/features/audio";

// 선언형 훅 API - 자동 설정
const {
  state,                 // { isRecording, currentTime, uri, canRecord }
  permissions,           // { granted, canAskAgain, status }
  startRecording,        // 녹음 시작 (권한 자동 처리)
  stopRecording,         // 중지 후 RecordingResult 반환
  requestPermissions,    // 필요시 권한 요청
  error,                 // 에러 상태
} = useAudioRecording();

// 필요시 권한 자동 요청
useEffect(() => {
  if (permissions && !permissions.granted && permissions.canAskAgain) {
    requestPermissions();
  }
}, [permissions]);

// 녹음 시작
await startRecording();

// 녹음 중지 (구조화된 결과 반환)
const result = await stopRecording();
// result = { uri: string, duration: number }
// ✅ URI가 모든 플랫폼에서 자동으로 올바르게 포맷됨
```

### 🎯 새로운 접근 방식의 장점

1. **선언형 훅**: react-native-audio-record는 명령형 API 사용, expo-audio는 선언형 훅 사용
2. **크로스 플랫폼**: 플랫폼별 코드 불필요
3. **권한 관리**: 훅에 내장됨
4. **타입 안정성**: 적절한 타입으로 완전한 TypeScript 지원
5. **에러 처리**: 중앙집중식 에러 상태
6. **실시간 상태**: 훅을 통한 자동 상태 업데이트
7. **URI 포맷팅**: 자동 처리
8. **최신 Expo SDK**: 공식 Expo SDK의 일부로 더 나은 지원

---

## 📦 기능 모듈 패턴

각 기능 모듈은 다음 구조를 따릅니다:

```
features/{feature}/
├── hooks/              # 기능별 React 훅
├── components/         # 기능별 컴포넌트 (필요시)
├── utils/              # 비즈니스 로직 및 유틸리티
├── types.ts            # 기능별 TypeScript 타입
└── index.ts            # 공개 API (배럴 익스포트)
```

### 이 패턴을 사용하는 이유?

✅ **높은 응집도**: 관련 코드가 함께 유지됨
✅ **낮은 결합도**: 기능을 독립적으로 개발/테스트 가능
✅ **명확한 경계**: 어디에 무엇이 속하는지 이해하기 쉬움
✅ **재사용성**: 기능을 별도 패키지로 추출 가능
✅ **타입 안정성**: 기능별 타입이 교차 오염 방지

---

## 📝 타입 관리 전략

### 전역 타입 (`types/`)

여러 기능에서 사용됨:

```typescript
// types/global.ts
export interface AppError {
  message: string;
  code?: string;
}

export type AudioSource = string | { uri: string } | number;

// types/navigation.ts
export interface RecordScreenParams {
  text: string;
}

export interface ResultsScreenParams {
  audioUri: string;
  targetText: string;
  recordingDuration: string;
}
```

### 기능별 타입 (`features/{feature}/types.ts`)

단일 기능에 격리됨:

```typescript
// features/audio/types.ts
export interface RecordingState {
  isRecording: boolean;
  currentTime: number;
  uri: string | null;
  canRecord: boolean;
}

export interface AudioPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}
```

### 내비게이션에서의 타입 안정성

```tsx
import type { RecordScreenParams } from '@/types/navigation';

// 타입 안전한 파라미터
const params = useLocalSearchParams<RecordScreenParams>();
const text = params.text;  // ✅ TypeScript가 이것이 string임을 알고 있음

// 타입 안전한 내비게이션
router.push({
  pathname: '/record',
  params: {
    text: 'Hello'  // ✅ TypeScript가 올바른 파라미터 강제
  }
});
```

---

## 🔌 임포트 패턴

### 기능 임포트 (배럴 익스포트)

각 기능 모듈은 `index.ts`를 통해 익스포트:

```typescript
// features/audio/index.ts
export { useAudioRecording } from './hooks/useAudioRecording';
export { useAudioPlayback } from './hooks/useAudioPlayback';
export type { RecordingState, PlaybackState } from './types';
```

사용법:

```typescript
// ✅ 기능에서 깔끔한 단일 임포트
import { useAudioRecording, type RecordingState } from '@/features/audio';

// ❌ 내부 경로 임포트 금지
import { useAudioRecording } from '@/features/audio/hooks/useAudioRecording';
```

### 경로 별칭

`tsconfig.json`에서 설정:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

사용법:

```typescript
import { useAudioRecording } from '@/features/audio';
import type { RecordScreenParams } from '@/types/navigation';
import CustomHeader from '@/components/CustomHeader';
```

---

## 🛠️ 마이그레이션 체크리스트

개발자가 임포트를 업데이트하기 위한 체크리스트:

### ✅ 오디오 기능
- [ ] `react-native-audio-record`를 `useAudioRecording` 훅으로 교체
- [ ] 임포트 업데이트: `import { useAudioRecording } from '@/features/audio'`
- [ ] 수동 권한 처리 코드 제거
- [ ] 플랫폼별 URI 포맷팅 제거

### ✅ STT 기능
- [ ] `@/utils/stt/*`에서 `@/features/stt`로 임포트 업데이트
- [ ] 예시: `import { preprocessAudioFile, runSTTInference } from '@/features/stt'`

### ✅ 히스토리 기능
- [ ] `@/utils/storage/*`에서 `@/features/history`로 임포트 업데이트
- [ ] 예시: `import { saveHistory, loadHistories } from '@/features/history'`

### ✅ ONNX 기능
- [ ] `@/utils/onnx/*`에서 `@/features/onnx`로 임포트 업데이트
- [ ] 예시: `import { useONNX, ONNXProvider } from '@/features/onnx'`

### ✅ 가라오케 기능
- [ ] `@/utils/karaoke/*`에서 `@/features/karaoke`로 임포트 업데이트
- [ ] 예시: `import { getTimingPreset } from '@/features/karaoke'`

### ✅ 내비게이션 타입
- [ ] `useLocalSearchParams<T>()`에 타입 파라미터 추가
- [ ] `@/types/navigation`에서 타입 임포트

---

## 📚 교육적 노트

### 유틸리티 기반보다 기능 기반을 사용하는 이유?

**유틸리티 기반의 문제점**:
- ❌ 관련 코드 찾기 어려움 (다른 유틸 폴더에 흩어져 있음)
- ❌ 모듈 간 의존성 불명확
- ❌ 재사용을 위한 기능 추출 어려움
- ❌ 책임이 혼재됨

**기능 기반의 장점**:
- ✅ 관련 코드가 함께 그룹화됨
- ✅ 명확한 기능 경계
- ✅ 의존성 이해 쉬움
- ✅ 기능 추출/공유 간단
- ✅ 테스트 가능성 향상

### 배럴 익스포트(index.ts)를 사용하는 이유?

```typescript
// features/audio/index.ts
export { useAudioRecording } from './hooks/useAudioRecording';
export type { RecordingState } from './types';
```

**장점**:
1. **단일 진입점**: 한 곳에서 임포트
2. **캡슐화**: 내부 구조 숨김
3. **리팩토링**: 임포트에 영향 없이 내부 변경 가능
4. **트리 쉐이킹**: 번들러가 더 잘 최적화 가능

### 엄격한 TypeScript를 사용하는 이유?

```typescript
// ❌ 나쁨: any 사용
function processAudio(data: any) {
  return data.samples;  // 타입 안정성 없음!
}

// ✅ 좋음: 적절한 타입
function processAudio(data: Float32Array): Float32Array {
  return wav2vec2Preprocess(data);  // 타입 체크됨!
}
```

**장점**:
- 런타임이 아닌 컴파일 타임에 에러 잡기
- 더 나은 IDE 자동완성 및 IntelliSense
- 자체 문서화 코드
- 리팩토링 신뢰도 향상

---

## 🚀 다음 단계

### 권장 개선사항

1. **전역 훅 폴더**: 공유 훅을 `hooks/`로 이동 (있다면)
2. **전역 유틸 폴더**: 공유 유틸리티(날짜 포맷팅 등)를 `utils/`로 이동
3. **상태 관리**: 전역 상태를 위한 `stores/` 추가 (Zustand/Jotai)
4. **컴포넌트 라이브러리**: 재사용 가능한 컴포넌트 추출
5. **테스팅**: 각 기능 모듈에 단위 테스트 추가
6. **문서화**: JSDoc 주석에서 TypeDoc 생성

### 테스팅 전략

```typescript
// features/audio/__tests__/useAudioRecording.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useAudioRecording } from '../hooks/useAudioRecording';

describe('useAudioRecording', () => {
  it('올바른 상태로 초기화되어야 함', () => {
    const { result } = renderHook(() => useAudioRecording());
    expect(result.current.state.isRecording).toBe(false);
  });
});
```

---

## 🔗 참고 자료

- [Expo Audio 문서](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo File System v19 문서](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

## 📞 지원

이 리팩토링에 대한 질문이 있으시면:
- 인라인 코드 주석 확인 (광범위한 문서화)
- `types/` 및 `features/*/types.ts`의 타입 정의 검토
- 리팩토링된 화면에서 사용 예시 확인 (`app/record.tsx`, `app/results.tsx`)

---

**즐거운 코딩 되세요! 🎉**
