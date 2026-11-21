package com.yahya.universalcopy;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;

import java.util.List;

public class PermissionHelper {

    public static boolean isAccessibilityEnabled(Context c) {
        if (c == null) return false;
        try {
            AccessibilityManager am = (AccessibilityManager) c.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am == null) return false;
            List<AccessibilityServiceInfo> enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
            String target = new ComponentName(c, UniversalCopyAccessibilityService.class).flattenToString();
            String targetShort = c.getPackageName() + "/.UniversalCopyAccessibilityService";
            String targetShort2 = c.getPackageName() + "/" + UniversalCopyAccessibilityService.class.getName();
            if (enabled != null) {
                for (AccessibilityServiceInfo info : enabled) {
                    if (info == null || info.getId() == null) continue;
                    String id = info.getId();
                    if (id.equalsIgnoreCase(target) || id.equalsIgnoreCase(targetShort) || id.equalsIgnoreCase(targetShort2)
                            || (id.contains(c.getPackageName()) && id.toLowerCase().contains("universalcopyaccessibilityservice"))) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        // fallback to live instance
        return UniversalCopyAccessibilityService.instance != null;
    }

    public static boolean canDrawOverlays(Context c) {
        if (c == null) return true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try { return Settings.canDrawOverlays(c); } catch (Exception ignored) { return false; }
        }
        return true;
    }

    public static boolean hasNotifications(Context c) {
        if (c == null) return true;
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                return c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
            } catch (Exception ignored) { return false; }
        }
        return true;
    }

    public static void openAccessibilitySettings(Context c) {
        if (c == null) return;
        // Try opening specific accessibility service details (Android 8+ / some OEMs)
        try {
            ComponentName cn = new ComponentName(c, UniversalCopyAccessibilityService.class);
            Intent intent = new Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS");
            if (Build.VERSION.SDK_INT >= 29) {
                intent.putExtra(Intent.EXTRA_COMPONENT_NAME, cn.flattenToString());
            }
            intent.setData(Uri.parse("package:" + c.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(intent);
            return;
        } catch (Exception ignored) {}
        try {
            ComponentName cn = new ComponentName(c, UniversalCopyAccessibilityService.class);
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Bundle b = new Bundle();
            b.putString(":settings:fragment_args_key", cn.flattenToString());
            intent.putExtra(":settings:fragment_args_key", cn.flattenToString());
            intent.putExtra(":settings:show_fragment_args", b);
            c.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(i);
            } catch (Exception ignored) {}
        }
    }

    public static void openOverlaySettings(Context c) {
        if (c == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + c.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(intent);
                return;
            }
        } catch (Exception ignored) {}
        openAppDetails(c);
    }

    public static void openNotificationSettings(Context c) {
        if (c == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(intent);
                return;
            }
        } catch (Exception ignored) {}
        openAppDetails(c);
    }

    public static void openAppDetails(Context c) {
        if (c == null) return;
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + c.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(intent);
        } catch (Exception ignored) {}
    }
}
