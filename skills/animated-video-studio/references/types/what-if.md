# Type: What if…

"What if we were invisible?" "What if the world was a moon?" A narrated stickman video that follows an impossible premise step by step, with real science underneath. 3–10 min (or a 60 s Short).

## Ideas (stage 1)

Roll `python3 SKILL/scripts/ideas.py whatif`, then write 10 titles of the form **"What If [subject] [change]?"** plus one line on the surprising consequence. Good ideas have: an instantly visual premise, a domino chain of consequences, and at least one counter-intuitive turn. Mix the student's interests in (football, Haiti, school, music…).

## Structure

| Part | Share | What happens |
| --- | --- | --- |
| Hook | 0–10 s | The question in big type over a striking image; the stickman notices the change. |
| First minutes | 15 % | What *you* would notice first, at human scale (in your room, your street). |
| Domino 1–3 | 50 % | Each consequence causes the next; escalate in scale (person → city → planet) and time (hour → day → year). A counter or clock on screen. |
| The twist | 15 % | The thing nobody expects — often an upside, or the problem is the opposite of what we thought. |
| Landing | 10 % | Back to the stickman and the opening image; one line that changes how we see the real world ("So tonight, look up. And say thanks."). |

## Visual toolkit

- A narrator-stickman with one recognisable accessory who *lives through* the scenario (`look: {color, hat:"band"}`).
- Time stamps as big labels ("DAY 1", "YEAR 1,000") with `GFX.label` / `TXT.title`.
- Scale changes: room → city (`BG.city`) → Earth in space (`earth`, `BG.space`).
- Graphs for every number (`GFX.bars`, `GFX.counter`).
- A beat of silence + `FX.whiteFlash` for the moment the change happens.

## Facts

Physics, biology and history must be right; what's speculative is labelled ("Most scientists think…"). Prefer one well-explained mechanism over five shallow claims.
