package com.yahya.universalcopy;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;

@RequiresApi(api = Build.VERSION_CODES.N)
public class CopyTileService extends TileService {

    @Override
    public void onClick() {
        super.onClick();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
            try {
                Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivityAndCollapse(i);
            } catch (Exception e) {
                try { startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception ignored) {}
            }
            return;
        }
        Intent i = new Intent(this, OverlayService.class);
        i.setAction(OverlayService.ACTION_START);
        try {
            ContextCompat.startForegroundService(this, i);
            Toast.makeText(this, R.string.notif_overlay_title, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, R.string.toast_overlay_required, Toast.LENGTH_SHORT).show();
        }
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_ACTIVE);
            tile.updateTile();
        }
    }

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_INACTIVE);
            tile.updateTile();
        }
    }
}
