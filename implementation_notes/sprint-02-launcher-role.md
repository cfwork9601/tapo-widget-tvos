# Sprint 2 — Launcher Role & Config Plugin

status: done
last updated: 2026-08-07

---

## 1. Start

### Goal
App is selectable as the device's default HOME launcher, and this survives a fresh `expo prebuild`.

### Context & Assumptions
- Target device is Android 14 (API 34) on Onn 4K box (`192.168.1.73:5555`).
- Android 14 requires `QUERY_ALL_PACKAGES` / `<queries>` tag to discover widget providers.
- Hard constraint: NEVER hand-edit `android/AndroidManifest.xml` directly. All manifest edits must be injected by `plugins/withLauncherManifest.js`.

---

## 2. Log

- **2026-08-07**: Started Sprint 2. Created Expo config plugin `plugins/withLauncherManifest.js`.
- **2026-08-07**: Registered plugin in `app.json`.
- **2026-08-07**: Tested prebuild wipe with `npx expo prebuild -p android --clean`.
- **2026-08-07**: Verified `android/app/src/main/AndroidManifest.xml` regenerated with `QUERY_ALL_PACKAGES`, `BIND_APPWIDGET`, `android.software.leanback`, and `HOME`/`LEANBACK_LAUNCHER` intent filters.
- **2026-08-07**: Built debug APK with `./gradlew assembleDebug` (5m 12s clean build).
- **2026-08-07**: Deployed APK to Onn box at `192.168.1.73:5555` using `./scripts/deploy.sh`.
- **2026-08-07**: Verified launcher role assigned (`cmd role get-role-holders android.app.role.HOME` -> `com.tvlauncher`) and application launches cleanly.

---

## 3. Summary

### What Was Accomplished
- `plugins/withLauncherManifest.js` created and configured in `app.json`.
- Added permissions (`QUERY_ALL_PACKAGES`, `BIND_APPWIDGET`), feature (`android.software.leanback`), and launcher intent filters (`HOME`, `DEFAULT`, `LEANBACK_LAUNCHER`) to `MainActivity`.
- Verified prebuild wipe (`--clean`) cleanly regenerates all required manifest tags automatically.
- Debug APK compiled, installed, granted `grantbind`, and set as active HOME launcher role holder on physical Onn 4K box (`192.168.1.73:5555`).

### Deviations / Key Decisions
- Standardized manifest injection using Expo config plugin `@expo/config-plugins` to prevent manifest resets.
- Updated `./scripts/deploy.sh` to automate `grantbind` and `cmd role add-role-holder android.app.role.HOME com.tvlauncher`.

### Leftover / Open Items
- None. Ready for Sprint 3 (Native Widget Host).


