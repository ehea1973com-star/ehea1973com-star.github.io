package com.yahya.universalcopy;

public final class CaptureUi {
    public interface Host {
        boolean showCaptureBar(String text, String source, String appLabel);
        void dismissCaptureBar();
        void startManualSelection();
    }

    private static Host host;

    private CaptureUi() {}

    public static synchronized void setHost(Host h) { host = h; }

    public static synchronized void clearHost(Host h) { if (host == h) host = null; }

    public static synchronized boolean show(String text, String source, String appLabel) {
        if (host == null) return false;
        try { return host.showCaptureBar(text, source, appLabel); }
        catch (Exception e) { return false; }
    }

    public static synchronized void dismiss() {
        if (host != null) {
            try { host.dismissCaptureBar(); } catch (Exception ignored) {}
        }
    }

    public static synchronized boolean manualSelect() {
        if (host == null) return false;
        try { host.startManualSelection(); return true; }
        catch (Exception e) { return false; }
    }
}
