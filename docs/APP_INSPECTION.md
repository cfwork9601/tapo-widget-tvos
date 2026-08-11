# TV Launcher — Application Inspection

**Inspection date:** August 11, 2026  
**Scope:** Static review of the React Native UI, Kotlin native widget bridge, Android manifest/config plugins, and deployment script. No source changes were made as part of the inspection.

## Summary

TV Launcher (`com.tvlauncher`) is an Android TV home launcher and smart-dashboard prototype. It is intended primarily for TP-Link Tapo widgets, especially camera widgets, on devices such as an Onn 4K Streaming Box.

The app uses React Native and Expo for its TV interface and a Kotlin bridge to host Android `AppWidget` instances inside React Native cards. It can be assigned the Android HOME role, letting the dashboard replace the device's default launcher.

The implementation is a promising proof of concept for a fixed Tapo setup. It is not yet a production-hardened dashboard with full coverage of the Tapo widgets installed on the device.

## User Experience

At launch, the dashboard:

1. Enumerates installed Android widget providers.
2. Restores dashboard settings and saved active widgets from shared preferences.
3. Displays a D-pad-focusable toolbar for adding widgets and changing layout settings.
4. Shows widgets as either a wrapping grid or a horizontal slider.
5. Opens widget options on long press, including live-stream, provider-app launch, and delete actions.

The dashboard currently exposes explicit controls for only these providers:

| Widget | Package | Provider class |
| --- | --- | --- |
| Tapo Camera | `com.tplink.iot` | `com.tplink.libwidgetui.camerawidget.CameraWidgetProvider` |
| Tapo Smart Plug | `com.tplink.iot` | `com.tplink.libwidgetui.plugwidget.WidgetOnOffProvider` |

Although the app enumerates all installed providers, it does not currently offer a picker for the full set of installed Tapo providers.

## Architecture

```text
React Native HomeScreen
  ├─ persists widgets and layout preferences
  ├─ renders WidgetCard instances
  └─ calls AppWidgetModule
       ├─ lists providers
       ├─ allocates/deletes widget IDs
       ├─ stores settings
       └─ launches provider applications

WidgetCard
  └─ renders the AppWidgetView native component
       └─ AppWidgetViewManager (Kotlin)
            ├─ binds an AppWidget ID to a provider
            ├─ creates an Android AppWidgetHostView
            └─ dispatches a synthetic click to the hosted widget
```

The relevant source locations are:

- `src/screens/HomeScreen.tsx` — dashboard state, controls, and persistence.
- `src/components/WidgetCard.tsx` — focusable widget-card wrapper.
- `src/services/WidgetProviderService.ts` — JavaScript interface to the native module.
- `android/app/src/main/java/com/tvlauncher/widgethost/` — Kotlin module, host manager, and view manager.
- `plugins/withLauncherManifest.js` — launcher intent filters and permissions retained through Expo prebuild.
- `plugins/withNativeWidgetHost.js` — copies the Kotlin bridge into the generated Android project.

## Launcher and Deployment Behavior

The manifest/config plugin declares `HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER` categories, allowing Android to select this app as the home launcher.

`scripts/deploy.sh` installs the APK through network ADB, grants widget-host binding through the shell, sets the HOME role, and launches `MainActivity`. It also changes the target device display density to `309`.

The broad `QUERY_ALL_PACKAGES` permission is used to enumerate installed widget providers. This is functional for a dedicated launcher, but it should be justified and reviewed before any public-store distribution.

## Findings

### 1. Tapo provider support is narrower than the provider enumeration suggests

`getInstalledProviders()` returns information about every installed app-widget provider, but `HomeScreen` only creates the two hard-coded Tapo widgets listed above. The user interface does not expose the remaining installed Tapo provider classes.

**Impact:** The app supports only a small subset of the Tapo dashboard experience intended for this branch.

### 2. The modal live-stream command does not perform a widget click

The JavaScript `launchWidgetClick()` method calls the native module, but the Kotlin implementation delegates directly to `launchApp()`. It opens the provider application rather than its widget's live-stream action.

**Impact:** “View Live Stream” in the long-press menu is mislabeled for the current implementation. The in-card press is the only path that tries to open Tapo live view.

### 3. In-card interaction is Tapo-specific and coordinate-based

An in-card press increments `clickToken`. The native view manager then sends a synthetic touch at 25% of the widget width and 88% of its height, intended to hit Tapo's “Go Live” control.

**Impact:** It may fail when Tapo changes its widget layout, when card dimensions differ, or for every non-Tapo provider. The documentation's earlier description of view-tree introspection is not reflected in the current code.

### 4. Widget listening is not tied to activity lifecycle

The host manager starts listening when a host is requested. `MainActivity` does not call lifecycle methods to stop listening while it is paused or backgrounded.

**Impact:** Widget updates may continue unnecessarily in the background. This also conflicts with the lifecycle behavior described in `docs/ARCHITECTURE.md`.

### 5. Binding and allocation failures have no user-visible recovery path

If ID allocation fails, the JavaScript bridge returns `-1`; the dashboard can still persist that value. The native container may then attempt its own allocation, without reporting the newly allocated ID back to JavaScript. Native bind failures are displayed in the widget card but are not surfaced as actionable application errors.

**Impact:** A failed or interrupted bind can lead to confusing cards and potentially orphaned widget IDs.

### 6. Documentation and implementation have drifted

The architecture documentation states that widget updates are started in `onResume`, stopped in `onPause`, and that click dispatch uses view-tree introspection with a coordinate fallback. The current source starts listening lazily and uses only the hard-coded coordinate click.

**Impact:** The documentation should not be treated as an exact description of runtime behavior until it is reconciled with the implementation.

## Validation Performed

- `npx tsc --noEmit` completed successfully.
- Source, manifest, configuration plugin, and deployment-script behavior were reviewed statically.
- Android Kotlin compilation was initiated, but this environment did not produce a conclusive task completion result after Gradle daemon startup; a device/CI build should be used as the build authority.

## Recommended Next Steps

1. Add a Tapo-only provider picker based on `getInstalledProviders()`, filtering for `com.tplink.iot` and exposing every installed Tapo widget provider.
2. Implement reliable, per-widget Tapo actions rather than a fixed coordinate click; use an explicit adapter where a Tapo widget family needs specialized behavior.
3. Start and stop `AppWidgetHost` listening in `MainActivity.onResume()` and `onPause()`.
4. Make widget ID ownership explicit: report allocations back to JavaScript, clean up abandoned IDs, and handle allocation/bind failure visibly.
5. Update the architecture and Tapo feature documents to match the behavior that is actually shipped.
6. Add automated native build verification and a small UI/integration test suite for widget persistence, binding, removal, and focus navigation.
