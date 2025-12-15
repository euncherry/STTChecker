// utils/stt/metrics.ts
import Levenshtein from "js-levenshtein";

/**
 * 텍스트 전처리: 구두점 및 특수문자 제거
 * CER/WER 계산 전에 호출하여 공정한 비교를 위해 사용
 */
function normalizeText(text: string): string {
  return text
    // 구두점 및 특수문자 제거
    .replace(/[.,!?;:'""`~@#$%^&*()[\]{}<>\/\\|_+=\-—–…·•°]+/g, "")
    // 연속된 공백을 하나로
    .replace(/\s+/g, " ")
    // 앞뒤 공백 제거
    .trim();
}

/**
 * Normalized Character Error Rate (CER) 계산
 * 문자 단위 오류율 (0% ~ 100% 범위로 정규화)
 *
 * 공식: Normalized CER = (S + D + I) / (S + D + I + C)
 *       = distance / max(len(ref), len(hyp))
 *
 * - S: Substitutions (치환)
 * - D: Deletions (삭제)
 * - I: Insertions (삽입)
 * - C: Correct (올바른 문자)
 */
export function calculateCER(reference: string, hypothesis: string): number {
  if (!reference) return 0;

  // 전처리: 구두점 제거 후 공백 제거
  const refChars = normalizeText(reference).replace(/\s+/g, "");
  const hypChars = normalizeText(hypothesis).replace(/\s+/g, "");

  if (refChars.length === 0) return 0;

  // 인식 결과가 없는 경우 (빈 문자열) → CER 100%
  if (hypChars.length === 0) {
    console.log(`[CER] Reference: "${refChars}" (${refChars.length}자)`);
    console.log(`[CER] Hypothesis: (빈 문자열) - 인식 결과 없음`);
    console.log(`[CER] ⚠️ 인식 결과 없음 → Normalized CER: 100%`);
    return 1.0;
  }

  const distance = Levenshtein(hypChars, refChars);

  // Normalized CER: 항상 0~1 범위 보장
  // (S+D+I) / (S+D+I+C) = distance / max(len(ref), len(hyp))
  const maxLen = Math.max(refChars.length, hypChars.length);
  const normalizedCer = distance / maxLen;

  console.log(`[CER] Reference: "${refChars}" (${refChars.length}자)`);
  console.log(`[CER] Hypothesis: "${hypChars}" (${hypChars.length}자)`);
  console.log(`[CER] Distance: ${distance}, Max Length: ${maxLen}`);
  console.log(`[CER] Normalized CER: ${(normalizedCer * 100).toFixed(1)}%`);

  return normalizedCer;
}

/**
 * Normalized Word Error Rate (WER) 계산
 * 단어 단위 오류율 (0% ~ 100% 범위로 정규화)
 *
 * 공식: Normalized WER = (S + D + I) / (S + D + I + C)
 *       = distance / max(len(ref), len(hyp))
 *
 * - S: Substitutions (치환)
 * - D: Deletions (삭제)
 * - I: Insertions (삽입)
 * - C: Correct (올바른 단어)
 */
export function calculateWER(reference: string, hypothesis: string): number {
  if (!reference || reference.trim().length === 0) return 0;

  // 전처리: 구두점 제거 후 단어 분리
  const normalizedRef = normalizeText(reference);
  const normalizedHyp = normalizeText(hypothesis);

  if (normalizedRef.length === 0) return 0;

  const refWords = normalizedRef.split(/\s+/);

  // 인식 결과가 없는 경우 (빈 문자열) → WER 100%
  if (normalizedHyp.length === 0) {
    console.log(
      `[WER] Reference: "${refWords.join(" ")}" (${refWords.length}단어)`
    );
    console.log(`[WER] Hypothesis: (빈 문자열) - 인식 결과 없음`);
    console.log(`[WER] ⚠️ 인식 결과 없음 → Normalized WER: 100%`);
    return 1.0;
  }

  const hypWords = normalizedHyp.split(/\s+/);

  const n = refWords.length;
  const m = hypWords.length;

  if (n === 0) return 0;

  // DP 테이블 초기화
  const d: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );

  for (let i = 0; i <= n; i++) {
    d[i][0] = i;
  }
  for (let j = 0; j <= m; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (refWords[i - 1] === hypWords[j - 1]) {
        d[i][j] = d[i - 1][j - 1];
      } else {
        d[i][j] = Math.min(
          d[i - 1][j] + 1, // 삭제
          d[i][j - 1] + 1, // 삽입
          d[i - 1][j - 1] + 1 // 치환
        );
      }
    }
  }

  const distance = d[n][m];

  // Normalized WER: 항상 0~1 범위 보장
  // (S+D+I) / (S+D+I+C) = distance / max(len(ref), len(hyp))
  const maxLen = Math.max(n, m);
  const normalizedWer = distance / maxLen;

  console.log(
    `[WER] Reference: "${refWords.join(" ")}" (${refWords.length}단어)`
  );
  console.log(
    `[WER] Hypothesis: "${hypWords.join(" ")}" (${hypWords.length}단어)`
  );
  console.log(`[WER] Distance: ${distance}, Max Length: ${maxLen}`);
  console.log(`[WER] Normalized WER: ${(normalizedWer * 100).toFixed(1)}%`);

  return normalizedWer;
}

/**
 * 최종 점수 계산 파라미터
 */
export interface FinalScoreParams {
  // 발음 점수 (ONNX CER)
  tau?: number; // 데드존 (기본값: 0.05)
  alpha?: number; // 민감도 (기본값: 3.0)
  gamma?: number; // 곡선 형태 (기본값: 0.9)
  // 의미 전달 점수 (NLP WER)
  tauW?: number; // 데드존 (기본값: 0.10)
  beta?: number; // 민감도 (기본값: 1.5)
  delta?: number; // 곡선 형태 (기본값: 1.0)
  // 심각도 패널티 (NLP CER)
  tauP?: number; // 데드존 (기본값: 0.08)
  lambda?: number; // 민감도 (기본값: 2.5)
  epsilon?: number; // 곡선 형태 (기본값: 1.0)
  // 가중치
  w1?: number; // 발음 비중 (기본값: 0.60)
  w2?: number; // 의미 비중 (기본값: 0.25)
  w3?: number; // 패널티 비중 (기본값: 0.15)
}

/**
 * 난이도 프리셋
 */
export const DIFFICULTY_PRESETS: Record<string, FinalScoreParams> = {
  easy: {
    alpha: 1.0,
    lambda: 1.5,
    w1: 0.5,
    w2: 0.35,
    w3: 0.15,
  },
  normal: {
    alpha: 1.5,
    lambda: 2.5,
    w1: 0.6,
    w2: 0.25,
    w3: 0.15,
  },
  hard: {
    alpha: 2.0,
    lambda: 4.0,
    w1: 0.55,
    w2: 0.2,
    w3: 0.25,
  },
};

/**
 * 최종 점수 계산 (NLP CER 패널티 포함) - 곱셈 방식 패널티
 *
 * 공식:
 * - 발음 점수: score_pronunciation = max(0, 1 - α * CER'_raw)^γ
 * - 의미 전달: score_semantic = max(0, 1 - β * WER'_nlp)^δ
 * - 심각도 패널티: penalty_severity = max(0, 1 - λ * CER'_nlp)^ε (곱셈 방식)
 * - 기본 점수: baseScore = (w1 × score_pronunciation + w2 × score_semantic) / (w1 + w2)
 * - 최종: FinalScore = 100 × baseScore × penalty_severity
 *
 * 심각도 패널티는 곱셈 방식으로 적용:
 * - 아예 틀린 경우 (penalty = 0) → 최종 점수 0점
 * - 정상적인 경우 (penalty ≈ 1) → 기본 점수 그대로
 *
 * @param onnxCer - ONNX 모델 기반 CER (발음 그대로, 0~1)
 * @param nlpCer - NLP STT 기반 CER (문맥 교정됨, 0~1)
 * @param nlpWer - NLP STT 기반 WER (문맥 교정됨, 0~1)
 * @param params - 파라미터 (옵션)
 * @returns 0~100 사이의 최종 점수
 */
export function calculateFinalScore(
  onnxCer: number,
  nlpCer: number,
  nlpWer: number,
  params: FinalScoreParams = {}
): number {
  // 기본값 설정
  const {
    // 발음 점수 파라미터
    tau = 0.05,
    alpha = 1.5,
    gamma = 0.9,
    // 의미 전달 점수 파라미터
    tauW = 0.1,
    beta = 1.5,
    delta = 1.0,
    // 심각도 패널티 파라미터
    tauP = 0.08,
    lambda = 2.5,
    epsilon = 1.0,
    // 가중치
    w1 = 0.6,
    w2 = 0.25,
    w3 = 0.15, // w3는 이제 사용되지 않지만 호환성을 위해 유지
  } = params;

  // Step 1: 발음 점수 (ONNX CER 기반)
  const cerRawPrime = Math.max(0, onnxCer - tau);
  const scorePronunciation = Math.pow(Math.max(0, 1 - alpha * cerRawPrime), gamma);

  // Step 2: 의미 전달 점수 (NLP WER 기반)
  const werNlpPrime = Math.max(0, nlpWer - tauW);
  const scoreSemantic = Math.pow(Math.max(0, 1 - beta * werNlpPrime), delta);

  // Step 3: 심각도 패널티 (NLP CER 기반) - 아예 틀렸을 때만 0점 처리용
  const cerNlpPrime = Math.max(0, nlpCer - tauP);
  const penaltySeverity = Math.pow(Math.max(0, 1 - lambda * cerNlpPrime), epsilon);

  // Step 4: 기본 점수 계산 (w1, w2 정규화)
  const totalWeight = w1 + w2;
  const baseScore =
    (w1 * scorePronunciation + w2 * scoreSemantic) / totalWeight;

  // Step 5: 최종 점수 (곱셈 방식 패널티 적용)
  // 아예 틀린 경우에만 0점 처리, 그 외에는 기본 점수 유지
  const finalScore = 100 * baseScore * penaltySeverity;

  console.log("========================================");
  console.log("[FinalScore] 🏆 최종 점수 계산");
  console.log(`  입력값:`);
  console.log(`    - ONNX CER: ${(onnxCer * 100).toFixed(1)}%`);
  console.log(`    - NLP CER: ${(nlpCer * 100).toFixed(1)}%`);
  console.log(`    - NLP WER: ${(nlpWer * 100).toFixed(1)}%`);
  console.log(`  중간 점수:`);
  console.log(`    - 발음 점수: ${(scorePronunciation * 100).toFixed(1)}%`);
  console.log(`    - 의미 전달: ${(scoreSemantic * 100).toFixed(1)}%`);
  console.log(`    - 기본 점수: ${(baseScore * 100).toFixed(1)}%`);
  console.log(`    - 심각도 패널티 (곱셈): ${(penaltySeverity * 100).toFixed(1)}%`);
  console.log(`  최종 점수: ${finalScore.toFixed(1)}점`);
  console.log("========================================");

  return Math.round(finalScore);
}
