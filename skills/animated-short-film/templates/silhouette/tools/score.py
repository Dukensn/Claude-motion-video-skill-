"""Score for the silhouette demo (36 s): warm nylon guitar, a music-box theme, strings on the last card."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

pedal(0.4); note("piano", 0.5, 4.0, "G4", 32)
for i, ch in enumerate(["C", "Am", "F", "G"]):                 # pinning the list / the list
    pick(6.0 + i * 3.0, ch, 3.0, vel=50)
melody("box", 12.4, [("E5", 1), ("G5", 1), ("C6", 2), ("B5", 1), ("G5", 3)], beat=0.5, vel=52)
pick(18.0, "F", 4.0, vel=44)                                   # dusty guitar: hold back
note("piano", 22.0, 4.0, "A3", 34); note("piano", 22.0, 4.0, "E4", 30)   # the declined call: almost nothing
pad("strings", 26.0, 10.0, "F", vel=40); swell("strings", 26.0, 30.0, 45, 100)
arp(26.0, 5.0, "F", vel=42); arp(31.0, 5.0, "C", vel=40)
melody("piano", 26.6, [("A4", 1), ("C5", 1), ("F5", 2), ("E5", 1), ("C5", 3)], beat=0.5, vel=56)
pedal_off(35.8)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
