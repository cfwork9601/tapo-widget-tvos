package com.widgetlauncher.widgethost

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream

class SnapshotContentProvider : ContentProvider() {

  companion object {
    const val AUTHORITY = "com.widgetlauncher.snapshots"
    val CONTENT_URI: Uri = Uri.parse("content://$AUTHORITY")

    fun getSnapshotUri(cameraId: String, timestamp: Long = 0L): Uri {
      val base = "content://$AUTHORITY/$cameraId.jpg"
      return if (timestamp > 0L) {
        Uri.parse("$base?t=$timestamp")
      } else {
        Uri.parse(base)
      }
    }

    fun getSnapshotFile(context: Context, cameraId: String): File {
      val dir = File(context.cacheDir, "snapshots")
      if (!dir.exists()) {
        dir.mkdirs()
      }
      return File(dir, "$cameraId.jpg")
    }

    fun generateDefaultSnapshot(targetFile: File, title: String = "Tapo Camera") {
      try {
        val width = 1280
        val height = 720
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Dark slate background
        val bgPaint = Paint().apply { color = Color.parseColor("#090d16") }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        // Accent card border
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.parseColor("#1e293b")
          style = Paint.Style.STROKE
          strokeWidth = 6f
        }
        val rect = RectF(12f, 12f, width - 12f, height - 12f)
        canvas.drawRoundRect(rect, 20f, 20f, strokePaint)

        // Center badge
        val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.parseColor("#0284c7")
          style = Paint.Style.FILL
        }
        canvas.drawCircle(width / 2f, height / 2f - 40f, 60f, circlePaint)

        val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.WHITE
          textSize = 52f
          textAlign = Paint.Align.CENTER
        }
        canvas.drawText("📹", width / 2f, height / 2f - 22f, iconPaint)

        // Title
        val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.WHITE
          textSize = 44f
          textAlign = Paint.Align.CENTER
          isFakeBoldText = true
        }
        canvas.drawText(title, width / 2f, height / 2f + 70f, titlePaint)

        // Status
        val statusPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.parseColor("#38bdf8")
          textSize = 24f
          textAlign = Paint.Align.CENTER
        }
        canvas.drawText("● TAPO LIVE FEED", width / 2f, height / 2f + 120f, statusPaint)

        FileOutputStream(targetFile).use { out ->
          bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
        }
        targetFile.setReadable(true, false)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  override fun onCreate(): Boolean {
    return true
  }

  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
    val ctx = context ?: throw FileNotFoundException("Context is null")
    val filename = uri.lastPathSegment ?: throw FileNotFoundException("Invalid URI segment")
    val dir = File(ctx.cacheDir, "snapshots")
    if (!dir.exists()) {
      dir.mkdirs()
    }
    val file = File(dir, filename)

    if (!file.exists() || file.length() == 0L) {
      val baseName = filename.removeSuffix(".jpg")
      generateDefaultSnapshot(file, baseName)
    }

    if (file.exists()) {
      return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    throw FileNotFoundException("Snapshot unavailable: $filename")
  }

  override fun openAssetFile(uri: Uri, mode: String): AssetFileDescriptor? {
    val pfd = openFile(uri, mode) ?: return null
    return AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH)
  }

  override fun getType(uri: Uri): String {
    return "image/jpeg"
  }

  override fun query(
    uri: Uri,
    projection: Array<out String>?,
    selection: String?,
    selectionArgs: Array<out String>?,
    sortOrder: String?
  ): Cursor? = null

  override fun insert(uri: Uri, values: ContentValues?): Uri? = null

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

  override fun update(
    uri: Uri,
    values: ContentValues?,
    selection: String?,
    selectionArgs: Array<out String>?
  ): Int = 0
}
