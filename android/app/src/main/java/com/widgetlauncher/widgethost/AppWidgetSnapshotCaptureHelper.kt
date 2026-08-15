package com.widgetlauncher.widgethost

import android.appwidget.AppWidgetManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.BitmapDrawable
import android.os.Handler
import android.os.Looper
import android.view.ContextThemeWrapper
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object AppWidgetSnapshotCaptureHelper {

  fun findLargestImageView(root: View): ImageView? {
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

  fun findLastViewTimestamp(root: View): String? {
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

  fun findDeviceName(root: View): String? {
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

    for (raw in texts) {
      var t = raw
      if (t.startsWith("Tapo Camera -", ignoreCase = true)) {
        t = t.substringAfter("-").trim()
      } else if (t.startsWith("Tapo Plug -", ignoreCase = true)) {
        t = t.substringAfter("-").trim()
      } else if (t.startsWith("Tapo Bulb -", ignoreCase = true)) {
        t = t.substringAfter("-").trim()
      }

      if (t.equals("Last view at", ignoreCase = true) ||
          t.equals("Last viewed at", ignoreCase = true) ||
          t.startsWith("Last view", ignoreCase = true) ||
          t.matches(Regex(".*\\d{1,2}:\\d{2}.*")) ||
          t.equals("Tap to select", ignoreCase = true) ||
          t.equals("Select a camera", ignoreCase = true) ||
          t.equals("Select device", ignoreCase = true) ||
          t.equals("Privacy Mode", ignoreCase = true) ||
          t.equals("Live", ignoreCase = true) ||
          t.equals("Offline", ignoreCase = true) ||
          t.equals("Tapo", ignoreCase = true) ||
          t.equals("Tapo Camera", ignoreCase = true) ||
          t.equals("Tapo Plug", ignoreCase = true) ||
          t.equals("Tapo Bulb", ignoreCase = true) ||
          t.equals("Tapo Smart Plug", ignoreCase = true) ||
          t.equals("Tapo Smart Bulb", ignoreCase = true) ||
          t.equals("Smart Plug", ignoreCase = true) ||
          t.equals("Camera", ignoreCase = true) ||
          t.equals("Bulb", ignoreCase = true) ||
          t.equals("Switch", ignoreCase = true) ||
          t.equals("On", ignoreCase = true) ||
          t.equals("Off", ignoreCase = true)) {
        continue
      }
      return t
    }
    return null
  }

  fun extractCleanCameraBitmap(root: View): Bitmap? {
    val imgView = findLargestImageView(root)
    if (imgView != null && imgView.drawable != null && imgView.width > 0 && imgView.height > 0) {
      val d = imgView.drawable
      if (d is BitmapDrawable && d.bitmap != null && !d.bitmap.isRecycled) {
        return d.bitmap
      }
      val bmp = Bitmap.createBitmap(imgView.width, imgView.height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      imgView.draw(canvas)
      return bmp
    }
    return null
  }

  fun drawTimestampOverlay(bitmap: Bitmap, customText: String? = null): Bitmap {
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

    val x = textSize * 0.5f
    val y = textSize * 0.5f

    val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.parseColor("#D90F172A")
      style = Paint.Style.FILL
    }

    val rect = RectF(x, y, x + badgeWidth, y + badgeHeight)
    canvas.drawRoundRect(rect, textSize * 0.25f, textSize * 0.25f, bgPaint)

    val textX = x + paddingX
    val textY = y + paddingY - fontMetrics.ascent
    canvas.drawText(text, textX, textY, paint)

    return mutableBitmap
  }

  fun captureWidgetSnapshot(context: Context, appWidgetId: Int, cameraId: String): Boolean {
    return try {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val host = AppWidgetHostManager.getHost(context)
      val info = appWidgetManager.getAppWidgetInfo(appWidgetId) ?: return false

      val pureContext = ContextThemeWrapper(context.applicationContext, android.R.style.Theme_DeviceDefault)
      val hostView = host.createView(pureContext, appWidgetId, info)
      hostView.setAppWidget(appWidgetId, info)

      val width = 1280
      val height = 720
      hostView.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
      )
      hostView.layout(0, 0, width, height)

      // Allow 400ms for remote layout hierarchy to bind
      Handler(Looper.getMainLooper()).postDelayed({
        try {
          val lastViewText = findLastViewTimestamp(hostView)
          val cleanBitmap = extractCleanCameraBitmap(hostView)
          val baseBitmap = cleanBitmap ?: run {
            val fallback = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(fallback)
            hostView.draw(canvas)
            fallback
          }

          val finalBitmap = drawTimestampOverlay(baseBitmap, lastViewText)
          val file = SnapshotContentProvider.getSnapshotFile(context, cameraId)
          FileOutputStream(file).use { out ->
            finalBitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
          }
          file.setReadable(true, false)
          TapoPreviewChannelManager.notifySnapshotUpdated(context, cameraId)
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }, 400)

      true
    } catch (e: Exception) {
      e.printStackTrace()
      false
    }
  }
}
