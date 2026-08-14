# Tapo Widget Hub — Documentation Master Index

Welcome to the technical documentation repository for **Tapo Widget Hub (`com.widgetlauncher`)**, a high-performance custom Android TV Launcher built with React Native (0.86), Expo SDK 57 (Custom Dev Client), and a native Kotlin AppWidget bridge.

> [!IMPORTANT]
> **Active Architecture & Current Focus**:
> 1. **Android TV System Preview Channels (`androidx.tvprovider`)**: `Tapo Widget Hub` publishes live camera preview channels and 16:9 media cards to the Android TV system database for external launchers (Google TV, Monet Launcher, Projectivy) via [`plugins/widgethost/TapoPreviewChannelManager.kt`](../plugins/widgethost/TapoPreviewChannelManager.kt) and [`plugins/widgethost/SnapshotContentProvider.kt`](../plugins/widgethost/SnapshotContentProvider.kt).
> 2. **Zero In-App UI Modification Principle**: The internal React Native dashboard (`HomeScreen.tsx`) remains clean and unmodified. In-app media rows and side-sheet customizers have been reverted.
> 3. **Session Continuity Protocol**: Before starting, read `## Resume Here` in [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md). Update `## Resume Here` before finishing your session.

---

## 📚 Master Documentation Directory

### 🏛️ 1. Architecture & System Preview Channels
* **[`CHANNEL_PROPOSAL_PLAN.md`](./CHANNEL_PROPOSAL_PLAN.md)**: **Primary Spec**: Android TV Preview Channels (`androidx.tvprovider`) publishing Tapo camera media cards to Google TV / Monet Launcher.
* **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: Native bridge design, lifecycle tracking (`AppWidgetHostManager`), ViewManager click dispatching, and Expo config plugin mechanics.
* **[`TAPO_CAMERA_LIVE_VIEW_FEATURE.md`](./TAPO_CAMERA_LIVE_VIEW_FEATURE.md)**: Technical breakdown of direct full-screen live view camera stream launching (`TapoPadVideoPlayV3Activity`) using DFS introspection.

---

### 📋 2. Device Audits & Tapo Inventories
* **[`PROJECT_AUDIT_AND_STATUS.md`](./PROJECT_AUDIT_AND_STATUS.md)**: Complete technical audit report (permissions, native bridge inventory, build/signing, device state, and readiness matrix).
* **[`TAPO_PROVIDER_INVENTORY.md`](./TAPO_PROVIDER_INVENTORY.md)**: Catalog of 13 registered TP-Link Tapo widget providers on Android 14 TV with verified mount/render states.
* **[`TAPO_WIDGET_ACTIONS.md`](./TAPO_WIDGET_ACTIONS.md)**: Per-widget click actions, platform limitations, and verified action mappings.
* **[`APP_INSPECTION.md`](./APP_INSPECTION.md)**: Initial static code inspection and baseline architecture analysis.

---

### 🚀 3. Operations, Deployment & Runbooks
* **[`agent.md`](./agent.md)**: Hard constraints, coding rules, Discuss-First rule, and Resume Here protocol for coding agents.
* **[`RUNBOOK.md`](./RUNBOOK.md)**: Step-by-step device deployment, network ADB setup, and 1-command deployment script usage.
* **[`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)**: Diagnostic commands, logcat filtering, density tuning, and issue resolution.
* **[`BRANCH_CHARTER.md`](./BRANCH_CHARTER.md)**: Scope, goals, and architectural working agreements for the `feature/widget-launcher-hardening` branch.

---

### 📝 4. Development Logs & Historical Roadmaps
* **[`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)**: Active branch handoff log, `Resume Here` point, validation records, and committed milestones.
* **[`TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md`](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md)**: Phased delivery roadmap for complete Tapo widget coverage.
* **[`implementation.md`](./implementation.md)**: Historical sprint backlog and verification criteria (Sprints 0–7).

---

## ⚡ Quick Reference: Critical Hard Constraints
1. **Always discuss with the user before doing any task.**
2. **Update `## Resume Here` in [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)** at the end of every session/task.
3. **Android TV Preview Channels (`androidx.tvprovider`)** is the active recommendation architecture — do NOT build in-app media rows in `HomeScreen.tsx`.
4. **Never edit `android/AndroidManifest.xml` directly** — all manifest changes must go through [`plugins/withLauncherManifest.js`](../plugins/withLauncherManifest.js).
5. **Authoritative Kotlin sources** reside in [`plugins/widgethost/`](../plugins/widgethost/).
6. **No hardcoded providers** in components — provider identities are passed dynamically via props.
7. **View cleanup is mandatory** — every unmounted widget must release its native `appWidgetId`.
8. **No Expo Go** — always test using the custom development client (`npx expo start --dev-client`).
