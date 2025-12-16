// utils/onnx/modelLoader.ts
import { File, Paths } from "expo-file-system";
import * as ort from "onnxruntime-react-native";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

export interface ModelInfo {
  session: any;
  inputName: string;
  outputName: string;
  modelPath: string;
}

type ProgressCallback = (progress: number) => void;

export async function loadONNXModel(
  onProgress?: ProgressCallback
): Promise<ModelInfo> {
  console.log("[ModelLoader] 🤖 ONNX 모델 로딩 시작...");
  console.log("[ModelLoader] 📊 예상 모델 크기: 607MB");

  if (Platform.OS === "web") {
    throw new Error("ONNX Runtime은 웹 환경에서 지원되지 않습니다");
  }

  try {
    const startTime = Date.now();
    onProgress?.(0);

    let modelPath: string;

    if (Platform.OS === "android") {
      // ✅ Android: APK 내부 assets → 캐시로 복사
      const modelFileName = "wav2vec2_korean_final.onnx";
      const cachedFile = new File(Paths.cache, modelFileName);

      console.log("[ModelLoader] 📍 캐시 경로:", cachedFile.uri);

      if (cachedFile.exists) {
        const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
        console.log("[ModelLoader] ✅ 캐시된 모델 발견!");
        console.log(`[ModelLoader] 📦 파일 크기: ${sizeMB}MB`);
      } else {
        console.log(
          "[ModelLoader] 📥 APK assets에서 모델 복사 중... (607MB, 30초~1분 소요)"
        );
        onProgress?.(10);

        // ✅ Android asset 경로 (올바른 방식)
        const assetPath = "model/wav2vec2_korean_final.onnx";
        const destPath = cachedFile.uri.replace("file://", "");

        console.log("[ModelLoader] 🔍 Asset 경로:", assetPath);
        console.log("[ModelLoader] 🔍 목적지 경로:", destPath);

        try {
          // ✅ copyFileAssets 사용 (Android assets 전용)
          await RNFS.copyFileAssets(assetPath, destPath);

          onProgress?.(30);

          // ✅ 복사 확인
          if (cachedFile.exists) {
            const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
            console.log(`[ModelLoader] ✅ 모델 복사 완료! 크기: ${sizeMB}MB`);
          } else {
            throw new Error("모델 복사 후 캐시에서 찾을 수 없습니다");
          }
        } catch (copyError) {
          console.error("[ModelLoader] 복사 에러:", copyError);
          throw new Error(
            `Asset 복사 실패: ${
              copyError instanceof Error ? copyError.message : "알 수 없는 오류"
            }`
          );
        }
      }

      modelPath = cachedFile.uri;
    } else if (Platform.OS === "ios") {
      // ✅ iOS: 앱 번들 내의 모델 파일 로드
      const modelFileName = "wav2vec2_korean_final.onnx";
      const cachedFile = new File(Paths.cache, modelFileName);

      console.log("[ModelLoader] 📍 iOS 캐시 경로:", cachedFile.uri);

      if (cachedFile.exists) {
        const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
        console.log("[ModelLoader] ✅ 캐시된 모델 발견!");
        console.log(`[ModelLoader] 📦 파일 크기: ${sizeMB}MB`);
      } else {
        console.log(
          "[ModelLoader] 📥 iOS 번들에서 모델 복사 중... (607MB, 30초~1분 소요)"
        );
        onProgress?.(10);

        // iOS 번들 경로 (MainBundlePath 사용)
        const bundlePath = `${RNFS.MainBundlePath}/model/${modelFileName}`;
        const destPath = cachedFile.uri.replace("file://", "");

        console.log("[ModelLoader] 🔍 번들 경로:", bundlePath);
        console.log("[ModelLoader] 🔍 목적지 경로:", destPath);

        try {
          // 번들에서 캐시로 복사
          await RNFS.copyFile(bundlePath, destPath);

          onProgress?.(30);

          // 복사 확인
          if (cachedFile.exists) {
            const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
            console.log(`[ModelLoader] ✅ 모델 복사 완료! 크기: ${sizeMB}MB`);
          } else {
            throw new Error("모델 복사 후 캐시에서 찾을 수 없습니다");
          }
        } catch (copyError) {
          console.error("[ModelLoader] iOS 복사 에러:", copyError);
          throw new Error(
            `iOS 번들 복사 실패: ${
              copyError instanceof Error ? copyError.message : "알 수 없는 오류"
            }`
          );
        }
      }

      modelPath = cachedFile.uri;
    } else {
      throw new Error(`지원되지 않는 플랫폼: ${Platform.OS}`);
    }

    onProgress?.(40);

    console.log("[ModelLoader] 📍 최종 모델 경로:", modelPath);
    console.log("[ModelLoader] 🔧 ONNX Runtime 세션 생성 중...");
    onProgress?.(50);

    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: "sequential",
      logSeverityLevel: 3,
      logVerbosityLevel: 0,
    });

    onProgress?.(90);

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ModelLoader] ⏱️ 모델 로딩 완료! 소요 시간: ${loadTime}초`);

    const inputNames = session.inputNames;
    const outputNames = session.outputNames;

    console.log("[ModelLoader] 📝 모델 입출력 정보:");
    console.log(`  - Input Names: ${inputNames.join(", ")}`);
    console.log(`  - Output Names: ${outputNames.join(", ")}`);

    // 메타데이터 확인 (React Native에서는 지원되지 않음)
    console.log(
      "[ModelLoader] ℹ️ 메타데이터는 React Native 환경에서 지원되지 않습니다"
    );

    onProgress?.(100);

    return {
      session,
      inputName: inputNames[0] || "input_values",
      outputName: outputNames[0] || "logits",
      modelPath,
    };
  } catch (error) {
    console.error("[ModelLoader] ❌ 모델 로딩 실패:", error);

    if (error instanceof Error) {
      console.error("[ModelLoader] 에러 메시지:", error.message);
      console.error("[ModelLoader] 에러 스택:", error.stack);
    }

    throw new Error(
      `ONNX 모델 로딩 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}
