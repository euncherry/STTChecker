// utils/stt/inference.ts
import { Tensor } from "onnxruntime-react-native";
import type { VocabInfo } from "../onnx/vocabLoader";

export async function runSTTInference(
  session: any,
  audioData: Float32Array,
  vocabInfo: VocabInfo,
  inputName: string,
  outputName: string
): Promise<string> {
  console.log("==========================================");
  console.log("[STT Inference] 🎯 추론 시작...");
  console.log(`[STT Inference] 입력 크기: ${audioData.length} samples`);
  console.log(`[STT Inference] Input name: ${inputName}`);
  console.log(`[STT Inference] Output name: ${outputName}`);

  try {
    // 1. Tensor 생성
    // ⚠️ IMPORTANT: 항상 float32를 사용해야 합니다!
    // Float16으로 양자화된 모델이더라도, ONNX Runtime React Native는
    // float16 텐서 생성을 지원하지 않습니다. float32로 입력하면
    // 런타임이 자동으로 모델의 입력 타입(float16)으로 변환합니다.
    const shape = [1, audioData.length];
    const tensorType = "float32"; // ✅ 절대 변경하지 마세요!
    const inputTensor = new Tensor(tensorType, audioData, shape);

    console.log("[STT Inference] 📊 Tensor 생성 완료");
    console.log(`  - Type: ${tensorType} (모델 타입과 무관하게 항상 float32)`);
    console.log(`  - Shape: [${shape.join(", ")}]`);
    console.log(`  - 데이터 길이: ${audioData.length}`);

    // 2. 추론 실행
    console.log("[STT Inference] 🔄 모델 실행 중...");
    const startTime = Date.now();

    const results = await session.run({
      [inputName]: inputTensor,
    });

    const inferenceTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[STT Inference] ✅ 추론 완료 (${inferenceTime}초)`);

    // 3. 결과 추출
    const logits = results[outputName];

    console.log("[STT Inference] 📊 Logits 정보:");
    console.log(`  - Shape: [${logits.dims.join(", ")}]`);
    console.log(`  - 데이터 타입: ${logits.type}`);
    console.log(`  - 데이터 길이: ${logits.data.length}`);

    // Logits 통계
    const logitsStats = getLogitsStats(logits.data);
    console.log("[STT Inference] 📊 Logits 통계:");
    console.log(`  - 최소값: ${logitsStats.min.toFixed(4)}`);
    console.log(`  - 최대값: ${logitsStats.max.toFixed(4)}`);
    console.log(`  - 평균값: ${logitsStats.mean.toFixed(4)}`);

    // 처음 몇 개의 logits 출력
    console.log("[STT Inference] 📊 Logits 샘플 (처음 10개):");
    console.log(
      Array.from(logits.data.slice(0, 10) as Float32Array)
        .map((v: number) => v.toFixed(4))
        .join(", ")
    );

    // 4. 디코딩
    console.log("[STT Inference] 🔤 디코딩 시작...");
    const transcription = decodeLogits(logits, vocabInfo);

    console.log(`[STT Inference] ✅ 최종 결과: "${transcription}"`);
    console.log("==========================================");

    return transcription;
  } catch (error) {
    console.error("[STT Inference] ❌ 추론 실패:", error);
    console.error("==========================================");
    throw error;
  }
}

function getLogitsStats(data: Float32Array) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }

  return {
    min,
    max,
    mean: sum / data.length,
  };
}

function decodeLogits(logits: any, vocabInfo: VocabInfo): string {
  const { idToToken, blankToken, padToken } = vocabInfo;

  const dims = logits.dims;
  console.log(`[CTC Decoder] 📊 Logits shape: [${dims.join(", ")}]`);

  const batchSize = dims[0];
  const timeSteps = dims[1];
  const vocabSize = dims[2];

  console.log(
    `[CTC Decoder] Batch: ${batchSize}, Time: ${timeSteps}, Vocab: ${vocabSize}`
  );
  console.log(
    `[CTC Decoder] Blank/Space token ID: ${blankToken} ("${idToToken.get(
      blankToken
    )}")`
  );
  console.log(`[CTC Decoder] PAD token ID: ${padToken}`);

  const logitsData = logits.data;
  const tokens: string[] = []; // ✅ 문자열 배열로 변경
  let prevToken = -1;

  // ✅ 토큰 히스토그램 (어떤 토큰이 얼마나 자주 나오는지)
  const tokenCounts: { [key: number]: number } = {};

  // Greedy decoding
  for (let t = 0; t < timeSteps; t++) {
    let maxProb = -Infinity;
    let maxIndex = 0;

    // 각 타임스텝에서 가장 높은 확률의 토큰 찾기
    for (let v = 0; v < vocabSize; v++) {
      const idx = t * vocabSize + v;
      const prob = logitsData[idx];

      if (prob > maxProb) {
        maxProb = prob;
        maxIndex = v;
      }
    }

    // ✅ 토큰 카운트
    tokenCounts[maxIndex] = (tokenCounts[maxIndex] || 0) + 1;

    if (t < 10) {
      console.log(
        `[CTC Decoder] @${t}: Token ${maxIndex} "${
          idToToken.get(maxIndex) || "[UNK]"
        }" ` + `(prob: ${maxProb.toFixed(4)})`
      );
    }

    // ✅ Python과 동일한 디코딩 로직
    // 1. PAD와 UNK는 건너뛰기
    if (maxIndex === padToken) {
      prevToken = maxIndex;
      continue;
    }

    // 2. 중복 토큰 제거 (CTC)
    if (maxIndex === prevToken) {
      continue;
    }

    const tokenText = idToToken.get(maxIndex);

    // 3. 토큰 처리
    if (tokenText && tokenText !== "[PAD]" && tokenText !== "[UNK]") {
      if (tokenText === "|") {
        // ✅ Blank(공백) 토큰은 공백으로
        tokens.push(" ");
        console.log(`[CTC Decoder] ✅ 공백 추가 @${t}`);
      } else {
        // ✅ 일반 토큰
        tokens.push(tokenText);
        console.log(`[CTC Decoder] ✅ 토큰 추가 @${t}: "${tokenText}"`);
      }
    }

    prevToken = maxIndex;
  }

  // ✅ 토큰 분포 출력
  console.log("[CTC Decoder] 📊 토큰 분포 (Top 10):");
  const sortedTokens = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedTokens.forEach(([tokenId, count]) => {
    const id = parseInt(tokenId);
    const percentage = ((count / timeSteps) * 100).toFixed(1);
    console.log(
      `  Token ${id} "${
        idToToken.get(id) || "[UNK]"
      }": ${count}회 (${percentage}%)`
    );
  });

  console.log(`[CTC Decoder] 📊 디코딩된 토큰 수: ${tokens.length}개`);

  if (tokens.length === 0) {
    console.warn("[CTC Decoder] ⚠️ 디코딩된 토큰이 없습니다!");
    console.warn("[CTC Decoder] 💡 가능한 원인:");
    console.warn("  1. 모든 타임스텝이 blank 토큰");
    console.warn("  2. 음성이 너무 작거나 무음");
    console.warn("  3. 모델이 입력을 인식하지 못함");
    return ""; // 빈 문자열 반환 (metrics.ts에서 예외 처리)
  }

  console.log(`[CTC Decoder] 📊 토큰 리스트: [${tokens.join(", ")}]`);

  // ✅ 토큰 합치고 연속 공백 제거
  const text = tokens
    .join("")
    .replace(/\s+/g, " ") // 연속 공백을 하나로
    .trim();

  console.log(`[CTC Decoder] 📊 최종 텍스트: "${text}"`);

  return text;
}
