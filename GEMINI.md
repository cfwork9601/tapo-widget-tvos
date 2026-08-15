# Project & Agent Rules

## Interaction Guidelines
- **Always discuss with the user before doing any task**: Before executing any code changes, creating new files, running complex commands, or starting a task, discuss the plan, approach, or options with the user first and wait for confirmation.
- **No Auto Commit or Push**: NEVER run `git commit` or `git push` automatically. Only commit or push to git when the user explicitly asks you to do so.
- **Mandatory Session Continuity & Resume Here Protocol**: At the end of every task, milestone, or session, the agent **MUST update the `Active Conversation ID`, `## Resume Here` section, `Completed Work`, and `Validation Record` in [`docs/DEVELOPMENT_LOG.md`](file:///home/thanhtuan/projects/tvlnc/docs/DEVELOPMENT_LOG.md)** so the next session or agent immediately knows where to pick up or revert to without ambiguity.

## Architectural Directives
- **Android TV System Preview Channels (`androidx.tvprovider`)**: `Tapo Widget Hub` publishes 16:9 media cards directly to the Android TV system (Google TV / Monet Launcher) via background native channels (`TapoPreviewChannelManager.kt`) and content providers (`SnapshotContentProvider.kt`).
- **Zero In-App UI Modification Principle**: Do NOT build or reintroduce in-app 16:9 media rows or side-sheet customizers. The internal React Native dashboard (`HomeScreen.tsx`) remains clean and unmodified.

## Technical Constraints
- Never edit `android/AndroidManifest.xml` directly; use the Expo config plugin at `plugins/withLauncherManifest.js`.
- Never hardcode widget provider identities inside components or managers.
- Always include fallback UI states for missing/uninstalled widgets.
- Always handle view cleanup (`appWidgetHost.deleteAppWidgetId()`).
- Always use custom dev-client (`npx expo run:android` or `npx expo start --dev-client`), never Expo Go.
