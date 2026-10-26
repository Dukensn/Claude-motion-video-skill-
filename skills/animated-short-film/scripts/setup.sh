#!/usr/bin/env bash
# Checks (and where possible installs) what the pipeline needs: node 18+, python3 + mido + numpy, ffmpeg, fluidsynth,
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
python3 -c "import mido, numpy" 2>/dev/null || python3 -m pip install -q --user mido numpy 2>/dev/null || python3 -m pip install -q --break-system-packages mido numpy
python3 -c "import mido, numpy" 2>/dev/null && echo "✓ python: mido numpy" || { echo "✗ python packages: pip install mido numpy"; ok=0; }
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
[ $ok = 1 ] && echo "READY" || { echo "NOT READY — fix the ✗ lines above"; exit 1; }
