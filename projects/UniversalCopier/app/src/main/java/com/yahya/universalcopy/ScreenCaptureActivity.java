package com.yahya.universalcopy;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
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
        // if mode is UI (no OCR), default to latin OCR for screen scan convenience
        String mode = AppPrefs.getCurrentMode(this);
        if (AppPrefs.MODE_UI.equals(mode)) {
            // keep UI mode for UI copy, but OCR scan needs an OCR mode - use default
            AppPrefs.setCurrentMode(this, AppPrefs.getDefaultMode(this));
        }
        try {
            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (mpm == null) {
                Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
                finish();
                return;
            }
            startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CAPTURE);
        } catch (Exception e) {
            Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
            finish();
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
            } else {
                Toast.makeText(this, R.string.toast_capture_failed, Toast.LENGTH_SHORT).show();
            }
        }
        finish();
    }
}
