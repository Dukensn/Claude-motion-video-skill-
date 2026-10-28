#!/usr/bin/env bash
# usage: menu.sh [films-dir=./films]
# Prepares films/_menu/ — a scratch workspace to DRAW a fresh menu: one invented poster frame per proposed video.
#   films/_menu/stick/thumb/thumb.html  — stickman engine family (CINE, DIGI, SKETCH, TOON, SCENE, VFX…)
#   films/_menu/bean/thumb/thumb.html   — bean engine (C, Pr, MORAL, SCENE, VFX…)
# Write T.p1(), T.p2()… in those pages, render each with thumb.cjs, list them in films/_menu/menu.json, then board.py.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; ROOT="${1:-./films}"; M="$ROOT/_menu"
mkdir -p "$M/out"
for base in stick bean; do
  src=$([ $base = stick ] && echo stickman || echo bean)
  mkdir -p "$M/$base/thumb" "$M/$base/assets/js"
  cp -R "$SKILL/templates/$src/assets/fonts" "$M/$base/assets/"
  cp "$SKILL/templates/$src/assets/js/"*.js "$M/$base/assets/js/"
  cp "$SKILL/templates/common/vfx.js" "$SKILL/templates/common/scenery.js" "$M/$base/assets/js/"
  cp "$SKILL/templates/thumbnail/thumbs.js" "$SKILL/templates/thumbnail/LilitaOne.ttf" "$M/$base/thumb/"
  [ -f "$M/$base/thumb/thumb.html" ] || cp "$SKILL/templates/menu/$base.html" "$M/$base/thumb/thumb.html"
done
for s in cinematic digital sketch cartoon; do cp "$SKILL/templates/styles/$s/assets/js/style.js" "$M/stick/assets/js/$s.js"; done
cp "$SKILL/templates/styles/moral/assets/js/style.js" "$M/bean/assets/js/moral.js"
cp "$SKILL/templates/stickman/assets/fonts/Inter.ttf" "$M/bean/assets/fonts/" 2>/dev/null || true
echo "menu workspace -> $M (edit $M/stick/thumb/thumb.html and $M/bean/thumb/thumb.html)"
