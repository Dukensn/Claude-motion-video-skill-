"""Music bed for the stickman demo. Under a voice the music stays simple and steady; the mix ducks it
under every sentence. Cues are placed at narration lines (timeline from tools/voice.py)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

T = timeline()
a = lambda i: T[i]["a"]
DUR = T["_duration"]

# hook: mysterious — celesta over a low pad
pad("pad", 0.2, a("tides") - 0.2, "Am", vel=40)
for i, nm in enumerate(["E5", "A5", "C6", "B5", "E5", "A5", "C6", "D6"]):
    note("celesta", 0.4 + i * 0.6, 1.2, nm, 44)
silence("celesta", a("dark") + 0.8)               # the Moon vanishes: the music stops for a beat
note("timp", a("dark") + 0.85, 2.0, "A2", 70)

# morning / tides: light pizzicato-like piano pulse
t = a("tides")
while t < a("tilt") - 0.5:
    for ch in ["C", "G", "Am", "F"]:
        if t >= a("tilt") - 0.5: break
        broken(t, 2.0, ch, vel=38, steps=4)
        t += 2.0

# tilt / seasons: strings swell, unsettled
pad("strings", a("tilt"), a("thanks") - a("tilt"), "Dm", vel=44)
swell("strings", a("tilt"), a("seasons") + 2, 50, 110)
note("timp", a("seasons"), 1.5, "D2", 60)

# thanks: warm resolve
pad("strings", a("thanks"), DUR - a("thanks"), "F", vel=40)
arp(a("thanks"), 2.5, "F", vel=42); arp(a("thanks") + 2.5, DUR - a("thanks") - 2.5, "C", vel=40)
melody("piano", a("thanks") + 0.3, [("A4", 1), ("C5", 1), ("F5", 2), ("E5", 1), ("C5", 3)], beat=0.4, vel=54)
pedal_off(DUR - 0.2)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
