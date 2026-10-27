"""Score for the cartoon demo: a bouncy comedy groove (plucks + celesta), a 'sneaky' bassoon-like line for the
pigeon, a record-scratch stop for the discovery, a fast chase, a sad trombone-ish fall for the button."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

T = timeline()
DUR = T["_duration"]

t = 0.2
while t < 5.8:
    for ch in ["C", "F", "G", "C"]:
        if t >= 5.8: break
        pick(t, ch, 0.7, vel=52); t += 0.7
for i, nm in enumerate(["C6", "E6", "G6"]): note("celesta", 0.4 + i * 0.1, 0.3, nm, 48)
# sneaky pigeon (3–9 s): low staccato steps
t = 3.2
while t < 8.8:
    for nm in ["E2", "G2", "A2", "G2"]: note("cello", t, 0.18, nm, 60); t += 0.36
# discovery: hit
chord("piano", 9.2, 0.8, ["C3", "F#3", "C4"], 90); note("timp", 9.2, 0.8, "C2", 90)
# chase (11–13.5): fast violin runs
t = 11.0
while t < 13.4:
    for nm in ["A4", "C5", "E5", "C5"]: note("violin", t, 0.12, nm, 66); t += 0.15
note("timp", 13.5, 1.0, "G1", 100)
# button: slow sad descent, then a tiny happy sting for the pigeon
melody("cello", 15.4, [("G3", 1), ("F#3", 1), ("F3", 1), ("E3", 3)], beat=0.5, vel=62)
for i, nm in enumerate(["G5", "C6"]): note("celesta", 18.6 + i * 0.15, 0.3, nm, 50)
pedal_off(DUR - 0.2)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
