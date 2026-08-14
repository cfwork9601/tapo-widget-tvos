package com.widgetlauncher.widgethost

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper

class CameraLauncherActivity : Activity() {

  companion object {
    const val EXTRA_CAMERA_ID = "extra_camera_id"
    const val EXTRA_CAMERA_NAME = "extra_camera_name"
    const val EXTRA_APP_WIDGET_ID = "extra_app_widget_id"
    private const val REQUEST_CODE_TAPO = 1001
  }

  private var cameraId: String? = null
  private var cameraName: String? = null
  private var appWidgetId: Int = -1
  private var hasLaunched = false
  private var isFinishingCapture = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    cameraId = intent.getStringExtra(EXTRA_CAMERA_ID)
    cameraName = intent.getStringExtra(EXTRA_CAMERA_NAME)
    appWidgetId = intent.getIntExtra(EXTRA_APP_WIDGET_ID, -1)

    if (!hasLaunched) {
      hasLaunched = true
      launchTapoLiveView()
    }
  }

  private fun launchTapoLiveView() {
    try {
      val name = cameraName ?: "Camera"
      val cleanName = name.replace(Regex("[^a-zA-Z0-9_]"), "")
      val playIntent = Intent().apply {
        component = ComponentName(
          "com.tplink.iot",
          "com.tplink.iot.view.ipcamera.play.TapoPadVideoPlayV3Activity"
        )
        putExtra("device_name", cleanName)
        putExtra("camera_name", cleanName)
        putExtra("source", "tv_launcher")
        putExtra("from", "tv_channel")
      }
      startActivityForResult(playIntent, REQUEST_CODE_TAPO)
    } catch (e: Exception) {
      e.printStackTrace()
      finish()
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    performPostViewCaptureAndExit()
  }

  override fun onResume() {
    super.onResume()
    if (hasLaunched) {
      performPostViewCaptureAndExit()
    }
  }

  private fun performPostViewCaptureAndExit() {
    if (isFinishingCapture) return
    isFinishingCapture = true

    val camId = cameraId
    val widgetId = appWidgetId

    if (widgetId > 0 && !camId.isNullOrEmpty()) {
      AppWidgetSnapshotCaptureHelper.captureWidgetSnapshot(applicationContext, widgetId, camId)
    }

    Handler(Looper.getMainLooper()).postDelayed({
      finish()
    }, 600)
  }
}
