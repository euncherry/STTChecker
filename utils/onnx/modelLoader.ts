// utils/onnx/modelLoader.ts
import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as ort from "onnxruntime-react-native";
import { Platform } from "react-native";

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
  console.log("[ModelLoader] 📊 예상 모델 크기: 305MB");

  if (Platform.OS === "web") {
    throw new Error("ONNX Runtime은 웹 환경에서 지원되지 않습니다");
  }

  try {
    const startTime = Date.now();
    onProgress?.(0);

    // 1. Asset 로딩 (공식 예제 방식)
    console.log("[ModelLoader] 📥 Asset 로딩 시도 중...");

    const assets = await Asset.loadAsync(
      require("../../assets/model/wav2vec2_korean_final.onnx")
    );
    const modelAsset = assets[0];

    if (!modelAsset.localUri) {
      throw new Error("모델 Asset의 localUri를 가져올 수 없습니다");
    }

    console.log("[ModelLoader] ✅ Asset 로딩 성공:", modelAsset.localUri);

    console.log("[ModelLoader] 📥 모델 Asset 정보 조회 중...");
    onProgress?.(5);

    // 2. 캐시 경로 설정 (최신 Expo FileSystem API)
    const modelFileName = "wav2vec2_korean_final.onnx";
    const cachedFile = new File(Paths.cache, modelFileName);
    const cachedModelPath = cachedFile.uri;

    console.log("[ModelLoader] 📍 캐시 경로:", cachedModelPath);

    if (cachedFile.exists) {
      const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
      console.log("[ModelLoader] ✅ 캐시된 모델 발견!");
      console.log(`[ModelLoader] 📦 파일 크기: ${sizeMB}MB`);
    } else {
      // 4. 캐시에 없으면 복사
      console.log(
        "[ModelLoader] 📥 모델을 캐시로 복사 중... (305MB, 시간이 걸릴 수 있습니다)"
      );
      onProgress?.(10);

      await modelAsset.downloadAsync();
      onProgress?.(20);

      if (!modelAsset.localUri) {
        throw new Error("모델 파일을 다운로드할 수 없습니다");
      }

      console.log(
        "[ModelLoader] 🔄 파일 복사 중:",
        modelAsset.localUri,
        "→",
        cachedModelPath
      );

      // ✅ 최신 API: File.copy() 사용
      const sourceFile = new File(modelAsset.localUri!);
      sourceFile.copy(cachedFile);

      // ✅ 복사 후 확인 (같은 File 인스턴스 재사용)
      if (cachedFile.exists) {
        const sizeMB = (cachedFile.size / 1024 / 1024).toFixed(2);
        console.log(`[ModelLoader] ✅ 모델 복사 완료! 크기: ${sizeMB}MB`);
      }
    }

    onProgress?.(30);

    // 5. ONNX Runtime 세션 생성 (공식 예제 방식)
    console.log("[ModelLoader] 📍 최종 모델 경로:", cachedModelPath);
    onProgress?.(40);

    console.log("[ModelLoader] 🔧 ONNX Runtime 세션 생성 중...");
    onProgress?.(50);

    // 공식 예제처럼 직접 localUri 사용도 시도
    console.log("[ModelLoader] 🔄 직접 localUri로 세션 생성 시도...");
    const session = await ort.InferenceSession.create(modelAsset.localUri, {
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

    // 메타데이터 확인
    try {
      const inputMetadata = session.inputMetadata;
      const outputMetadata = session.outputMetadata;

      console.log(
        "[ModelLoader] 📊 Input Metadata:",
        JSON.stringify(inputMetadata, null, 2)
      );
      console.log(
        "[ModelLoader] 📊 Output Metadata:",
        JSON.stringify(outputMetadata, null, 2)
      );
    } catch (metaError) {
      console.log("[ModelLoader] ⚠️ 메타데이터 정보 사용 불가:", metaError);
    }

    onProgress?.(100);

    return {
      session,
      inputName: inputNames[0] || "input_values",
      outputName: outputNames[0] || "logits",
      modelPath: modelAsset.localUri,
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
