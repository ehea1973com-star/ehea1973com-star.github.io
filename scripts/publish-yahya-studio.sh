#!/usr/bin/env bash
set -euo pipefail

ANDROID_DIR="/storage/internal_new/project/YahyaStudio"
SITE_DIR="/storage/internal_new/project/YahyaSystemBuilder/live-site"
DOWNLOAD_DIR="/host-rootfs/storage/emulated/0/Download"
SITE_REMOTE="ssh://git@ssh.github.com:443/ehea1973com-star/ehea1973com-star.github.io.git"
SSH_KEY="/data/user/0/com.m4coding.ide/cache/opencode/yahya_publish_ed25519"
GIT_SSH="ssh -i $SSH_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

VER="${1:-}"
if [[ $# -gt 0 ]]; then shift; fi
DO_COMMIT=0
DO_PUSH=0
for arg in "$@"; do
  case "$arg" in
    --commit) DO_COMMIT=1 ;;
    --push) DO_PUSH=1 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done
if [[ -z "$VER" ]]; then
  echo "Usage: $0 <version> [--commit] [--push]"
  exit 1
fi
if [[ "$DO_PUSH" == "1" && "$DO_COMMIT" == "0" ]]; then
  echo "--push needs --commit"
  exit 1
fi

CODE="${VER##*.}"
APK_NAME="com.yahya.studio-v${VER}.apk"

GIT_SSH_COMMAND="$GIT_SSH" git -C "$SITE_DIR" fetch "$SITE_REMOTE" main
git -C "$SITE_DIR" rebase FETCH_HEAD

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
SW="$(date -u +%Y%m%d-%H%M)"

perl -0pi -e "s/var SW_VERSION = \"[^\"]+\";/var SW_VERSION = \"$SW\";/" "$SITE_DIR/sw.js"

perl -ni -e 'print unless /  com\.yahya\.studio-v[0-9.]+\.apk$/' "$SITE_DIR/apps/SHA256SUMS.txt"
printf '%s  %s\n' "$HASH" "$APK_NAME" >> "$SITE_DIR/apps/SHA256SUMS.txt"

VER="$VER" HASH="$HASH" SIZE="$SIZE" APK_NAME="$APK_NAME" NOW="$NOW" perl -0pi -e '
my $s = $_;
my $p = index($s, "com.yahya.studio");
die "manifest entry not found\n" if $p < 0;
my $start = rindex($s, "{", $p);
my $end = index($s, "}", $p);
die "manifest entry bounds not found\n" if $start < 0 || $end < 0;
my $line_start = rindex($s, "\n", $start) + 1;
my $indent = substr($s, $line_start, $start - $line_start);
my $ki = $indent . "  ";
my $sep = index($s, "\"package\":") >= 0 ? ": " : " : ";
my $kv = sub {
  my ($k, $v, $q) = @_;
  return $ki . "\"" . $k . "\"" . $sep . ($q ? "\"" . $v . "\"" : $v);
};
my $obj = $indent . "{\n";
$obj .= $kv->("category", "tools", 1) . ",\n";
$obj .= $kv->("description", "استوديو يحيى: محرر فيديو وصور وصوت، قوالب جاهزة، ضاغط فيديو، ثيمات خشبية وبلورية، وحفظ مباشر في المعرض.", 1) . ",\n";
$obj .= $kv->("filename", $ENV{APK_NAME}, 1) . ",\n";
$obj .= $kv->("name", "استوديو يحيى", 1) . ",\n";
$obj .= $kv->("package", "com.yahya.studio", 1) . ",\n";
$obj .= $kv->("sha256", $ENV{HASH}, 1) . ",\n";
$obj .= $kv->("size", $ENV{SIZE}, 0) . ",\n";
$obj .= $kv->("updatedAt", $ENV{NOW}, 1) . ",\n";
$obj .= $kv->("version", $ENV{VER}, 1) . "\n";
$obj .= $indent . "}";
substr($s, $start, $end - $start + 1, $obj);
$_ = $s;
' "$SITE_DIR/apps/manifest.json"

perl -MJSON::PP -0777 -e 'decode_json(<>); print "manifest OK\n";' "$SITE_DIR/apps/manifest.json"
(cd "$SITE_DIR/apps" && sha256sum -c SHA256SUMS.txt 2>&1 | grep "$APK_NAME: OK")

if [[ "$DO_COMMIT" == "1" ]]; then
  git -C "$SITE_DIR" add "apps/$APK_NAME" apps/manifest.json apps/SHA256SUMS.txt sw.js
  git -C "$SITE_DIR" commit -m "Publish Yahya Studio v$VER"
fi

if [[ "$DO_PUSH" == "1" ]]; then
  GIT_SSH_COMMAND="$GIT_SSH" git -C "$SITE_DIR" push "$SITE_REMOTE" main
  git -C "$SITE_DIR" update-ref refs/remotes/origin/main HEAD
fi

echo "Ready: $DOWNLOAD_DIR/YahyaStudio-v${VER}-publish.apk"
