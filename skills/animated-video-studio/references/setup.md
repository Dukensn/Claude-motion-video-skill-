# Setup

`bash SKILL/scripts/setup.sh` checks everything and prints `READY`. Claude runs it, not the student; the student should never have to install or configure anything by hand. What it needs:

| Tool | Why | Install |
| --- | --- | --- |
| Node.js 18+ (22+ recommended) | HyperFrames CLI, Playwright | nodejs.org |
| HyperFrames CLI 0.8.193 | renders the HTML film to MP4 | used through `npx --yes hyperframes@0.8.193` (no install) |
| Playwright + Chromium | stills, thumbnails, events export | `npm i -g playwright && npx playwright install chromium`; scripts set `NODE_PATH=$(npm root -g)` |
| Python 3.10+ with `mido`, `numpy`, `scipy` | score and mix | `pip install mido numpy scipy` |
| `sherpa-onnx` + Parakeet model (~490 MB, GitHub release) | expressive Gemini voice: word-exact line cutting. Installed automatically the first time a film uses a Gemini voice; the voice itself needs only the student's API key (`voice.md`) |
| `kokoro-onnx`, `soundfile` + the Kokoro-82M model | local voice-over | `pip install kokoro-onnx soundfile`; the model (~330 MB) downloads on first `npx hyperframes@0.8.193 tts` |
| FluidSynth | plays the MIDI with real samples | `apt install fluidsynth` · `brew install fluid-synth` · Windows: fluidsynth releases on GitHub |
| FluidR3_GM.sf2 | the sampled instruments | `apt install fluid-soundfont-gm`, or setup.sh downloads it to `~/.soundfonts/`; or set `SF2=/path/to/file.sf2` |
| yt-dlp | study reference videos from a link (`fetch-reference.sh`) | `pip install yt-dlp` (setup.sh does it) |
| ffmpeg | loudness, encoding, contact sheets | `apt install ffmpeg` · `brew install ffmpeg` · `winget install ffmpeg` |

Windows: run the scripts in Git Bash or WSL (WSL recommended).

Cloud sandboxes (Claude Code on the web): if `apt-get install` fails, run `apt-get update` first. Some hosts block stock-media sites — that is fine, nothing here downloads media.

Render time: about 2× real time per 4 workers on a laptop CPU (a 4-minute film ≈ 10–20 min). `WORKERS=8 bash render.sh …` on bigger machines.

Links: HyperFrames https://github.com/heygen-com/hyperframes · GSAP https://gsap.com · Kokoro-82M https://huggingface.co/hexgrad/Kokoro-82M · kokoro-onnx https://github.com/thewh1teagle/kokoro-onnx · FluidSynth https://www.fluidsynth.org · Playwright https://playwright.dev
