#!/usr/bin/env bash
set -euo pipefail

ANDROID_DIR="/storage/internal_new/project/YahyaStudio"
SITE_DIR="/storage/internal_new/project/YahyaSystemBuilder/live-site"
DOWNLOAD_DIR="/host-rootfs/storage/emulated/0/Download"

VER="${1:-}"
DO_COMMIT=0
if [[ "${2:-}" == "--commit" ]]; then DO_COMMIT=1; fi
if [[ -z "$VER" ]]; then
  echo "Usage: $0 <version> [--commit]"
  exit 1
fi

CODE="${VER##*.}"
APK_NAME="com.yahya.studio-v${VER}.apk"

perl -0pi -e "s/versionCode\\s+\\d+/versionCode $CODE/; s/versionName\\s+\"[^\"]+\"/versionName \"$VER\"/" "$ANDROID_DIR/app/build.gradle"

(
  cd "$ANDROID_DIR"
  export JAVA_HOME=/opt/java/jdk1.8.0_212
  export PATH="$JAVA_HOME/bin:$PATH"
  /opt/gradle/gradle-6.1.1/bin/gradle --no-daemon assembleDebug -Pandroid.aapt2FromMavenOverride=/usr/lib/android-sdk/build-tools/debian/aapt2
)

SRC="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
cp "$SRC" "$DOWNLOAD_DIR/YahyaStudio-v${VER}-publish.apk"
cp "$SRC" "$DOWNLOAD_DIR/YahyaStudio-latest.apk"
cp "$SRC" "$SITE_DIR/apps/$APK_NAME"

HASH="$(sha256sum "$SRC" | awk '{print $1}')"
SIZE="$(stat -c '%s' "$SRC")"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

perl -ni -e 'print unless /  com\.yahya\.studio-v[0-9.]+\.apk$/' "$SITE_DIR/apps/SHA256SUMS.txt"
printf '%s  %s\n' "$HASH" "$APK_NAME" >> "$SITE_DIR/apps/SHA256SUMS.txt"

VER="$VER" HASH="$HASH" SIZE="$SIZE" APK_NAME="$APK_NAME" NOW="$NOW" perl -0pi -e '
my $s = $_;
my $p = index($s, "\"package\" : \"com.yahya.studio\"");
die "manifest entry not found\n" if $p < 0;
my $start = rindex($s, "{", $p);
my $end = index($s, "}", $p);
die "manifest entry bounds not found\n" if $start < 0 || $end < 0;
my $obj = "       {\n";
$obj .= "          \"category\" : \"tools\",\n";
$obj .= "          \"description\" : \"استوديو يحيى: محرر فيديو وصور وصوت، قوالب جاهزة، ضاغط فيديو، ثيمات خشبية وبلورية، وحفظ مباشر في المعرض.\",\n";
$obj .= "          \"filename\" : \"$ENV{APK_NAME}\",\n";
$obj .= "          \"name\" : \"استوديو يحيى\",\n";
$obj .= "          \"package\" : \"com.yahya.studio\",\n";
$obj .= "          \"sha256\" : \"$ENV{HASH}\",\n";
$obj .= "          \"size\" : $ENV{SIZE},\n";
$obj .= "          \"updatedAt\" : \"$ENV{NOW}\",\n";
$obj .= "          \"version\" : \"$ENV{VER}\"\n";
$obj .= "       }";
substr($s, $start, $end - $start + 1, $obj);
$_ = $s;
' "$SITE_DIR/apps/manifest.json"

perl -MJSON::PP -0777 -e 'decode_json(<>); print "manifest OK\n";' "$SITE_DIR/apps/manifest.json"
(cd "$SITE_DIR/apps" && sha256sum -c SHA256SUMS.txt 2>&1 | grep "$APK_NAME: OK")

if [[ "$DO_COMMIT" == "1" ]]; then
  git -C "$SITE_DIR" add "apps/$APK_NAME" apps/manifest.json apps/SHA256SUMS.txt
  git -C "$SITE_DIR" commit -m "Publish Yahya Studio v$VER"
fi

echo "Ready: $DOWNLOAD_DIR/YahyaStudio-v${VER}-publish.apk"
