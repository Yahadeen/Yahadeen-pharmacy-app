module.exports = function (api) {
  api.cache(true);
  // `babel-preset-expo` already wires react-native-worklets / reanimated for
  // SDK 57, so no extra plugin entries are needed here.
  return {
    presets: ['babel-preset-expo'],
  };
};
