package com.yahya.universalcopy;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.pm.PackageManager;
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

    private String lastTargetPackage = null;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        try {
            if (event == null) return;
            CharSequence pkg = event.getPackageName();
            if (pkg != null && isValidPackage(pkg.toString())) lastTargetPackage = pkg.toString();
        } catch (Exception ignored) {}
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
        String pkg = getTargetPackage();
        String text = collectAllText(pkg);
        OcrMemory.setTarget(pkg, getTargetBounds());
        CopyActions.handleTextResult(getApplicationContext(), text, getString(R.string.source_ui));
    }

    public String getTargetPackage() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        String pkg = packageOf(root);
        if (root != null) root.recycle();
        if (isValidPackage(pkg)) {
            lastTargetPackage = pkg;
            return pkg;
        }
        if (isValidPackage(lastTargetPackage)) return lastTargetPackage;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                List<AccessibilityWindowInfo> windows = getWindows();
                if (windows != null) {
                    for (AccessibilityWindowInfo wi : windows) {
                        if (wi == null || wi.getType() != AccessibilityWindowInfo.TYPE_APPLICATION) continue;
                        AccessibilityNodeInfo wr = wi.getRoot();
                        String wp = packageOf(wr);
                        if (wr != null) wr.recycle();
                        if (isValidPackage(wp)) {
                            lastTargetPackage = wp;
                            return wp;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    public String getTargetLabel(Context context) {
        String pkg = getTargetPackage();
        if (pkg == null) return context.getString(R.string.app_name);
        try {
            PackageManager pm = context.getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString();
        } catch (Exception e) {
            return pkg;
        }
    }

    public Rect getTargetBounds() {
        String target = getTargetPackage();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                List<AccessibilityWindowInfo> windows = getWindows();
                if (windows != null) {
                    for (AccessibilityWindowInfo wi : windows) {
                        if (wi == null || wi.getType() != AccessibilityWindowInfo.TYPE_APPLICATION) continue;
                        AccessibilityNodeInfo root = wi.getRoot();
                        String pkg = packageOf(root);
                        boolean match = target == null ? isValidPackage(pkg) : target.equals(pkg);
                        if (match && root != null) {
                            Rect r = new Rect();
                            root.getBoundsInScreen(r);
                            if (r.width() > 100 && r.height() > 100) {
                                root.recycle();
                                return r;
                            }
                        }
                        if (root != null) root.recycle();
                    }
                }
            } catch (Exception ignored) {}
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root != null) {
            Rect r = new Rect();
            root.getBoundsInScreen(r);
            root.recycle();
            if (r.width() > 100 && r.height() > 100) return r;
        }
        return null;
    }

    public String collectAllText() {
        return collectAllText(getTargetPackage());
    }

    public String collectAllTextForPackage(String pkg) {
        return collectAllText(pkg);
    }

    private String collectAllText(String target) {
        Set<String> texts = new LinkedHashSet<>();
        AccessibilityNodeInfo root = findTargetRoot(target);
        if (root != null) {
            traverse(root, texts, 0, target);
            root.recycle();
        }
        StringBuilder sb = new StringBuilder();
        for (String s : texts) {
            String v = cleanText(s);
            if (v.isEmpty()) continue;
            if (sb.length() > 0) sb.append('\n');
            sb.append(v);
        }
        return sb.toString().trim();
    }

    public List<TextNodeItem> collectTextNodes() {
        List<TextNodeItem> out = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        String target = getTargetPackage();
        AccessibilityNodeInfo root = findTargetRoot(target);
        if (root != null) {
            traverseItems(root, out, seen, 0, target);
            root.recycle();
        }
        return out;
    }

    private AccessibilityNodeInfo findTargetRoot(String target) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        String pkg = packageOf(root);
        if (packageAllowed(pkg, target)) return root;
        if (root != null) root.recycle();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                List<AccessibilityWindowInfo> windows = getWindows();
                if (windows != null) {
                    for (AccessibilityWindowInfo wi : windows) {
                        if (wi == null || wi.getType() != AccessibilityWindowInfo.TYPE_APPLICATION) continue;
                        AccessibilityNodeInfo wr = wi.getRoot();
                        String wp = packageOf(wr);
                        if (packageAllowed(wp, target)) return wr;
                        if (wr != null) wr.recycle();
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private void traverse(AccessibilityNodeInfo node, Set<String> out, int depth, String target) {
        if (node == null || depth > 120) return;
        try {
            if (!packageAllowed(packageOf(node), target)) return;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && !node.isVisibleToUser()) return;
            } catch (Exception ignored) {}
            addNodeText(node, out);
            int count = node.getChildCount();
            for (int i = 0; i < count; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    traverse(child, out, depth + 1, target);
                    child.recycle();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void addNodeText(AccessibilityNodeInfo node, Set<String> out) {
        try {
            CharSequence text = node.getText();
            if (text != null) {
                String s = cleanText(text.toString());
                if (isUsefulText(s)) out.add(s);
            }
            CharSequence desc = node.getContentDescription();
            if (desc != null) {
                String d = cleanText(desc.toString());
                if (isUsefulText(d)) {
                    String ts = text != null ? cleanText(text.toString()) : "";
                    if (!d.equals(ts)) out.add(d);
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                CharSequence hint = node.getHintText();
                if (hint != null) {
                    String h = cleanText(hint.toString());
                    if (isUsefulText(h)) out.add(h);
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                CharSequence state = node.getStateDescription();
                if (state != null) {
                    String st = cleanText(state.toString());
                    if (isUsefulText(st)) out.add(st);
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                try {
                    List<CharSequence> extras = node.getExtras() != null ? node.getExtras().getCharSequenceArrayList("android.view.accessibility.extra.TEXT") : null;
                    if (extras != null) {
                        for (CharSequence cs : extras) {
                            if (cs == null) continue;
                            String e = cleanText(cs.toString());
                            if (isUsefulText(e)) out.add(e);
                        }
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private String cleanText(String s) {
        if (s == null) return "";
        String t = s.replace('\u00A0', ' ').replace("\r", "").trim();
        t = t.replace("\u200E", "").replace("\u200F", "")
                .replace("\u202A", "").replace("\u202B", "")
                .replace("\u202C", "").replace("\u202D", "").replace("\u202E", "");
        t = t.replaceAll("[\\t ]+", " ");
        return t.trim();
    }

    private boolean isUsefulText(String s) {
        if (s == null) return false;
        String t = s.trim();
        if (t.isEmpty()) return false;
        if (t.length() == 1) return Character.isLetterOrDigit(t.charAt(0));
        return true;
    }

    private void traverseItems(AccessibilityNodeInfo node, List<TextNodeItem> out, Set<String> seen, int depth, String target) {
        if (node == null || depth > 100) return;
        try {
            if (!packageAllowed(packageOf(node), target)) return;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && !node.isVisibleToUser()) return;
            } catch (Exception ignored) {}

            String best = null;
            CharSequence text = node.getText();
            if (text != null) {
                String s = cleanText(text.toString());
                if (isUsefulText(s)) best = s;
            }
            if (best == null) {
                CharSequence desc = node.getContentDescription();
                if (desc != null) {
                    String d = cleanText(desc.toString());
                    if (isUsefulText(d)) best = d;
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
                            boolean rtl = isRtl(best);
                            out.add(new TextNodeItem(best, r.left, r.top, r.right, r.bottom, rtl));
                        }
                    }
                }
            }

            int count = node.getChildCount();
            for (int i = 0; i < count; i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    traverseItems(child, out, seen, depth + 1, target);
                    child.recycle();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private boolean isRtl(String s) {
        if (s == null || s.isEmpty()) return false;
        for (int i = 0; i < s.length(); i++) {
            byte dir = Character.getDirectionality(s.charAt(i));
            if (dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT
                    || dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT_ARABIC) return true;
        }
        return false;
    }

    private String packageOf(AccessibilityNodeInfo node) {
        try {
            if (node == null) return null;
            CharSequence pkg = node.getPackageName();
            return pkg != null ? pkg.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private boolean packageAllowed(String pkg, String target) {
        if (!isValidPackage(pkg)) return true;
        if (isIgnoredPackage(pkg)) return false;
        return target == null || target.equals(pkg);
    }

    private boolean isValidPackage(String pkg) {
        return pkg != null && pkg.length() > 3 && !pkg.trim().isEmpty();
    }

    private boolean isIgnoredPackage(String pkg) {
        if (pkg == null) return false;
        if (getPackageName().equals(pkg)) return true;
        if ("com.android.systemui".equals(pkg)) return true;
        if ("com.google.android.googlequicksearchbox".equals(pkg)) return true;
        String p = pkg.toLowerCase();
        return p.contains("launcher") || p.endsWith(".systemui");
    }
}
