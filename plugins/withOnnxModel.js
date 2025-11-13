// plugins/withOnnxModel.js
// ONNX 모델 파일을 Android assets에 복사하고 압축 방지 설정을 추가하는 Expo 플러그인
const {
  withDangerousMod,
  withAppBuildGradle,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * ONNX 모델을 Android assets에 복사하고 build.gradle 설정
 */
const withOnnxModel = (config) => {
  // 1. Android assets에 모델 파일 복사
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const modelSourcePath = path.join(
        projectRoot,
        "assets",
        "model",
        "wav2vec2_korean_final.onnx"
      );
      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets",
        "model"
      );
      const modelDestPath = path.join(assetsDir, "wav2vec2_korean_final.onnx");

      // assets/model 디렉토리 생성
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
        console.log("✅ Created directory:", assetsDir);
      }

      // 파일 복사 (소스 파일이 있으면)
      if (fs.existsSync(modelSourcePath)) {
        console.log("📥 Copying ONNX model to Android assets...");
        fs.copyFileSync(modelSourcePath, modelDestPath);

        const stats = fs.statSync(modelDestPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Model copied successfully! Size: ${sizeMB}MB`);
      } else {
        console.warn("⚠️ ONNX model not found at:", modelSourcePath);
      }

      return config;
    },
  ]);

  // 2. build.gradle에 aaptOptions 추가
  config = withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    let buildGradleContent = modResults.contents;

    // aaptOptions가 이미 있는지 확인
    if (!buildGradleContent.includes("aaptOptions")) {
      // android { } 블록 안에 추가
      buildGradleContent = buildGradleContent.replace(
        /android\s*{/,
        `android {
    aaptOptions {
        // ONNX 모델 파일 압축 방지
        noCompress "onnx"
    }
`
      );

      modResults.contents = buildGradleContent;
      console.log("✅ Added aaptOptions to build.gradle");
    } else {
      console.log("✅ aaptOptions already exists in build.gradle");
    }

    return config;
  });

  return config;
};

module.exports = withOnnxModel;
