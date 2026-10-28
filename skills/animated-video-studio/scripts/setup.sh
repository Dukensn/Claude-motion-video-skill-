#!/usr/bin/env bash
# Checks (and where possible installs) what the pipeline needs: node 18+, python3 + mido numpy scipy kokoro-onnx, ffmpeg, fluidsynth,
# the FluidR3_GM soundfont, Playwright Chromium, and the HyperFrames CLI. Safe to run again.
set -uo pipefail
ok=1
have() { command -v "$1" >/dev/null 2>&1; }
need() { if have "$1"; then echo "✓ $1"; else echo "✗ $1 missing — $2"; ok=0; fi; }
PM=""; have apt-get && PM=apt; have brew && PM=brew
install() { # best-effort system install
  case "$PM" in
    apt) (sudo -n true 2>/dev/null && S=sudo || S=""; $S apt-get update -qq && $S apt-get install -y -qq "$@") ;;
    brew) brew install "$@" ;;
    *) return 1 ;;
  esac
}
have ffmpeg || install ffmpeg >/dev/null 2>&1
have fluidsynth || install fluidsynth >/dev/null 2>&1
need node "install Node.js 18+ from nodejs.org"
need python3 "install Python 3.10+"
need ffmpeg "apt install ffmpeg | brew install ffmpeg | winget install ffmpeg"
need fluidsynth "apt install fluidsynth | brew install fluid-synth"
PY="mido numpy scipy kokoro-onnx soundfile yt-dlp"
python3 -c "import mido, numpy, scipy, kokoro_onnx, soundfile, yt_dlp" 2>/dev/null || python3 -m pip install -q --user $PY 2>/dev/null || python3 -m pip install -q --break-system-packages $PY
python3 -c "import mido, numpy, scipy, kokoro_onnx, soundfile, yt_dlp" 2>/dev/null && echo "✓ python: $PY" || { echo "✗ python packages: pip install $PY"; ok=0; }
SF=""
for c in /usr/share/sounds/sf2/FluidR3_GM.sf2 /usr/share/soundfonts/FluidR3_GM.sf2 /opt/homebrew/share/soundfonts/FluidR3_GM.sf2 "$HOME/.soundfonts/FluidR3_GM.sf2"; do [ -f "$c" ] && SF="$c" && break; done
if [ -z "$SF" ]; then
  [ "$PM" = apt ] && install fluid-soundfont-gm >/dev/null 2>&1
  [ -f /usr/share/sounds/sf2/FluidR3_GM.sf2 ] && SF=/usr/share/sounds/sf2/FluidR3_GM.sf2
fi
if [ -z "$SF" ]; then
  mkdir -p "$HOME/.soundfonts"
  curl -fsSL -o "$HOME/.soundfonts/FluidR3_GM.sf2" "https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2" 2>/dev/null && SF="$HOME/.soundfonts/FluidR3_GM.sf2"
fi
[ -n "$SF" ] && echo "✓ soundfont: $SF" || { echo "✗ FluidR3_GM.sf2 — download it and set SF2=/path/to/FluidR3_GM.sf2"; ok=0; }
node -e "require('playwright')" 2>/dev/null || npm install -g playwright >/dev/null 2>&1
node -e "require('playwright').chromium.launch().then(b=>b.close())" 2>/dev/null && echo "✓ playwright chromium" || {
  npx --yes playwright install chromium >/dev/null 2>&1
  node -e "require('playwright').chromium.launch().then(b=>b.close())" 2>/dev/null && echo "✓ playwright chromium" || { echo "✗ playwright: npm i -g playwright && npx playwright install chromium (and set NODE_PATH=\$(npm root -g))"; ok=0; }
}
npx --yes hyperframes@0.8.193 --version >/dev/null 2>&1 && echo "✓ hyperframes 0.8.193" || { echo "✗ hyperframes CLI (npx hyperframes@0.8.193) could not run"; ok=0; }
# local voice model (Kokoro-82M, ~330 MB, once)
if [ -f "$HOME/.cache/hyperframes/tts/models/kokoro-v1.0.onnx" ]; then echo "✓ voice model"; else
  T="$(mktemp -d)"; (cd "$T" && npx --yes hyperframes@0.8.193 tts "Ready." -o ready.wav >/dev/null 2>&1) && echo "✓ voice model downloaded" || echo "! voice model not downloaded yet (only needed for narrated videos)"; rm -rf "$T"
fi
# optional expressive voice: only report whether the student set their own key (never print it)
if [ -n "${GEMINI_API_KEY:-}" ] || [ -s "$HOME/.config/video-studio/gemini_key" ]; then echo "✓ gemini key (expressive voice available)"; else echo "· gemini key not set — natural voice (Kokoro) by default; see references/menu.md"; fi
[ $ok = 1 ] && echo "READY" || { echo "NOT READY — fix the ✗ lines above"; exit 1; }
