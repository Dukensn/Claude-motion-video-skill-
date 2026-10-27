"""Score for the demo film (36 s). Rewrite the cues for every film; every time is film seconds.
Arc: hush on the cold open, sparse piano under the room, tension under the antagonist,
then the theme opens up on the closing line and resolves on the title."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

# cold open: two soft notes under the two lines
pedal(0.4); note("piano", 0.5, 3.0, "A4", 34); note("piano", 2.4, 3.4, "E4", 30)

# room + phone: broken chords, quiet, slow (one chord ≈ 3.5 s)
end = progression(6.0, ["Am", "F", "C", "G"], 3.6, vel=40, steps=6)   # -> 20.4

# antagonist: low strings swell, the piano holds one note
pad("cello", 20.4, 7.0, "Am", vel=44)
swell("cello", 20.4, 26.0, 40, 100)
note("piano", 22.0, 4.0, "E3", 36)
silence("cello", 27.8)

# closing line: the theme on piano over strings
pad("strings", 28.0, 8.0, "F", vel=40); swell("strings", 28.0, 31.0, 50, 95)
arp(28.0, 4.0, "F", vel=44)
melody("piano", 28.4, [("A4", 1), ("C5", 1), ("E5", 2), ("D5", 1), ("C5", 3)], beat=0.45, vel=58)
arp(32.0, 4.0, "C", vel=40)
note("piano", 32.0, 4.0, "C5", 50)
pedal_off(35.8)

write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
