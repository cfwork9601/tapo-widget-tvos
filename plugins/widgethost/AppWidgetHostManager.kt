package com.widgetlauncher.widgethost

import android.appwidget.AppWidgetHost
import android.appwidget.AppWidgetHostView
import android.appwidget.AppWidgetProviderInfo
import android.content.Context
import android.widget.RemoteViews

class CustomAppWidgetHostView(context: Context) : AppWidgetHostView(context) {
  var onWidgetUpdated: (() -> Unit)? = null

  override fun updateAppWidget(remoteViews: RemoteViews?) {
    super.updateAppWidget(remoteViews)
    onWidgetUpdated?.invoke()
  }
}

class CustomAppWidgetHost(context: Context, hostId: Int) : AppWidgetHost(context, hostId) {
  override fun onCreateView(
    context: Context,
    appWidgetId: Int,
    appWidget: AppWidgetProviderInfo?
  ): AppWidgetHostView {
    return CustomAppWidgetHostView(context)
  }
}

object AppWidgetHostManager {
  private const val HOST_ID = 1024
  private var appWidgetHost: AppWidgetHost? = null
  private var isListening = false

  @Synchronized
  fun getHost(context: Context): AppWidgetHost {
    if (appWidgetHost == null) {
      appWidgetHost = CustomAppWidgetHost(context.applicationContext, HOST_ID)
    }
    return appWidgetHost!!
  }

  @Synchronized
  fun startListening(context: Context) {
    val host = getHost(context)
    if (!isListening) {
      try {
        host.startListening()
        isListening = true
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  @Synchronized
  fun allocateAppWidgetId(context: Context): Int {
    return try {
      getHost(context).allocateAppWidgetId()
    } catch (e: Exception) {
      e.printStackTrace()
      -1
    }
  }

  @Synchronized
  fun deleteAppWidgetId(context: Context, appWidgetId: Int) {
    if (appWidgetId <= 0) return
    try {
      getHost(context).deleteAppWidgetId(appWidgetId)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @Synchronized
  fun stopListening() {
    if (isListening) {
      try {
        appWidgetHost?.stopListening()
      } catch (e: Exception) {
        e.printStackTrace()
      }
      isListening = false
    }
  }
}
