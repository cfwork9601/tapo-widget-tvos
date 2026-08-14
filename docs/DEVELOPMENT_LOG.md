# Development Log — Tapo Dashboard

**Branch:** `feature/widget-launcher-hardening`  
**Purpose:** The authoritative handoff record for active development on this branch. Update this file at the end of every meaningful implementation or device-testing session.  
**Active Conversation ID:** [`2c8fa0a7-79f9-4772-9b89-4dee1087b906`](conversation://2c8fa0a7-79f9-4772-9b89-4dee1087b906) (`/home/thanhtuan/.gemini/antigravity-cli/brain/2c8fa0a7-79f9-4772-9b89-4dee1087b906`)

## Resume Here

**Current implementation phase:** **Android TV System Preview Channels & Live Widget Snapshot Sync** fully verified on hardware.
- **Active Architecture Specification**: [`docs/CHANNEL_PROPOSAL_PLAN.md`](./CHANNEL_PROPOSAL_PLAN.md).
- **Key Achievement**:
  - Live Tapo camera snapshots (`Broilers_Farm_1` and `EggF_Front`) are captured directly from live widgets and displayed crisp in 16:9 on the TV launcher home screen above YouTube.
  - Channel name and real device names are synced and verified.
  - Card click action launches direct live video stream (`TapoPadVideoPlayV3Activity`).
  - The internal React Native app UI remains clean and unmodified.
- **Next Immediate Tasks**:
  1. Add periodic background sync worker (`SnapshotSyncWorker`) using WorkManager for background snapshot refresh even when the app is in the background.
  2. Implement WatchNext motion alert cards when Tapo cameras detect motion.

---

## Current State

| Area | Status | Notes |
| --- | --- | --- |
| Android TV HOME launcher | Implemented | Package `com.widgetlauncher`. Manifest/plugin declares `HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER`. |
| Native AppWidget host | Implemented & Verified | Kotlin bridge hosts Android `AppWidget` views in React Native under `com.widgetlauncher.widgethost`. |
| Tapo provider inventory | Verified in live testing | 13 providers enumerated on target device; verified live mount/render of Camera (2 live feeds), Smart Plug, and Bulb widgets. |
| System Preview Channels | Verified on TV Box | `TapoPreviewChannelManager.kt` publishes `"Tapo Live Cameras"` channel with real names (`Broilers_Farm_1`, `EggF_Front`) on launcher home screen. |
| Live Snapshot Serving | Verified on TV Box | `SnapshotContentProvider.kt` serves live 16:9 JPEG snapshots with cache-busting timestamps; verified live captures rendering on launcher. |
| Per-widget click actions | Verified | Card click action launches `TapoPadVideoPlayV3Activity` full-screen live feed. |
| Host lifecycle | Implemented | `MainActivity.onResume()` starts widget listening and `onPause()` stops it; the Expo plugin reproduces this after prebuild. |
| Automated checks | Passing | `npx tsc --noEmit` & Kotlin compile pass with 0 errors. |

## Completed Work

| Commit / Change | Outcome |
| --- | --- |
| `3737cd2` | Added baseline inspection and branch charter. |
| `39c8544` | Focused the branch charter on Tapo-only widget coverage. |
| `3959aa8` | Aligned the inspection recommendations with the Tapo-only scope. |
| `2db30ca` | Added persistent per-widget click-action settings and action-catalog documentation. |
| `e0a9bb7` | Added the phased Tapo dashboard implementation plan. |
| `6279757` | Tied widget listening to activity lifecycle, removed hidden native ID allocation, and added allocation-failure feedback. |
| `9c6bfdd` | Documented host lifecycle and widget ID ownership hardening. |
| `56f8e3d` | Built `TapoProviderPickerModal` with D-pad navigation, filtering `com.tplink.iot` providers and allocating widget IDs upon selection. |
| `cf1a03b` | Updated development log with Phase 2 completion state and commit reference. |
| `3b2cb2a` | Renamed app to Tapo Widget Hub (`tapo-widget-hub`) and package to `com.widgetlauncher` across Expo config, native Kotlin sources, scripts, and prebuild. |
| `da2eb9e` | Verified provider picker, camera feeds, plug, bulb widgets, and grid layouts on live Onn 4K Pro device; updated docs inventory and validation records. |
| `419c410` | Implemented Phase 3 card states, dedicated card header bar (title, ⚙ options, ✕ delete), renaming presets, fallback cards, and retry binding recovery flow. |
| `0a13fd6` | Added Android TV Preview Channels architectural proposal plan (`docs/CHANNEL_PROPOSAL_PLAN.md`). |
| `c9c2be4` | Reverted in-app 16:9 media row and Monet-style side sheet to preserve clean internal UI. |
| `1d371c9` | Removed obsolete in-app media row docs and aligned repository on System Preview Channels. |
| `f6997c7` | Implemented `TapoPreviewChannelManager.kt` and `SnapshotContentProvider.kt` for system preview channels with 0 in-app UI changes. |
| `a162d06` | Enabled live snapshot serving and thumbnailUri for TV launcher recommendations. |
| `67a85ae` | Switched to actual TP-Link Tapo camera names and live widget snapshot captures. |
| `3687f43` | Cleaned custom names across entire app to use real Tapo device names and live snapshots. |
| Native Hardening | Implemented cache-busting timestamp URIs, multi-stage live widget snapshot capture (800ms & 2500ms), and ContentResolver change notifications. Verified live on Onn 4K Pro. |
| Clean Image Extraction | Implemented `extractCleanCameraBitmap()` in `AppWidgetViewManager.kt` to extract the pure Tapo camera bitmap from internal `ImageView`s without UI card borders/buttons. |
| Native Device Configuration | Added `configureWidget()` in `AppWidgetModule.kt` invoking `startAppWidgetConfigureActivityForResult()` to prompt Tapo's device selection screen upon adding or editing widgets. |
| Touch Passthrough Restored | Removed `onInterceptTouchEvent` and focus blocking in `AppWidgetViewManager.kt`, restoring click and tap event passthrough to Tapo's internal `RemoteViews` for device selection. |
| Automatic Snapshot Refresh | Implemented `CustomAppWidgetHostView.updateAppWidget()` callback and `AppState` / `onWindowVisibilityChanged` triggers so newly selected cameras and frame updates automatically capture fresh snapshots to `TvProvider`. |

## Validation Record

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-08-11 | TypeScript | Pass | `npx tsc --noEmit` completed successfully after adding `TapoProviderPickerModal`. |
| 2026-08-11 | Kotlin compile after lifecycle changes | Pass | `./gradlew :app:compileDebugKotlin --console=plain --quiet` completed successfully after Expo prebuild. |
| 2026-08-11 | Android TV provider registry | Pass | Onn 4K Pro / Android 14 / Tapo 3.20.154 reports 13 Tapo widget providers; two camera widgets are bound to TV Launcher. See `TAPO_PROVIDER_INVENTORY.md`. |
| 2026-08-11 | Package rename & Kotlin build | Pass | `npx expo prebuild --clean`, `./gradlew :app:compileDebugKotlin`, and `npx tsc --noEmit` passed with 0 errors for `com.widgetlauncher`. |
| 2026-08-11 | Per-provider mount/render test | Pass | Deployed build to Onn 4K Pro (`192.168.1.67:5555`). Opened `TapoProviderPickerModal`, verified 13 providers detected, successfully mounted & rendered Camera (2 live feeds), Smart Plug, and Bulb widgets simultaneously in 2, 3, and 4-column layouts. |
| 2026-08-11 | Phase 3 Card States & Recovery | Pass | Implemented dedicated card header bar (title, ⚙ options, ✕ delete), fallback cards for uninstalled/bind-failed states, widget renaming presets, and retry binding recovery flow. Tested and verified on live TV box (`192.168.1.67:5555`). |
| 2026-08-14 | Snapshot & Channel Hardening | Pass | TypeScript check (`npx tsc --noEmit`) and Kotlin compilation (`./gradlew :app:compileDebugKotlin`) passed with 0 errors. |
| 2026-08-14 | Live TV Preview Channel Test | Pass | Deployed to Onn 4K Pro (`192.168.1.67:5555`). Verified `Tapo Widget Hub` channel renders live 16:9 snapshots with real device names (`Broilers_Farm_1` & `EggF_Front`) directly on TV launcher home screen above YouTube. |
| 2026-08-14 | Deep Link Guard Verification | Pass | Verified on TV box that normal app launches open cleanly into dashboard with focus on `+ Add Tapo Widget`, allowing full D-Pad navigation without auto-opening camera feeds. |
| 2026-08-14 | Native Device Configure Flow | Pass | Implemented `startAppWidgetConfigureActivityForResult` in `AppWidgetModule.kt` and wired into `addWidget` and card options modal ("🎯 Select / Change Camera Device"). |
| 2026-08-14 | Touch Passthrough Restored | Pass | Verified on TV box that Tapo widget views freely receive touch events and PendingIntents matching `main` branch behavior. |
| 2026-08-14 | Auto Snapshot Refresh Sync | Pass | Verified on TV box that newly configured camera cards (`EggF_House1`, `Broilers_Farm_1`, `EggF_Front`) automatically sync fresh snapshots to the TV launcher home screen upon frame update and app resume. |

## Important Decisions

1. This branch supports only Tapo providers from `com.tplink.iot`; do not add cross-app widget support without an explicit scope change.
2. “All Tapo widgets” means every Tapo Android app-widget provider installed on the target device.
3. Do not claim automatic discovery of every internal Tapo widget function. Android does not provide a supported API to enumerate another app widget's internal actions.
4. Add an action choice only after it is verified for a specific provider class and device/Tapo-app version.
5. Keep **Open Tapo app** and **No action** as safe fallbacks for every widget card.
6. `plugins/widgethost/` is authoritative for native bridge sources. The Expo plugin copies those files into the generated `android/.../widgethost/` location during prebuild.

## Validation Record

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-08-11 | TypeScript | Pass | `npx tsc --noEmit` completed successfully after adding `TapoProviderPickerModal`. |
| 2026-08-11 | Kotlin compile after lifecycle changes | Pass | `./gradlew :app:compileDebugKotlin --console=plain --quiet` completed successfully after Expo prebuild. |
| 2026-08-11 | Android TV provider registry | Pass | Onn 4K Pro / Android 14 / Tapo 3.20.154 reports 13 Tapo widget providers; two camera widgets are bound to TV Launcher. See `TAPO_PROVIDER_INVENTORY.md`. |
| 2026-08-11 | Package rename & Kotlin build | Pass | `npx expo prebuild --clean`, `./gradlew :app:compileDebugKotlin`, and `npx tsc --noEmit` passed with 0 errors for `com.widgetlauncher`. |
| 2026-08-11 | Per-provider mount/render test | Pass | Deployed build to Onn 4K Pro (`192.168.1.67:5555`). Opened `TapoProviderPickerModal`, verified 13 providers detected, successfully mounted & rendered Camera (2 live feeds), Smart Plug, and Bulb widgets simultaneously in 2, 3, and 4-column layouts. |
| 2026-08-11 | Phase 3 Card States & Recovery | Pass | Implemented dedicated card header bar (title, ⚙ options, ✕ delete), fallback cards for uninstalled/bind-failed states, widget renaming presets, and retry binding recovery flow. Tested and verified on live TV box (`192.168.1.67:5555`). |
| 2026-08-14 | Snapshot & Channel Hardening | Pass | TypeScript check (`npx tsc --noEmit`) and Kotlin compilation (`./gradlew :app:compileDebugKotlin`) passed with 0 errors. |

## Update Rules

At the end of every development session:

1. Move the current phase/resume point forward.
2. Add the commit hash and outcome to **Completed Work**.
3. Record every build, TypeScript, and device-test result in **Validation Record**.
4. Add newly discovered provider classes and action behavior to the Tapo provider inventory/action documentation.
5. Record blockers with enough detail for the next session to reproduce them.

## Related Documents

- [Branch Charter](./BRANCH_CHARTER.md)
- [Application Inspection](./APP_INSPECTION.md)
- [Implementation Plan](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md)
- [Tapo Widget Click Actions](./TAPO_WIDGET_ACTIONS.md)
- [Tapo Provider Inventory](./TAPO_PROVIDER_INVENTORY.md)
