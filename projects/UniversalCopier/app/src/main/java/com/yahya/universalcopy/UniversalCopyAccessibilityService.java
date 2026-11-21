package com.yahya.universalcopy;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Rect;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.ArrayList;
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

    public List<TextNodeItem> collectTextNodes() {
        List<TextNodeItem> out = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                List<AccessibilityWindowInfo> windows = getWindows();
                if (windows != null && !windows.isEmpty()) {
                    for (AccessibilityWindowInfo wi : windows) {
                        if (wi == null) continue;
                        try {
                            AccessibilityNodeInfo root = wi.getRoot();
                            traverseItems(root, out, seen, 0);
                            if (root != null) root.recycle();
                        } catch (Exception ignored) {}
                    }
                } else {
                    AccessibilityNodeInfo root = getRootInActiveWindow();
                    traverseItems(root, out, seen, 0);
                    if (root != null) root.recycle();
                }
            } else {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                traverseItems(root, out, seen, 0);
                if (root != null) root.recycle();
            }
        } catch (Throwable t) {
            try {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                traverseItems(root, out, seen, 0);
                if (root != null) root.recycle();
            } catch (Exception ignored) {}
        }
        return out;
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

    private void traverseItems(AccessibilityNodeInfo node, List<TextNodeItem> out, Set<String> seen, int depth) {
        if (node == null || depth > 100) return;
        try {
            if (shouldSkipNode(node)) return;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && !node.isVisibleToUser()) {
                    return;
                }
            } catch (Exception ignored) {}

            String best = null;
            CharSequence text = node.getText();
            if (text != null) {
                String s = text.toString().trim();
                if (!s.isEmpty()) best = s;
            }
            if (best == null) {
                CharSequence desc = node.getContentDescription();
                if (desc != null) {
                    String d = desc.toString().trim();
                    if (!d.isEmpty()) best = d;
                }
            }

            if (best != null) {
                boolean preferLeaf = node.getChildCount() == 0 || (text != null && !text.toString().trim().isEmpty());
                if (preferLeaf) {
                    Rect r = new Rect();
                    node.getBoundsInScreen(r);
                    if (r.width() > 0 && r.height() > 0) {
                        String key = best + "|" + r.left + "," + r.top + "," + r.right + "," + r.bottom;
                        if (!seen.contains(key)) {
                            seen.add(key);
                            out.add(new TextNodeItem(best, r.left, r.top, r.right, r.bottom));
                        }
                    }
                }
            }

            int count = node.getChildCount();
            for (int i = 0; i < count; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    traverseItems(child, out, seen, depth + 1);
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
