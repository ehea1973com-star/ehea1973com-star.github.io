package com.yahya.universalcopy;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.List;

public class OverlayService extends Service {

    public static final String ACTION_START = "com.yahya.universalcopy.action.START_OVERLAY";
    public static final String ACTION_STOP = "com.yahya.universalcopy.action.STOP_OVERLAY";
    private static final String CHANNEL_ID = "universal_copy_overlay";
    private static final int NOTIF_ID = 1001;

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams params;
    private boolean menuVisible = false;

    private View selectionView;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            removeSelectionOverlay();
            removeOverlay();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        startForeground(NOTIF_ID, buildNotification());
        if (overlayView == null && canDraw()) {
            showOverlay();
        }
        return START_STICKY;
    }

    private boolean canDraw() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(this);
        }
        return true;
    }

    private void showOverlay() {
        try {
            overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null);
            int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;
            params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    type,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT);
            params.gravity = Gravity.TOP | Gravity.START;
            params.x = 40;
            params.y = 220;

            ImageButton fab = overlayView.findViewById(R.id.fabMain);
            LinearLayout menu = overlayView.findViewById(R.id.menuPanel);
            Button btnCopyUi = overlayView.findViewById(R.id.btnCopyUi);
            Button btnSelectUi = overlayView.findViewById(R.id.btnSelectUi);
            Button btnOcr = overlayView.findViewById(R.id.btnOcr);
            Button btnQuick = overlayView.findViewById(R.id.btnQuickClip);
            Button btnHistory = overlayView.findViewById(R.id.btnHistory);
            Button btnClose = overlayView.findViewById(R.id.btnCloseOverlay);

            fab.setOnClickListener(v -> {
                menuVisible = !menuVisible;
                menu.setVisibility(menuVisible ? View.VISIBLE : View.GONE);
            });

            btnCopyUi.setOnClickListener(v -> {
                hideMenu(menu);
                UniversalCopyAccessibilityService svc = UniversalCopyAccessibilityService.instance;
                if (svc != null) {
                    svc.copyUiTextsNow();
                } else {
                    Toast.makeText(getApplicationContext(), R.string.toast_accessibility_required, Toast.LENGTH_SHORT).show();
                    try {
                        Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                    } catch (Exception ignored) {}
                }
            });

            if (btnSelectUi != null) {
                btnSelectUi.setOnClickListener(v -> {
                    hideMenu(menu);
                    startSelectionMode();
                });
            }

            btnOcr.setOnClickListener(v -> {
                hideMenu(menu);
                try {
                    Intent i = new Intent(OverlayService.this, ScreenCaptureActivity.class);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
                }
            });

            btnQuick.setOnClickListener(v -> {
                hideMenu(menu);
                try {
                    Intent i = new Intent(OverlayService.this, QuickClipboardActivity.class);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception ignored) {}
            });

            btnHistory.setOnClickListener(v -> {
                hideMenu(menu);
                try {
                    Intent i = new Intent(OverlayService.this, HistoryActivity.class);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception ignored) {}
            });

            btnClose.setOnClickListener(v -> {
                hideMenu(menu);
                Intent i = new Intent(OverlayService.this, OverlayService.class);
                i.setAction(ACTION_STOP);
                startService(i);
            });

            fab.setOnTouchListener(new View.OnTouchListener() {
                private int initialX, initialY;
                private float initialTouchX, initialTouchY;
                private boolean moved;
                @Override
                public boolean onTouch(View v, MotionEvent event) {
                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            initialX = params.x;
                            initialY = params.y;
                            initialTouchX = event.getRawX();
                            initialTouchY = event.getRawY();
                            moved = false;
                            return false; // allow click
                        case MotionEvent.ACTION_MOVE:
                            int dx = (int) (event.getRawX() - initialTouchX);
                            int dy = (int) (event.getRawY() - initialTouchY);
                            if (Math.abs(dx) > 12 || Math.abs(dy) > 12) moved = true;
                            if (moved) {
                                params.x = initialX + dx;
                                params.y = initialY + dy;
                                try { windowManager.updateViewLayout(overlayView, params); } catch (Exception ignored) {}
                                return true;
                            }
                            return false;
                        case MotionEvent.ACTION_UP:
                            if (moved) {
                                v.performClick();
                                return true;
                            }
                            return false;
                    }
                    return false;
                }
            });

            windowManager.addView(overlayView, params);
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(), R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
        }
    }

    private void startSelectionMode() {
        UniversalCopyAccessibilityService svc = UniversalCopyAccessibilityService.instance;
        if (svc == null) {
            Toast.makeText(getApplicationContext(), R.string.toast_accessibility_required, Toast.LENGTH_SHORT).show();
            try {
                Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception ignored) {}
            return;
        }
        if (overlayView != null) overlayView.setVisibility(View.GONE);
        handler.postDelayed(() -> {
            try {
                List<TextNodeItem> nodes = svc.collectTextNodes();
                handler.post(() -> showSelectionOverlay(nodes));
            } catch (Exception e) {
                handler.post(() -> {
                    if (overlayView != null) overlayView.setVisibility(View.VISIBLE);
                    Toast.makeText(getApplicationContext(), R.string.toast_no_text, Toast.LENGTH_SHORT).show();
                });
            }
        }, 220);
    }

    private void showSelectionOverlay(List<TextNodeItem> nodes) {
        removeSelectionOverlay();
        if (nodes == null || nodes.isEmpty()) {
            if (overlayView != null) overlayView.setVisibility(View.VISIBLE);
            Toast.makeText(getApplicationContext(), R.string.toast_no_text, Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            selectionView = new SelectionOverlayView(this, nodes, new SelectionOverlayView.Listener() {
                @Override
                public void onCopy(String text) {
                    CopyActions.handleTextResult(getApplicationContext(), text, getString(R.string.source_ui));
                    removeSelectionOverlay();
                    if (overlayView != null) overlayView.setVisibility(View.VISIBLE);
                }

                @Override
                public void onCancel() {
                    removeSelectionOverlay();
                    if (overlayView != null) overlayView.setVisibility(View.VISIBLE);
                }
            });
            int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;
            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    type,
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                            | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                    PixelFormat.TRANSLUCENT);
            lp.gravity = Gravity.TOP | Gravity.START;
            windowManager.addView(selectionView, lp);
        } catch (Exception e) {
            if (overlayView != null) overlayView.setVisibility(View.VISIBLE);
            Toast.makeText(getApplicationContext(), R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
        }
    }

    private void removeSelectionOverlay() {
        try {
            if (selectionView != null && windowManager != null) {
                windowManager.removeView(selectionView);
            }
        } catch (Exception ignored) {}
        selectionView = null;
    }

    private void hideMenu(View menu) {
        menuVisible = false;
        if (menu != null) menu.setVisibility(View.GONE);
    }

    private void removeOverlay() {
        try {
            if (overlayView != null && windowManager != null) {
                windowManager.removeView(overlayView);
            }
        } catch (Exception ignored) {}
        overlayView = null;
    }

    @Override
    public void onDestroy() {
        removeSelectionOverlay();
        removeOverlay();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
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
        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.notif_overlay_title))
                .setContentText(getString(R.string.notif_overlay_text))
                .setSmallIcon(android.R.drawable.ic_menu_edit)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }
}
