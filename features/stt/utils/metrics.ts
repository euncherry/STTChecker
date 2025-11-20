// utils/stt/metrics.ts
import Levenshtein from "js-levenshtein";

/**
 * Character Error Rate (CER) 계산
 * 문자 단위 오류율
 */
export function calculateCER(reference: string, hypothesis: string): number {
  if (!reference) return 0;

  const refChars = reference.replace(/\s+/g, "");
  const hypChars = hypothesis.replace(/\s+/g, "");

  if (refChars.length === 0) return 0;

  const distance = Levenshtein(hypChars, refChars);
  const cer = distance / refChars.length;

  console.log(`[CER] Reference: "${refChars}" (${refChars.length}자)`);
  console.log(`[CER] Hypothesis: "${hypChars}" (${hypChars.length}자)`);
  console.log(`[CER] Distance: ${distance}, CER: ${(cer * 100).toFixed(1)}%`);

  return cer;
}

/**
 * Word Error Rate (WER) 계산
 * 단어 단위 오류율
 */
export function calculateWER(reference: string, hypothesis: string): number {
  if (!reference || reference.trim().length === 0) return 0;

  const refWords = reference.trim().split(/\s+/);
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
  const wer = distance / n;

  console.log(
    `[WER] Reference: "${refWords.join(" ")}" (${refWords.length}단어)`
  );
  console.log(
    `[WER] Hypothesis: "${hypWords.join(" ")}" (${hypWords.length}단어)`
  );
  console.log(`[WER] Distance: ${distance}, WER: ${(wer * 100).toFixed(1)}%`);

  return wer;
}
