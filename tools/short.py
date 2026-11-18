"""Short cut (about 65 s), starting at the invitation. Same picture as the long film, cut at voice pauses;
voice + effects follow the cuts, the music runs continuously underneath."""
import json, subprocess, numpy as np, wave, sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mixlib as M
SR = M.SR
CUTS = [(24.78, 43.45), (50.5, 60.4), (66.14, 70.38), (75.25, 95.45), (102.25, 114.5)]
def ld(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, w.getnchannels())
voice = ld("assets/audio/voice.wav"); voice = (voice if voice.shape[1] == 2 else np.repeat(voice, 2, 1)) * 1.8
sfx = np.load("build/sfx.npy")
voice = np.concatenate([voice, np.zeros((max(0, len(sfx) - len(voice)), 2), np.float32)])
music = ld("build/score.wav")
F = int(0.012 * SR)
def seg(x, a, b):
    y = x[int(a * SR):int(b * SR)].copy()
    if len(y) > 2 * F: y[:F] *= np.linspace(0, 1, F)[:, None]; y[-F:] *= np.linspace(1, 0, F)[:, None]
    return y
v = np.concatenate([seg(voice, a, b) for a, b in CUTS]); e = np.concatenate([seg(sfx, a, b) for a, b in CUTS])
D = len(v) / SR
m = music[: len(v)].copy(); k = int(2.0 * SR); m[-k:] *= np.linspace(1, 0, k)[:, None]
env = M.lp(np.abs(v[:, 0]), 0.002); env /= env.max() + 1e-9
act = M.lp((env > 0.04).astype(np.float32), 0.0006); duck = 1 - 0.55 * np.clip(act * 1.6, 0, 1)
out = v + e + m * duck[:, None] * 0.2
out /= max(1.0, np.abs(out).max() / 0.98)
w = wave.open("build/short_pre.wav", "w"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/short_pre.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", "build/short_mix.wav"], check=True)
# picture: the same cuts from the long render
src = sys.argv[1]
parts = []
for i, (a, b) in enumerate(CUTS):
    o = f"build/sc{i}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{b-a:.3f}", "-i", src, "-an", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "30", o], check=True)
    parts.append(o)
open("build/sc.txt", "w").write("".join(f"file '{p.split('/')[1]}'\n" for p in parts))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/sc.txt", "-i", "build/short_mix.wav", "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "renders/atelye-ai-pub-5desanm-kout.mp4"], check=True)
print("short", round(D, 2), "s")
