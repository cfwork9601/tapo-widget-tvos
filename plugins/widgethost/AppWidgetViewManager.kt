package com.widgetlauncher.widgethost

import android.appwidget.AppWidgetHostView
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProviderInfo
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.MapBuilder
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AppWidgetViewContainer(context: Context) : FrameLayout(context) {

  var cleanSnapshotMode: Boolean = false
    set(value) {
      if (field != value) {
        field = value
        updateViewVisibility()
      }
    }

  private val cleanImageView: ImageView = ImageView(context).apply {
    scaleType = ImageView.ScaleType.CENTER_CROP
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    visibility = View.GONE
  }

  init {
    setPadding(0, 0, 0, 0)
    addView(cleanImageView)
  }

  private fun updateViewVisibility() {
    if (cleanSnapshotMode && cleanImageView.drawable != null) {
      cleanImageView.visibility = View.VISIBLE
      hostView?.visibility = View.INVISIBLE
    } else {
      cleanImageView.visibility = View.GONE
      hostView?.visibility = View.VISIBLE
    }
  }

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
    addView(cleanImageView)
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
        v.setPadding(0, 0, 0, 0)
        if (v is CustomAppWidgetHostView) {
          v.onWidgetUpdated = {
            postDelayed({
              scheduleSnapshotCaptures()
              checkAndEmitDeviceName()
            }, 400)
          }
        }
        hostView = v
        currentBoundPkg = pkg
        currentBoundCls = cls
        addView(v, 0, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        updateViewVisibility()
        scheduleSnapshotCaptures()
        postDelayed({ checkAndEmitDeviceName() }, 800)
        postDelayed({ checkAndEmitDeviceName() }, 2000)
      } else {
        showFallbackView("Widget Not Bound\n($pkg)")
      }
    } catch (e: Exception) {
      e.printStackTrace()
      showFallbackView("Error: ${e.message}")
    }
  }

  fun checkAndEmitDeviceName() {
    val v = hostView ?: return
    val name = AppWidgetSnapshotCaptureHelper.findDeviceName(v)
    android.util.Log.i("AppWidgetViewManager", "checkAndEmitDeviceName for appWidgetId $appWidgetId: detected '$name'")
    if (!name.isNullOrBlank()) {
      val reactContext = context as? ThemedReactContext
      if (reactContext != null) {
        val event = Arguments.createMap().apply {
          putString("deviceName", name)
          putInt("appWidgetId", appWidgetId)
        }
        // 1. Direct view event
        try {
          reactContext.getJSModule(RCTEventEmitter::class.java)
            ?.receiveEvent(id, "topDeviceNameDetected", event)
        } catch (e: Exception) {
          // View may not be attached to JS hierarchy yet
        }
        // 2. Global device event emitter for guaranteed delivery
        try {
          reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onWidgetDeviceNameDetected", event)
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }

  var snapshotId: String? = null
    set(value) {
      field = value
      scheduleSnapshotCaptures()
    }

  fun scheduleSnapshotCaptures() {
    val id = snapshotId ?: if (appWidgetId > 0) "widget_$appWidgetId" else return
    // Multi-stage capture to guarantee capturing initialized bitmap once camera frame streams
    postDelayed({ doCapture(id) }, 400)
    postDelayed({ doCapture(id) }, 1200)
    postDelayed({ doCapture(id) }, 2500)
    postDelayed({ checkAndEmitDeviceName() }, 800)
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

  private fun findLastViewTimestamp(root: View): String? {
    val texts = mutableListOf<String>()
    fun dfs(v: View) {
      if (v is TextView) {
        val t = v.text?.toString()?.trim()
        if (!t.isNullOrEmpty()) {
          texts.add(t)
        }
      }
      if (v is ViewGroup) {
        for (i in 0 until v.childCount) {
          dfs(v.getChildAt(i))
        }
      }
    }
    dfs(root)

    for (i in 0 until texts.size) {
      val t = texts[i]
      if (t.equals("Last view at", ignoreCase = true) || t.equals("Last viewed at", ignoreCase = true)) {
        if (i + 1 < texts.size) {
          val next = texts[i + 1]
          if (next.matches(Regex("\\d{1,2}:\\d{2}.*"))) {
            return "$t $next"
          }
        }
      }
      if ((t.startsWith("Last view at", ignoreCase = true) || t.startsWith("Last viewed at", ignoreCase = true)) && t.matches(Regex(".*\\d{1,2}:\\d{2}.*"))) {
        return t
      }
    }
    return null
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

  private fun drawTimestampOverlay(bitmap: Bitmap, customText: String? = null): Bitmap {
    val mutableBitmap = if (bitmap.isMutable) bitmap else bitmap.copy(Bitmap.Config.ARGB_8888, true)
    val canvas = Canvas(mutableBitmap)

    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    val text = customText ?: "Last view at ${timeFormat.format(Date())}"

    val textSize = (mutableBitmap.height * 0.048f).coerceIn(28f, 52f)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      this.textSize = textSize
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
      setShadowLayer(4f, 1f, 1f, Color.parseColor("#CC000000"))
    }

    val textWidth = paint.measureText(text)
    val fontMetrics = paint.fontMetrics
    val textHeight = fontMetrics.descent - fontMetrics.ascent

    val paddingX = textSize * 0.5f
    val paddingY = textSize * 0.3f
    val badgeWidth = textWidth + paddingX * 2
    val badgeHeight = textHeight + paddingY * 2

    // Top-left position with proportional margin
    val x = textSize * 0.5f
    val y = textSize * 0.5f

    val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.parseColor("#D90F172A") // 85% opacity dark slate
      style = Paint.Style.FILL
    }

    val rect = RectF(x, y, x + badgeWidth, y + badgeHeight)
    canvas.drawRoundRect(rect, textSize * 0.25f, textSize * 0.25f, bgPaint)

    val textX = x + paddingX
    val textY = y + paddingY - fontMetrics.ascent
    canvas.drawText(text, textX, textY, paint)

    return mutableBitmap
  }

  private fun doCapture(id: String) {
    try {
      val v = hostView ?: return
      if (v.width <= 0 || v.height <= 0) return

      val lastViewText = findLastViewTimestamp(v)
      val deviceName = AppWidgetSnapshotCaptureHelper.findDeviceName(v)
      android.util.Log.i("AppWidgetViewManager", "doCapture for $id (appWidgetId: $appWidgetId): lastView='$lastViewText', deviceName='$deviceName'")

      if (!deviceName.isNullOrBlank()) {
        val reactContext = context as? ThemedReactContext
        if (reactContext != null) {
          val event = Arguments.createMap().apply {
            putString("instanceId", id)
            putString("deviceName", deviceName)
            putInt("appWidgetId", appWidgetId)
          }
          try {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              ?.emit("onWidgetDeviceNameDetected", event)
          } catch (e: Exception) {
            e.printStackTrace()
          }
        }
      }

      val cleanBitmap = extractCleanCameraBitmap(v)
      val baseBitmap = cleanBitmap ?: run {
        val fallback = Bitmap.createBitmap(v.width, v.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(fallback)
        v.draw(canvas)
        fallback
      }

      val finalBitmap = drawTimestampOverlay(baseBitmap, lastViewText)

      post {
        cleanImageView.setImageBitmap(finalBitmap)
        updateViewVisibility()
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

  private fun dispatchClickAt(v: View, x: Float, y: Float) {
    val downTime = SystemClock.uptimeMillis()
    val eventTime = SystemClock.uptimeMillis()
    val downEvent = MotionEvent.obtain(downTime, eventTime, MotionEvent.ACTION_DOWN, x, y, 0)
    val upEvent = MotionEvent.obtain(downTime, eventTime + 80, MotionEvent.ACTION_UP, x, y, 0)
    v.dispatchTouchEvent(downEvent)
    v.dispatchTouchEvent(upEvent)
    downEvent.recycle()
    upEvent.recycle()
  }

  fun triggerWidgetClick() {
    val v = hostView ?: if (childCount > 0) getChildAt(0) else null
    if (v != null) {
      val width = if (v.width > 0) v.width.toFloat() else 540f
      val height = if (v.height > 0) v.height.toFloat() else 380f

      // Target the "Go Live" button at the bottom-left of the Tapo camera widget
      // (x = 25% width, y = 88% height) to trigger TapoPadVideoPlayV3Activity
      dispatchClickAt(v, width * 0.25f, height * 0.88f)
    }
  }

  fun triggerConfigureClick() {
    val v = hostView ?: if (childCount > 0) getChildAt(0) else null
    if (v != null) {
      val width = if (v.width > 0) v.width.toFloat() else 540f
      val height = if (v.height > 0) v.height.toFloat() else 380f

      // 1. Dispatch click to Center (Setup / Select Device button on unconfigured widget)
      dispatchClickAt(v, width * 0.5f, height * 0.5f)

      // 2. Also dispatch click to bottom-right settings gear icon (x = 88%, y = 88%)
      postDelayed({
        dispatchClickAt(v, width * 0.88f, height * 0.88f)
      }, 100)
    }
  }
}

class AppWidgetViewManager(private val reactContext: ReactApplicationContext) : SimpleViewManager<AppWidgetViewContainer>() {

  override fun getName(): String = "AppWidgetView"

  override fun createViewInstance(reactContext: ThemedReactContext): AppWidgetViewContainer {
    return AppWidgetViewContainer(reactContext)
  }

  @ReactProp(name = "cleanSnapshotMode", defaultBoolean = false)
  fun setCleanSnapshotMode(view: AppWidgetViewContainer, cleanSnapshotMode: Boolean) {
    view.cleanSnapshotMode = cleanSnapshotMode
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

  @ReactProp(name = "configureToken")
  fun setConfigureToken(view: AppWidgetViewContainer, configureToken: Int) {
    if (configureToken > 0) {
      view.triggerConfigureClick()
    }
  }

  @ReactProp(name = "snapshotId")
  fun setSnapshotId(view: AppWidgetViewContainer, snapshotId: String?) {
    view.snapshotId = snapshotId
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
    return mutableMapOf(
      "topDeviceNameDetected" to mapOf("registrationName" to "onDeviceNameDetected")
    )
  }
}
