const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLauncherManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // 1. Ensure permissions: QUERY_ALL_PACKAGES and BIND_APPWIDGET
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    const permissions = androidManifest.manifest['uses-permission'];
    const permissionsToAdd = [
      'android.permission.QUERY_ALL_PACKAGES',
      'android.permission.BIND_APPWIDGET',
    ];
    for (const perm of permissionsToAdd) {
      if (!permissions.some((p) => p.$?.['android:name'] === perm)) {
        permissions.push({ $: { 'android:name': perm } });
      }
    }

    // 2. Ensure uses-feature for Leanback
    if (!androidManifest.manifest['uses-feature']) {
      androidManifest.manifest['uses-feature'] = [];
    }
    const features = androidManifest.manifest['uses-feature'];
    if (!features.some((f) => f.$?.['android:name'] === 'android.software.leanback')) {
      features.push({
        $: {
          'android:name': 'android.software.leanback',
          'android:required': 'false',
        },
      });
    }

    // 3. Inject HOME, DEFAULT, and LEANBACK_LAUNCHER intent filters into MainActivity
    const application = androidManifest.manifest.application?.[0];
    if (application && application.activity) {
      const mainActivity = application.activity.find(
        (act) => act.$?.['android:name'] === '.MainActivity'
      );

      if (mainActivity) {
        if (!mainActivity['intent-filter']) {
          mainActivity['intent-filter'] = [];
        }

        // Check if HOME category intent filter already exists
        const hasHomeFilter = mainActivity['intent-filter'].some((filter) =>
          filter.category?.some(
            (cat) => cat.$?.['android:name'] === 'android.intent.category.HOME'
          )
        );

        if (!hasHomeFilter) {
          mainActivity['intent-filter'].push({
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [
              { $: { 'android:name': 'android.intent.category.HOME' } },
              { $: { 'android:name': 'android.intent.category.DEFAULT' } },
              { $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } },
            ],
          });
        }
      }
    }

    return config;
  });
};
