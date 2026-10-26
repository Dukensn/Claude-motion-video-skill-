#!/usr/bin/env bash
# usage: fetch-reference.sh <youtube-or-video-url | local-video-file> [out-dir=./reference-videos]
# Downloads a reference video (480p max) with its subtitles, then runs analyze-reference.py on it.
# The student does nothing: yt-dlp is installed automatically. Exit code 3 = this machine cannot reach the site
# (e.g. a cloud session whose network blocks YouTube) — then ask the student to send the video file in the chat.
set -uo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:?url or file}"; ROOT="${2:-./reference-videos}"
mkdir -p "$ROOT"
if [ -f "$SRC" ]; then
  ID="$(basename "${SRC%.*}" | tr -c 'A-Za-z0-9_-' '_')"; D="$ROOT/$ID"; mkdir -p "$D"
  ffmpeg -loglevel error -y -i "$SRC" -vf "scale=-2:'min(480,ih)'" -c:v libx264 -preset veryfast -crf 26 -c:a aac "$D/video.mp4" || exit 1
  python3 "$SKILL/scripts/analyze-reference.py" "$D/video.mp4"; exit $?
fi
YTDLP=(yt-dlp)
if ! command -v yt-dlp >/dev/null 2>&1; then
  python3 -m pip install -q --user -U yt-dlp >/dev/null 2>&1 || python3 -m pip install -q --break-system-packages -U yt-dlp >/dev/null 2>&1
  command -v yt-dlp >/dev/null 2>&1 || YTDLP=(python3 -m yt_dlp)
fi
ID="$("${YTDLP[@]}" --no-warnings --skip-download --print id "$SRC" 2>"$ROOT/.err")"
if [ -z "$ID" ]; then
  if grep -qiE "proxy|tunnel|resolve|getaddrinfo|network is unreachable|timed out|403" "$ROOT/.err"; then
    echo "NETWORK_BLOCKED: this machine cannot reach the video site. Ask the student to send the video file in the chat (drag and drop), then run: fetch-reference.sh <that file>" >&2; exit 3
  fi
  cat "$ROOT/.err" >&2; exit 1
fi
D="$ROOT/$ID"; mkdir -p "$D"
"${YTDLP[@]}" --no-warnings -q -f "bv*[height<=480][ext=mp4]+ba[ext=m4a]/b[height<=480]/b" --merge-output-format mp4 \
  --write-subs --write-auto-subs --sub-langs "en,en-orig,fr,ht,es" --sub-format vtt --convert-subs vtt \
  --write-info-json -o "$D/video.%(ext)s" "$SRC" || exit 1
SUB="$(ls "$D"/video.*.vtt 2>/dev/null | head -1)"
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print('Title:', d.get('title')); print('Channel:', d.get('channel')); print('Views:', d.get('view_count'))" "$D/video.info.json" 2>/dev/null
python3 "$SKILL/scripts/analyze-reference.py" "$D/video.mp4" ${SUB:+"$SUB"}
