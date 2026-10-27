#!/usr/bin/env bash
# usage: [FORMAT=short] new-film.sh <style> <slug> ["TITLE."] [films-dir=./films]
# styles: stickman bean silhouette (base engines) · cinematic digital sketch cartoon moral (templates/styles/, built on a base)
# Copies a working template (a short demo) into <films-dir>/<slug>, ready to edit (film.js, tools/score.py, tools/mix.py, thumb/thumb.html).
# FORMAT=short makes a vertical 1080x1920 Short (the demo film.js must then be rewritten for the tall frame).
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
STYLE="${1:?style: stickman bean silhouette cinematic digital sketch cartoon moral}"; SLUG="${2:?slug, e.g. the-last-letter}"; TITLE="${3:-$SLUG}"; ROOT="${4:-./films}"
OVER=""
if [ -d "$SKILL/templates/styles/$STYLE" ]; then OVER="$SKILL/templates/styles/$STYLE"; BASE="$(cat "$OVER/BASE")"; else BASE="$STYLE"; fi
SRC="$SKILL/templates/$BASE"; DST="$ROOT/$SLUG"
[ -d "$SRC" ] || { echo "unknown style: $STYLE (stickman bean silhouette cinematic digital sketch cartoon moral)" >&2; exit 1; }
[ -e "$DST" ] && { echo "$DST already exists — pick another slug or delete it first" >&2; exit 1; }
mkdir -p "$ROOT"
cp -R "$SRC" "$DST"
cp "$SKILL/templates/common/vfx.js" "$DST/assets/js/"
cp "$SKILL/templates/common/scorelib.py" "$SKILL/templates/common/mixlib.py" "$SKILL/templates/common/voice.py" "$SKILL/templates/common/gemini_tts.py" "$DST/tools/"
mkdir -p "$DST/thumb" "$DST/build" "$DST/assets/audio" "$DST/renders"
cp "$SKILL/templates/thumbnail/thumbs.js" "$SKILL/templates/thumbnail/LilitaOne.ttf" "$DST/thumb/"
if [ -n "$OVER" ]; then
  # the style's engine, demo film, narration, score, mix and thumbnail page replace the base ones
  (cd "$OVER" && find . -type f ! -name BASE ! -name SHORT ! -name thumb.html -print) | while read -r f; do mkdir -p "$DST/$(dirname "$f")"; cp "$OVER/$f" "$DST/$f"; done
  cp "$OVER/thumb.html" "$DST/thumb/thumb.html"
else
  cp "$SKILL/templates/thumbnail/thumb-$STYLE.html" "$DST/thumb/thumb.html"
fi
[ -n "$OVER" ] && [ -f "$OVER/SHORT" ] && FORMAT="${FORMAT:-short}"   # this style's demo is a vertical Short
if [ "${FORMAT:-}" = "short" ]; then
  sed -i.bak 's/window.FRAME = { W: 1920, H: 1080 }/window.FRAME = { W: 1080, H: 1920 }/' "$DST/index.html" && rm -f "$DST/index.html.bak"
fi
TITLE_ESC=$(printf '%s' "$TITLE" | sed 's/[&/\]/\\&/g')
sed -i.bak "s/__TITLE__/$TITLE_ESC/" "$DST/index.html" && rm -f "$DST/index.html.bak"
sed -i.bak "s/\"film\"/\"$SLUG\"/g" "$DST/meta.json" "$DST/package.json" && rm -f "$DST/meta.json.bak" "$DST/package.json.bak"
printf 'build/\nrenders/\nassets/audio/\n.hyperframes/\n*.mp4\n' > "$DST/.gitignore"
echo "created $DST ($STYLE${OVER:+ on the $BASE engine}${FORMAT:+, $FORMAT}). Edit assets/js/film.js, tools/score.py, tools/mix.py, thumb/thumb.html."
