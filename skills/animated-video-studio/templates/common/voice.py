"""voice.py — narration.json -> voice-over clips + the film's timeline.

    python3 tools/voice.py            (run from the film folder; scripts/voice.sh does this)

narration.json:
    {
      "voice": "am_michael",      # Kokoro voice (has an "_"), a Gemini voice (Puck, Fenrir, Kore…), or null for a silent film
      "style": "an excited, curious science storyteller",   # Gemini only: overall delivery
      "fallback_voice": "am_michael",                        # Gemini only: Kokoro voice if Gemini can't be used
      "speed": 1.0, "start": 1.0, "gap": 0.35, "tail": 4.0,
      "lines": [
        {"id": "hook", "text": "What if the Moon disappeared tonight?", "pause": 1.0, "direct": "hushed, mysterious, slow"},
        {"id": "dark", "text": "The first thing you'd notice is the dark."},
        {"id": "kid", "text": "Look!", "voice": "af_heart"},         # per-line voice for a character
        {"id": "kr", "text": "The fire kept them alive.", "caption": "Dife a te kenbe yo vivan."}  # subtitle differs from voice
      ]
    }

Writes build/voice/<n>-<id>.wav (48 kHz), build/timeline.json and assets/js/timeline.js
(window.VO = {lines: [{id, text, a, b, file}], end, duration}). Lines are cached by text+voice+speed,
so editing one line only re-synthesizes that line.

Gemini (expressive, the student's own key — templates/common/gemini_tts.py): the whole script is spoken in ONE request,
each line acted with its "direct" note, then cut back into lines. Editing any line re-sends the script (one request).
If there is no key, the quota is reached or the network blocks it, the film falls back to Kokoro and says so.

Voices (Kokoro-82M, local, free): English am_michael am_adam af_heart af_nova af_sky bf_emma bf_isabella bm_george,
French ff_siwis, Spanish ef_dora, Japanese jf_alpha, Chinese zf_xiaobei. Haitian Creole has no voice: narrate in
French or English and show Creole subtitles if wanted.
"""
import hashlib, json, os, subprocess, sys, wave

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
CACHE = os.path.expanduser("~/.cache/hyperframes/tts")
MODEL = os.path.join(CACHE, "models", "kokoro-v1.0.onnx")
VOICES = os.path.join(CACHE, "voices", "voices-v1.0.bin")
LANG = {"a": "en-us", "b": "en-gb", "f": "fr-fr", "e": "es", "j": "ja", "z": "zh", "i": "it", "p": "pt-br", "h": "hi"}


def wav_seconds(p):
    w = wave.open(p); return w.getnframes() / w.getframerate()


def ensure_model():
    try:
        import kokoro_onnx, soundfile  # noqa: F401
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "kokoro-onnx", "soundfile"], check=False)
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--break-system-packages", "kokoro-onnx", "soundfile"], check=False)
    if not (os.path.exists(MODEL) and os.path.exists(VOICES)):
        # the HyperFrames CLI downloads the Kokoro model and voices into ~/.cache/hyperframes/tts on first use
        tmp = os.path.join(FILM, "build", "_bootstrap.wav")
        subprocess.run(["npx", "--yes", "hyperframes@0.8.193", "tts", "Hello.", "-o", tmp], check=True)
        os.remove(tmp)


GEM = {}   # line index -> (clip, hash) for lines spoken by Gemini


def gemini_take(spec, lines, voice, out, old):
    """Expressive narration: one Gemini request for all lines that use the main voice. Returns the voice the
    remaining lines should use (unchanged on success, the Kokoro fallback if Gemini can't be used)."""
    sys.path.insert(0, HERE)
    import gemini_tts as G
    idx = [i for i, L in enumerate(lines) if L.get("voice", voice) == voice]
    style = spec.get("style", "")
    key = json.dumps([voice, G.MODELS, G.prompt([lines[i] for i in idx], style)])   # any change to the words or notes = new take
    h = hashlib.sha1(key.encode()).hexdigest()[:12]
    files = [os.path.join(out, f"{i:03d}-{lines[i].get('id') or f'l{i}'}.wav") for i in idx]
    hashes = [f"{h}-{k}" for k in range(len(idx))]
    if all(x in old and os.path.exists(f) for x, f in zip(hashes, files)):
        for i, f, x in zip(idx, files, hashes): GEM[i] = (f, x)
        return voice
    take = os.path.join(out, f"take-{h}.wav")
    try:
        if not os.path.exists(take):
            G.synth([lines[i] for i in idx], voice, style, take)
        G.split(take, [lines[i] for i in idx], files)
    except (G.QuotaError, G.NoKey, RuntimeError) as e:
        fb = spec.get("fallback_voice", "am_michael")
        print(f"  !! Gemini voice unavailable: {e}\n  !! falling back to Kokoro ({fb}) — natural but not emotional")
        return fb
    for i, f, x in zip(idx, files, hashes):
        GEM[i] = (f, x)
        print(f"  voice {i:03d} {lines[i].get('id')}: {lines[i]['text'][:60]}")
    return voice


def main():
    spec = json.load(open(os.path.join(FILM, "narration.json")))
    lines = spec["lines"]
    voice0 = spec.get("voice")
    speed = float(spec.get("speed", 1.0))
    t = float(spec.get("start", 1.0))
    gap = float(spec.get("gap", 0.35))
    out = os.path.join(FILM, "build", "voice")
    os.makedirs(out, exist_ok=True)
    old = {}
    tl_path = os.path.join(FILM, "build", "timeline.json")
    if os.path.exists(tl_path):
        old = {l.get("hash"): l for l in json.load(open(tl_path))["lines"] if l.get("hash")}

    voiced = [L for L in lines if L.get("voice", voice0)]
    engine = spec.get("engine") or ("gemini" if voice0 and "_" not in voice0 else "kokoro")
    if engine == "gemini" and voiced:
        voice0 = gemini_take(spec, lines, voice0, out, old)

    model = None
    res = []
    for i, L in enumerate(lines):
        v = L.get("voice", voice0)
        rec = {"id": L.get("id") or f"l{i}", "text": L["text"]}
        if L.get("hide"): rec["hide"] = True
        if L.get("caption"): rec["caption"] = L["caption"]   # shown on screen instead of the spoken text
        if i in GEM:
            f, h = GEM[i]
            dur = wav_seconds(f)
            rec.update(file=f, hash=h)
        elif v:
            h = hashlib.sha1(f'{L["text"]}|{v}|{speed}'.encode()).hexdigest()[:12]
            f = os.path.join(out, f"{i:03d}-{rec['id']}.wav")
            if not (h in old and os.path.exists(old[h]["file"])):
                if model is None:
                    ensure_model()
                    import kokoro_onnx
                    model = kokoro_onnx.Kokoro(MODEL, VOICES)
                import soundfile as sf
                samples, sr = model.create(L["text"], voice=v, speed=speed, lang=LANG.get(v[0], "en-us"))
                tmp = f + ".raw.wav"
                sf.write(tmp, samples, sr)
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-ar", "48000", "-ac", "1", f], check=True)
                os.remove(tmp)
                print(f"  voice {i:03d} {rec['id']}: {L['text'][:60]}")
            else:
                f = old[h]["file"]
            dur = wav_seconds(f)
            rec.update(file=f, hash=h)
        else:
            # silent film: reading time for the caption
            dur = max(1.8, 0.34 * len(L["text"].split()) + 1.0)
        rec["a"] = round(t, 3)
        rec["b"] = round(t + dur, 3)
        res.append(rec)
        t += dur + float(L.get("pause", gap))
    end = t
    duration = round(end + float(spec.get("tail", 4.0)), 2)
    data = {"lines": res, "end": round(end, 3), "duration": duration}
    json.dump(data, open(tl_path, "w"), indent=1)
    js = {"lines": [{k: l[k] for k in ("id", "text", "caption", "a", "b", "hide") if k in l} for l in res], "end": data["end"], "duration": duration}
    with open(os.path.join(FILM, "assets", "js", "timeline.js"), "w") as fh:
        fh.write("// generated by tools/voice.py from narration.json — do not edit by hand\nwindow.VO = " + json.dumps(js, indent=1) + ";\n")
    print(f"{len(res)} lines, narration ends at {end:.1f}s, film duration {duration:.1f}s")


if __name__ == "__main__":
    main()
