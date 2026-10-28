"""Score for the cinematic demo: a soft cinematic bed (pad + felt piano), a lift when the night opens up,
a hollow beat for "the price", a warm resolve. Cues read from the narration timeline (tools/voice.py)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

T = timeline()
a = lambda i: T[i]["a"]
DUR = T["_duration"]

# hook → sixth: mysterious, slow broken chords over a pad
pad("pad", 0.3, a("night") - 0.3, "Am", vel=42)
progression(0.4, ["Am", "F", "C", "G"], 2.4, vel=36, steps=4)
t = 0.4 + 4 * 2.4
while t < a("night") - 0.5:
    broken(t, 2.4, ["Am", "F", "C", "G"][int((t - 0.4) / 2.4) % 4], vel=36, steps=4); t += 2.4
for i, nm in enumerate(["E6", "A5", "C6", "B5"]):
    note("celesta", a("mirror") + 0.2 + i * 0.5, 0.6, nm, 38)

# night: the world opens — strings swell, arpeggios speed up
pad("strings", a("night"), a("price") - a("night"), "F", vel=46)
swell("strings", a("night"), a("price"), 50, 105)
arp(a("night"), a("price") - a("night"), "F", vel=44, steps=12)

# price: everything drops to one low note
silence("piano", a("price")); silence("strings", a("price"))
note("cello", a("price"), a("end") - a("price"), "A2", 52)

# end: warm resolve
pad("strings", a("end"), DUR - a("end"), "C", vel=40)
melody("piano", a("end") + 0.4, [("E5", 1), ("G5", 1), ("C6", 2), ("B5", 1), ("G5", 3)], beat=0.42, vel=50)
pedal_off(DUR - 0.2)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
