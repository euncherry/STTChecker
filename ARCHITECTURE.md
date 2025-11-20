# 🏛️ STTChecker Architecture

## 📁 Complete File Tree

```
STTChecker/
│
├── 📱 app/                                  # Expo Router (file-based routing)
│   ├── _layout.tsx                          # Root layout (model loading, theme)
│   ├── +html.tsx                            # HTML wrapper for web
│   ├── +not-found.tsx                       # 404 page
│   ├── modal.tsx                            # Generic modal screen
│   ├── record.tsx                           # ✅ REFACTORED: Recording screen (expo-audio)
│   ├── results.tsx                          # ✅ REFACTORED: Results screen (feature imports)
│   │
│   └── (tabs)/                              # Tab navigation group
│       ├── _layout.tsx                      # Tab navigator configuration
│       ├── index.tsx                        # Home tab (sentence input)
│       ├── sing.tsx                         # Sing tab (karaoke demo)
│       ├── test.tsx                         # Test tab (file upload)
│       └── history.tsx                      # History tab (saved recordings)
│
├── 🎨 components/                           # Global reusable UI components
│   ├── CustomHeader.tsx
│   ├── KaraokeText.tsx
│   ├── ModelLoadingScreen.tsx
│   ├── WaveSurferWebView.tsx
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useClientOnlyValue.ts
│   └── useClientOnlyValue.web.ts
│
├── 🧩 features/                             # ✨ NEW: Feature-based modules
│   │
│   ├── 🎤 audio/                            # Audio recording & playback
│   │   ├── hooks/
│   │   │   ├── useAudioRecording.ts         # ✨ NEW: Recording hook (replaces react-native-audio-record)
│   │   │   └── useAudioPlayback.ts          # ✨ NEW: Playback hook (wraps expo-audio)
│   │   ├── utils/
│   │   │   └── config.ts                    # Recording presets & configuration
│   │   ├── types.ts                         # Audio-specific types
│   │   └── index.ts                         # Public API (barrel export)
│   │
│   ├── 🗣️ stt/                             # Speech-to-Text pipeline
│   │   ├── utils/
│   │   │   ├── audioPreprocessor.ts         # WAV parsing, resampling, normalization
│   │   │   ├── inference.ts                 # ONNX inference & CTC decoding
│   │   │   └── metrics.ts                   # CER/WER calculation
│   │   ├── types.ts                         # STT-specific types
│   │   └── index.ts                         # Public API
│   │
│   ├── 💾 history/                          # Recording history & storage
│   │   ├── utils/
│   │   │   └── historyManager.ts            # CRUD operations, file management
│   │   ├── types.ts                         # HistoryItem, StorageInfo types
│   │   └── index.ts                         # Public API
│   │
│   ├── 🤖 onnx/                             # ONNX model management
│   │   ├── utils/
│   │   │   ├── modelLoader.ts               # Model loading (assets → cache)
│   │   │   └── vocabLoader.ts               # Vocabulary loading
│   │   ├── onnxContext.tsx                  # React Context provider
│   │   ├── types.ts                         # ModelInfo, VocabInfo types
│   │   └── index.ts                         # Public API
│   │
│   └── 🎵 karaoke/                          # Karaoke text animation
│       ├── utils/
│       │   └── timingPresets.ts             # Syllable timing presets
│       ├── types.ts                         # Timing types
│       └── index.ts                         # Public API
│
├── 📘 types/                                # ✨ NEW: Global type definitions
│   ├── global.ts                            # Shared types (AppError, AudioSource, etc.)
│   └── navigation.ts                        # Route parameter types (type-safe navigation)
│
├── 🎨 constants/                            # App-wide constants
│   ├── Colors.ts                            # Color palette
│   └── theme.ts                             # Material Design 3 theme
│
├── 🔌 plugins/                              # Expo Config Plugins
│   ├── withOnnxruntime.js                   # Register ONNX Runtime package
│   └── withOnnxModel.js                     # Copy model to Android assets
│
├── 📦 assets/                               # Static resources
│   ├── images/                              # Icons, splash screens
│   ├── model/                               # AI model files (gitignored, ~305MB)
│   │   ├── wav2vec2_korean_final.onnx
│   │   └── vocab.json
│   └── webview/                             # WebView HTML files
│       └── wavesurfer-viewer.html
│
├── 📄 Configuration Files
│   ├── app.json                             # Expo configuration
│   ├── package.json                         # Dependencies
│   ├── tsconfig.json                        # TypeScript configuration
│   ├── metro.config.js                      # Metro bundler config
│   ├── eas.json                             # EAS Build configuration
│   ├── CLAUDE.md                            # Project instructions for Claude
│   ├── REFACTORING_GUIDE.md                 # ✨ NEW: Detailed refactoring guide
│   └── ARCHITECTURE.md                      # ✨ NEW: This file
│
└── 📚 Documentation
    └── README.md                            # Project README
```

---

## 🔄 Import Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     app/record.tsx                      │
│                    (Recording Screen)                    │
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

## 🏗️ Feature Module Anatomy

Each feature module follows this consistent pattern:

```
features/{feature}/
│
├── hooks/                    # React hooks (if needed)
│   ├── useSomething.ts
│   └── useSomethingElse.ts
│
├── components/               # Feature-specific components (if needed)
│   └── SomeComponent.tsx
│
├── utils/                    # Business logic & utilities
│   ├── helper.ts
│   └── config.ts
│
├── types.ts                  # Feature-specific TypeScript types
│   └── export interface FeatureType { ... }
│
└── index.ts                  # 🚪 PUBLIC API (barrel export)
    ├── export { useSomething } from './hooks/useSomething';
    ├── export { helper } from './utils/helper';
    └── export type { FeatureType } from './types';
```

### 🎯 Why This Pattern?

1. **Predictable Structure**: Every feature looks the same
2. **Easy Navigation**: Know where to find things
3. **Clear API**: `index.ts` defines what's public
4. **Encapsulation**: Internal implementation hidden
5. **Testable**: Each module can be tested independently

---

## 📦 Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                       App Layer                         │
│  app/record.tsx, app/results.tsx, app/(tabs)/*         │
└────────────────────┬────────────────────────────────────┘
                     │ imports
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Feature Layer                        │
│  features/audio, features/stt, features/history, etc.  │
└────────────────────┬────────────────────────────────────┘
                     │ imports
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Component Layer                       │
│          components/, constants/, types/                │
└────────────────────┬────────────────────────────────────┘
                     │ imports
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   External Layer                        │
│    expo-audio, expo-file-system, react-native, etc.    │
└─────────────────────────────────────────────────────────┘
```

### 📏 Dependency Rules

✅ **Allowed**:
- App → Features
- Features → Components
- Features → Types
- Components → Types

❌ **Not Allowed**:
- Features → App (circular)
- Components → Features (breaks reusability)
- Types → anything (types should be pure)

---

## 🔑 Key Architectural Decisions

### 1. Feature-Based Organization

**Decision**: Organize by feature/domain instead of technical layer

**Rationale**:
- Related code stays together
- Easier to understand and modify
- Better for team collaboration
- Simplifies code splitting and lazy loading

### 2. Barrel Exports (index.ts)

**Decision**: Each feature exports through a single `index.ts`

**Rationale**:
- Single import path for consumers
- Can refactor internals without breaking imports
- Clear public API
- Better tree-shaking

### 3. Strict TypeScript

**Decision**: No `any` types, explicit return types, strict mode

**Rationale**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Safer refactoring

### 4. Modern Expo SDK

**Decision**: Use latest expo-audio (v1.0) and expo-file-system (v19)

**Rationale**:
- Official Expo support
- Better cross-platform consistency
- Declarative hooks API
- Type-safe by default

### 5. Path Aliases (@/)

**Decision**: Use `@/` prefix for absolute imports

**Rationale**:
- No more `../../../` hell
- Easier to move files
- Cleaner imports
- IDE autocomplete works better

---

## 🚀 Performance Considerations

### Code Splitting (Future)

With feature-based architecture, we can easily lazy-load features:

```typescript
// Future optimization
const AudioFeature = lazy(() => import('@/features/audio'));
const STTFeature = lazy(() => import('@/features/stt'));
```

### Bundle Analysis

Current structure makes it easy to analyze bundle size by feature:

```bash
npx react-native-bundle-visualizer
```

### Memory Management

- ONNX model: Loaded once on app startup (in Context)
- Audio files: Temporary in cache, permanent in document directory
- History: Max 100 items with automatic cleanup

---

## 🧪 Testing Strategy

### Unit Tests

Test each feature module independently:

```typescript
// features/audio/__tests__/useAudioRecording.test.ts
describe('useAudioRecording', () => {
  it('should handle recording lifecycle', async () => {
    const { result } = renderHook(() => useAudioRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state.isRecording).toBe(true);
  });
});
```

### Integration Tests

Test feature interactions:

```typescript
// __tests__/recording-to-results.test.ts
describe('Recording to Results Flow', () => {
  it('should process recording and show results', async () => {
    // Test complete user flow
  });
});
```

---

## 📊 Metrics & Monitoring

### Key Metrics to Track

1. **Model Load Time**: Time to load ONNX model
2. **Recording Duration**: Average recording length
3. **Inference Time**: Time to process audio
4. **CER/WER Scores**: Average accuracy
5. **Storage Usage**: History size over time

### Logging Convention

```typescript
console.log('[FeatureName] 🚀 Action starting');
console.log('[FeatureName] ✅ Success');
console.error('[FeatureName] ❌ Error:', error);
```

---

## 🔮 Future Enhancements

### Potential Improvements

1. **State Management**: Add Zustand/Jotai for global state
2. **API Layer**: Create `services/` for external APIs
3. **Testing**: Add comprehensive test coverage
4. **CI/CD**: Automated testing and deployment
5. **Performance**: Lazy loading and code splitting
6. **Analytics**: User behavior tracking
7. **Error Tracking**: Sentry or similar
8. **Offline Support**: Better offline capabilities

### Scalability

Current architecture supports:
- Adding new features (just create `features/newFeature/`)
- Extracting features to separate packages
- Multiple teams working on different features
- Incremental adoption of new patterns

---

## 📚 Learning Resources

### Recommended Reading

1. **Feature-Sliced Design**: https://feature-sliced.design/
2. **Expo Router**: https://docs.expo.dev/router/
3. **TypeScript Patterns**: https://www.typescriptlang.org/docs/handbook/
4. **React Hooks**: https://react.dev/reference/react

### Example Implementations

- `features/audio/`: Modern audio recording pattern
- `features/stt/`: Complex processing pipeline
- `app/record.tsx`: Refactored screen example
- `types/navigation.ts`: Type-safe navigation

---

**Last Updated**: 2025-11-20
**Architecture Version**: 2.0.0
**Project**: STTChecker
