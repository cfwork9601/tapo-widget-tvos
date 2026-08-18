# Agent Rule Package for Android TV (`react-native-tvos`)

This package consolidates the complete set of AI coding agent guidelines, architectural principles, logging standards, and technical rules extracted and hardened from production Android TV application development.

---

## Package Contents

| Document | Purpose |
| :--- | :--- |
| 🛡️ [**`AGENT_RULES.md`**](./AGENT_RULES.md) | Mandatory agent behavior (discussion before action, no auto-commit, custom dev-client only). |
| 📺 [**`REACT_NATIVE_TVOS_GUIDELINES.md`**](./REACT_NATIVE_TVOS_GUIDELINES.md) | 10-foot UI design, D-Pad navigation, unified single-focus card pattern, and spatial anchors. |
| 🤖 [**`ANDROID_TV_NATIVE_AND_EXPO_RULES.md`**](./ANDROID_TV_NATIVE_AND_EXPO_RULES.md) | Expo config plugins, Android TV preview channels (`androidx.tvprovider`), native lifecycle, and ADB commands. |
| 🖼️ [**`SYSTEM_PREVIEW_CHANNELS_GUIDE.md`**](./SYSTEM_PREVIEW_CHANNELS_GUIDE.md) | End-to-end architecture & code guide for publishing 16:9 dynamic preview cards to Google TV home screen. |
| 📝 [**`DEVELOPMENT_LOG_TEMPLATE.md`**](./DEVELOPMENT_LOG_TEMPLATE.md) | Standardized session continuity and handoff template (`## Resume Here`, `Completed Work`, `Validation Record`). |

---

## Quick Setup for a New Project

1. Copy the contents of this folder into your new project's root or `.gemini/` rules directory:
   - Place `AGENT_RULES.md` into the project root as `GEMINI.md` or `AGENT_GUIDE.md`.
2. Initialize `docs/DEVELOPMENT_LOG.md` using [`DEVELOPMENT_LOG_TEMPLATE.md`](./DEVELOPMENT_LOG_TEMPLATE.md).
3. Ensure your `app.json` uses an Expo Config Plugin for manifest modifications rather than editing `android/AndroidManifest.xml` directly.
4. Follow the single-focus container pattern in [`REACT_NATIVE_TVOS_GUIDELINES.md`](./REACT_NATIVE_TVOS_GUIDELINES.md) for all D-Pad remote navigation.
