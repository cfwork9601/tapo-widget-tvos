# Agent Guidelines — `tapo-widget-tvos` (`com.tvlauncher`)

> [!IMPORTANT]
> **Coding Agent Instructions**: Read this document and [`docs/agent.md`](file:///home/thanhtuan/projects/tvlnc/docs/agent.md) before generating or editing any code in this repository.

---

## Hard Constraints (Never Violate)

1. **Never edit `android/AndroidManifest.xml` directly.** All manifest edits (HOME / LEANBACK intent filters, permissions, `<queries>`) MUST go through the Expo config plugin at [`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js).
2. **Never hardcode widget providers** (`packageName`/`className`) inside `AppWidgetViewManager.kt` or RN components — provider identity must be passed dynamically via props.
3. **Every widget provider lookup must have fallback UI** — missing or uninstalled widgets must render placeholder cards, never crash.
4. **View cleanup is mandatory** — `onDropViewInstance` must call `appWidgetHost.deleteAppWidgetId()` on unmount.
5. **No Expo Go** — always use custom dev-client (`npx expo run:android`).

---

## Core Documentation Index

- 🏗️ **Architecture & Bridge Spec**: [`docs/ARCHITECTURE.md`](file:///home/thanhtuan/projects/tvlnc/docs/ARCHITECTURE.md)
- 🚀 **Deployment Runbook**: [`docs/RUNBOOK.md`](file:///home/thanhtuan/projects/tvlnc/docs/RUNBOOK.md)
- 🛠️ **Troubleshooting & Diagnostics**: [`docs/TROUBLESHOOTING.md`](file:///home/thanhtuan/projects/tvlnc/docs/TROUBLESHOOTING.md)
- 📹 **Tapo Camera Live Stream Spec**: [`docs/TAPO_CAMERA_LIVE_VIEW_FEATURE.md`](file:///home/thanhtuan/projects/tvlnc/docs/TAPO_CAMERA_LIVE_VIEW_FEATURE.md)
- 📝 **Detailed Agent Guide**: [`docs/agent.md`](file:///home/thanhtuan/projects/tvlnc/docs/agent.md)
