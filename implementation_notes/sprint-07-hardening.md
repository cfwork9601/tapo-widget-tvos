# Sprint 7 — Hardening & Deployment Runbook

Status: `done`
Started: 2026-08-08
Completed: 2026-08-08

---

## 1. Start

### Goal
Repeatable, documented deployment to a fresh device, including deployment script finalization, fresh-device setup runbook, prebuild wipe survival verification, and missing provider failure path testing.

### Context & Assumptions
- Target devices: Onn 4K box (`192.168.1.67:5555` active, `192.168.1.73:5555` secondary).
- Sprints 0 to 6 completed and verified:
  - Custom Android TV Launcher with Kotlin native `AppWidgetHost` bridge.
  - Silent `appwidget grantbind` and `android.app.role.HOME` default launcher role.
  - Native `SharedPreferences` persistence for widget configurations and layout settings.
  - Direct TP-Link Tapo camera live view click dispatch (`TapoPadVideoPlayV3Activity`).
  - Row-based layout (Row 1 Settings toolbar, Row 2 Dynamic widget grid/slider) with `wm density 309`.

---

## 2. Log

- **2026-08-08**: Initialized Sprint 7 note.
- **2026-08-08**: Finalized `scripts/deploy.sh` with automated ADB connection, `wm density 309` override, silent APK push/install, silent `appwidget grantbind`, and `android.app.role.HOME` role assignment.
- **2026-08-08**: Authored fresh-device deployment runbook in `RUNBOOK.md` for zero-friction setup on new Onn 4K devices.
- **2026-08-08**: Re-ran `npx expo prebuild -p android --no-install` wipe test. Verified `withLauncherManifest.js` automatically re-injected `BIND_APPWIDGET`, `QUERY_ALL_PACKAGES`, `leanback`, and `HOME`/`LEANBACK_LAUNCHER` intent filters with 0 manual edits.
- **2026-08-08**: Verified fallback UI path in `AppWidgetViewManager.kt` for missing/uninstalled widget providers to prevent app crashes.

---

## 3. Summary

### What Was Accomplished
- `scripts/deploy.sh` finalized and parameterized by device IP (defaults to `192.168.1.67:5555`).
- Complete fresh-device setup runbook published in `RUNBOOK.md`.
- `npx expo prebuild` wipe test passed with 100% manifest recreation.
- Safe failure fallback UI verified for uninstalled or missing widget providers.
- Local debug/release APK builds (`./gradlew assembleDebug` / `./gradlew assembleRelease`) documented for distributable standalone deployment.

### Deviations / Key Decisions
- Included `wm density 309` display override directly in `deploy.sh` for consistent TV UI scaling.

### Leftover / Open Items
- None. All 7 sprints (0 through 7) are 100% complete and fully verified.
