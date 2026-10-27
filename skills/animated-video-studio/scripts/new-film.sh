#!/usr/bin/env bash
# usage: new-film.sh <stickman|bean|silhouette> <slug> ["TITLE."] [films-dir=./films]
# Copies a style template into <films-dir>/<slug>, ready to edit (film.js, tools/score.py, tools/mix.py, thumb/thumb.html).
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
STYLE="${1:?style: stickman, bean or silhouette}"; SLUG="${2:?slug, e.g. the-last-letter}"; TITLE="${3:-$SLUG}"; ROOT="${4:-./films}"
SRC="$SKILL/templates/$STYLE"; DST="$ROOT/$SLUG"
[ -d "$SRC" ] || { echo "unknown style: $STYLE (stickman | bean | silhouette)" >&2; exit 1; }
[ -e "$DST" ] && { echo "$DST already exists — pick another slug or delete it first" >&2; exit 1; }
mkdir -p "$ROOT"
cp -R "$SRC" "$DST"
cp "$SKILL/templates/common/scorelib.py" "$SKILL/templates/common/mixlib.py" "$SKILL/templates/common/voice.py" "$DST/tools/"
mkdir -p "$DST/thumb" "$DST/build" "$DST/assets/audio" "$DST/renders"
cp "$SKILL/templates/thumbnail/thumbs.js" "$SKILL/templates/thumbnail/LilitaOne.ttf" "$DST/thumb/"
cp "$SKILL/templates/thumbnail/thumb-$STYLE.html" "$DST/thumb/thumb.html"
TITLE_ESC=$(printf '%s' "$TITLE" | sed 's/[&/\]/\\&/g')
sed -i.bak "s/__TITLE__/$TITLE_ESC/" "$DST/index.html" && rm -f "$DST/index.html.bak"
sed -i.bak "s/\"film\"/\"$SLUG\"/g" "$DST/meta.json" "$DST/package.json" && rm -f "$DST/meta.json.bak" "$DST/package.json.bak"
printf 'build/\nrenders/\nassets/audio/\n.hyperframes/\n*.mp4\n' > "$DST/.gitignore"
echo "created $DST ($STYLE). Edit assets/js/film.js, tools/score.py, tools/mix.py, thumb/thumb.html."
