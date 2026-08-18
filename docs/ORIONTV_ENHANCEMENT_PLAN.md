# Tapo Widget Hub — OrionTV Architecture & Phased Enhancement Plan

**Target Device:** onn. Streaming Device 4K Pro (`192.168.1.67:5555`, Android 14 / API 34)  
**Framework:** React Native TV (`react-native-tvos`) + React 19 + Expo Custom Dev Client  
**Branch:** `enhancing`  
**Reference Architecture:** [OrionTV Production Principles](../agent-rule/REACT_NATIVE_TVOS_GUIDELINES.md)  
**Date:** August 2026  

---

## 🎯 Executive Summary & Objectives

This document establishes the authoritative technical blueprint for refactoring and enhancing **Tapo Widget Hub** (`tvlnc`) into a modular, production-grade Android TV launcher adhering to **`react-native-tvos`** and **OrionTV** architectural principles.

### Key Objectives
1. **Modular Domain State (`zustand`)**: Deconstruct the monolithic `HomeScreen.tsx` (35 KB, ~1,100 lines) into dedicated domain stores (`widgetStore.ts`, `launcherStore.ts`) and decoupled 10-foot UI sub-components.
2. **Spatial Navigation & Focus Engine (`TVFocusGuideView` & `useTVEventHandler`)**: Prevent D-Pad focus trapping across asymmetrical grids, introduce OrionTV high-contrast focus styling (`scale: 1.06`, `#89b4fa` glowing borders), and intercept TV remote hotkeys (Menu for options, Play/Pause for live streams, Color/D-Pad shortcuts).
3. **10-Foot Performance & Safe Overscan**: Apply 6% screen margin overscan protection and memoize callback/card rendering to eliminate frame drops on 2GB RAM Android TV hardware.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Android TV Display                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ TopBar (Live Clock, Status Badge, Column Picker, Add Widget)       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ TVFocusGuideView Container (Overscan Protected: 6% Margins)        │  │
│  │  ┌─────────────────────────┐     ┌─────────────────────────┐      │  │
│  │  │ WidgetCard (scale 1.06) │     │ WidgetCard (scale 1.00) │      │  │
│  │  │ Glow: #89b4fa / Elev 12 │     │ Tapo Camera / Plug      │      │  │
│  │  └─────────────────────────┘     └─────────────────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Zustand Domain Stores                          │
│                                                                         │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │ widgetStore.ts                  │   │ launcherStore.ts            │  │
│  │ - activeWidgets                 │   │ - installedApps             │  │
│  │ - providers                     │   │ - favoriteShortcuts         │  │
│  │ - layoutMode & tilesPerRow      │   │ - displayDensity & overscan │  │
│  │ - clickTokens & configureTokens │   │                             │  │
│  └─────────────────────────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phased Implementation Roadmap

### Phase 1: 🗄️ State Architecture & Component Decomposition

Deconstruct the monolithic `HomeScreen.tsx` into single-responsibility stores and modular sub-components.

#### 1. Domain Stores (`src/stores/`)
* **`widgetStore.ts`**:
  * **State**:
    * `activeWidgets: ActiveWidget[]` — List of configured Tapo widgets.
    * `providers: WidgetProviderInfo[]` — Installed `com.tplink.iot` providers.
    * `tilesPerRow: number` — Grid layout column count (2, 3, or 4).
    * `layoutMode: 'grid' | 'slide'` — Active layout representation.
    * `selectedWidget: ActiveWidget | null` — Currently selected card for action modal.
    * `triggerClickTokens: Record<string, number>` — Per-widget click trigger tokens.
    * `triggerConfigureTokens: Record<string, number>` — Native configuration triggers.
  * **Actions**:
    * `loadSavedWidgets()` / `saveWidgets()` — Async persistence via `WidgetProviderService`.
    * `addWidget(provider)` / `removeWidget(instanceId)` — ID allocation and lifecycle deletion.
    * `reorderWidgets(newOrder: ActiveWidget[])` — Reorder widget priority.
    * `updateWidgetAction(instanceId, action)` — Set primary click vs app launch vs none.
    * `updateWidgetLabel(instanceId, label)` — Dynamic name sync from Tapo `TextView` extraction.
    * `triggerCardClick(instanceId)` / `triggerCardConfigure(instanceId)`.

* **`launcherStore.ts`**:
  * **State**: Installed system apps, favorite apps, display density, and overscan safe margins.
  * **Actions**: `loadInstalledApps()`, `launchApp(packageName)`.

#### 2. Component Decoupling (`src/components/`)
* **`TopBar.tsx`**: Header with live digital clock, active Tapo widget count badge, layout column selector, and "Add Widget" trigger button.
* **`WidgetGrid.tsx`**: Clean grid renderer utilizing dynamic column math and overscan padding.
* **`WidgetActionModal.tsx`**: Dedicated D-Pad modal for widget click action selection, live camera reconfiguration, and card deletion.
* **`HomeScreen.tsx`**: Lightweight orchestrator (~100-150 lines) subscribing to stores and handling navigation boundaries.

---

### Phase 2: 🧭 D-Pad Focus & Spatial Navigation Overhaul

Implement 10-foot navigation principles to guarantee fluid remote control.

#### 1. Spatial Focus Trapping (`TVFocusGuideView`)
* Wrap `TopBar` navigation items in a `TVFocusGuideView` (`autoFocus={false}`) so horizontal D-Pad navigates cleanly across buttons.
* Wrap the `WidgetGrid` in a `TVFocusGuideView` (`autoFocus={true}`) to ensure seamless vertical traversal between the header bar and asymmetrical widget cards without focus loss.
* Enforce focus traps within modals (`TapoProviderPickerModal`, `WidgetActionModal`) to prevent background grid interaction when dialogs are open.

#### 2. OrionTV High-Contrast Visual States (`WidgetCard.tsx`)
* **Scale Pop**: `transform: [{ scale: focused ? 1.06 : 1.0 }]` with smooth hardware acceleration.
* **Glowing Accent Border**: `#89b4fa` (cyan/lavender highlight) with 3px border radius styling when focused.
* **Elevation & Shadow**:
  ```typescript
  cardFocused: {
    borderColor: '#89b4fa',
    backgroundColor: '#1e293b',
    transform: [{ scale: 1.06 }],
    elevation: 12,
    shadowColor: '#89b4fa',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  }
  ```

#### 3. Remote Hotkey Event Interception (`useTVEventHandler`)
* `menu`: Opens `WidgetActionModal` for the currently focused card.
* `playPause`: Triggers full-screen live camera view for the selected camera card.
* `fastForward` / `rewind`: Quick cycles grid density (2 -> 3 -> 4 columns).

---

### Phase 3: ⚡ TV Performance & 10-Foot UI Optimizations

Target 60fps responsiveness on 2GB RAM Android TV hardware (Onn 4K Pro).

1. **Safe Overscan Padding**:
   * Implement 6% screen margin (`paddingHorizontal: 48`, `paddingVertical: 32` for 1080p/4K) to avoid UI clipping on standard TV panels.
2. **Component Memoization**:
   * Wrap `WidgetCard`, `TopBar`, and `ControlButton` in `React.memo` with custom prop comparison to prevent unnecessary re-renders during D-Pad movement.
3. **Memory & Surface Cleanup**:
   * Ensure `appWidgetHost.deleteAppWidgetId()` and bitmap surface releases occur promptly on card removal.

---

## 📁 File Structure & Change Manifest

```text
src/
├── components/
│   ├── TapoProviderPickerModal.tsx # [EXISTING] Provider picker
│   ├── TopBar.tsx                # [NEW] TV header bar with clock & shortcuts
│   ├── WidgetActionModal.tsx     # [NEW] Card settings & action modal
│   ├── WidgetCard.tsx            # [MODIFIED] OrionTV focus pop & memoization
│   └── WidgetGrid.tsx            # [NEW] Overscan-aware TVFocusGuideView grid
├── screens/
│   └── HomeScreen.tsx            # [MODIFIED] Modular screen orchestrator (~120 lines)
├── services/
│   └── WidgetProviderService.ts  # [EXISTING] Native widget host bridge
└── stores/
    ├── launcherStore.ts          # [NEW] System launcher & TV preferences store
    └── widgetStore.ts            # [NEW] Widget list & configuration store
```

---

## 🧪 Verification & Hardware Testing Checklist

| Step | Verification Command / Action | Expected Result |
|---|---|---|
| **1. TypeScript Check** | `npx tsc --noEmit` | Pass with 0 type errors across all stores and components. |
| **2. Clean Prebuild** | `npx expo prebuild -p android --clean` | Prebuild succeeds without errors. |
| **3. Kotlin Compilation** | `./gradlew :app:compileDebugKotlin` | Native bridge builds cleanly with 0 errors. |
| **4. Live Deployment** | `./scripts/deploy.sh` | Installs and launches `com.widgetlauncher` on Onn 4K Pro (`192.168.1.67:5555`). |
| **5. Spatial Focus Test** | D-Pad navigation on remote | TopBar to Grid transitions smoothly; `scale: 1.06` pop with `#89b4fa` glow. |
| **6. TV Hotkey Test** | Remote `Menu` / `PlayPause` | Opens options modal / starts Tapo camera stream. |
| **7. Session Logging** | Update `docs/DEVELOPMENT_LOG.md` | Log commit hashes, validation records, and active conversation ID. |
