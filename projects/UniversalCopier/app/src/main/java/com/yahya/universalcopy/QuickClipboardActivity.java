package com.yahya.universalcopy;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class QuickClipboardActivity extends AppCompatActivity {

    private TextView currentClip;
    private final List<HistoryItem> recent = new ArrayList<>();
    private Adapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_quick_clipboard);

        currentClip = findViewById(R.id.currentClipboardText);
        Button btnCopyCurrent = findViewById(R.id.btnCopyCurrent);
        Button btnSaveCurrent = findViewById(R.id.btnSaveCurrent);
        Button btnRefresh = findViewById(R.id.btnRefreshClip);
        RecyclerView rv = findViewById(R.id.recyclerRecent);

        adapter = new Adapter();
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        btnRefresh.setOnClickListener(v -> refresh());
        btnCopyCurrent.setOnClickListener(v -> {
            String t = ClipboardUtils.getText(this);
            if (t == null || t.trim().isEmpty()) {
                Toast.makeText(this, R.string.quick_clip_empty, Toast.LENGTH_SHORT).show();
            } else {
                ClipboardUtils.copy(this, t);
                Toast.makeText(this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
            }
        });
        btnSaveCurrent.setOnClickListener(v -> {
            String t = ClipboardUtils.getText(this);
            if (t == null || t.trim().isEmpty()) {
                Toast.makeText(this, R.string.quick_clip_empty, Toast.LENGTH_SHORT).show();
            } else {
                HistoryStore.add(this, t, getString(R.string.source_manual));
                Toast.makeText(this, R.string.toast_saved, Toast.LENGTH_SHORT).show();
                refresh();
            }
        });

        refresh();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private void refresh() {
        String t = ClipboardUtils.getText(this);
        if (t == null || t.trim().isEmpty()) {
            currentClip.setText(R.string.quick_clip_empty);
        } else {
            String p = t;
            if (p.length() > 800) p = p.substring(0, 800) + "…";
            currentClip.setText(p);
        }
        recent.clear();
        List<HistoryItem> all = HistoryStore.getAll(this, null);
        int n = Math.min(30, all.size());
        for (int i = 0; i < n; i++) recent.add(all.get(i));
        if (adapter != null) adapter.notifyDataSetChanged();
    }

    class Adapter extends RecyclerView.Adapter<Adapter.VH> {
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(android.R.layout.simple_list_item_2, parent, false);
            return new VH(v);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            HistoryItem it = recent.get(pos);
            String p = it.text == null ? "" : it.text;
            if (p.length() > 120) p = p.substring(0, 120) + "…";
            h.t1.setText(p);
            h.t2.setText(it.pinned ? ("★ " + (it.source != null ? it.source : "")) : (it.source != null ? it.source : ""));
            h.itemView.setOnClickListener(v -> {
                ClipboardUtils.copy(QuickClipboardActivity.this, it.text);
                Toast.makeText(QuickClipboardActivity.this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
                refresh();
            });
        }
        @Override public int getItemCount() { return recent.size(); }
        class VH extends RecyclerView.ViewHolder {
            TextView t1, t2;
            VH(View v) { super(v); t1 = v.findViewById(android.R.id.text1); t2 = v.findViewById(android.R.id.text2); }
        }
    }
}
