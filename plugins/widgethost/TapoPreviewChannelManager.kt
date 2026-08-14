package com.widgetlauncher.widgethost

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
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

    // Check if existing channel is still valid
    var existingChannel: PreviewChannel? = null
    if (channelId > 0) {
      try {
        existingChannel = helper.getPreviewChannel(channelId)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    if (existingChannel == null) {
      // Create new Preview Channel
      val logo = createDefaultChannelLogo()
      val channelBuilder = PreviewChannel.Builder()
        .setDisplayName("Tapo Live Cameras")
        .setDescription("Live security camera feeds from TP-Link Tapo")
        .setAppLinkIntentUri(Uri.parse("widget-hub://"))
        .setLogo(logo)

      val newChannel = channelBuilder.build()
      channelId = helper.publishChannel(newChannel)
      prefs.edit().putLong(CHANNEL_KEY, channelId).apply()

      // Request channel to be browsable on TV home screen
      try {
        TvContractCompat.requestChannelBrowsable(context, channelId)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    // Update programs inside the channel
    try {
      // Clear old programs and republish fresh list
      context.contentResolver.delete(
        TvContractCompat.PreviewPrograms.CONTENT_URI,
        "${TvContractCompat.PreviewPrograms.COLUMN_CHANNEL_ID} = ?",
        arrayOf(channelId.toString())
      )

      for (cam in cameras) {
        val snapshotFile = SnapshotContentProvider.getSnapshotFile(context, cam.id)
        if (!snapshotFile.exists()) {
          generatePlaceholderSnapshot(snapshotFile, cam.name)
        }

        val posterUri = SnapshotContentProvider.getSnapshotUri(cam.id)
        val intentUri = createCameraLaunchIntentUri(cam.name)

        val program = PreviewProgram.Builder()
          .setChannelId(channelId)
          .setTitle(cam.name)
          .setDescription(cam.description.ifEmpty { "1080p HD Live Stream" })
          .setPosterArtUri(posterUri)
          .setPosterArtAspectRatio(TvContractCompat.PreviewPrograms.ASPECT_RATIO_16_9)
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

      // Dark cinematic background
      val bgPaint = Paint().apply {
        color = Color.parseColor("#0f172a")
      }
      canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

      // Center camera icon & label
      val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 54f
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
      }
      canvas.drawText(title, width / 2f, height / 2f, titlePaint)

      val subPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38bdf8")
        textSize = 32f
        textAlign = Paint.Align.CENTER
      }
      canvas.drawText("● TAPO LIVE PREVIEW", width / 2f, height / 2f + 60f, subPaint)

      FileOutputStream(targetFile).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
      }
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
