// plugins/withOnnxModel.js
// ONNX 모델 파일을 Android/iOS에 복사하고 필요한 설정을 추가하는 Expo 플러그인
const {
  withDangerousMod,
  withAppBuildGradle,
  withXcodeProject,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * ONNX 모델을 Android assets 및 iOS 번들에 복사
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

  // 3. iOS: 모델 파일을 번들 리소스에 복사
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const modelSourcePath = path.join(
        projectRoot,
        "assets",
        "model",
        "wav2vec2_korean_final.onnx"
      );
      const vocabSourcePath = path.join(
        projectRoot,
        "assets",
        "model",
        "vocab.json"
      );

      // iOS 프로젝트의 리소스 디렉토리
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const resourcesDir = path.join(iosProjectRoot, "STTChecker", "Resources", "model");

      // Resources/model 디렉토리 생성
      if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
        console.log("✅ [iOS] Created directory:", resourcesDir);
      }

      // ONNX 모델 파일 복사
      if (fs.existsSync(modelSourcePath)) {
        const modelDestPath = path.join(resourcesDir, "wav2vec2_korean_final.onnx");
        console.log("📥 [iOS] Copying ONNX model to iOS bundle...");
        fs.copyFileSync(modelSourcePath, modelDestPath);

        const stats = fs.statSync(modelDestPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ [iOS] Model copied successfully! Size: ${sizeMB}MB`);
      } else {
        console.warn("⚠️ [iOS] ONNX model not found at:", modelSourcePath);
      }

      // vocab.json 복사
      if (fs.existsSync(vocabSourcePath)) {
        const vocabDestPath = path.join(resourcesDir, "vocab.json");
        fs.copyFileSync(vocabSourcePath, vocabDestPath);
        console.log("✅ [iOS] vocab.json copied successfully!");
      }

      return config;
    },
  ]);

  // 4. iOS: Xcode 프로젝트에 리소스 폴더 추가
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Resources/model 폴더를 리소스로 추가
    const modelGroupName = "Resources/model";

    // 이미 추가되어 있는지 확인
    const existingGroup = xcodeProject.pbxGroupByName(modelGroupName);
    if (!existingGroup) {
      console.log("✅ [iOS] Adding model resources to Xcode project");

      // 파일들을 리소스로 추가
      const modelFiles = [
        "wav2vec2_korean_final.onnx",
        "vocab.json"
      ];

      modelFiles.forEach((fileName) => {
        const filePath = `STTChecker/Resources/model/${fileName}`;
        try {
          xcodeProject.addResourceFile(filePath, { target: xcodeProject.getFirstTarget().uuid });
          console.log(`✅ [iOS] Added ${fileName} to Xcode resources`);
        } catch (e) {
          // 이미 추가되어 있을 수 있음
          console.log(`ℹ️ [iOS] ${fileName} may already be in project`);
        }
      });
    } else {
      console.log("✅ [iOS] Model resources already in Xcode project");
    }

    return config;
  });

  return config;
};

module.exports = withOnnxModel;
