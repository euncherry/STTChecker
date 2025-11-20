// utils/onnx/vocabLoader.ts

export interface VocabData {
  [key: string]: number;
}

export interface VocabInfo {
  vocab: VocabData;
  idToToken: Map<number, string>;
  padToken: number;
  unkToken: number;
  blankToken: number; // "|" 토큰
  vocabSize: number;
}

export async function loadVocab(): Promise<VocabInfo> {
  console.log("[VocabLoader] 📚 Vocab 로딩 시작...");

  try {
    // ✅ JSON은 그냥 require로 직접 import!
    const vocab: VocabData = require("../../assets/model/vocab.json");

    console.log(
      "[VocabLoader] ✅ Vocab 파싱 완료. 총 토큰 수:",
      Object.keys(vocab).length
    );

    // 역방향 매핑 생성 (ID -> 토큰)
    const idToToken = new Map<number, string>();
    Object.entries(vocab).forEach(([token, id]) => {
      idToToken.set(id, token);
    });

    // 특수 토큰 인덱스 확인
    const padToken = vocab["[PAD]"] || 1204;
    const unkToken = vocab["[UNK]"] || 1203;
    const blankToken = vocab["|"] || 859;

    console.log("[VocabLoader] 📌 특수 토큰 인덱스:");
    console.log(`  - [PAD]: ${padToken}`);
    console.log(`  - [UNK]: ${unkToken}`);
    console.log(`  - | (공백): ${blankToken}`);

    return {
      vocab,
      idToToken,
      padToken,
      unkToken,
      blankToken,
      vocabSize: Object.keys(vocab).length,
    };
  } catch (error) {
    console.error("[VocabLoader] ❌ Vocab 로딩 실패:", error);
    throw new Error(
      `Vocab 로딩 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}
