# 🏗️ STTChecker Refactoring Guide

## 📋 Overview

This document explains the architectural refactoring of STTChecker from a **utils-based** to a **feature-based** architecture, with modern Expo SDK patterns and strict TypeScript.

**Completed**: 2025-11-20
**Version**: 2.0.0

---

## 🎯 Refactoring Goals Achieved

✅ **Feature-Based Architecture**: Organized code by feature/domain instead of technical function
✅ **Modern expo-audio**: Migrated from `react-native-audio-record` to expo-audio hooks
✅ **Strict TypeScript**: Feature-specific and global types with no `any`
✅ **Latest Expo SDK**: Using expo-file-system v19 (File/Directory classes) and expo-audio v1.0
✅ **Educational Comments**: Extensive documentation explaining architectural decisions

---

## 📁 New Architecture

### Before (Utils-Based)
```
STTChecker/
├── app/                    # Screens
├── components/             # Global components
├── utils/                  # ❌ Everything mixed together
│   ├── onnx/
│   ├── stt/
│   ├── storage/
│   └── karaoke/
├── constants/
└── assets/
```

### After (Feature-Based)
```
STTChecker/
├── app/                    # Expo Router screens (unchanged)
├── components/             # Global reusable UI components
├── hooks/                  # ✨ NEW: Global custom hooks
├── utils/                  # ✨ NEW: Global utility functions
├── stores/                 # ✨ NEW: Global state management
├── types/                  # ✨ NEW: Global type definitions
│   ├── global.ts           # Shared types across features
│   └── navigation.ts       # Route parameter types
│
├── features/               # ✨ NEW: Feature modules
│   ├── audio/              # 🎤 Audio recording & playback
│   │   ├── hooks/          # useAudioRecording, useAudioPlayback
│   │   ├── utils/          # config.ts (recording presets)
│   │   ├── types.ts        # Audio-specific types
│   │   └── index.ts        # Public API
│   │
│   ├── stt/                # 🗣️ Speech-to-Text pipeline
│   │   ├── utils/          # preprocessing, inference, metrics
│   │   ├── types.ts        # STT-specific types
│   │   └── index.ts        # Public API
│   │
│   ├── history/            # 💾 Recording history & storage
│   │   ├── utils/          # historyManager.ts
│   │   ├── types.ts        # HistoryItem, StorageInfo
│   │   └── index.ts        # Public API
│   │
│   ├── onnx/               # 🤖 Model loading & management
│   │   ├── utils/          # modelLoader.ts, vocabLoader.ts
│   │   ├── onnxContext.tsx # React Context provider
│   │   ├── types.ts        # Model/Vocab types
│   │   └── index.ts        # Public API
│   │
│   └── karaoke/            # 🎵 Karaoke text animation
│       ├── utils/          # timingPresets.ts
│       ├── types.ts        # Timing types
│       └── index.ts        # Public API
│
├── constants/
└── assets/
```

---

## 🔄 Key Migration: Audio Recording

### BEFORE (react-native-audio-record)

```tsx
import AudioRecord from "react-native-audio-record";

// Imperative API - manual setup
const initializeRecording = async () => {
  const options = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    audioSource: 6,
    wavFile: `recording_${Date.now()}.wav`,
  };
  AudioRecord.init(options);

  // Manual permission handling (Android-specific)
  if (Platform.OS === "android") {
    const { PermissionsAndroid } = require("react-native");
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
  }
};

// Start recording
AudioRecord.start();

// Stop recording (returns string path)
const audioFile = await AudioRecord.stop();

// Manual URI formatting for Android
let fileUri = audioFile;
if (Platform.OS === "android" && !audioFile.startsWith("file://")) {
  fileUri = `file://${audioFile}`;
}
```

### AFTER (expo-audio with custom hook)

```tsx
import { useAudioRecording } from "@/features/audio";

// Declarative hook API - automatic setup
const {
  state,                 // { isRecording, currentTime, uri, canRecord }
  permissions,           // { granted, canAskAgain, status }
  startRecording,        // Start recording (handles permissions)
  stopRecording,         // Stop and return RecordingResult
  requestPermissions,    // Request permissions if needed
  error,                 // Error state
} = useAudioRecording();

// Auto-request permissions if needed
useEffect(() => {
  if (permissions && !permissions.granted && permissions.canAskAgain) {
    requestPermissions();
  }
}, [permissions]);

// Start recording
await startRecording();

// Stop recording (returns structured result)
const result = await stopRecording();
// result = { uri: string, duration: number }
// ✅ URI already properly formatted for all platforms
```

### 🎯 Benefits of New Approach

1. **Declarative Hooks**: React-native-audio-record uses imperative API, expo-audio uses declarative hooks
2. **Cross-Platform**: No platform-specific code needed
3. **Permission Management**: Built into the hook
4. **Type Safety**: Full TypeScript support with proper types
5. **Error Handling**: Centralized error state
6. **Real-Time State**: Automatic state updates via hooks
7. **URI Formatting**: Handled automatically
8. **Modern Expo SDK**: Part of official Expo SDK with better support

---

## 📦 Feature Module Pattern

Each feature module follows this structure:

```
features/{feature}/
├── hooks/              # Feature-specific React hooks
├── components/         # Feature-specific components (if needed)
├── utils/              # Business logic and utilities
├── types.ts            # Feature-specific TypeScript types
└── index.ts            # Public API (barrel export)
```

### Why This Pattern?

✅ **High Cohesion**: Related code stays together
✅ **Low Coupling**: Features can be developed/tested independently
✅ **Clear Boundaries**: Easy to understand what belongs where
✅ **Reusability**: Features can be extracted to separate packages
✅ **Type Safety**: Feature-specific types prevent cross-contamination

---

## 📝 Type Management Strategy

### Global Types (`types/`)

Used across multiple features:

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

### Feature-Specific Types (`features/{feature}/types.ts`)

Isolated to single feature:

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

### Type Safety in Navigation

```tsx
import type { RecordScreenParams } from '@/types/navigation';

// Type-safe params
const params = useLocalSearchParams<RecordScreenParams>();
const text = params.text;  // ✅ TypeScript knows this is string

// Type-safe navigation
router.push({
  pathname: '/record',
  params: {
    text: 'Hello'  // ✅ TypeScript enforces correct params
  }
});
```

---

## 🔌 Import Patterns

### Feature Imports (Barrel Exports)

Each feature module exports through `index.ts`:

```typescript
// features/audio/index.ts
export { useAudioRecording } from './hooks/useAudioRecording';
export { useAudioPlayback } from './hooks/useAudioPlayback';
export type { RecordingState, PlaybackState } from './types';
```

Usage:

```typescript
// ✅ Clean single import from feature
import { useAudioRecording, type RecordingState } from '@/features/audio';

// ❌ Don't import internal paths
import { useAudioRecording } from '@/features/audio/hooks/useAudioRecording';
```

### Path Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Usage:

```typescript
import { useAudioRecording } from '@/features/audio';
import type { RecordScreenParams } from '@/types/navigation';
import CustomHeader from '@/components/CustomHeader';
```

---

## 🛠️ Migration Checklist

For developers updating their imports:

### ✅ Audio Feature
- [ ] Replace `react-native-audio-record` with `useAudioRecording` hook
- [ ] Update imports: `import { useAudioRecording } from '@/features/audio'`
- [ ] Remove manual permission handling code
- [ ] Remove platform-specific URI formatting

### ✅ STT Feature
- [ ] Update imports from `@/utils/stt/*` to `@/features/stt`
- [ ] Example: `import { preprocessAudioFile, runSTTInference } from '@/features/stt'`

### ✅ History Feature
- [ ] Update imports from `@/utils/storage/*` to `@/features/history`
- [ ] Example: `import { saveHistory, loadHistories } from '@/features/history'`

### ✅ ONNX Feature
- [ ] Update imports from `@/utils/onnx/*` to `@/features/onnx`
- [ ] Example: `import { useONNX, ONNXProvider } from '@/features/onnx'`

### ✅ Karaoke Feature
- [ ] Update imports from `@/utils/karaoke/*` to `@/features/karaoke`
- [ ] Example: `import { getTimingPreset } from '@/features/karaoke'`

### ✅ Navigation Types
- [ ] Add type parameters to `useLocalSearchParams<T>()`
- [ ] Import types from `@/types/navigation`

---

## 📚 Educational Notes

### Why Feature-Based Over Utils-Based?

**Utils-Based Problems**:
- ❌ Hard to find related code (scattered across different utils folders)
- ❌ Unclear dependencies between modules
- ❌ Difficult to extract features for reuse
- ❌ Mixed responsibilities

**Feature-Based Benefits**:
- ✅ Related code grouped together
- ✅ Clear feature boundaries
- ✅ Easy to understand dependencies
- ✅ Simple to extract/share features
- ✅ Better testability

### Why Barrel Exports (index.ts)?

```typescript
// features/audio/index.ts
export { useAudioRecording } from './hooks/useAudioRecording';
export type { RecordingState } from './types';
```

**Benefits**:
1. **Single Entry Point**: Import from one place
2. **Encapsulation**: Hide internal structure
3. **Refactoring**: Change internals without affecting imports
4. **Tree Shaking**: Bundlers can optimize better

### Why Strict TypeScript?

```typescript
// ❌ BAD: Using any
function processAudio(data: any) {
  return data.samples;  // No type safety!
}

// ✅ GOOD: Proper types
function processAudio(data: Float32Array): Float32Array {
  return wav2vec2Preprocess(data);  // Type-checked!
}
```

**Benefits**:
- Catch errors at compile time, not runtime
- Better IDE autocomplete and IntelliSense
- Self-documenting code
- Refactoring confidence

---

## 🚀 Next Steps

### Recommended Improvements

1. **Global Hooks Folder**: Move shared hooks (if any) to `hooks/`
2. **Global Utils Folder**: Move shared utilities (date formatting, etc.) to `utils/`
3. **State Management**: Add `stores/` for global state (Zustand/Jotai)
4. **Component Library**: Extract reusable components
5. **Testing**: Add unit tests for each feature module
6. **Documentation**: Generate TypeDoc from JSDoc comments

### Testing Strategy

```typescript
// features/audio/__tests__/useAudioRecording.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useAudioRecording } from '../hooks/useAudioRecording';

describe('useAudioRecording', () => {
  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useAudioRecording());
    expect(result.current.state.isRecording).toBe(false);
  });
});
```

---

## 🔗 Resources

- [Expo Audio Docs](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo File System v19 Docs](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

## 📞 Support

For questions about this refactoring:
- Check the inline code comments (extensive documentation)
- Review the type definitions in `types/` and `features/*/types.ts`
- See example usage in refactored screens (`app/record.tsx`, `app/results.tsx`)

---

**Happy Coding! 🎉**
