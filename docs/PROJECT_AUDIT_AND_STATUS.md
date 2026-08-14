# Tapo Widget Hub — System Audit & Technical Readiness Report

**Project**: `Tapo Widget Hub` (`com.widgetlauncher`)  
**Target Device**: onn. Streaming Device 4K pro (`192.168.1.67:5555`, Android 14 / API 34)  
**Framework**: React Native 0.86.2 + React 19.2.3 + Expo SDK ~57.0.11 (Custom Dev Client)  
**Date**: August 2026  
**Status**: Authoritative System Audit & Implementation Baseline  

---

## 1. Android Manifest & Permissions Audit

### 1.1 Current `<uses-permission>` Declarations
Inspecting [`android/app/src/main/AndroidManifest.xml`](file:///home/thanhtuan/projects/tvlnc/android/app/src/main/AndroidManifest.xml) and [`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js):

| Permission | Source | Purpose |
|---|---|---|
| `android.permission.BIND_APPWIDGET` | Config Plugin | Required for silent `AppWidgetHost` binding without permission dialogs. |
| `android.permission.QUERY_ALL_PACKAGES` | Config Plugin | Required on Android 11+ (API 30+) for widget provider enumeration. |
| `android.permission.INTERNET` | Expo Base | Network connectivity for React Native dev client bundle loading. |
| `android.permission.READ_EXTERNAL_STORAGE` | Expo Base (`maxSdkVersion="32"`) | File access (scoped on Android 13+). |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Expo Base (`maxSdkVersion="32"`) | File write operations (scoped on Android 13+). |
| `android.permission.SYSTEM_ALERT_WINDOW` | Expo Dev Client | Dev menu & debug overlays. |
| `android.permission.VIBRATE` | Expo Base | Haptic feedback. |

### 1.2 EPG Permissions Check
* **`READ_EPG_DATA`**: **NOT present** in manifest or plugins.
* **`WRITE_EPG_DATA`**: **NOT present** in manifest or plugins.

### 1.3 Launcher Intent Filters & Leanback Feature
* **Leanback Declaration**:
  ```xml
  <uses-feature android:name="android.software.leanback" android:required="false"/>
  ```
* **MainActivity Intent Filters**:
  1. Standard Application Launcher: `action.MAIN` with `category.LAUNCHER`
  2. TV Home Launcher Role: `action.MAIN` with `category.HOME`, `category.DEFAULT`, `category.LEANBACK_LAUNCHER`
  3. Custom URL Deep Linking: `action.VIEW` with `category.DEFAULT`, `category.BROWSABLE`, schemes `widget-hub://` and `exp+tapo-widget-hub://`

### 1.4 `android:sharedUserId`
* **Confirmed**: `android:sharedUserId` is **NOT set** anywhere in the project, adhering to standard Android 14 security best practices.

---

## 2. Native Module & Bridge Inventory

### 2.1 Registered Kotlin Modules & ViewManagers

| Component Name | Type | Source Path | Generated Target Path |
|---|---|---|---|
| **`AppWidgetModule`** | `ReactContextBaseJavaModule` | [`plugins/widgethost/AppWidgetModule.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetModule.kt) | `android/app/src/main/java/com/widgetlauncher/widgethost/AppWidgetModule.kt` |
| **`AppWidgetViewManager`** | `SimpleViewManager<AppWidgetViewContainer>` | [`plugins/widgethost/AppWidgetViewManager.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetViewManager.kt) | `android/app/src/main/java/com/widgetlauncher/widgethost/AppWidgetViewManager.kt` |
| **`AppWidgetHostManager`** | Kotlin Singleton (`Object`) | [`plugins/widgethost/AppWidgetHostManager.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetHostManager.kt) | `android/app/src/main/java/com/widgetlauncher/widgethost/AppWidgetHostManager.kt` |
| **`AppWidgetHostPackage`** | `ReactPackage` | [`plugins/widgethost/AppWidgetHostPackage.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetHostPackage.kt) | `android/app/src/main/java/com/widgetlauncher/widgethost/AppWidgetHostPackage.kt` |

### 2.2 JavaScript Bridge API (`WidgetProviderService.ts`)

All bridge functions are **Promise-based**:

```typescript
// Enumerates installed Android widget providers (package, class, label, dimensions)
export async function getInstalledProviders(): Promise<WidgetProviderInfo[]>;

// Allocates a unique AppWidget ID from AppWidgetHost
export async function allocateAppWidgetId(): Promise<number>;

// Releases an AppWidget ID from native memory on unmount/deletion
export async function deleteAppWidgetId(appWidgetId: number): Promise<boolean>;

// Launches third-party provider application
export async function launchApp(packageName: string): Promise<boolean>;

// Saves/retrieves JSON configuration strings in private SharedPreferences
export async function saveSetting(key: string, value: string): Promise<boolean>;
export async function getSetting(key: string): Promise<string | null>;
```

### 2.3 Image & Bitmap Data Flow Architecture
* **Native-Side Inflation**: The React Native layer **never transfers raw bitmaps or image URIs**.
* Instead, React Native passes metadata props (`packageName`, `className`, `appWidgetId`) to `<AppWidgetView>`.
* The Kotlin `AppWidgetViewManager` binds and inflates the live Android `AppWidgetHostView` (`RemoteViews`) directly into native surface memory, avoiding JavaScript bridge serialization overhead.

---

## 3. Build & Signing Configuration

* **Build Variant**: **Debug APK** (`./gradlew assembleDebug` deployed via [`scripts/deploy.sh`](file:///home/thanhtuan/projects/tvlnc/scripts/deploy.sh)).
* **Signing Config**: Standard Android Debug Keystore (`debug.keystore`, alias `androiddebugkey`, password `android`).
* **Workflow Integrity**: **100% Expo Prebuild + Custom Dev Client**. Manifest injections and Kotlin bridge syncing survive clean prebuilds (`npx expo prebuild -p android --clean`) with zero manual manifest edits.

---

## 4. Hardware & Privilege State (Onn 4K Pro)

Live hardware audit via ADB (`192.168.1.67:5555`):

* **Model & OS**: `onn. Streaming Device 4K pro`, **Android 14** (API 34).
* **Root / System State**: **Not rooted** (`which su` is null); `/system` is mounted as read-only `erofs`.
* **Install Location**: Regular user app in `/data/app/.../com.widgetlauncher-.../base.apk` (Not pushed to `/system/priv-app`).
* **ADB Level & Privileges**: Operates at standard `uid=2000(shell)` level. Silent widget binding is granted via standard ADB command:
  ```bash
  adb shell appwidget grantbind --package com.widgetlauncher --user 0
  ```
* **Active Launcher Role**: Confirmed active holder of `android.app.role.HOME`.
* **Display Density**: Override density `309` applied for optimal 4K TV scaling.

---

## 5. Home Screen UI Structure & Extension Points

* **Media Row Slotting**: In [`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx), a new horizontal recommendations/media row slots directly into `row2Widgets` (replacing the legacy vertical wrapping grid / simple slider) below `row1Settings`.
* **Image Loading**: Uses standard React Native `<Image>` and native `<AppWidgetView>` containers. No external image caching libraries (`expo-image` / `FastImage`) are installed.
* **Deep Linking / Intent Patterns**:
  - Incoming: `Linking.addEventListener('url', ...)` handles `widget-hub://live?name=...`.
  - Outgoing: `launchApp(packageName)` starts external activities via `packageManager.getLaunchIntentForPackage`.

---

## 6. Gaps for WatchNext / PreviewPrograms & Media Cards

* **`TvContractCompat` / `tvprovider` Code**: **Confirmed NONE currently present** in the codebase.
* **Reusable Foundations**:
  - ✅ `AppWidgetHostManager.kt` & `AppWidgetViewManager.kt` for embedding live widget layouts inside 16:9 media cards.
  - ✅ `triggerWidgetClick()` DFS view-tree traversal & MotionEvent dispatching to open live camera feeds (`TapoPadVideoPlayV3Activity`).
  - ✅ `TapoProviderPickerModal.tsx` for widget selection.
  - ✅ `SharedPreferences` persistence bridge.
* **New Components Required**:
  1. **`WidgetMediaCard.tsx`**: 16:9 widescreen card container with edge-to-edge widget embedding, gradient typography, and `1.05x` focus scaling.
  2. **Horizontal Media Row** in `HomeScreen.tsx`: D-Pad focus traversal and inline `+ Add Widget` card.
  3. **`WidgetRowSettingsModal.tsx`**: Monet-style right slide-out customization drawer (cards per row, hide titles toggle, show row name, rename, click actions).

---

## 7. Readiness Matrix for Implementation Planning

| Subsystem | Readiness Tag | Status Notes |
|---|---|---|
| **1. Manifest & Permissions** | 🟢 **READY** | Prebuild-resilient; no stale EPG permissions; no sharedUserId. |
| **2. Native Bridge** | 🟢 **READY** | ID lifecycle, Activity listening, and touch interception verified. |
| **3. Build & Signing** | 🟢 **READY** | Debug keystore and Expo prebuild pipeline verified. |
| **4. Device Privileges** | 🟢 **READY** | Stock Android 14 Onn box configured via ADB `grantbind`. |
| **5. Home Screen UI** | 🟡 **NEEDS WORK** | Replace legacy grid with 16:9 `WidgetMediaCard` horizontal row. |
| **6. Media Row Customizer** | 🟡 **NEEDS WORK** | Build Monet-style slide-out side-sheet drawer. |
