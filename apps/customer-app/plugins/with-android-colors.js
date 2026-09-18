const { withAndroidColors } = require('@expo/config-plugins');

function upsertColor(colors, name, value) {
  const existing = colors.find((item) => item?.$?.name === name);
  if (existing) {
    existing._ = value;
    return;
  }
  colors.push({ $: { name }, _: value });
}

module.exports = function withAndroidColorsForYahadeen(config) {
  return withAndroidColors(config, (config) => {
    const resources = config.modResults.resources ?? {};
    resources.color = resources.color ?? [];
    upsertColor(resources.color, 'iconBackground', '#FFFFFF');
    upsertColor(resources.color, 'colorPrimary', '#0036B6');
    upsertColor(resources.color, 'notification_icon_color', '#0036B6');
    config.modResults.resources = resources;
    return config;
  });
};
