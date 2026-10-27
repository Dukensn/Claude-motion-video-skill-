# Voice-over

Two engines, chosen at intake. Say honestly how each sounds.

| | Expressive — Gemini TTS | Natural — Kokoro |
| --- | --- | --- |
| Sound | acts each line: surprise, suspense, humour, warmth | clear and natural, **but flat — no emotion** |
| Needs | the student's own Gemini API key (free tier) | nothing (local, offline after first download) |
| Cost | one request of their daily quota per voicing | free, unlimited |
| narration.json `voice` | a Gemini voice: `Puck`, `Fenrir`, `Kore`… | a Kokoro voice: `am_michael`, `af_heart`… |

`python3 films/<slug>/tools/voice.py` (or `scripts/audio.sh`) → `build/voice/*.wav`, `build/timeline.json`, `assets/js/timeline.js`. Settings: `start` (silence before the first line), `gap`, per-line `pause`, `hide`, `caption`, `voice`; Kokoro also `speed`. The film's duration = last line end + `tail`.

## Expressive voice (Gemini) — ported from the CineVoice studio (github.com/Dukensn/Tts)

```json
{
  "voice": "Puck",
  "style": "an energetic, curious YouTube Shorts storyteller — playful, a little dramatic, warm at the end",
  "fallback_voice": "am_michael",
  "start": 0.5, "gap": 0.3, "tail": 2.5,
  "lines": [
    {"id": "hook", "text": "What if every bee on Earth vanished tonight?", "direct": "dramatic, intriguing, building suspense"},
    {"id": "beige", "text": "But your plate? Mostly beige.", "direct": "deadpan, disappointed, comic timing on 'beige'"}
  ]
}
```

You are the voice director: write `style` (who is talking, the energy of the whole video) and a short `direct` for every line (emotion + pace). Vary them — the contrast is what makes it feel human. Inline tags inside `text` such as `[laughs]`, `[sighs]`, `[whispers]` also work; use them rarely.

How it works (`tools/gemini_tts.py`): the whole script goes in **one** request; Gemini performs it with a pause between lines; the take is cut back into lines (pause matching), so `at("id")` sync still works. If the take is far too long (the model read the notes aloud) it is rejected.

| Voice | Character |
| --- | --- |
| Puck | young male, upbeat, punchy — What if, Shorts |
| Fenrir | deep warm male, excitable — action, hype |
| Charon | dark, heavy, solemn — documentary, mystery |
| Zephyr | bright clear male — explainers |
| Kore | warm natural female, expressive — stories, explainers |
| Aoede, Leda, Sadachbia, Enceladus | breezy · youthful · lively · breathy-intimate |

Languages: English, French, Spanish and many more. Haitian Creole is not guaranteed — test one line and let the student judge; otherwise French/English voice with Creole `caption`s.

### Getting the key (the student does this once, from the phone)

1. Open **aistudio.google.com/apikey**, sign in with a Google account, tap **Create API key**, copy it.
2. Paste it in the chat.

You then save it — never in the repository, never repeated back in chat:
```bash
mkdir -p ~/.config/video-studio && umask 077 && printf '%s' '<KEY>' > ~/.config/video-studio/gemini_key
```
Cloud sessions are wiped when they end, so in a new session the student pastes it again — or, to keep it, they add `GEMINI_API_KEY` once in the cloud environment's settings (environment variables). `voice.py` reads `GEMINI_API_KEY` first, then that file.

### Protect the quota (free tier is small)

- Voice only **after** the script is approved. Fix words first, then voice once.
- One request per voicing, at least 30 s apart (`GEMINI_MIN_GAP`), never a retry loop. An unchanged script is never re-sent (cached take in `build/voice/`).
- Changing any line, note or style = a new request. Batch the student's changes.
- Quota reached (429), no key, refused key or network blocked → `voice.py` falls back to Kokoro (`fallback_voice`) and prints why. Tell the student in one sentence ("the expressive voice is out of quota for today; this version uses the natural voice — we can re-voice tomorrow").
- Model order: `GEMINI_TTS_MODELS` (default `gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-2.5-flash-preview-tts`).

You cannot hear: after voicing, check the clip lengths look right for their words (`build/timeline.json`) and ask the student to listen.

## Natural voice (Kokoro)

| Language | Voices |
| --- | --- |
| English (US) | am_michael (warm male), am_adam, af_heart (warm female), af_nova, af_sky |
| English (UK) | bm_george, bf_emma, bf_isabella |
| French | ff_siwis |
| Spanish | ef_dora |
| Japanese / Chinese | jf_alpha / zf_xiaobei |

`speed`: 0.9 calm documentary · 1.0 default · 1.1 energetic. Only changed lines are re-synthesised.

**Haitian Creole** has no Kokoro voice: narrate in French or English with a Creole `"caption"` per line (the voice reads `text`, the screen shows `caption`), or make a silent film with Creole captions (`"voice": null`).

Write for the ear: short sentences, numbers as words when spoken oddly ("about a third"), no abbreviations, spell names as they sound if the voice stumbles.
