# Voice-over

Voices are generated locally with Kokoro-82M (through the HyperFrames CLI model cache and `kokoro-onnx`): free, offline after the first download, good quality, no account.

- `narration.json` → `python3 films/<slug>/tools/voice.py` (or `scripts/audio.sh`, which runs it) → `build/voice/*.wav`, `build/timeline.json`, `assets/js/timeline.js`.
- Only changed lines are re-synthesised. The film's duration = last line end + `tail`.
- Settings: `voice`, `speed` (0.9 calm documentary · 1.0 default · 1.1 energetic What-if), `start` (silence before the first line), `gap` (pause between lines), per-line `pause`, `hide`, `voice`.

| Language | Voices |
| --- | --- |
| English (US) | am_michael (warm male, documentary), am_adam, af_heart (warm female), af_nova, af_sky |
| English (UK) | bm_george, bf_emma, bf_isabella |
| French | ff_siwis |
| Spanish | ef_dora |
| Japanese / Chinese | jf_alpha / zf_xiaobei |

Run `npx hyperframes@0.8.193 tts --list` for the current list.

**Haitian Creole** has no voice. Two good options: (1) narrate in French or English and show Creole subtitles — give each line a `"caption"` in Creole; the voice reads `text`, the screen shows `caption`; (2) a silent film with Creole captions (`"voice": null`).

Write for the ear: short sentences, numbers as words when they're spoken oddly ("about a third", "two thousand years"), avoid abbreviations, spell names as they sound if the voice stumbles.
