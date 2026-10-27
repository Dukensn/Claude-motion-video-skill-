"""Voice-over + ducked music + effects for the stickman demo."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
tl = json.load(open(os.path.join(B, "timeline.json")))
T = {l["id"]: l for l in tl["lines"]}
M.init(tl["duration"])

duck = M.voiceover(os.path.join(B, "timeline.json"), gain=1.0)     # narration first; returns where it speaks
M.music(M.load(os.path.join(B, "score.wav")), gain=1.6, duck=duck)  # music under it, dipping under the voice

gone = T["dark"]["a"] + 0.9 + 1 / 30                                 # the Moon vanishes (same time as film.js)
M.put(M.whoosh(0.6), gone - 0.5, 0.35)
M.put(M.boom(1.8), gone, 0.5)
M.put(M.whoosh(0.5), T["tides"]["a"] + 0.1, 0.25)                    # cut to the beach
M.waves(T["tides"]["a"], T["pull"]["a"], 0.05)
M.put(M.pop(), T["pull"]["a"] + 0.9, 0.3)                            # Moon pops onto the board
M.put(M.pop(), T["seasons"]["a"] + 0.3, 0.3)

M.finish(os.path.join(B, "premix.wav"))
