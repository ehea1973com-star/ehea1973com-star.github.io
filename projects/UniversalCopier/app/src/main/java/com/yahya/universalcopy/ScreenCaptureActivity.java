package com.yahya.universalcopy;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

public class ScreenCaptureActivity extends AppCompatActivity {

    private static final int REQ_CAPTURE = 2001;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try { overridePendingTransition(0, 0); } catch (Exception ignored) {}
        try { moveTaskToBack(true); } catch (Exception ignored) {}

        // OCR scan needs an OCR mode (UI mode means accessibility text copy)
        String mode = AppPrefs.getCurrentMode(this);
        if (AppPrefs.MODE_UI.equals(mode)) {
            AppPrefs.setCurrentMode(this, AppPrefs.getDefaultMode(this));
        }
        try {
            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (mpm == null) {
                Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
                finishCaptureUi(false);
                return;
            }
            startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CAPTURE);
        } catch (Exception e) {
            Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
            finishCaptureUi(false);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CAPTURE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                Intent svc = new Intent(this, ScreenCaptureService.class);
                svc.setAction(ScreenCaptureService.ACTION_CAPTURE);
                svc.putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, resultCode);
                svc.putExtra(ScreenCaptureService.EXTRA_RESULT_DATA, data);
                try {
                    ContextCompat.startForegroundService(this, svc);
                } catch (Exception e) {
                    Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
                }
                finishCaptureUi(true);
                return;
            } else {
                Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
            }
        }
        finishCaptureUi(false);
    }

    private void finishCaptureUi(boolean started) {
        try {
            // Keep our transient task out of the way so target app stays in front for capture
            moveTaskToBack(true);
        } catch (Exception ignored) {}
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                finishAndRemoveTask();
            } else {
                finish();
            }
        } catch (Exception e) {
            try { finish(); } catch (Exception ignored) {}
        }
        try { overridePendingTransition(0, 0); } catch (Exception ignored) {}
    }

    @Override
    public void finish() {
        super.finish();
        try { overridePendingTransition(0, 0); } catch (Exception ignored) {}
    }
}
