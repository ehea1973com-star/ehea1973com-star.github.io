package com.yahya.universalcopy;

import android.content.Context;
import android.content.SharedPreferences;

public class AppPrefs {
    private static final String PREF = "uc_prefs";
    public static final String MODE_UI = "ui";
    public static final String MODE_LATIN = "latin";
    public static final String MODE_CHINESE = "chinese";
    public static final String MODE_KOREAN = "korean";
    public static final String MODE_JAPANESE = "japanese";
    public static final String MODE_DEVANAGARI = "devanagari";

    private static SharedPreferences sp(Context c) {
        return c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static String getDefaultMode(Context c) {
        return sp(c).getString("default_mode", MODE_LATIN);
    }
    public static void setDefaultMode(Context c, String mode) {
        sp(c).edit().putString("default_mode", mode).apply();
    }

    public static String getCurrentMode(Context c) {
        return sp(c).getString("current_mode", getDefaultMode(c));
    }
    public static void setCurrentMode(Context c, String mode) {
        sp(c).edit().putString("current_mode", mode).apply();
    }

    public static boolean isAutoCopy(Context c) { return sp(c).getBoolean("auto_copy", true); }
    public static void setAutoCopy(Context c, boolean v) { sp(c).edit().putBoolean("auto_copy", v).apply(); }

    public static boolean isAutoSave(Context c) { return sp(c).getBoolean("auto_save", true); }
    public static void setAutoSave(Context c, boolean v) { sp(c).edit().putBoolean("auto_save", v).apply(); }

    public static boolean isOpenResult(Context c) { return sp(c).getBoolean("open_result", false); }
    public static void setOpenResult(Context c, boolean v) { sp(c).edit().putBoolean("open_result", v).apply(); }

    public static int getHistoryLimit(Context c) { return sp(c).getInt("history_limit", 200); }
    public static void setHistoryLimit(Context c, int v) {
        if (v < 20) v = 20; if (v > 2000) v = 2000;
        sp(c).edit().putInt("history_limit", v).apply();
    }

    public static String modeLabel(Context c, String mode) {
        if (MODE_UI.equals(mode)) return c.getString(R.string.mode_ui);
        if (MODE_CHINESE.equals(mode)) return c.getString(R.string.mode_ocr_chinese);
        if (MODE_KOREAN.equals(mode)) return c.getString(R.string.mode_ocr_korean);
        if (MODE_JAPANESE.equals(mode)) return c.getString(R.string.mode_ocr_japanese);
        if (MODE_DEVANAGARI.equals(mode)) return c.getString(R.string.mode_ocr_devanagari);
        return c.getString(R.string.mode_ocr_latin);
    }

    public static String[] allOcrModes() {
        return new String[]{MODE_LATIN, MODE_CHINESE, MODE_KOREAN, MODE_JAPANESE, MODE_DEVANAGARI};
    }

    public static String getTheme(Context c) { return sp(c).getString("app_theme", ThemeHelper.THEME_WOOD); }
    public static void setTheme(Context c, String v) { sp(c).edit().putString("app_theme", v).apply(); }
}
