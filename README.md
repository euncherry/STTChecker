# 🎤 STTChecker - 한국어 발음 평가 앱

<p align="center">
  <img src="assets/images/icon.png" alt="STTChecker Logo" width="120" height="120">
</p>

<p align="center">
  <strong>온디바이스 AI를 활용한 한국어 발음 정확도 평가 애플리케이션</strong>
</p>

<p align="center">
  <a href="#주요-기능">주요 기능</a> •
  <a href="#기술-스택">기술 스택</a> •
  <a href="#설치-방법">설치 방법</a> •
  <a href="#사용법">사용법</a> •
  <a href="#아키텍처">아키텍처</a>
</p>

---

## 📋 프로젝트 개요

STTChecker는 React Native + Expo 기반의 **한국어 발음 평가 애플리케이션**입니다. 사용자가 제시된 문장을 발음하면, **온디바이스 AI 모델(Wav2Vec2 ONNX)**을 통해 음성을 텍스트로 변환하고, **CER(Character Error Rate)**과 **WER(Word Error Rate)**을 계산하여 발음 정확도를 평가합니다.

### ✨ 왜 온디바이스 AI인가?

- **개인정보 보호**: 음성 데이터가 서버로 전송되지 않음
- **오프라인 사용**: 인터넷 연결 없이도 완전한 기능 사용 가능
- **빠른 응답**: 네트워크 지연 없는 즉각적인 분석
- **비용 절감**: 서버 API 호출 비용 없음

---

## 🎯 주요 기능

### 1. 🎙️ 하이브리드 음성 인식
- **Android 13+/iOS**: Google/Siri 실시간 STT + WAV 녹음 동시 지원
- **Android 12 이하**: WAV 녹음 전용 모드 (폴백)
- 16kHz WAV 형식으로 녹음하여 ONNX 모델과 호환

### 2. 🧠 ONNX 기반 음성 분석
- **Wav2Vec2 Korean** 모델 사용 (~305MB)
- 온디바이스에서 CTC 디코딩으로 텍스트 변환
- 서버 없이 완전히 로컬에서 처리

### 3. 📊 발음 정확도 평가
- **CER (Character Error Rate)**: 문자 단위 정확도
- **WER (Word Error Rate)**: 단어 단위 정확도
- Levenshtein 거리 알고리즘 기반 계산

### 4. 🎵 가라오케 스타일 텍스트
- 녹음 중 목표 문장이 실시간으로 하이라이트
- 커스텀 타이밍 프리셋 지원
- 자연스러운 애니메이션 효과

### 5. 📈 음성 분석 시각화
- **파형(Waveform)** 그래프
- **피치(Pitch)** 분석 그래프
- **스펙트로그램** 시각화
- WaveSurfer.js 기반 WebView 구현

### 6. 💾 히스토리 관리
- 녹음 기록 저장 및 조회
- 오디오 파일 재생/내보내기/공유
- 태그 기반 분류 시스템
- 저장소 사용량 관리

---

## 🛠️ 기술 스택

### Core Framework
| 기술 | 버전 | 용도 |
|------|------|------|
| React Native | 0.81.5 | 모바일 앱 프레임워크 |
| Expo | 54.0.22 | 개발 플랫폼 |
| Expo Router | 6.0.13 | 파일 기반 라우팅 |
| TypeScript | 5.9.2 | 타입 안전성 |

### AI/ML
| 기술 | 버전 | 용도 |
|------|------|------|
| onnxruntime-react-native | 1.23.2 | ONNX 모델 추론 |
| Wav2Vec2 Korean | - | 한국어 STT 모델 (~305MB) |

### Audio
| 기술 | 버전 | 용도 |
|------|------|------|
| expo-speech-recognition | 3.0.1 | 실시간 음성 인식 (Android 13+/iOS) |
| react-native-audio-record | 0.2.2 | WAV 녹음 (폴백) |
| expo-audio | 1.0.14 | 오디오 재생 |

### UI/UX
| 기술 | 버전 | 용도 |
|------|------|------|
| React Native Paper | 5.14.5 | Material Design 3 |
| React Native Reanimated | 4.1.1 | 애니메이션 |
| WaveSurfer.js | 7.x | 오디오 시각화 |

### Storage
| 기술 | 버전 | 용도 |
|------|------|------|
| expo-file-system | 19.0.17 | 파일 시스템 (File/Directory API) |
| AsyncStorage | 2.2.0 | 메타데이터 저장 |

---

## 📲 설치 방법

### 사전 요구사항

```bash
# Node.js 18 이상
node -v

# Expo CLI
npm install -g expo-cli

# Android Studio (Android 빌드용)
# Xcode (iOS 빌드용, macOS만)
```

### 1. 저장소 클론

```bash
git clone https://github.com/euncherry/STTChecker.git
cd STTChecker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. ONNX 모델 파일 설정

> ⚠️ 모델 파일은 용량 문제로 Git에 포함되지 않습니다.

1. `wav2vec2_korean_final.onnx` (~305MB) 파일 준비
2. `vocab.json` 파일 준비
3. `assets/model/` 디렉토리에 배치:

```
assets/
└── model/
    ├── wav2vec2_korean_final.onnx
    └── vocab.json
```

### 4. 네이티브 빌드

```bash
# Android
npx expo prebuild --clean
npx expo run:android

# iOS (macOS만)
npx expo prebuild --clean
npx expo run:ios
```

---

## 🚀 사용법

### 기본 워크플로우

1. **홈 화면**: 연습할 문장 입력 또는 추천 문장 선택
2. **녹음 화면**: 3초 카운트다운 후 자동 녹음 시작
3. **결과 화면**:
   - 녹음 파일 재생
   - ONNX 모델 분석 결과 확인
   - CER/WER 정확도 점수 확인
   - 음성 분석 그래프 확인
4. **히스토리**: 과거 연습 기록 조회 및 관리

### 개발 서버 실행

```bash
# Expo 개발 서버 시작
npx expo start

# Android 에뮬레이터에서 실행
npx expo start --android

# iOS 시뮬레이터에서 실행 (macOS만)
npx expo start --ios
```

---

## 🏗️ 아키텍처

### 프로젝트 구조

```
STTChecker/
├── app/                    # Expo Router 화면
│   ├── (tabs)/             # 탭 네비게이션
│   │   ├── index.tsx       # 홈 (문장 입력)
│   │   ├── sing.tsx        # 가라오케 데모
│   │   ├── test.tsx        # 파일 업로드 테스트
│   │   └── history.tsx     # 히스토리
│   ├── record.tsx          # 녹음 화면
│   └── results.tsx         # 결과 화면
│
├── features/               # 기능 모듈 (Feature-based)
│   ├── audio/              # 오디오 녹음/재생
│   ├── stt/                # 음성-텍스트 변환
│   ├── onnx/               # ONNX 모델 관리
│   ├── history/            # 히스토리 관리
│   ├── karaoke/            # 가라오케 애니메이션
│   └── speechRecognition/  # 하이브리드 음성 인식
│
├── components/             # 전역 UI 컴포넌트
├── utils/                  # 레거시 유틸리티 (마이그레이션 중)
├── types/                  # 전역 타입 정의
├── constants/              # 상수 (색상, 테마)
├── plugins/                # Expo Config Plugins
└── assets/                 # 정적 리소스
```

### 핵심 처리 흐름

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   녹음 시작   │ ──▶ │  WAV 파일    │ ──▶ │  오디오 전처리  │
│  (16kHz)     │     │   저장       │     │  (정규화)     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  결과 표시   │ ◀── │  CER/WER    │ ◀── │  ONNX 추론   │
│  (점수/비교) │     │   계산       │     │  (CTC 디코딩) │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 상세 문서

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 상세 아키텍처 설명
- **[ONNX_GUIDE.md](./ONNX_GUIDE.md)**: ONNX 모델 사용 가이드
- **[CLAUDE.md](./CLAUDE.md)**: AI 어시스턴트용 개발 가이드

---

## 📊 평가 지표

### CER (Character Error Rate)

문자 단위 오류율. 공백을 제외한 순수 문자만 비교합니다.

```
CER = Levenshtein(목표문자, 인식문자) / 목표문자길이
```

### WER (Word Error Rate)

단어 단위 오류율. 공백 기준으로 단어를 분리하여 비교합니다.

```
WER = Levenshtein(목표단어들, 인식단어들) / 목표단어수
```

### 자동 태그

| CER | 태그 |
|-----|------|
| < 10% | 완벽함 |
| < 20% | 우수 |
| < 30% | 양호 |
| ≥ 30% | 연습필요 |

---

## 🤖 왜 ONNX를 사용하나요?

**ONNX (Open Neural Network Exchange)**는 다양한 딥러닝 프레임워크 간 모델 호환성을 제공하는 개방형 표준입니다.

### 도입 배경

1. **온디바이스 STT 필요성**: 개인정보 보호와 오프라인 사용을 위해 클라우드 API 대신 로컬 처리 필요
2. **Wav2Vec2 모델 선택**: Facebook에서 개발한 최신 음성 인식 모델, 한국어 버전 존재
3. **ONNX 변환**: PyTorch 모델을 모바일에서 실행하기 위해 ONNX 포맷으로 변환

### 장점

- ✅ 프레임워크 독립적 (PyTorch → ONNX → React Native)
- ✅ 최적화된 추론 성능
- ✅ 다양한 플랫폼 지원 (Android/iOS/Web)
- ✅ 모델 경량화 가능 (양자화)

자세한 내용은 **[ONNX_GUIDE.md](./ONNX_GUIDE.md)** 를 참조하세요.

---

## 📚 참고 자료

### 공식 문서
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [ONNX Runtime](https://onnxruntime.ai/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### 알고리즘
- [CTC Decoding](https://distill.pub/2017/ctc/)
- [Wav2Vec 2.0](https://arxiv.org/abs/2006.11477)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)

---

## 📝 라이선스

이 프로젝트는 교육 및 연구 목적으로 개발되었습니다.

---

## 👥 기여 및 문의

- **Issues**: [GitHub Issues](https://github.com/euncherry/STTChecker/issues)
- **Pull Requests**: 환영합니다!

---

**마지막 업데이트**: 2025-12-10
**버전**: 1.3.0
