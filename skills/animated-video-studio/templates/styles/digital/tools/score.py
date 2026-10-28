"""Score for the digital demo (wordless): a bouncy plucked groove that stops dead for the error, a chase in minor,
a 'victory' sting, then a silly music-box reprise for the copy-paste ending. Times match film.js beats."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

T = timeline()
DUR = T["_duration"]

# 0–7.5 s: cheeky major groove
t = 0.2
for ch in ["C", "G", "Am", "F", "C", "G", "F", "G"]:
    if t > 7.3: break
    pick(t, ch, 0.95, vel=50); t += 0.95
for i, nm in enumerate(["G5", "C6", "E6", "G6"]):
    note("celesta", 1.5 + i * 0.12, 0.3, nm, 46)                 # the pop
note("timp", 5.0, 0.6, "C3", 60); note("timp", 6.4, 0.6, "G2", 60)  # the kicks

# 7.5–11.5 s: the error wakes — silence, a low hit, then a minor chase
note("cello", 7.6, 1.2, "C2", 64); note("timp", 8.5, 1.0, "C2", 72)
t = 9.3
while t < 11.4:
    for nm in ["A3", "C4", "E4", "C4"]:
        note("violin", t, 0.18, nm, 62); t += 0.2
pad("strings", 9.3, 2.2, "Am", vel=52)

# 11.5–15.5 s: the trap — tension rising, then the delete sting
swell("strings", 11.5, 13.8, 40, 100); pad("strings", 11.5, 2.4, "Dm", vel=46)
chord("piano", 13.9, 1.4, ["C4", "E4", "G4", "C5"], 70)
melody("celesta", 14.0, [("C6", 0.5), ("E6", 0.5), ("G6", 1.5)], beat=0.2, vel=56)

# 15.5–end: music box, copies popping in
t = 15.6
while t < DUR - 1.0:
    for ch in ["F", "C", "G", "C"]:
        if t > DUR - 1.0: break
        arp(t, 1.0, ch, vel=38, steps=8); t += 1.0
for i, at in enumerate([17.5, 17.85, 18.2, 18.55, 18.9]):
    note("celesta", at, 0.3, ["C6", "D6", "E6", "G6", "C7"][i], 50)
pedal_off(DUR - 0.2)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
