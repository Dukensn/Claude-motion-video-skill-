"""Clean voice: drop the repeated Facebook Ads take (52.8-67.5), trim lead-in, denoise, level."""
import subprocess, json
C = [(4.9, 52.80), (67.55, 77.45), (77.75, 131.3)]
GAP = 0.15
parts = []; plan = []; t = 0
for i, (a, b) in enumerate(C):
    o = f"build/p{i}.wav"; d = b - a
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-t", str(d), "-i", "in/voix.m4a", "-vn", "-ac", "2", "-ar", "48000",
                    "-af", f"afade=t=in:d=0.02,afade=t=out:st={d-0.04:.3f}:d=0.04", o], check=True)
    parts.append(o); plan.append({"in": a, "out": b, "at": round(t, 3)}); t += d + GAP
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-t", str(GAP), "-i", "anullsrc=r=48000:cl=stereo", "build/gap.wav"], check=True)
open("build/lst.txt", "w").write("".join(f"file '{p.split('/')[1]}'\nfile 'gap.wav'\n" for p in parts))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/lst.txt",
                "-af", "highpass=f=75,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-1.5:LRA=9",
                "-ar", "48000", "assets/audio/voice.wav"], check=True)
json.dump(plan, open("build/plan.json", "w"))
print("total", round(t, 2), plan)
