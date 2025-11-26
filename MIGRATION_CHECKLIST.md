# ✅ 마이그레이션 체크리스트

새로운 아키텍처로 완전히 마이그레이션하려면 이 체크리스트를 완료하세요:

## 🔄 자동으로 완료됨

- [x] 기능 기반 폴더 구조 생성 (`features/`)
- [x] 전역 타입 정의 생성 (`types/`)
- [x] 오디오 녹음 훅 생성 (`useAudioRecording` - react-native-audio-record 래핑, WAV 형식)
- [x] 오디오 재생 훅 생성 (`useAudioPlayback`)
- [x] 새 훅으로 `app/record.tsx` 리팩토링
- [x] 기능 임포트로 `app/results.tsx` 업데이트
- [x] 포괄적인 문서 생성 (REFACTORING_GUIDE.md, ARCHITECTURE.md)

## 📝 수동으로 해야 할 단계

### 1. 나머지 임포트 문 업데이트

#### app/_layout.tsx
```diff
- import { useONNX, ONNXProvider } from "@/utils/onnx/onnxContext";
+ import { useONNX, ONNXProvider } from "@/features/onnx";
```

#### app/(tabs)/history.tsx
```diff
- import { loadHistories, deleteHistory, shareAudioFile } from "@/utils/storage/historyManager";
+ import { loadHistories, deleteHistory, shareAudioFile } from "@/features/history";
- import type { HistoryItem } from "@/utils/storage/historyManager";
+ import type { HistoryItem } from "@/features/history";
```

#### app/(tabs)/test.tsx
```diff
- import { preprocessAudioFile } from "@/utils/stt/audioPreprocessor";
- import { runSTTInference } from "@/utils/stt/inference";
+ import { preprocessAudioFile, runSTTInference } from "@/features/stt";
- import { useONNX } from "@/utils/onnx/onnxContext";
+ import { useONNX } from "@/features/onnx";
```

#### components/KaraokeText.tsx
```diff
- import type { SyllableTiming } from "@/utils/karaoke/timingPresets";
- import { generateAutoTimings } from "@/utils/karaoke/timingPresets";
+ import type { SyllableTiming } from "@/features/karaoke";
+ import { generateAutoTimings } from "@/features/karaoke";
```

### 2. 이전 의존성 제거 (선택사항)

더 이상 `react-native-audio-record`를 사용하지 않는다면 제거할 수 있습니다:

```bash
npm uninstall react-native-audio-record
```

그런 다음 다시 빌드:
```bash
npx expo prebuild --clean
npx expo run:android
```

### 3. tsconfig.json 경로 별칭 업데이트 (아직 안 했다면)

`tsconfig.json`에 다음이 있는지 확인:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 4. 애플리케이션 테스트

다음 테스트 시나리오를 실행하세요:

#### 녹음 흐름
- [ ] 앱을 열고 녹음 화면으로 이동
- [ ] 마이크 권한 요청 확인
- [ ] 녹음을 시작하고 카운트다운 확인 (3, 2, 1, 시작!)
- [ ] 몇 초간 오디오 녹음
- [ ] 수동으로 녹음 중지 또는 자동 중지 대기
- [ ] 결과 화면으로 이동 확인

#### 결과 흐름
- [ ] STT 전사 결과 확인
- [ ] CER/WER 점수 확인
- [ ] 녹음된 오디오 재생
- [ ] 오디오 시각화 그래프 확인 (토글 켜기/끄기)
- [ ] 커스텀 태그 추가
- [ ] 히스토리에 저장

#### 히스토리 흐름
- [ ] 히스토리 탭으로 이동
- [ ] 저장된 녹음 목록 확인
- [ ] 녹음 재생/일시정지
- [ ] 개별 녹음 삭제
- [ ] 다른 앱으로 녹음 공유
- [ ] 저장소 사용량 확인

#### 테스트 업로드 흐름
- [ ] 테스트 탭으로 이동
- [ ] WAV 파일 업로드
- [ ] 처리 및 결과 확인

#### 가라오케 데모 흐름
- [ ] 노래 탭으로 이동
- [ ] 가라오케 애니메이션 시작
- [ ] 일시정지/재개 컨트롤 작동 확인

### 5. 빌드 프로세스 확인

```bash
# 클린 빌드
npx expo prebuild --clean

# Android 빌드
npx expo run:android

# TypeScript 에러 확인
npx tsc --noEmit

# 린팅 문제 확인 (ESLint 사용 시)
npx eslint .
```

### 6. 문서 업데이트 (커스터마이징한 경우)

이전 임포트 경로로 CLAUDE.md 또는 README.md를 커스터마이징했다면, 새로운 기능 기반 임포트를 사용하도록 업데이트하세요.

---

## 🐛 일반적인 문제 및 해결책

### 문제: "Cannot find module '@/features/audio'"

**해결책**: tsconfig.json에 `@/*` 경로 별칭이 설정되어 있는지 확인하고 TypeScript 서버를 재시작하세요 (VS Code에서: Cmd+Shift+P → "TypeScript: Restart TS Server")

### 문제: "useAudioRecording is not a function"

**해결책**: 올바르게 임포트했는지 확인:
```typescript
import { useAudioRecording } from '@/features/audio';
```

다음은 안 됨:
```typescript
import useAudioRecording from '@/features/audio';  // ❌ 틀림
```

### 문제: 녹음이 시작되지 않음 / 권한 거부됨

**해결책**:
1. 기기 설정에서 권한이 부여되었는지 확인
2. 권한 요청을 위한 `useEffect`가 실행되는지 확인
3. 권한 관련 에러가 있는지 콘솔 로그 확인

### 문제: 리팩토링된 파일에서 TypeScript 에러

**해결책**:
1. 모든 에러를 보려면 `npx tsc --noEmit` 실행
2. 대부분 임포트 업데이트 누락 또는 타입 정의 문제
3. 모든 기능 모듈에 적절한 `index.ts` 익스포트가 있는지 확인

### 문제: "Module not found: Error: Can't resolve '@/features/...'"

**해결책**: Metro 번들러 캐시 문제. 캐시를 지우세요:
```bash
npx expo start --clear
```

---

## 📊 진행 상황 추적

### 핵심 리팩토링
- [x] 기능 모듈 생성
- [x] 타입 정리
- [x] 오디오 마이그레이션 완료
- [x] 주요 화면 업데이트

### 임포트 업데이트 (수동으로 수행)
- [ ] app/_layout.tsx
- [ ] app/(tabs)/history.tsx
- [ ] app/(tabs)/test.tsx
- [ ] app/(tabs)/sing.tsx (가라오케 유틸 사용 시)
- [ ] components/KaraokeText.tsx

### 테스팅
- [ ] 녹음 흐름 테스트
- [ ] 결과 흐름 테스트
- [ ] 히스토리 흐름 테스트
- [ ] 테스트 업로드 흐름 테스트
- [ ] 가라오케 데모 테스트
- [ ] 에러 없이 빌드 성공

### 정리 (선택사항)
- [ ] 이전 `utils/` 폴더 제거 (임포트 확인 후)
- [ ] `react-native-audio-record` 의존성 제거
- [ ] 커스텀 문서 업데이트

---

## 🎉 완료 시

모든 체크리스트 항목이 완료되면:

1. ✅ 변경사항 커밋
2. ✅ 기능 브랜치에 푸시
3. ✅ 실제 기기에서 테스트 (가능하면)
4. ✅ 변경사항 요약과 함께 Pull Request 생성

---

## 📚 참고 문서

- **REFACTORING_GUIDE.md**: 변경사항의 상세 설명
- **ARCHITECTURE.md**: 완전한 아키텍처 개요
- **features/audio/hooks/useAudioRecording.ts**: 최신 훅 패턴 예시
- **app/record.tsx**: 리팩토링된 화면 예시

---

**즐거운 마이그레이션 되세요! 🚀**

도움이 필요하신가요? 리팩토링된 코드의 광범위한 인라인 주석을 확인하세요!
