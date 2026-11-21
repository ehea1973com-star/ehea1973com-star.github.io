package com.yahya.universalcopy;

public class TextNodeItem {
    public String text;
    public int left;
    public int top;
    public int right;
    public int bottom;
    public boolean rtl;

    public TextNodeItem(String text, int left, int top, int right, int bottom) {
        this(text, left, top, right, bottom, false);
    }

    public TextNodeItem(String text, int left, int top, int right, int bottom, boolean rtl) {
        this.text = text;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.rtl = rtl;
    }
}
