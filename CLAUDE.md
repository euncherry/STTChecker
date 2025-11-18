# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2025-11-18
**Project Version**: 1.1.0
**Target Audience**: AI Assistants (Claude, etc.)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Key Features & User Flows](#key-features--user-flows)
6. [Development Setup](#development-setup)
7. [Code Conventions](#code-conventions)
8. [AI/ML Pipeline](#aiml-pipeline)
9. [File System & Storage](#file-system--storage)
10. [Common Development Tasks](#common-development-tasks)
11. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**STTChecker** is a Korean pronunciation evaluation application built with React Native and Expo. It uses an ONNX-based Wav2Vec2 model to convert speech to text and evaluates pronunciation accuracy using CER (Character Error Rate) and WER (Word Error Rate) metrics.

### Core Functionality

1. **Recording**: Users record themselves pronouncing a target sentence
2. **STT Processing**: Audio is processed through Wav2Vec2 ONNX model
3. **Evaluation**: CER/WER metrics calculated by comparing target vs recognized text
4. **History**: Previous recordings saved with audio files and scores

### Platform Support

- **Primary**: Android (fully supported)
- **iOS**: Not currently configured but architecture supports it
- **Web**: ONNX model not supported on web (handled gracefully with error state)

---

## Codebase Structure

```
STTChecker/
├── app/                           # Screens (Expo Router file-based routing)
│   ├── (tabs)/                    # Tab navigation group
│   │   ├── _layout.tsx            # Tab layout (4 tabs: Home, Sing, Test, History)
│   │   ├── index.tsx              # Home screen (sentence input)
│   │   ├── sing.tsx               # Sing screen (karaoke demo)
│   │   ├── test.tsx               # Test screen (file upload)
│   │   └── history.tsx            # History screen (saved recordings)
│   ├── _layout.tsx                # Root layout (model loading, theming)
│   ├── record.tsx                 # Recording screen (real-time audio capture)
│   ├── results.tsx                # Results screen (STT output, CER/WER)
│   ├── modal.tsx                  # Generic modal component
│   ├── +not-found.tsx             # 404 screen
│   └── +html.tsx                  # HTML wrapper for web
│
├── components/                    # Reusable React components
│   ├── CustomHeader.tsx           # Custom header component
│   ├── ModelLoadingScreen.tsx     # Loading screen with progress indicator
│   ├── KaraokeText.tsx            # Karaoke-style text animation component
│   ├── useColorScheme.ts          # Dark/light mode hook
│   ├── useClientOnlyValue.ts      # Client-only rendering hook
│   └── __tests__/                 # Component tests
│
├── utils/                         # Utility functions and business logic
│   ├── onnx/                      # ONNX model management
│   │   ├── modelLoader.ts         # Model loading from assets → cache
│   │   ├── onnxContext.tsx        # Global model state (React Context)
│   │   └── vocabLoader.ts         # Vocabulary loading
│   ├── stt/                       # Speech-to-text pipeline
│   │   ├── audioPreprocessor.ts   # WAV parsing, resampling, normalization
│   │   ├── inference.ts           # ONNX inference & CTC decoding
│   │   └── metrics.ts             # CER/WER calculation
│   ├── storage/                   # Data persistence
│   │   └── historyManager.ts      # History CRUD, file management, sharing
│   └── karaoke/                   # Karaoke animation utilities
│       └── timingPresets.ts       # Syllable timing presets
│
├── plugins/                       # Expo Config Plugins (build-time)
│   ├── withOnnxruntime.js         # Registers ONNX Runtime native package
│   └── withOnnxModel.js           # Copies model to Android assets
│
├── constants/                     # App-wide constants
│   ├── Colors.ts                  # Color palette
│   └── theme.ts                   # Material Design 3 theme
│
├── assets/                        # Static resources
│   ├── images/                    # Icons, splash screens
│   └── model/                     # AI model files (gitignored)
│       ├── wav2vec2_korean_final.onnx  (~305MB)
│       └── vocab.json             # Korean token vocabulary
│
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
├── eas.json                       # EAS Build configuration
└── metro.config.js                # Metro bundler configuration
```

### File Naming Conventions

- **Screens**: Located in `app/`, use lowercase with dashes (e.g., `record.tsx`, `results.tsx`)
- **Components**: PascalCase (e.g., `CustomHeader.tsx`, `ModelLoadingScreen.tsx`)
- **Utilities**: camelCase (e.g., `modelLoader.ts`, `historyManager.ts`)
- **Layouts**: `_layout.tsx` (Expo Router convention)
- **Route Groups**: Wrapped in parentheses `(tabs)/` (Expo Router convention)

---

## Technology Stack

### Core Framework
- **React Native**: `0.81.5` - Mobile app framework
- **Expo**: `^54.0.22` - Development platform
- **Expo Router**: `~6.0.13` - File-based routing
- **TypeScript**: `~5.9.2` - Type safety

### UI & Styling
- **React Native Paper**: `^5.14.5` - Material Design 3 components
- **Reanimated**: `~4.1.1` - Animations
- **Safe Area Context**: `~5.6.0` - Safe area handling

### AI/ML
- **onnxruntime-react-native**: `^1.23.2` - ONNX model inference
- **Model**: Wav2Vec2 Korean (305MB ONNX file)

### Audio
- **Recording**: `react-native-audio-record` `^0.2.2` (Android, 16kHz WAV)
- **Playback**: `expo-audio` `~1.0.14` (useAudioPlayer hooks)

### Storage & File System
- **File System**: `expo-file-system` `~19.0.17` (New File/Directory API)
- **Data Persistence**: `@react-native-async-storage/async-storage` `2.2.0`
- **Media Library**: `expo-media-library` `~18.2.0` (audio export)
- **Sharing**: `expo-sharing` `~14.0.7` (share to other apps)

### Utilities
- **Levenshtein Distance**: `js-levenshtein` `^1.1.6` - For CER/WER calculation
- **Document Picker**: `expo-document-picker` `~14.0.7` - File selection

---

## Architecture & Design Patterns

### 1. **File-Based Routing** (Expo Router)

Navigation is determined by file structure in `app/`:
- `app/index.tsx` → `/` (root route)
- `app/record.tsx` → `/record`
- `app/(tabs)/index.tsx` → Tab group home
- `app/_layout.tsx` → Root layout wrapper

**Navigation Example:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push({ pathname: '/record', params: { text: 'target sentence' } });
```

### 2. **React Context for Global State**

**ONNXContext** (`utils/onnx/onnxContext.tsx`) manages model state globally:
```typescript
const { modelInfo, vocabInfo, isLoading, loadingProgress, error } = useONNX();
```

Used in `app/_layout.tsx` as provider wrapper for all screens.

### 3. **Separation of Concerns**

- **Screens** (`app/`): UI and user interaction
- **Business Logic** (`utils/`): Data processing, model inference
- **Components** (`components/`): Reusable UI elements
- **Build-time Config** (`plugins/`): Native integration

### 4. **TypeScript Strict Mode**

All code uses strict TypeScript:
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

### 5. **Material Design 3**

Consistent UI using React Native Paper theme (`constants/theme.ts`):
```typescript
import { MD3LightTheme } from 'react-native-paper';
const theme = { ...MD3LightTheme, colors: customColors };
```

---

## Key Features & User Flows

### 1. **Home Screen** (`app/(tabs)/index.tsx`)

**Purpose**: Enter target sentence for pronunciation practice

**User Flow**:
1. User types or selects template sentence
2. Character count displayed
3. "녹음 시작하기" button navigates to `/record`

**Key Components**:
- `TextInput` (multiline)
- `Chip` (template selection)
- `Button` (start recording)

### 2. **Recording Screen** (`app/record.tsx`)

**Purpose**: Record audio of user pronouncing target sentence

**User Flow**:
1. Request microphone permission (Android)
2. Display target text with karaoke animation
3. **3-second countdown** before recording starts
4. Auto-stop after estimated duration + 1 second
5. Manual stop option
6. Navigate to `/results` with audio file path

**Audio Recording (Android)**:
```typescript
import AudioRecord from 'react-native-audio-record';

AudioRecord.init({
  sampleRate: 16000,      // Required by model
  channels: 1,            // Mono
  bitsPerSample: 16,      // 16-bit PCM
  audioSource: 6,         // VOICE_RECOGNITION
  wavFile: 'recording_${Date.now()}.wav'
});

AudioRecord.start();  // Start recording
const path = await AudioRecord.stop();  // Returns file path
```

**File Location**: `Paths.cache/recording_*.wav` (temporary)

### 3. **Results Screen** (`app/results.tsx`)

**Purpose**: Display STT results and pronunciation scores

**Processing Pipeline**:
```
WAV File
  ↓ [audioPreprocessor.ts]
  → Parse WAV header
  → Convert to Float32 [-1, 1]
  → Convert to mono
  → Resample to 16kHz
  → Wav2Vec2 normalization (mean=0, std=1)
  ↓ [inference.ts]
  → Create ONNX tensor
  → Run model inference
  → CTC greedy decoding
  ↓ [metrics.ts]
  → Calculate CER (character-level)
  → Calculate WER (word-level)
  ↓
Display Results + Audio Playback
```

**Key Features**:
- Audio playback with `useAudioPlayer`
- Target vs recognized text comparison
- CER/WER accuracy scores
- Tag management (auto + custom)
- Save to history or re-record

**Audio Playback**:
```typescript
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const player = useAudioPlayer(audioFile);
const status = useAudioPlayerStatus(player);

// Play/pause toggle
if (status.playing) {
  player.pause();
} else {
  if (status.currentTime >= status.duration) {
    player.seekTo(0);  // Restart if finished
  }
  player.play();
}
```

### 4. **History Screen** (`app/(tabs)/history.tsx`)

**Purpose**: View and manage saved recordings

**Features**:
- List all saved recordings (AsyncStorage)
- Play/pause audio
- Delete individual or all records
- Export audio to device
- Share audio to other apps
- Storage usage display
- Tag filtering (implemented in historyManager, UI pending)

**Storage Structure**:
```
AsyncStorage: "@pronunciation_history"
  → Array<HistoryItem> (max 100)

File System: Paths.document/audio/
  → recording_${id}.wav (permanent storage)
```

### 5. **Test Screen** (`app/(tabs)/test.tsx`)

**Purpose**: Test STT with uploaded WAV files

**User Flow**:
1. Select WAV file using `expo-document-picker`
2. Process through same STT pipeline
3. Display results immediately (no saving)

### 6. **Sing Screen** (`app/(tabs)/sing.tsx`)

**Purpose**: Demonstrate karaoke-style text animation

**Features**:
- Interactive demo of karaoke text highlighting
- Play/pause/resume controls
- Syllable-by-syllable animation
- Manual timing configuration for testing
- Uses `KaraokeText` component

**KaraokeText Component** (`components/KaraokeText.tsx`):
- Reusable component for karaoke-style text animation
- Supports preset timings or auto-generated timings
- Configurable duration per character (default: 0.3s)
- Uses `react-native-reanimated` for smooth animations
- Can be controlled externally or use internal timer

**Usage**:
```typescript
import KaraokeText from '@/components/KaraokeText';

<KaraokeText
  text="안녕하세요"
  isPlaying={isPlaying}
  currentTime={audioCurrentTime}  // Optional: sync with audio
  durationPerCharacter={0.3}       // Optional: custom speed
  referenceTimings={presetTimings} // Optional: precise timings
  textColor="#374151"
  fillColor="#3B82F6"
  fontSize={24}
/>
```

**Timing Presets** (`utils/karaoke/timingPresets.ts`):
- Predefined timings for common Korean phrases
- Auto-generation fallback for unlisted sentences
- `getTimingPreset(text)` helper function

---

## Development Setup

### Prerequisites

```bash
# Required
node >= 18.x
npm or yarn
expo-cli

# For native builds
Android Studio (for Android)
Xcode (for iOS, macOS only)
```

### Installation

```bash
# Clone repository
git clone https://github.com/euncherry/STTChecker.git
cd STTChecker

# Install dependencies
npm install

# Start development server
npx expo start
```

### Model Files Setup

**IMPORTANT**: Model files are gitignored due to size (305MB)

1. Obtain `wav2vec2_korean_final.onnx` and `vocab.json`
2. Place in `assets/model/`:
   ```
   assets/
   └── model/
       ├── wav2vec2_korean_final.onnx
       └── vocab.json
   ```

### Building for Android

```bash
# Generate native Android project (includes plugins)
npx expo prebuild --clean

# Run on Android device/emulator
npx expo run:android

# For production build
eas build --platform android
```

**Config Plugins Run Automatically**:
- `withOnnxruntime.js`: Registers ONNX package in MainApplication.java
- `withOnnxModel.js`: Copies model to `android/app/src/main/assets/model/`

---

## Code Conventions

### TypeScript Standards

1. **Strict mode enabled** - No `any` types without explicit reason
2. **Interface over Type** for object shapes
3. **Explicit return types** for functions
4. **Path aliases**: Use `@/` prefix (configured in tsconfig.json)

### Component Patterns

**Functional Components Only**:
```typescript
export default function ScreenName() {
  const [state, setState] = useState<Type>(initialValue);

  return (
    <View>
      {/* JSX */}
    </View>
  );
}
```

**Hooks**:
- React hooks at top of component
- Custom hooks in `components/` directory
- Context hooks from `utils/onnx/onnxContext.tsx`

### Styling

**StyleSheet Pattern**:
```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ...
  },
});
```

**Theme Usage**:
```typescript
import { useTheme } from 'react-native-paper';

const theme = useTheme();
const backgroundColor = theme.colors.background;
```

### Logging Conventions

**Console Pattern** (helps debugging):
```typescript
console.log("[ComponentName] 🚀 Action starting");
console.log("[ComponentName] ✅ Success");
console.error("[ComponentName] ❌ Error:", error);
console.warn("[ComponentName] ⚠️ Warning");
```

Emojis used for visual scanning in logs:
- 🚀 Starting operation
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 📊 Data/stats
- 🔄 Processing
- 💾 Saving
- 📖 Loading
- 🗑️ Deleting

### Error Handling

```typescript
try {
  // Operation
  console.log("[Module] 🚀 Starting...");
  const result = await operation();
  console.log("[Module] ✅ Success");
  return result;
} catch (error) {
  console.error("[Module] ❌ Failed:", error);
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

---

## AI/ML Pipeline

### Model Information

- **Model**: `wav2vec2_korean_final.onnx` (Wav2Vec2 for Korean)
- **Size**: ~305MB (compressed), ~1.24GB (memory)
- **Vocabulary**: `vocab.json` (SentencePiece tokens)
- **Input**: Float32 array, 16kHz, mono, normalized
- **Output**: Logits (time_steps × vocab_size) for CTC decoding

### Loading Pipeline (`utils/onnx/`)

**1. Model Loader** (`modelLoader.ts`):
```typescript
export async function loadONNXModel(
  progressCallback?: (progress: number) => void
): Promise<ModelInfo>
```

**Process**:
1. Check if model exists in cache (`Paths.cache/model/`)
2. If not, copy from Android assets → cache
3. Create ONNX InferenceSession
4. Return session + input/output names

**2. Vocab Loader** (`vocabLoader.ts`):
```typescript
export async function loadVocab(): Promise<VocabInfo>
```

**Returns**:
```typescript
{
  tokenToId: Map<string, number>,
  idToToken: Map<number, string>,
  blankToken: number,  // Usually "|" for space
  padToken: number
}
```

**3. Context Provider** (`onnxContext.tsx`):

Loads both model and vocab on app startup with progress tracking (0-100%).

```typescript
<ONNXProvider>
  {/* App screens */}
</ONNXProvider>
```

### Audio Preprocessing (`utils/stt/audioPreprocessor.ts`)

**Main Function**:
```typescript
export async function parseWAVFile(uri: string): Promise<Float32Array>
```

**Steps**:

1. **Parse WAV Header**:
   - Extract sample rate, channels, bit depth
   - Validate format (supports 16-bit and 32-bit PCM)

2. **Convert to Float32** (0-1 normalized):
   - 16-bit: `sample / 32768.0`
   - 32-bit: `sample / 2147483648.0`

3. **Convert to Mono** (if stereo):
   - Average all channels: `(left + right) / numChannels`

4. **Resample to 16kHz** (if needed):
   - Uses linear interpolation
   - Function: `resample(data, fromRate, toRate)`

5. **Wav2Vec2 Normalization**:
   ```typescript
   export function wav2vec2Preprocess(audioData: Float32Array): Float32Array {
     // 1. Mean removal (zero-centering)
     const mean = sum(audioData) / length;
     const centered = audioData.map(x => x - mean);

     // 2. Standardization (std = 1)
     const std = sqrt(sum((x - mean)^2) / length);
     const normalized = centered.map(x => x / (std + 1e-7));

     return normalized;
   }
   ```

### Inference Pipeline (`utils/stt/inference.ts`)

**Main Function**:
```typescript
export async function runSTTInference(
  session: InferenceSession,
  audioData: Float32Array,
  vocabInfo: VocabInfo,
  inputName: string,
  outputName: string
): Promise<string>
```

**Steps**:

1. **Create Tensor**:
   ```typescript
   const shape = [1, audioData.length];
   const tensor = new Tensor('float32', audioData, shape);
   ```

2. **Run Inference**:
   ```typescript
   const results = await session.run({ [inputName]: tensor });
   const logits = results[outputName];
   ```

3. **CTC Greedy Decoding**:
   ```typescript
   function decodeLogits(logits, vocabInfo): string {
     const timeSteps = logits.dims[1];
     const vocabSize = logits.dims[2];

     let tokens = [];
     let prevToken = -1;

     for (let t = 0; t < timeSteps; t++) {
       // Find highest probability token
       let maxProb = -Infinity;
       let maxIndex = 0;

       for (let v = 0; v < vocabSize; v++) {
         const prob = logits.data[t * vocabSize + v];
         if (prob > maxProb) {
           maxProb = prob;
           maxIndex = v;
         }
       }

       // Skip PAD tokens
       if (maxIndex === padToken) continue;

       // Skip duplicate tokens (CTC)
       if (maxIndex === prevToken) continue;

       // Add token
       const tokenText = idToToken.get(maxIndex);
       if (tokenText === '|') {
         tokens.push(' ');  // Blank token = space
       } else {
         tokens.push(tokenText);
       }

       prevToken = maxIndex;
     }

     return tokens.join('').replace(/\s+/g, ' ').trim();
   }
   ```

### Metrics Calculation (`utils/stt/metrics.ts`)

**CER (Character Error Rate)**:
```typescript
export function calculateCER(reference: string, hypothesis: string): number {
  // Remove spaces for pure character comparison
  const refChars = reference.replace(/\s+/g, '');
  const hypChars = hypothesis.replace(/\s+/g, '');

  const distance = Levenshtein(refChars, hypChars);
  const cer = distance / refChars.length;

  return Math.min(cer, 1.0);  // Cap at 100%
}
```

**WER (Word Error Rate)**:
```typescript
export function calculateWER(reference: string, hypothesis: string): number {
  // Split by spaces for Korean words
  const refWords = reference.trim().split(/\s+/);
  const hypWords = hypothesis.trim().split(/\s+/);

  const distance = Levenshtein(refWords.join(' '), hypWords.join(' '));
  const wer = distance / refWords.length;

  return Math.min(wer, 1.0);  // Cap at 100%
}
```

**Levenshtein Distance**: Edit distance (insertions, deletions, substitutions) using `js-levenshtein` library.

---

## File System & Storage

### expo-file-system v19 (New API)

**Migration from Legacy API**:

❌ **Old** (v18 and earlier):
```typescript
import * as FileSystem from 'expo-file-system';

const path = FileSystem.cacheDirectory + 'file.wav';
const info = await FileSystem.getInfoAsync(path);
```

✅ **New** (v19+):
```typescript
import { File, Directory, Paths } from 'expo-file-system';

const file = new File(Paths.cache, 'file.wav');
const exists = file.exists;  // Synchronous!
const size = file.size;      // Synchronous!
```

### Key Concepts

**1. Paths** (Directory Constants):
```typescript
import { Paths } from 'expo-file-system';

Paths.cache      // Temporary cache (can be cleared by OS)
Paths.document   // Permanent app documents
```

**2. Directory** (Folder Management):
```typescript
import { Directory } from 'expo-file-system';

const audioDir = new Directory(Paths.document, 'audio');

// Check existence (synchronous!)
if (!audioDir.exists) {
  audioDir.create({ intermediates: true });
}

// List files (synchronous!)
const files = audioDir.list();
```

**3. File** (File Operations):
```typescript
import { File } from 'expo-file-system';

const file = new File(Paths.cache, 'recording.wav');

// Synchronous properties
const exists = file.exists;
const size = file.size;
const uri = file.uri;

// Async methods
const buffer = await file.arrayBuffer();
const text = await file.text();

// Copy/move/delete
const sourceFile = new File(Paths.cache, 'temp.wav');
const targetFile = new File(Paths.document, 'saved.wav');
sourceFile.copy(targetFile);
file.delete();
```

### Storage Architecture

**Temporary Files** (Recording):
```
Paths.cache/recording_${timestamp}.wav
```
- Created during recording
- Processed immediately
- Deleted after save or discard

**Permanent Files** (History):
```
Paths.document/audio/recording_${id}.wav
```
- Copied from cache when user saves
- Managed by `historyManager.ts`
- Deleted only when user deletes history

### History Manager (`utils/storage/historyManager.ts`)

**Data Structure**:
```typescript
interface HistoryItem {
  id: string;                    // Timestamp-based unique ID
  targetText: string;            // Original sentence
  recognizedText: string;        // STT result
  audioFilePath: string;         // File URI in permanent storage
  cerScore: number;              // 0-1 (lower is better)
  werScore: number;              // 0-1 (lower is better)
  tags: string[];                // User/auto tags
  recordingDuration: number;     // Seconds
  processingTime: number;        // Milliseconds
  createdAt: string;             // ISO timestamp
}
```

**Key Functions**:

```typescript
// Save new recording
await saveHistory({
  targetText,
  recognizedText,
  audioFilePath: tempPath,  // Will be copied to permanent storage
  cerScore,
  werScore,
  tags,
  recordingDuration,
  processingTime
});

// Load all histories (validates audio files exist)
const histories = await loadHistories();

// Delete single item (removes audio file + metadata)
await deleteHistory(id);

// Clear all (removes audio directory + AsyncStorage)
await clearAllHistories();

// Get storage usage
const { itemCount, totalSizeMB, audioDir } = await getStorageInfo();

// Export/share audio file
await shareAudioFile(audioFilePath);
```

**Storage Limits**:
- Max 100 history items (configurable: `MAX_HISTORY_ITEMS`)
- Oldest items auto-deleted when limit exceeded
- File validation on load (orphaned records removed)

---

## Common Development Tasks

### Adding a New Screen

1. **Create file in `app/`**:
   ```typescript
   // app/new-screen.tsx
   export default function NewScreen() {
     return <View><Text>New Screen</Text></View>;
   }
   ```

2. **Navigate to it**:
   ```typescript
   import { useRouter } from 'expo-router';

   const router = useRouter();
   router.push('/new-screen');
   ```

3. **Pass parameters**:
   ```typescript
   router.push({ pathname: '/new-screen', params: { id: '123' } });

   // In new-screen.tsx
   import { useLocalSearchParams } from 'expo-router';
   const { id } = useLocalSearchParams();
   ```

### Adding a New Tab

1. **Create file in `app/(tabs)/`**:
   ```typescript
   // app/(tabs)/new-tab.tsx
   export default function NewTab() {
     return <View><Text>New Tab</Text></View>;
   }
   ```

2. **Update `app/(tabs)/_layout.tsx`**:
   ```typescript
   <Tabs.Screen
     name="new-tab"
     options={{
       title: 'New Tab',
       tabBarIcon: ({ color }) => <TabBarIcon name="icon-name" color={color} />
     }}
   />
   ```

### Accessing ONNX Model

```typescript
import { useONNX } from '@/utils/onnx/onnxContext';

export default function MyScreen() {
  const { modelInfo, vocabInfo, isLoading, error } = useONNX();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  // Use modelInfo.session and vocabInfo for inference
  const result = await runSTTInference(
    modelInfo.session,
    audioData,
    vocabInfo,
    modelInfo.inputName,
    modelInfo.outputName
  );
}
```

### Processing Audio File

```typescript
import { parseWAVFile } from '@/utils/stt/audioPreprocessor';
import { runSTTInference } from '@/utils/stt/inference';
import { calculateCER, calculateWER } from '@/utils/stt/metrics';
import { useONNX } from '@/utils/onnx/onnxContext';

export default function ProcessAudio({ filePath, targetText }) {
  const { modelInfo, vocabInfo } = useONNX();

  const process = async () => {
    try {
      // 1. Preprocess audio
      const audioData = await parseWAVFile(filePath);

      // 2. Run inference
      const recognized = await runSTTInference(
        modelInfo!.session,
        audioData,
        vocabInfo!,
        modelInfo!.inputName,
        modelInfo!.outputName
      );

      // 3. Calculate metrics
      const cer = calculateCER(targetText, recognized);
      const wer = calculateWER(targetText, recognized);

      return { recognized, cer, wer };
    } catch (error) {
      console.error('[ProcessAudio] ❌ Failed:', error);
      throw error;
    }
  };
}
```

### Saving to History

```typescript
import { saveHistory, saveAudioFile } from '@/utils/storage/historyManager';

const saveRecording = async (tempFilePath: string, data: any) => {
  try {
    // 1. Copy audio file to permanent storage
    const { uri } = await saveAudioFile(tempFilePath, Date.now().toString());

    // 2. Save metadata to AsyncStorage
    const historyItem = await saveHistory({
      targetText: data.targetText,
      recognizedText: data.recognized,
      audioFilePath: uri,
      cerScore: data.cer,
      werScore: data.wer,
      tags: data.tags,
      recordingDuration: data.duration,
      processingTime: data.processingTime
    });

    console.log('[Save] ✅ Saved:', historyItem.id);
  } catch (error) {
    console.error('[Save] ❌ Failed:', error);
  }
};
```

### Adding New Preprocessing Step

**Example**: Add noise reduction

1. **Create function in `audioPreprocessor.ts`**:
   ```typescript
   export function removeNoise(audioData: Float32Array): Float32Array {
     // Your noise reduction algorithm
     return processedData;
   }
   ```

2. **Update `parseWAVFile`**:
   ```typescript
   export async function parseWAVFile(uri: string): Promise<Float32Array> {
     // ... existing steps ...

     // Add after mono conversion, before resampling
     let processed = convertToMono(normalized, numChannels);
     processed = removeNoise(processed);  // ← New step
     processed = resample(processed, sampleRate, 16000);

     return wav2vec2Preprocess(processed);
   }
   ```

### Using Karaoke Animation

**Basic usage (auto-generated timings)**:
```typescript
import KaraokeText from '@/components/KaraokeText';

const [isPlaying, setIsPlaying] = useState(false);

<KaraokeText
  text="안녕하세요"
  isPlaying={isPlaying}
  durationPerCharacter={0.3}  // 300ms per character
/>
```

**With audio synchronization**:
```typescript
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import KaraokeText from '@/components/KaraokeText';

const player = useAudioPlayer(audioFile);
const status = useAudioPlayerStatus(player);

<KaraokeText
  text="안녕하세요"
  isPlaying={status.playing}
  currentTime={status.currentTime}  // Sync with audio
/>
```

**With preset timings**:
```typescript
import { getTimingPreset } from '@/utils/karaoke/timingPresets';

const text = "감사합니다";
const timings = getTimingPreset(text);  // Returns preset or undefined

<KaraokeText
  text={text}
  referenceTimings={timings}  // Will auto-generate if undefined
  isPlaying={isPlaying}
/>
```

**Adding new preset timing**:
```typescript
// In utils/karaoke/timingPresets.ts
export const KARAOKE_TIMING_PRESETS: Record<string, SyllableTiming[]> = {
  // ... existing presets ...

  "새로운 문장": [
    { syllable: "새", start: 0.0, end: 0.3 },
    { syllable: "로", start: 0.3, end: 0.6 },
    { syllable: "운", start: 0.6, end: 0.9 },
    { syllable: " ", start: 0.9, end: 1.0 },
    { syllable: "문", start: 1.0, end: 1.3 },
    { syllable: "장", start: 1.3, end: 1.6 },
  ],
};
```

### Debugging Model Issues

**Check model loading**:
```typescript
const { modelInfo, vocabInfo, error } = useONNX();

console.log('[Debug] Model loaded:', !!modelInfo);
console.log('[Debug] Input name:', modelInfo?.inputName);
console.log('[Debug] Output name:', modelInfo?.outputName);
console.log('[Debug] Vocab size:', vocabInfo?.idToToken.size);
```

**Validate audio preprocessing**:
```typescript
const audioData = await parseWAVFile(filePath);

console.log('[Debug] Audio length:', audioData.length);
console.log('[Debug] Sample rate (effective):', audioData.length / durationSeconds);
console.log('[Debug] Value range:', {
  min: Math.min(...audioData),
  max: Math.max(...audioData),
  mean: audioData.reduce((a, b) => a + b) / audioData.length
});

// Should be:
// - Length: ~16000 samples per second
// - Values: roughly -3 to +3 (normalized)
// - Mean: close to 0
```

**Check inference output**:
```typescript
// Inference logs automatically in console
// Look for:
// - Logits shape: [1, time_steps, vocab_size]
// - Token distribution (should be varied, not all one token)
// - Decoded tokens (should contain Korean characters)
```

---

## Important Notes for AI Assistants

### When Modifying Code

1. **Always use TypeScript strict mode** - No `any` without reason
2. **Preserve existing logging patterns** - Use emoji prefixes for consistency
3. **Test model-related changes carefully** - ONNX issues can be subtle
4. **File system API**: Use new `File`/`Directory` API, not legacy strings
5. **Expo Router**: File-based routing, don't create manual route configs
6. **Karaoke animations**: Use `KaraokeText` component for text highlighting, supports auto-generation and custom timings

### Platform-Specific Considerations

**Android**:
- Audio recording uses `react-native-audio-record` (16kHz native)
- ONNX model copied to assets during build (via plugin)
- Permissions requested at runtime

**iOS** (not currently configured):
- Would need iOS config in app.json
- Audio recording would need different library or platform-specific code
- ONNX should work but needs testing

**Web**:
- ONNX not supported (handled gracefully with error state)
- Audio recording not available
- UI still loads for demonstration

### Performance Considerations

1. **Model size**: 305MB, loads at app startup (show progress)
2. **Inference time**: ~1-3 seconds on mid-range devices
3. **Audio files**: Keep recordings under 30 seconds for performance
4. **History limit**: 100 items prevents unbounded storage growth

### Common Pitfalls

1. **File paths**: Always use `File`/`Directory` objects, not string concatenation
2. **Audio format**: Must be 16kHz mono for model (preprocessing handles this)
3. **CTC decoding**: Blank token ("|") maps to space, handle correctly
4. **AsyncStorage**: JSON serialization, keep data structures simple
5. **Model loading**: Async, must wait for ONNXContext before inference

### Testing Checklist

When making changes, verify:

- [ ] App builds: `npx expo prebuild --clean && npx expo run:android`
- [ ] Model loads: Check loading progress reaches 100%
- [ ] Recording works: Can record and hear playback
- [ ] STT works: Recognizes simple Korean phrases
- [ ] Metrics calculate: CER/WER between 0-1
- [ ] History saves: Items persist after app restart
- [ ] File cleanup: Temp files deleted, permanent files kept

---

## Troubleshooting

### Model fails to load

**Symptoms**: "Model file not found" error

**Solutions**:
1. Check `assets/model/wav2vec2_korean_final.onnx` exists
2. Run `npx expo prebuild --clean` to regenerate native project
3. Check plugin ran: `android/app/src/main/assets/model/` should have .onnx file
4. Verify `aaptOptions { noCompress "onnx" }` in `app/build.gradle`

### Audio preprocessing errors

**Symptoms**: "Invalid sample rate" or "Unsupported format"

**Solutions**:
1. Verify WAV file is valid (check header bytes)
2. Support for 16-bit and 32-bit PCM only (check `bitsPerSample`)
3. For uploaded files, ensure they're actually WAV (not MP3/AAC)

### Poor STT accuracy

**Symptoms**: CER/WER > 0.5 for clear audio

**Debug**:
1. Check audio normalization (values should be -3 to +3 range)
2. Verify sample rate is 16kHz after resampling
3. Check token distribution in logs (should be varied)
4. Test with known-good audio file

**Potential causes**:
- Microphone quality poor
- Background noise
- Speaker accent/pronunciation differs from training data
- Audio preprocessing bug

### App crashes on startup

**Symptoms**: App closes immediately after splash screen

**Solutions**:
1. Check native logs: `adb logcat | grep STTChecker`
2. ONNX Runtime native library issue → reinstall dependencies
3. Memory issue (305MB model) → test on device with more RAM
4. Check `withOnnxruntime` plugin ran correctly

### File system errors

**Symptoms**: "File not found" when playing history audio

**Solutions**:
1. Check file URI format: `file:///data/user/0/...`
2. Verify `audioDir.exists` before operations
3. Run `loadHistories()` which validates and cleans orphaned records
4. Check Android permissions (shouldn't be needed for app's own directories)

### Build failures

**Symptoms**: `npx expo run:android` fails

**Common issues**:
1. **Plugin errors**: Run `npx expo prebuild --clean` to regenerate
2. **Gradle errors**: Check `android/app/build.gradle` for syntax errors
3. **Cache issues**: `cd android && ./gradlew clean && cd ..`
4. **Node modules**: `rm -rf node_modules && npm install`

---

## Additional Resources

### Relevant Documentation

- **Expo**: https://docs.expo.dev/
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **Expo Audio**: https://docs.expo.dev/versions/latest/sdk/audio/
- **expo-file-system v19**: https://docs.expo.dev/versions/latest/sdk/filesystem/
- **ONNX Runtime**: https://onnxruntime.ai/docs/
- **React Native Paper**: https://callstack.github.io/react-native-paper/

### Algorithms

- **CTC Decoding**: https://distill.pub/2017/ctc/
- **Wav2Vec2**: https://arxiv.org/abs/2006.11477
- **Levenshtein Distance**: https://en.wikipedia.org/wiki/Levenshtein_distance

### Project Links

- **Repository**: https://github.com/euncherry/STTChecker
- **Issues**: https://github.com/euncherry/STTChecker/issues

---

## Changelog

### v1.1.0 (Current)
- **New Feature**: Karaoke-style text animation (`KaraokeText` component)
- **New Screen**: Sing tab for karaoke demo
- **Enhancement**: 3-second countdown before recording
- **Enhancement**: Auto-stop recording after estimated duration
- **Enhancement**: Karaoke animation during recording
- **New Utility**: Timing presets for karaoke animations
- **Improvement**: Better user experience in recording flow

### v1.0.0 (Initial Release)
- Korean pronunciation evaluation with Wav2Vec2
- Real-time recording (16kHz, Android)
- CER/WER metrics calculation
- History management with audio playback
- Tag system (auto + manual)
- Audio export and sharing
- Material Design 3 UI

---

## Contact

For questions or issues: [GitHub Issues](https://github.com/euncherry/STTChecker/issues)

---

**END OF CLAUDE.md**
