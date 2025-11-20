# ✅ Migration Checklist

Complete this checklist to fully migrate to the new architecture:

## 🔄 Completed Automatically

- [x] Created feature-based folder structure (`features/`)
- [x] Created global type definitions (`types/`)
- [x] Migrated audio recording to `expo-audio` (`useAudioRecording` hook)
- [x] Created audio playback hook (`useAudioPlayback`)
- [x] Refactored `app/record.tsx` with new hooks
- [x] Updated `app/results.tsx` with feature imports
- [x] Created comprehensive documentation (REFACTORING_GUIDE.md, ARCHITECTURE.md)

## 📝 Manual Steps Required

### 1. Update Remaining Import Statements

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

### 2. Remove Old Dependencies (Optional)

If you're no longer using `react-native-audio-record`, you can remove it:

```bash
npm uninstall react-native-audio-record
```

Then rebuild:
```bash
npx expo prebuild --clean
npx expo run:android
```

### 3. Update tsconfig.json Path Aliases (If Not Already Done)

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 4. Test the Application

Run through these test scenarios:

#### Recording Flow
- [ ] Open app and navigate to recording screen
- [ ] Verify microphone permission request
- [ ] Start recording and see countdown (3, 2, 1, 시작!)
- [ ] Record audio for a few seconds
- [ ] Stop recording manually or wait for auto-stop
- [ ] Verify navigation to results screen

#### Results Flow
- [ ] See STT transcription result
- [ ] View CER/WER scores
- [ ] Play back recorded audio
- [ ] View audio visualization graphs (toggle on/off)
- [ ] Add custom tags
- [ ] Save to history

#### History Flow
- [ ] Navigate to history tab
- [ ] See saved recordings list
- [ ] Play/pause recordings
- [ ] Delete individual recording
- [ ] Share recording to other apps
- [ ] View storage usage

#### Test Upload Flow
- [ ] Navigate to test tab
- [ ] Upload a WAV file
- [ ] See processing and results

#### Karaoke Demo Flow
- [ ] Navigate to sing tab
- [ ] Start karaoke animation
- [ ] Pause/resume controls work

### 5. Verify Build Process

```bash
# Clean build
npx expo prebuild --clean

# Android build
npx expo run:android

# Check for any TypeScript errors
npx tsc --noEmit

# Check for any linting issues (if using ESLint)
npx eslint .
```

### 6. Update Documentation (If Customized)

If you've customized CLAUDE.md or README.md with old import paths, update them to use the new feature-based imports.

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/features/audio'"

**Solution**: Ensure tsconfig.json has the `@/*` path alias configured and restart your TypeScript server (in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")

### Issue: "useAudioRecording is not a function"

**Solution**: Check that you've imported it correctly:
```typescript
import { useAudioRecording } from '@/features/audio';
```

Not:
```typescript
import useAudioRecording from '@/features/audio';  // ❌ Wrong
```

### Issue: Recording doesn't start / permission denied

**Solution**:
1. Check that permissions are granted in device settings
2. Verify `useEffect` for permission request is running
3. Check console logs for permission-related errors

### Issue: TypeScript errors in refactored files

**Solution**:
1. Run `npx tsc --noEmit` to see all errors
2. Most likely missing import updates or type definitions
3. Check that all feature modules have proper `index.ts` exports

### Issue: "Module not found: Error: Can't resolve '@/features/...'"

**Solution**: Metro bundler cache issue. Clear it:
```bash
npx expo start --clear
```

---

## 📊 Progress Tracking

### Core Refactoring
- [x] Feature modules created
- [x] Types organized
- [x] Audio migration complete
- [x] Critical screens updated

### Import Updates (Do These Manually)
- [ ] app/_layout.tsx
- [ ] app/(tabs)/history.tsx
- [ ] app/(tabs)/test.tsx
- [ ] app/(tabs)/sing.tsx (if uses karaoke utils)
- [ ] components/KaraokeText.tsx

### Testing
- [ ] Recording flow tested
- [ ] Results flow tested
- [ ] History flow tested
- [ ] Test upload flow tested
- [ ] Karaoke demo tested
- [ ] Build succeeds without errors

### Cleanup (Optional)
- [ ] Remove old `utils/` folders (after verifying imports)
- [ ] Remove `react-native-audio-record` dependency
- [ ] Update any custom documentation

---

## 🎉 When Complete

Once all checklist items are done:

1. ✅ Commit your changes
2. ✅ Push to your feature branch
3. ✅ Test on a physical device (if possible)
4. ✅ Create a pull request with summary of changes

---

## 📚 Reference Documentation

- **REFACTORING_GUIDE.md**: Detailed explanation of changes
- **ARCHITECTURE.md**: Complete architecture overview
- **features/audio/hooks/useAudioRecording.ts**: Example of modern hook pattern
- **app/record.tsx**: Example of refactored screen

---

**Happy Migrating! 🚀**

Need help? Check the extensive inline comments in the refactored code!
