package com.yahya.universalcopy;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

public class SettingsActivity extends AppCompatActivity {

    private Spinner defaultModeSpinner;
    private Spinner themeSpinner;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        ThemeHelper.apply(this);

                themeSpinner = findViewById(R.id.themeSpinner);
        String[] themes = new String[]{ThemeHelper.THEME_WOOD, ThemeHelper.THEME_LIGHT, ThemeHelper.THEME_DARK, ThemeHelper.THEME_CONTRAST};
        String[] tlabels = new String[]{getString(R.string.theme_wood), getString(R.string.theme_light), getString(R.string.theme_dark), getString(R.string.theme_contrast)};
        ArrayAdapter<String> tad = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, tlabels);
        tad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        themeSpinner.setAdapter(tad);
        String curTheme = AppPrefs.getTheme(this);
        int tsel = 0;
        for (int i = 0; i < themes.length; i++) if (themes[i].equals(curTheme)) { tsel = i; break; }
        themeSpinner.setSelection(tsel);
        themeSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            boolean init = false;
            @Override public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                if (!init) { init = true; return; }
                if (position >= 0 && position < themes.length) {
                    AppPrefs.setTheme(SettingsActivity.this, themes[position]);
                    ThemeHelper.apply(SettingsActivity.this);
                }
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> parent) {}
        });


        defaultModeSpinner = findViewById(R.id.defaultModeSpinner);
        CheckBox cbAutoCopy = findViewById(R.id.cbAutoCopy);
        CheckBox cbAutoSave = findViewById(R.id.cbAutoSave);
        CheckBox cbOpenResult = findViewById(R.id.cbOpenResult);
        Spinner historyLimitSpinner = findViewById(R.id.historyLimitSpinner);
        Button btnClear = findViewById(R.id.btnClearHistory);
        Button btnAcc = findViewById(R.id.btnSysAccessibility);
        Button btnOverlay = findViewById(R.id.btnSysOverlay);
        Button btnNotif = findViewById(R.id.btnSysNotifications);
        Button btnBatt = findViewById(R.id.btnSysBattery);

        String[] modes = AppPrefs.allOcrModes();
        String[] labels = new String[modes.length];
        for (int i = 0; i < modes.length; i++) labels[i] = AppPrefs.modeLabel(this, modes[i]);
        ArrayAdapter<String> mad = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, labels);
        mad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        defaultModeSpinner.setAdapter(mad);
        String dm = AppPrefs.getDefaultMode(this);
        int sel = 0;
        for (int i = 0; i < modes.length; i++) if (modes[i].equals(dm)) { sel = i; break; }
        defaultModeSpinner.setSelection(sel);

        Integer[] limits = new Integer[]{50, 100, 200, 500, 1000, 2000};
        ArrayAdapter<Integer> lad = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, limits);
        lad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        historyLimitSpinner.setAdapter(lad);
        int cur = AppPrefs.getHistoryLimit(this);
        int lsel = 2;
        for (int i = 0; i < limits.length; i++) if (limits[i] == cur) { lsel = i; break; }
        historyLimitSpinner.setSelection(lsel);

        cbAutoCopy.setChecked(AppPrefs.isAutoCopy(this));
        cbAutoSave.setChecked(AppPrefs.isAutoSave(this));
        cbOpenResult.setChecked(AppPrefs.isOpenResult(this));

        cbAutoCopy.setOnCheckedChangeListener((b, v) -> AppPrefs.setAutoCopy(this, v));
        cbAutoSave.setOnCheckedChangeListener((b, v) -> AppPrefs.setAutoSave(this, v));
        cbOpenResult.setOnCheckedChangeListener((b, v) -> AppPrefs.setOpenResult(this, v));

        defaultModeSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            boolean init = false;
            @Override public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                if (!init) { init = true; return; }
                if (position >= 0 && position < modes.length) AppPrefs.setDefaultMode(SettingsActivity.this, modes[position]);
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> parent) {}
        });

        historyLimitSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            boolean init = false;
            @Override public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                if (!init) { init = true; return; }
                if (position >= 0 && position < limits.length) AppPrefs.setHistoryLimit(SettingsActivity.this, limits[position]);
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> parent) {}
        });

        btnClear.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle(R.string.settings_clear_all)
                .setMessage(R.string.history_clear_confirm)
                .setPositiveButton(android.R.string.ok, (d, w) -> {
                    HistoryStore.clearAll(this);
                    Toast.makeText(this, R.string.history_cleared, Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show());

        btnAcc.setOnClickListener(v -> openAction(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        btnOverlay.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) openUri(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        });
        btnNotif.setOnClickListener(v -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(i);
                } else openUri(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            } catch (Exception e) { openUri(Settings.ACTION_APPLICATION_DETAILS_SETTINGS); }
        });
        btnBatt.setOnClickListener(v -> openAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
    }

    private void openAction(String a) {
        try { startActivity(new Intent(a)); } catch (Exception e) { Toast.makeText(this, e.getMessage(), Toast.LENGTH_SHORT).show(); }
    }
    private void openUri(String a) {
        try { startActivity(new Intent(a, Uri.parse("package:" + getPackageName()))); } catch (Exception e) { openAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS); }
    }
}
