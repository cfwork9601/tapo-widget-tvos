# Task Plan — Android TV D-Pad Navigation & Focus Hardening

**Document ID:** `TASK-DPAD-NAV-01`  
**Target:** `Tapo Widget Hub` (`com.widgetlauncher`)  
**Status:** Planned / Specification  
**Authoritative Reference:** [`docs/DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)  
**Related Specs:** [`docs/CHANNEL_PROPOSAL_PLAN.md`](./CHANNEL_PROPOSAL_PLAN.md), [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 1. Executive Summary & Problem Analysis

In dedicated Android TV applications, remote control D-Pad navigation (UP, DOWN, LEFT, RIGHT, SELECT) must be deterministic, fluid, and predictable (matching 10-foot UI standards seen in Netflix, YouTube, and Google TV).

### Current Pain Points
1. **Multi-Stop Focus Fragmentation**:
   - Each widget card in [`src/components/WidgetCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetCard.tsx) currently exposes **3 separate focusable elements**:
     - `⚙` (Options Button)
     - `✕` (Delete Button)
     - Main Widget Card Body
   - *Symptom*: Pressing **RIGHT** to navigate across a 3-camera grid requires 3 to 4 clicks per card (`Body -> ⚙ -> ✕ -> Card 2 ⚙ -> Card 2 ✕ -> Card 2 Body`), causing navigation to feel sluggish and erratic.
2. **Top-Bar to Grid Jumpiness**:
   - Pressing **DOWN** from the top header bar (`+ Add Tapo Widget`, `Grid/Slider`, `Tiles/Row`) causes Android's 2D spatial focus engine to latch onto the nearest mini button (`⚙` or `✕`) rather than the active camera card.
3. **Nested Scroll Container Conflict**:
   - Outer vertical `ScrollView` and inner horizontal/wrapped `ScrollView` both attempt spatial scrolling simultaneously when partial focus occurs.

---

## 2. Target Architecture: Unified Single-Focus Card

```
┌────────────────────────────────────────────────────────┐
│ [ Top Header Bar: Unified D-Pad Path ]                │
│  [+ Add Tapo Widget] [Grid] [Slider] [2] [3] [4] [⚙]   │
└──────────────────────────┬─────────────────────────────┘
                           │ (DOWN Key: Always lands on Card 1)
                           ▼
┌─────────────────── Card 1 ───────────────────┐  RIGHT ┌─────────────────── Card 2 ───────────────────┐
│ 🏠 Broilers_Farm_1                           │ ─────► │ 🏠 EggF_Front                                │
│                                              │        │                                              │
│    [ LIVE CAMERA SNAPSHOT PREVIEW ]          │        │    [ LIVE CAMERA SNAPSHOT PREVIEW ]          │
│    Last view at 14:08                        │        │    Last view at 09:26                        │
│                                              │        │                                              │
│ [ 1 Unified Focus Stop - Whole Card ]        │        │ [ 1 Unified Focus Stop - Whole Card ]        │
└──────────────────────────────────────────────┘        └──────────────────────────────────────────────┘
  │                                                       │
  ├── Press SELECT (OK) ──► Instant Full-Screen Live Stream
  └── Long-Press SELECT ──► Opens Action Modal (Configure, Rename, Delete)
```

---

## 3. Detailed Implementation Breakdown

### Phase 1: Streamline `WidgetCard.tsx` Focus Model
- [ ] Remove `focusable={true}` from `⚙` (Options) and `✕` (Delete) header buttons.
- [ ] Keep `⚙` and `✕` clickable for mouse/touch passthrough, but exclude them from the D-Pad focus hierarchy (`focusable={false}` on TV).
- [ ] Make the entire outer card the **single primary focusable target** (`focusable={true}`, `hasTVPreferredFocus`).
- [ ] Add prominent TV glow / border scale (`transform: [{ scale: 1.03 }]`, cyan glow border `#38bdf8`) to the entire focused card.

### Phase 2: Card Interaction & Context Actions
- [ ] **Short Press (SELECT / OK / Key 23 / Enter)**:
  - Dispatches native click to `"Go Live"` (or configured widget primary action) to immediately launch full-screen camera stream.
- [ ] **Long Press (400ms Hold or Remote MENU Key)**:
  - Opens `selectedWidget` options modal with:
    - 🎯 *Select / Change Camera Device* (launches Tapo native configure activity)
    - ⚙ *Configure Click Action* (Live Stream / Open App / None)
    - 🗑 *Remove Widget from Dashboard*
    - ✕ *Cancel*

### Phase 3: Spatial Focus Guiding (`nextFocus*`)
- [ ] Configure `nextFocusDown` on top header buttons (`+ Add Tapo Widget`, `Grid`, `Slider`) to point directly to the active widget grid.
- [ ] Configure `nextFocusUp` on top-row cards to cleanly return focus to `+ Add Tapo Widget`.
- [ ] Ensure horizontal navigation (`nextFocusRight` / `nextFocusLeft`) steps 1:1 between sibling cards without intermediate stops.

### Phase 4: ScrollView & Layout Stabilization
- [ ] Optimize `ScrollView` scrolling mechanics on Android TV (`nestedScrollEnabled={false}`, `scrollEventThrottle={16}`).
- [ ] Set `removeClippedSubviews={false}` to prevent off-screen widgets from losing Android TV focus state.

---

## 4. Acceptance Criteria & Verification Matrix

| Test Case | Expected Behavior |
| :--- | :--- |
| **Horizontal D-Pad Navigation** | Pressing **RIGHT** once moves focus immediately from Card 1 to Card 2 (1 remote click = 1 card jump). |
| **Top-to-Bottom Navigation** | Pressing **DOWN** from `+ Add Tapo Widget` moves focus cleanly to the first card in the active row. |
| **Live Stream Launch** | Pressing **OK (Select)** on any focused camera card opens `TapoPadVideoPlayV3Activity` full-screen live feed instantly. |
| **Card Options Menu** | Long-pressing **OK** (400ms) on a focused card opens the options modal allowing deletion or device reconfiguration. |
| **D-Pad Exit / Back Key** | Pressing **BACK** closes modals or exits app cleanly without focus entrapment. |

---

## 5. File Targets

1. [`src/components/WidgetCard.tsx`](file:///home/thanhtuan/projects/tvlnc/src/components/WidgetCard.tsx): Unify focus container, remove nested button focus stops, and enhance TV focus border scaling.
2. [`src/screens/HomeScreen.tsx`](file:///home/thanhtuan/projects/tvlnc/src/screens/HomeScreen.tsx): Implement top-bar directional focus anchors and simplify scroll container hierarchy.
3. [`docs/DEVELOPMENT_LOG.md`](file:///home/thanhtuan/projects/tvlnc/docs/DEVELOPMENT_LOG.md): Update task tracking and roadmap.
