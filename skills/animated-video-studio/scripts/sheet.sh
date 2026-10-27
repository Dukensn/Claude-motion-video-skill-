#!/usr/bin/env bash
# usage: sheet.sh <film-dir> <out.png> t1 t2 ... (up to 12 times)  -> one contact sheet image to review shots at a glance
set -euo pipefail
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
D="${1:?film dir}"; OUT="${2:?out png}"; shift 2
TMP="$(mktemp -d)"
node "$SKILL/scripts/still.cjs" "$D" "$TMP" "$@"
N=$#; COLS=$(( N < 3 ? N : 3 )); ROWS=$(( (N + COLS - 1) / COLS ))
IFS=, read -r IW IH < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$(ls "$TMP"/s*.png | head -1)")
CW=$(( IW >= IH ? 640 : 360 )); CH=$(( CW * IH / IW / 2 * 2 ))
LAYOUT=""; i=0
for ((r=0; r<ROWS; r++)); do for ((c=0; c<COLS; c++)); do [ $i -lt $N ] && LAYOUT+="${LAYOUT:+|}$((c*CW))_$((r*CH))"; i=$((i+1)); done; done
ffmpeg -loglevel error -y $(for f in "$TMP"/s*.png; do printf -- '-i %s ' "$f"; done) \
  -filter_complex "$(for ((k=0;k<N;k++)); do printf '[%d]scale=%d:%d[s%d];' $k $CW $CH $k; done)$(for ((k=0;k<N;k++)); do printf '[s%d]' $k; done)xstack=inputs=$N:layout=$LAYOUT:fill=black" "$OUT"
rm -rf "$TMP"; echo "sheet -> $OUT"
