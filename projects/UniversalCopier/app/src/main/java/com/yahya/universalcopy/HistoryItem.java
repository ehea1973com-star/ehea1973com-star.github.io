package com.yahya.universalcopy;

public class HistoryItem {
    public long id;
    public String text;
    public long time;
    public String source;
    public boolean pinned;

    public HistoryItem(long id, String text, long time, String source, boolean pinned) {
        this.id = id;
        this.text = text;
        this.time = time;
        this.source = source;
        this.pinned = pinned;
    }
}
