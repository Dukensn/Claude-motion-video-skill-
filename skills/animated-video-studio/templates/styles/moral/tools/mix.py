"""Score + effects for the moral demo (bean engine, no voice). Times from FILM.events() → build/events.json."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
ev = json.load(open(os.path.join(B, "events.json")))
M.init(30.0)
M.music(M.load(os.path.join(B, "score.wav")), gain=1.7)
M.roomtone(4.0, 25.0, 0.025)
M.wind(4.0, 25.0, 0.02)                                    # rain on the window
for t in ev.get("swipe", []): M.put(M.whoosh(0.18), t, 0.08)
for t in ev.get("whisper", []): M.put(M.breath(1.6), t, 0.3)
for t in ev.get("ring", []):
    for k in range(3): M.put(M.buzz(0.4), t + k * 0.9, 0.25)
M.finish(os.path.join(B, "premix.wav"))
