package com.yahya.universalcopy;

import android.graphics.Bitmap;
import android.graphics.Rect;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions;
import com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.util.ArrayList;
import java.util.List;

public class OcrHelper {

    public static class Result {
        public String fullText;
        public List<OcrSegment> segments;
        public Result(String fullText, List<OcrSegment> segments) {
            this.fullText = fullText != null ? fullText : "";
            this.segments = segments != null ? segments : new ArrayList<>();
        }
    }

    public interface Callback {
        void onSuccess(Result result);
        void onError(Exception e);
    }

    public static void recognize(Bitmap bitmap, String mode, Callback cb) {
        if (bitmap == null) {
            cb.onError(new IllegalArgumentException("bitmap null"));
            return;
        }
        try {
            TextRecognizer recognizer = getRecognizer(mode);
            InputImage image = InputImage.fromBitmap(bitmap, 0);
            recognizer.process(image)
                    .addOnSuccessListener(result -> {
                        try { cb.onSuccess(extract(result)); } catch (Exception e) { cb.onError(e); }
                        try { recognizer.close(); } catch (Exception ignored) {}
                    })
                    .addOnFailureListener(e -> {
                        cb.onError(e);
                        try { recognizer.close(); } catch (Exception ignored) {}
                    });
        } catch (Throwable t) {
            cb.onError(t instanceof Exception ? (Exception) t : new Exception(t));
        }
    }

    private static TextRecognizer getRecognizer(String mode) {
        if (AppPrefs.MODE_CHINESE.equals(mode)) {
            return TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());
        } else if (AppPrefs.MODE_KOREAN.equals(mode)) {
            return TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build());
        } else if (AppPrefs.MODE_JAPANESE.equals(mode)) {
            return TextRecognition.getClient(new JapaneseTextRecognizerOptions.Builder().build());
        } else if (AppPrefs.MODE_DEVANAGARI.equals(mode)) {
            return TextRecognition.getClient(new DevanagariTextRecognizerOptions.Builder().build());
        } else {
            return TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        }
    }

    private static Result extract(Text result) {
        List<OcrSegment> segs = new ArrayList<>();
        if (result != null) {
            try {
                for (Text.TextBlock block : result.getTextBlocks()) {
                    if (block == null) continue;
                    for (Text.Line line : block.getLines()) {
                        if (line == null) continue;
                        String lt = line.getText();
                        Rect r = line.getBoundingBox();
                        if (lt != null) lt = lt.trim();
                        if (lt != null && !lt.isEmpty() && r != null) {
                            segs.add(new OcrSegment(lt, r.left, r.top, r.right, r.bottom));
                        } else {
                            // fallback to elements if line text missing bounds oddly
                            for (Text.Element el : line.getElements()) {
                                if (el == null) continue;
                                String et = el.getText();
                                Rect er = el.getBoundingBox();
                                if (et != null) et = et.trim();
                                if (et != null && !et.isEmpty() && er != null) {
                                    segs.add(new OcrSegment(et, er.left, er.top, er.right, er.bottom));
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        String full = result != null && result.getText() != null ? result.getText().trim() : "";
        if (segs.isEmpty() && !full.isEmpty()) {
            // no boxes but have text
            segs.add(new OcrSegment(full, 0, 0, 0, 0));
        }
        return new Result(full, segs);
    }
}
