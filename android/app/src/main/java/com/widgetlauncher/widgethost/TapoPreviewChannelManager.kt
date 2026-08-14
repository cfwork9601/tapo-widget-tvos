package com.widgetlauncher.widgethost

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.net.Uri
import androidx.tvprovider.media.tv.PreviewChannel
import androidx.tvprovider.media.tv.PreviewChannelHelper
import androidx.tvprovider.media.tv.PreviewProgram
import androidx.tvprovider.media.tv.TvContractCompat
import java.io.File
import java.io.FileOutputStream

object TapoPreviewChannelManager {

  private const val CHANNEL_KEY = "tapo_live_cameras_channel_id"

  fun publishCamerasChannel(
    context: Context,
    cameras: List<CameraItem>
  ): Long {
    val helper = PreviewChannelHelper(context)
    val prefs = context.getSharedPreferences("widgetlauncher_prefs", Context.MODE_PRIVATE)
    var channelId = prefs.getLong(CHANNEL_KEY, -1L)

    var existingChannel: PreviewChannel? = null
    if (channelId > 0) {
      try {
        existingChannel = helper.getPreviewChannel(channelId)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    if (existingChannel == null) {
      val logo = createDefaultChannelLogo()
      val channelBuilder = PreviewChannel.Builder()
        .setDisplayName("Tapo Live Cameras")
        .setDescription("Live security camera previews from TP-Link Tapo")
        .setAppLinkIntentUri(Uri.parse("widget-hub://"))
        .setLogo(logo)

      val newChannel = channelBuilder.build()
      channelId = helper.publishChannel(newChannel)
      prefs.edit().putLong(CHANNEL_KEY, channelId).apply()

      try {
        TvContractCompat.requestChannelBrowsable(context, channelId)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    // Update programs inside the channel
    try {
      val channelProgramsUri = TvContractCompat.buildPreviewProgramsUriForChannel(channelId)
      context.contentResolver.delete(channelProgramsUri, null, null)

      for (cam in cameras) {
        val snapshotFile = SnapshotContentProvider.getSnapshotFile(context, cam.id)
        if (!snapshotFile.exists() || snapshotFile.length() == 0L) {
          generatePlaceholderSnapshot(snapshotFile, cam.name)
        }

        val posterUri = SnapshotContentProvider.getSnapshotUri(cam.id)
        val intentUri = createCameraLaunchIntentUri(cam.name)

        // Grant URI read permissions to TV launchers
        val launchers = listOf("com.tvlauncher", "com.google.android.apps.tv.launcherx", "com.google.android.tvlauncher")
        for (launcher in launchers) {
          try {
            context.grantUriPermission(launcher, posterUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
          } catch (ignored: Exception) {}
        }

        val program = PreviewProgram.Builder()
          .setChannelId(channelId)
          .setTitle(cam.name)
          .setDescription(cam.description.ifEmpty { "1080p HD Live Stream" })
          .setPosterArtUri(posterUri)
          .setPosterArtAspectRatio(TvContractCompat.PreviewPrograms.ASPECT_RATIO_16_9)
          .setThumbnailUri(posterUri)
          .setThumbnailAspectRatio(TvContractCompat.PreviewPrograms.ASPECT_RATIO_16_9)
          .setIntentUri(intentUri)
          .setType(TvContractCompat.PreviewPrograms.TYPE_CLIP)
          .setLive(true)
          .build()

        helper.publishPreviewProgram(program)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }

    return channelId
  }

  private fun createCameraLaunchIntentUri(cameraName: String): Uri {
    val intent = Intent(Intent.ACTION_VIEW).apply {
      data = Uri.parse("widget-hub://live?name=${Uri.encode(cameraName)}")
      setPackage("com.widgetlauncher")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME))
  }

  private fun createDefaultChannelLogo(): Bitmap {
    val bitmap = Bitmap.createBitmap(80, 80, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.parseColor("#0ea5e9")
      style = Paint.Style.FILL
    }
    canvas.drawCircle(40f, 40f, 40f, paint)

    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      textSize = 36f
      textAlign = Paint.Align.CENTER
    }
    canvas.drawText("📹", 40f, 52f, textPaint)
    return bitmap
  }

  private fun generatePlaceholderSnapshot(targetFile: File, title: String) {
    try {
      val width = 1280
      val height = 720
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)

      // Background gradient / dark theme
      val bgPaint = Paint().apply {
        color = Color.parseColor("#0a0f1d")
      }
      canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

      // Accent card outline
      val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#1e293b")
        style = Paint.Style.STROKE
        strokeWidth = 8f
      }
      val rect = RectF(16f, 16f, width - 16f, height - 16f)
      canvas.drawRoundRect(rect, 24f, 24f, strokePaint)

      // Camera Icon Circle
      val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#0284c7")
        style = Paint.Style.FILL
      }
      canvas.drawCircle(width / 2f, height / 2f - 60f, 70f, circlePaint)

      val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 64f
        textAlign = Paint.Align.CENTER
      }
      canvas.drawText("📹", width / 2f, height / 2f - 38f, iconPaint)

      // Title
      val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 48f
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
      }
      canvas.drawText(title, width / 2f, height / 2f + 70f, titlePaint)

      // Subtitle
      val subPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38bdf8")
        textSize = 28f
        textAlign = Paint.Align.CENTER
      }
      canvas.drawText("● TAPO LIVE 1080P HD", width / 2f, height / 2f + 130f, subPaint)

      FileOutputStream(targetFile).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
      }
      targetFile.setReadable(true, false)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  data class CameraItem(
    val id: String,
    val name: String,
    val description: String = ""
  )
}
