package com.widgetlauncher.widgethost

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException

class SnapshotContentProvider : ContentProvider() {

  companion object {
    const val AUTHORITY = "com.widgetlauncher.snapshots"
    val CONTENT_URI: Uri = Uri.parse("content://$AUTHORITY")

    fun getSnapshotUri(cameraId: String): Uri {
      return Uri.withAppendedPath(CONTENT_URI, "$cameraId.jpg")
    }

    fun getSnapshotFile(context: android.content.Context, cameraId: String): File {
      val dir = File(context.cacheDir, "snapshots")
      if (!dir.exists()) {
        dir.mkdirs()
      }
      return File(dir, "$cameraId.jpg")
    }
  }

  override fun onCreate(): Boolean {
    return true
  }

  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
    val context = context ?: throw FileNotFoundException("Context is null")
    val filename = uri.lastPathSegment ?: throw FileNotFoundException("Invalid URI segment")
    val dir = File(context.cacheDir, "snapshots")
    val file = File(dir, filename)

    if (file.exists()) {
      return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    throw FileNotFoundException("Snapshot not found: $filename")
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
