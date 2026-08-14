# Development Log — Tapo Dashboard

**Branch:** `feature/widget-launcher-hardening`  
**Milestone Tag / Revert Point:** `version_2_channel_card_fined` (commit `47fc9a1`)  
**Purpose:** The authoritative handoff record for active development on this branch. Update this file at the end of every meaningful implementation or device-testing session.  
**Active Conversation ID:** [`2c8fa0a7-79f9-4772-9b89-4dee1087b906`](conversation://2c8fa0a7-79f9-4772-9b89-4dee1087b906) (`/home/thanhtuan/.gemini/antigravity-cli/brain/2c8fa0a7-79f9-4772-9b89-4dee1087b906`)

## Resume Here

**Current implementation phase:** **1:1 Widget Timestamp Extraction & Android TV System Preview Channels** fully verified on hardware.
- **Active Architecture Specification**: [`docs/CHANNEL_PROPOSAL_PLAN.md`](./CHANNEL_PROPOSAL_PLAN.md).
- **Key Achievement**:
  - Live Tapo camera snapshots (`Broilers_Farm_1`, `EggF_Front`, `EggF_House1`) are captured directly from live widgets.
  - Native widget hierarchy parser extracts exact `"Last view at HH:mm"` strings directly from Tapo's internal widget TextViews and burns them onto the snapshot pill badge, guaranteeing 100% synchronization between in-app widgets and TV launcher channel cards.
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
| Tapo provider inventory | Verified in live testing | 13 providers enumerated on target device; verified live mount/render of Camera (3 live feeds), Smart Plug, and Bulb widgets. |
| System Preview Channels | Verified on TV Box | `TapoPreviewChannelManager.kt` publishes `"Tapo Live Cameras"` channel with real names (`Broilers_Farm_1`, `EggF_Front`, `EggF_House1`) on launcher home screen. |
| Live Snapshot Serving | Verified on TV Box | `SnapshotContentProvider.kt` serves live 16:9 JPEG snapshots with cache-busting timestamps; verified live captures rendering on launcher. |
| 1:1 Widget Timestamp Sync | Verified on TV Box | Direct Tapo `TextView` extraction formats `"Last view at [time]"` on cards, matching in-app widget timestamps 1:1. |
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
| `dc49098` | Hardened live camera snapshots, Monet Launcher support, AppState/widget frame sync, native device configure activity, and touch passthrough. |
| `fb99098` | Extracted direct Tapo widget TextView timestamps (`findLastViewTimestamp`) and rendered 1:1 synchronized `"Last view at [time]"` badges on launcher snapshot cards. |
| `2e15464` | Implemented `CameraLauncherActivity` trampoline and `AppWidgetSnapshotCaptureHelper` to auto-capture updated widget snapshots and timestamps upon returning from full-screen live feeds. |
| `8fba33c` | Restored direct deep link URI (`widget-hub://live?name=...`) for instant full-screen camera stream launching from TV launcher cards. |

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
| 2026-08-14 | 1:1 Widget Timestamp Parsing | Pass | Verified `findLastViewTimestamp()` extracts `"Last view at HH:mm"` from sibling TextViews directly in live widget hierarchies, perfectly matching widget timestamps (`Broilers_Farm_1: 11:55`, `EggF_Front: 09:26`, `EggF_House1: 11:57`). |
| 2026-08-14 | Direct Live Stream Launching | Pass | Verified clicking preview cards executes `widget-hub://live?name=...` to dispatch native RemoteViews clicks, opening `TapoPadVideoPlayV3Activity` full-screen live feed instantly without permission denial. |
| 2026-08-14 | Milestone Tagging | Pass | Created and pushed git tag and branch `version_2_channel_card_fined` at commit `47fc9a1`. |

## Important Decisions

1. This branch supports only Tapo providers from `com.tplink.iot`; do not add cross-app widget support without an explicit scope change.
2. “All Tapo widgets” means every Tapo Android app-widget provider installed on the target device.
3. Do not claim automatic discovery of every internal Tapo widget function. Android does not provide a supported API to enumerate another app widget's internal actions.
4. Add an action choice only after it is verified for a specific provider class and device/Tapo-app version.
5. Keep **Open Tapo app** and **No action** as safe fallbacks for every widget card.
6. `plugins/widgethost/` is authoritative for native bridge sources. The Expo plugin copies those files into the generated `android/.../widgethost/` location during prebuild.
7. System Preview Channels are published to `androidx.tvprovider` without modifying the in-app React Native UI (`HomeScreen.tsx`).
8. Preview channel card click intents must route through `widget-hub://live?name=...` to allow Android `RemoteViews` to execute Tapo's internal signed `PendingIntent` for unexported activities.

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
