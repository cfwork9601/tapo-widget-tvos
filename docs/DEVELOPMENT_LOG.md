# Development Log — Tapo Dashboard

**Branch:** `feature/widget-launcher-hardening`  
**Purpose:** The authoritative handoff record for active development on this branch. Update this file at the end of every meaningful implementation or device-testing session.

## Resume Here

**Current implementation phase:** Phase 0 — provider registry enumeration complete; per-provider mount/render verification pending.
**Next required action:** Add and test each remaining provider in [TAPO_PROVIDER_INVENTORY.md](./TAPO_PROVIDER_INVENTORY.md), recording its configuration, binding, rendering, and cleanup result.

Do not start provider-specific action work until that inventory exists. The implementation plan is [TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md).

## Current State

| Area | Status | Notes |
| --- | --- | --- |
| Android TV HOME launcher | Implemented | Manifest/plugin declares `HOME`, `DEFAULT`, and `LEANBACK_LAUNCHER`. |
| Native AppWidget host | Implemented prototype | Kotlin bridge hosts Android `AppWidget` views in React Native. |
| Tapo provider inventory | In progress | 13 providers enumerated on the target Onn 4K Pro; all except existing camera bindings still need mount/render verification. |
| Tapo widget creation | Partial | UI explicitly adds Camera and Smart Plug only; a full Tapo provider picker is pending. |
| Per-widget click actions | Implemented foundation | Each card persists **Use widget primary action**, **Open Tapo app**, or **No action**. |
| Tapo action catalog | Pending device research | Android cannot automatically enumerate proprietary widget actions. |
| Host lifecycle | Pending | Listener start/stop is not yet tied to `MainActivity.onResume()` / `onPause()`. |
| Widget-ID ownership | Needs hardening | Failed allocation/bind and native fallback ID behavior need a single, explicit lifecycle. |
| Automated checks | Partial | `npx tsc --noEmit` passes; repeatable native build/CI coverage is pending. |

## Completed Work

| Commit | Outcome |
| --- | --- |
| `3737cd2` | Added baseline inspection and branch charter. |
| `39c8544` | Focused the branch charter on Tapo-only widget coverage. |
| `3959aa8` | Aligned the inspection recommendations with the Tapo-only scope. |
| `2db30ca` | Added persistent per-widget click-action settings and action-catalog documentation. |
| `e0a9bb7` | Added the phased Tapo dashboard implementation plan. |
| Phase 0 working tree | Enumerated 13 Tapo providers on the Onn 4K Pro and added the initial provider inventory. |

## Important Decisions

1. This branch supports only Tapo providers from `com.tplink.iot`; do not add cross-app widget support without an explicit scope change.
2. “All Tapo widgets” means every Tapo Android app-widget provider installed on the target device.
3. Do not claim automatic discovery of every internal Tapo widget function. Android does not provide a supported API to enumerate another app widget's internal actions.
4. Add an action choice only after it is verified for a specific provider class and device/Tapo-app version.
5. Keep **Open Tapo app** and **No action** as safe fallbacks for every widget card.
6. `plugins/widgethost/` is authoritative for native bridge sources. The Expo plugin copies those files into the generated `android/.../widgethost/` location during prebuild.

## Validation Record

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-08-11 | TypeScript | Pass | `npx tsc --noEmit` completed successfully after the click-action feature. |
| 2026-08-11 | Kotlin compile attempt | Inconclusive | Gradle daemon started, but this environment did not yield a conclusive task completion result. Validate through CI or a real device build. |
| 2026-08-11 | Android TV provider registry | Pass | Onn 4K Pro / Android 14 / Tapo 3.20.154 reports 13 Tapo widget providers; two camera widgets are bound to TV Launcher. See `TAPO_PROVIDER_INVENTORY.md`. |
| — | Per-provider mount/render test | Not started | Required to complete Phase 0. |

## Update Rules

At the end of every development session:

1. Move the current phase/resume point forward.
2. Add the commit hash and outcome to **Completed Work**.
3. Record every build, TypeScript, and device-test result in **Validation Record**.
4. Add newly discovered provider classes and action behavior to the Tapo provider inventory/action documentation.
5. Record blockers with enough detail for the next session to reproduce them.

## Related Documents

- [Branch Charter](./BRANCH_CHARTER.md)
- [Application Inspection](./APP_INSPECTION.md)
- [Implementation Plan](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md)
- [Tapo Widget Click Actions](./TAPO_WIDGET_ACTIONS.md)
- [Tapo Provider Inventory](./TAPO_PROVIDER_INVENTORY.md)
