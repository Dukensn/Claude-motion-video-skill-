# Atelye AI · 9:16 ad video (HyperFrames)

This repo is a finished, re-renderable ad for the **Atelye AI** workshop (Saturday 5 December 2026, Lise Anacaona, Léogâne, 10:00–16:00, WhatsApp +509 3864 9724). The owner is Dukens (Haitian Creole speaker, also French). Talk with him in Creole (or French if he writes French), keep messages short (he is on a phone), send finished videos with the file-sending tool.

## How it is built
- `src/index.src.html` — the HyperFrames composition (1080×1920, 30 fps, 114.5 s, one GSAP timeline registered as `window.__timelines["main"]`). It has placeholders (`__CAPS__`, `__HL__`, `__ROW1__`, `__ROW2__`, `__NET__`, `__CROWD__`, `__BURST__`, `__BELL__`, `__CLASS__`) that `tools/build.py` fills to produce `index.html`. Always edit `src/index.src.html`, then run `python3 tools/build.py`.
- Scenes (times in seconds on the cleaned voice): A hook 0–5.2 (three AI videos: stickman, feyton, motion), B YouTube 5.1, C channel proof 7.55, D one-video proof 11.65, E "Poutan" 17.05, F animated workshop 23.4, G date/place 28.15, H video wall 34.25, I three kinds 38.8, J1 Facebook Ads 43.45, J2 his face as a Facebook ad + reach to 1 million 48.1, K1 digital product 57.9, K2 made once/sold many 66.35, L skills & resources 75.25, M debit card 82.55, N 7 days Claude Pro 87.3, O WhatsApp group 95.45, P his face + CTA 102.25, Q end card 112.55.
- Voice: `in/voix.m4a` → `tools/cut.py` (drops a repeated Facebook-Ads take, cleans) → `tools/voice.sh` (brighter, livelier EQ/compression) → `assets/audio/voice.wav`.
- Captions: `tools/caps.py` → `build/caps.json` (Haitian Creole text written by hand on the cleaned timeline; `build/tr.json` is the raw Whisper transcript).
- Music: `in/music-funk.mp3` (his choice) looped by `tools/music.sh`, kept ~16–21 dB under the voice with ducking.
- Sound effects: synthesized in `tools/mix.py` (`effects()`), each tied to an on-screen action: whoosh = scene change, pop = card lands, click = UI action, ticks = counters, ding = messages/notifications, soft felt thud = stamps (GRATIS, 1 MILYON, PLAS LIMITE). No impacts/booms/buzzers/glitches.
- Short version (~65 s, starts at the invitation "n òganize yon gwo atelye"): `tools/short.py <long.mp4>` cuts the long render at voice pauses, rebuilds voice+effects on the cuts, runs the music continuously. Needs `build/sfx.npy` from `tools/stems.py`.
- Everything at once: `sh tools/render-all.sh` (needs ffmpeg, Python with numpy/scipy, Node + `npx hyperframes`, Chromium).

## Media
- `in/v1.mp4`, `in/v2.mp4`, `in/v3.mp4`: Dukens on camera. Encoded to `assets/video/face1..3.mp4` (1080×1920). Only `face2` (end, CTA) and the Facebook-ad mock use his face now.
- `in/ai-videos/`: his AI videos. Clips in `assets/video/`: `c-feyton.mp4` (dennye-tras 1.5–10.5 s), `c-banan.mp4` (bananito 2–11 s), `c-motion.mp4` (deepseek 15–24 s), `c-motiv.mp4` (motivasyon 1–10 s); stills `assets/img/n1..n10.jpg`.
- `in/reference/atelye-dijital-egzanp.mp4`: a style reference he sent (clean UI cards). He liked the cards but found it too white/empty.
- Real proof only: channel 8 216 087 views (since 27 Sept), video "DISCIPLINE" 4.8 M views in under 4 weeks (`assets/img/proof-dayone.jpg`, `discipline.jpg`).

## His preferences (follow them)
- Dark background everywhere. Coral accent `#e2553f`. **No yellow** in text.
- His face only at the end (not in the opening). The opening shows his AI videos (stickman, feyton, motion).
- When he says "zouti" he means the workshop's **skills, resources, PDFs and the apps made for the students** — not third-party apps.
- What the voice says must be shown on screen (e.g. "n òganize yon gwo atelye" → an animated workshop).
- Labels must never cover the videos. Every screen filled, motion every ~2 s, smooth not noisy.
- Numbers like "1 MILYON", "×50 000", the Meta Ads table, are illustrations of what he says, not real results — say so if asked.
- Lips are not synced on his face clips (they were filmed separately from the voice).
