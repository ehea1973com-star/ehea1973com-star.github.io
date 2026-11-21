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
    private boolean setupInProgress = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        ThemeHelper.apply(this);

        statusAccessibility = findViewById(R.id.statusAccessibility);
        statusOverlay = findViewById(R.id.statusOverlay);
        modeSpinner = findViewById(R.id.modeSpinner);

        setupModeSpinner();

        Button btnAccessibility = findViewById(R.id.btnAccessibility);
        Button btnOverlayPermission = findViewById(R.id.btnOverlayPermission);
        Button btnNotif = findViewById(R.id.btnNotificationSettings);
        Button btnBattery = findViewById(R.id.btnBatterySettings);
        Button btnSetupAll = findViewById(R.id.btnSetupAll);
        Button btnStartOverlay = findViewById(R.id.btnStartOverlay);
        Button btnStopOverlay = findViewById(R.id.btnStopOverlay);
        Button btnScanScreen = findViewById(R.id.btnScanScreen);
        Button btnCopyUiNow = findViewById(R.id.btnCopyUiNow);
        Button btnQuickClipboard = findViewById(R.id.btnQuickClipboard);
        Button btnHistory = findViewById(R.id.btnHistory);
        Button btnSettings = findViewById(R.id.btnSettings);

        if (btnSetupAll != null) btnSetupAll.setOnClickListener(v -> runSetupFlow());
        btnAccessibility.setOnClickListener(v -> PermissionHelper.openAccessibilitySettings(this));
        btnOverlayPermission.setOnClickListener(v -> PermissionHelper.openOverlaySettings(this));
        btnNotif.setOnClickListener(v -> PermissionHelper.openNotificationSettings(this));
        btnBattery.setOnClickListener(v -> {
            try {
                Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception e) {
                PermissionHelper.openAppDetails(this);
            }
        });

        btnStartOverlay.setOnClickListener(v -> {
            if (!PermissionHelper.canDrawOverlays(this)) {
                Toast.makeText(this, R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
                PermissionHelper.openOverlaySettings(this);
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
            if (svc == null && PermissionHelper.isAccessibilityEnabled(this)) {
                Toast.makeText(this, R.string.toast_accessibility_starting, Toast.LENGTH_SHORT).show();
                PermissionHelper.openAccessibilitySettings(this);
                return;
            }
            if (svc != null) {
                svc.copyUiTextsNow();
            } else {
                Toast.makeText(this, R.string.toast_accessibility_required, Toast.LENGTH_SHORT).show();
                PermissionHelper.openAccessibilitySettings(this);
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
        if (setupInProgress) {
            statusOverlay.postDelayed(this::continueSetupFlow, 500);
        }
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
        boolean acc = PermissionHelper.isAccessibilityEnabled(this);
        statusAccessibility.setText(acc ? R.string.status_accessibility_on : R.string.status_accessibility_off);
        boolean overlay = PermissionHelper.canDrawOverlays(this);
        statusOverlay.setText(overlay ? R.string.status_overlay_on : R.string.status_overlay_off);
    }

    private void runSetupFlow() {
        setupInProgress = true;
        requestNotifIfNeeded();
        continueSetupFlow();
    }

    private void continueSetupFlow() {
        if (!setupInProgress) return;
        updateStatus();
        if (!PermissionHelper.canDrawOverlays(this)) {
            Toast.makeText(this, R.string.setup_overlay_first, Toast.LENGTH_LONG).show();
            PermissionHelper.openOverlaySettings(this);
            return;
        }
        if (!PermissionHelper.isAccessibilityEnabled(this)) {
            Toast.makeText(this, R.string.setup_accessibility_next, Toast.LENGTH_LONG).show();
            PermissionHelper.openAccessibilitySettings(this);
            return;
        }
        setupInProgress = false;
        Intent i = new Intent(this, OverlayService.class);
        i.setAction(OverlayService.ACTION_START);
        ContextCompat.startForegroundService(this, i);
        Toast.makeText(this, R.string.setup_done, Toast.LENGTH_LONG).show();
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
