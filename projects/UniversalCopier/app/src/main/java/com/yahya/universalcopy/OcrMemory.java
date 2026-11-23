package com.yahya.universalcopy;

import android.graphics.Rect;

import java.util.ArrayList;
import java.util.List;

public class OcrMemory {
    private static String fullText = "";
    private static String source = "";
    private static String targetPackage = "";
    private static Rect targetBounds = null;
    private static final List<OcrSegment> segments = new ArrayList<>();

    public static synchronized void set(String text, String src, List<OcrSegment> segs) {
        set(text, src, segs, targetPackage, targetBounds);
    }

    public static synchronized void set(String text, String src, List<OcrSegment> segs, String pkg, Rect bounds) {
        fullText = text != null ? text : "";
        source = src != null ? src : "";
        targetPackage = pkg != null ? pkg : "";
        targetBounds = bounds == null ? null : new Rect(bounds);
        segments.clear();
        if (segs != null) segments.addAll(segs);
    }

    public static synchronized void setTarget(String pkg, Rect bounds) {
        targetPackage = pkg != null ? pkg : "";
        targetBounds = bounds == null ? null : new Rect(bounds);
    }

    public static synchronized String getFullText() { return fullText; }
    public static synchronized String getSource() { return source; }
    public static synchronized String getTargetPackage() { return targetPackage; }
    public static synchronized Rect getTargetBounds() { return targetBounds == null ? null : new Rect(targetBounds); }
    public static synchronized List<OcrSegment> getSegments() {
        return new ArrayList<>(segments);
    }
    public static synchronized void clear() {
        fullText = ""; source = ""; targetPackage = ""; targetBounds = null; segments.clear();
    }
}
