# Tapo Dashboard Implementation Plan

**Branch:** `feature/widget-launcher-hardening`  
**Scope:** Build a stable Android TV home dashboard that supports all Tapo app-widget providers installed from `com.tplink.iot`.  
**Reference documents:** [Branch Charter](./BRANCH_CHARTER.md), [Application Inspection](./APP_INSPECTION.md), [Tapo Widget Click Actions](./TAPO_WIDGET_ACTIONS.md), and the current [Development Log](./DEVELOPMENT_LOG.md).

## Definition of Done

The branch is complete when the launcher can discover, add, configure, render, persist, and safely remove every Tapo widget provider installed on the target Android TV device. Every card must remain usable with a D-pad, have a clear click-action setting, and present actionable recovery feedback when it cannot bind or render.

“All Tapo widgets” means every installed Android app-widget provider declared by the Tapo package. It does not mean the launcher can automatically discover every proprietary control inside each widget; those actions must be verified and added explicitly.

Update the [Development Log](./DEVELOPMENT_LOG.md) whenever a phase advances, a provider is tested, or a meaningful blocker is found.

## Phase 0 — Establish the Device Provider Inventory

**Goal:** Create a factual catalog of the Tapo widget providers installed on each target TV.

### Work

1. Run provider enumeration on each test device.
2. Filter results to `packageName === "com.tplink.iot"`.
3. Record the provider class, label, minimum dimensions, Tapo app version, Android version, and device model.
4. Mount each provider once and record whether it binds, renders, requires configuration, or fails.
5. Store the results in a versioned test-results document.

### Acceptance criteria

- Every Tapo provider returned by the device is listed with its observed rendering state.
- Unknown or failing providers have an explicit reason or a reproducible log excerpt.
- No support decision is based solely on a provider class name.

## Phase 1 — Fix Native Host Lifecycle and Widget-ID Ownership

**Goal:** Ensure live widgets update only while appropriate and widget IDs have one clear owner.

### Work

1. Add `AppWidgetHostManager.startListening()` and `stopListening()` entry points if needed.
2. Call them from `MainActivity.onResume()` and `onPause()`.
3. Remove implicit listener startup from unrelated paths, or make it safely idempotent and documented.
4. Define the widget-ID lifecycle: allocation, bind result, persistence, unmount, deletion, and failed-bind cleanup.
5. Ensure a native fallback allocation is returned to JavaScript and persisted, or eliminate that fallback.
6. Add logs that identify widget ID, provider class, and binding outcome without exposing sensitive widget data.

### Acceptance criteria

- Widget updates resume after returning to the launcher and stop when it backgrounds.
- A saved card always refers to the exact app-widget ID mounted by native code.
- Failed allocation or binding does not leave an untracked widget ID behind.
- Removing a card deletes exactly its owned widget ID.

## Phase 2 — Build the Tapo Provider Picker

**Goal:** Replace the two hard-coded add buttons with a Tapo-only add flow.

### Work

1. Create a provider-selection screen or modal driven by `getInstalledProviders()`.
2. Filter strictly to `com.tplink.iot`.
3. Display provider label, class, dimensions, and a suitable category/icon where known.
4. Make the list fully D-pad navigable, including an empty state when Tapo or its widgets are unavailable.
5. Allocate and bind the selected provider through the stable lifecycle defined in Phase 1.
6. Keep existing camera and plug entries only as compatibility shortcuts if they continue to add value; they must use the same generic Tapo add path.

### Acceptance criteria

- Every installed Tapo provider can be selected and added from the UI.
- No provider from another package appears in the add flow.
- Adding a widget either succeeds with a visible card or produces a user-visible, actionable error.

## Phase 3 — Improve Card Rendering, States, and Dashboard Management

**Goal:** Make every widget card understandable and recoverable in normal TV use.

### Work

1. Extend persisted widget data with binding/render status and optional provider metadata needed for presentation.
2. Add loading, configuration-required, unavailable-provider, bind-failed, and render-failed states.
3. Offer context-menu recovery actions: retry binding, open Tapo, change click action, and delete.
4. Confirm grid and slider layouts preserve focus predictably when cards are added, removed, or fail.
5. Consider a widget label rename flow if multiple instances of the same provider are common.

### Acceptance criteria

- Every non-rendering card explains what happened and offers at least one safe recovery action.
- D-pad focus remains visible and reachable after all card-state transitions.
- Layout changes do not duplicate cards or orphan widget IDs.

## Phase 4 — Expand the Tapo Click-Action Catalog

**Goal:** Give users meaningful, reliable click choices for each verified Tapo widget family.

### Current delivered foundation

- Each widget persists one of three actions: use widget primary action, open Tapo app, or no action.
- The setting is available in the long-press **Click Action** menu.
- The behavior and platform limit are documented in `TAPO_WIDGET_ACTIONS.md`.

### Work

1. For every provider cataloged in Phase 0, test its normal hosted-widget behavior using D-pad Select.
2. Record verified actions and any layout/version dependencies.
3. Add explicit, named action options only when they are tested for a specific Tapo provider or widget family.
4. Implement native dispatch only when normal hosted-widget interaction cannot safely invoke the tested action.
5. Keep **Open Tapo app** and **No action** available as universal fallbacks.
6. Do not label an action “Live View,” “Toggle,” or similar unless the exact result is verified on the target device.

### Acceptance criteria

- Every advertised action is tied to a documented provider class and manual test result.
- Selecting a configured action changes only the intended widget's press behavior.
- Unsupported or unverified functions are not presented as available.

## Phase 5 — Documentation and Automated Verification

**Goal:** Make the behavior reproducible for future sessions and safe to evolve.

### Work

1. Reconcile `ARCHITECTURE.md` and Tapo feature documentation with the implemented listener lifecycle and click dispatch behavior.
2. Update the runbook with provider picker, widget recovery, and click-action configuration steps.
3. Add TypeScript tests for persistence migration, provider filtering, and action selection logic.
4. Add a CI Android debug build or Kotlin compile check.
5. Define a manual device test matrix covering all provider inventory entries and supported device models.

### Acceptance criteria

- Documentation describes actual behavior and links to the provider/action inventory.
- TypeScript checks and Android build checks run repeatably in CI or the documented local environment.
- The device test matrix has a recorded pass/fail result for each installed Tapo provider.

## Suggested Execution Order

```text
Provider inventory
      ↓
Host lifecycle + widget-ID ownership
      ↓
Tapo provider picker
      ↓
Card states and recovery
      ↓
Verified action catalog
      ↓
Documentation, tests, and device matrix
```

Do not begin provider-specific action work before the inventory exists. Do not claim full Tapo coverage until every provider in that inventory has a recorded result.

## Delivery Checkpoint

Before merging, verify on a real target TV:

1. Assign the app as HOME launcher and reboot.
2. Add every installed Tapo provider at least once.
3. Change each widget's click action and verify the configured result.
4. Switch grid/slider layouts, leave and return to the launcher, then reboot.
5. Remove every test card and confirm no stale card or unexpected widget state remains.
6. Capture relevant logs and update the inventory/test matrix.
