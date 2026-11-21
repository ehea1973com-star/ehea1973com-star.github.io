package com.yahya.universalcopy;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
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
    private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint cancelBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint cancelTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF tmp = new RectF();
    private final RectF cancelRect = new RectF();
    private final String hint;
    private final String cancelLabel;

    public SelectionOverlayView(Context context, List<TextNodeItem> items, Listener listener) {
        super(context);
        if (items != null) this.items = items;
        this.listener = listener;
        this.hint = context.getString(R.string.selection_hint);
        this.cancelLabel = context.getString(R.string.selection_cancel);

        dimPaint.setColor(Color.parseColor("#66000000"));

        boxPaint.setStyle(Paint.Style.FILL);
        boxPaint.setColor(Color.parseColor("#332196F3"));

        boxStroke.setStyle(Paint.Style.STROKE);
        boxStroke.setColor(Color.parseColor("#FF2196F3"));
        boxStroke.setStrokeWidth(dp(1.5f));

        labelPaint.setColor(Color.WHITE);
        labelPaint.setTextSize(sp(11f));
        labelPaint.setTypeface(Typeface.DEFAULT_BOLD);
        labelPaint.setShadowLayer(dp(2f), 0, 0, Color.parseColor("#AA000000"));

        hintBgPaint.setColor(Color.parseColor("#CC1565C0"));
        hintTextPaint.setColor(Color.WHITE);
        hintTextPaint.setTextSize(sp(14f));
        hintTextPaint.setTypeface(Typeface.DEFAULT_BOLD);
        hintTextPaint.setTextAlign(Paint.Align.CENTER);

        cancelBgPaint.setColor(Color.parseColor("#E0D32F2F"));
        cancelTextPaint.setColor(Color.WHITE);
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
            canvas.drawRoundRect(tmp, dp(4), dp(4), boxPaint);
            canvas.drawRoundRect(tmp, dp(4), dp(4), boxStroke);
            String label = it.text.replace('\n', ' ').trim();
            if (label.length() > 40) label = label.substring(0, 40) + "…";
            if (!label.isEmpty()) {
                float tx = tmp.left + dp(4);
                float ty = tmp.centerY() - (labelPaint.ascent() + labelPaint.descent()) / 2f;
                // keep label inside box vertically
                float maxTy = tmp.bottom - dp(2);
                float minTy = tmp.top - labelPaint.ascent() + dp(2);
                if (ty > maxTy) ty = maxTy;
                if (ty < minTy) ty = minTy;
                canvas.save();
                canvas.clipRect(tmp);
                canvas.drawText(label, tx, ty, labelPaint);
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
        float x = event.getX();
        float y = event.getY();
        if (cancelRect.contains(x, y)) {
            if (listener != null) listener.onCancel();
            return true;
        }
        // find topmost/smallest containing item? iterate reverse to prefer later drawn? order arbitrary; prefer smallest area containing point
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
            if (listener != null) listener.onCopy(hit.text);
        }
        return true;
    }
}
