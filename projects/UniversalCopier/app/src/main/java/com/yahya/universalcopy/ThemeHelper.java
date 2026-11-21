package com.yahya.universalcopy;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ScrollView;
import android.widget.TextView;

public class ThemeHelper {
    public static final String THEME_WOOD = "wood";
    public static final String THEME_LIGHT = "light";
    public static final String THEME_DARK = "dark";
    public static final String THEME_CONTRAST = "contrast";

    public static class T {
        public int bg;
        public int text;
        public int text2;
        public int accent;
        public int card;
        public int buttonBg;
        public int buttonText;
        public T(int bg, int text, int text2, int accent, int card, int buttonBg, int buttonText) {
            this.bg=bg; this.text=text; this.text2=text2; this.accent=accent; this.card=card; this.buttonBg=buttonBg; this.buttonText=buttonText;
        }
    }

    public static T get(String name) {
        if (THEME_DARK.equals(name)) {
            return new T(Color.parseColor("#121212"), Color.parseColor("#E8F5E9"), Color.parseColor("#B9F6CA"), Color.parseColor("#4CAF50"), Color.parseColor("#1E1E1E"), Color.parseColor("#2E7D32"), Color.parseColor("#FFFFFF"));
        }
        if (THEME_LIGHT.equals(name)) {
            return new T(Color.parseColor("#FAFAFA"), Color.parseColor("#111111"), Color.parseColor("#1B5E20"), Color.parseColor("#2E7D32"), Color.parseColor("#FFFFFF"), Color.parseColor("#E8F5E9"), Color.parseColor("#1B5E20"));
        }
        if (THEME_CONTRAST.equals(name)) {
            return new T(Color.parseColor("#000000"), Color.parseColor("#00FF00"), Color.parseColor("#FFFFFF"), Color.parseColor("#00FF00"), Color.parseColor("#111111"), Color.parseColor("#003300"), Color.parseColor("#00FF00"));
        }
        // wood default - bright clear wood
        return new T(Color.parseColor("#F3E2C7"), Color.parseColor("#1B1B1B"), Color.parseColor("#1B5E20"), Color.parseColor("#2E7D32"), Color.parseColor("#FFF8EE"), Color.parseColor("#DEB887"), Color.parseColor("#1B1B1B"));
    }

    public static void apply(Activity a) {
        if (a == null) return;
        String name = AppPrefs.getTheme(a);
        T t = get(name);
        try {
            View root = a.getWindow().getDecorView();
            applyToView(root, t);
            a.getWindow().setBackgroundDrawable(new ColorDrawable(t.bg));
        } catch (Exception ignored) {}
    }

    public static void applyToView(View v, T t) {
        if (v == null || t == null) return;
        try {
            if (v instanceof ViewGroup) {
                ViewGroup g = (ViewGroup) v;
                if (shouldTintBackground(g)) {
                    try { g.setBackgroundColor(t.bg); } catch (Exception ignored) {}
                }
                for (int i = 0; i < g.getChildCount(); i++) applyToView(g.getChildAt(i), t);
                return;
            }
            if (v instanceof Button) {
                Button b = (Button) v;
                b.setTextColor(t.buttonText);
                try { b.setBackgroundColor(t.buttonBg); } catch (Exception ignored) {}
                return;
            }
            if (v instanceof CheckBox) {
                ((CheckBox) v).setTextColor(t.text);
                return;
            }
            if (v instanceof EditText) {
                EditText e = (EditText) v;
                e.setTextColor(t.text);
                e.setHintTextColor((t.text2 & 0x00FFFFFF) | 0x99000000);
                return;
            }
            if (v instanceof TextView) {
                ((TextView) v).setTextColor(t.text);
            }
        } catch (Exception ignored) {}
    }

    private static boolean shouldTintBackground(ViewGroup g) {
        try {
            String cls = g.getClass().getName();
            if (cls.contains("RecyclerView") || cls.contains("Spinner") || cls.contains("Toolbar") || cls.contains("ActionBar") || cls.contains("Button")) return false;
            android.graphics.drawable.Drawable bg = g.getBackground();
            if (bg instanceof ColorDrawable) return true;
            if (bg == null) {
                return (g instanceof ScrollView || g instanceof android.widget.LinearLayout || g instanceof android.widget.FrameLayout);
            }
        } catch (Exception ignored) {}
        return false;
    }
}
