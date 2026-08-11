# Sprint 4 — Provider Enumeration (Native Module)

status: done
last updated: 2026-08-07

---

## 1. Start

### Goal
JS can dynamically query "what widget providers are installed on this device?" via a native module (`AppWidgetModule.kt`), returning package names, class names, labels, and provider metadata.

### Context & Assumptions
- Target device: Android 14 (API 34) on Onn 4K box (`192.168.1.73:5555`).
- Sprint 2 manifest plugin includes `QUERY_ALL_PACKAGES` permission so `AppWidgetManager.getInstalledProviders()` returns all installed app widget providers.
- `AppWidgetHostPackage.kt` is registered in `MainApplication.kt` and exposes `AppWidgetModule` alongside `AppWidgetViewManager`.

---

## 2. Log

- **2026-08-07**: Initialized Sprint 4 note.
- **2026-08-07**: Created `AppWidgetModule.kt` exposing `@ReactMethod fun getInstalledProviders(promise: Promise)`.
- **2026-08-07**: Registered `AppWidgetModule` in `AppWidgetHostPackage.kt`'s `createNativeModules`.
- **2026-08-07**: Created JS service `src/services/WidgetProviderService.ts` with TypeScript interfaces for `getInstalledProviders()`.
- **2026-08-07**: Updated `HomeScreen.tsx` to dynamically query providers at runtime and render detected TP-Link Tapo cards.
- **2026-08-07**: Compiled and deployed to target Onn box (`192.168.1.73:5555`). Verified 24 total installed providers retrieved at runtime matching `dumpsys appwidget` count.

---

## 3. Summary

### What Was Accomplished
- `AppWidgetModule.kt` native module created and registered.
- JS helper `WidgetProviderService.ts` implemented.
- `HomeScreen.tsx` dynamically enumerates all installed widget providers at runtime.
- Runtime count verified against `dumpsys appwidget` (24 installed providers detected, including 13 TP-Link Tapo providers).

### Deviations / Key Decisions
- Included full provider metadata in returned array (`minWidth`, `minHeight`, `minResizeWidth`, `minResizeHeight`, `label`).

### Leftover / Open Items
- None. Ready for Sprint 5 (Generic RN Widget Cards & Configuration UI).

