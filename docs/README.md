# Tapo Widget Hub — Documentation Index

Welcome to the technical documentation repository for **Tapo Widget Hub (`com.widgetlauncher`)**, a high-performance custom Android TV Launcher built with React Native (0.86), Expo SDK 57 (Custom Dev Client), and a native Kotlin AppWidget bridge.

---

## 📚 Master Documentation Directory

### 🏗️ 1. Core Architecture & Feature Specifications
* **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: Native bridge design, lifecycle tracking (`AppWidgetHostManager`), ViewManager click dispatching, and Expo config plugin mechanics.
* **[`CINEMATIC_WIDGET_MEDIA_ROW_RFC.md`](./CINEMATIC_WIDGET_MEDIA_ROW_RFC.md)**: Comprehensive architectural RFC for 16:9 widget media rows, touch interception, and slide-out side-sheet customization.
* **[`WIDGET_MEDIA_ROW_FEATURE.md`](./WIDGET_MEDIA_ROW_FEATURE.md)**: Feature specification for the cinematic 16:9 widget media rows and slide-out side-sheet customization panel.
* **[`TAPO_CAMERA_LIVE_VIEW_FEATURE.md`](./TAPO_CAMERA_LIVE_VIEW_FEATURE.md)**: In-depth technical breakdown of direct full-screen live view camera stream launching (`TapoPadVideoPlayV3Activity`) using DFS introspection & coordinate fallback math.

---

### 📋 2. Planning, Charters & Roadmap
* **[`TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md`](./TAPO_DASHBOARD_IMPLEMENTATION_PLAN.md)**: Phased delivery roadmap for complete device Tapo widget coverage.
* **[`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)**: Active branch progress, validation records, committed milestones, and next session resume point.
* **[`BRANCH_CHARTER.md`](./BRANCH_CHARTER.md)**: Scope, goals, and architectural working agreements for the `feature/widget-launcher-hardening` branch.
* **[`implementation.md`](./implementation.md)**: Historical sprint backlog and verification criteria.

---

### 📱 3. Device Inventories & Behaviors
* **[`TAPO_PROVIDER_INVENTORY.md`](./TAPO_PROVIDER_INVENTORY.md)**: Catalog of 13 registered TP-Link Tapo widget providers on Android 14 TV with verified mount/render states.
* **[`TAPO_WIDGET_ACTIONS.md`](./TAPO_WIDGET_ACTIONS.md)**: Per-widget click actions, platform limitations, and verified action mappings.
* **[`APP_INSPECTION.md`](./APP_INSPECTION.md)**: Initial static code inspection and baseline architecture analysis.

---

### 🚀 4. Deployment, Operations & Diagnostics
* **[`RUNBOOK.md`](./RUNBOOK.md)**: Step-by-step device deployment, network ADB setup, and 1-command deployment script usage.
* **[`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)**: Diagnostic commands, logcat filtering, density tuning, and issue resolution.
* **[`agent.md`](./agent.md)**: Hard constraints, coding rules, and development guidelines for coding agents.

---

## ⚡ Quick Reference: Critical Hard Constraints
1. **Never edit `android/AndroidManifest.xml` directly** — all manifest changes must go through [`plugins/withLauncherManifest.js`](../plugins/withLauncherManifest.js).
2. **Authoritative Kotlin sources** reside in [`plugins/widgethost/`](../plugins/widgethost/).
3. **No hardcoded providers** in components — provider identities are passed dynamically via props.
4. **View cleanup is mandatory** — every unmounted widget must release its native `appWidgetId`.
5. **No Expo Go** — always test using the custom development client (`npx expo start --dev-client`).
