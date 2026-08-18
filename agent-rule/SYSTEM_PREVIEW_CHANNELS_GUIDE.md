# Android TV System Preview Channel Cards (`androidx.tvprovider`)

This document is the authoritative engineering guide for publishing dynamic 16:9 media cards, live camera snapshots, and video channels directly onto the **Android TV / Google TV / Monet Launcher home screen**.

---

## 1. Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│               Android TV / Google TV Home Screen (Launcher)            │
├────────────────────────────────────────────────────────────────────────┤
│  [ Tapo Widget Hub Channel ] ─── Published via androidx.tvprovider     │
│  ┌───────────────────────┐  ┌───────────────────────┐                  │
│  │ 📹 Broilers_Farm_1     │  │ 📹 EggF_Front         │  ...             │
│  │   [ 16:9 Live Feed ]  │  │   [ 16:9 Live Feed ]  │                  │
│  │   "Last view at 12:07"│  │   "Last view at 11:08"│                  │
│  └───────────────────────┘  └───────────────────────┘                  │
└───────────────────▲───────────────────────────▲────────────────────────┘
                    │                           │
         Queries Bitmap Streams          Dispatches Click Intent
                    │                           │
┌───────────────────┴───────────────────────────┴────────────────────────┐
│                      Tapo Widget Hub Application                       │
│                                                                        │
│  1. TapoPreviewChannelManager: Creates channel & updates PreviewPrograms│
│  2. SnapshotContentProvider: Streams live JPEG bytes via content:// URI │
│  3. DeepLink / Trampoline: Dispatches authenticated native clicks     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Capabilities & Benefits
- **Zero In-App UI Pollution**: No need to clutter the in-app dashboard with duplicate 16:9 media rows. Media rows live natively on the Android TV OS home screen above other TV apps.
- **Glanceable Live Monitoring**: Users see live snapshots and real device names directly on the TV home screen without opening the app.
- **1-Click Live Stream Launch**: Clicking any preview card immediately opens the camera feed in full screen.

---

## 3. Core Components

### A. Channel Manager (`TapoPreviewChannelManager.kt`)
Responsible for creating the system channel and updating program cards.

```kotlin
import androidx.tvprovider.media.tv.Channel
import androidx.tvprovider.media.tv.ChannelLogoUtils
import androidx.tvprovider.media.tv.PreviewProgram
import androidx.tvprovider.media.tv.TvContractCompat

class TapoPreviewChannelManager(private val context: Context) {

    // 1. Create or retrieve the system channel
    fun getOrCreateChannel(): Long {
        val cursor = context.contentResolver.query(
            TvContractCompat.Channels.CONTENT_URI,
            arrayOf(TvContractCompat.Channels._ID, TvContractCompat.Channels.COLUMN_DISPLAY_NAME),
            "${TvContractCompat.Channels.COLUMN_PACKAGE_NAME} = ?",
            arrayOf(context.packageName),
            null
        )

        cursor?.use {
            if (it.moveToFirst()) {
                return it.getLong(0)
            }
        }

        // Build new Channel
        val channel = Channel.Builder()
            .setType(TvContractCompat.Channels.TYPE_PREVIEW)
            .setDisplayName("Tapo Widget Hub")
            .setDescription("Live camera snapshots and smart home devices")
            .setAppLinkIntentUri(Uri.parse("widget-hub://home"))
            .build()

        val channelUri = context.contentResolver.insert(
            TvContractCompat.Channels.CONTENT_URI,
            channel.toContentValues()
        )
        val channelId = ContentUris.parseId(channelUri!!)

        // Make channel visible and default
        TvContractCompat.requestChannelBrowsable(context, channelId)
        return channelId
    }

    // 2. Publish or update 16:9 media cards
    fun updatePreviewPrograms(channelId: Long, cameras: List<CameraCardData>) {
        // Remove stale programs or upsert by internal ID
        context.contentResolver.delete(
            TvContractCompat.PreviewPrograms.CONTENT_URI,
            "${TvContractCompat.PreviewPrograms.COLUMN_CHANNEL_ID} = ?",
            arrayOf(channelId.toString())
        )

        cameras.forEachIndexed { index, camera ->
            val timestampUri = "content://${context.packageName}.snapshots/${camera.id}.jpg?t=${System.currentTimeMillis()}"

            val program = PreviewProgram.Builder()
                .setChannelId(channelId)
                .setTitle(camera.name)
                .setDescription(camera.lastViewTimestamp ?: "Live View")
                .setType(TvContractCompat.PreviewPrograms.TYPE_CLIP)
                .setPosterArtUri(Uri.parse(timestampUri))
                .setPosterArtAspectRatio(TvContractCompat.PreviewPrograms.ASPECT_RATIO_16_9)
                .setIntentUri(Uri.parse("widget-hub://live?name=${Uri.encode(camera.name)}"))
                .setWeight(index)
                .build()

            context.contentResolver.insert(
                TvContractCompat.PreviewPrograms.CONTENT_URI,
                program.toContentValues()
            )
        }
    }
}
```

---

### B. Dynamic Snapshot `ContentProvider` (`SnapshotContentProvider.kt`)

Android TV Launcher runs in a separate system process (`com.google.android.tvlauncher` or `com.google.android.apps.tv.launcherx`). It cannot access your app's private files directly. A `ContentProvider` streams the raw image bytes:

```kotlin
class SnapshotContentProvider : ContentProvider() {

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
        val filename = uri.lastPathSegment ?: return null
        val snapshotFile = File(context?.filesDir, "snapshots/$filename")

        if (!snapshotFile.exists()) {
            // Serve fallback default placeholder thumbnail if live capture is pending
            return serveDefaultPlaceholder()
        }

        return ParcelFileDescriptor.open(snapshotFile, ParcelFileDescriptor.MODE_READ_ONLY)
    }

    override fun getType(uri: Uri): String = "image/jpeg"

    // Required boilerplate overrides
    override fun onCreate(): Boolean = true
    override fun query(u: Uri, p: Array<String>?, s: String?, sa: Array<String>?, o: String?): Cursor? = null
    override fun insert(u: Uri, v: ContentValues?): Uri? = null
    override fun delete(u: Uri, s: String?, sa: Array<String>?): Int = 0
    override fun update(u: Uri, v: ContentValues?, s: String?, sa: Array<String>?): Int = 0
}
```

---

### C. The Cache-Busting Timestamp Pattern

Because the TV launcher aggressively caches images by URI, appending a timestamp query parameter forces the system to fetch the latest captured frame:

```text
content://com.widgetlauncher.snapshots/camera_1.jpg?t=1723701234567
```

---

### D. Direct Deep-Link Intent Routing (`COLUMN_INTENT_URI`)

When the user clicks a card on the Android TV home screen:
1. The launcher fires the intent URI: `widget-hub://live?name=Broilers_Farm_1`.
2. In React Native (`HomeScreen.tsx`):
   ```typescript
   Linking.addEventListener('url', (event) => {
     const url = event.url;
     if (url.startsWith('widget-hub://live')) {
       const cameraName = parseQuery(url, 'name');
       const matched = activeWidgets.find(w => w.label.toLowerCase() === cameraName.toLowerCase());
       if (matched) {
         handleCardPress(matched); // Triggers native PendingIntent
       }
     }
   });
   ```

---

## 4. Manifest & Config Plugin Setup

In `plugins/withLauncherManifest.js`:

```javascript
// 1. Declare ContentProvider in AndroidManifest.xml
androidManifest.application[0].provider.push({
  $: {
    'android:name': '.widgethost.SnapshotContentProvider',
    'android:authorities': `${config.android.package}.snapshots`,
    'android:exported': 'true',
    'android:grantUriPermissions': 'true',
  },
});

// 2. Add dependencies in app/build.gradle
// implementation 'androidx.tvprovider:tvprovider:1.0.0'
```

---

## 5. Summary Checklist for Any Future TV App
- [x] Add `androidx.tvprovider:tvprovider:1.0.0` to `app/build.gradle`.
- [x] Create `SnapshotContentProvider` and export it in manifest with `grantUriPermissions="true"`.
- [x] Create `ChannelManager` using `TvContractCompat.Channels.TYPE_PREVIEW`.
- [x] Use `ASPECT_RATIO_16_9` and `TYPE_CLIP` for preview program cards.
- [x] Add `?t=timestamp` to `PosterArtUri` for instant live updates.
- [x] Route `COLUMN_INTENT_URI` via custom deep-link scheme to launch full-screen media directly.
