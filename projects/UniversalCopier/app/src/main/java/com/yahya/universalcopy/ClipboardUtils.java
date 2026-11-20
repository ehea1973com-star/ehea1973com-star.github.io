package com.yahya.universalcopy;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

public class ClipboardUtils {
    public static void copy(Context c, String text) {
        try {
            ClipboardManager cm = (ClipboardManager) c.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null && text != null) {
                cm.setPrimaryClip(ClipData.newPlainText("text", text));
            }
        } catch (Exception ignored) {}
    }

    public static String getText(Context c) {
        try {
            ClipboardManager cm = (ClipboardManager) c.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null && cm.hasPrimaryClip()) {
                ClipData cd = cm.getPrimaryClip();
                if (cd != null && cd.getItemCount() > 0) {
                    CharSequence cs = cd.getItemAt(0).coerceToText(c);
                    return cs != null ? cs.toString() : "";
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    public static void toast(Context c, String msg) {
        if (c == null) return;
        Handler h = new Handler(Looper.getMainLooper());
        h.post(() -> {
            try { Toast.makeText(c.getApplicationContext(), msg, Toast.LENGTH_SHORT).show(); } catch (Exception ignored) {}
        });
    }
}
