# Type: Explainer

"How does a vaccine train your body?" A narrated stickman explainer: one concept, made clear and memorable, 2–8 minutes (or a Short).

## Ideas

Roll `python3 SKILL/scripts/ideas.py explainer`. A good explainer topic is something people use or hear about but can't explain, with one central mechanism.

## Structure

Hook question in everyday life → the wrong intuition most people have → the mechanism in 3–5 steps (one step per section) → a concrete example → what it means for the viewer → one-line summary.

## Visual rules

- One idea per shot. A whiteboard or clean flat background (`BG.room` with `board`, `BG.paper`).
- Elements appear in a **staggered cascade** to guide the eye (labels 0.2–0.4 s apart).
- Move between ideas with smooth **pan & zoom** (`cam` keyed with `E.sine`), not hard cuts.
- Use **analogies drawn literally**: the immune system as guards at a gate, interest as a snowball rolling downhill.
- Shapes **morph** to show change (`GFX.morph`), numbers count up (`GFX.counter`), processes are arrows (`GFX.arrow`).
- The stickman reacts (confused → bulb icon → happy) as a stand-in for the viewer.
