// plugins/withOnnxruntime.js
// Android MainApplication에 ONNX Runtime 패키지를 자동으로 등록하는 Expo 플러그인
const { withMainApplication } = require("@expo/config-plugins");

module.exports = function withOnnxruntime(config) {
  return withMainApplication(config, (config) => {
    const { modResults } = config;

    // import 추가
    if (
      !modResults.contents.includes(
        "import ai.onnxruntime.reactnative.OnnxruntimePackage"
      )
    ) {
      modResults.contents = modResults.contents.replace(
        /import expo\.modules\.ReactNativeHostWrapper/,
        `import expo.modules.ReactNativeHostWrapper\nimport ai.onnxruntime.reactnative.OnnxruntimePackage`
      );
    }

    // 패키지 추가
    if (!modResults.contents.includes("add(OnnxruntimePackage())")) {
      modResults.contents = modResults.contents.replace(
        /packages\.apply \{/,
        `packages.apply {\n              add(OnnxruntimePackage())`
      );
    }

    return config;
  });
};
