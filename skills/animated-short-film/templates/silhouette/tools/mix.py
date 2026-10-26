"""Sound effects + final mix for the silhouette demo."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import mixlib as M

B = os.path.join(os.path.dirname(__file__), "..", "build")
M.init(36.0)
M.put(M.load(os.path.join(B, "score.wav")), 0, 3.0)
M.roomtone(6.0, 26.0, 0.03)
M.put(M.pop(), 9.2, 0.35)            # the pin goes into the paper
M.buzzes(22.3, 3)                    # the phone vibrating
M.put(M.thump(70, 0.25, 0.5), 24.85, 0.3)   # thumb on "Decline" (1 frame after the picture)
M.finish(os.path.join(B, "premix.wav"))
