package com.yahya.universalcopy;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HistoryActivity extends AppCompatActivity {

    private EditText search;
    private TextView empty;
    private Adapter adapter;
    private final List<HistoryItem> items = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);

        search = findViewById(R.id.searchHistory);
        empty = findViewById(R.id.emptyHistory);
        RecyclerView rv = findViewById(R.id.recyclerHistory);
        Button btnClear = findViewById(R.id.btnClearHistoryList);

        adapter = new Adapter();
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { load(); }
            @Override public void afterTextChanged(Editable s) {}
        });

        btnClear.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle(R.string.history_clear)
                .setMessage(R.string.history_clear_confirm)
                .setPositiveButton(android.R.string.ok, (d, w) -> {
                    HistoryStore.clearNonPinned(this);
                    Toast.makeText(this, R.string.history_cleared, Toast.LENGTH_SHORT).show();
                    load();
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show());

        load();
    }

    private void load() {
        String q = search != null ? search.getText().toString() : "";
        items.clear();
        items.addAll(HistoryStore.getAll(this, q));
        adapter.notifyDataSetChanged();
        empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
    }

    class Adapter extends RecyclerView.Adapter<Adapter.VH> {
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_history, parent, false);
            return new VH(v);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            HistoryItem it = items.get(pos);
            String preview = it.text == null ? "" : it.text;
            if (preview.length() > 200) preview = preview.substring(0, 200) + "…";
            h.text.setText(preview);
            String meta = (it.source != null ? it.source : "") + "  •  " + (it.time > 0 ? fmt.format(new Date(it.time)) : "");
            h.meta.setText(meta);
            h.pin.setText(it.pinned ? R.string.unpin : R.string.pin);
            h.itemView.setOnClickListener(v -> {
                ClipboardUtils.copy(HistoryActivity.this, it.text);
                Toast.makeText(HistoryActivity.this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
            });
            h.copy.setOnClickListener(v -> {
                ClipboardUtils.copy(HistoryActivity.this, it.text);
                Toast.makeText(HistoryActivity.this, R.string.toast_copied, Toast.LENGTH_SHORT).show();
            });
            h.pin.setOnClickListener(v -> {
                HistoryStore.togglePin(HistoryActivity.this, it.id);
                Toast.makeText(HistoryActivity.this, it.pinned ? R.string.history_unpinned : R.string.history_pinned, Toast.LENGTH_SHORT).show();
                load();
            });
            h.delete.setOnClickListener(v -> {
                HistoryStore.delete(HistoryActivity.this, it.id);
                Toast.makeText(HistoryActivity.this, R.string.history_deleted, Toast.LENGTH_SHORT).show();
                load();
            });
        }
        @Override public int getItemCount() { return items.size(); }
        class VH extends RecyclerView.ViewHolder {
            TextView text, meta; Button copy, pin, delete;
            VH(View v) {
                super(v);
                text = v.findViewById(R.id.itemText);
                meta = v.findViewById(R.id.itemMeta);
                copy = v.findViewById(R.id.btnItemCopy);
                pin = v.findViewById(R.id.btnItemPin);
                delete = v.findViewById(R.id.btnItemDelete);
            }
        }
    }
}
