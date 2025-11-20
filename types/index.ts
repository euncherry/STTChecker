/**
 * TypeScript 타입 정의 Barrel Export
 *
 * @description
 * 모든 타입 정의를 한 곳에서 import할 수 있도록 하는 barrel export 파일입니다.
 *
 * @example
 * ```typescript
 * // ❌ Before (개별 import)
 * import { ModelInfo } from '@/types/onnx.types';
 * import { STTResult } from '@/types/audio.types';
 * import { HistoryItem } from '@/types/history.types';
 *
 * // ✅ After (barrel export 사용)
 * import { ModelInfo, STTResult, HistoryItem } from '@/types';
 * ```
 *
 * **Barrel Export란?**
 * - 여러 모듈의 export를 하나의 파일로 모아서 재export하는 패턴
 * - import 경로 단순화
 * - 코드 가독성 향상
 * - 리팩토링 용이 (파일 구조 변경 시 index.ts만 수정)
 *
 * @author Claude (Senior RN Engineer)
 */

// ==================== ONNX 관련 타입 ====================
export type {
  ModelInfo,
  LogitsTensor,
  VocabInfo,
  ProgressCallback,
  AudioStats,
  WAVFileInfo,
} from "./onnx.types";

// ==================== 오디오 관련 타입 ====================
export type {
  STTResult,
  STTProcessOptions,
  STTProcessingStage,
  AudioPlaybackState,
  EvaluationMetrics,
  RecordingOptions,
  RecordingState,
  AudioFileURI,
} from "./audio.types";

// ==================== 히스토리 관련 타입 ====================
export type {
  HistoryItem,
  HistoryItemInput,
  StorageInfo,
  HistoryFilterOptions,
  HistorySortBy,
  TagStatistics,
  HistoryStatistics,
} from "./history.types";

/**
 * 💡 TypeScript 교육: Named Export vs Default Export
 *
 * ### Named Export (현재 방식) ✅
 * ```typescript
 * // 정의
 * export type ModelInfo = { ... };
 *
 * // 사용
 * import { ModelInfo } from '@/types';  // 정확한 이름 필요
 * ```
 *
 * **장점**:
 * - 여러 export 가능
 * - 자동완성 지원 우수
 * - 리팩토링 안전 (rename 시 IDE가 모든 사용처 추적)
 * - Tree-shaking 유리
 *
 * ### Default Export
 * ```typescript
 * // 정의
 * export default interface ModelInfo { ... }
 *
 * // 사용
 * import ModelInfo from '@/types';     // 임의의 이름 사용 가능
 * import MI from '@/types';             // 이것도 가능
 * ```
 *
 * **단점**:
 * - 하나만 export 가능
 * - 이름이 일관되지 않을 수 있음
 * - 자동완성 지원 약함
 *
 * ### 권장 사항
 * - **Types, Utils**: Named Export 사용 ✅
 * - **React Components**: Default Export도 OK
 * - **혼용 금지**: 하나만 선택하여 일관성 유지
 */

/**
 * 💡 TypeScript 교육: Type-only Import
 *
 * @description
 * `import type`을 사용하면 타입만 import하고 런타임 코드는 제외됩니다.
 *
 * @example
 * ```typescript
 * // ❌ 일반 import (런타임 코드 포함)
 * import { HistoryItem } from '@/types';
 *
 * // ✅ Type-only import (타입만, 런타임 제외)
 * import type { HistoryItem } from '@/types';
 * ```
 *
 * **장점**:
 * - 번들 크기 감소
 * - 명확한 의도 표현 (타입만 사용)
 * - Circular dependency 방지
 *
 * **사용 시기**:
 * - 인터페이스나 타입만 import할 때
 * - 제네릭 타입 파라미터로 사용할 때
 * - Props 타입 정의할 때
 *
 * **사용 금지 시기**:
 * - 클래스 import (런타임 코드 필요)
 * - Enum import (런타임 값 필요)
 * - 값과 타입 모두 필요할 때
 */

/**
 * 💡 프로젝트 구조 Best Practice
 *
 * ```
 * src/
 * ├── types/           # 타입 정의 (이 폴더)
 * │   ├── index.ts     # Barrel export
 * │   ├── onnx.types.ts
 * │   ├── audio.types.ts
 * │   └── history.types.ts
 * │
 * ├── hooks/           # Custom Hooks
 * │   ├── index.ts
 * │   ├── useSTTProcessing.ts
 * │   └── useAudioPlayback.ts
 * │
 * ├── utils/           # Pure Functions
 * │   ├── onnx/
 * │   └── stt/
 * │
 * └── app/             # Screens (UI only)
 * ```
 *
 * **원칙**:
 * 1. Types: 타입 정의만
 * 2. Hooks: React 로직 (상태, Effect)
 * 3. Utils: 순수 함수 (입력 → 출력)
 * 4. App: UI 렌더링만
 */
