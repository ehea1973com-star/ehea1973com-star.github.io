package com.yahya.universalcopy;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_NOTIF = 101;
    private TextView statusAccessibility;
    private TextView statusOverlay;
    private Spinner modeSpinner;
    private boolean spinnerInit = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        statusAccessibility = findViewById(R.id.statusAccessibility);
        statusOverlay = findViewById(R.id.statusOverlay);
        modeSpinner = findViewById(R.id.modeSpinner);

        setupModeSpinner();

        Button btnAccessibility = findViewById(R.id.btnAccessibility);
        Button btnOverlayPermission = findViewById(R.id.btnOverlayPermission);
        Button btnNotif = findViewById(R.id.btnNotificationSettings);
        Button btnBattery = findViewById(R.id.btnBatterySettings);
        Button btnStartOverlay = findViewById(R.id.btnStartOverlay);
        Button btnStopOverlay = findViewById(R.id.btnStopOverlay);
        Button btnScanScreen = findViewById(R.id.btnScanScreen);
        Button btnCopyUiNow = findViewById(R.id.btnCopyUiNow);
        Button btnQuickClipboard = findViewById(R.id.btnQuickClipboard);
        Button btnHistory = findViewById(R.id.btnHistory);
        Button btnSettings = findViewById(R.id.btnSettings);

        btnAccessibility.setOnClickListener(v -> openSystemSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        btnOverlayPermission.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                openUriSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            } else {
                Toast.makeText(this, R.string.status_overlay_on, Toast.LENGTH_SHORT).show();
            }
        });
        btnNotif.setOnClickListener(v -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(i);
                } else {
                    openUriSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                }
            } catch (Exception e) { openUriSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS); }
        });
        btnBattery.setOnClickListener(v -> {
            try {
                Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                startActivity(i);
            } catch (Exception e) {
                openUriSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            }
        });

        btnStartOverlay.setOnClickListener(v -> {
            if (!canDrawOverlays()) {
                Toast.makeText(this, R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
                openUriSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                return;
            }
            requestNotifIfNeeded();
            Intent i = new Intent(this, OverlayService.class);
            i.setAction(OverlayService.ACTION_START);
            ContextCompat.startForegroundService(this, i);
            Toast.makeText(this, R.string.notif_overlay_title, Toast.LENGTH_SHORT).show();
        });

        btnStopOverlay.setOnClickListener(v -> {
            Intent i = new Intent(this, OverlayService.class);
            i.setAction(OverlayService.ACTION_STOP);
            startService(i);
        });

        btnScanScreen.setOnClickListener(v -> {
            requestNotifIfNeeded();
            startActivity(new Intent(this, ScreenCaptureActivity.class));
        });

        btnCopyUiNow.setOnClickListener(v -> {
            UniversalCopyAccessibilityService svc = UniversalCopyAccessibilityService.instance;
            if (svc != null) {
                svc.copyUiTextsNow();
            } else {
                Toast.makeText(this, R.string.toast_accessibility_required, Toast.LENGTH_SHORT).show();
                openSystemSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            }
        });

        btnQuickClipboard.setOnClickListener(v -> startActivity(new Intent(this, QuickClipboardActivity.class)));
        btnHistory.setOnClickListener(v -> startActivity(new Intent(this, HistoryActivity.class)));
        btnSettings.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));

        requestNotifIfNeeded();
    }

    private void setupModeSpinner() {
        String[] modes = new String[]{
                AppPrefs.MODE_UI,
                AppPrefs.MODE_LATIN,
                AppPrefs.MODE_CHINESE,
                AppPrefs.MODE_KOREAN,
                AppPrefs.MODE_JAPANESE,
                AppPrefs.MODE_DEVANAGARI
        };
        String[] labels = new String[modes.length];
        for (int i = 0; i < modes.length; i++) labels[i] = AppPrefs.modeLabel(this, modes[i]);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, labels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        modeSpinner.setAdapter(adapter);
        String current = AppPrefs.getCurrentMode(this);
        int sel = 1;
        for (int i = 0; i < modes.length; i++) if (modes[i].equals(current)) { sel = i; break; }
        modeSpinner.setSelection(sel);
        modeSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                if (!spinnerInit) { spinnerInit = true; return; }
                if (position >= 0 && position < modes.length) {
                    AppPrefs.setCurrentMode(MainActivity.this, modes[position]);
                }
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> parent) {}
        });
        spinnerInit = true; // prevent immediate overwrite? we want initial to not toast; selection listener guarded
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateStatus();
        // sync spinner if changed elsewhere
        try {
            String current = AppPrefs.getCurrentMode(this);
            String[] modes = new String[]{AppPrefs.MODE_UI, AppPrefs.MODE_LATIN, AppPrefs.MODE_CHINESE, AppPrefs.MODE_KOREAN, AppPrefs.MODE_JAPANESE, AppPrefs.MODE_DEVANAGARI};
            for (int i = 0; i < modes.length; i++) {
                if (modes[i].equals(current) && modeSpinner.getSelectedItemPosition() != i) {
                    modeSpinner.setSelection(i);
                    break;
                }
            }
        } catch (Exception ignored) {}
    }

    private void updateStatus() {
        boolean acc = isAccessibilityEnabled();
        statusAccessibility.setText(acc ? R.string.status_accessibility_on : R.string.status_accessibility_off);
        boolean overlay = canDrawOverlays();
        statusOverlay.setText(overlay ? R.string.status_overlay_on : R.string.status_overlay_off);
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(this);
        }
        return true;
    }

    private boolean isAccessibilityEnabled() {
        AccessibilityManager am = (AccessibilityManager) getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        List<AccessibilityServiceInfo> enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        if (enabled == null) return false;
        String target = new ComponentName(this, UniversalCopyAccessibilityService.class).flattenToString();
        String targetShort = getPackageName() + "/.UniversalCopyAccessibilityService";
        for (AccessibilityServiceInfo info : enabled) {
            if (info == null || info.getId() == null) continue;
            String id = info.getId();
            if (id.equals(target) || id.equals(targetShort) || (id.contains(getPackageName()) && id.contains("UniversalCopyAccessibilityService"))) {
                return true;
            }
        }
        return false;
    }

    private void requestNotifIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
            }
        }
    }

    private void openSystemSettings(String action) {
        try { startActivity(new Intent(action)); } catch (Exception e) { Toast.makeText(this, e.getMessage(), Toast.LENGTH_SHORT).show(); }
    }
    private void openUriSettings(String action) {
        try {
            Intent intent = new Intent(action, Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        } catch (Exception e) { openSystemSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS); }
    }
}
