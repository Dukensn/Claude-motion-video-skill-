"""Score + effects for the digital demo (no voice). Effect times come from FILM.events() (build/events.json)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
tl = json.load(open(os.path.join(B, "timeline.json")))
ev = json.load(open(os.path.join(B, "events.json")))
M.init(tl["duration"])

M.music(M.load(os.path.join(B, "score.wav")), gain=1.6)
for t in ev.get("click", []): M.put(M.key_tap(0), t, 0.5)
for t in ev.get("pop", []): M.put(M.pop(), t, 0.35)
for t in ev.get("hits", []): M.put(M.punch(), t, 0.55)
for t in ev.get("whoosh", []): M.put(M.whoosh(0.4), t - 0.15, 0.2)
for t in ev.get("del", []): M.put(M.boom(1.0), t, 0.4)
M.put(M.thump(80, 0.4), 9.3, 0.5)                         # the error lunges (glitch)

M.finish(os.path.join(B, "premix.wav"))
