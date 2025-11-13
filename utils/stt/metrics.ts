// utils/stt/metrics.ts
import Levenshtein from "js-levenshtein";

/**
 * Character Error Rate (CER) 계산
 * 문자 단위 오류율
 */
export function calculateCER(reference: string, hypothesis: string): number {
  if (!reference || reference.length === 0) return 0;

  // 공백 제거하여 순수 문자만 비교
  const refChars = reference.replace(/\s+/g, "");
  const hypChars = hypothesis.replace(/\s+/g, "");

  const distance = Levenshtein(refChars, hypChars);
  const cer = distance / refChars.length;

  console.log(`[CER] Reference: "${refChars}" (${refChars.length}자)`);
  console.log(`[CER] Hypothesis: "${hypChars}" (${hypChars.length}자)`);
  console.log(`[CER] Distance: ${distance}, CER: ${(cer * 100).toFixed(1)}%`);

  return Math.min(cer, 1.0); // 최대 100%
}

/**
 * Word Error Rate (WER) 계산
 * 단어 단위 오류율
 */
export function calculateWER(reference: string, hypothesis: string): number {
  if (!reference || reference.trim().length === 0) return 0;

  // 한국어 단어 분리 (공백 기준)
  const refWords = reference.trim().split(/\s+/);
  const hypWords = hypothesis.trim().split(/\s+/);

  const distance = Levenshtein(refWords.join(" "), hypWords.join(" "));
  const wer = distance / refWords.length;

  console.log(
    `[WER] Reference: "${refWords.join(" ")}" (${refWords.length}단어)`
  );
  console.log(
    `[WER] Hypothesis: "${hypWords.join(" ")}" (${hypWords.length}단어)`
  );
  console.log(`[WER] Distance: ${distance}, WER: ${(wer * 100).toFixed(1)}%`);

  return Math.min(wer, 1.0); // 최대 100%
}
