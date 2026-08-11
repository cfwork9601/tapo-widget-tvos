# Sprint 0 — Feasibility Spike

status: done
last updated: 2026-08-07

---

## 1. Start

- **Task:** Confirm the core `grantbind` mechanism works on the real Onn box before writing any app code.
- **Exit criteria:** grantbind works, or you have a fallback plan before proceeding.
- **Relevant constraints:** Test against physical Onn box, not an emulator.
- **Depends on:** None
- **Assumptions going in:** Network ADB is available over `192.168.1.73:5555`.

---

## 2. Log

- 2026-08-07 — ADB connected to `192.168.1.73:5555` (`onn. Streaming Device 4K pro`, Android 14 / API 34, non-rooted shell uid=2000).
- 2026-08-07 — Inspected `dumpsys appwidget`: Tapo Camera (`com.tplink.iot/com.tplink.libwidgetui.camerawidget.CameraWidgetProvider`), tinyCam PRO (`com.alexvas.dvr.pro/com.alexvas.dvr.widget.WidgetVideoProvider`), and Easy Voice Recorder (`com.coffeebeanventures.easyvoicerecorder/com.digipom.easyvoicerecorder.widget.RecorderWidgetProviderSingle`) are present.
- 2026-08-07 — Executed `adb shell appwidget grantbind --package me.efesser.flauncher --user 0` and confirmed exit status 0 and grant status in `dumpsys appwidget`.

---

## 3. Summary

- **Outcome:** All feasibility criteria passed. `grantbind` works silently via ADB on Android 14 OEM firmware.
- **Deviations from plan:** Explicit `--user 0` parameter required for `grantbind`.
- **Left to do:** None for Sprint 0.
- **Notes for the next sprint:** Device runs API 34 (Android 14). Manifest in Sprint 2 must include `<queries>` / `QUERY_ALL_PACKAGES` to expose installed widget providers.
