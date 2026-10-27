"""voice.py — narration.json -> voice-over clips + the film's timeline.

    python3 tools/voice.py            (run from the film folder; scripts/voice.sh does this)

narration.json:
    {
      "voice": "am_michael",      # Kokoro voice, or null for a silent film (captions only)
      "speed": 1.0, "start": 1.0, "gap": 0.35, "tail": 4.0,
      "lines": [
        {"id": "hook", "text": "What if the Moon disappeared tonight?", "pause": 1.0},
        {"id": "dark", "text": "The first thing you'd notice is the dark."},
        {"id": "kid", "text": "Look!", "voice": "af_heart"},         # per-line voice for a character
        {"id": "kr", "text": "The fire kept them alive.", "caption": "Dife a te kenbe yo vivan."}  # subtitle differs from voice
      ]
    }

Writes build/voice/<n>-<id>.wav (48 kHz), build/timeline.json and assets/js/timeline.js
(window.VO = {lines: [{id, text, a, b, file}], end, duration}). Lines are cached by text+voice+speed,
so editing one line only re-synthesizes that line.

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

    model = None
    res = []
    for i, L in enumerate(lines):
        v = L.get("voice", voice0)
        rec = {"id": L.get("id") or f"l{i}", "text": L["text"]}
        if L.get("hide"): rec["hide"] = True
        if L.get("caption"): rec["caption"] = L["caption"]   # shown on screen instead of the spoken text
        if v:
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
