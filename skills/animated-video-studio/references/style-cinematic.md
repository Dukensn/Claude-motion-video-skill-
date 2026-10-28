# Cinematic style — engine reference (`CINE`, on the stickman engine)

Black-headed stick figures in coloured clothes, lit by a **rim light** (a bright edge on one side), dusk and night
palettes, depth of field (blurred layers), slow camera pushes, extreme close-ups, data on screen. Everything in
`style-stickman.md` still works (STICK poses, walk/run/posesAt, WORLD.cam, FX, GFX, TXT subtitles/titles).

- `CINE.fig(ctx, {x, y, s, dir, pose, look, face, rim, alpha, t})` → joints. `look = {top, pants, hat:'cap'|'beanie', hatCol, hair:'bun'|'curly'|'spike', glasses, glassesCol, coat, hood:false}`;
  `face = {mood: neutral|happy|sad|angry|scared|surprised|tired|smug|determined, look:[x,y], glow (cat-eyes)}`; `rim = {col, side: -1 light from the left | 1 from the right}`.
  Use s 1.4–1.9 in medium shots (the reference channels frame characters big).
- `CINE.bust(ctx, x, y, R, {look, rim, face, dir, t})` — close-up head and shoulders (R 120–300).
- Sets: `sky(ctx, {top, mid, bottom, horizon, sun:{x,y,r}, clouds, t})` (dusk gradient + sun rays), `city(ctx, y, {blur, col, seed, h, lights})`,
  `street(ctx, y, {lamps:[x…], lampOn, tree, ground, rail})`, `lamp(ctx, x, y, on)`, `room(ctx, {window:[x,y,w,h], desk:[x,y], wall, floor, floorY})`,
  `pitch(ctx, y, {goal, lights:[x…]})` (sports field + floodlights).
- Light & lens: `bokeh(ctx, n, seed)`, `dof(ctx, px, (c) => {...draw with c})` (draw anything blurred — drawn at 1/4 resolution, fast; always draw with the `c` it gives you), `cone(ctx, x, y, w, h, col)`,
  `grade(ctx, {vignette, grain, tint, dark, frame})` — call after the shot, before subtitles.
- Data: `stat(ctx, text, x, y, t, a, b, {size, col})`, `stopwatch(ctx, x, y, r, v)`, `scoreboard(ctx, x, y, a, b, {s})`,
  `compare(ctx, x, y, w, [{label, v 0..1, col, text}], k, {gap})`.

Patterns: wide establishing shot → medium → extreme close-up on the reveal; a second character blurred in the
background (`dof`); one warm light (sunset/lamp) vs one cold (moon/screen); numbers on screen when narrated.
Demo: `templates/styles/cinematic/assets/js/film.js`.
