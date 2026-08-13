# 📄 Complete Project Session Changelog & Architecture Summary

## 📌 Executive Overview
This document records all code modifications, architecture enhancements, native bridge implementations, and system diagnostics completed during this pair-programming session for **Tapo Widget Hub (`com.widgetlauncher`)**.

---

## 1. 📺 Android TV Live Channels Framework (`TvInputService`)

### Added Files & Native Architecture
* **[`plugins/widgethost/WidgetTvInputService.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/WidgetTvInputService.kt)**:
  * Extends Android TV framework `android.media.tv.TvInputService`.
  * Implements `WidgetTvSession` with periodic (1-second) bitmap surface rendering (`renderSnapshotToSurface()`).
  * Implements mandatory abstract methods `onSetStreamVolume(volume: Float)` and `onSetCaptionEnabled(enabled: Boolean)`.
* **[`plugins/widgethost/res/xml/widget_tv_input.xml`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/res/xml/widget_tv_input.xml)**:
  * Android TV input declaration setting `setupActivity="com.widgetlauncher.MainActivity"`.

### Native Bridge & Manifest Injections
* **[`plugins/widgethost/AppWidgetModule.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetModule.kt#L25-L65)**:
  * Added `@ReactMethod fun registerTvChannels(promise: Promise)`.
  * Computes precise system `inputId` via `TvContract.buildInputId(ComponentName(reactContext, WidgetTvInputService::class.java))`.
  * Inserts channels 101 (`"Front Yard Camera"`), 102 (`"Backyard Camera"`), and 103 (`"Living Room Plug"`) into system `content://android.media.tv/channel`.
* **[`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js#L12-L110)**:
  * Injected EPG permissions:
    * `com.android.providers.tv.permission.READ_EPG_DATA`
    * `com.android.providers.tv.permission.WRITE_EPG_DATA`
  * Injected `<service android:name=".widgethost.WidgetTvInputService" android:permission="android.permission.BIND_TV_INPUT" android:exported="true">` with `android.media.tv.input` meta-data tag referencing `@xml/widget_tv_input`.
* **[`src/services/WidgetProviderService.ts`](file:///home/thanhtuan/projects/tvlnc/src/services/WidgetProviderService.ts#L101-L113)**:
  * Exported `registerTvChannels()` JS bridge wrapper.
* **[`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx#L148-L151)**:
  * Invokes `registerTvChannels()` during screen startup.

---

## 2. 🎮 D-Pad TV Remote Gestures & Touch Interception

* **[`plugins/widgethost/AppWidgetViewManager.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetViewManager.kt#L28-L31)**:
  * Overrode `onInterceptTouchEvent(ev: MotionEvent?): Boolean` in `AppWidgetViewContainer` to return `true`.
  * Prevents native `AppWidgetHostView` RemoteViews from swallowing touch and long-click gestures before reaching React Native's `<Pressable>`.
* **[`src/components/WidgetCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetCard.tsx#L108-L115)**:
  * Added TV D-Pad `onKeyPress` event handling to capture `Select` / `Enter` (`key === 'Select' || key === 'Enter' || key === '23' || key === '66'`).
  * Triggers 400ms long-press hold timer for remote control navigation.

---

## 3. 🎙️ Voice Deep Link Intent Handling

* **[`app.json`](file:///home/thanhtuan/projects/tvlnc/app.json#L5)**:
  * Added `"scheme": "widget-hub"`.
* **[`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js#L66-L82)**:
  * Injected `VIEW` intent filters supporting `widget-hub://` and `tapo-widget-hub://`.
* **[`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx#L206-L258)**:
  * Added `Linking` deep link listener parsing `widget-hub://live?name=front` or `widget-hub://show?widget=camera` to trigger camera live stream views directly.

---

## 4. ⚙️ ADB & System Resource Optimization

* **Process Memory Optimization**:
  * Executed `./gradlew --stop` to kill resident Kotlin / Gradle compilation daemons, immediately freeing **~4.3 GB of RAM**.
* **ADB Device Connectivity**:
  * Re-established ADB connection to target Onn 4K Pro (`192.168.1.67:5555`).
  * Restarted `ws-scrcpy` systemd service (`systemctl --user restart ws-scrcpy`), active at `http://127.0.0.1:8000/`.
* **Wallpaper Deployment**:
  * Downloaded 1920x1080 monochromatic abstract sphere wallpaper from Pexels and pushed to `/sdcard/wallpaper.jpg` and `/sdcard/Pictures/wallpaper.jpg`.
