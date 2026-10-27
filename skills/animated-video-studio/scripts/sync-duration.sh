#!/usr/bin/env bash
# usage: sync-duration.sh <film-dir>  — writes FILM.DURATION (and the frame size) into index.html's data-* attributes
set -euo pipefail
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
D="${1:?film dir}"
read -r DUR FW FH < <(node "$SKILL/scripts/duration.cjs" "$D")
sed -i.bak -E "s/data-duration=\"[0-9.]+\"/data-duration=\"$DUR\"/g; s/data-width=\"[0-9]+\"/data-width=\"$FW\"/; s/data-height=\"[0-9]+\"/data-height=\"$FH\"/; s/(<canvas id=\"film\"[^>]*) width=\"[0-9]+\" height=\"[0-9]+\"/\1 width=\"$FW\" height=\"$FH\"/; s/content=\"width=[0-9]+, height=[0-9]+\"/content=\"width=$FW, height=$FH\"/; s/html, body \{ width: [0-9]+px; height: [0-9]+px;/html, body { width: ${FW}px; height: ${FH}px;/; s/#film \{ position: absolute; inset: 0; width: [0-9]+px; height: [0-9]+px; \}/#film { position: absolute; inset: 0; width: ${FW}px; height: ${FH}px; }/" "$D/index.html" && rm -f "$D/index.html.bak"
echo "$DUR"
