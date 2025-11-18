<<<<<<< HEAD

# STTChecker-1 프로젝트 코드베이스 요약

## 📋 프로젝트 개요

React Native + Expo 기반의 한국어 발음 평가 애플리케이션입니다. 사용자가 제시된 문장을 발음하면, AI 모델(Wav2Vec2)을 통해 음성을 텍스트로 변환하고, CER(Character Error Rate)과 WER(Word Error Rate)을 계산하여 발음 정확도를 평가합니다.

### 핵심 기술 스택

- **프레임워크**: React Native (Expo SDK 54)
- **라우팅**: Expo Router (파일 기반 라우팅)
- **AI 모델**: ONNX Runtime (wav2vec2_korean_final.onnx, 약 305MB)
- **오디오 녹음**: react-native-audio-record (Android, WAV 16kHz 직접 녹음)
- **오디오 재생**: expo-audio (useAudioPlayer, useAudioPlayerStatus)
- **파일 시스템**: expo-file-system (새로운 File/Directory/Paths API)
- **데이터 저장**: @react-native-async-storage/async-storage (히스토리 메타데이터)
- **미디어 라이브러리**: expo-media-library (오디오 파일 내보내기)
- **파일 공유**: expo-sharing (다른 앱으로 공유)
- **UI**: React Native Paper (Material Design 3)
- **언어**: TypeScript

---

## 🏗️ 프로젝트 구조

```
STTChecker-1/
├── app/                          # 화면 컴포넌트 (Expo Router)
│   ├── (tabs)/                   # 탭 네비게이션
│   │   ├── _layout.tsx          # 탭 레이아웃 (홈, 테스트, 히스토리)
│   │   ├── index.tsx            # 홈 화면 (문장 입력 및 녹음 시작)
│   │   ├── test.tsx             # 테스트 화면 (WAV 파일 업로드 테스트)
│   │   └── history.tsx          # 히스토리 화면 (과거 기록 조회)
│   ├── _layout.tsx              # 루트 레이아웃 (모델 로딩, 테마)
│   ├── record.tsx               # 녹음 화면 (실시간 녹음)
│   └── results.tsx              # 결과 화면 (STT 결과, CER/WER, 태그)
│
├── components/                   # 재사용 가능한 컴포넌트
│   ├── CustomHeader.tsx         # 커스텀 헤더
│   ├── ModelLoadingScreen.tsx   # 모델 로딩 화면 (진행률 표시)
│   └── useColorScheme.ts        # 다크/라이트 모드 훅
│
├── utils/                        # 유틸리티 함수
│   ├── onnx/                    # ONNX 모델 관련
│   │   ├── modelLoader.ts       # 모델 로딩 및 초기화 (Android assets → cache)
│   │   ├── onnxContext.tsx      # 전역 모델 상태 관리 (Context API)
│   │   └── vocabLoader.ts       # vocab.json 로딩
│   ├── stt/                     # STT 추론
│   │   ├── audioPreprocessor.ts # WAV 파싱 + 전처리 (리샘플링, 정규화)
│   │   ├── inference.ts         # ONNX 추론 및 CTC 디코딩
│   │   └── metrics.ts           # CER/WER 계산 함수
│   └── storage/                 # 저장소 관리
│       └── historyManager.ts    # 히스토리 CRUD, 오디오 파일 관리, 내보내기/공유
│
├── plugins/                      # Expo Config Plugins
│   ├── withOnnxruntime.js       # ONNX Runtime 네이티브 패키지 등록
│   └── withOnnxModel.js         # 모델 파일을 Android assets에 복사
│
├── assets/                       # 정적 리소스
│   └── model/                   # AI 모델 파일 (gitignore)
│       ├── wav2vec2_korean_final.onnx
│       └── vocab.json
│
├── constants/                    # 상수 정의
│   ├── Colors.ts                # 색상 팔레트
│   └── theme.ts                 # Material Design 3 테마
│
├── app.json                      # Expo 설정 (플러그인, 권한)
├── package.json                  # 의존성 관리
└── tsconfig.json                 # TypeScript 설정
```

---

## 🎯 주요 기능 및 화면

### 1. **홈 화면** (`app/(tabs)/index.tsx`)

- 사용자가 발음할 문장 입력
- "녹음 시작" 버튼 → `app/record.tsx`로 이동
- Material Design 3 UI (Card, TextInput, Button)

### 2. **녹음 화면** (`app/record.tsx`)

- **Android**: `react-native-audio-record` 사용
  - WAV 형식, 16kHz, 모노, 16-bit PCM 직접 녹음
  - VOICE_RECOGNITION 오디오 소스 사용
  - `PermissionsAndroid`로 마이크 권한 요청
- 실시간 타이머 표시 (초 단위)
- 녹음 중지 시 자동으로 `app/results.tsx`로 이동
- 파일 경로는 `expo-file-system`의 `Paths.cache` 사용

### 3. **결과 화면** (`app/results.tsx`)

- **오디오 처리 파이프라인**:
  1. WAV 파일 파싱 및 전처리 (`audioPreprocessor.ts`)
     - WAV 헤더 파싱 (샘플레이트, 채널, 비트 깊이 확인)
     - **Float32 정규화**: 16-bit PCM → Float32 [-1.0, 1.0]
     - **모노 채널 변환**: 스테레오/멀티채널 → 모노 (평균화)
     - **16kHz 리샘플링**: 필요시 선형 보간으로 변환
     - **Wav2Vec2 정규화**: Mean 제거 + 표준화 (mean=0, std=1)
  2. ONNX 모델 추론 (`inference.ts`)
     - Float32Array → ONNX Tensor 변환
     - Wav2Vec2 모델 실행
     - CTC 디코딩 (Greedy Decoding)
  3. 평가 지표 계산 (`metrics.ts`)
     - **CER**: 문자 단위 Levenshtein 거리 (공백 제거 후 계산)
     - **WER**: 단어 단위 Levenshtein 거리
- **오디오 재생 기능**:
  - `useAudioPlayer` + `useAudioPlayerStatus`로 실시간 재생 상태 추적
  - 재생/일시정지 토글
  - 끝까지 재생된 경우 `seekTo(0)`으로 처음부터 재생
- **UI 구성**:
  - 녹음 파일 재생 카드 (재생/일시정지 버튼)
  - 목표 문장 vs 인식된 문장 비교
  - CER/WER 점수 (정확도 % 표시)
  - 처리 시간
  - 태그 관리 (자동 태그 + 사용자 추가)
  - 재녹음/히스토리 저장/홈 버튼

### 4. **테스트 화면** (`app/(tabs)/test.tsx`)

- WAV 파일 업로드 테스트용
- `expo-document-picker`로 파일 선택
- STT 결과 즉시 표시

### 5. **히스토리 화면** (`app/(tabs)/history.tsx`)

- 과거 녹음 기록 조회 및 관리
- AsyncStorage 기반 영구 저장
- 오디오 파일 재생/일시정지
- 기록 삭제 (개별/전체)
- 오디오 파일 내보내기 (MediaLibrary)
- 오디오 파일 공유 (expo-sharing)
- 스토리지 사용량 표시
- 태그별 필터링 지원

---

## 🧠 AI 모델 및 추론 파이프라인

### 모델 정보

- **모델**: `wav2vec2_korean_final.onnx` (약 305MB, 압축 전 약 1.24GB)
- **Vocab**: `vocab.json` (한국어 토큰 사전, SentencePiece 형식)
- **입력**: Float32Array (16kHz, 모노, Wav2Vec2 정규화 완료)
  - Shape: `[1, audioLength]`
  - 값 범위: 정규화됨 (mean=0, std=1)
- **출력**: Logits (시간 스텝 × vocab_size)
  - CTC 디코딩으로 텍스트 변환

### 추론 흐름

```
[WAV 파일 (16kHz, 모노, 16-bit PCM)]
    ↓
[audioPreprocessor.ts - parseWAVFile()]
    ├─ WAV 헤더 파싱 (샘플레이트, 채널, 비트 깊이)
    ├─ 1️⃣ Float32 정규화 (PCM → [-1.0, 1.0])
    ├─ 2️⃣ 모노 채널 변환 (필요시, 평균화)
    └─ 3️⃣ 16kHz 리샘플링 (필요시, 선형 보간)
    ↓
[audioPreprocessor.ts - wav2vec2Preprocess()]
    ├─ Mean 제거 (Zero-centering)
    └─ 표준화 (mean=0, std=1)
    ↓
[Float32Array 출력]
    ↓
[inference.ts - runSTTInference()]
    ├─ Float32Array → ONNX Tensor 변환
    ├─ 모델 추론 실행
    └─ Logits 추출
    ↓
[inference.ts - decodeLogits()]
    ├─ CTC Greedy Decoding
    ├─ Blank 토큰 제거
    ├─ 연속 중복 제거
    └─ SentencePiece 토큰 → 텍스트 변환
    ↓
[결과 텍스트]
```

---

## 📦 주요 의존성

### 핵심 라이브러리

```json
{
  "expo": "^54.0.22",
  "expo-router": "~6.0.13",
  "react-native": "0.81.5",
  "react-native-paper": "^5.14.5",
  "onnxruntime-react-native": "^1.23.2",
  "expo-audio": "~1.0.14",
  "react-native-audio-record": "^0.2.2",
  "expo-file-system": "~19.0.17",
  "expo-document-picker": "~14.0.7",
  "expo-media-library": "~18.2.0",
  "expo-sharing": "~14.0.7",
  "@react-native-async-storage/async-storage": "2.2.0",
  "js-levenshtein": "^1.1.6",
  "react-native-fs": "^2.20.0"
}
```

### 플랫폼별 오디오 라이브러리

- **녹음**: `react-native-audio-record` (Android, WAV 16kHz 직접 녹음)
- **재생**: `expo-audio` (`useAudioPlayer`, `useAudioPlayerStatus`)
  - 실시간 재생 상태 추적
  - 재생/일시정지 토글
  - `seekTo()` 메서드로 재생 위치 제어

---

## ⚙️ 설정 파일

## ⚙️ 설정 파일

### `app.json`

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-asset",
      [
        "expo-audio",
        {
          "microphonePermission": "음성 녹음을 위해 마이크 접근 권한이 필요합니다."
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "오디오 파일을 저장하기 위해 사진 라이브러리 접근 권한이 필요합니다.",
          "savePhotosPermission": "오디오 파일을 저장하기 위해 사진 라이브러리 저장 권한이 필요합니다.",
          "isAccessMediaLocationEnabled": true
        }
      ],
      "expo-web-browser",
      "./plugins/withOnnxruntime",
      "./plugins/withOnnxModel"
    ],
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    "newArchEnabled": true
  }
}
```

### Config Plugins

#### `plugins/withOnnxruntime.js`

- Android `MainApplication.java`에 ONNX Runtime 패키지 자동 등록
- `new OnnxruntimeModulePackage()` 추가

#### `plugins/withOnnxModel.js`

- `assets/model/` 파일을 `android/app/src/main/assets/model/`로 복사
- `build.gradle`에 `noCompress "onnx"` 추가 (압축 방지)

---

## 🔧 개발 워크플로우

### 1. **개발 서버 시작**

```bash
npx expo start
```

### 2. **네이티브 빌드 (Android)**

```bash
npx expo prebuild --clean  # 네이티브 프로젝트 재생성
npx expo run:android       # Android 빌드 및 실행
```

### 3. **모델 파일 관리**

- 모델 파일은 `.gitignore`에 추가됨
- 개발 시 `assets/model/` 디렉토리에 수동 배치 필요

---

## 📊 평가 지표

### CER (Character Error Rate) - `utils/stt/metrics.ts`

```typescript
export function calculateCER(reference: string, hypothesis: string): number {
  // 공백 제거하여 순수 문자만 비교
  const refChars = reference.replace(/\s+/g, "");
  const hypChars = hypothesis.replace(/\s+/g, "");

  const distance = Levenshtein(refChars, hypChars);
  const cer = distance / refChars.length;

  return Math.min(cer, 1.0); // 최대 100%
}
```

### WER (Word Error Rate) - `utils/stt/metrics.ts`

```typescript
export function calculateWER(reference: string, hypothesis: string): number {
  // 한국어 단어 분리 (공백 기준)
  const refWords = reference.trim().split(/\s+/);
  const hypWords = hypothesis.trim().split(/\s+/);

  const distance = Levenshtein(refWords.join(" "), hypWords.join(" "));
  const wer = distance / refWords.length;

  return Math.min(wer, 1.0); // 최대 100%
}
```

---

## 🚀 향후 개선 사항

### 1. **발음 상세 분석**

- 음소 단위 정확도 분석
- 억양, 속도 평가

### 3. **성능 최적화**

- 모델 양자화 (INT8)
- 스트리밍 추론 (실시간 피드백)

### 4. **UI 개선**

- 발음 시각화 (파형, 스펙트로그램)
- 히스토리 검색 기능
- 태그 필터링 UI 연결

---

## 📚 참고 자료

### 공식 문서

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [expo-audio](https://docs.expo.dev/versions/latest/sdk/audio/)
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [ONNX Runtime](https://onnxruntime.ai/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### 주요 알고리즘

- [CTC (Connectionist Temporal Classification)](https://distill.pub/2017/ctc/)
- [Wav2Vec2](https://arxiv.org/abs/2006.11477)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)

---

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

---

## 👥 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/euncherry/STTChecker/issues)

---

## 📝 주요 기술 세부사항

### 오디오 전처리 세부 단계

#### 1️⃣ Float32 정규화 (필수)

- **입력**: 16-bit PCM (Int16, -32768 ~ 32767) 또는 32-bit PCM (Int32)
- **출력**: Float32 (-1.0 ~ 1.0)
- **공식**:
  - 16-bit: `sample / 32768.0`
  - 32-bit: `sample / 2147483648.0`
- **위치**: `audioPreprocessor.ts` - `parseWAVFile()` 함수 내부

#### 2️⃣ 모노 채널 변환 (필수)

- **입력**: 스테레오/멀티채널 WAV
- **출력**: 모노 채널 (1채널)
- **방법**: 모든 채널의 평균값 계산
- **위치**: `audioPreprocessor.ts` - `parseWAVFile()` 함수 내부

#### 3️⃣ 16kHz 리샘플링 (필요시)

- **입력**: 48kHz, 44.1kHz 등 다양한 샘플레이트
- **출력**: 16kHz
- **알고리즘**: 선형 보간 (Linear Interpolation)
- **위치**: `audioPreprocessor.ts` - `resample()` 함수

#### 4️⃣ Wav2Vec2 정규화

- **Mean 제거**: Zero-centering (평균을 0으로)
- **표준화**: 표준편차로 나누기 (std=1)
- **Epsilon 추가**: 수치 안정성을 위해 `1e-7` 추가 (Python transformers와 동일)
- **위치**: `audioPreprocessor.ts` - `wav2vec2Preprocess()` 함수

### 녹음 설정 (Android)

```typescript
{
  sampleRate: 16000,      // 16kHz (모델 요구사항)
  channels: 1,            // 모노
  bitsPerSample: 16,      // 16-bit PCM
  audioSource: 6,         // VOICE_RECOGNITION
  wavFile: `recording_${Date.now()}.wav`
}
```

### 파일 시스템 API (expo-file-system v19)

**새로운 API 사용**:

```typescript
import { File, Directory, Paths } from "expo-file-system";

// 파일 생성 및 접근
const file = new File(Paths.cache, "recording.wav");
const exists = file.exists; // 동기 속성
const size = file.size; // 동기 속성
const uri = file.uri; // 읽기 전용

// 파일 읽기
const arrayBuffer = await file.arrayBuffer();
const text = await file.text();

// 디렉토리 접근
const cacheDir = Paths.cache;
const files = cacheDir.list(); // Directory.list()
```

**레거시 API 제거**:

- ❌ `FileSystem.cacheDirectory` (문자열)
- ❌ `FileSystem.getInfoAsync()`
- ✅ `Paths.cache` (Directory 객체)
- ✅ `Paths.document` (Directory 객체)
- ✅ `new File(path)` (File 객체)
- ✅ `new Directory(path, name)` (Directory 객체)

**히스토리 저장소**:

```typescript
// 오디오 파일은 영구 저장소에 저장
const audioDir = new Directory(Paths.document, "audio");
const file = new File(audioDir, `recording_${id}.wav`);
```

---

**마지막 업데이트**: 2025-11-13
**버전**: 1.1.0
