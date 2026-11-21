package com.yahya.universalcopy;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public class SelectionOverlayView extends View {

    public interface Listener {
        void onCopy(String text);
        void onCancel();
    }

    private List<TextNodeItem> items = new ArrayList<>();
    private final Listener listener;
    private final Paint dimPaint = new Paint();
    private final Paint boxPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint boxStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint selBoxPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint selBoxStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint cancelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint cancelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF tmp = new RectF();
    private final RectF cancelRect = new RectF();
    private final String hint;
    private final String cancelLabel;
    private final ThemeHelper.T themeT;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextNodeItem selectedItem = null;
    private boolean handled = false;

    public SelectionOverlayView(Context context, List<TextNodeItem> items, Listener listener) {
        super(context);
        if (items != null) this.items = items;
        this.listener = listener;
        this.hint = context.getString(R.string.selection_hint);
        this.cancelLabel = context.getString(R.string.selection_cancel);
        String themeName = AppPrefs.getTheme(context);
        this.themeT = ThemeHelper.get(themeName);

        // light dim so target content remains visible; selection uses high contrast/inversion-like colors
        dimPaint.setColor(Color.parseColor("#22000000"));

        boxPaint.setStyle(Paint.Style.FILL);
        boxPaint.setColor(Color.parseColor("#1A1B5E20")); // subtle green

        boxStroke.setStyle(Paint.Style.STROKE);
        boxStroke.setColor(themeT.accent);
        boxStroke.setStrokeWidth(dp(1.5f));

        selBoxPaint.setStyle(Paint.Style.FILL);
        selBoxPaint.setColor(Color.parseColor("#CCFFEB3B")); // bright yellow inverse-like highlight

        selBoxStroke.setStyle(Paint.Style.STROKE);
        selBoxStroke.setColor(Color.parseColor("#FF000000"));
        selBoxStroke.setStrokeWidth(dp(3f));

        labelPaint.setColor(themeT.text);
        labelPaint.setTextSize(sp(12f));
        labelPaint.setTypeface(Typeface.DEFAULT_BOLD);
        labelPaint.setShadowLayer(dp(1.5f), 0, 0, Color.parseColor("#88FFFFFF"));

        hintBgPaint.setColor(themeT.card); // themed
        hintTextPaint.setColor(themeT.text2);
        hintTextPaint.setTextSize(sp(14f));
        hintTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
        hintTextPaint.setTextAlign(Paint.Align.CENTER);

        cancelBgPaint.setColor(themeT.text);
        cancelTextPaint.setColor(themeT.bg);
        cancelTextPaint.setTextSize(sp(14f));
        cancelTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
        cancelTextPaint.setTextAlign(Paint.Align.CENTER);

        setClickable(true);
    }

    private float dp(float v) { return v * getResources().getDisplayMetrics().density; }
    private float sp(float v) { return v * getResources().getDisplayMetrics().scaledDensity; }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int w = getWidth();
        int h = getHeight();
        canvas.drawRect(0, 0, w, h, dimPaint);

        for (TextNodeItem it : items) {
            if (it == null || it.text == null) continue;
            tmp.set(it.left, it.top, it.right, it.bottom);
            if (tmp.width() <= 0 || tmp.height() <= 0) continue;
            boolean sel = (it == selectedItem);
            canvas.drawRoundRect(tmp, dp(4), dp(4), sel ? selBoxPaint : boxPaint);
            canvas.drawRoundRect(tmp, dp(4), dp(4), sel ? selBoxStroke : boxStroke);
            String label = it.text.replace('\n', ' ').trim();
            if (label.length() > 40) label = label.substring(0, 40) + "…";
            if (sel) label = "✓ " + label;
            if (!label.isEmpty()) {
                float tx = tmp.left + dp(4);
                float ty = tmp.centerY() - (labelPaint.ascent() + labelPaint.descent()) / 2f;
                float maxTy = tmp.bottom - dp(2);
                float minTy = tmp.top - labelPaint.ascent() + dp(2);
                if (ty > maxTy) ty = maxTy;
                if (ty < minTy) ty = minTy;
                canvas.save();
                canvas.clipRect(tmp);
                // draw small label backdrop for readability
                float tw = labelPaint.measureText(label);
                Paint bg = sel ? selBoxPaint : boxPaint;
                Paint bg2 = new Paint(Paint.ANTI_ALIAS_FLAG);
                bg2.setStyle(Paint.Style.FILL);
                bg2.setColor(sel ? Color.parseColor("#F2FFEB3B") : Color.parseColor("#E6FFF8EE"));
                RectF lr = new RectF(tx - dp(2), ty + labelPaint.ascent() - dp(2), tx + tw + dp(2), ty + labelPaint.descent() + dp(2));
                canvas.drawRoundRect(lr, dp(3), dp(3), bg2);
                labelPaint.setColor(sel ? Color.parseColor("#FF000000") : Color.parseColor("#FF1B5E20"));
                // preserve direction: RTL items should render RTL
                float drawX = tx;
                Paint.Align oldAlign = labelPaint.getTextAlign();
                if (it.rtl) {
                    labelPaint.setTextAlign(Paint.Align.RIGHT);
                    drawX = tmp.right - dp(4);
                }
                canvas.drawText(label, drawX, ty, labelPaint);
                if (it.rtl) labelPaint.setTextAlign(oldAlign);
                canvas.restore();
            }
        }

        // hint bar
        float hintH = dp(44);
        float hintW = Math.min(w - dp(32), hintTextPaint.measureText(hint) + dp(32));
        float hx = (w - hintW) / 2f;
        float hy = dp(24);
        RectF hintR = new RectF(hx, hy, hx + hintW, hy + hintH);
        canvas.drawRoundRect(hintR, dp(22), dp(22), hintBgPaint);
        canvas.drawText(hint, w / 2f, hy + hintH / 2f - (hintTextPaint.ascent() + hintTextPaint.descent()) / 2f, hintTextPaint);

        // cancel button
        float cW = dp(140);
        float cH = dp(44);
        float cx = (w - cW) / 2f;
        float cy = h - cH - dp(28);
        cancelRect.set(cx, cy, cx + cW, cy + cH);
        canvas.drawRoundRect(cancelRect, dp(22), dp(22), cancelBgPaint);
        canvas.drawText(cancelLabel, w / 2f, cy + cH / 2f - (cancelTextPaint.ascent() + cancelTextPaint.descent()) / 2f, cancelTextPaint);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_UP) return true;
        if (handled) return true;
        float x = event.getX();
        float y = event.getY();
        if (cancelRect.contains(x, y)) {
            handled = true;
            if (listener != null) listener.onCancel();
            return true;
        }
        // prefer smallest area containing point
        TextNodeItem hit = null;
        int bestArea = Integer.MAX_VALUE;
        for (TextNodeItem it : items) {
            if (it == null || it.text == null) continue;
            if (x >= it.left && x <= it.right && y >= it.top && y <= it.bottom) {
                int area = Math.max(0, (it.right - it.left)) * Math.max(0, (it.bottom - it.top));
                if (area < bestArea) {
                    bestArea = area;
                    hit = it;
                }
            }
        }
        if (hit != null) {
            handled = true;
            selectedItem = hit;
            invalidate();
            final String text = hit.text;
            handler.postDelayed(() -> {
                if (listener != null) listener.onCopy(text);
            }, 300);
        }
        return true;
    }
}
