const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNativeWidgetHost(config) {
  // 1. Copy native Kotlin files into android/app/src/main/java/com/tvlauncher/widgethost/
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const srcDir = path.join(config.modRequest.projectRoot, 'plugins', 'widgethost');
      const targetDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'tvlauncher',
        'widgethost'
      );

      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          if (file.endsWith('.kt')) {
            fs.copyFileSync(path.join(srcDir, file), path.join(targetDir, file));
          }
        }
      }
      return config;
    },
  ]);

  // 2. Inject AppWidgetHostPackage into MainApplication.kt
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('AppWidgetHostPackage')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(com.tvlauncher.widgethost.AppWidgetHostPackage())'
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};
