package com.yahya.universalcopy;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public class CaptureActionBarView extends View {
    public interface Listener {
        void onCopyAll();
        void onManualSelect();
        void onSearch();
        void onTranslate();
        void onClear();
        void onClose();
    }

    private static final String[] LABELS = {"نسخ الكل", "تحديد", "بحث", "ترجمة", "مسح", "إغلاق"};
    private static final int[] COLORS = {
            Color.parseColor("#2E7D32"),
            Color.parseColor("#1565C0"),
            Color.parseColor("#6A1B9A"),
            Color.parseColor("#EF6C00"),
            Color.parseColor("#C62828"),
            Color.parseColor("#455A64")
    };

    private final ThemeHelper.T t;
    private final String preview;
    private final String header;
    private final Listener listener;
    private final Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint smallPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glyphPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF cardRect = new RectF();
    private final List<Rect> hitAreas = new ArrayList<>();

    public CaptureActionBarView(Context context, String text, String source, String appLabel, Listener listener) {
        super(context);
        this.t = ThemeHelper.get(AppPrefs.getTheme(context));
        this.listener = listener;
        String s = text == null ? "" : text.replace('\n', ' ').trim();
        this.preview = s.length() > 90 ? s.substring(0, 90) + "…" : s;
        String app = appLabel == null || appLabel.trim().isEmpty() ? context.getString(R.string.app_name) : appLabel.trim();
        String src = source == null || source.trim().isEmpty() ? context.getString(R.string.source_ui) : source.trim();
        this.header = app + "  •  " + src;
        setClickable(true);
        setLayoutDirection(LAYOUT_DIRECTION_RTL);
        bgPaint.setColor(t.card);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(dp(1));
        borderPaint.setColor(t.accent);
        textPaint.setColor(t.text);
        textPaint.setTextSize(sp(14));
        smallPaint.setColor(t.text2);
        smallPaint.setTextSize(sp(11));
        circlePaint.setStyle(Paint.Style.FILL);
        glyphPaint.setColor(Color.WHITE);
        glyphPaint.setTextSize(sp(13));
        glyphPaint.setTextAlign(Paint.Align.CENTER);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int w = MeasureSpec.getSize(widthMeasureSpec);
        if (w <= 0) w = getResources().getDisplayMetrics().widthPixels;
        int h = dp(112);
        setMeasuredDimension(w, h);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int w = getWidth();
        int h = getHeight();
        cardRect.set(dp(6), dp(4), w - dp(6), h - dp(6));
        canvas.drawRoundRect(cardRect, dp(14), dp(14), bgPaint);
        canvas.drawRoundRect(cardRect, dp(14), dp(14), borderPaint);

        textPaint.setTextAlign(Paint.Align.RIGHT);
        canvas.drawText(header, w - dp(16), dp(24), textPaint);
        smallPaint.setTextAlign(Paint.Align.RIGHT);
        canvas.drawText(preview, w - dp(16), dp(43), smallPaint);

        hitAreas.clear();
        int n = LABELS.length;
        int slot = (w - dp(12)) / n;
        int cy = dp(70);
        int radius = dp(19);
        for (int i = 0; i < n; i++) {
            int cx = dp(6) + slot * i + slot / 2;
            circlePaint.setColor(COLORS[i]);
            canvas.drawCircle(cx, cy, radius, circlePaint);
            String glyph = glyphFor(i);
            Paint.FontMetrics fm = glyphPaint.getFontMetrics();
            float baseline = cy - (fm.ascent + fm.descent) / 2;
            canvas.drawText(glyph, cx, baseline, glyphPaint);
            smallPaint.setTextAlign(Paint.Align.CENTER);
            smallPaint.setColor(t.text);
            canvas.drawText(LABELS[i], cx, dp(101), smallPaint);
            int left = cx - slot / 2;
            int right = cx + slot / 2;
            hitAreas.add(new Rect(left, dp(50), right, h - dp(4)));
        }
    }

    private String glyphFor(int i) {
        switch (i) {
            case 0: return "ك";
            case 1: return "✎";
            case 2: return "؟";
            case 3: return "ع";
            case 4: return "×";
            default: return "─";
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_UP || listener == null) return super.onTouchEvent(event);
        int x = (int) event.getX();
        int y = (int) event.getY();
        int idx = -1;
        for (int i = 0; i < hitAreas.size(); i++) {
            if (hitAreas.get(i).contains(x, y)) { idx = i; break; }
        }
        if (idx < 0) return true;
        switch (idx) {
            case 0: listener.onCopyAll(); break;
            case 1: listener.onManualSelect(); break;
            case 2: listener.onSearch(); break;
            case 3: listener.onTranslate(); break;
            case 4: listener.onClear(); break;
            default: listener.onClose(); break;
        }
        return true;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private int sp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().scaledDensity);
    }
}
