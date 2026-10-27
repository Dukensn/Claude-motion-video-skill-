#!/usr/bin/env bash
# usage: audio.sh <film-dir>
# [narration.json -> voice.py ->] score.py -> MIDI -> FluidSynth (sampled GM soundfont) -> mix.py (score + effects) -> loudness to -14 LUFS -> assets/audio/mix.wav
set -euo pipefail
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
D="$(cd "${1:?film dir}" && pwd)"
SF2="${SF2:-}"
for c in /usr/share/sounds/sf2/FluidR3_GM.sf2 /usr/share/soundfonts/FluidR3_GM.sf2 /opt/homebrew/share/soundfonts/FluidR3_GM.sf2 "$HOME/.soundfonts/FluidR3_GM.sf2"; do
  [ -z "$SF2" ] && [ -f "$c" ] && SF2="$c"
done
[ -n "$SF2" ] || { echo "FluidR3_GM.sf2 not found — run scripts/setup.sh or set SF2=/path/to/FluidR3_GM.sf2" >&2; exit 1; }
mkdir -p "$D/build" "$D/assets/audio"
# narrated or captioned films: voice clips + timeline first (the film's duration depends on it)
[ -f "$D/narration.json" ] && python3 "$D/tools/voice.py"
DUR=$(bash "$SKILL/scripts/sync-duration.sh" "$D")
python3 "$D/tools/score.py"
fluidsynth -ni -g 0.9 -r 48000 -R 1 -C 0 -F "$D/build/score.wav" "$SF2" "$D/build/score.mid" >/dev/null
node "$SKILL/scripts/events.cjs" "$D" "$D/build/events.json"
python3 "$D/tools/mix.py"
ffmpeg -loglevel error -y -i "$D/build/premix.wav" -t "$DUR" \
  -af "acompressor=threshold=-24dB:ratio=2.5:attack=20:release=400:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 "$D/assets/audio/mix.wav"
ffmpeg -hide_banner -nostats -i "$D/assets/audio/mix.wav" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" || true
echo "audio -> $D/assets/audio/mix.wav"
