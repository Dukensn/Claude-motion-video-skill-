# Setup

`bash SKILL/scripts/setup.sh` checks everything and prints `READY`. What it needs:

| Tool | Why | Install |
| --- | --- | --- |
| Node.js 18+ (22+ recommended) | HyperFrames CLI, Playwright | nodejs.org |
| HyperFrames CLI 0.8.193 | renders the HTML film to MP4 | used through `npx --yes hyperframes@0.8.193` (no install) |
| Playwright + Chromium | stills, thumbnails, events export | `npm i -g playwright && npx playwright install chromium`; scripts set `NODE_PATH=$(npm root -g)` |
| Python 3.10+ with `mido`, `numpy` | score and mix | `pip install mido numpy` |
| FluidSynth | plays the MIDI with real samples | `apt install fluidsynth` · `brew install fluid-synth` · Windows: fluidsynth releases on GitHub |
| FluidR3_GM.sf2 | the sampled instruments | `apt install fluid-soundfont-gm`, or setup.sh downloads it to `~/.soundfonts/`; or set `SF2=/path/to/file.sf2` |
| ffmpeg | loudness, encoding, contact sheets | `apt install ffmpeg` · `brew install ffmpeg` · `winget install ffmpeg` |

Windows: run the scripts in Git Bash or WSL (WSL recommended).

Cloud sandboxes (Claude Code on the web): if `apt-get install` fails, run `apt-get update` first. Some hosts block stock-media sites — that is fine, nothing here downloads media.

Render time: about 2× real time per 4 workers on a laptop CPU (a 4-minute film ≈ 10–20 min). `WORKERS=8 bash render.sh …` on bigger machines.
