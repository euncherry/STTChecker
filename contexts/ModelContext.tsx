import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import { InferenceSession, Tensor } from "onnxruntime-react-native";
import React, { createContext, useContext, useEffect, useState } from "react";

interface VocabData {
  [key: string]: number;
}

interface ModelContextType {
  isModelReady: boolean;
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  runInference: (audioData: Float32Array) => Promise<string>;
  vocab: VocabData | null;
  idToToken: Map<number, string> | null;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within ModelProvider");
  }
  return context;
};

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [vocab, setVocab] = useState<VocabData | null>(null);
  const [idToToken, setIdToToken] = useState<Map<number, string> | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 모델 및 vocab 초기화
  useEffect(() => {
    initializeModel();
  }, []);

  const initializeModel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Vocab 로드
      console.log("[Model] Loading vocab.json...");
      setLoadingProgress(10);

      const vocabAsset = Asset.fromModule(
        require("../assets/model/vocab.json")
      );
      await vocabAsset.downloadAsync();

      // 새로운 File API 사용 - File 생성자는 Directory 또는 여러 문자열을 받음
      const vocabFile = new File(vocabAsset.localUri!);
      const vocabContent = await vocabFile.text();
      const vocabData: VocabData = JSON.parse(vocabContent);
      setVocab(vocabData);

      // ID to Token 매핑 생성
      const tokenMap = new Map<number, string>();
      Object.entries(vocabData).forEach(([token, id]) => {
        tokenMap.set(id, token);
      });
      setIdToToken(tokenMap);

      console.log(
        `[Model] Vocab loaded: ${Object.keys(vocabData).length} tokens`
      );
      setLoadingProgress(30);

      // 2. ONNX 모델 로드 (305MB)
      console.log("[Model] Loading ONNX model...");

      const modelAsset = Asset.fromModule(
        require("../assets/model/wav2vec2_korean_merged.onnx")
      );
      await modelAsset.downloadAsync();

      if (!modelAsset.localUri) {
        throw new Error("Failed to download model");
      }

      setLoadingProgress(60);

      // 모델 파일을 앱 데이터 디렉토리로 복사 (필요시)
      const modelFile = new File(Paths.document, "wav2vec2_korean_merged.onnx");

      if (!modelFile.exists) {
        console.log("[Model] Copying model to document directory...");
        const sourceFile = new File(modelAsset.localUri);
        sourceFile.copy(modelFile);
      }

      setLoadingProgress(80);

      // 3. ONNX Runtime 세션 생성
      console.log("[Model] Creating inference session...");
      const newSession = await InferenceSession.create(modelFile.uri);
      setSession(newSession);

      console.log("[Model] Model loaded successfully!");
      setLoadingProgress(100);
      setIsModelReady(true);
    } catch (err) {
      console.error("[Model] Error loading model:", err);
      setError(err instanceof Error ? err.message : "Failed to load model");
    } finally {
      setIsLoading(false);
    }
  };

  // CTC 디코딩 함수
  const ctcDecode = (
    logits: Float32Array,
    timeSteps: number,
    vocabSize: number
  ): string => {
    if (!idToToken) return "";

    const tokens: string[] = [];
    let prevId = -1;

    // 각 time step에서 가장 높은 확률의 토큰 선택
    for (let t = 0; t < timeSteps; t++) {
      let maxId = 0;
      let maxProb = logits[t * vocabSize];

      // argmax 찾기
      for (let v = 1; v < vocabSize; v++) {
        const prob = logits[t * vocabSize + v];
        if (prob > maxProb) {
          maxProb = prob;
          maxId = v;
        }
      }

      // CTC 규칙 적용
      const token = idToToken.get(maxId);

      // [PAD], [UNK] 건너뛰기
      if (maxId === 1204 || maxId === 1203) continue;

      // 중복 제거 (CTC collapse)
      if (maxId !== prevId) {
        if (token === "|") {
          // 공백 처리
          tokens.push(" ");
        } else if (token) {
          tokens.push(token);
        }
      }

      prevId = maxId;
    }

    // 토큰 합치기 및 정리
    return tokens.join("").replace(/\s+/g, " ").trim();
  };

  // 추론 실행 함수
  const runInference = async (audioData: Float32Array): Promise<string> => {
    if (!session || !vocab || !idToToken) {
      throw new Error("Model not initialized");
    }

    try {
      console.log(
        `[Inference] Running inference on ${audioData.length} samples...`
      );

      // 입력 텐서 생성 [1, audio_length]
      const inputTensor = new Tensor("float32", audioData, [
        1,
        audioData.length,
      ]);

      // 추론 실행
      const feeds = { input_values: inputTensor };
      const results = await session.run(feeds);

      // logits 추출 [1, time_steps, vocab_size]
      const logits = results.logits;
      const logitsData = logits.data as Float32Array;
      const [, timeSteps, vocabSize] = logits.dims;

      console.log(`[Inference] Output shape: [1, ${timeSteps}, ${vocabSize}]`);

      // CTC 디코딩
      const text = ctcDecode(logitsData, timeSteps, vocabSize);

      console.log(`[Inference] Decoded text: "${text}"`);
      return text;
    } catch (err) {
      console.error("[Inference] Error:", err);
      throw err;
    }
  };

  return (
    <ModelContext.Provider
      value={{
        isModelReady,
        isLoading,
        loadingProgress,
        error,
        runInference,
        vocab,
        idToToken,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
