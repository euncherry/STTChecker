// utils/onnx/onnxContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { loadONNXModel, ModelInfo } from "./modelLoader";
import { loadVocab, VocabInfo } from "./vocabLoader";

interface ONNXContextType {
  modelInfo: ModelInfo | null;
  vocabInfo: VocabInfo | null;
  isLoading: boolean;
  loadingProgress: number; // ✅ 추가
  error: string | null;
  reloadModel: () => Promise<void>;
}

const ONNXContext = createContext<ONNXContextType>({
  modelInfo: null,
  vocabInfo: null,
  isLoading: true,
  loadingProgress: 0, // ✅ 추가
  error: null,
  reloadModel: async () => {},
});

export const useONNX = () => {
  const context = useContext(ONNXContext);
  if (!context) {
    throw new Error("useONNX must be used within ONNXProvider");
  }
  return context;
};

interface ONNXProviderProps {
  children: React.ReactNode;
}

export function ONNXProvider({ children }: ONNXProviderProps) {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [vocabInfo, setVocabInfo] = useState<VocabInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0); // ✅ 추가
  const [error, setError] = useState<string | null>(null);

  const loadResources = async () => {
    // ✅ 웹 환경 체크
    if (Platform.OS === "web") {
      console.log("[ONNXProvider] ⚠️ 웹 환경에서는 ONNX 지원 안 함");
      setError("웹 환경에서는 AI 모델을 사용할 수 없습니다");
      setIsLoading(false);
      return;
    }

    console.log("[ONNXProvider] 🚀 플랫폼:", Platform.OS);
    console.log("========================================");
    console.log("[ONNXProvider] 🚀 리소스 로딩 시작");
    console.log("========================================");

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0); // ✅ 초기화

    try {
      // 1. Vocab 로딩 (0-30%)
      console.log("[ONNXProvider] 1️⃣ Vocab 로딩 중...");
      setLoadingProgress(10);
      const vocab = await loadVocab();
      setVocabInfo(vocab);
      setLoadingProgress(30);
      console.log("[ONNXProvider] ✅ Vocab 로딩 완료");

      // 2. ONNX 모델 로딩 (30-80%)
      console.log("[ONNXProvider] 2️⃣ ONNX 모델 로딩 중...");
      setLoadingProgress(40);

      // 진행률 콜백 함수 추가
      const model = await loadONNXModel((progress) => {
        // 40-80% 구간에 매핑
        const mappedProgress = 40 + progress * 0.4;
        setLoadingProgress(Math.min(mappedProgress, 80));
      });

      setModelInfo(model);
      setLoadingProgress(80);
      console.log("[ONNXProvider] ✅ ONNX 모델 로딩 완료");

      // 3. 초기화 마무리 (80-100%)
      setLoadingProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 500)); // 약간의 딜레이
      setLoadingProgress(100);

      console.log("========================================");
      console.log("[ONNXProvider] 🎉 모든 리소스 로딩 성공!");
      console.log("========================================");

      // 로딩 완료 후 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("[ONNXProvider] ❌ 리소스 로딩 실패:", errorMessage);
      setError(errorMessage);
      setLoadingProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();

    // Cleanup
    return () => {
      if (modelInfo?.session) {
        console.log("[ONNXProvider] 🧹 모델 세션 정리 중...");
      }
    };
  }, []);

  const reloadModel = async () => {
    console.log("[ONNXProvider] 🔄 모델 재로딩 요청");
    await loadResources();
  };

  return (
    <ONNXContext.Provider
      value={{
        modelInfo,
        vocabInfo,
        isLoading,
        loadingProgress, // ✅ 추가
        error,
        reloadModel,
      }}
    >
      {children}
    </ONNXContext.Provider>
  );
}
