package com.yahya.universalcopy;

import java.util.ArrayList;
import java.util.List;

public class OcrMemory {
    private static String fullText = "";
    private static String source = "";
    private static final List<OcrSegment> segments = new ArrayList<>();

    public static synchronized void set(String text, String src, List<OcrSegment> segs) {
        fullText = text != null ? text : "";
        source = src != null ? src : "";
        segments.clear();
        if (segs != null) segments.addAll(segs);
    }

    public static synchronized String getFullText() { return fullText; }
    public static synchronized String getSource() { return source; }
    public static synchronized List<OcrSegment> getSegments() {
        return new ArrayList<>(segments);
    }
    public static synchronized void clear() {
        fullText = ""; source = ""; segments.clear();
    }
}
