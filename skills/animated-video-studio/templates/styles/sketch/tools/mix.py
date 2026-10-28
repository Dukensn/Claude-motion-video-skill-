"""Voice-over + ducked score + effects for the sketch (history) demo."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
tl = json.load(open(os.path.join(B, "timeline.json")))
T = {l["id"]: l for l in tl["lines"]}
M.init(tl["duration"])

duck = M.voiceover(os.path.join(B, "timeline.json"), gain=1.0)
M.music(M.load(os.path.join(B, "score.wav")), gain=1.5, duck=duck)

for i in range(3): M.put(M.pop(), 0.8 + i * 0.6, 0.25)          # the ticks on the profile card
M.scratch(T["born"]["a"] + 1.0, T["born"]["a"] + 2.0, 0.08)       # pen hatching the colony
for k in ("born", "revolt", "rule"): M.put(M.thump(70, 0.4), T[k]["a"] + 0.5, 0.45)   # date stamps
M.roomtone(T["revolt"]["a"], T["rule"]["a"], 0.03)
M.put(M.boom(1.8), T["trap"]["a"] + 1.6, 0.4)
M.waves(T["tree"]["a"], T["end"]["a"], 0.05)
M.scratch(T["tree"]["a"] + 0.4, T["tree"]["a"] + 4.0, 0.05)       # the pen draws the tree
M.put(M.thump(60, 0.5), T["end"]["a"] + 3.2, 0.5)

M.finish(os.path.join(B, "premix.wav"))
