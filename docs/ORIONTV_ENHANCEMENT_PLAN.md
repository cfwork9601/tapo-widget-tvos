# Tapo Widget Hub — OrionTV Architecture & Enhancement Plan

**Target Device:** onn. Streaming Device 4K Pro (`192.168.1.67:5555`, Android 14 / API 34)  
**Framework:** React Native TV (`react-native-tvos`) + React 19 + Expo Custom Dev Client  
**Branch:** `enhancing`  
**Reference Architecture:** [OrionTV Production Principles](../agent-rule/REACT_NATIVE_TVOS_GUIDELINES.md)  
**Date:** August 2026  

---

## 🎯 Executive Summary & Objectives

This document establishes the authoritative technical blueprint for refactoring and enhancing **Tapo Widget Hub** (`tvlnc`) into a modular, production-grade Android TV launcher adhering to **`react-native-tvos`** and **OrionTV** architectural principles.

### Key Objectives
1. **Modular Domain State (`zustand`)**: Deconstruct the monolithic `HomeScreen.tsx` (35 KB, ~1,100 lines) into dedicated domain stores and decoupled 10-foot UI sub-components.
2. **Spatial Navigation & Focus Engine (`TVFocusGuideView` & `useTVEventHandler`)**: Prevent D-Pad focus trapping across asymmetrical grids, introduce OrionTV high-contrast focus styling (`scale: 1.06`, `#89b4fa` glowing borders), and intercept TV remote hotkeys.
3. **Embedded Companion Web Server (`The OrionTV Pattern`)**: Run a zero-dependency background HTTP server on port `8080` with an on-screen SVG QR code, enabling smartphone-based widget reordering, quick text entry, and instant camera stream switching over local Wi-Fi.
4. **10-Foot Performance & Safe Overscan**: Apply 6% screen margin overscan protection and memoize callback/card rendering to eliminate frame drops on 2GB RAM Android TV hardware.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Android TV Display                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ TopBar (Clock, Status, Col Picker, QR Trigger)                     │  │
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
              ┌────────────────────┼────────────────────┐
              ▼                                         ▼
┌───────────────────────────┐             ┌───────────────────────────┐
│   Zustand Domain Stores   │             │ Embedded Companion Server │
│ - widgetStore             │             │ (CompanionServerModule.kt)│
│ - launcherStore           │◄────────────┤ Port 8080 HTTP Server     │
│ - companionServerStore    │   Commands  │ Serves Mobile Web App     │
└───────────────────────────┘             └───────────────────────────┘
                                                        ▲
                                                        │ WiFi (HTTP)
                                          ┌─────────────┴─────────────┐
                                          │ Smartphone Browser / QR   │
                                          │ http://192.168.1.67:8080  │
                                          └───────────────────────────┘
```

---

## 📋 Implementation Phases

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
    * `reorderWidgets(newOrder: ActiveWidget[])` — Reorder widget priority for phone/remote sync.
    * `updateWidgetAction(instanceId, action)` — Set primary click vs app launch vs none.
    * `updateWidgetLabel(instanceId, label)` — Dynamic name sync from Tapo `TextView` extraction.
    * `triggerCardClick(instanceId)` / `triggerCardConfigure(instanceId)`.

* **`launcherStore.ts`**:
  * **State**: Installed system apps, favorite apps, display density, and overscan safe margins.
  * **Actions**: `loadInstalledApps()`, `launchApp(packageName)`.

* **`companionServerStore.ts`**:
  * **State**:
    * `isRunning: boolean` — Server daemon state.
    * `port: number` — Default `8080`.
    * `localIp: string` — Discovered Wi-Fi IP address (e.g. `192.168.1.67`).
    * `serverUrl: string` — Formatted companion URL `http://<localIp>:8080`.
    * `isModalOpen: boolean` — QR code display modal visibility.
  * **Actions**:
    * `startServer()`, `stopServer()`, `toggleModal()`, `setLocalIp(ip)`.

#### 2. Component Decoupling (`src/components/`)
* **`TopBar.tsx`**: Header with live digital clock, active Tapo widget count badge, layout column selector, "Add Widget" trigger, and Mobile QR code trigger.
* **`WidgetGrid.tsx`**: Clean grid renderer utilizing dynamic column math and overscan padding.
* **`WidgetActionModal.tsx`**: Dedicated D-Pad modal for widget click action selection, live camera reconfiguration, and card deletion.
* **`CompanionServerModal.tsx`**: Modal presenting the on-screen QR Code, direct IP URL, and step-by-step smartphone connection guide.
* **`HomeScreen.tsx`**: Lightweight orchestrator (~100-150 lines) subscribing to stores and handling navigation boundaries.

---

### Phase 2: 🧭 D-Pad Focus & Spatial Navigation Overhaul

Implement 10-foot navigation principles to guarantee fluid remote control.

#### 1. Spatial Focus Trapping (`TVFocusGuideView`)
* Wrap `TopBar` navigation items in a `TVFocusGuideView` (`autoFocus={false}`) so horizontal D-Pad navigates cleanly across buttons.
* Wrap the `WidgetGrid` in a `TVFocusGuideView` (`autoFocus={true}`) to ensure seamless vertical traversal between the header bar and asymmetrical widget cards without focus loss.
* Enforce focus traps within modals to prevent background grid interaction when dialogs are open.

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

### Phase 3: 🌐 Embedded Companion Web Server (The OrionTV Pattern)

Provide instant phone-to-TV control without installing client apps.

#### 1. Native HTTP Server Daemon (`CompanionServerModule.kt`)
* Implemented as a Kotlin `ReactContextBaseJavaModule` using Java's standard `ServerSocket` in a background daemon thread (`Executors.newSingleThreadExecutor()`).
* Automatically resolves the TV's Wi-Fi IPv4 address using `NetworkInterface.getNetworkInterfaces()`.
* Serves a responsive HTML5/CSS3/Vanilla JS single-page web app on `http://<TV_IP>:8080/`:
  * **Card Manager Tab**: Drag-and-drop / up-down buttons to reorder active launcher widgets.
  * **Camera Control Tab**: Quick buttons to launch full-screen camera feeds (`Broilers_Farm_1`, `EggF_Front`, `EggF_House1`).
  * **Virtual Input & Remote Tab**: Virtual D-Pad and text input field for sending strings directly to the TV.
* REST API Endpoints:
  * `GET /api/status`: Returns current active widgets, layout mode, and server status.
  * `POST /api/widgets/reorder`: Accepts JSON payload of reordered widget IDs.
  * `POST /api/camera/stream`: Launches camera feed via `widget-hub://live?name=...`.
  * `POST /api/remote/key`: Dispatches TV remote actions.

#### 2. Native Bridge & Package Registration
* Register `CompanionServerModule` in `plugins/widgethost/AppWidgetHostPackage.kt`.
* Ensure files are copied during prebuild in `plugins/withNativeWidgetHost.js`.
* Expose JS bridge methods in `src/services/CompanionServerService.ts`:
  * `startCompanionServer(port: number): Promise<{ success: boolean; ip: string; port: number }>`
  * `stopCompanionServer(): Promise<boolean>`
  * `getCompanionServerStatus(): Promise<{ running: boolean; ip: string; port: number }>`

#### 3. Pure-JS SVG QR Code Generator (`src/utils/qrCode.ts`)
* Embedded lightweight QR matrix generator rendering clean SVG paths (`react-native-svg`) on TV without internet dependencies.

---

### Phase 4: ⚡ TV Performance & 10-Foot UI Optimizations

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
│   ├── CompanionServerModal.tsx  # [NEW] TV QR code & mobile connect modal
│   ├── TapoProviderPickerModal.tsx # [EXISTING] Provider picker
│   ├── TopBar.tsx                # [NEW] TV header bar with clock & shortcuts
│   ├── WidgetActionModal.tsx     # [NEW] Card settings & action modal
│   ├── WidgetCard.tsx            # [MODIFIED] OrionTV focus pop & memoization
│   └── WidgetGrid.tsx            # [NEW] Overscan-aware TVFocusGuideView grid
├── screens/
│   └── HomeScreen.tsx            # [MODIFIED] Modular screen orchestrator (~120 lines)
├── services/
│   ├── CompanionServerService.ts # [NEW] JS bridge to native HTTP server
│   └── WidgetProviderService.ts  # [EXISTING] Native widget host bridge
├── stores/
│   ├── companionServerStore.ts   # [NEW] Companion server Zustand store
│   ├── launcherStore.ts          # [NEW] System launcher & TV preferences store
│   └── widgetStore.ts            # [NEW] Widget list & configuration store
└── utils/
    └── qrCode.ts                 # [NEW] Lightweight SVG QR code matrix generator

plugins/
├── widgethost/
│   ├── AppWidgetHostPackage.kt   # [MODIFIED] Register CompanionServerModule
│   ├── CompanionServerModule.kt  # [NEW] Embedded background HTTP server daemon
│   └── ... (existing native files)
└── withNativeWidgetHost.js       # [MODIFIED] Include CompanionServerModule in prebuild
```

---

## 🧪 Verification & Hardware Testing Checklist

| Step | Verification Command / Action | Expected Result |
|---|---|---|
| **1. TypeScript Check** | `npx tsc --noEmit` | Pass with 0 type errors across all stores and components. |
| **2. Clean Prebuild** | `npx expo prebuild -p android --clean` | Prebuild succeeds; Kotlin companion server files synchronized. |
| **3. Kotlin Compilation** | `./gradlew :app:compileDebugKotlin` | Native bridge builds cleanly with 0 errors. |
| **4. Live Deployment** | `./scripts/deploy.sh` | Installs and launches `com.widgetlauncher` on Onn 4K Pro (`192.168.1.67:5555`). |
| **5. Spatial Focus Test** | D-Pad navigation on remote | TopBar to Grid transitions smoothly; `scale: 1.06` pop with `#89b4fa` glow. |
| **6. TV Hotkey Test** | Remote `Menu` / `PlayPause` | Opens options modal / starts Tapo camera stream. |
| **7. Mobile Companion Test** | Scan TV QR Code on phone | Mobile web UI loads at `http://192.168.1.67:8080`; reorders widgets and triggers camera live view in real-time. |
| **8. Session Logging** | Update `docs/DEVELOPMENT_LOG.md` | Log commit hashes, validation records, and active conversation ID. |
