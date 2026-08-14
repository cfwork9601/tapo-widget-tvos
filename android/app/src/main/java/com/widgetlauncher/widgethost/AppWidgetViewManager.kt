package com.widgetlauncher.widgethost

import android.appwidget.AppWidgetHostView
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProviderInfo
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.os.SystemClock
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import java.io.FileOutputStream

class AppWidgetViewContainer(context: Context) : FrameLayout(context) {

  var appWidgetId: Int = -1
    set(value) {
      if (field != value) {
        field = value
        rebind()
      }
    }

  var packageName: String? = null
    set(value) {
      if (field != value) {
        field = value
        rebind()
      }
    }

  var className: String? = null
    set(value) {
      if (field != value) {
        field = value
        rebind()
      }
    }

  private var isRebinding = false
  private var currentBoundId: Int = -1
  private var currentBoundPkg: String? = null
  private var currentBoundCls: String? = null
  private var hostView: AppWidgetHostView? = null

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    if (visibility == View.VISIBLE) {
      scheduleSnapshotCaptures()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    scheduleSnapshotCaptures()
  }

  fun rebind() {
    val pkg = packageName
    val cls = className

    if (pkg.isNullOrEmpty() || cls.isNullOrEmpty()) {
      showFallbackView("Select a Camera Widget")
      return
    }

    if (pkg == currentBoundPkg && cls == currentBoundCls && hostView != null) {
      if (appWidgetId <= 0 || appWidgetId == currentBoundId) {
        return
      }
    }

    isRebinding = true
    try {
      performRebind(pkg, cls)
    } finally {
      isRebinding = false
    }
  }

  private fun performRebind(pkg: String, cls: String) {
    removeAllViews()
    hostView = null

    try {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val host = AppWidgetHostManager.getHost(context)
      val providerComponent = ComponentName(pkg, cls)

      val targetId = appWidgetId
      var info: AppWidgetProviderInfo? = null

      if (targetId <= 0) {
        showFallbackView("Widget ID unavailable\n($pkg)")
        return
      }

      info = appWidgetManager.getAppWidgetInfo(targetId)
      if (info == null) {
        val bound = appWidgetManager.bindAppWidgetIdIfAllowed(targetId, providerComponent)
        if (bound) {
          info = appWidgetManager.getAppWidgetInfo(targetId)
        }
      }

      if (info != null) {
        // Use pure application context with DeviceDefault theme to prevent AppCompatViewInflater
        // from substituting RemoteViews ImageViews with AppCompatImageView (which breaks RemoteViews reflection)
        val pureContext = ContextThemeWrapper(context.applicationContext, android.R.style.Theme_DeviceDefault)
        val v = host.createView(pureContext, targetId, info)
        v.setAppWidget(targetId, info)
        if (v is CustomAppWidgetHostView) {
          v.onWidgetUpdated = {
            postDelayed({ scheduleSnapshotCaptures() }, 400)
          }
        }
        hostView = v
        currentBoundPkg = pkg
        currentBoundCls = cls
        addView(v, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        scheduleSnapshotCaptures()
      } else {
        showFallbackView("Widget Not Bound\n($pkg)")
      }
    } catch (e: Exception) {
      e.printStackTrace()
      showFallbackView("Error: ${e.message}")
    }
  }

  var snapshotId: String? = null
    set(value) {
      field = value
      scheduleSnapshotCaptures()
    }

  fun scheduleSnapshotCaptures() {
    val id = snapshotId ?: return
    // Multi-stage capture to guarantee capturing initialized bitmap once camera frame streams
    postDelayed({ doCapture(id) }, 800)
    postDelayed({ doCapture(id) }, 2500)
  }

  private fun findLargestImageView(root: View): ImageView? {
    var largest: ImageView? = null
    var maxArea = 0L

    fun dfs(v: View) {
      if (v is ImageView) {
        val d = v.drawable
        if (d != null) {
          val area = v.width.toLong() * v.height.toLong()
          if (area > maxArea) {
            maxArea = area
            largest = v
          }
        }
      }
      if (v is ViewGroup) {
        for (i in 0 until v.childCount) {
          dfs(v.getChildAt(i))
        }
      }
    }

    dfs(root)
    return largest
  }

  private fun extractCleanCameraBitmap(root: View): Bitmap? {
    val imgView = findLargestImageView(root)
    if (imgView != null && imgView.drawable != null && imgView.width > 0 && imgView.height > 0) {
      val d = imgView.drawable
      if (d is BitmapDrawable && d.bitmap != null && !d.bitmap.isRecycled) {
        return d.bitmap
      }
      // If custom/vector drawable, draw specifically this ImageView without container UI
      val bmp = Bitmap.createBitmap(imgView.width, imgView.height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      imgView.draw(canvas)
      return bmp
    }
    return null
  }

  private fun doCapture(id: String) {
    try {
      val v = hostView ?: return
      if (v.width <= 0 || v.height <= 0) return

      val cleanBitmap = extractCleanCameraBitmap(v)
      val finalBitmap = cleanBitmap ?: run {
        val fallback = Bitmap.createBitmap(v.width, v.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(fallback)
        v.draw(canvas)
        fallback
      }

      val file = SnapshotContentProvider.getSnapshotFile(context, id)
      FileOutputStream(file).use { out ->
        finalBitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
      }
      file.setReadable(true, false)
      TapoPreviewChannelManager.notifySnapshotUpdated(context, id)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  private fun showFallbackView(message: String) {
    removeAllViews()
    currentBoundId = -1
    currentBoundPkg = null
    currentBoundCls = null
    hostView = null
    val tv = TextView(context).apply {
      text = message
      setTextColor(Color.parseColor("#94a3b8"))
      textSize = 14f
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#1e293b"))
    }
    addView(tv, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  fun triggerWidgetClick() {
    val v = hostView ?: if (childCount > 0) getChildAt(0) else null
    if (v != null) {
      val width = if (v.width > 0) v.width.toFloat() else 540f
      val height = if (v.height > 0) v.height.toFloat() else 380f

      // Target the "Go Live" button at the bottom-left of the Tapo camera widget
      // (x = 25% width, y = 88% height) to trigger TapoPadVideoPlayV3Activity
      val x = width * 0.25f
      val y = height * 0.88f

      val downTime = SystemClock.uptimeMillis()
      val eventTime = SystemClock.uptimeMillis()

      val downEvent = MotionEvent.obtain(downTime, eventTime, MotionEvent.ACTION_DOWN, x, y, 0)
      val upEvent = MotionEvent.obtain(downTime, eventTime + 80, MotionEvent.ACTION_UP, x, y, 0)

      v.dispatchTouchEvent(downEvent)
      v.dispatchTouchEvent(upEvent)

      downEvent.recycle()
      upEvent.recycle()
    }
  }
}

class AppWidgetViewManager(private val reactContext: ReactApplicationContext) : SimpleViewManager<AppWidgetViewContainer>() {

  override fun getName(): String = "AppWidgetView"

  override fun createViewInstance(reactContext: ThemedReactContext): AppWidgetViewContainer {
    return AppWidgetViewContainer(reactContext)
  }

  @ReactProp(name = "appWidgetId", defaultInt = -1)
  fun setAppWidgetId(view: AppWidgetViewContainer, appWidgetId: Int) {
    view.appWidgetId = appWidgetId
  }

  @ReactProp(name = "packageName")
  fun setPackageName(view: AppWidgetViewContainer, packageName: String?) {
    view.packageName = packageName
  }

  @ReactProp(name = "className")
  fun setClassName(view: AppWidgetViewContainer, className: String?) {
    view.className = className
  }

  @ReactProp(name = "clickToken")
  fun setClickToken(view: AppWidgetViewContainer, clickToken: Int) {
    if (clickToken > 0) {
      view.triggerWidgetClick()
    }
  }

  @ReactProp(name = "snapshotId")
  fun setSnapshotId(view: AppWidgetViewContainer, snapshotId: String?) {
    view.snapshotId = snapshotId
  }
}
