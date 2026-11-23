package com.yahya.universalcopy;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.nio.ByteBuffer;

public class ScreenCaptureService extends Service {

    public static final String ACTION_CAPTURE = "com.yahya.universalcopy.action.CAPTURE";
    public static final String EXTRA_RESULT_CODE = "result_code";
    public static final String EXTRA_RESULT_DATA = "result_data";
    private static final String CHANNEL_ID = "universal_copy_capture";
    private static final int NOTIF_ID = 1002;

    private HandlerThread bgThread;
    private Handler bgHandler;
    private volatile boolean captured = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        bgThread = new HandlerThread("uc-capture");
        bgThread.start();
        bgHandler = new Handler(bgThread.getLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIF_ID, buildNotification());
        if (intent == null || !ACTION_CAPTURE.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        final int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
        final Intent data = intent.getParcelableExtra(EXTRA_RESULT_DATA);
        bgHandler.post(() -> doCapture(resultCode, data));
        return START_NOT_STICKY;
    }

    private void doCapture(int resultCode, Intent data) {
        MediaProjection projection = null;
        VirtualDisplay vd = null;
        ImageReader reader = null;
        try {
            if (data == null) {
                ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
                return;
            }
            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (mpm == null) {
                ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
                return;
            }
            projection = mpm.getMediaProjection(resultCode, data);
            if (projection == null) {
                ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
                return;
            }

            WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
            DisplayMetrics metrics = new DisplayMetrics();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    Rect b = wm.getCurrentWindowMetrics().getBounds();
                    metrics.widthPixels = b.width();
                    metrics.heightPixels = b.height();
                    metrics.densityDpi = getResources().getDisplayMetrics().densityDpi;
                } catch (Exception e) {
                    wm.getDefaultDisplay().getRealMetrics(metrics);
                }
            } else {
                wm.getDefaultDisplay().getRealMetrics(metrics);
            }
            int width = metrics.widthPixels;
            int height = metrics.heightPixels;
            int dpi = metrics.densityDpi;
            if (width <= 0 || height <= 0) { width = 1080; height = 1920; dpi = 320; }

            reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2);
            final ImageReader fReader = reader;
            captured = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                try {
                    projection.registerCallback(new MediaProjection.Callback() {
                        @Override public void onStop() { }
                    }, bgHandler);
                } catch (Exception ignored) {}
            }

            vd = projection.createVirtualDisplay("uc-ocr",
                    width, height, dpi,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                    reader.getSurface(), null, bgHandler);

            ClipboardUtils.toast(this, getString(R.string.toast_ocr_running));

            try { Thread.sleep(1200); } catch (InterruptedException ignored) {}
            Image image = null;
            for (int i = 0; i < 10 && image == null; i++) {
                try { image = fReader.acquireLatestImage(); } catch (Exception ignored) { image = null; }
                if (image == null) {
                    try { Thread.sleep(120); } catch (InterruptedException ignored) {}
                }
            }
            if (image == null) {
                ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
                return;
            }
            Bitmap raw = imageToBitmap(image, width, height);
            try { image.close(); } catch (Exception ignored) {}

            if (raw == null) {
                ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
                return;
            }

            Rect targetBounds = OcrMemory.getTargetBounds();
            String targetPkg = OcrMemory.getTargetPackage();
            UniversalCopyAccessibilityService targetSvc = UniversalCopyAccessibilityService.instance;
            if (targetSvc != null) {
                try {
                    String freshPkg = targetSvc.getTargetPackage();
                    if (freshPkg != null && !freshPkg.trim().isEmpty()) {
                        targetPkg = freshPkg;
                        targetBounds = targetSvc.getTargetBounds();
                        OcrMemory.setTarget(targetPkg, targetBounds);
                    }
                } catch (Exception ignored) {}
            }
            final Rect finalTargetBounds = targetBounds;
            final String finalTargetPkg = targetPkg == null ? "" : targetPkg;
            Bitmap cropped = cropToTarget(raw, finalTargetBounds);
            if (cropped != raw) {
                try { raw.recycle(); } catch (Exception ignored) {}
            }
            final Bitmap ocrBitmap = cropped;

            String uiText = "";
            UniversalCopyAccessibilityService svc = UniversalCopyAccessibilityService.instance;
            if (svc != null && !finalTargetPkg.trim().isEmpty()) {
                try { uiText = svc.collectAllTextForPackage(finalTargetPkg); } catch (Exception ignored) {}
            }
            if (uiText == null) uiText = "";
            final String finalUiText = uiText;
            final String mode = AppPrefs.getCurrentMode(getApplicationContext());
            final String sourceLabel = getString(R.string.source_ocr) + ":" + mode
                    + (finalUiText.trim().isEmpty() ? "" : " + " + getString(R.string.source_ui));

            OcrHelper.recognize(ocrBitmap, mode, new OcrHelper.Callback() {
                @Override
                public void onSuccess(OcrHelper.Result result) {
                    try { ocrBitmap.recycle(); } catch (Exception ignored) {}
                    String ocrText = result != null ? result.fullText : "";
                    String merged = TextMerger.merge(finalUiText, ocrText);
                    OcrMemory.set(merged, sourceLabel, result != null ? result.segments : null, finalTargetPkg, finalTargetBounds);
                    captured = true;
                    CopyActions.handleTextResult(getApplicationContext(), merged, sourceLabel);
                    stopSelf();
                }

                @Override
                public void onError(Exception e) {
                    try { ocrBitmap.recycle(); } catch (Exception ignored) {}
                    ClipboardUtils.toast(getApplicationContext(), getString(R.string.toast_ocr_failed));
                    stopSelf();
                }
            });
            captured = true;
        } catch (Throwable t) {
            ClipboardUtils.toast(this, getString(R.string.toast_capture_failed));
        } finally {
            try { if (vd != null) vd.release(); } catch (Exception ignored) {}
            try { if (reader != null) reader.close(); } catch (Exception ignored) {}
            try { if (projection != null) projection.stop(); } catch (Exception ignored) {}
            if (!captured) {
                stopSelf();
            }
        }
    }

    private Bitmap cropToTarget(Bitmap src, Rect bounds) {
        try {
            int w = src.getWidth();
            int h = src.getHeight();
            Rect r = null;
            if (bounds != null) {
                r = new Rect(bounds);
                r.left = Math.max(0, r.left);
                r.top = Math.max(0, r.top);
                r.right = Math.min(w, r.right);
                r.bottom = Math.min(h, r.bottom);
                if (r.width() < 120 || r.height() < 120) r = null;
            }
            if (r == null) {
                int top = dp(28);
                int bottom = dp(48);
                r = new Rect(0, top, w, Math.max(top + 120, h - bottom));
            }
            Bitmap out = Bitmap.createBitmap(src, r.left, r.top, r.width(), r.height());
            return out == src ? src : out;
        } catch (Exception e) {
            return src;
        }
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private Bitmap imageToBitmap(Image image, int width, int height) {
        try {
            Image.Plane[] planes = image.getPlanes();
            ByteBuffer buffer = planes[0].getBuffer();
            int pixelStride = planes[0].getPixelStride();
            int rowStride = planes[0].getRowStride();
            int rowPadding = rowStride - pixelStride * width;
            Bitmap bmp = Bitmap.createBitmap(width + rowPadding / Math.max(pixelStride, 1), height, Bitmap.Config.ARGB_8888);
            bmp.copyPixelsFromBuffer(buffer);
            if (bmp.getWidth() != width) {
                Bitmap cropped = Bitmap.createBitmap(bmp, 0, 0, width, height);
                if (cropped != bmp) bmp.recycle();
                return cropped;
            }
            return bmp;
        } catch (Exception e) {
            return null;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try { if (bgThread != null) bgThread.quitSafely(); } catch (Exception ignored) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.notif_channel_name),
                    NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.notif_capture_title))
                .setContentText(getString(R.string.notif_capture_text))
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setOngoing(true)
                .build();
    }
}
