# Sprint 1 — Project Scaffold & Deployable Shell

status: done
last updated: 2026-08-07

---

## 1. Start

- **Task:** Create an empty Expo dev-client app installable on the Onn 4K box over network ADB.
- **Exit criteria:** Blank RN screen renders on the physical Onn box via a custom dev client build.
- **Relevant constraints:**
  - Expo prebuild + custom dev client, NOT Expo Go.
  - Do not hand-edit `android/AndroidManifest.xml`.
  - Dev machine is Ubuntu; target device is Onn 4K Pro (`192.168.1.73:5555`).
- **Depends on:** Sprint 0 (Feasibility Spike — PASSED).
- **Assumptions going in:** JDK 17 + Android SDK + node / npm are installed and configured on Ubuntu dev machine. Device ADB is connected.

---

## 2. Log

- 2026-08-07 — Starting Sprint 1.
- 2026-08-07 — Custom dev client built (`./gradlew assembleDebug` generated `app-debug.apk`).
- 2026-08-07 — Transferred APK via ADB push to `/data/local/tmp/app-debug.apk` and installed via `pm install -r`.
- 2026-08-07 — Verified `com.tvlauncher/.MainActivity` launched and actively rendering on physical Onn box (`mFocusedApp`). Sprint 1 PASSED.

---

## 3. Summary

- **Outcome:** PASSED. Expo dev client app successfully compiled, installed, and launched on Onn 4K Box over network ADB.
- **Deviations from plan:** ADB `pm install` requires APK under `/data/local/tmp/` on Android 14 stock firmware due to SELinux permissions.
- **Left to do:** None (Sprint 1 complete).
- **Notes for the next sprint:** Sprint 2 — write Expo config plugin (`plugins/withLauncherManifest.js`) for `HOME` / `LEANBACK_LAUNCHER` intent filters and `<queries>` tag.
