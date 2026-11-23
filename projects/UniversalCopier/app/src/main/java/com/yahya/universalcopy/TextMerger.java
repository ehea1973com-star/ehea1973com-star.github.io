package com.yahya.universalcopy;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class TextMerger {
    private TextMerger() {}

    public static String merge(String uiText, String ocrText) {
        List<String> out = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        addLines(out, seen, uiText);
        addLines(out, seen, ocrText);
        StringBuilder sb = new StringBuilder();
        for (String s : out) {
            if (sb.length() > 0) sb.append('\n');
            sb.append(s);
        }
        return sb.toString().trim();
    }

    private static void addLines(List<String> out, Set<String> seen, String text) {
        if (text == null) return;
        String[] lines = text.replace("\r", "").split("\n");
        for (String raw : lines) {
            String s = raw.replace('\u00A0', ' ').trim();
            if (s.isEmpty()) continue;
            boolean dup = false;
            for (String old : seen) {
                if (s.equals(old) || containedDuplicate(s, old)) { dup = true; break; }
            }
            if (dup) continue;
            seen.add(s);
            out.add(s);
        }
    }

    private static boolean containedDuplicate(String a, String b) {
        String x = normalize(a);
        String y = normalize(b);
        if (x.length() < 6 || y.length() < 6) return false;
        if (x.contains(y) && y.length() * 2 >= x.length()) return true;
        return y.contains(x) && x.length() * 2 >= y.length();
    }

    private static String normalize(String s) {
        return s.replaceAll("[\\s\\u200E\\u200F]+", "").trim();
    }
}
