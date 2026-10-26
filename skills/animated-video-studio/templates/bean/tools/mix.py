"""Sound effects + final mix for the demo film. Effects are filtered noise and thumps tied to on-screen actions."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
M.init(36.0)
M.put(M.load(os.path.join(B, "score.wav")), 0, 3.0)   # the score carries the film: boost it

M.roomtone(6.0, 28.0, 0.035)                            # quiet air under the bedroom
ev = json.load(open(os.path.join(B, "events.json")))   # typing times exported from FILM.events()
M.taps([t for t, kind in ev["taps"]], 0.18)
M.put(M.breath(1.8), 23.0, 0.5, -0.4)                   # the antagonist's whisper
M.put(M.whoosh(0.7), 27.3, 0.25)                        # into the black

M.finish(os.path.join(B, "premix.wav"))
