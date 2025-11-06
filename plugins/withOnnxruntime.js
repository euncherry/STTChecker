// plugins/withOnnxruntime.js
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
