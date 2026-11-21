package com.yahya.universalcopy;

public class OcrSegment {
    public String text;
    public int left;
    public int top;
    public int right;
    public int bottom;

    public OcrSegment(String text, int left, int top, int right, int bottom) {
        this.text = text;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }
}
