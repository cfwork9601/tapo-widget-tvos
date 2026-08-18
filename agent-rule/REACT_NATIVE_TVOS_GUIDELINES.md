# React Native TVOS Guidelines & 10-Foot UI Design

This guide details best practices, UI patterns, and remote control (D-Pad) focus management for Android TV applications using `react-native-tvos` and Expo.

---

## 1. The 10-Foot UI Philosophy

Android TV interfaces are viewed from 6 to 10 feet away and operated exclusively via a directional D-Pad remote control (UP, DOWN, LEFT, RIGHT, SELECT/OK, BACK, MENU).

### Core Principles
- **No Cursor / Pointer Assumption**: Everything interactive must be reachable via spatial 2D D-Pad steps.
- **High Contrast Focus Visibility**: The currently focused element must be unmistakably obvious across the room.
- **Predictable Spatial Jumping**: 1 remote click must equal 1 logical UI jump. No erratic focus jumping across unrelated containers.
- **Glanceable Information**: Large typography, clean padding, and minimal visual noise.

---

## 2. Unified Single-Focus Card Pattern

### Problem: Focus Fragmentation
When a card contains internal interactive elements (such as `⚙` Settings or `✕` Delete buttons alongside the card body), Android's 2D focus engine steps through each mini-button sequentially.
- *Example Failure*: Moving RIGHT across 3 cards takes 9 remote clicks (`Body -> ⚙ -> ✕ -> Card 2 ⚙ -> Card 2 ✕ -> Card 2 Body...`).

### Target Architecture: Single Unified Focus Stop
```
┌─────────────────── Card 1 ───────────────────┐  RIGHT ┌─────────────────── Card 2 ───────────────────┐
│ 🏠 Camera 1                                  │ ─────► │ 🏠 Camera 2                                  │
│                                              │        │                                              │
│    [ LIVE MEDIA / CONTENT PREVIEW ]          │        │    [ LIVE MEDIA / CONTENT PREVIEW ]          │
│                                              │        │                                              │
│ [ 1 Unified Focus Stop - Whole Card ]        │        │ [ 1 Unified Focus Stop - Whole Card ]        │
└──────────────────────────────────────────────┘        └──────────────────────────────────────────────┘
  │                                                       │
  ├── Short-Press SELECT (OK) ──► Primary Action (Full-screen view, Play, Open)
  └── Long-Press SELECT (400ms) ──► Opens Action Modal (Configure, Rename, Delete)
```

### Implementation in React Native TVOS:
1. **Disable nested button focus**: Set `focusable={false}` on inner buttons for TV navigation (while keeping touch/mouse passthrough if needed).
2. **Make the outer container focusable**:
   ```tsx
   <Pressable
     focusable={true}
     hasTVPreferredFocus={isFirstItem}
     onFocus={() => setIsFocused(true)}
     onBlur={() => setIsFocused(false)}
     onPress={handlePrimaryPress}
     onLongPress={handleContextMenu}
     style={({ pressed }) => [
       styles.card,
       isFocused && styles.cardFocused,
       pressed && styles.cardPressed,
     ]}
   >
     {/* Card Content */}
   </Pressable>
   ```

---

## 3. Focus Visual Styling

TV focus states should provide immediate visual feedback via:
- **Glow & Border Highlight**: Dynamic border color (e.g. Cyan `#38bdf8` or Accent `#60a5fa`) with `borderWidth: 2` or `3`.
- **Scale Transform**: Subtle magnification to create a 3D elevation effect:
  ```tsx
  transform: [{ scale: isFocused ? 1.04 : 1.0 }]
  ```
- **Drop Shadows / Elevation**: Elevated shadow radius when focused.

---

## 4. Directional Spatial Anchors (`nextFocus*`)

When navigating between distinct UI regions (e.g. Top Header Bar <-> Content Grid), automatic 2D focus calculation can latch onto unexpected elements. Use explicit spatial anchors:

```tsx
<Pressable
  focusable={true}
  nextFocusDown={firstCardRef}
  nextFocusRight={nextHeaderButtonRef}
>
  <Text>Header Action</Text>
</Pressable>
```

- **`nextFocusUp`**: Ensures moving UP from the top row lands cleanly on the intended header control.
- **`nextFocusDown`**: Guarantees moving DOWN from header controls targets the first element of the active row.
- **`nextFocusLeft` / `nextFocusRight`**: Locks horizontal stepping within rows or carousel lists.

---

## 5. Scroll Containers & Virtualization on TV

Standard mobile `ScrollView` and `FlatList` settings can drop focus or glitch when elements scroll off-screen:

1. **Disable Clipped Subviews**:
   ```tsx
   removeClippedSubviews={false}
   ```
   *Why*: If set to `true`, Android TV unmounts off-screen native views, causing D-Pad focus to be permanently lost when navigating near list edges.

2. **Scroll Optimization**:
   ```tsx
   nestedScrollEnabled={false}
   scrollEventThrottle={16}
   ```

3. **Wrap in TV-Safe Bounds**: Provide adequate safe-area margins (at least 24-48dp) around the viewport edges to account for TV overscan on older displays.

---

## 6. Remote Control Key & Interaction Matrix

| Remote Input | Primary Action | Secondary / Modal Action |
| :--- | :--- | :--- |
| **D-Pad UP / DOWN / LEFT / RIGHT** | Moves focus 1:1 between adjacent focusable targets. | Steps through modal menu items. |
| **SELECT / OK (Short Press)** | Executes primary action (e.g., launch full-screen stream or play media). | Confirms selected dialog option. |
| **SELECT / OK (Long Press 400ms)** | Opens context / options modal (Rename, Settings, Delete). | N/A |
| **BACK Key** | Closes active modal / overlay; if on home dashboard, prompts exit or returns to top. | Dismisses menu without saving. |
