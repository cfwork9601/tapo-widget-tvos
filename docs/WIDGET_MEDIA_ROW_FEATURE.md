# Technical Specification: Tapo TV Widget Media Row & Monet-Style Customizer

**Project**: `Tapo Widget Hub` (`com.widgetlauncher`)  
**Target Platform**: Android TV / Google TV (API 34 / Android 14, Onn 4K Pro)  
**Author**: Engineering Team  
**Date**: August 2026  
**Status**: Specification & Architectural Blueprint  

---

## 1. Context & Purpose: Restoring Hidden Widgets to Android TV

Android TV and Google TV **deliberately hide and disable the Android `AppWidget` subsystem**, leaving smart home users with no way to display or interact with widgets provided by apps like **TP-Link Tapo (`com.tplink.iot`)**.

`Tapo Widget Hub` solves this by acting as a dedicated Android TV HOME launcher. This feature implements **Tapo widgets as First-Class TV Media Cards** (modeled directly on Monet Launcher and Android TV YouTube recommendation cards), allowing users to browse live smart home widgets across their television screen with full D-Pad remote control.

---

## 2. Media Row Architecture & YouTube Card Parity

```
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|  📺 Tapo Smart Home (Customizable Row Name)                                                                 |
|                                                                                                             |
|  +───────────────────────────+  +───────────────────────────+  +───────────────────────────+  +──────────+ |
|  | [ LIVE CAMERA REMOTE-VIEW ]|  | [ LIVE CAMERA REMOTE-VIEW ]|  | [ SMART PLUG REMOTE-VIEW ]|  |    +     | |
|  |                           |  |                           |  |                           |  |   Add    | |
|  |                           |  |                           |  |                           |  |  Widget  | |
|  | ───────────────────────── |  | ───────────────────────── |  | ───────────────────────── |  |   Card   | |
|  | Front Yard Camera • LIVE  |  | Backyard Camera • LIVE    |  | Living Room Plug • ON     |  |          | |
|  +───────────────────────────+  +───────────────────────────+  +───────────────────────────+  +──────────+ |
|     16:9 Widescreen Card           16:9 Widescreen Card           16:9 Widescreen Card                      |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### Core Parity with YouTube Recommendation Cards:
1. **16:9 Widescreen Form Factor**: Standard cinematic ratio with `borderRadius: 18` and glassmorphism styling.
2. **Instant One-Click Action**: Pressing Select on a camera card launches **`TapoPadVideoPlayV3Activity` (Full-Screen Live View)** immediately; pressing Select on a plug/bulb toggles state in-place.
3. **Contextual Monet-Style Side-Sheet**: Long-pressing a card opens a right-aligned configuration drawer to adjust cards-per-row density (2, 3, 4), toggle "Hide titles", rename devices, or delete cards.
4. **TV Remote D-Pad Navigation**: Smooth focus scaling (`1.05x`) with active cyan highlight ring (`#38BDF8`).

---

## 3. Implementation Checklist

- [ ] **1. `WidgetMediaCard.tsx`**: 16:9 widescreen card embedding live `AppWidgetView` with edge-to-edge layout and bottom gradient title.
- [ ] **2. `HomeScreen.tsx` Horizontal Media Row**: D-Pad navigable horizontal list with row header and inline `+ Add Widget` card.
- [ ] **3. `WidgetRowSettingsModal.tsx`**: Right-aligned slide-out customization drawer (cards per row, hide titles toggle, show row name, rename, click actions).
- [ ] **4. Hardware Validation on Onn 4K Box (`192.168.1.67:5555`)**: Verify focus physics, instant live view launch, and settings persistence.
