# Development Log — Tapo Dashboard

**Branch:** `feature/widget-launcher-hardening`  
**Purpose:** The authoritative handoff record for active development on this branch. Update this file at the end of every meaningful implementation or device-testing session.

## Resume Here

**Current implementation phase:** **Cinematic Widget Media Row (16:9 Widescreen Cards)**, **Monet-Style Slide-Out Side-Sheet Drawer**, and **Android TV System Preview Channels Publisher (`androidx.tvprovider`)** fully implemented, compiled, and verified on hardware.
**Next required action:** Continue extending per-device Tapo camera snapshot thumbnail capture and direct live stream controls.

The implementation plan is [TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md) and [CHANNEL_PROPOSAL_PLAN.md](./CHANNEL_PROPOSAL_PLAN.md).

## Current State

| Area | Status | Notes |
| --- | --- | --- |
| Android TV HOME launcher | Implemented | Package `com.widgetlauncher`. Manifest/plugin declares `HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER`. |
| Native AppWidget host | Implemented prototype | Kotlin bridge hosts Android `AppWidget` views in React Native under `com.widgetlauncher.widgethost`. |
| Tapo provider inventory | Verified in live testing | 13 providers enumerated on target device; verified live mount/render of Camera (2 live feeds), Smart Plug, and Bulb widgets. |
| Tapo widget creation | Implemented | Dynamic TV D-pad provider picker filters `getInstalledProviders()` to `com.tplink.iot`. |
| Per-widget click actions | Implemented foundation | Each card persists **Use widget primary action**, **Open Tapo app**, or **No action**. |
| Tapo action catalog | Pending device research | Android cannot automatically enumerate proprietary widget actions. |
| Host lifecycle | Implemented | `MainActivity.onResume()` starts widget listening and `onPause()` stops it; the Expo plugin reproduces this after prebuild. |
| Widget-ID ownership | Partially hardened | Native views no longer allocate hidden fallback IDs, and the UI does not persist a failed allocation. Explicit bind-result reporting remains pending. |
| Automated checks | Partial | `npx tsc --noEmit` & Kotlin compile pass; repeatable native build/CI coverage is pending. |

## Completed Work

| Commit | Outcome |
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
