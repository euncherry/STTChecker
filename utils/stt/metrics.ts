// utils/stt/metrics.ts
import Levenshtein from "js-levenshtein";

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

  const refChars = reference.replace(/\s+/g, "");
  const hypChars = hypothesis.replace(/\s+/g, "");

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

  const refWords = reference.trim().split(/\s+/);

  // 인식 결과가 없는 경우 (빈 문자열) → WER 100%
  if (!hypothesis || hypothesis.trim().length === 0) {
    console.log(
      `[WER] Reference: "${refWords.join(" ")}" (${refWords.length}단어)`
    );
    console.log(`[WER] Hypothesis: (빈 문자열) - 인식 결과 없음`);
    console.log(`[WER] ⚠️ 인식 결과 없음 → Normalized WER: 100%`);
    return 1.0;
  }

  const hypWords = hypothesis.trim().split(/\s+/);

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
