package com.yahya.universalcopy;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.List;

public class TextResultActivity extends AppCompatActivity {

    public static final String EXTRA_TEXT = "extra_text";
    public static final String EXTRA_SOURCE = "extra_source";
    public static final String EXTRA_FROM_OCR = "extra_from_ocr";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_text_result);
        ThemeHelper.apply(this);

        TextView textView = findViewById(R.id.textResult);
        Button btnCopy = findViewById(R.id.btnCopyAll);
        Button btnShare = findViewById(R.id.btnShare);
        Button btnSave = findViewById(R.id.btnSaveMemory);
        Button btnOpenClipboard = findViewById(R.id.btnOpenClipboard);
        Button btnClean = findViewById(R.id.btnCleanText);
        TextView segmentsTitle = findViewById(R.id.segmentsTitle);
        LinearLayout segmentsContainer = findViewById(R.id.segmentsContainer);

        Intent in = getIntent();
        String text = in != null ? in.getStringExtra(EXTRA_TEXT) : null;
        String source = in != null ? in.getStringExtra(EXTRA_SOURCE) : null;
        boolean fromOcr = in != null && in.getBooleanExtra(EXTRA_FROM_OCR, false);
        if ((text == null || text.trim().isEmpty()) && in != null) {
            CharSequence pt = in.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
            if (pt != null && pt.toString().trim().length() > 0) {
                text = pt.toString();
                if (source == null) source = getString(R.string.source_selected_text);
            }
        }
        if ((text == null || text.trim().isEmpty()) && in != null && Intent.ACTION_SEND.equals(in.getAction())) {
            CharSequence st = in.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (st != null && st.toString().trim().length() > 0) {
                text = st.toString();
                if (source == null) source = getString(R.string.source_shared_text);
            }
        }
        if (source == null) source = getString(R.string.source_manual);
        if (text == null || text.trim().isEmpty()) {
            text = getString(R.string.no_text_found);
        }
        final String finalText = text;
        final String finalSource = source;
        ThemeHelper.T theme = ThemeHelper.get(AppPrefs.getTheme(this));
        textView.setTextColor(theme.text);
        segmentsTitle.setTextColor(theme.text);
        textView.setText(finalText);
        applyTextDirection(textView, finalText);

        if (btnClean != null) {
            btnClean.setOnClickListener(v -> {
                String cur = textView.getText() != null ? textView.getText().toString() : "";
                String cleaned = cleanText(cur);
                if (cleaned.isEmpty()) {
                    Toast.makeText(this, R.string.toast_no_text, Toast.LENGTH_SHORT).show();
                    return;
                }
                textView.setText(cleaned);
                applyTextDirection(textView, cleaned);
                Toast.makeText(this, R.string.toast_text_cleaned, Toast.LENGTH_SHORT).show();
            });
        }

        btnCopy.setOnClickListener(v -> {
            ClipboardUtils.copy(this, finalText);
            Toast.makeText(this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
        });

        btnShare.setOnClickListener(v -> {
            try {
                String shareText = textView.getText() != null ? textView.getText().toString() : finalText;
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, shareText);
                startActivity(Intent.createChooser(send, getString(R.string.btn_share)));
            } catch (Exception e) {
                Toast.makeText(this, e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        if (btnSave != null) {
            btnSave.setOnClickListener(v -> {
                if (finalText != null && !finalText.trim().isEmpty() && !finalText.equals(getString(R.string.no_text_found))) {
                    HistoryStore.add(this, finalText, finalSource);
                    Toast.makeText(this, R.string.toast_saved, Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, R.string.toast_no_text, Toast.LENGTH_SHORT).show();
                }
            });
        }

        if (btnOpenClipboard != null) {
            btnOpenClipboard.setOnClickListener(v -> {
                try { startActivity(new Intent(this, QuickClipboardActivity.class)); } catch (Exception ignored) {}
            });
        }

        if (fromOcr) {
            try {
                List<OcrSegment> segs = OcrMemory.getSegments();
                if (segs != null && !segs.isEmpty()) {
                    segmentsTitle.setVisibility(View.VISIBLE);
                    segmentsContainer.setVisibility(View.VISIBLE);
                    segmentsContainer.removeAllViews();
                    int padH = dp(10);
                    int padV = dp(8);
                    int marginB = dp(6);
                    for (OcrSegment seg : segs) {
                        if (seg == null || seg.text == null) continue;
                        final String segText = seg.text.trim();
                        if (segText.isEmpty()) continue;
                        TextView tv = new TextView(this);
                        tv.setText(segText);
                        tv.setTextIsSelectable(true);
                        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
                        tv.setPadding(padH, padV, padH, padV);
                        tv.setTextColor(theme.text);
                        tv.setBackgroundColor(Color.parseColor("#332196F3"));
                        tv.setClickable(true);
                        tv.setFocusable(true);
                        tv.setOnClickListener(v -> {
                            ClipboardUtils.copy(this, segText);
                            Toast.makeText(this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
                        });
                        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                                LinearLayout.LayoutParams.MATCH_PARENT,
                                LinearLayout.LayoutParams.WRAP_CONTENT);
                        lp.bottomMargin = marginB;
                        tv.setLayoutParams(lp);
                        segmentsContainer.addView(tv);
                    }
                    // if nothing valid added, hide
                    if (segmentsContainer.getChildCount() == 0) {
                        segmentsTitle.setVisibility(View.GONE);
                        segmentsContainer.setVisibility(View.GONE);
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    private void applyTextDirection(TextView tv, String text) {
        if (tv == null) return;
        boolean rtl = isMostlyRtl(text);
        tv.setTextDirection(rtl ? View.TEXT_DIRECTION_RTL : View.TEXT_DIRECTION_LTR);
        tv.setGravity(rtl ? (android.view.Gravity.TOP | android.view.Gravity.RIGHT) : (android.view.Gravity.TOP | android.view.Gravity.LEFT));
    }

    private boolean isMostlyRtl(String text) {
        if (text == null) return false;
        int rtl = 0, ltr = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            byte dir = Character.getDirectionality(c);
            if (dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT || dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT_ARABIC
                    || dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT_EMBEDDING || dir == Character.DIRECTIONALITY_RIGHT_TO_LEFT_OVERRIDE) rtl++;
            else if (dir == Character.DIRECTIONALITY_LEFT_TO_RIGHT) ltr++;
        }
        return rtl > ltr;
    }

    private String cleanText(String s) {
        if (s == null) return "";
        String t = s.replace("\r\n", "\n").replace('\r', '\n').replace('\u00A0', ' ');
        t = t.replaceAll("[\\t ]+", " ");
        t = t.replaceAll(" *\\n *", "\n");
        t = t.replaceAll("\\n{3,}", "\n\n");
        return t.trim();
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
