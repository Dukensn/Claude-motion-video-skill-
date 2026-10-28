"""Score + cartoon sound effects for the cartoon demo (times from FILM.events() → build/events.json)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
tl = json.load(open(os.path.join(B, "timeline.json")))
ev = json.load(open(os.path.join(B, "events.json")))
M.init(tl["duration"])

M.music(M.load(os.path.join(B, "score.wav")), gain=1.6)
for t in ev.get("pop", []): M.put(M.pop(), t, 0.4)
for t in ev.get("flap", []): M.put(M.whoosh(0.35), t, 0.3)
for t in ev.get("grab", []): M.put(M.pop(), t, 0.5)
for t in ev.get("gasp", []): M.put(M.whoosh(0.25), t, 0.4)
for t in ev.get("whoosh", []): M.put(M.whoosh(0.4), t, 0.4)
for t in ev.get("bonk", []): M.put(M.punch(), t, 0.8); M.put(M.thump(140, 0.3, 0.9), t + 0.02, 0.4)
for t in ev.get("crunch", []): M.put(M.key_tap(1), t, 0.6); M.put(M.key_tap(2), t + 0.06, 0.5)
for a, b in ev.get("talk", []):          # cartoon mumble for the speech bubbles
    k = a
    while k < b: M.put(M.buzz(0.08), k, 0.08); k += 0.11

M.finish(os.path.join(B, "premix.wav"))
