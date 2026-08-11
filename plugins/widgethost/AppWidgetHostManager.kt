package com.widgetlauncher.widgethost

import android.appwidget.AppWidgetHost
import android.content.Context

object AppWidgetHostManager {
  private const val HOST_ID = 1024
  private var appWidgetHost: AppWidgetHost? = null
  private var isListening = false

  @Synchronized
  fun getHost(context: Context): AppWidgetHost {
    if (appWidgetHost == null) {
      appWidgetHost = AppWidgetHost(context.applicationContext, HOST_ID)
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
