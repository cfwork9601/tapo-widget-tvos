# Agent Rules & Core Constraints — React Native TVOS / Android TV

This document outlines the authoritative rules, interaction guidelines, and technical constraints for AI coding agents developing Android TV applications using the `react-native-tvos` / Expo bare workflow tech stack.

---

## 1. Interaction Guidelines

1. **Always Discuss & Confirm First**:
   - Before executing code modifications, creating new files, running complex commands, or starting a milestone task, discuss the plan, architectural approach, and options with the user first.
   - Wait for explicit user confirmation before proceeding with implementation.

2. **No Auto Commit or Push**:
   - **NEVER** run `git commit` or `git push` automatically.
   - Only commit or push to git when explicitly instructed by the user.

3. **Mandatory Session Continuity & Resume Here Protocol**:
   - At the end of every task, milestone, or development session, the agent **MUST** update the `Active Conversation ID`, `## Resume Here` section, `Completed Work`, and `Validation Record` in `docs/DEVELOPMENT_LOG.md` (see [`DEVELOPMENT_LOG_TEMPLATE.md`](./DEVELOPMENT_LOG_TEMPLATE.md)).
   - This ensures the next session or agent immediately knows where to pick up without ambiguity.

---

## 2. Technical & Architectural Constraints

1. **Custom Dev-Client Only (Never Expo Go)**:
   - Always run and build via custom dev-client (`npx expo run:android` or `npx expo start --dev-client`).
   - Never use or recommend standard Expo Go, as Android TV apps rely on custom native modules, `ViewManager`s, and Leanback manifest properties unsupported in Expo Go.

2. **Never Edit `android/AndroidManifest.xml` Directly**:
   - All manifest changes (e.g. `android.intent.category.LEANBACK_LAUNCHER`, `HOME`, `<queries>`, `uses-feature android.software.leanback`, and permissions) **MUST** go through an Expo config plugin (e.g., `plugins/withLauncherManifest.js`).
   - Manual edits to `android/` are wiped when running `npx expo prebuild --clean`.

3. **10-Foot UI & Single-Focus Container Pattern**:
   - Every interactive card, tile, or row must have exactly **one primary D-Pad focus stop**.
   - Do NOT expose nested focusable buttons inside a card (e.g., separate settings or delete buttons) to the D-Pad hierarchy, as this causes multi-stop focus fragmentation and sluggish navigation.

4. **Zero In-App UI Clutter for System Channels**:
   - When publishing system preview rows / recommendations (Google TV / Monet Launcher), publish directly to Android TV OS via `androidx.tvprovider` native channels.
   - Do not reintroduce duplicate 16:9 media rows or heavy side-sheets inside the internal dashboard UI.

5. **Strict Native Resource & Memory Management**:
   - Tie native listeners and heavy operations to the Android Activity lifecycle (`onResume` / `onPause`).
   - Coordinate React Native view unmounts (`onDropViewInstance`) with native cleanup (e.g. `appWidgetHost.deleteAppWidgetId()`).

6. **Defensive UI & Fallback States**:
   - Every native provider lookup, deep link, or remote service must be wrapped in `try/catch` with a graceful placeholder/error UI.
   - Missing or uninstalled third-party packages must never crash the app.

7. **No Browser Storage APIs**:
   - This is a native TV application. Do not use `localStorage` or web browser APIs. Use React Native native persistence (such as `AsyncStorage` or native key-value storage).

---

## 3. Related Documentation Reference

- 📺 [React Native TVOS Guidelines](./REACT_NATIVE_TVOS_GUIDELINES.md)
- 🤖 [Android TV Native & Expo Rules](./ANDROID_TV_NATIVE_AND_EXPO_RULES.md)
- 🖼️ [System Preview Channels Guide](./SYSTEM_PREVIEW_CHANNELS_GUIDE.md)
- 📝 [Development Log Template](./DEVELOPMENT_LOG_TEMPLATE.md)
