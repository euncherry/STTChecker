// metro.config.js

const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// highlight-start
// ONNX 모델 파일을 에셋으로 포함시키기 위한 설정 추가
config.resolver.assetExts.push("onnx");
// highlight-end

module.exports = config;
