# Type: Action / fight

Fast stickman action: a chase, a duel, a tournament, a heist. Usually wordless (music + sound effects + a few captions), 1–4 minutes. Inspired by classic stick-fight animation: clean lines, readable poses, hard contrast.

## Ideas

Roll `python3 SKILL/scripts/ideas.py action`. An action idea needs: a place with things to use (rooftops, a train, a dojo), a rival with a clear difference (bigger, faster, a copy), a limitation for the hero, and small, human stakes (a kid's kite matters more than "the world").

## Choreography beats

1. **Setup** (10 %) — the place, the stakes, the two fighters facing each other (`guard`), a beat of stillness.
2. **First exchange** — 3–5 moves, hero loses ground (`punch`, `block`, `hit`).
3. **Escalation** — the environment joins in (a pipe, a ledge, the train roof); speed lines, camera follows.
4. **Low point** — hero down (`fall`, `lie`), rival wins; music drops.
5. **Comeback** — he uses his limitation or the place cleverly (set up in beat 1!).
6. **Finisher** — one big move with impact flash, then a quiet landing and a small human moment (handshake, the kite returned).

## Animation rules

- Key poses held 4–8 frames, fast transitions (`posesAt` with 0.08–0.15 s between keys; ease `E.out3`), anticipation before every hit (wind-up 0.15–0.25 s).
- Impacts: `FX.flash` (colour inversion, 1–2 frames) + `FX.impact` star + `FX.shake` + a `punch()` sound one frame after.
- Speed: `FX.speedLines`, `STICK.trail` for motion blur ghosts, `FX.focusLines` for the big moment.
- Readability: one action at a time, silhouettes clear (dark figures on light sets or vice versa), fighters in different accent colours.
- Camera can move here: quick pushes on impacts, a slow-motion beat before the finisher (play `t` slower inside the shot: `const tt = a + (t - a) * 0.35`).
