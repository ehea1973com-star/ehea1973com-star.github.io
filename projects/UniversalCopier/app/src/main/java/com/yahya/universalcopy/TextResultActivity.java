package com.yahya.universalcopy;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class TextResultActivity extends AppCompatActivity {

    public static final String EXTRA_TEXT = "extra_text";
    public static final String EXTRA_SOURCE = "extra_source";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_text_result);

        TextView textView = findViewById(R.id.textResult);
        Button btnCopy = findViewById(R.id.btnCopyAll);
        Button btnShare = findViewById(R.id.btnShare);
        Button btnSave = findViewById(R.id.btnSaveMemory);

        String text = getIntent().getStringExtra(EXTRA_TEXT);
        String source = getIntent().getStringExtra(EXTRA_SOURCE);
        if (source == null) source = getString(R.string.source_manual);
        if (text == null || text.trim().isEmpty()) {
            text = getString(R.string.no_text_found);
        }
        final String finalText = text;
        final String finalSource = source;
        textView.setText(finalText);

        btnCopy.setOnClickListener(v -> {
            ClipboardUtils.copy(this, finalText);
            Toast.makeText(this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
        });

        btnShare.setOnClickListener(v -> {
            try {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, finalText);
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
    }
}
