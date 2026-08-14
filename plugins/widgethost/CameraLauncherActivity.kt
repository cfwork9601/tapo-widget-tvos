package com.widgetlauncher.widgethost

import android.app.Activity
import android.appwidget.AppWidgetHostView
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.FrameLayout

class CameraLauncherActivity : Activity() {

  companion object {
    private const val TAG = "CameraLauncherActivity"
    const val EXTRA_CAMERA_ID = "extra_camera_id"
    const val EXTRA_CAMERA_NAME = "extra_camera_name"
    const val EXTRA_APP_WIDGET_ID = "extra_app_widget_id"
  }

  private var cameraId: String? = null
  private var cameraName: String? = null
  private var appWidgetId: Int = -1
  private var hasLaunched = false
  private var isFinishingCapture = false
  private var hostView: AppWidgetHostView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    Log.d(TAG, "onCreate: intent=${intent}")

    cameraId = intent.getStringExtra(EXTRA_CAMERA_ID)
    cameraName = intent.getStringExtra(EXTRA_CAMERA_NAME)
    appWidgetId = intent.getIntExtra(EXTRA_APP_WIDGET_ID, -1)

    Log.d(TAG, "onCreate: cameraId=$cameraId, cameraName=$cameraName, appWidgetId=$appWidgetId")

    if (!hasLaunched) {
      hasLaunched = true
      launchTapoLiveView()
    }
  }

  private fun launchTapoLiveView() {
    try {
      val widgetId = appWidgetId
      if (widgetId > 0) {
        val appWidgetManager = AppWidgetManager.getInstance(this)
        val info = appWidgetManager.getAppWidgetInfo(widgetId)
        val host = AppWidgetHostManager.getHost(this)
        val hv = host.createView(this, widgetId, info)
        hostView = hv

        val width = 540
        val height = 380
        hv.layout(0, 0, width, height)

        val root = FrameLayout(this)
        root.addView(hv, ViewGroup.LayoutParams(width, height))
        setContentView(root)

        // Give a short tick for RemoteViews inflation, then dispatch the click event
        Handler(Looper.getMainLooper()).postDelayed({
          try {
            val x = width * 0.25f
            val y = height * 0.88f
            val downTime = SystemClock.uptimeMillis()
            val eventTime = SystemClock.uptimeMillis()

            val downEvent = MotionEvent.obtain(downTime, eventTime, MotionEvent.ACTION_DOWN, x, y, 0)
            val upEvent = MotionEvent.obtain(downTime, eventTime + 80, MotionEvent.ACTION_UP, x, y, 0)

            hv.dispatchTouchEvent(downEvent)
            hv.dispatchTouchEvent(upEvent)

            downEvent.recycle()
            upEvent.recycle()
            Log.d(TAG, "Dispatched Go Live touch to widgetId=$widgetId")
          } catch (e: Exception) {
            Log.e(TAG, "Error dispatching touch to widget", e)
          }
        }, 120)
      } else {
        // Fallback: Launch Tapo App
        Log.w(TAG, "No valid appWidgetId ($widgetId), launching Tapo main app")
        val launchIntent = packageManager.getLaunchIntentForPackage("com.tplink.iot")
        if (launchIntent != null) {
          startActivity(launchIntent)
        } else {
          finish()
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed in launchTapoLiveView", e)
      finish()
    }
  }

  override fun onResume() {
    super.onResume()
    Log.d(TAG, "onResume: hasLaunched=$hasLaunched")
    // When returning from full-screen Tapo live stream
    if (hasLaunched) {
      performPostViewCaptureAndExit()
    }
  }

  private fun performPostViewCaptureAndExit() {
    if (isFinishingCapture) return
    isFinishingCapture = true

    val camId = cameraId
    val widgetId = appWidgetId

    Log.d(TAG, "performPostViewCaptureAndExit: camId=$camId, widgetId=$widgetId")

    if (widgetId > 0 && !camId.isNullOrEmpty()) {
      AppWidgetSnapshotCaptureHelper.captureWidgetSnapshot(applicationContext, widgetId, camId)
    }

    Handler(Looper.getMainLooper()).postDelayed({
      finish()
    }, 600)
  }
}
