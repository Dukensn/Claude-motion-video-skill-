"""Atelye 5 Dec ad: his voice + ducked score + a dense, punchy effects track (no harsh whooshes)."""
import sys
import numpy as np
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mixlib as M

SR = M.SR; DUR = 114.5
rng = np.random.default_rng(5)
T = lambda d: np.arange(int(d * SR)) / SR
f32 = lambda x: np.asarray(x, np.float32)

def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def air(d=0.18, bright=0.06):
    t = T(d); x = M.hp(M.lp(noise(d), bright), 0.02)
    return f32(x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 0.5)
def impact(big=1.0):
    t = T(1.2)
    f = 30 + 55 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    n = noise(1.2) * np.exp(-t * 38) * 0.6
    return f32((sub * 0.9 + M.lp(n, 0.25)) * big)
def riser(d=1.4):
    t = T(d); x = noise(d)
    out = np.zeros_like(x); s = 0.0; a = 0.01 + 0.4 * (t / d) ** 2
    from scipy.signal import lfilter
    # time-varying lowpass approximated in blocks
    B = 2048
    for i in range(0, len(x), B):
        aa = float(a[min(i, len(a) - 1)]); out[i:i + B] = lfilter([aa], [1, aa - 1], x[i:i + B])
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / d) ** 2) / SR) * 0.15
    env = (t / d) ** 2.2
    return f32((M.hp(out, 0.01) * 0.8 + sweep) * env)
def bell(f, d=0.6, amp=0.3):
    t = T(d)
    x = sum(np.sin(2 * np.pi * f * k * t) * w for k, w in [(1, 1), (2.01, .35), (3.02, .15)]) * np.exp(-t * 7)
    return f32(x * amp)
def ding(): return bell(1568, 0.5, 0.22) + np.pad(bell(2093, 0.45, 0.2), (int(0.07 * SR), 0))[: int(0.5 * SR)]
def send(): t = T(0.12); return f32(np.sin(2 * np.pi * np.cumsum(600 + 2400 * t / 0.12) / SR) * np.exp(-t * 18) * 0.25)
def shutter():
    a = noise(0.03) * np.exp(-T(0.03) * 150); b = noise(0.05) * np.exp(-T(0.05) * 90)
    x = np.zeros(int(0.12 * SR), np.float32); x[: len(a)] += a; x[int(0.06 * SR): int(0.06 * SR) + len(b)] += b
    return f32(M.hp(x, 0.2) * 0.5)
def buzzer(d=0.32):
    t = T(d); x = np.sign(np.sin(2 * np.pi * 150 * t)) + np.sign(np.sin(2 * np.pi * 153 * t))
    return f32(M.lp(x.astype(np.float32), 0.12) * np.minimum(1, (d - t) * 30) * 0.22)
def glitch():
    x = np.zeros(int(0.35 * SR), np.float32)
    for i in range(7):
        s = int(i * 0.05 * SR); seg = noise(0.03) * (0.6 if i % 2 else 0.3)
        seg = M.lp(seg, 0.3 if i % 2 else 0.08); x[s: s + len(seg)] += seg
    return x
def chaching():
    x = np.zeros(int(0.9 * SR), np.float32)
    c = noise(0.04) * np.exp(-T(0.04) * 80); x[: len(c)] += M.hp(c, 0.3) * 0.6
    for k, f in enumerate([2637, 3136]):
        b = bell(f, 0.7, 0.22); s = int((0.08 + 0.09 * k) * SR); x[s: s + len(b)] += b[: len(x) - s]
    return x
def coin(p=1.0): t = T(0.18); f = 1300 * p; return f32((np.sin(2*np.pi*f*t)*.6 + np.sin(2*np.pi*f*1.5*t)*.4) * np.exp(-t*20) * 0.3)
def sparkle(n=10, d=0.9):
    x = np.zeros(int((d + 0.4) * SR), np.float32)
    for i in range(n):
        b = bell(rng.uniform(2400, 4200), 0.35, 0.09); s = int(rng.uniform(0, d) * SR); x[s: s + len(b)] += b
    return x
def chime(): 
    x = np.zeros(int(1.2 * SR), np.float32)
    for k, f in enumerate([1047, 1319, 1568, 2093]):
        b = bell(f, 0.8, 0.2); s = int(k * 0.07 * SR); x[s: s + len(b)] += b[: len(x) - s]
    return x
def tick(v=0): return M.key_tap(v) * 0.9
def pop(): return M.pop()
def thud(): return M.thump(70, 0.35, 0.4) * 0.8

P = M.put
def ticks(t0, t1, gap=0.045, v=0.3):
    t = t0
    while t < t1: P(tick(int(t * 7) % 3), t, v); t += gap

def click(v=1.0):
    n = int(0.03 * SR); x = noise(0.03) * np.exp(-np.arange(n) / SR * 260)
    return f32(M.hp(M.lp(x, 0.6), 0.25) * 0.5 * v)
def whoosh(d=0.35, bright=0.08):
    t = T(d); x = M.lp(noise(d), bright)
    sweep = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return f32(M.hp(x, 0.01) * sweep * 0.7)
def softhit():   # a felt, low thud for a stamp landing - not a cinematic boom
    t = T(0.45); f = 70 + 40 * np.exp(-t * 18)
    return f32(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * 0.8 + M.lp(noise(0.45), 0.08) * np.exp(-t * 40) * 0.3)

def effects():
    """Every sound is tied to something on screen. Transitions: a whoosh. A card or chip landing: a soft pop.
    A UI action (toggle, button, tap): a click. Counters: light ticks. Notifications and messages: a small ding.
    Stamps (GRATIS, 1 MILYON, PLAS LIMITE): a short felt thud. Two gentle risers lead into the two key moments."""
    W = [5.1, 7.55, 11.65, 17.05, 23.4, 28.15, 34.25, 38.8, 40.0, 41.5, 43.45, 48.1, 57.9, 66.35, 75.25, 82.55, 87.3, 95.45, 102.25, 112.55]
    for i, t in enumerate(W): P(whoosh(0.32 if i % 2 else 0.38, 0.07 if i % 2 else 0.1), t - 0.16, 0.38, pan=(0.25 if i % 2 else -0.25))
    for t in [0.25, 0.85, 1.6]: P(whoosh(0.25, 0.12), t - 0.1, 0.3); P(pop(), t + 0.12, 0.3)
    pops = [5.2, 6.05, 6.25, 6.45, 6.65, 7.8, 10.4, 11.95, 13.4, 15.3, 15.55, 15.8, 16.05, 18.4, 19.3, 20.6, 25.6, 28.25, 29.4, 30.3, 31.1, 31.4,
            35.3, 43.6, 50.6, 58.05, 60.5, 58.7, 59.4, 59.8, 60.3, 63.7, 64.7, 65.8, 66.5, 66.9, 78.0, 75.7, 75.98, 76.26, 76.54, 76.82, 77.1, 87.5, 88.0, 88.6, 89.0, 82.95, 106.4, 112.65]
    for i, t in enumerate(pops): P(pop(), t, 0.26, pan=(0.12 if i % 2 else -0.12))
    for t in [9.0, 44.4, 56.9, 107.6, 109.4]: P(click(), t, 0.5)
    for t0, t1 in [(9.35, 11.1), (13.45, 15.6), (45.3, 46.9), (50.7, 55.4), (68.1, 71.1), (96.6, 101.0)]: ticks(t0, t1, 0.055, 0.13)
    for t in [67.3, 67.8, 68.6, 70.2, 70.6, 71.0]: P(coin(1.2), t, 0.22)
    for t in [96.6, 97.8, 99.4]: P(ding(), t, 0.3)
    for t in [3.05, 46.5, 54.5, 73.2, 80.6, 86.0, 90.7, 93.6, 102.9]: P(softhit(), t, 0.42); P(bell(1568, 0.5, 0.18), t + 0.02, 0.18)
    P(riser(1.3), 54.5 - 1.3, 0.22); P(riser(1.2), 102.25 - 1.2, 0.2)
    for t in [17.15, 34.6, 44.4, 58.05, 75.4, 82.7]: P(whoosh(0.2, 0.16), t - 0.05, 0.22)   # big title slams: a quick air, nothing heavy
    P(chime(), 112.65, 0.3)
    ticks(24.6, 26.2, 0.07, 0.1)   # laptops lighting up in the workshop
    P(pop(), 26.6, 0.26)

M.init(DUR)
MUSIC_GAIN = 0.2
v = M.load("assets/audio/voice.wav")[:, 0]
music = M.load("build/score.wav")[: int(DUR * SR)]
n = len(music); f = np.ones(n, np.float32); k = int(1.6 * SR); f[-k:] = np.linspace(1, 0, k)
music = music * f[:, None]
envl = M.lp(np.abs(v), 0.002); envl = envl / (envl.max() + 1e-9)
duck = np.ones(len(M.out), np.float32); act = (envl > 0.04).astype(np.float32)
act = M.lp(act, 0.0006); duck[: len(act)] = 1 - 0.55 * np.clip(act * 1.6, 0, 1)
mm = np.zeros_like(M.out); mm[: len(music)] = music
M.out += mm * duck[:, None] * MUSIC_GAIN
M.put(v, 0, 1.8)
effects()
M.finish("build/premix.wav")
