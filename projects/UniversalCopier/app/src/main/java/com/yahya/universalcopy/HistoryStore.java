package com.yahya.universalcopy;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HistoryStore {
    private static final String PREF = "uc_history";
    private static final String KEY = "items";

    private static SharedPreferences sp(Context c) {
        return c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static synchronized void add(Context c, String text, String source) {
        if (text == null) return;
        String t = text.trim();
        if (t.isEmpty()) return;
        List<HistoryItem> list = getAllInternal(c);
        // remove duplicate same text (keep pinned state if any)
        boolean wasPinned = false;
        for (int i = list.size() - 1; i >= 0; i--) {
            if (t.equals(list.get(i).text)) {
                if (list.get(i).pinned) wasPinned = true;
                list.remove(i);
            }
        }
        list.add(0, new HistoryItem(System.currentTimeMillis(), t, System.currentTimeMillis(), source, wasPinned));
        trim(c, list);
        save(c, list);
    }

    private static void trim(Context c, List<HistoryItem> list) {
        int limit = AppPrefs.getHistoryLimit(c);
        // keep all pinned + newest non-pinned up to limit
        List<HistoryItem> pinned = new ArrayList<>();
        List<HistoryItem> normal = new ArrayList<>();
        for (HistoryItem it : list) {
            if (it.pinned) pinned.add(it); else normal.add(it);
        }
        if (normal.size() > limit) {
            normal = new ArrayList<>(normal.subList(0, limit));
        }
        list.clear();
        list.addAll(pinned);
        list.addAll(normal);
        Collections.sort(list, (a, b) -> Long.compare(b.time, a.time));
    }

    public static synchronized List<HistoryItem> getAll(Context c, String query) {
        List<HistoryItem> all = getAllInternal(c);
        if (query == null || query.trim().isEmpty()) return all;
        String q = query.toLowerCase();
        List<HistoryItem> out = new ArrayList<>();
        for (HistoryItem it : all) {
            if (it.text != null && it.text.toLowerCase().contains(q)) out.add(it);
        }
        return out;
    }

    private static List<HistoryItem> getAllInternal(Context c) {
        List<HistoryItem> out = new ArrayList<>();
        try {
            String raw = sp(c).getString(KEY, "[]");
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                out.add(new HistoryItem(
                        o.optLong("id", i),
                        o.optString("text", ""),
                        o.optLong("time", 0),
                        o.optString("source", ""),
                        o.optBoolean("pinned", false)
                ));
            }
        } catch (Exception ignored) {}
        return out;
    }

    private static void save(Context c, List<HistoryItem> list) {
        try {
            JSONArray arr = new JSONArray();
            for (HistoryItem it : list) {
                JSONObject o = new JSONObject();
                o.put("id", it.id);
                o.put("text", it.text);
                o.put("time", it.time);
                o.put("source", it.source);
                o.put("pinned", it.pinned);
                arr.put(o);
            }
            sp(c).edit().putString(KEY, arr.toString()).apply();
        } catch (Exception ignored) {}
    }

    public static synchronized void togglePin(Context c, long id) {
        List<HistoryItem> list = getAllInternal(c);
        for (HistoryItem it : list) {
            if (it.id == id) { it.pinned = !it.pinned; break; }
        }
        save(c, list);
    }

    public static synchronized void delete(Context c, long id) {
        List<HistoryItem> list = getAllInternal(c);
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).id == id) { list.remove(i); break; }
        }
        save(c, list);
    }

    public static synchronized void clearAll(Context c) {
        sp(c).edit().putString(KEY, "[]").apply();
    }

    public static synchronized void clearNonPinned(Context c) {
        List<HistoryItem> list = getAllInternal(c);
        List<HistoryItem> kept = new ArrayList<>();
        for (HistoryItem it : list) if (it.pinned) kept.add(it);
        save(c, kept);
    }
}
