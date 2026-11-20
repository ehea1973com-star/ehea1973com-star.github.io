package com.yahya.universalcopy;

import android.content.Context;
import android.content.Intent;

public class CopyActions {
    public static String handleTextResult(Context c, String text, String sourceLabel) {
        if (text == null) text = "";
        String t = text.trim();
        if (t.isEmpty()) {
            ClipboardUtils.toast(c, c.getString(R.string.toast_no_text));
            return t;
        }
        if (AppPrefs.isAutoCopy(c)) {
            ClipboardUtils.copy(c, t);
        }
        if (AppPrefs.isAutoSave(c)) {
            HistoryStore.add(c, t, sourceLabel);
        }
        ClipboardUtils.toast(c, c.getString(R.string.toast_copied));
        if (AppPrefs.isOpenResult(c)) {
            try {
                Intent i = new Intent(c, TextResultActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                i.putExtra(TextResultActivity.EXTRA_TEXT, t);
                i.putExtra(TextResultActivity.EXTRA_SOURCE, sourceLabel);
                c.startActivity(i);
            } catch (Exception ignored) {}
        }
        return t;
    }
}
