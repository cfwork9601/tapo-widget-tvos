package com.widgetlauncher.widgethost

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class AppWidgetModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppWidgetModule"

  private val sharedPrefs: SharedPreferences
    get() = reactContext.getSharedPreferences("widgetlauncher_prefs", Context.MODE_PRIVATE)

  @ReactMethod
  fun getInstalledProviders(promise: Promise) {
    try {
      val appWidgetManager = AppWidgetManager.getInstance(reactContext)
      val providers = appWidgetManager.getInstalledProviders()
      val array: WritableArray = Arguments.createArray()

      val pm = reactContext.packageManager

      for (info in providers) {
        val map: WritableMap = Arguments.createMap()
        val pkgName = info.provider.packageName
        val clsName = info.provider.className
        val label = try {
          info.loadLabel(pm)?.toString() ?: info.provider.shortClassName.substringAfterLast('.')
        } catch (e: Exception) {
          info.provider.shortClassName.substringAfterLast('.')
        }

        map.putString("packageName", pkgName)
        map.putString("className", clsName)
        map.putString("label", label)
        map.putInt("minWidth", info.minWidth)
        map.putInt("minHeight", info.minHeight)
        map.putInt("minResizeWidth", info.minResizeWidth)
        map.putInt("minResizeHeight", info.minResizeHeight)
        map.putBoolean("hasConfigure", info.configure != null)

        array.pushMap(map)
      }
      promise.resolve(array)
    } catch (e: Exception) {
      promise.reject("ERR_GET_PROVIDERS", e.message, e)
    }
  }

  @ReactMethod
  fun configureWidget(appWidgetId: Int, promise: Promise) {
    try {
      val activity: Activity? = reactContext.currentActivity
      if (activity == null) {
        promise.reject("ERR_NO_ACTIVITY", "Current activity is null")
        return
      }

      val host = AppWidgetHostManager.getHost(reactContext)
      host.startAppWidgetConfigureActivityForResult(
        activity,
        appWidgetId,
        0,
        5001,
        null
      )
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_CONFIGURE", e.message, e)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
      if (intent != null) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    } catch (e: Exception) {
      promise.reject("ERR_LAUNCH_APP", e.message, e)
    }
  }

  @ReactMethod
  fun launchWidgetClick(packageName: String, appWidgetId: Int, promise: Promise) {
    launchApp(packageName, promise)
  }

  @ReactMethod
  fun saveSetting(key: String, value: String, promise: Promise) {
    try {
      sharedPrefs.edit().putString(key, value).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_SAVE_SETTING", e.message, e)
    }
  }

  @ReactMethod
  fun getSetting(key: String, promise: Promise) {
    try {
      val value = sharedPrefs.getString(key, null)
      promise.resolve(value)
    } catch (e: Exception) {
      promise.reject("ERR_GET_SETTING", e.message, e)
    }
  }

  @ReactMethod
  fun allocateAppWidgetId(promise: Promise) {
    try {
      val id = AppWidgetHostManager.allocateAppWidgetId(reactContext)
      promise.resolve(id)
    } catch (e: Exception) {
      promise.reject("ERR_ALLOCATE_ID", e.message, e)
    }
  }

  @ReactMethod
  fun deleteAppWidgetId(appWidgetId: Int, promise: Promise) {
    try {
      AppWidgetHostManager.deleteAppWidgetId(reactContext, appWidgetId)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_DELETE_ID", e.message, e)
    }
  }

  @ReactMethod
  fun publishPreviewChannel(camerasArray: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    try {
      val cameras = mutableListOf<TapoPreviewChannelManager.CameraItem>()
      for (i in 0 until camerasArray.size()) {
        val map = camerasArray.getMap(i)
        val id = map?.getString("id") ?: "cam_$i"
        val name = map?.getString("name") ?: "Tapo Camera"
        val desc = map?.getString("description") ?: ""
        val appWidgetId = if (map?.hasKey("appWidgetId") == true) map.getInt("appWidgetId") else -1
        cameras.add(TapoPreviewChannelManager.CameraItem(id, name, desc, appWidgetId))
      }

      val channelId = TapoPreviewChannelManager.publishCamerasChannel(reactContext, cameras)
      promise.resolve(channelId.toDouble())
    } catch (e: Exception) {
      promise.reject("ERR_PUBLISH_CHANNEL", e.message, e)
    }
  }
}
