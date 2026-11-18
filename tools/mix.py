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

def tock(hi=True):
    t = T(0.06); f = 2400 if hi else 1700
    return f32(np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * 0.35)

def effects():
    """Built like the stickman ad: every visible action has its sound, mixed so the voice stays on top.
    whoosh = scene change / something flying in; impact = a title or stamp landing; pop = a card or chip;
    ticks + ka-ching = counters (views, money, reach); ding = notification / message; key taps = laptops;
    tick-tock = the clock; riser = build-up into a reveal (camera pulling back, 1 MILYON, the call to action)."""
    W = [5.1, 7.55, 11.65, 17.05, 23.4, 28.15, 34.25, 38.8, 43.45, 48.1, 57.9, 66.35, 75.25, 82.55, 87.3, 95.45, 102.25, 112.55]
    for i, t in enumerate(W): P(whoosh(0.34 if i % 2 else 0.4, 0.08 if i % 2 else 0.11), t - 0.17, 0.55, pan=(0.3 if i % 2 else -0.3))
    # A · the two AI videos fly in, "100% IA" lands
    P(whoosh(0.3, 0.12), 0.12, 0.5, pan=-0.3); P(impact(0.5), 0.27, 0.45); P(shutter(), 0.3, 0.35)
    P(whoosh(0.3, 0.12), 0.72, 0.5, pan=0.3); P(impact(0.5), 0.87, 0.45); P(shutter(), 0.9, 0.35)
    P(pop(), 1.6, 0.4); P(impact(0.8), 3.05, 0.7); P(sparkle(8, 0.6), 3.1, 0.4)
    # B · YouTube
    P(impact(0.9), 5.2, 0.75); P(sparkle(10, 0.6), 5.35, 0.45); P(impact(0.6), 5.75, 0.55)
    for i, t in enumerate([6.05, 6.25, 6.45, 6.65]): P(coin(1.0 + 0.15 * i), t, 0.45)
    # C · channel proof: counter rolls up to 8 216 087
    P(thud(), 7.8, 0.5); P(pop(), 9.0, 0.45); ticks(9.35, 11.1, 0.035, 0.3); P(chaching(), 11.12, 0.65); P(pop(), 10.4, 0.4)
    # D · one video: 4,8 M, the weeks fill
    P(impact(0.6), 11.8, 0.55); P(thud(), 11.95, 0.45); P(pop(), 13.4, 0.45); ticks(13.45, 15.6, 0.04, 0.3); P(chaching(), 15.62, 0.6)
    for t in [15.3, 15.55, 15.8, 16.05]: P(tick(2) * 1.4, t, 0.5)
    P(impact(0.7), 16.3, 0.55)
    # E · "Poutan"
    P(impact(0.8), 17.15, 0.65); P(whoosh(0.3, 0.1), 18.3, 0.45, pan=-0.3); P(pop(), 19.3, 0.45); P(whoosh(0.3, 0.1), 20.5, 0.45, pan=0.3); P(ding(), 21.65, 0.45)
    # F · the workshop: lights, projector, laptops, hands
    P(riser(0.8), 22.6, 0.3); P(shutter(), 23.6, 0.35); P(send(), 23.7, 0.5)
    for i in range(18): P(tick(i % 3), 24.5 + i * 0.085, 0.32, pan=(-0.4 + 0.8 * (i % 7) / 6))
    for t in [26.4, 26.65, 26.9]: P(pop(), t, 0.35)
    P(impact(0.6), 26.6, 0.5); P(chime(), 26.65, 0.4)
    # G · date, map pin, clock
    P(thud(), 28.3, 0.6); P(impact(0.5), 28.9, 0.45); P(whoosh(0.3, 0.1), 29.35, 0.4); P(thud(), 29.9, 0.6); P(pop(), 30.3, 0.45)
    P(pop(), 31.1, 0.4); P(pop(), 31.4, 0.4)
    for i in range(8): P(tock(i % 2 == 0), 31.5 + i * 0.25, 0.4)
    P(bell(1568, 0.6, 0.25), 33.5, 0.45)
    # H, I · videos
    P(impact(0.7), 34.6, 0.6); P(sparkle(10, 0.8), 34.65, 0.4)
    for t in [38.9, 40.0, 41.5]: P(whoosh(0.28, 0.13), t - 0.1, 0.5); P(impact(0.45), t + 0.05, 0.4)
    # J1 · Facebook Ads: logo, bar fills, "konpetans kle"
    P(impact(0.8), 43.6, 0.65); P(impact(0.6), 44.4, 0.5); ticks(45.3, 46.9, 0.05, 0.28); P(impact(0.8), 46.5, 0.65); P(chime(), 46.55, 0.45)
    # J2 · post -> phone -> crowd -> 1 MILYON
    P(thud(), 48.2, 0.55); ticks(48.6, 50.2, 0.05, 0.25)
    P(whoosh(0.5, 0.06), 49.55, 0.55); P(send(), 50.05, 0.5)
    P(riser(3.0), 50.2, 0.35)
    for i in range(24): P(bell(2200 + 90 * (i % 6), 0.18, 0.12), 51.6 + i * 0.1, 0.35, pan=(-0.5 + (i * 7 % 11) / 10))
    P(pop(), 51.4, 0.45); ticks(51.5, 55.4, 0.035, 0.3)
    P(riser(1.0), 53.5, 0.35); P(impact(1.3), 54.5, 0.95); P(chaching(), 54.55, 0.7); P(sparkle(14, 1.0), 54.6, 0.5)
    P(pop(), 56.6, 0.45); P(coin(1.0), 56.65, 0.45)
    # K1 · digital product: phone, laptop, cloud
    P(impact(0.7), 58.05, 0.55); P(whoosh(0.3, 0.1), 58.6, 0.45, pan=-0.3); P(whoosh(0.3, 0.1), 59.3, 0.45, pan=0.3); P(pop(), 59.8, 0.4); P(pop(), 60.3, 0.45); P(pop(), 60.5, 0.35)
    for t in [63.7, 64.7, 65.8]: P(tick(2) * 1.4, t, 0.55); P(bell(1760, 0.3, 0.2), t + 0.03, 0.35)
    # K2 · once -> tens of thousands of sales
    P(impact(0.7), 66.5, 0.55); P(pop(), 66.9, 0.5)
    for t in [67.3, 67.8, 68.6, 70.2, 70.6, 71.0]: P(ding(), t, 0.4); P(coin(1.2), t + 0.05, 0.35)
    ticks(68.1, 71.1, 0.032, 0.32); P(chaching(), 71.15, 0.7); P(impact(0.8), 71.2, 0.6); P(impact(0.8), 73.2, 0.65)
    # L · skills and resources
    P(impact(0.6), 75.4, 0.55)
    for i in range(6): P(whoosh(0.22, 0.14), 75.62 + i * 0.28, 0.35, pan=(-0.3 if i % 2 else 0.3)); P(pop(), 75.7 + i * 0.28, 0.4)
    P(impact(1.0), 80.6, 0.8); P(chaching(), 80.65, 0.55)
    # M · debit card
    P(impact(0.6), 82.7, 0.55); P(whoosh(0.4, 0.08), 82.9, 0.5); P(impact(1.0), 86.0, 0.8); P(chaching(), 86.05, 0.55)
    # N · 7 days Claude Pro
    P(pop(), 87.5, 0.45); P(sparkle(10, 0.8), 88.0, 0.45); P(impact(0.9), 88.6, 0.7); P(pop(), 89.0, 0.4); P(impact(0.6), 90.7, 0.5); P(chime(), 90.75, 0.45)
    P(impact(0.9), 93.6, 0.7); P(coin(1.0), 93.65, 0.55); P(coin(1.3), 93.8, 0.45)
    # O · WhatsApp group
    P(thud(), 96.0, 0.5); ticks(96.6, 101.0, 0.06, 0.18)
    for t in [96.6, 97.8, 99.4]: P(ding(), t, 0.5); P(send(), t - 0.05, 0.3)
    # P · call to action
    P(riser(1.2), 101.05, 0.35); P(impact(1.0), 102.25, 0.75); P(impact(1.1), 102.9, 0.8); P(buzzer(0.25), 103.0, 0.3)
    P(whoosh(0.35, 0.1), 106.3, 0.5); P(impact(0.6), 106.45, 0.5); P(chime(), 106.5, 0.45); P(pop(), 107.6, 0.45)
    for k in range(4): P(tick(2) * 1.2, 109.4 + k * 0.7, 0.4)
    # Q · end card
    P(impact(1.0), 112.6, 0.75); P(chime(), 112.65, 0.55); P(sparkle(14, 1.2), 112.7, 0.45)

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
