# Sprint 6 — TV Navigation, Remote Focus & Camera UX Polish

status: done
last updated: 2026-08-08

---

## 1. Start

### Goal
The entire launcher interface (action buttons, widget cards, remove actions, layout grid scrolling, hold option modals, and direct camera stream execution) is 100% navigable and operable using only an Android TV D-Pad remote control, with high-visibility focus indicators and zero dead focus traps.

### Context & Assumptions
- Target device: Android 14 (API 34) on Onn 4K box (`192.168.1.73:5555`).
- Device is controlled via remote control (D-Pad Left/Right/Up/Down, Select/OK, Home, Back).
- React Native TV focus handling requires `focusable={true}`, focus state styling (`isFocused`), and focus ring visuals (`#38bdf8` active borders).

---

## 2. Log

- **2026-08-08**: Initialized Sprint 6 note.
- **2026-08-08**: Added `hasTVPreferredFocus={true}` to "+ Add Camera" action button in `HomeScreen.tsx`.
- **2026-08-08**: Wrapped `WidgetCard.tsx` in a focusable `Pressable` container with dynamic focus state (`isFocused`), 2.5px cyan focus border (`#38bdf8`), label highlight, and scale transform animation (`1.025x`).
- **2026-08-08**: Made remove action buttons (`✕`) focusable via D-Pad with individual red focus ring (`#ef4444`).
- **2026-08-08**: Deployed to Onn 4K box and verified D-Pad keyevent navigation across controls and cards.
- **2026-08-08**: Increased default camera widget tile dimensions from `360x250` to `540x380` (over 2x larger viewable area) for high-visibility TV camera snapshot display.
- **2026-08-08**: Added long-press / hold handler (`onLongPress`) on `WidgetCard.tsx` and created a dark glassmorphism option modal in `HomeScreen.tsx` with options:
  - 📹 **View Live Stream**
  - 🎬 **View Saved Clips**
  - 🗑️ **Delete Widget**
  - ❌ **Cancel**
- **2026-08-08**: Added Layout View Mode Switcher `[ ⊞ Grid | ⇄ Slide ]` in `HomeScreen.tsx`:
  - **Grid Mode** (Default): Multi-column wrapping tile grid.
  - **Slide Mode**: Horizontal scrolling carousel with smooth D-Pad remote navigation.
- **2026-08-08**: Refined camera widget click handling in `AppWidgetViewManager.kt`:
  - Implemented `findAndClickGoLiveView()` to search child view hierarchy for "Go Live" / "Live" text labels and resource IDs.
  - Calculates relative view coordinates and dispatches touch events to the exact "Go Live" button, launching `TapoPadVideoPlayV3Activity` full-screen live view directly when card is selected.
- **2026-08-08**: Stripped outer card headers and padding (`WidgetCard.tsx`), rendering pure edge-to-edge camera views with absolute-positioned floating remove controls (`✕`).
- **2026-08-08**: Switched target deployment device to `192.168.1.67:5555` and set override display density to `wm density 309`.
- **2026-08-08**: Implemented native `SharedPreferences` persistence and `appWidgetId` host binding preservation:
  - Exported `allocateAppWidgetId()` and `deleteAppWidgetId()` native methods.
  - Checked `getAppWidgetInfo(appWidgetId)` before re-binding to prevent `widget binding not allowed` errors on app restart.
  - Retained configured camera feeds across force-closes, restarts, and reboots.
- **2026-08-08**: Re-architected layout into rows: Row 1 (Header & Controls Toolbar with Grid/Slider mode and 2/3/4 Tiles-per-Row selector) and Row 2 (Dynamic Responsive Widget Grid & Carousel).

---

## 3. Summary

### What Was Accomplished
- TV Remote D-Pad focus indicators and states implemented across header buttons, widget cards, and card action controls.
- Default focus (`hasTVPreferredFocus`) assigned to primary control.
- Added visual focus rings (`#38bdf8` cyan border, scale animation) for active TV card selection.
- Expanded camera card size to `540x380` for TV viewing.
- Implemented hold / long-press options modal (**View Live Stream**, **View Saved Clips**, **Delete Widget**).
- Implemented **Grid View** (default) vs. **Slide View** (carousel) layout switcher.
- Resolved unexported activity restriction for TP-Link Tapo camera live view via native `ImageView` `PendingIntent` click dispatch.
- Verified on physical Onn 4K box with zero focus traps.

### Deviations / Key Decisions
- Used `Pressable` with `onFocus`/`onBlur` handlers for seamless RN TV focus ring styling.
- Used `clickToken` native prop to dispatch touch events to child `ImageView` within `AppWidgetHostView` to trigger TP-Link Tapo camera live view `PendingIntent`.

### Leftover / Open Items
- None. Ready for Sprint 7 (Hardening & Deployment Runbook).
