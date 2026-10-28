"""Voice-over + ducked score + effects for the cinematic demo."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
tl = json.load(open(os.path.join(B, "timeline.json")))
T = {l["id"]: l for l in tl["lines"]}
M.init(tl["duration"])

duck = M.voiceover(os.path.join(B, "timeline.json"), gain=1.0)
M.music(M.load(os.path.join(B, "score.wav")), gain=1.5, duck=duck)

M.roomtone(0, T["mirror"]["a"], 0.02)                     # evening street air
M.put(M.pop(), T["hook"]["a"] + 2.8, 0.25)                # her eyes light up
M.put(M.whoosh(0.6), T["mirror"]["a"] - 0.2, 0.25)        # cut to the close-up
M.put(M.whoosh(0.5), T["bounce"]["a"] + 0.4, 0.18)        # ray in
M.put(M.whoosh(0.5), T["bounce"]["a"] + 1.8, 0.18)        # ray back
M.put(M.pop(), T["sixth"]["a"] + 0.5, 0.25)
M.wind(T["night"]["a"], T["price"]["a"], 0.04)
M.put(M.boom(1.6), T["price"]["a"], 0.25)                 # the catch
M.put(M.whoosh(0.7), T["end"]["a"] - 0.3, 0.2)

M.finish(os.path.join(B, "premix.wav"))
