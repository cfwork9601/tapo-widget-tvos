# Agent Guidelines — `Tapo Widget Hub` (`com.widgetlauncher`)

> [!IMPORTANT]
> **Coding Agent Instructions**: Read this document and [`docs/agent.md`](file:///home/thanhtuan/projects/tvlnc/docs/agent.md) before generating or editing any code in this repository.

---

## Hard Constraints (Never Violate)

1. **Always discuss with the user before doing any task**: Before executing any code changes, creating new files, running complex commands, or starting a task, discuss the plan, approach, or options with the user first and wait for confirmation.
2. **Mandatory Session Continuity & Resume Here Protocol**: At the end of every task, milestone, or session, the agent **MUST update the `Active Conversation ID`, `## Resume Here` section, `Completed Work`, and `Validation Record` in [`docs/DEVELOPMENT_LOG.md`](file:///home/thanhtuan/projects/tvlnc/docs/DEVELOPMENT_LOG.md)** so the next session or agent immediately knows where to pick up or revert to without ambiguity.
3. **Android TV System Preview Channels over In-App Media Rows**: Publish media recommendations to the OS via `androidx.tvprovider` ([`docs/CHANNEL_PROPOSAL_PLAN.md`](file:///home/thanhtuan/projects/tvlnc/docs/CHANNEL_PROPOSAL_PLAN.md)). Do not build internal in-app media rows or side-sheet customizers in `HomeScreen.tsx`.
4. **Never edit `android/AndroidManifest.xml` directly.** All manifest edits (HOME / LEANBACK intent filters, permissions, `<queries>`) MUST go through the Expo config plugin at [`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js).
5. **Never hardcode widget providers** (`packageName`/`className`) inside `AppWidgetViewManager.kt` or RN components — provider identity must be passed dynamically via props.
6. **Every widget provider lookup must have fallback UI** — missing or uninstalled widgets must render placeholder cards, never crash.
7. **View cleanup is mandatory** — `onDropViewInstance` must call `appWidgetHost.deleteAppWidgetId()` on unmount.
8. **No Expo Go** — always use custom dev-client (`npx expo run:android` or `npx expo start --dev-client`).

---

## Core Documentation Index

- 🎯 **Active Plan & Spec**: [`docs/CHANNEL_PROPOSAL_PLAN.md`](file:///home/thanhtuan/projects/tvlnc/docs/CHANNEL_PROPOSAL_PLAN.md)
- 📝 **Session Handoff & Resume Point**: [`docs/DEVELOPMENT_LOG.md`](file:///home/thanhtuan/projects/tvlnc/docs/DEVELOPMENT_LOG.md)
- 🏗️ **Architecture & Bridge Spec**: [`docs/ARCHITECTURE.md`](file:///home/thanhtuan/projects/tvlnc/docs/ARCHITECTURE.md)
- 🚀 **Deployment Runbook**: [`docs/RUNBOOK.md`](file:///home/thanhtuan/projects/tvlnc/docs/RUNBOOK.md)
- 🛠️ **Troubleshooting & Diagnostics**: [`docs/TROUBLESHOOTING.md`](file:///home/thanhtuan/projects/tvlnc/docs/TROUBLESHOOTING.md)
- 📹 **Tapo Camera Live Stream Spec**: [`docs/TAPO_CAMERA_LIVE_VIEW_FEATURE.md`](file:///home/thanhtuan/projects/tvlnc/docs/TAPO_CAMERA_LIVE_VIEW_FEATURE.md)
- 📊 **System Audit & Readiness**: [`docs/PROJECT_AUDIT_AND_STATUS.md`](file:///home/thanhtuan/projects/tvlnc/docs/PROJECT_AUDIT_AND_STATUS.md)
