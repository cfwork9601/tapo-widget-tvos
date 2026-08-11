# Troubleshooting & Diagnostics Guide — TV Launcher (`com.tvlauncher`)

This guide outlines solutions for common deployment, widget binding, native Android build, ADB connectivity, and display issues encountered during `tvlauncher` development and operation.

---

## 1. ADB & Network Connectivity Issues

### Issue 1.1: Device reports `unauthorized` or `offline`
**Symptoms:** Running `./scripts/deploy.sh` or `adb connect` fails with `device unauthorized` or `device offline`.

**Cause:** The Android TV host has not accepted the development machine's RSA key fingerprint.

**Solution:**
1. Turn on the TV screen connected to the target streaming box.
2. An on-screen dialog titled *"Allow USB / Network debugging?"* will appear.
3. Check the box **"Always allow from this computer"** and select **OK**.
4. Re-run deployment:
   ```bash
   adb disconnect
   ./scripts/deploy.sh 192.168.1.67:5555
   ```

---

### Issue 1.2: Connection Refused on Port 5555
**Symptoms:** `adb connect 192.168.1.XX:5555` returns `cannot connect to 192.168.1.XX:5555: Connection refused`.

**Solution:**
1. Verify device IP in **Settings** → **Network & Internet** → *(Connected Wi-Fi Network)*.
2. Go to **Settings** → **System** → **Developer options**.
3. Toggle **Network debugging** OFF, then back ON.
4. Verify port listening state:
   ```bash
   adb kill-server && adb start-server
   adb connect 192.168.1.XX:5555
   ```

---

## 2. AppWidget Binding & Permissions

### Issue 2.1: `Widget binding not allowed` or blank card error
**Symptoms:** Adding a camera widget displays a permission error card or fails to inflate the remote widget view.

**Cause:** Standard third-party launchers require explicit user permission to bind `AppWidgetHost` instances. On TV OS without full settings dialogs, silent binding must be granted via ADB.

**Solution:**
Run the silent `grantbind` command manually:
```bash
adb shell appwidget grantbind --package com.tvlauncher --user 0
```

---

### Issue 2.2: Widget provider list is empty (`getInstalledProviders()` returns `[]`)
**Symptoms:** The widget selection modal shows no installed widgets.

**Cause:** On Android 11+ (API 30+), package visibility is restricted unless `<queries>` or `QUERY_ALL_PACKAGES` is declared in `AndroidManifest.xml`.

**Solution:**
Ensure `plugins/withLauncherManifest.js` is included in `app.json` plugins array, then re-run prebuild:
```bash
npx expo prebuild -p android --clean
npx expo run:android
```

---

### Issue 2.3: Debugging active AppWidgetHost state
To inspect active widget IDs, host bindings, and package providers registered in the Android OS system:
```bash
adb shell dumpsys appwidget
```
Look for `HostId 1024` under `com.tvlauncher`.

---

## 3. Launcher Role & Prebuild Issues

### Issue 3.1: Launcher choice lost after running `expo prebuild`
**Symptoms:** Rebuilding the app wipes the launcher intent filters, causing `tvlauncher` to disappear from the TV's home launcher selection list.

**Cause:** Manual edits were made directly to `android/AndroidManifest.xml`, which are overwritten during Expo prebuild wipes.

**Solution:**
**Never edit `android/AndroidManifest.xml` manually.** All intent filters must be declared inside [`plugins/withLauncherManifest.js`](file:///home/thanhtuan/projects/tvlnc/plugins/withLauncherManifest.js).

To test plugin survival:
```bash
# Delete android folder and verify manifest generation
rm -rf android
npx expo prebuild -p android
grep -A 10 "android.intent.category.HOME" android/app/src/main/AndroidManifest.xml
```

---

### Issue 3.2: Reverting or setting default launcher manually
If `tvlauncher` is not prompted automatically on HOME keypress, force assign the launcher role via ADB:
```bash
# Assign HOME launcher role
adb shell cmd role add-role-holder --user 0 android.app.role.HOME com.tvlauncher

# Launch MainActivity
adb shell am start -n com.tvlauncher/.MainActivity
```

To revert back to stock Google TV / Android TV launcher:
```bash
adb shell cmd role remove-role-holder --user 0 android.app.role.HOME com.tvlauncher
```

---

## 4. Tapo Live View & Click Dispatch Issues

### Issue 4.1: Clicking camera card opens Tapo main menu instead of live stream
**Symptoms:** Pressing OK on a camera card opens `com.tplink.iot/.view.main.MainActivity` (app menu) instead of full-screen camera stream (`TapoPadVideoPlayV3Activity`).

**Cause:** The click token prop was not incremented, or view tree introspection failed and fell back to standard package launch.

**Diagnostic Check:**
Run `logcat` while pressing OK on the card:
```bash
adb logcat -s AppWidgetViewManager:V TapoWidget:V
```
Verify that `triggerWidgetClick()` executes DFS introspection or MotionEvent fallback.

---

### Issue 4.2: Target app uninstalled / Missing provider fallback
**Symptoms:** Removing TP-Link Tapo or tinyCam causes a crash on home screen load.

**Solution:**
`tvlauncher` handles missing providers gracefully by catching provider lookup exceptions and displaying a placeholder card (`"Widget Unavailable"`). Ensure any custom code wraps provider instantiation in try/catch blocks.

---

## 5. Display Density & Resolution Tweaks

### Issue 5.1: UI elements appear oversized or clipped on 4K TV
**Symptoms:** Widget tiles overflow the screen or text is scaled incorrectly.

**Solution:**
Apply the optimal density override tuned for 4K streaming boxes (e.g. Onn 4K):
```bash
adb shell wm density 309
```
To reset density to factory default:
```bash
adb shell wm density reset
```

---

## Quick Diagnostic Checklist

```bash
# 1. Check device connectivity
adb devices

# 2. Check active launcher role holder
adb shell cmd role get-role-holders android.app.role.HOME

# 3. Check AppWidget host bindings
adb shell dumpsys appwidget | grep -i com.tvlauncher

# 4. Stream real-time app logs
adb logcat -v time | grep -E "(com.tvlauncher|AppWidget|com.tplink.iot)"
```
