# Tapo Provider Inventory

**Status:** Phase 0 in progress — Android registry enumeration complete; per-provider mount/render verification pending.  
**Collected:** 2026-08-11

## Test Device

| Field | Value |
| --- | --- |
| Device | onn. Streaming Device 4K pro |
| Android version | 14 |
| Tapo package | `com.tplink.iot` |
| Tapo version | `3.20.154` (`versionCode` 6984) |
| Enumeration source | `adb shell dumpsys appwidget` and `dumpsys package com.tplink.iot` |

## Registered Tapo App-Widget Providers

The target device reports these 13 Tapo providers. Dimensions are the provider minimum dimensions reported by Android, shown in approximate dp values derived from the platform dump.

| # | Provider class | Widget family | Minimum size | Configure activity observed | Mount/render result |
| --- | --- | --- | --- | --- | --- |
| 1 | `com.tplink.libwidgetui.plugwidget.WidgetOnOffProvider` | Smart plug | 180 × 40 | Yes | Verified bound & rendering native layout via picker |
| 2 | `com.tplink.libwidgetui.bulbwidget.BulbWidgetProvider` | Bulb | 250 × 40 | Yes | Verified bound & rendering native layout via picker |
| 3 | `com.tplink.libwidgetui.switchwidget.FanAppWidgetProvider` | Fan switch | 250 × 40 | Yes | Not tested |
| 4 | `com.tplink.libwidgetui.camerawidget.CameraWidgetProvider` | Camera | 250 × 180 | Yes | Verified bound & rendering live camera feeds |
| 5 | `com.tplink.libwidgetui.sensorwidget.SensorWidgetProvider` | Sensor | 40 × 40 | Yes | Not tested |
| 6 | `com.tplink.libwidgetui.sensorwidget.PresenceSensorWidgetProvider` | Presence sensor | 180 × 40 | Yes | Not tested |
| 7 | `com.tplink.libwidgetui.relaymotor.RelayMotorWidgetProvider` | Relay / motor | 250 × 40 | Yes | Not tested |
| 8 | `com.tplink.libwidgetui.singleshortcutwidget.SingleShortcutAppWidgetProvider` | Single shortcut | 40 × 40 | Yes | Not tested |
| 9 | `com.tplink.libwidgetui.multishortcutswidget.MultiShortcutsAppWidgetProvider` | Multiple shortcuts | 250 × 110 | Not observed in package activity output | Not tested |
| 10 | `com.tplink.libwidgetui.trvwidget.TrvWidgetProvider` | Thermostatic radiator valve | 250 × 40 | Yes | Not tested |
| 11 | `com.tplink.libwidgetui.robotwidget.RobotWidgetProvider` | Robot vacuum | 180 × 40 | Yes | Not tested |
| 12 | `com.tplink.libwidgetui.robotwidget.RobotExtendedWidgetProvider` | Extended robot vacuum | 250 × 40 | Yes | Not tested |
| 13 | `com.tplink.libwidgetui.doorlockwidget.DoorLockLockStatusWidgetProvider` | Door-lock status | 40 × 40 | Yes | Not tested |

## Existing Launcher Bindings

Android reports two current widget bindings owned by `com.tvlauncher` host ID `1024`:

| App-widget ID | Provider | Observed state |
| --- | --- | --- |
| 16124 | CameraWidgetProvider | Bound; `RemoteViews` present |
| 16125 | CameraWidgetProvider | Bound; `RemoteViews` present |

## Remaining Phase 0 Tests

For every **Not tested** provider:

1. Add it through the future Tapo provider picker or a controlled test path.
2. Complete any configuration flow exposed by Tapo.
3. Confirm the card binds and renders in TV Launcher.
4. Record its actual title, device prerequisites, configuration behavior, and any failure/log output.
5. Remove the test card and confirm its widget ID is cleaned up.

Do not mark a provider supported merely because it appears in this registry. Actual binding and rendering must be verified on the target device.

