# AGENT_GUIDE.md — tvlauncher

Guidance for the coding agent working on this repo. Read this before generating or editing any code.

---

## Project in one paragraph

`tvlauncher` is a custom Android TV launcher built with Expo (prebuild + custom dev client, NOT Expo Go) and React Native, with a native Kotlin bridge that hosts live Android `AppWidget` instances (Tapo Camera, tinyCam PRO, Easy Voice Recorder, Grok, etc.) inside the RN UI. Target device is an Onn 4K Streaming Box. Dev machine is Ubuntu. Widgets are bound silently via `adb shell appwidget grantbind`, not user-facing permission dialogs.

---

## Hard constraints — do not violate
 
1. **Always discuss with the user before doing any task**: Before executing any code changes, creating new files, running complex commands, or starting a task, discuss the plan, approach, or options with the user first and wait for confirmation.
2. **No Auto Commit or Push**: NEVER run `git commit` or `git push` automatically. Only commit or push to git when explicitly instructed by the user.
3. **Mandatory Session Continuity & Resume Here Protocol**: At the end of every task, milestone, or session, the agent **MUST update the `Active Conversation ID`, `## Resume Here` section, `Completed Work`, and `Validation Record` in [`docs/DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)** so the next session or agent immediately knows where to pick up or revert to without ambiguity.
3. **Android TV System Preview Channels (`androidx.tvprovider`)**: Tapo Widget Hub acts as a system preview channel publisher to the OS. Do not build in-app 16:9 media rows or side-sheet customizers in `HomeScreen.tsx`.
4. **Never hand-edit `android/AndroidManifest.xml` directly.** All manifest changes (HOME/LEANBACK_LAUNCHER intent filters, `<queries>`, permissions) must go through the Expo config plugin at `plugins/withLauncherManifest.js`. Hand-edits get silently wiped on the next `expo prebuild` and this is a known failure mode for this project.
5. **Never hardcode a widget provider's `packageName`/`className` inside `AppWidgetViewManager.kt` or any RN component.** Provider identity must always be passed in as a prop (`@ReactProp` on the native side, component props on the RN side). One hardcoded exception is acceptable only as a temporary Sprint 3 smoke test, and must be removed before that sprint is marked done.
6. **Every provider lookup must be wrapped in try/catch with a fallback UI state.** A missing/renamed widget provider must never crash the app — render a placeholder card instead.
7. **Every widget view creation must have a matching cleanup path.** `onDropViewInstance` must call `appWidgetHost.deleteAppWidgetId()`. Do not add a new place that creates a widget ID without also handling its deletion.
8. **`AppWidgetHost.startListening()` / `stopListening()` must be tied to the Activity lifecycle** (`onResume`/`onPause`), not called ad hoc from elsewhere.
9. **Do not use Expo Go for testing.** This project requires a custom dev client (`expo run:android` or `expo start --dev-client`) because of the native `ViewManager` and `NativeModule`. If a task seems to require Expo Go, stop and flag it — it means something has drifted from the intended architecture.
10. **No `localStorage`/browser storage APIs** — this is a native RN app, not a web artifact; use RN state/native persistence patterns if persistence is ever needed.

---

## Architecture reference

```
React Native (JS/TS)
  src/screens/HomeScreen.tsx        — grid layout, fetches provider list, D-Pad focus
  src/components/WidgetCard.tsx     — generic, provider-driven (packageName/className props)

Native bridge (Kotlin)
  AppWidgetViewManager.kt           — extends SimpleViewManager<AppWidgetHostView>, provider via @ReactProp
  AppWidgetHostManager.kt           — allocate/delete widget IDs, startListening/stopListening lifecycle
  AppWidgetHostPackage.kt           — registers the NativeModule exposing getInstalledProviders()

Config
  plugins/withLauncherManifest.js   — injects manifest intent filters + <queries>, survives prebuild
  scripts/deploy.sh                 — adb connect → density → grantbind → install
```

Data flow for rendering a widget: `HomeScreen` calls the native module's `getInstalledProviders()` → picks/derives target providers → passes `packageName`/`className` as props into `WidgetCard` → `WidgetCard` renders `NativeAppWidgetView` → Kotlin `AppWidgetViewManager` binds and inflates the real `AppWidgetHostView`.

---

## Build/run commands (Ubuntu)

```bash
# first-time / after native changes
npx expo prebuild -p android
npx expo run:android

# after JS-only changes, dev client already installed
npx expo start --dev-client

# deploy to the physical Onn box over network ADB (default: 192.168.1.73:5555)
adb connect 192.168.1.73:5555
./scripts/deploy.sh 192.168.1.73:5555

# debugging widget host state
adb shell dumpsys appwidget
```

Never suggest `expo start` without `--dev-client`, and never suggest scanning a QR code with Expo Go for this project.

---

## Sprint order (see implementation.md for full detail)

Work sequentially — later sprints assume earlier ones are actually done, not stubbed:

0. Feasibility spike — confirm `grantbind` works on the real device (gate; already should be done before code changes begin)
1. Project scaffold — blank deployable dev-client shell
2. Launcher role + config plugin — HOME/LEANBACK_LAUNCHER survives `expo prebuild` wipe
3. Native widget host (Kotlin) — ID lifecycle, cleanup, fallback-on-missing-provider
4. Provider enumeration — native module, `getInstalledProviders()`
5. Generic RN widget cards — no more hardcoded per-widget components
6. TV navigation — D-Pad focus, remote-only usability
7. Hardening + deployment runbook — repeatable fresh-device setup

If asked to implement something from a later sprint while an earlier sprint's exit criteria isn't met, flag that instead of proceeding — the sprints are ordered because later work assumes earlier plumbing is real, not scaffolded.

---

## Session persistence — implementation_notes/

You have no memory across sessions. `implementation_notes/` is the persistence layer — treat reading and writing it as mandatory, not optional bookkeeping.

**Before starting any sprint's work:**
1. Read `implementation_notes/README.md` for the current status index.
2. Read that sprint's note file (create it from `TEMPLATE.md` if it doesn't exist yet) and the previous sprint's `3. Summary` section — do not re-derive context that's already written down there.
3. Fill in or confirm the `1. Start` section before writing any code.

**While working:**
- Append dated bullets to `2. Log` as things happen — decisions made, dead ends hit, deviations from `implementation.md`. This is append-only; never delete a log entry, including failed approaches.

**Before ending a session, even mid-sprint:**
- Update `3. Summary` with what's actually true right now, not what was planned. If the sprint isn't done, say so and list what's left.
- Update the status table in `README.md` to match.

If a sprint's exit criteria (from `implementation.md`) isn't met but its note says `status: done`, trust the exit criteria and flag the mismatch rather than proceeding as if it's actually finished.

---

## When in doubt

- Prefer native module calls over widening the `ViewManager`'s responsibilities — the `ViewManager` renders one widget instance; enumeration/listing logic belongs in the `NativeModule`.
- If a change would require deleting and regenerating `android/`, run it and confirm the config plugin reproduces everything needed — don't just assume it will.
- Test against the physical Onn box, not just a Play Store emulator image — widget binding behavior (`grantbind`) is OEM-firmware-dependent and emulators won't reveal real failures.