package com.yahya.universalcopy;

import android.accessibilityservice.AccessibilityService;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class UniversalCopyAccessibilityService extends AccessibilityService {

    public static UniversalCopyAccessibilityService instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // on-demand only
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    public void copyUiTextsNow() {
        String text = collectAllText();
        CopyActions.handleTextResult(getApplicationContext(), text, getString(R.string.source_ui));
    }

    public String collectAllText() {
        Set<String> texts = new LinkedHashSet<>();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                List<AccessibilityWindowInfo> windows = getWindows();
                if (windows != null && !windows.isEmpty()) {
                    for (AccessibilityWindowInfo wi : windows) {
                        if (wi == null) continue;
                        try {
                            AccessibilityNodeInfo root = wi.getRoot();
                            traverse(root, texts, 0);
                            if (root != null) root.recycle();
                        } catch (Exception ignored) {}
                    }
                } else {
                    traverseRoot(texts);
                }
            } else {
                traverseRoot(texts);
            }
        } catch (Throwable t) {
            traverseRoot(texts);
        }
        StringBuilder sb = new StringBuilder();
        for (String s : texts) {
            if (s == null) continue;
            String v = s.trim();
            if (v.isEmpty()) continue;
            if (sb.length() > 0) sb.append('\n');
            sb.append(v);
        }
        return sb.toString().trim();
    }

    private void traverseRoot(Set<String> texts) {
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            traverse(root, texts, 0);
            if (root != null) root.recycle();
        } catch (Exception ignored) {}
    }

    private void traverse(AccessibilityNodeInfo node, Set<String> out, int depth) {
        if (node == null || depth > 100) return;
        try {
            if (shouldSkipNode(node)) return;
            CharSequence text = node.getText();
            if (text != null) {
                String s = text.toString().trim();
                if (!s.isEmpty()) out.add(s);
            }
            CharSequence desc = node.getContentDescription();
            if (desc != null) {
                String d = desc.toString().trim();
                if (!d.isEmpty()) {
                    String ts = text != null ? text.toString().trim() : "";
                    if (!d.equals(ts)) out.add(d);
                }
            }
            // try hint text on newer APIs if accessible via extras/text? skip reflection for safety
            int count = node.getChildCount();
            for (int i = 0; i < count; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    traverse(child, out, depth + 1);
                    child.recycle();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private boolean shouldSkipNode(AccessibilityNodeInfo node) {
        try {
            CharSequence pkg = node.getPackageName();
            if (pkg != null && getPackageName().equals(pkg.toString())) {
                // skip our own overlay/app to avoid copying UI labels instead of target content
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }
}
