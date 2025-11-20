# 🏛️ STTChecker 아키텍처

## 📁 전체 파일 트리

```
STTChecker/
│
├── 📱 app/                                  # Expo Router (파일 기반 라우팅)
│   ├── _layout.tsx                          # 루트 레이아웃 (모델 로딩, 테마)
│   ├── +html.tsx                            # 웹용 HTML 래퍼
│   ├── +not-found.tsx                       # 404 페이지
│   ├── modal.tsx                            # 일반 모달 화면
│   ├── record.tsx                           # ✅ 리팩토링됨: 녹음 화면 (react-native-audio-record, WAV)
│   ├── results.tsx                          # ✅ 리팩토링됨: 결과 화면 (기능 임포트)
│   │
│   └── (tabs)/                              # 탭 내비게이션 그룹
│       ├── _layout.tsx                      # 탭 내비게이터 설정
│       ├── index.tsx                        # 홈 탭 (문장 입력)
│       ├── sing.tsx                         # 노래 탭 (가라오케 데모)
│       ├── test.tsx                         # 테스트 탭 (파일 업로드)
│       └── history.tsx                      # 히스토리 탭 (저장된 녹음)
│
├── 🎨 components/                           # 전역 재사용 가능한 UI 컴포넌트
│   ├── CustomHeader.tsx
│   ├── KaraokeText.tsx
│   ├── ModelLoadingScreen.tsx
│   ├── WaveSurferWebView.tsx
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useClientOnlyValue.ts
│   └── useClientOnlyValue.web.ts
│
├── 🧩 features/                             # ✨ 새로 추가: 기능 기반 모듈
│   │
│   ├── 🎤 audio/                            # 오디오 녹음 및 재생
│   │   ├── hooks/
│   │   │   ├── useAudioRecording.ts         # ✨ 새로 추가: WAV 녹음 훅 (react-native-audio-record 래핑)
│   │   │   └── useAudioPlayback.ts          # ✨ 새로 추가: 재생 훅 (expo-audio 래핑)
│   │   ├── utils/
│   │   │   └── config.ts                    # 녹음 프리셋 및 설정
│   │   ├── types.ts                         # 오디오 전용 타입
│   │   └── index.ts                         # 공개 API (배럴 익스포트)
│   │
│   ├── 🗣️ stt/                             # 음성-텍스트 변환 파이프라인
│   │   ├── utils/
│   │   │   ├── audioPreprocessor.ts         # WAV 파싱, 리샘플링, 정규화
│   │   │   ├── inference.ts                 # ONNX 추론 및 CTC 디코딩
│   │   │   └── metrics.ts                   # CER/WER 계산
│   │   ├── types.ts                         # STT 전용 타입
│   │   └── index.ts                         # 공개 API
│   │
│   ├── 💾 history/                          # 녹음 히스토리 및 저장소
│   │   ├── utils/
│   │   │   └── historyManager.ts            # CRUD 작업, 파일 관리
│   │   ├── types.ts                         # HistoryItem, StorageInfo 타입
│   │   └── index.ts                         # 공개 API
│   │
│   ├── 🤖 onnx/                             # ONNX 모델 관리
│   │   ├── utils/
│   │   │   ├── modelLoader.ts               # 모델 로딩 (assets → cache)
│   │   │   └── vocabLoader.ts               # 어휘 로딩
│   │   ├── onnxContext.tsx                  # React Context 프로바이더
│   │   ├── types.ts                         # ModelInfo, VocabInfo 타입
│   │   └── index.ts                         # 공개 API
│   │
│   └── 🎵 karaoke/                          # 가라오케 텍스트 애니메이션
│       ├── utils/
│       │   └── timingPresets.ts             # 음절 타이밍 프리셋
│       ├── types.ts                         # 타이밍 타입
│       └── index.ts                         # 공개 API
│
├── 📘 types/                                # ✨ 새로 추가: 전역 타입 정의
│   ├── global.ts                            # 공유 타입 (AppError, AudioSource 등)
│   └── navigation.ts                        # 라우트 파라미터 타입 (타입 안전 내비게이션)
│
├── 🎨 constants/                            # 앱 전체 상수
│   ├── Colors.ts                            # 컬러 팔레트
│   └── theme.ts                             # Material Design 3 테마
│
├── 🔌 plugins/                              # Expo Config 플러그인
│   ├── withOnnxruntime.js                   # ONNX Runtime 패키지 등록
│   └── withOnnxModel.js                     # Android assets에 모델 복사
│
├── 📦 assets/                               # 정적 리소스
│   ├── images/                              # 아이콘, 스플래시 화면
│   ├── model/                               # AI 모델 파일 (gitignored, ~305MB)
│   │   ├── wav2vec2_korean_final.onnx
│   │   └── vocab.json
│   └── webview/                             # WebView HTML 파일
│       └── wavesurfer-viewer.html
│
├── 📄 설정 파일
│   ├── app.json                             # Expo 설정
│   ├── package.json                         # 의존성
│   ├── tsconfig.json                        # TypeScript 설정
│   ├── metro.config.js                      # Metro 번들러 설정
│   ├── eas.json                             # EAS Build 설정
│   ├── CLAUDE.md                            # Claude를 위한 프로젝트 지침
│   ├── REFACTORING_GUIDE.md                 # ✨ 새로 추가: 상세 리팩토링 가이드
│   └── ARCHITECTURE.md                      # ✨ 새로 추가: 이 파일
│
└── 📚 문서
    └── README.md                            # 프로젝트 README
```

---

## 🔄 임포트 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     app/record.tsx                      │
│                      (녹음 화면)                         │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│@/features/   │ │@/types/ │ │@/comp-   │ │@/features/ │
│audio         │ │naviga-  │ │onents/   │ │karaoke     │
│              │ │tion     │ │Karaoke-  │ │            │
│✅ useAudio-  │ │         │ │Text      │ │✅ get-     │
│  Recording   │ │Record-  │ │          │ │  Timing-   │
│              │ │Screen-  │ │          │ │  Preset    │
│✅ useAudio-  │ │Params   │ │          │ │            │
│  Playback    │ │         │ │          │ │            │
└──────────────┘ └─────────┘ └──────────┘ └────────────┘
```

---

## 🏗️ 기능 모듈 구조

각 기능 모듈은 일관된 패턴을 따릅니다:

```
features/{feature}/
│
├── hooks/                    # React 훅 (필요시)
│   ├── useSomething.ts
│   └── useSomethingElse.ts
│
├── components/               # 기능별 컴포넌트 (필요시)
│   └── SomeComponent.tsx
│
├── utils/                    # 비즈니스 로직 및 유틸리티
│   ├── helper.ts
│   └── config.ts
│
├── types.ts                  # 기능별 TypeScript 타입
│   └── export interface FeatureType { ... }
│
└── index.ts                  # 🚪 공개 API (배럴 익스포트)
    ├── export { useSomething } from './hooks/useSomething';
    ├── export { helper } from './utils/helper';
    └── export type { FeatureType } from './types';
```

### 🎯 이 패턴을 사용하는 이유?

1. **예측 가능한 구조**: 모든 기능이 동일하게 보임
2. **쉬운 탐색**: 어디서 무엇을 찾을지 알 수 있음
3. **명확한 API**: `index.ts`가 공개된 것을 정의
4. **캡슐화**: 내부 구현 숨김
5. **테스트 가능**: 각 모듈을 독립적으로 테스트 가능

---

## 📦 의존성 그래프

```
┌─────────────────────────────────────────────────────────┐
│                       앱 레이어                          │
│  app/record.tsx, app/results.tsx, app/(tabs)/*         │
└────────────────────┬────────────────────────────────────┘
                     │ 임포트
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    기능 레이어                           │
│  features/audio, features/stt, features/history 등     │
└────────────────────┬────────────────────────────────────┘
                     │ 임포트
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  컴포넌트 레이어                         │
│          components/, constants/, types/                │
└────────────────────┬────────────────────────────────────┘
                     │ 임포트
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   외부 레이어                            │
│  react-native-audio-record, expo-audio (재생),         │
│  expo-file-system, onnxruntime-react-native 등         │
└─────────────────────────────────────────────────────────┘
```

### 📏 의존성 규칙

✅ **허용됨**:
- 앱 → 기능
- 기능 → 컴포넌트
- 기능 → 타입
- 컴포넌트 → 타입

❌ **허용되지 않음**:
- 기능 → 앱 (순환 참조)
- 컴포넌트 → 기능 (재사용성 저해)
- 타입 → 무엇이든 (타입은 순수해야 함)

---

## 🔑 주요 아키텍처 결정사항

### 1. 기능 기반 구성

**결정**: 기술 계층 대신 기능/도메인별로 구성

**근거**:
- 관련 코드가 함께 유지됨
- 이해하고 수정하기 쉬움
- 팀 협업에 유리
- 코드 스플리팅 및 레이지 로딩 간소화

### 2. 배럴 익스포트 (index.ts)

**결정**: 각 기능이 단일 `index.ts`를 통해 익스포트

**근거**:
- 사용자를 위한 단일 임포트 경로
- 임포트를 깨지 않고 내부 리팩토링 가능
- 명확한 공개 API
- 더 나은 트리 쉐이킹

### 3. 엄격한 TypeScript

**결정**: `any` 타입 금지, 명시적 반환 타입, strict 모드

**근거**:
- 컴파일 타임에 에러 잡기
- 더 나은 IDE 지원
- 자체 문서화 코드
- 더 안전한 리팩토링

### 4. 오디오 라이브러리 선택

**결정**:
- **녹음**: react-native-audio-record (WAV 형식 지원)
- **재생**: expo-audio (v1.0, 선언형 훅)
- **파일 시스템**: expo-file-system (v19, 새로운 File/Directory API)

**근거**:
- **react-native-audio-record**: Wav2Vec2 모델이 WAV 형식을 요구하며, expo-audio는 WAV 녹음을 지원하지 않음 (m4a/aac만 가능)
- **expo-audio (재생)**: 공식 Expo 지원, 크로스 플랫폼 일관성, 선언형 훅 API
- **expo-file-system**: 최신 API, 타입 안전, 동기적 속성 접근

### 5. 경로 별칭 (@/)

**결정**: 절대 임포트를 위한 `@/` 접두사 사용

**근거**:
- `../../../` 지옥 탈출
- 파일 이동 쉬움
- 더 깔끔한 임포트
- IDE 자동완성 더 잘 작동

---

## 🚀 성능 고려사항

### 코드 스플리팅 (미래)

기능 기반 아키텍처로 기능을 쉽게 레이지 로드 가능:

```typescript
// 미래 최적화
const AudioFeature = lazy(() => import('@/features/audio'));
const STTFeature = lazy(() => import('@/features/stt'));
```

### 번들 분석

현재 구조로 기능별 번들 크기 분석 쉬움:

```bash
npx react-native-bundle-visualizer
```

### 메모리 관리

- ONNX 모델: 앱 시작 시 한 번 로드 (Context에서)
- 오디오 파일: 캐시에 임시, 문서 디렉토리에 영구
- 히스토리: 최대 100개 항목, 자동 정리

---

## 🧪 테스팅 전략

### 단위 테스트

각 기능 모듈을 독립적으로 테스트:

```typescript
// features/audio/__tests__/useAudioRecording.test.ts
describe('useAudioRecording', () => {
  it('녹음 라이프사이클을 처리해야 함', async () => {
    const { result } = renderHook(() => useAudioRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state.isRecording).toBe(true);
  });
});
```

### 통합 테스트

기능 상호작용 테스트:

```typescript
// __tests__/recording-to-results.test.ts
describe('녹음에서 결과까지 흐름', () => {
  it('녹음을 처리하고 결과를 표시해야 함', async () => {
    // 전체 사용자 흐름 테스트
  });
});
```

---

## 📊 메트릭 및 모니터링

### 추적할 주요 메트릭

1. **모델 로드 시간**: ONNX 모델 로드 시간
2. **녹음 시간**: 평균 녹음 길이
3. **추론 시간**: 오디오 처리 시간
4. **CER/WER 점수**: 평균 정확도
5. **저장소 사용량**: 시간에 따른 히스토리 크기

### 로깅 규칙

```typescript
console.log('[기능명] 🚀 작업 시작');
console.log('[기능명] ✅ 성공');
console.error('[기능명] ❌ 에러:', error);
```

---

## 🔮 향후 개선사항

### 잠재적 개선사항

1. **상태 관리**: 전역 상태를 위한 Zustand/Jotai 추가
2. **API 레이어**: 외부 API를 위한 `services/` 생성
3. **테스팅**: 포괄적인 테스트 커버리지 추가
4. **CI/CD**: 자동화된 테스팅 및 배포
5. **성능**: 레이지 로딩 및 코드 스플리팅
6. **분석**: 사용자 행동 추적
7. **에러 추적**: Sentry 등
8. **오프라인 지원**: 더 나은 오프라인 기능

### 확장성

현재 아키텍처는 다음을 지원:
- 새 기능 추가 (`features/newFeature/` 생성만 하면 됨)
- 기능을 별도 패키지로 추출
- 여러 팀이 서로 다른 기능 작업
- 새로운 패턴의 점진적 도입

---

## 📚 학습 자료

### 권장 읽기 자료

1. **Feature-Sliced Design**: https://feature-sliced.design/
2. **Expo Router**: https://docs.expo.dev/router/
3. **TypeScript 패턴**: https://www.typescriptlang.org/docs/handbook/
4. **React Hooks**: https://react.dev/reference/react

### 구현 예시

- `features/audio/`: WAV 녹음 훅 패턴 (react-native-audio-record 래핑)
- `features/stt/`: 복잡한 오디오 처리 파이프라인
- `app/record.tsx`: 리팩토링된 화면 예시 (feature-based imports)
- `types/navigation.ts`: 타입 안전 내비게이션

---

**마지막 업데이트**: 2025-11-20
**아키텍처 버전**: 2.0.0
**프로젝트**: STTChecker
