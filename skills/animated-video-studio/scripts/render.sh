#!/usr/bin/env bash
# usage: render.sh <film-dir> [out.mp4]
# audio (if missing) -> hyperframes check -> render -> YouTube-ready H.264/AAC encode.
set -euo pipefail
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
D="$(cd "${1:?film dir}" && pwd)"
SLUG="$(basename "$D")"; OUT="${2:-$D/renders/${SLUG}.mp4}"
HF="npx --yes hyperframes@0.8.193"
bash "$SKILL/scripts/sync-duration.sh" "$D" >/dev/null
[ -f "$D/assets/audio/mix.wav" ] || bash "$SKILL/scripts/audio.sh" "$D"
mkdir -p "$D/renders"
(cd "$D" && $HF check --json > build/check.json) || { echo "hyperframes check failed — see $D/build/check.json" >&2; exit 1; }
(cd "$D" && $HF render -w "${WORKERS:-4}" -q delivery -o "renders/raw.mp4")
ffmpeg -loglevel error -y -i "$D/renders/raw.mp4" -c:v libx264 -crf 19 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
rm -f "$D/renders/raw.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact "$OUT"
echo "video -> $OUT"
