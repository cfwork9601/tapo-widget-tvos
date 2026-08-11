# Branch Charter: Widget Launcher Hardening

**Branch:** `feature/widget-launcher-hardening`  
**Created:** August 11, 2026  
**Purpose:** Evolve TV Launcher from a Tapo-focused proof of concept into a dependable Android TV widget launcher.

## Starting Point

The application already functions as an Android TV HOME launcher and can embed real Android `AppWidget` instances in its React Native dashboard. Its current user interface is principally built around TP-Link Tapo camera and smart-plug widgets.

The detailed baseline inspection is in [APP_INSPECTION.md](./APP_INSPECTION.md).

## Branch Goals

Work on this branch should prioritize the following outcomes:

1. Provide a user-facing picker for installed widget providers instead of only hard-coded Tapo add buttons.
2. Make widget interaction reliable and provider-aware; do not rely on one fixed screen coordinate for all widgets.
3. Tie `AppWidgetHost.startListening()` and `stopListening()` to the Android activity lifecycle.
4. Make widget-ID allocation, persistence, removal, and error recovery explicit and leak-safe.
5. Add clear on-screen feedback for unavailable providers, denied binding, allocation failures, and failed widget rendering.
6. Bring architecture and feature documentation into agreement with shipped behavior.
7. Add repeatable build and device-level verification for TV D-pad navigation, widget persistence, binding, and removal.

## Constraints to Preserve

- Preserve Android TV remote-first navigation and a visible focus state.
- Keep the launcher role (`HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER`) intact through Expo prebuild.
- Keep native widget-host sources under `plugins/widgethost/` authoritative, because the Expo config plugin copies them into `android/` during prebuild.
- Do not assume another provider exposes the same controls or layouts as Tapo.
- Test changes on a real Android TV device when they affect widget binding, remote events, or launcher role behavior.

## Implementation Order

1. Reconcile the Kotlin host lifecycle with `MainActivity`.
2. Define a stable persisted widget model, including provider identity, widget ID, display label, and binding status.
3. Build the provider-selection and add-widget flow.
4. Add provider-specific action handling only where necessary; retain a safe generic fallback.
5. Improve empty, error, and recovery states in the dashboard.
6. Update docs and add verification coverage.

## Working Agreement for Future Agents

- Read this charter and `docs/APP_INSPECTION.md` before making feature changes.
- Inspect both `plugins/widgethost/` and the generated `android/.../widgethost/` copies before editing native bridge code; synchronize them through the config-plugin workflow.
- Avoid changing the device deployment script's launcher-role or widget-bind commands without testing on a target TV.
- Record any provider-specific assumptions, device observations, and manual test results in the relevant documentation.
- Keep each change narrowly scoped and validate TypeScript plus the Android build when the environment permits.

