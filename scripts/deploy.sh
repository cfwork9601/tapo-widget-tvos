#!/usr/bin/env bash
set -e

# Default target devices if none specified in command line arguments
DEVICES=("${@}")
if [ ${#DEVICES[@]} -eq 0 ]; then
  DEVICES=("192.168.1.67:5555" "192.168.1.73:5555")
fi

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
  APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo "================================================="
echo "  tapo-widget Multi-Device Distribution Deployer"
echo "  Target Devices: ${DEVICES[*]}"
echo "  Target APK: ${APK_PATH}"
echo "================================================="

for TARGET in "${DEVICES[@]}"; do
  # Add default port 5555 if not present
  if [[ "$TARGET" != *":"* ]]; then
    DEVICE_IP="${TARGET}:5555"
  else
    DEVICE_IP="${TARGET}"
  fi

  echo ""
  echo "==> Deploying to ${DEVICE_IP}..."
  adb connect "${DEVICE_IP}" || true

  if adb -s "${DEVICE_IP}" get-state > /dev/null 2>&1; then
    echo "  [1/5] Setting display density to 309..."
    adb -s "${DEVICE_IP}" shell wm density 309 || true

    echo "  [2/5] Pushing APK (${APK_PATH})..."
    adb -s "${DEVICE_IP}" push "${APK_PATH}" /data/local/tmp/tapo-widget.apk

    echo "  [3/5] Installing APK..."
    adb -s "${DEVICE_IP}" shell pm install -r /data/local/tmp/tapo-widget.apk

    echo "  [4/5] Granting appwidget bind permission silently..."
    adb -s "${DEVICE_IP}" shell appwidget grantbind --package com.tvlauncher --user 0 || true

    echo "  [5/5] Setting default HOME launcher role & launching..."
    adb -s "${DEVICE_IP}" shell cmd role add-role-holder --user 0 android.app.role.HOME com.tvlauncher || true
    adb -s "${DEVICE_IP}" shell am start -n com.tvlauncher/.MainActivity || true

    echo "  ✅ Successfully deployed tapo-widget to ${DEVICE_IP}!"
  else
    echo "  ⚠️ Skipping ${DEVICE_IP}: Device not available via ADB."
  fi
done

echo ""
echo "🎉 Multi-device deployment process complete!"
