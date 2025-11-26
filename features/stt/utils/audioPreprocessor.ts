// utils/stt/audioPreprocessor.ts
import { File } from "expo-file-system";

export async function preprocessAudioFile(
  fileUri: string
): Promise<Float32Array> {
  console.log("==========================================");
  console.log("[AudioPreprocessor] 📥 파일 읽기:", fileUri);

  try {
    const file = new File(fileUri);
    const arrayBuffer = await file.arrayBuffer();

    console.log(
      `[AudioPreprocessor] 📊 파일 크기: ${(
        arrayBuffer.byteLength / 1024
      ).toFixed(2)}KB`
    );

    // 1. WAV 파일 파싱
    const audioData = parseWAVFile(arrayBuffer);

    const stats = getAudioStats(audioData);
    console.log("[AudioPreprocessor] 📊 RAW 오디오 통계:");
    console.log(`  - 샘플 수: ${audioData.length}`);
    console.log(`  - 최소값: ${stats.min.toFixed(6)}`);
    console.log(`  - 최대값: ${stats.max.toFixed(6)}`);
    console.log(`  - 평균값: ${stats.mean.toFixed(6)}`);
    console.log(`  - RMS: ${stats.rms.toFixed(6)}`);

    // 2. ✅ Wav2Vec2 스타일 전처리 (중요!)
    console.log("[AudioPreprocessor] 🔄 Wav2Vec2 전처리 적용 중...");
    const processed = wav2vec2Preprocess(audioData);

    const processedStats = getAudioStats(processed);
    console.log("[AudioPreprocessor] 📊 전처리 후 통계:");
    console.log(`  - 최소값: ${processedStats.min.toFixed(6)}`);
    console.log(`  - 최대값: ${processedStats.max.toFixed(6)}`);
    console.log(`  - 평균값: ${processedStats.mean.toFixed(6)}`);
    console.log(`  - RMS: ${processedStats.rms.toFixed(6)}`);

    console.log("[AudioPreprocessor] ✅ 전처리 완료");
    console.log("==========================================");

    return processed;
  } catch (error) {
    console.error("[AudioPreprocessor] ❌ 전처리 실패:", error);
    throw error;
  }
}

/**
 * ✅ Wav2Vec2 스타일 전처리
 * HuggingFace transformers의 Wav2Vec2FeatureExtractor와 동일한 방식
 */
function wav2vec2Preprocess(audio: Float32Array): Float32Array {
  // 1. Mean 제거 (zero-centering)
  let sum = 0;
  for (let i = 0; i < audio.length; i++) {
    sum += audio[i];
  }
  const mean = sum / audio.length;

  const centered = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i++) {
    centered[i] = audio[i] - mean;
  }

  // 2. Variance 계산
  let sumSquares = 0;
  for (let i = 0; i < centered.length; i++) {
    sumSquares += centered[i] * centered[i];
  }
  const variance = sumSquares / centered.length;

  // ✅ 중요: epsilon 추가! (Python transformers와 동일)
  const epsilon = 1e-7;
  const std = Math.sqrt(variance + epsilon);

  console.log(`[Wav2Vec2Preprocess] 📊 통계:`);
  console.log(`  - 원본 mean: ${mean.toFixed(6)}`);
  console.log(`  - 원본 variance: ${variance.toFixed(6)}`);
  console.log(`  - 원본 std (with epsilon): ${std.toFixed(6)}`);

  // 3. 표준화 (Standardization)
  const normalized = new Float32Array(centered.length);
  for (let i = 0; i < centered.length; i++) {
    normalized[i] = centered[i] / std;
  }

  // 검증
  const normalizedMean = getMean(normalized);
  const normalizedStd = getStd(normalized);

  console.log(`  - 정규화 후 mean: ${normalizedMean.toFixed(6)} (≈0)`);
  console.log(`  - 정규화 후 std: ${normalizedStd.toFixed(6)} (≈1)`);

  // ✅ 추가 검증: NaN이나 Infinity 체크
  for (let i = 0; i < normalized.length; i++) {
    if (!isFinite(normalized[i])) {
      console.error(
        `[Wav2Vec2Preprocess] ❌ Invalid value at index ${i}: ${normalized[i]}`
      );
      throw new Error("정규화 중 잘못된 값 발견");
    }
  }

  return normalized;
}

function getMean(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length;
}

function getStd(data: Float32Array): number {
  const mean = getMean(data);
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    const diff = data[i] - mean;
    sumSquares += diff * diff;
  }
  // ✅ 여기도 epsilon 추가
  const epsilon = 1e-7;
  return Math.sqrt(sumSquares / data.length + epsilon);
}

function getAudioStats(audio: Float32Array) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < audio.length; i++) {
    const val = audio[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
    sumSquares += val * val;
  }

  const mean = sum / audio.length;
  const variance = sumSquares / audio.length - mean * mean;

  return {
    min,
    max,
    mean,
    variance,
    rms: Math.sqrt(sumSquares / audio.length),
  };
}

function parseWAVFile(arrayBuffer: ArrayBuffer): Float32Array {
  const view = new DataView(arrayBuffer);

  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  console.log(`[WAV Parser] 🔍 헤더 확인: ${riff}`);

  if (riff !== "RIFF") {
    throw new Error("유효하지 않은 WAV 파일입니다 (RIFF 헤더 없음)");
  }

  const numChannels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);

  console.log(`[WAV Parser] 📊 WAV 정보:`);
  console.log(
    `  - 채널: ${numChannels} ${numChannels === 1 ? "✅ (모노)" : "⚠️ (스테레오/멀티채널 - 모노로 변환 필요)"}`
  );
  console.log(
    `  - 샘플레이트: ${sampleRate}Hz ${sampleRate === 16000 ? "✅ (16kHz)" : "⚠️ (16kHz로 리샘플링 필요)"}`
  );
  console.log(
    `  - 비트 깊이: ${bitsPerSample}bit ${bitsPerSample === 16 ? "✅ (16-bit PCM)" : bitsPerSample === 32 ? "✅ (32-bit PCM)" : "⚠️"}`
  );

  if (sampleRate !== 16000) {
    console.warn(
      `[WAV Parser] ⚠️ 샘플레이트가 16kHz가 아닙니다! (${sampleRate}Hz) → 리샘플링 수행`
    );
  }

  if (numChannels !== 1) {
    console.warn(
      `[WAV Parser] ⚠️ 모노 채널이 아닙니다! (${numChannels}채널) → 모노로 변환 수행`
    );
  }

  let dataOffset = 36;
  while (dataOffset < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(dataOffset),
      view.getUint8(dataOffset + 1),
      view.getUint8(dataOffset + 2),
      view.getUint8(dataOffset + 3)
    );

    if (chunkId === "data") {
      console.log(`[WAV Parser] ✅ 데이터 청크 발견: offset ${dataOffset}`);
      break;
    }

    const chunkSize = view.getUint32(dataOffset + 4, true);
    dataOffset += 8 + chunkSize;
  }

  const dataSize = view.getUint32(dataOffset + 4, true);
  const dataStart = dataOffset + 8;

  console.log(`[WAV Parser] 📊 데이터 크기: ${dataSize} bytes`);

  const samplesPerChannel = dataSize / (numChannels * (bitsPerSample / 8));
  const samples = new Float32Array(samplesPerChannel);

  console.log(`[WAV Parser] 📊 샘플 수: ${samplesPerChannel}`);

  console.log(`[WAV Parser] 🔄 전처리 시작:`);
  console.log(
    `  1️⃣ Float32 정규화: ${bitsPerSample}-bit PCM → Float32 [-1.0, 1.0]`
  );
  if (numChannels > 1) {
    console.log(`  2️⃣ 모노 채널 변환: ${numChannels}채널 → 1채널 (평균화)`);
  }

  if (bitsPerSample === 16) {
    // ✅ 16-bit PCM → Float32 정규화
    for (let i = 0; i < samplesPerChannel; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const offset = dataStart + (i * numChannels + ch) * 2;
        const sample = view.getInt16(offset, true);
        // ✅ Int16 (-32768 ~ 32767) → Float32 (-1.0 ~ 1.0)
        sum += sample / 32768.0;
      }
      // ✅ 채널 평균화 (스테레오 → 모노)
      samples[i] = sum / numChannels;
    }
    console.log(`[WAV Parser] ✅ Float32 정규화 완료 (16-bit PCM)`);
  } else if (bitsPerSample === 32) {
    // ✅ 32-bit PCM → Float32 정규화
    for (let i = 0; i < samplesPerChannel; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const offset = dataStart + (i * numChannels + ch) * 4;
        const sample = view.getInt32(offset, true);
        // ✅ Int32 → Float32
        sum += sample / 2147483648.0;
      }
      // ✅ 채널 평균화 (스테레오 → 모노)
      samples[i] = sum / numChannels;
    }
    console.log(`[WAV Parser] ✅ Float32 정규화 완료 (32-bit PCM)`);
  } else {
    throw new Error(`지원하지 않는 비트 깊이: ${bitsPerSample}bit`);
  }

  if (numChannels > 1) {
    console.log(`[WAV Parser] ✅ 모노 채널 변환 완료`);
  }

  if (sampleRate !== 16000) {
    console.log(`[WAV Parser] 🔄 리샘플링: ${sampleRate}Hz → 16000Hz`);
    const resampled = resample(samples, sampleRate, 16000);
    console.log(
      `[WAV Parser] ✅ 리샘플링 완료: ${samples.length} → ${resampled.length} 샘플`
    );
    return resampled;
  }

  console.log(`[WAV Parser] ✅ 모든 전처리 완료 (16kHz, 모노, Float32)`);
  return samples;
}

function resample(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  const ratio = inputRate / outputRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  console.log(`[Resampler] 입력: ${input.length} → 출력: ${outputLength}`);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const t = srcIndex - srcIndexFloor;

    if (srcIndexFloor + 1 < input.length) {
      output[i] = input[srcIndexFloor] * (1 - t) + input[srcIndexFloor + 1] * t;
    } else {
      output[i] = input[srcIndexFloor];
    }
  }

  return output;
}
