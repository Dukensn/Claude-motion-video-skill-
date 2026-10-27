"""mixlib — sound effects and the final mix for a film, all in seconds of film time.

    import mixlib as M
    M.init(248.0)                       # film length in seconds
    M.put(M.load("score.wav"), 0, 3.0)   # the rendered score, boosted
    M.roomtone(7.0, 42.0, 0.04)          # quiet air under interiors
    M.put(M.thump(55, 0.9, 0.6), 53.2, 0.55)   # a door slam (lands 1 frame after the picture)
    M.finish("premix.wav")               # peak-safe 16-bit WAV; loudness-normalize after with ffmpeg

Effects are filtered noise and low thumps tied to visible actions. No synthesized chimes or melodies.
"""
import wave
import numpy as np

SR = 48000
DUR = 240.0
rng = np.random.default_rng(11)
out = np.zeros((int(DUR * SR) + SR, 2), np.float32)


def init(duration):
    global DUR, out
    DUR = float(duration)
    out = np.zeros((int(DUR * SR) + SR, 2), np.float32)


def load(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, ch)

def lp(x, a):  # one-pole lowpass, a in (0,1): higher = brighter
    try:
        from scipy.signal import lfilter  # fast path when scipy is installed
        return lfilter([a], [1, a - 1], x).astype(np.float32)
    except ImportError:
        y = np.empty_like(x); s = 0.0
        for i in range(len(x)):
            s += a * (x[i] - s); y[i] = s
        return y

def hp(x, a): return x - lp(x, a)

out = np.zeros((int(DUR * SR) + SR, 2), np.float32)

def put(sig, t, gain=1.0, pan=0.0):
    global out
    i = int(t * SR)
    if sig.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
        sig = np.stack([sig * l, sig * r], 1) * 1.414
    j = min(len(out), i + len(sig))
    out[i:j] += sig[: j - i] * gain

def env(n, att, dec):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)

def key_tap(var):
    n = int(0.035 * SR)
    x = rng.standard_normal(n).astype(np.float32)
    x = hp(lp(x, 0.55 + 0.1 * var), 0.08) * env(n, 0.0005, 0.006 + 0.002 * var)
    return x * 0.5

def thump(f0=60, dur=0.5, click=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.5 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    nz = lp(rng.standard_normal(n).astype(np.float32), 0.2) * np.exp(-t * 40) * click
    return (x + nz).astype(np.float32)

def whoosh(dur=0.7, a0=0.02, a1=0.35):
    n = int(dur * SR)
    x = rng.standard_normal(n).astype(np.float32)
    y = np.empty_like(x); s = 0.0
    for i in range(n):
        k = i / n; a = a0 + (a1 - a0) * np.sin(np.pi * k) ** 2
        s += a * (x[i] - s); y[i] = s
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return y * e * 1.6

def breath(dur=1.6):  # whispery air for Pride's voice
    n = int(dur * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.35), 0.05)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return x * e * 0.5

def buzz(dur=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + np.sin(2 * np.pi * 330 * t) * 0.3
    x = lp(x.astype(np.float32), 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    e = np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.03)
    return x * e * 0.5

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 520 * np.exp(-t * 18) + 260
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.35).astype(np.float32)

def crackle(dur):
    n = int(dur * SR); x = np.zeros(n, np.float32)
    for _ in range(int(dur * 90)):
        i = rng.integers(0, n - 400); x[i:i + 300] += hp(rng.standard_normal(300).astype(np.float32), 0.4) * np.exp(-np.arange(300) / 40) * rng.uniform(0.1, 0.5)
    return x * np.linspace(1, 0, n) ** 1.5

def roomtone(a, b, level, bright=0.04):
    n = int((b - a) * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), bright)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.5 * SR))
    put(x * fade * level, a)

def scratch(a, b, level=0.12):  # pencil on paper
    n = int((b - a) * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.6), 0.25)
    t = np.arange(n) / SR
    am = 0.4 + 0.6 * np.abs(np.sin(2 * np.pi * (2.3 + 0.7 * np.sin(t * 1.3)) * t))
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.05 * SR))
    put(x * am * fade * level, a, pan=-0.2)

def page(t):
    n = int(0.5 * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.45), 0.05)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 3 * (0.6 + 0.4 * np.sin(np.linspace(0, 18, n)))
    put(x * e * 0.35, t)

def cough(t):
    for k, d in enumerate([0.0, 0.32]):
        n = int(0.28 * SR); tt = np.arange(n) / SR
        x = lp(rng.standard_normal(n).astype(np.float32), 0.12) * np.exp(-tt * 9) * np.minimum(1, tt / 0.01)
        put(x * 0.9, t + d, pan=-0.3)

def wind(a, b, level, bright=0.02):
    n = int((b - a) * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), bright)
    tt = np.arange(n) / SR
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * tt + 1.3) * np.sin(2 * np.pi * 0.031 * tt)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.8 * SR))
    put(x * am * fade * level, a)

def engine(a, b, level, rise=True):
    n = int((b - a) * SR); tt = np.arange(n) / SR
    f = 38 + (30 * tt / (b - a) if rise else 0)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + lp(rng.standard_normal(n).astype(np.float32), 0.02) * 2
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.6 * SR))
    put((x * fade * level).astype(np.float32), a, pan=0.3)

def waves(a, b, level):
    n = int((b - a) * SR); tt = np.arange(n) / SR
    x = lp(rng.standard_normal(n).astype(np.float32), 0.05) * 1.5
    am = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 7.0 - 1.2)) ** 2
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (1.0 * SR))
    put((x * am * fade * level).astype(np.float32), a)

def buzzes(t, k=3):
    for i in range(k): put(buzz(0.4), t + i * 0.8, 0.28)



def taps(times, gain=0.2):
    """keyboard taps at the given times (typing on a phone)"""
    for t in times:
        put(key_tap(rng.uniform(-1, 1)), t + 1 / 30, gain, pan=0.25)


def voiceover(timeline_path, gain=1.0):
    """place every narration clip from build/timeline.json; returns a 0..1 mask of where the voice speaks"""
    import json
    tl = json.load(open(timeline_path))
    mask = np.zeros(len(out), np.float32)
    for l in tl["lines"]:
        if not l.get("file"):
            continue
        v = load(l["file"])
        v = v.mean(axis=1) if v.ndim == 2 else v
        put(v.astype(np.float32), l["a"], gain)
        i = int(l["a"] * SR); mask[i:i + len(v)] = 1
    # smooth the mask at 100 Hz: 120 ms attack, 600 ms release, so the music breathes between sentences
    hop = SR // 100
    m = mask[: len(mask) // hop * hop].reshape(-1, hop).max(axis=1)
    sm = np.empty_like(m); s = 0.0
    for i in range(len(m)):
        s += (m[i] - s) * (0.08 if m[i] > s else 0.017); sm[i] = s
    full = np.repeat(sm, hop)
    return np.pad(full, (0, len(mask) - len(full)), mode="edge")


def music(sig, gain=1.0, duck=None, depth=0.55):
    """add the score; with duck=voiceover(...) mask it drops by `depth` under the voice"""
    n = min(len(out), len(sig))
    g = np.full(n, gain, np.float32)
    if duck is not None:
        g *= 1 - depth * duck[:n]
    out[:n] += sig[:n] * g[:, None]


def punch():
    """a cartoon hit: low thump + a short noise crack"""
    n = int(0.09 * SR)
    crack = hp(rng.standard_normal(n).astype(np.float32), 0.25) * env(n, 0.0005, 0.02) * 0.6
    th = thump(85, 0.35, 0.8)
    th[:n] += crack
    return th


def boom(dur=2.5):
    """explosion / collapse rumble"""
    n = int(dur * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), 0.02) * 6
    return x * env(n, 0.01, dur / 3)


def finish(path):
    mix = out[: int(DUR * SR)]
    peak = float(np.max(np.abs(mix)))
    mix = mix / max(peak, 1.0) * 0.9
    w = wave.open(path, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
    print("peak before norm", round(peak, 3), "->", path)
