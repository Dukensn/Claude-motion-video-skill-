# Effects — `VFX` (every style: copied to assets/js/vfx.js by new-film.sh)

Catalogue modelled on StykAnimate's effect presets (github.com/Dukensn/StykAnimate-App, GPL-3); this is an independent,
small Canvas 2D version. All effects are functions of time (seeded, no randomness).

- `aura(ctx, x, y, h, t, {kind: fire|electric|shadow|holy|energy, col, k})` — around a figure (feet at x,y, height h). Draw before the figure.
- `beam(ctx, x0, y0, x1, y1, t, a, {col, width, dur, grow})` — energy beam fired at time a.
- `explosion(ctx, x, y, t, a, {size, col, smoke, debris})` — flash, fireball, shock ring, debris, smoke (3 s).
- `smoke(ctx, x, y, t, {size, col, rate, life, height, wind})` — continuous column. `sparks(ctx, x, y, t, a, {n, col, dir, spread})` — clash / hit.
- `particles(ctx, t, {kind: embers|snow|dust|magic|bubbles|leaves, area:[x,y,w,h], n, seed})` — ambience.
- `look(ctx, name, (c) => { draw… with c }, {col, k, t, alpha, r, amount, mix})` — draw anything through a look:
  `glow` `neon` `energy` `ghost` `hologram` `ice` `poison` `impact` (RGB split) `hitFlash` `teleport` (dissolve, k 0..1).
  Example: `VFX.look(ctx, "teleport", (c) => STICK.draw(c, {...}), { k: prog(t, 3, 4) })`.
- `grade(ctx, goldenHour|night|retro|dream, k)` — whole-frame grade after the shot.
