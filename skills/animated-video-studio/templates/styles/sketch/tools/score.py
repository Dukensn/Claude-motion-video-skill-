"""Score for the sketch (history) demo: a light pizzicato march for the profile card, a war drum + strings for
1791, a proud brass-like pad for 1801, a dark drop for the trap, a slow cello for the quote, a hopeful finale."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

T = timeline()
a = lambda i: T[i]["a"]
DUR = T["_duration"]

# hook + born: playful-proud march (plucks over a pad)
t = 0.3
while t < a("revolt") - 0.3:
    for ch in ["Dm", "Bb", "F", "C"]:
        if t >= a("revolt") - 0.3: break
        pick(t, ch, 1.2, vel=46); t += 1.2
pad("pad", 0.3, a("revolt") - 0.6, "Dm", vel=36)

# revolt: drums + strings, energy up
t = a("revolt")
while t < a("rule") - 0.2:
    note("timp", t, 0.3, "D2", 70); note("timp", t + 0.45, 0.3, "D2", 55); t += 0.9
pad("strings", a("revolt"), a("rule") - a("revolt"), "Dm", vel=50); swell("strings", a("revolt"), a("rule"), 55, 110)

# rule: proud, major
pad("strings", a("rule"), a("trap") - a("rule"), "F", vel=48)
melody("violin", a("rule") + 0.3, [("F5", 1), ("A5", 1), ("C6", 2), ("Bb5", 1), ("A5", 2)], beat=0.38, vel=60)

# trap: silence, a low hit, tense tremolo
silence("strings", a("trap")); silence("violin", a("trap"))
note("cello", a("trap") + 1.6, 2.5, "D2", 66); note("timp", a("trap") + 1.6, 1.4, "D2", 80)
pad("trem", a("trap") + 1.8, a("tree") - a("trap") - 1.8, "Dm", vel=44)

# tree: the quote — solo cello, then strings swell
melody("cello", a("tree") + 0.2, [("D3", 2), ("F3", 1), ("A3", 2), ("G3", 1), ("F3", 3)], beat=0.55, vel=58)
pad("strings", a("tree") + 2.0, a("end") - a("tree") - 2.0, "Bb", vel=40)

# end: hopeful finale for 1804
pad("strings", a("end"), DUR - a("end"), "F", vel=46); swell("strings", a("end") + 2.5, DUR - 0.5, 50, 110)
arp(a("end") + 2.6, DUR - a("end") - 2.8, "F", vel=46, steps=12)
pedal_off(DUR - 0.2)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
