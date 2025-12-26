const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = (async () => {
  const { withNativeWind } = await import("nativewind/metro");
  return withNativeWind(config, { input: "./global.css" });
})();
