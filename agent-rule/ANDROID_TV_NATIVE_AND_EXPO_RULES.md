# Android TV Native Architecture & Expo Build Rules

This document details Android native bridge engineering, Leanback integration, system preview channels (`androidx.tvprovider`), Expo config plugins, and ADB management for TV OS applications.

---

## 1. Expo Bare Workflow & Config Plugins

### Golden Rule: Manifest Edits via Config Plugins Only
**Never modify `android/AndroidManifest.xml` or native build scripts by hand.** All native manifest modifications must be encapsulated in an Expo config plugin (e.g. `plugins/withLauncherManifest.js`) hooked into `app.json`.

### Essential Android TV Manifest Injections:
1. **Leanback Mode & Hardware Requirements**:
   ```javascript
   // Declare leanback feature (required=false allows compatibility across boxes)
   androidManifest['uses-feature'].push({
     $: {
       'android:name': 'android.software.leanback',
       'android:required': 'false',
     },
   });
   // Disable touchscreen requirement
   androidManifest['uses-feature'].push({
     $: {
       'android:name': 'android.hardware.touchscreen',
       'android:required': 'false',
     },
   });
   ```

2. **Launcher Role & Intent Filters**:
   ```javascript
   mainActivity['intent-filter'].push({
     action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
     category: [
       { $: { 'android:name': 'android.intent.category.LAUNCHER' } },
       { $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } },
       { $: { 'android:name': 'android.intent.category.HOME' } },
       { $: { 'android:name': 'android.intent.category.DEFAULT' } },
     ],
   });
   ```

3. **Package Visibility & Permissions (API 30+)**:
   - For launchers enumerating third-party apps/widgets: `QUERY_ALL_PACKAGES` and `<queries>`.
   - For native widget hosting: `android.permission.BIND_APPWIDGET`.

---

## 2. Android TV System Preview Channels (`androidx.tvprovider`)

Android TV / Google TV home screens display preview recommendation channels via `androidx.tvprovider.media.tv.TvContractCompat`.

### Architectural Directives:
- **Zero In-App UI Pollution**: Publish media cards, live camera snapshots, or recommended rows directly to the OS launcher channels rather than building duplicate in-app 16:9 rows.
- **Content Provider Snapshot Serving**: Implement a `ContentProvider` (e.g., `SnapshotContentProvider.kt`) to stream dynamic thumbnails/snapshots to the system launcher using cache-busting URI parameters:
  `content://com.yourpkg.snapshots/camera_1.jpg?t=1723700000`
- **Dynamic Program Updating**: Query and update existing preview programs using `TvContractCompat.PreviewPrograms` instead of duplicating channels on every refresh.
- 📖 *For complete Kotlin code samples and setup, see [**`SYSTEM_PREVIEW_CHANNELS_GUIDE.md`**](./SYSTEM_PREVIEW_CHANNELS_GUIDE.md).*

---

## 3. Native AppWidget Hosting & View Lifecycle

When building a TV dashboard that hosts native Android `AppWidget` instances:

### Lifecycle Tracking (`AppWidgetHostManager`):
- **`startListening()`**: Must be invoked when `MainActivity` enters `onResume()`.
- **`stopListening()`**: Must be invoked when `MainActivity` enters `onPause()` to prevent background battery/memory drain.

### Memory Leaks & ID Deletion:
- **Widget Allocation**: Allocate widget IDs via `appWidgetHost.allocateAppWidgetId()`.
- **Silent Binding**: Use pre-granted permissions via ADB:
  ```bash
  adb shell appwidget grantbind --package com.yourpkg --user 0
  ```
- **Cleanup**: In the native `ViewManager`, call `appWidgetHost.deleteAppWidgetId()` during component unmount / `onDropViewInstance()`. Never leave orphaned widget IDs in the system host registry.

---

## 4. Deep Linking & SecurityException Bypass

### Unexported Activity Challenge
Third-party apps often set `exported="false"` on internal activities, blocking direct intent launch from external apps.

### Native Dispatch Solutions:
1. **RemoteViews Event Simulation**:
   When launching specific widget views, dispatch motion events directly into the mounted native view tree (using DFS child introspection or synthesized `MotionEvent.ACTION_DOWN` + `ACTION_UP`) so Android triggers the widget's internal signed `PendingIntent`.
2. **Deep Link Trampoline**:
   Route launcher card clicks via an internal custom scheme (`yourapp://live?id=...`) to an internal trampoline activity that triggers the native dispatch safely.

---

## 5. TV Build & Diagnostic Commands (Runbook)

```bash
# 1. Regenerate native project cleanly
npx expo prebuild -p android --clean

# 2. Compile Kotlin native modules
cd android && ./gradlew :app:compileDebugKotlin --console=plain --quiet

# 3. Connect to TV over network ADB
adb connect <TV_IP>:5555

# 4. Grant silent widget binding permission
adb shell appwidget grantbind --package <YOUR_PACKAGE_NAME> --user 0

# 5. Inspect active AppWidgetHost state
adb shell dumpsys appwidget

# 6. Stream TV app logs in real time
adb logcat -v time | grep -E "(<YOUR_PACKAGE_NAME>|AppWidget|ReactNativeJS)"

# 7. Assemble standalone Release APK
cd android && ./gradlew :app:assembleRelease
```
