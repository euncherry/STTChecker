# 🧠 ONNX 모델 가이드

이 문서는 STTChecker에서 사용하는 ONNX 모델의 개념, 도입 배경, 사용 방법을 설명합니다.

**마지막 업데이트**: 2025-12-10

---

## 📋 목차

1. [ONNX란?](#onnx란)
2. [왜 ONNX를 선택했나?](#왜-onnx를-선택했나)
3. [Wav2Vec2 모델](#wav2vec2-모델)
4. [모델 변환 과정](#모델-변환-과정)
5. [모델 사용 방법](#모델-사용-방법)
6. [성능 최적화](#성능-최적화)
7. [트러블슈팅](#트러블슈팅)

---

## 🤖 ONNX란?

### 정의

**ONNX (Open Neural Network Exchange)**는 딥러닝 모델을 다양한 프레임워크 간에 공유할 수 있도록 설계된 **개방형 표준 포맷**입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ONNX 생태계                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   훈련 프레임워크                         추론 환경                          │
│   ┌─────────────────┐                   ┌─────────────────┐                │
│   │ PyTorch         │                   │ ONNX Runtime    │                │
│   │ TensorFlow      │                   │ (Android/iOS)   │                │
│   │ JAX             │  ──→ ONNX ──→    │                 │                │
│   │ Keras           │                   │ TensorRT        │                │
│   │ Scikit-learn    │                   │ (NVIDIA GPU)    │                │
│   └─────────────────┘                   │                 │                │
│                                         │ OpenVINO        │                │
│                                         │ (Intel CPU)     │                │
│                                         └─────────────────┘                │
│                                                                             │
│   "한 번 훈련하고, 어디서든 실행한다"                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 주요 특징

| 특징 | 설명 |
|------|------|
| **프레임워크 독립성** | PyTorch, TensorFlow 등 어떤 프레임워크에서 훈련했든 동일한 포맷으로 변환 |
| **최적화된 추론** | ONNX Runtime은 하드웨어에 최적화된 추론 성능 제공 |
| **다양한 플랫폼 지원** | Windows, Linux, macOS, Android, iOS, Web 등 |
| **그래프 최적화** | 자동 연산 융합, 메모리 최적화 등 |

### ONNX 파일 구조

```
.onnx 파일
├── 그래프 (Graph)
│   ├── 노드 (Nodes): 연산 정의 (Conv, MatMul, ReLU 등)
│   ├── 입력 (Inputs): 모델 입력 텐서 정의
│   └── 출력 (Outputs): 모델 출력 텐서 정의
├── 가중치 (Weights)
│   └── 훈련된 파라미터 값들
└── 메타데이터 (Metadata)
    └── 모델 정보, 버전 등
```

---

## 🎯 왜 ONNX를 선택했나?

### 프로젝트 요구사항

STTChecker의 핵심 목표는 **온디바이스 음성 인식(STT)**입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           요구사항 분석                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ 개인정보 보호                                                           │
│     • 음성 데이터는 민감한 개인정보                                          │
│     • 서버로 전송하면 프라이버시 우려                                        │
│     → 로컬에서 처리해야 함                                                  │
│                                                                             │
│  2️⃣ 오프라인 사용                                                           │
│     • 네트워크 없이도 동작해야 함                                           │
│     • 클라우드 API 의존성 제거                                              │
│     → 모델이 디바이스에 있어야 함                                           │
│                                                                             │
│  3️⃣ 빠른 응답                                                               │
│     • 실시간 발음 평가                                                      │
│     • 네트워크 지연 없어야 함                                               │
│     → 온디바이스 추론 필요                                                  │
│                                                                             │
│  4️⃣ 비용 절감                                                               │
│     • 서버 API 호출당 비용 발생                                             │
│     • 사용량 증가 시 비용 급증                                              │
│     → 일회성 모델 다운로드로 해결                                           │
│                                                                             │
│  결론: 온디바이스 AI 모델 필요 → ONNX Runtime 선택                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 대안 비교

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| **클라우드 API** (Google Cloud, AWS) | 정확도 높음, 유지보수 쉬움 | 비용, 프라이버시, 오프라인 불가 | ❌ |
| **TensorFlow Lite** | Google 지원, Android 최적화 | 모델 변환 복잡, iOS 제한적 | ❌ |
| **Core ML** | iOS 최적화, Apple 지원 | iOS 전용, Android 불가 | ❌ |
| **ONNX Runtime** | 크로스 플랫폼, 다양한 모델 지원 | 파일 크기 큼 | ✅ |

### ONNX 선택 이유

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ONNX Runtime 선택 이유                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Wav2Vec2 모델 지원                                                      │
│     • Facebook/Meta에서 개발한 최신 STT 모델                                │
│     • PyTorch → ONNX 변환 공식 지원                                         │
│     • HuggingFace에서 한국어 fine-tuned 모델 제공                           │
│                                                                             │
│  ✅ 크로스 플랫폼                                                            │
│     • Android + iOS 동시 지원                                               │
│     • React Native 공식 바인딩 제공 (onnxruntime-react-native)              │
│                                                                             │
│  ✅ 성숙한 생태계                                                            │
│     • Microsoft 주도 개발                                                   │
│     • 활발한 커뮤니티                                                       │
│     • 지속적인 성능 개선                                                    │
│                                                                             │
│  ✅ 최적화 옵션                                                              │
│     • 양자화 (INT8) 지원                                                    │
│     • 그래프 최적화                                                         │
│     • 하드웨어 가속 (GPU, NPU)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 Wav2Vec2 모델

### 모델 소개

**Wav2Vec 2.0**은 Facebook AI Research(FAIR)에서 2020년에 발표한 자기 지도 학습(Self-supervised Learning) 기반 음성 인식 모델입니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Wav2Vec2 아키텍처                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  입력: Raw Audio Waveform (16kHz, Float32)                                  │
│         ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Feature Encoder (CNN)                                             │   │
│  │    • 7개의 1D Convolution 레이어                                     │   │
│  │    • Raw audio → Latent representations                              │   │
│  │    • 20ms 간격의 특징 벡터 추출                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. Transformer Encoder                                               │   │
│  │    • 12-24개 Transformer 레이어 (모델 크기에 따라)                   │   │
│  │    • Self-attention으로 문맥 정보 학습                               │   │
│  │    • Position encoding으로 시간 정보 유지                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. Linear Projection + CTC Head                                      │   │
│  │    • Hidden states → Vocabulary logits                               │   │
│  │    • CTC Loss로 학습                                                 │   │
│  │    • 출력: [batch, time_steps, vocab_size]                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓                                                                   │
│  출력: Logits (CTC 디코딩으로 텍스트 변환)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 한국어 모델

STTChecker에서 사용하는 모델은 한국어에 fine-tuned된 Wav2Vec2 모델입니다.

| 항목 | 값 |
|------|-----|
| 기반 모델 | facebook/wav2vec2-base |
| 언어 | 한국어 (ko-KR) |
| 훈련 데이터 | KsponSpeech, 자체 수집 데이터 |
| 어휘 크기 | ~2,000 토큰 (SentencePiece) |
| 파일 크기 | ~305MB (ONNX, fp32) |
| 입력 | 16kHz, mono, Float32 |
| 출력 | Logits [1, T, vocab_size] |

---

## 🔄 모델 변환 과정

### PyTorch → ONNX 변환

```python
# Python에서 모델 변환 예시
import torch
from transformers import Wav2Vec2ForCTC

# 1. 모델 로드
model = Wav2Vec2ForCTC.from_pretrained("kresnik/wav2vec2-large-xlsr-korean")
model.eval()

# 2. 더미 입력 생성
dummy_input = torch.randn(1, 16000)  # 1초 오디오

# 3. ONNX 변환
torch.onnx.export(
    model,
    dummy_input,
    "wav2vec2_korean.onnx",
    input_names=["input"],
    output_names=["logits"],
    dynamic_axes={
        "input": {1: "audio_length"},
        "logits": {1: "time_steps"}
    },
    opset_version=14
)
```

### 변환 시 주의사항

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            변환 주의사항                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️ Dynamic Axes 설정                                                       │
│     • 오디오 길이가 가변적이므로 반드시 설정                                 │
│     • 설정 안하면 고정 길이만 처리 가능                                      │
│                                                                             │
│  ⚠️ ONNX Opset Version                                                      │
│     • onnxruntime-react-native는 opset 14 이상 권장                         │
│     • 너무 높은 버전은 호환성 문제                                          │
│                                                                             │
│  ⚠️ 양자화 주의                                                              │
│     • float16 양자화 시 정확도 손실 가능                                    │
│     • INT8 양자화는 별도 calibration 필요                                   │
│                                                                             │
│  ⚠️ 입력 타입                                                                │
│     • onnxruntime-react-native는 float32 텐서만 생성 가능                   │
│     • float16 모델이라도 입력은 float32로 전달                              │
│     • 런타임이 자동으로 변환                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 모델 사용 방법

### 1. 모델 파일 배치

```
assets/
└── model/
    ├── wav2vec2_korean_final.onnx   # ONNX 모델 (~305MB)
    └── vocab.json                    # 어휘 사전
```

### 2. Expo Config Plugin 설정

```javascript
// plugins/withOnnxModel.js
// 빌드 시 assets/model/ → android/app/src/main/assets/model/ 복사
// build.gradle에 noCompress "onnx" 추가 (압축 방지)
```

### 3. 모델 로딩 (ONNXContext)

```typescript
// utils/onnx/onnxContext.tsx
import { InferenceSession } from 'onnxruntime-react-native';

// 앱 시작 시 모델 로딩
const session = await InferenceSession.create(modelUri);

// Context로 전역 제공
<ONNXProvider>
  <App />
</ONNXProvider>
```

### 4. 추론 실행

```typescript
// utils/stt/inference.ts
import { Tensor } from 'onnxruntime-react-native';

export async function runSTTInference(
  session: InferenceSession,
  audioData: Float32Array,
  vocabInfo: VocabInfo,
  inputName: string,
  outputName: string
): Promise<string> {
  // 1. 텐서 생성
  const inputTensor = new Tensor('float32', audioData, [1, audioData.length]);

  // 2. 추론 실행
  const results = await session.run({ [inputName]: inputTensor });

  // 3. 결과 추출
  const logits = results[outputName];

  // 4. CTC 디코딩
  return decodeLogits(logits, vocabInfo);
}
```

### 5. CTC 디코딩

```typescript
function decodeLogits(logits: Tensor, vocabInfo: VocabInfo): string {
  const { idToToken, blankToken, padToken } = vocabInfo;
  const [, timeSteps, vocabSize] = logits.dims;
  const data = logits.data as Float32Array;

  const tokens: string[] = [];
  let prevToken = -1;

  // Greedy decoding
  for (let t = 0; t < timeSteps; t++) {
    // 최대 확률 토큰 찾기
    let maxProb = -Infinity;
    let maxIndex = 0;
    for (let v = 0; v < vocabSize; v++) {
      const prob = data[t * vocabSize + v];
      if (prob > maxProb) {
        maxProb = prob;
        maxIndex = v;
      }
    }

    // PAD 토큰 스킵
    if (maxIndex === padToken) continue;

    // 연속 중복 제거 (CTC)
    if (maxIndex === prevToken) continue;

    // 토큰 추가
    const tokenText = idToToken.get(maxIndex);
    if (tokenText === '|') {
      tokens.push(' ');  // Blank → 공백
    } else if (tokenText) {
      tokens.push(tokenText);
    }

    prevToken = maxIndex;
  }

  return tokens.join('').replace(/\s+/g, ' ').trim();
}
```

---

## ⚡ 성능 최적화

### 현재 성능

| 항목 | 값 |
|------|-----|
| 모델 로딩 | ~3-5초 (첫 실행 시) |
| 추론 시간 | ~1-3초 (1-10초 오디오) |
| 메모리 사용 | ~1.2GB (fp32 모델) |

### 최적화 방안

#### 1. 모델 양자화

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            양자화 옵션                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Float32 (현재)          Float16                    INT8                    │
│  ┌──────────────┐        ┌──────────────┐          ┌──────────────┐        │
│  │ 305MB        │        │ ~150MB       │          │ ~80MB        │        │
│  │ 정확도 100%  │   →    │ 정확도 ~99%  │    →     │ 정확도 ~95%  │        │
│  │ 속도 1x      │        │ 속도 1.5x    │          │ 속도 2-3x    │        │
│  └──────────────┘        └──────────────┘          └──────────────┘        │
│                                                                             │
│  권장: Float16 (정확도/속도 균형)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2. 모델 캐싱

```typescript
// 현재 구현됨
// Android assets → cache 디렉토리 복사
// 이후 실행 시 캐시에서 로드
const cacheDir = new Directory(Paths.cache, 'model');
if (cacheDir.exists) {
  // 캐시에서 로드 (빠름)
} else {
  // assets에서 복사 (최초 1회)
}
```

#### 3. 지연 로딩

```typescript
// 미래 개선안: 필요할 때만 로딩
const loadModelOnDemand = async () => {
  if (!modelLoaded) {
    await loadONNXModel();
    modelLoaded = true;
  }
  return session;
};
```

---

## 🔧 트러블슈팅

### 모델 로딩 실패

```
❌ 증상: "Model file not found" 에러

✅ 해결:
1. assets/model/ 에 .onnx 파일 존재 확인
2. npx expo prebuild --clean 실행
3. android/app/src/main/assets/model/ 확인
4. build.gradle에 noCompress "onnx" 확인
```

### 추론 결과가 비어있음

```
❌ 증상: 항상 "[EMPTY]" 반환

✅ 확인사항:
1. 오디오 샘플레이트가 16kHz인지 확인
2. 전처리 후 값 범위가 -3 ~ +3 인지 확인 (정규화)
3. 입력 텐서 shape이 [1, audioLength]인지 확인
4. vocab.json의 토큰 매핑 확인
```

### 메모리 부족

```
❌ 증상: 앱이 크래시하거나 느려짐

✅ 해결:
1. 긴 오디오를 청크로 분할 (10초 이하 권장)
2. 모델 양자화 고려 (float16)
3. 사용 후 명시적 메모리 해제
```

### 추론 속도가 느림

```
❌ 증상: 5초 이상 소요

✅ 확인사항:
1. 릴리즈 빌드에서 테스트 (디버그는 느림)
2. 오디오 길이 확인 (30초 이하 권장)
3. float16 양자화 모델 사용 고려
4. 백그라운드 스레드에서 추론 실행
```

---

## 📚 참고 자료

### 공식 문서
- [ONNX 공식 사이트](https://onnx.ai/)
- [ONNX Runtime 문서](https://onnxruntime.ai/docs/)
- [onnxruntime-react-native](https://github.com/valfirst/onnxruntime/tree/main/js/react_native)

### 논문
- [Wav2Vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477)
- [CTC: Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf)

### 모델
- [HuggingFace - Korean Wav2Vec2](https://huggingface.co/models?search=korean+wav2vec2)
- [ONNX Model Zoo](https://github.com/onnx/models)

---

**마지막 업데이트**: 2025-12-10
