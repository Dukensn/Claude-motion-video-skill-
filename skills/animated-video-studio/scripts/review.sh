#!/usr/bin/env bash
# usage: review.sh <film-dir>   — measure your own video like a reference (attention numbers + contact sheets)
# Uses the rendered MP4 if it exists, otherwise renders a fast low-res preview of the stills.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; D="$(cd "${1:?film dir}" && pwd)"; SLUG="$(basename "$D")"
MP4="$D/renders/$SLUG.mp4"
if [ ! -f "$MP4" ]; then echo "no render yet — run render.sh first (or review the stills with sheet.sh)"; exit 1; fi
mkdir -p "$D/build/review"; cp "$MP4" "$D/build/review/video.mp4"
python3 "$SKILL/scripts/analyze-reference.py" "$D/build/review/video.mp4" | sed -n 1,12p
echo "contact sheets -> $D/build/review/sheet-*.png — now write films/$SLUG/REVIEW.md (references/review.md)"
