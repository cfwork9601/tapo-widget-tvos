# Tapo Widget Click Actions

## Purpose

Each dashboard card has a persistent click-action setting. Open a card's long-press menu and choose **Click Action** to decide what an ordinary D-pad Select press does for that individual widget.

## Current Choices

| Setting | Card behavior | Intended use |
| --- | --- | --- |
| Use widget primary action | Sends the card press to the hosted Tapo widget. | Default; use after validating the provider's primary action on the target TV. |
| Open Tapo app | Opens `com.tplink.iot`. | A safe fallback when the widget's action is unavailable or unsuitable. |
| No action | Retains focus without launching an action. | Prevent accidental activation while keeping a widget visible. |

The selected value is persisted as `clickAction` in the `active_widgets` preference. Existing saved widgets are migrated to **Use widget primary action**.

## Platform Limitation

Android's app-widget APIs expose the rendered `RemoteViews`, but they do not provide a supported, general API that lists every internal `PendingIntent` or interaction an external widget declares. Consequently, the launcher cannot automatically enumerate every Tapo widget function.

Provider actions must be discovered and verified on a real target device. Do not infer an action from a provider class name or reuse a coordinate from another widget family.

## Adding a Verified Tapo Action

When a Tapo widget function has been verified, add it as an explicit action option rather than treating it as a generic widget feature:

1. Record the exact provider class and device/Tapo-app version tested.
2. Record the trigger method and the expected result.
3. Add a named action to the JavaScript action catalog.
4. Add native handling only when the existing hosted-widget press cannot invoke the action safely.
5. Preserve **Open Tapo app** and **No action** as safe fallbacks.
6. Re-test D-pad focus, normal press, long press, persistence, and removal.

This approach makes the dashboard extensible across Tapo widget families without promising unsupported automatic action discovery.
