"""Score for the moral demo: a lonely felt-piano loop at 3 AM, a detuned pad for the temptation, a warm
string lift when he calls back, a soft resolve under the title."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from scorelib import *

DUR = 30.0
progression(0.4, ["Am", "F", "C", "G"], 2.0, vel=34, steps=4)
t = 8.4
while t < 19.3:
    broken(t, 2.2, ["Am", "F", "C", "E"][int((t - 8.4) / 2.2) % 4], vel=34, steps=4); t += 2.2
pad("pad", 9.0, 5.0, "Dm", vel=40)                       # the temptation
pad("cello", 14.0, 5.4, "A", vel=38)
note("celesta", 20.4, 0.6, "E6", 46); note("celesta", 20.6, 0.6, "A6", 46)
pad("strings", 20.5, 4.5, "F", vel=44); swell("strings", 20.5, 25.0, 45, 100)
melody("piano", 21.0, [("A4", 1), ("C5", 1), ("E5", 2), ("D5", 1), ("C5", 3)], beat=0.45, vel=52)
pad("strings", 25.0, DUR - 25.0, "C", vel=40)
melody("piano", 27.8, [("E5", 1), ("G5", 1), ("C6", 3)], beat=0.5, vel=50)
pedal_off(DUR - 0.2)
write(os.path.join(os.path.dirname(__file__), "..", "build", "score.mid"))
