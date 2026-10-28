"""gemini_tts.py — expressive narration with Gemini TTS (the student's own API key), used by voice.py.

Ported from the CineVoice studio (github.com/Dukensn/Tts): a voice director writes the emotion for each line,
then Gemini speaks the whole script in ONE request, so a film costs one request of the student's quota.
The take is cut back into lines at the pauses, so the timeline stays exact.

Key: $GEMINI_API_KEY, or the file ~/.config/video-studio/gemini_key (never inside the repository).
Quota care: at most one request every MIN_GAP seconds (shared across films), no retry storms, and
an unchanged script is never sent twice (cached by hash in build/voice/).
"""
import base64, json, os, re, subprocess, time, urllib.error, urllib.request

KEY_FILE = os.path.expanduser("~/.config/video-studio/gemini_key")
STAMP = os.path.expanduser("~/.cache/video-studio/gemini_last_request")
MIN_GAP = float(os.environ.get("GEMINI_MIN_GAP", "30"))   # seconds between requests (≤ 2 per minute)
MODELS = [m for m in os.environ.get("GEMINI_TTS_MODELS", "gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-2.5-flash-preview-tts").split(",") if m]
API = "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent"

# prebuilt Gemini voices (the CineVoice set first)
VOICES = {
    "Fenrir": "male, deep, warm, excitable",
    "Puck": "male, young, upbeat, punchy",
    "Zephyr": "male, bright, clear, modern",
    "Charon": "male, dark, heavy, solemn — documentaries, mysteries",
    "Kore": "female, warm, natural, expressive",
    "Aoede": "female, breezy, light",
    "Leda": "female, youthful",
    "Sadachbia": "lively",
    "Enceladus": "breathy, intimate",
}


class QuotaError(Exception):
    pass


class NoKey(Exception):
    pass


def api_key():
    k = os.environ.get("GEMINI_API_KEY", "").strip()
    if not k and os.path.exists(KEY_FILE):
        k = open(KEY_FILE).read().strip()
    if not k:
        raise NoKey("no Gemini API key (set GEMINI_API_KEY or write ~/.config/video-studio/gemini_key)")
    return k


def _wait_turn():
    os.makedirs(os.path.dirname(STAMP), exist_ok=True)
    last = float(open(STAMP).read() or 0) if os.path.exists(STAMP) else 0
    wait = last + MIN_GAP - time.time()
    if wait > 0:
        print(f"  (gemini: waiting {wait:.0f}s to stay under the quota)")
        time.sleep(wait)
    open(STAMP, "w").write(str(time.time()))


def prompt(lines, style):
    """Gemini's director format. The acting notes live in the DIRECTOR'S NOTES, numbered by line; the
    TRANSCRIPT holds only the words to speak (notes placed inside the transcript get read aloud)."""
    notes = "\n".join(f"{i + 1}. {L['direct']}" for i, L in enumerate(lines) if L.get("direct"))
    return (f"# AUDIO PROFILE\nA YouTube narrator: {style or 'a natural, captivating human storyteller'}.\n\n"
            "### DIRECTOR'S NOTES\nPerform like a real person who feels every line: vary pace, pitch and energy, breathe naturally. "
            "Leave a short breath between lines. Speak ONLY the transcript, never these notes.\n"
            + (f"How to act each transcript line (by number):\n{notes}\n" if notes else "")
            + "\n#### TRANSCRIPT\n" + "\n\n".join(L["text"] for L in lines))


def synth(lines, voice, style, out_wav):
    """One request for the whole script -> out_wav (24 kHz mono). Raises QuotaError / NoKey / RuntimeError."""
    key = api_key()
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt(lines, style)}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    last = None
    for model in MODELS:
        _wait_turn()
        req = urllib.request.Request(API.format(model), data=json.dumps(payload).encode(),
                                     headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:400]
            if e.code == 429 or "RESOURCE_EXHAUSTED" in msg:
                raise QuotaError(f"Gemini quota reached ({model}): {msg}")
            if e.code in (400, 401, 403) and ("API key" in msg or "PERMISSION" in msg):
                raise NoKey(f"Gemini refused the key: {msg}")
            last = f"{model}: HTTP {e.code} {msg}"
            continue                                   # model not available -> try the next one
        except urllib.error.URLError as e:
            raise RuntimeError(f"cannot reach Gemini ({e.reason}) — network blocked?")
        part = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [{}])[0].get("inlineData")
        if not part:
            last = f"{model}: no audio in the answer"
            continue
        raw = base64.b64decode(part["data"])
        mime = part.get("mimeType", "")
        if "wav" in mime:
            open(out_wav, "wb").write(raw)
        else:                                          # audio/L16;codec=pcm;rate=24000
            rate = re.search(r"rate=(\d+)", mime)
            pcm = out_wav + ".pcm"
            open(pcm, "wb").write(raw)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", rate.group(1) if rate else "24000",
                            "-ac", "1", "-i", pcm, out_wav], check=True)
            os.remove(pcm)
        # guard: a take far longer than the words need means the model read notes aloud or repeated itself
        words = sum(len(L["text"].split()) for L in lines)
        expect = words / 2.3 + 1.0 * len(lines) + 2
        got = _dur(out_wav)
        if got > 2.2 * expect:
            os.rename(out_wav, out_wav + ".rejected.wav")
            raise RuntimeError(f"take is {got:.0f}s for {words} words — the voice read extra text")
        print(f"  gemini voice: {voice} via {model}")
        return model
    raise RuntimeError(last or "Gemini TTS failed")


def _silences(wav):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"],
                       capture_output=True, text=True)
    a = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    b = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    return list(zip(a, b))


def _dur(wav):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True)
    return float(r.stdout.strip())


def _best_cuts(sil, exp, total):
    """Pick len(exp)-1 pauses, in order, so each clip's length best matches its text (dynamic programming);
    longer pauses are preferred, because the voice was asked to breathe between lines."""
    n, m = len(exp), len(sil)
    mid = [(a + b) / 2 for a, b in sil]
    INF = float("inf")
    cost = lambda k, x0, x1: ((x1 - x0) - exp[k]) ** 2 / exp[k]
    # D[k][j]: best cost with cut k (0-based) placed at pause j
    D = [[INF] * m for _ in range(n - 1)]
    back = [[-1] * m for _ in range(n - 1)]
    for j in range(m):
        D[0][j] = cost(0, 0, mid[j]) - 4 * (sil[j][1] - sil[j][0])
    for k in range(1, n - 1):
        for j in range(k, m):
            for i in range(k - 1, j):
                if D[k - 1][i] == INF: continue
                c = D[k - 1][i] + cost(k, mid[i], mid[j]) - 4 * (sil[j][1] - sil[j][0])
                if c < D[k][j]: D[k][j], back[k][j] = c, i
    best, j = INF, -1
    for jj in range(n - 2, m):
        c = D[n - 2][jj] + cost(n - 1, mid[jj], total)
        if c < best: best, j = c, jj
    if j < 0: return None
    out = []
    for k in range(n - 2, -1, -1):
        out.append(mid[j]); j = back[k][j]
    return out[::-1]


ASR_DIR = os.path.expanduser("~/.cache/video-studio/asr")
ASR_NAME = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8"   # 25 languages incl. English, French, Spanish, Portuguese
ASR_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{ASR_NAME}.tar.bz2"


def _ensure_asr():
    """Parakeet (sherpa-onnx) from GitHub releases, ~490 MB, downloaded once on first expressive voicing."""
    import sys
    try:
        import sherpa_onnx  # noqa: F401
    except ImportError:
        for extra in ([], ["--break-system-packages"]):
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", *extra, "sherpa-onnx", "soundfile"], check=False)
        import sherpa_onnx  # noqa: F401
    d = os.path.join(ASR_DIR, ASR_NAME)
    if not os.path.exists(os.path.join(d, "tokens.txt")):
        os.makedirs(ASR_DIR, exist_ok=True)
        print("  (downloading the speech aligner, once — ~490 MB)")
        tb = os.path.join(ASR_DIR, "asr.tar.bz2")
        subprocess.run(["curl", "-sSL", "--fail", "-o", tb, ASR_URL], check=True)
        subprocess.run(["tar", "xjf", tb, "-C", ASR_DIR], check=True)
        os.remove(tb)
    return d


def _norm(w):
    import unicodedata
    w = unicodedata.normalize("NFKD", w.lower())
    return "".join(c for c in w if c.isalnum())


def asr_words(take):
    """[(word, start, end)] heard in the take, or None if the aligner can't run."""
    try:
        d = _ensure_asr()
        import sherpa_onnx, soundfile as sf
        rec = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=f"{d}/encoder.int8.onnx", decoder=f"{d}/decoder.int8.onnx", joiner=f"{d}/joiner.int8.onnx",
            tokens=f"{d}/tokens.txt", model_type="nemo_transducer", num_threads=os.cpu_count() or 2)
        tmp = take + ".16k.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", take, "-ar", "16000", "-ac", "1", tmp], check=True)
        x, sr = sf.read(tmp, dtype="float32"); os.remove(tmp)
        st = rec.create_stream(); st.accept_waveform(sr, x); rec.decode_stream(st)
        toks, ts = st.result.tokens, st.result.timestamps
    except Exception as e:  # no network for the model, no wheel for this platform…
        print(f"  (aligner unavailable: {e}; splitting at pauses)")
        return None
    words = []
    for tok, t in zip(toks, ts):
        if tok.startswith(" ") or not words:
            words.append([tok.strip(), t, t + 0.3])
        else:
            words[-1][0] += tok
            words[-1][2] = t + 0.3
    return [(w, a, b) for w, a, b in words if _norm(w)]


def align(lines, heard):
    """Find each line's [start, end] in the take by matching script words to heard words.
    Words the voice added (notes read aloud, repeats) are simply left out of every clip."""
    import difflib
    script, owner = [], []
    for i, L in enumerate(lines):
        for w in L["text"].split():
            if _norm(w):
                script.append(_norm(w)); owner.append(i)
    sm = difflib.SequenceMatcher(None, script, [_norm(w) for w, _, _ in heard], autojunk=False)
    first, last, hit = {}, {}, [0] * len(lines)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            i, h = owner[blk.a + k], heard[blk.b + k]
            first.setdefault(i, h[1]); last[i] = h[2]; hit[i] += 1
    if sum(hit) < 0.6 * len(script) or len(first) < len(lines) * 0.75:
        return None
    ranges = []
    for i in range(len(lines)):
        if i in first:
            ranges.append([first[i] - 0.12, last[i] + 0.15])
        else:
            ranges.append(None)
    # lines the aligner missed: fill the gap between neighbours
    for i, r in enumerate(ranges):
        if r is None:
            a = ranges[i - 1][1] + 0.05 if i and ranges[i - 1] else 0.0
            b = next((x[0] for x in ranges[i + 1:] if x), a + 3.0)
            ranges[i] = [a, b - 0.05]
    for i in range(len(ranges) - 1):                 # never overlap the next line
        ranges[i][1] = min(ranges[i][1], ranges[i + 1][0] - 0.02)
    extra = len(heard) - sum(hit)
    if extra > 0.25 * len(script):
        print(f"  (gemini spoke {extra} words that are not in the script — they were cut out)")
    return [(max(0.0, a), b) for a, b in ranges]


def split(take, lines, outs):
    """Cut the take into len(lines) clips, 48 kHz mono: word-aligned with the speech recogniser when it can run,
    else at the pauses that best fit the text."""
    n, total = len(lines), _dur(take)
    heard = asr_words(take)
    ranges = align(lines, heard) if heard else None
    if ranges:
        for (a, b), f in zip(ranges, outs):
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", take,
                            "-af", "afade=t=in:d=0.02,areverse,afade=t=in:d=0.06,areverse", "-ar", "48000", "-ac", "1", f], check=True)
        return
    sil = [(a, b) for a, b in _silences(take) if a > 0.05 and b < total - 0.05]
    # expected share of the take for each line (characters + a pause allowance)
    w = [len(L["text"]) + 12 for L in lines]
    exp = [total * x / sum(w) for x in w]
    cuts = _best_cuts(sil, exp, total) if len(sil) >= n - 1 else None
    if cuts is None:                                   # fall back: split by length of text
        acc, cuts = 0, []
        for x in exp[:-1]:
            acc += x; cuts.append(acc)
        print("  (gemini: pauses unclear, lines split by text length — check the sync)")
    bounds = [0.0] + cuts + [total]
    for i, f in enumerate(outs):
        a, b = bounds[i], bounds[i + 1]
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", take,
                        "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
                               "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse",
                        "-ar", "48000", "-ac", "1", f], check=True)
