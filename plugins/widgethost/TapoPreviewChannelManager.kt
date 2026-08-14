package com.widgetlauncher.widgethost

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.Uri
import androidx.tvprovider.media.tv.PreviewChannel
import androidx.tvprovider.media.tv.PreviewChannelHelper
import androidx.tvprovider.media.tv.PreviewProgram
import androidx.tvprovider.media.tv.TvContractCompat
import java.io.File

object TapoPreviewChannelManager {

  private const val CHANNEL_KEY = "tapo_live_cameras_channel_id"

  private val TV_LAUNCHERS = listOf(
    "com.klevico.monet",
    "com.google.android.apps.tv.launcherx",
    "com.google.android.tvlauncher",
    "com.spocky.projengmenu",
    "com.amazon.firetv.launcher",
    "com.tvlauncher",
    "com.android.tv.settings"
  )

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
          SnapshotContentProvider.generateDefaultSnapshot(snapshotFile, cam.name)
        }

        val lastMod = if (snapshotFile.exists()) snapshotFile.lastModified() else System.currentTimeMillis()
        val posterUri = SnapshotContentProvider.getSnapshotUri(cam.id, lastMod)
        val intentUri = createCameraLaunchIntentUri(cam.name)

        // Grant URI read permissions broadly to TV launchers
        grantUriToLaunchers(context, posterUri)

        val program = PreviewProgram.Builder()
          .setChannelId(channelId)
          .setContentId(cam.id)
          .setInternalProviderId(cam.id)
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

      // Notify system database of fresh programs
      context.contentResolver.notifyChange(TvContractCompat.PreviewPrograms.CONTENT_URI, null)
    } catch (e: Exception) {
      e.printStackTrace()
    }

    return channelId
  }

  fun notifySnapshotUpdated(context: Context, cameraId: String, cameraName: String? = null) {
    try {
      val prefs = context.getSharedPreferences("widgetlauncher_prefs", Context.MODE_PRIVATE)
      val channelId = prefs.getLong(CHANNEL_KEY, -1L)
      if (channelId <= 0L) return

      val snapshotFile = SnapshotContentProvider.getSnapshotFile(context, cameraId)
      if (!snapshotFile.exists() || snapshotFile.length() == 0L) return

      val lastMod = snapshotFile.lastModified()
      val posterUri = SnapshotContentProvider.getSnapshotUri(cameraId, lastMod)

      grantUriToLaunchers(context, posterUri)

      // 1. Update TvProvider database row for this camera's PreviewProgram
      val values = ContentValues().apply {
        put(TvContractCompat.PreviewPrograms.COLUMN_POSTER_ART_URI, posterUri.toString())
        put(TvContractCompat.PreviewPrograms.COLUMN_THUMBNAIL_URI, posterUri.toString())
        if (!cameraName.isNullOrEmpty()) {
          put(TvContractCompat.PreviewPrograms.COLUMN_TITLE, cameraName)
        }
      }

      context.contentResolver.update(
        TvContractCompat.PreviewPrograms.CONTENT_URI,
        values,
        "${TvContractCompat.PreviewPrograms.COLUMN_CHANNEL_ID} = ? AND (${TvContractCompat.PreviewPrograms.COLUMN_CONTENT_ID} = ? OR ${TvContractCompat.PreviewPrograms.COLUMN_INTERNAL_PROVIDER_ID} = ?)",
        arrayOf(channelId.toString(), cameraId, cameraId)
      )

      // 2. Notify database observers (Monet Launcher, Google TV) that preview programs updated
      context.contentResolver.notifyChange(TvContractCompat.PreviewPrograms.CONTENT_URI, null)
      context.contentResolver.notifyChange(posterUri, null)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  private fun grantUriToLaunchers(context: Context, uri: Uri) {
    for (launcher in TV_LAUNCHERS) {
      try {
        context.grantUriPermission(launcher, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
      } catch (ignored: Exception) {}
    }
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

  data class CameraItem(
    val id: String,
    val name: String,
    val description: String = ""
  )
}
