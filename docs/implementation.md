# TV Launcher — Implementation Plan (Sprints)

Assumes 1-week sprints, solo dev. Each sprint has a working, testable checkpoint at the end — nothing ships "half-wired." Sprint 0 is a spike, not a build sprint, and is a hard gate for everything after it.

---

## Sprint 0 — Feasibility Spike (gate, not build)

**Goal:** confirm the core mechanism works on the real Onn box before writing any app code.

**Tasks**
- [x] `adb connect <onn-box-ip>:5555` from Ubuntu dev machine (Connected at `192.168.1.73:5555`)
- [x] Manually run `adb shell appwidget grantbind --package <test-package> --user 0` against a throwaway test package, confirm it succeeds on this OEM firmware (Verified on `me.efesser.flauncher`)
- [x] `adb shell dumpsys appwidget` — confirm Tapo's provider (`com.tplink.iot/com.tplink.libwidgetui.camerawidget.CameraWidgetProvider`) is actually discoverable (Confirmed present)
- [x] Confirm target Android API level on the box (Android 14 / API 34 — requires `QUERY_ALL_PACKAGES` / `<queries>` in Sprint 2)
- [x] Confirm whether the box is rooted (Not rooted; standard stock firmware, ADB grantbind operates cleanly)

**Exit criteria:** grantbind works, or you have a fallback plan (e.g. manual one-time permission grant) before proceeding. PASSED.
**Blocks:** everything below. Do not start Sprint 1 until this passes.

---

## Sprint 1 — Project Scaffold & Deployable Shell

**Goal:** an empty Expo dev-client app installable on the Onn box over network ADB.

**Tasks**
- [ ] `create-expo-app tvlauncher`, confirm JDK 17 + Android SDK env set up correctly on Ubuntu
- [ ] `expo prebuild -p android`
- [ ] `expo run:android` targeting the Onn box over network ADB — confirm install + launch
- [ ] Set up repo structure (`src/screens`, `src/components`, `android/.../` native package folder, `plugins/`, `scripts/`)
- [ ] Write first pass of `scripts/deploy.sh` (connect + density only, grantbind added in Sprint 2)

**Exit criteria:** blank RN screen renders on the physical Onn box via a custom dev client build.

---

## Sprint 2 — Launcher Role & Config Plugin

**Goal:** app is selectable as the device's default HOME launcher, and this survives a fresh `expo prebuild`.

**Tasks**
- [ ] Write Expo config plugin (`plugins/withLauncherManifest.js`) injecting `HOME` / `LEANBACK_LAUNCHER` intent filters
- [ ] Add `<queries>` / `QUERY_ALL_PACKAGES` handling in the same plugin, per Sprint 0 findings on API level
- [ ] Delete `android/`, re-run `expo prebuild`, confirm manifest changes reappear automatically (plugin correctness check)
- [ ] Confirm app appears in Android's "select launcher" dialog and can be set as default
- [ ] Reboot the box, confirm launcher choice persists

**Exit criteria:** app survives a full prebuild wipe/rebuild with zero manual manifest edits, and is the active launcher after reboot.

---

## Sprint 3 — Native Widget Host (Kotlin core)

**Goal:** the native plumbing for hosting a widget exists and is unit-testable in isolation, before any RN wiring.

**Tasks**
- [ ] `AppWidgetHostManager.kt` — allocate/delete widget IDs, `startListening()`/`stopListening()` tied to Activity lifecycle
- [ ] `AppWidgetViewManager.kt` — extend `SimpleViewManager<AppWidgetHostView>`, accept `packageName`/`className` via `@ReactProp` (not hardcoded)
- [ ] Try/catch around provider lookup — fallback to a placeholder view, no crash, if provider not found
- [ ] `onDropViewInstance` override — call `deleteAppWidgetId()` on unmount
- [ ] Manual smoke test: hardcode Tapo's component name temporarily, confirm a live widget view renders in a bare native test screen (before RN prop-wiring exists)

**Exit criteria:** a widget renders and updates live via the native layer, ID cleanup confirmed via `adb shell dumpsys appwidget` across mount/unmount cycles.

---

## Sprint 4 — Provider Enumeration (Native Module)

**Goal:** JS can ask "what widgets are installed?" instead of hardcoding one provider.

**Tasks**
- [ ] `AppWidgetHostPackage.kt` — register a `NativeModule` (separate from the ViewManager)
- [ ] Implement `getInstalledProviders()` returning package/class/label per provider
- [ ] Register the package in `MainApplication`
- [ ] JS-side test call confirming the full provider list comes back (compare count against Sprint 0's `dumpsys` count)

**Exit criteria:** JS can retrieve the full installed-provider list at runtime, matching what `dumpsys` showed in Sprint 0.

---

## Sprint 5 — RN UI: Generic Widget Cards

**Goal:** replace the hardcoded `TapoWidgetCard` with a generic, provider-driven `WidgetCard`.

**Tasks**
- [ ] `WidgetCard.tsx` — accepts `packageName`/`className` props, renders `NativeAppWidgetView`
- [ ] `HomeScreen.tsx` — fetch provider list via the Sprint 4 native module, render a card per selected/target provider
- [ ] Placeholder/error state styling for failed bindings
- [ ] Confirm Tapo, tinyCam PRO, Easy Voice Recorder, and Grok each render correctly through the generic path (no per-widget special-casing left in JS)

**Exit criteria:** all four target widgets render through the same generic component, driven by props, not hardcoded per-widget code.

---

## Sprint 6 — TV Navigation & Polish

**Goal:** usable with a remote, not just a mouse/touch.

**Tasks**
- [ ] D-Pad focus handling across the widget grid (`hasTVPreferredFocus`, focus styling)
- [ ] Scroll behavior for widget rows/grids that overflow the screen
- [ ] Visual polish pass (matches the dark card styling already drafted in the PoC)
- [ ] Full remote-only navigation pass — confirm no dead focus states, no unreachable cards

**Exit criteria:** entire home screen is navigable start-to-finish using only a TV remote.

---

## Sprint 7 — Hardening & Deployment Runbook

**Goal:** repeatable, documented deployment to a fresh device.

**Tasks**
- [ ] Finalize `scripts/deploy.sh` (connect → density → grantbind → install), parameterized by device IP
- [ ] Write a fresh-device runbook (factory reset → connect → deploy script → set default launcher)
- [ ] Re-run the Sprint 2 "prebuild survives wipe" test one more time end-to-end
- [ ] Failure-path pass: uninstall a target widget's host app, confirm fallback UI (not crash)
- [ ] Decide local `expo run:android` install vs. EAS Build for distributable APKs going forward

**Exit criteria:** a second/fresh Onn box can be set up from factory-reset to working launcher using only the script + runbook, no manual intervention.

---

## Notes

- Sprints 3 and 4 are native-heavy and may run long for a solo dev — don't hesitate to split Sprint 3 into two if the lifecycle/cleanup work drags.
- Nothing in Sprint 5+ should require touching `android/` again — if it does, that's a signal something belongs in the Sprint 2 config plugin instead.
- Re-run the "prebuild survives wipe" check (Sprint 2) any time you upgrade the Expo SDK version, not just once.