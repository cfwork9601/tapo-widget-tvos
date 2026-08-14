const { withDangerousMod, withMainActivity, withMainApplication, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNativeWidgetHost(config) {
  // 1. Copy native Kotlin files into android/app/src/main/java/com/widgetlauncher/widgethost/
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
        'widgetlauncher',
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
        'PackageList(this).packages.apply {\n          add(com.widgetlauncher.widgethost.AppWidgetHostPackage())'
      );
      config.modResults.contents = contents;
    }

    return config;
  });

  // 3. Tie AppWidgetHost updates to the generated MainActivity lifecycle.
  config = withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('import com.widgetlauncher.widgethost.AppWidgetHostManager')) {
      contents = contents.replace(
        'import android.os.Bundle',
        'import android.os.Bundle\nimport com.widgetlauncher.widgethost.AppWidgetHostManager'
      );
    }

    if (!contents.includes('AppWidgetHostManager.startListening(this)')) {
      const lifecycleMethods = `
  override fun onResume() {
    super.onResume()
    AppWidgetHostManager.startListening(this)
  }

  override fun onPause() {
    AppWidgetHostManager.stopListening()
    super.onPause()
  }
`;
      contents = contents.replace(
        '\n  /**\n   * Returns the name of the main component registered from JavaScript.',
        `${lifecycleMethods}\n  /**\n   * Returns the name of the main component registered from JavaScript.`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  // 4. Inject androidx.tvprovider dependency into app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('androidx.tvprovider:tvprovider')) {
      contents = contents.replace(
        'dependencies {',
        "dependencies {\n    implementation 'androidx.tvprovider:tvprovider:1.0.0'"
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};
