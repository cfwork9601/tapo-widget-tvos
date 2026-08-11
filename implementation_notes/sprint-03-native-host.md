# Sprint 3 — Native Widget Host (Kotlin core)

status: done
last updated: 2026-08-07

---

## 1. Start

### Goal
The native plumbing for hosting an Android `AppWidget` exists in Kotlin and is unit-testable/smoke-testable, with complete lifecycle management (`startListening`/`stopListening`) and cleanup (`deleteAppWidgetId`).

### Context & Assumptions
- Target device: Android 14 (API 34) on Onn 4K box (`192.168.1.73:5555`).
- Sprint 2 complete: Manifest contains `BIND_APPWIDGET` permission and `grantbind` works silently.
- Hard constraints:
  - Never hardcode provider `packageName`/`className` in production components (`@ReactProp` driven).
  - Every provider lookup wrapped in try/catch with fallback UI state.
  - `onDropViewInstance` must call `deleteAppWidgetId()`.
  - `AppWidgetHost.startListening()` / `stopListening()` tied to Activity lifecycle (`onResume`/`onPause`).

---

## 2. Log

- **2026-08-07**: Initialized Sprint 3 note.
- **2026-08-07**: Created `AppWidgetHostManager.kt` singleton implementing `LifecycleEventListener` for host lifecycle management (`startListening`/`stopListening` on host resume/pause).
- **2026-08-07**: Created `AppWidgetViewManager.kt` extending `SimpleViewManager<AppWidgetViewContainer>` with `@ReactProp(name = "packageName")` and `@ReactProp(name = "className")`, try/catch error fallback UI, and `onDropViewInstance` calling `deleteAppWidgetId()`.
- **2026-08-07**: Created `AppWidgetHostPackage.kt` and registered package in `MainApplication.kt`.
- **2026-08-07**: Updated `WidgetCard.tsx` and `HomeScreen.tsx` to render native `AppWidgetView` with live Tapo camera widget and fallback error card.
- **2026-08-07**: Built APK with `./gradlew assembleDebug` and deployed to physical Onn box (`192.168.1.73:5555`).

---

## 3. Summary

### What Was Accomplished
- Native Kotlin widget host pipeline complete: `AppWidgetHostManager.kt`, `AppWidgetViewManager.kt`, `AppWidgetHostPackage.kt`.
- Integrated lifecycle listener (`onHostResume`/`onHostPause`) to start and stop host listening cleanly.
- Try/catch fallback UI created so missing/invalid widget providers display an informative placeholder without crashing the app.
- Unmount cleanup path (`onDropViewInstance` calling `deleteAppWidgetId`) fully implemented.
- RN components updated and deployed to target device.

### Deviations / Key Decisions
- Created `AppWidgetViewContainer` (extending `FrameLayout`) to cleanly manage `AppWidgetHostView` inflation, layout parameters, and fallback rendering.

### Leftover / Open Items
- None. Ready for Sprint 4 (Provider Enumeration Native Module).

