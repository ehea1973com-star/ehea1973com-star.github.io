package com.yahya.universalcopy;

import android.graphics.Bitmap;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions;
import com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

public class OcrHelper {

    public interface Callback {
        void onSuccess(String text);
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

    private static String extract(Text result) {
        if (result == null) return "";
        String t = result.getText();
        return t != null ? t.trim() : "";
    }
}
