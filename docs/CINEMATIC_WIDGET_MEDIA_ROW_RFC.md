# RFC: Cinematic 16:9 Widget Media Row & Side-Sheet Customizer Architecture

**Status**: Proposed Architecture & Technical Design  
**Target Platform**: Android TV (API 34 / Android 14, Onn 4K Streaming Box Pro)  
**Package**: `com.widgetlauncher` (`Tapo Widget Hub`)  
**Author**: Engineering Team  
**Date**: August 2026  
**Intended Audience**: Systems Engineers, TV UI Architects, React Native & Native Android Bridge Developers  

---

## 1. Executive Summary & Problem Statement

### 1.1 Context & Current Baseline State
`Tapo Widget Hub` is a custom Android TV home launcher built with **React Native 0.86** and **Expo SDK 57 (Custom Dev Client)**, backed by a native Kotlin bridge (`AppWidgetHostManager`, `AppWidgetViewManager`, `AppWidgetModule`). It hosts live Android `AppWidget` instances directly on the TV home screen without user-facing permission dialogs by utilizing pre-granted silent binding (`appwidget grantbind`).

In the current implementation:
* Widgets are rendered inside basic grid cards ([`src/components/WidgetCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetCard.tsx)) arranged in a vertical wrapping grid or simple slider on [`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx).
* Selecting a Tapo camera widget triggers a native MotionEvent dispatch and depth-first search (DFS) view-tree introspection that bypasses Android's unexported `SecurityException` (`exported="false"` on `WidgetClickActivity`), launching **`TapoPadVideoPlayV3Activity` (Full-Screen Live Camera Stream)** directly.
* The device currently has 13 cataloged Tapo widget providers (Cameras, Smart Plugs, Smart Bulbs, Sensors, Radiator Valves, Vacuum Cleaners), with live camera feeds, plugs, and bulbs verified on hardware.

### 1.2 The Problem
While functionally capable, the current interface has several user-experience and visual limitations:
1. **Generic Dashboard Feel**: The current UI resembles a standard utility dashboard with thick header bars and uniform square cards, rather than a premium, cinematic 10-foot media launcher.
2. **Lack of Cinematic 16:9 Presentation**: Modern Android TV interfaces (e.g. Google TV recommendations, Monet Launcher) use widescreen 16:9 media cards with edge-to-edge artwork and subtle bottom typographic gradients.
3. **Cluttered Card Controls**: Current cards feature explicit header bars with title text, settings gears, and delete buttons attached to every card, causing visual noise on a television screen.
4. **Rigid Settings UI**: Changing layout preferences currently relies on global top-toolbar buttons rather than contextual, slide-out configuration side-sheets.

---

## 2. Design Inspiration & Benchmark Analysis

Modern TV media rows (as benchmarked from Android TV's `TvContract.PreviewPrograms` and Monet Launcher's UI) employ four core design tenets optimized for 10-foot viewing distances:

```
+---------------------------------------------------------------------------------------------------------------+
|  📷 Tapo Smart Surveillance (Customizable Category Header)                                                   |
|                                                                                                               |
|  +-----------------------------+  +-----------------------------+  +-----------------------------+  +-------+ |
|  | [ LIVE REMOTE-VIEWS FEED ]  |  | [ LIVE REMOTE-VIEWS FEED ]  |  | [ LIVE SMART PLUG FEED ]   |  |   +   | |
|  |                             |  |                             |  |                             |  |  Add  | |
|  |                             |  |                             |  |                             |  | Widget| |
|  | ═══════════════════════════ |  | ═══════════════════════════ |  | ═══════════════════════════ |  | Tile  | |
|  | Front Yard Cam • 1080p HD   |  | Backyard Cam • 1080p HD     |  | Living Room Plug • ACTIVE   |  |       | |
|  +-----------------------------+  +-----------------------------+  +-----------------------------+  +-------+ |
|     (Cinematic 16:9 Card)            (Cinematic 16:9 Card)            (Cinematic 16:9 Card)                   |
+---------------------------------------------------------------------------------------------------------------+
```

1. **Widescreen 16:9 Form Factor**: Matches the native TV aspect ratio, making video snapshots and controls feel integrated into the media environment.
2. **Edge-to-Edge Content Bleed**: Eliminates inner padding, embedding the live widget view seamlessly inside rounded glass containers (`borderRadius: 18`, `overflow: 'hidden'`).
3. **Subtle Gradient Overlays**: Overlays device labels, status indicators, and live badges over a dark bottom gradient (`#000000D0` to `transparent`), with a toggleable **"Hide titles"** mode.
4. **Slide-Out Side-Sheet Panel**: A right-aligned modal drawer that appears on long-press, providing dense, D-pad navigable controls (density, title toggles, renaming, click actions) without obscuring the background wallpaper.

---

## 3. Core Architectural Challenges & Technical Solutions

### 3.1 Embedding Live Native AppWidgets in 16:9 Widescreen Containers
Unlike static images used in video streaming apps, Android `AppWidget` layouts (`RemoteViews`) are declared by third-party packages with arbitrary minimum dimensions (e.g. `250dp x 180dp` for Tapo Camera, `180dp x 40dp` for Smart Plug).

#### Challenge:
If an `AppWidgetHostView` is placed inside a 16:9 container, Android's internal `RemoteViews` layout rules can cause letterboxing, unwanted margins, or clipped text.

#### Solution:
* **Container Math**:
  $$\text{availableWidth} = \text{screenWidth} - (2 \times \text{horizontalPadding})$$
  $$\text{cardWidth} = \frac{\text{availableWidth} - ((\text{cardsPerRow} - 1) \times \text{gap})}{\text{cardsPerRow}}$$
  $$\text{cardHeight} = \text{cardWidth} \times \frac{9}{16}$$
* **Native Scaling & Inset Normalization**:
  In [`plugins/widgethost/AppWidgetViewManager.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetViewManager.kt), configure `AppWidgetHostView` to remove default OS widget padding on API 34 (`setPadding(0, 0, 0, 0)`) and expand child `FrameLayout` layouts to fill `MATCH_PARENT`.

### 3.2 Touch & Gesture Interception for TV D-Pad Remote
Android `AppWidgetHostView` instances often contain internal click handlers and touch listeners created by third-party apps that consume `MotionEvent` events before React Native's `<Pressable>` can detect a long-press.

#### Challenge:
Standard TV remote Select button long-presses (held for 400ms) get swallowed by the inner Tapo widget `RemoteViews`, preventing the launcher from opening the configuration side-sheet.

#### Solution:
In [`plugins/widgethost/AppWidgetViewManager.kt`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetViewManager.kt):
```kotlin
class AppWidgetViewContainer(context: Context, private val hostManager: AppWidgetHostManager) : FrameLayout(context) {

  // Intercept touch events so React Native Pressable receives gestures reliably
  override fun onInterceptTouchEvent(ev: MotionEvent?): Boolean {
    return true
  }
  
  // ... clickToken DFS & MotionEvent dispatching ...
}
```
In [`src/components/WidgetMediaCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetMediaCard.tsx):
Implement TV D-Pad `onKeyPress` interceptor mapping `Select` / `Enter` / keycodes `23` / `66` with a `400ms` hold timer to trigger the slide-out customization panel, while short presses fire the standard click token.

### 3.3 Re-Calibrating Coordinate Math for Direct Live Stream Launching
When a camera tile is pressed, the launcher bypasses `SecurityException` by dispatching a synthetic touch down to `AppWidgetHostView`.

#### Primary Strategy: Depth-First Search (DFS) Tree Introspection
Traverse the inflated `AppWidgetHostView` view tree to locate the camera preview `ImageView` and invoke `performClick()`.

#### Secondary Strategy: Fallback Coordinate Math
If the snapshot container is wrapped inside an un-clickable layout, synthetic `MotionEvent` (DOWN + UP) is dispatched:
* In standard 4:3 cards: target point was $(x = 50\%, y = 60\%)$.
* In 16:9 widescreen cards: the camera viewport occupies $y \in [15\%, 85\%]$. Target point $(x = 50\%, y = 50\%)$ lands directly in the center of the live snapshot feed.

---

## 4. Detailed Component Specifications

```
                     +---------------------------------------+
                     |              HomeScreen               |
                     |  - Horizontal Media Row ScrollView    |
                     |  - D-Pad Focus Grid Coordinates       |
                     +---------------------------------------+
                                    |         |
                  +-----------------+         +-----------------+
                  |                                             |
                  v                                             v
     +--------------------------+                 +---------------------------+
     |     WidgetMediaCard      |                 |   WidgetRowSettingsModal  |
     | - 16:9 Glassmorphism Box |                 | - Right Slide-Out Drawer  |
     | - Native AppWidgetView   |                 | - Cards Per Row (2/3/4)   |
     | - Bottom Gradient Title  |                 | - Hide Titles Toggle      |
     | - TV Focus Scale (1.05x) |                 | - Rename & Delete Actions |
     +--------------------------+                 +---------------------------+
                  |
                  v
     +--------------------------+
     | Native Kotlin Bridge     |
     | - AppWidgetViewManager   |
     | - AppWidgetHostManager   |
     +--------------------------+
```

### 4.1 `WidgetMediaCard.tsx`
A focusable React Native component rendering an individual 16:9 widget tile:

```typescript
export interface WidgetMediaCardProps {
  widget: ActiveWidget;
  width: number;
  height: number;
  hideTitle: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}
```

* **Visual States**:
  * **Default**: `#121620` dark glass, `borderRadius: 18`, `borderWidth: 1.5`, `borderColor: '#1E293B'`.
  * **Focused**: Smooth scale `1.05x`, `borderColor: '#38BDF8'`, `borderWidth: 3`, glowing cyan shadow.
  * **Error / Unbound**: Fallback dark card with retry bind button and provider class label.
* **Bottom Gradient Overlay**:
  * Linear gradient positioned at bottom: `height: 60`, background `#000000D0` to `transparent`.
  * Renders `widget.customLabel || widget.label` in `16sp` semi-bold white text.
  * Hidden when `hideTitle === true`.

### 4.2 `HomeScreen.tsx` Horizontal Media Row
* **Layout**:
  * A horizontal `ScrollView` (`horizontal={true}`, `showsHorizontalScrollIndicator={false}`).
  * `rowHeader`: Category name (e.g. `📷 Tapo Surveillance`) with clean uppercase tracking.
  * Inline `+ Add Widget` card at index `widgets.length`.
* **D-Pad Focus Rules**:
  * `Left` / `Right`: Traverses adjacent widget media cards smoothly.
  * `Up`: Navigates to top header toolbar (`+ Add Tapo Widget`, `⚙ Settings`).
  * `Down`: Navigates to secondary rows or bottom app drawer.

### 4.3 `WidgetRowSettingsModal.tsx` (Slide-Out Customizer)
A right-aligned slide-out modal modeled after Monet Launcher's configuration panel:

```
+-------------------------------------------------------------+
|                                    Tapo Surveillance        |
|                                    Media row settings       |
|                                                             |
|  [📷] Row Visibility               (▲)  (▼)  [ (•) ON ]     |
|       Display surveillance row                              |
|                                                             |
|  [📺] Displayed cards                             4 cards > |
|                                                             |
|  [⊞] Media cards per row                        3 per row > |
|                                                             |
|  [TT] Hide titles                                [ (•) ON ] |
|       Show only artwork without text overlay                |
|                                                             |
|  [T]  Show row name                             [ (•) ON ]  |
|                                                             |
|  [✎] Rename row                                           > |
|                                                             |
|  [⚙] Selected Card Click Action            Live Stream V3 > |
|                                                             |
|  [✕] Remove Widget Card                     Delete from TV  |
+-------------------------------------------------------------+
```

---

## 5. Persistence Schema & Migration Strategy

All configuration parameters are stored in Android `SharedPreferences` under `widgetlauncher_prefs` via [`AppWidgetModule.saveSetting()`](file:///home/thanhtuan/projects/tvlnc/plugins/widgethost/AppWidgetModule.kt).

### 5.1 JSON Schema

```typescript
export interface RowSettings {
  rowTitle: string;
  showRowTitle: boolean;
  cardsPerRow: 2 | 3 | 4;
  hideTitles: boolean;
}

export interface ActiveWidget {
  instanceId: string;
  appWidgetId?: number;
  packageName: string;
  className: string;
  label: string;
  customLabel?: string;
  clickAction: 'widget_primary' | 'open_tapo_app' | 'none';
}
```

### 5.2 Schema Migration
When restoring state on startup:
1. If `row_settings` does not exist, initialize with defaults:
   `{ rowTitle: "Tapo Smart Home", showRowTitle: true, cardsPerRow: 3, hideTitles: false }`.
2. Existing `active_widgets` array entries are preserved without breaking existing `appWidgetId` bindings.

---

## 6. Performance, Thermal & Memory Budget

Hosting multiple live `AppWidgetHostView` instances on streaming hardware (e.g. Onn 4K Pro with Amlogic S905X4 quad-core ARM Cortex-A55 @ 2.0 GHz, 3GB RAM):

| Resource | Budget / Limit | Implementation Safeguard |
|---|---|---|
| **Resident RAM** | < 120 MB | Unmounted widget cards trigger immediate `AppWidgetHostManager.deleteAppWidgetId()` to prevent native memory leaks. |
| **Activity Lifecycle** | 0% background CPU | `AppWidgetHost.startListening()` runs only in `onResume()`; `stopListening()` is invoked in `onPause()`. |
| **GPU Overdraw** | < 2x overdraw | Hardware-accelerated views use `renderToHardwareTextureAndroid` with clipped bounds to prevent off-screen overdraw. |
| **D-Pad Latency** | < 16ms frame time | Pure React memoization (`React.memo`) on `WidgetMediaCard` to prevent re-rendering unaffected cards during focus changes. |

---

## 7. Expert Discussion Points & Edge Cases

1. **Non-Camera Widget Form Factors**:
   - Camera widgets have naturally square or 4:3 viewports that look good in 16:9 widescreen tiles.
   - For narrow widgets (e.g. Smart Plug `180x40dp` or Sensor `40x40dp`), should the tile use center alignment with subtle ambient blur background, or stretch edge-to-edge?
2. **Multi-Row Organization**:
   - Should future iterations support multiple distinct rows (e.g. Row 1: *"Cameras"*, Row 2: *"Plugs & Lights"*, Row 3: *"Sensors"*)?
3. **Dynamic Frame Rate Throttling**:
   - When a camera tile is not focused, RemoteViews are updated by Tapo's standard broadcast interval. When focused, should the launcher offer an auto-refresh snapshot poll?

---

## 8. Implementation Checklist

- [ ] **Phase A: Component Foundation**:
  - Implement [`src/components/WidgetMediaCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetMediaCard.tsx) with 16:9 aspect ratio math, glassmorphism styling, and bottom gradient overlay.
- [ ] **Phase B: Customizer Side-Sheet**:
  - Implement `src/components/WidgetRowSettingsModal.tsx` matching the Monet-style TV drawer.
- [ ] **Phase C: HomeScreen Integration**:
  - Replace vertical grid in [`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx) with horizontal media row and header.
- [ ] **Phase D: Hardware Verification on Target Device (`192.168.1.67:5555`)**:
  - Verify D-pad focus scaling, Select key live view launching, long-press drawer opening, and title hiding.
