# Sprint 5 — RN UI: Generic Widget Cards & Multi-Camera Grid

status: done
last updated: 2026-08-07

---

## 1. Start

### Goal
Replace hardcoded widget components with a generic, provider-driven `WidgetCard` component, supporting multiple camera widget instances (e.g. Front, Backyard, Garage) and multi-widget layout grids.

### Context & Assumptions
- Target device: Android 14 (API 34) on Onn 4K box (`192.168.1.73:5555`).
- Sprint 3 & 4 complete: Native widget host supports independent `appWidgetId` allocation per instance, and `AppWidgetModule` enumerates installed providers.
- Hard constraints:
  - Never hardcode a widget provider's package/className inside Kotlin or JS components.
  - Every provider lookup wrapped in try/catch with fallback UI state.
  - Every widget view creation has a matching cleanup path (`deleteAppWidgetId()`).

---

## 2. Log

- **2026-08-07**: Initialized Sprint 5 note.
- **2026-08-07**: Refactored `WidgetCard.tsx` into a generic TV card component with dynamic title header, customizable width/height, and optional removal action.
- **2026-08-07**: Updated `HomeScreen.tsx` to support multi-camera instance state and control bar ("+ Add Camera", "+ Add Plug").
- **2026-08-07**: Compiled and deployed to target Onn box (`192.168.1.73:5555`). Verified multiple concurrent camera widget instances (Camera #1 Front, Camera #2 Backyard) operating independently on dashboard grid.

---

## 3. Summary

### What Was Accomplished
- Generic `WidgetCard.tsx` created, removing all hardcoded per-widget code.
- Multi-camera grid implemented in `HomeScreen.tsx`, allowing users to dynamically add multiple camera widget cards (Front, Backyard, etc.) side-by-side.
- Action controls created to add/remove widget cards dynamically.
- Verified on physical Onn 4K box with active widget instances (IDs 2, 3, 4, 5) running concurrently in `dumpsys appwidget`.

### Deviations / Key Decisions
- Added action bar controls in `HomeScreen.tsx` to allow adding camera cards dynamically.

### Leftover / Open Items
- None. Ready for Sprint 6 (TV Navigation & Focus handling).

