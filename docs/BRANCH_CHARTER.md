# Branch Charter: Tapo Widget Dashboard Hardening

**Branch:** `feature/widget-launcher-hardening`  
**Created:** August 11, 2026  
**Purpose:** Evolve TV Launcher into a dependable Android TV dashboard for the full set of Tapo app widgets available on the target device.

## Starting Point

The application already functions as an Android TV HOME launcher and can embed real Android `AppWidget` instances in its React Native dashboard. Its current user interface is limited to two TP-Link Tapo providers: a camera widget and a smart-plug widget.

The detailed baseline inspection is in [APP_INSPECTION.md](./APP_INSPECTION.md).

Track current progress and the next resume point in [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md).

## Branch Goals

Work on this branch should prioritize the following outcomes:

1. Discover every installed Tapo app-widget provider (`com.tplink.iot`) and present a user-facing picker for adding each supported provider type.
2. Make widget interaction reliable and specific to each Tapo widget; do not rely on one fixed screen coordinate for all Tapo layouts.
3. Tie `AppWidgetHost.startListening()` and `stopListening()` to the Android activity lifecycle.
4. Make widget-ID allocation, persistence, removal, and error recovery explicit and leak-safe.
5. Add clear on-screen feedback for unavailable Tapo providers, denied binding, allocation failures, and failed widget rendering.
6. Bring architecture and feature documentation into agreement with shipped behavior.
7. Add repeatable build and device-level verification for TV D-pad navigation, widget persistence, binding, and removal.

## Constraints to Preserve

- Preserve Android TV remote-first navigation and a visible focus state.
- Keep the launcher role (`HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER`) intact through Expo prebuild.
- Keep native widget-host sources under `plugins/widgethost/` authoritative, because the Expo config plugin copies them into `android/` during prebuild.
- Limit new widget-provider support to TP-Link Tapo (`com.tplink.iot`) unless the branch scope is explicitly expanded.
- Do not assume one Tapo widget exposes the same controls, layouts, or actions as another Tapo widget.
- Test changes on a real Android TV device when they affect widget binding, remote events, or launcher role behavior.

## Implementation Order

1. Reconcile the Kotlin host lifecycle with `MainActivity`.
2. Define a stable persisted widget model, including provider identity, widget ID, display label, and binding status.
3. Build a Tapo-only provider-selection and add-widget flow from the installed-provider enumeration.
4. Add explicit interaction handling for each Tapo widget family where necessary, with a safe no-op or provider-app fallback when no in-widget action is known.
5. Improve empty, error, and recovery states in the dashboard.
6. Update docs and add verification coverage.

## Working Agreement for Future Agents

- Read this charter and `docs/APP_INSPECTION.md` before making feature changes.
- Inspect both `plugins/widgethost/` and the generated `android/.../widgethost/` copies before editing native bridge code; synchronize them through the config-plugin workflow.
- Avoid changing the device deployment script's launcher-role or widget-bind commands without testing on a target TV.
- Record each supported Tapo provider class, widget family, known interaction behavior, device observations, and manual test results in the relevant documentation.
- Keep each change narrowly scoped and validate TypeScript plus the Android build when the environment permits.
