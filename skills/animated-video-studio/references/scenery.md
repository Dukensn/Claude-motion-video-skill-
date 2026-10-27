# Sets and camera — `SCENE`, `CAM`, `TRANS` (every style: `assets/js/scenery.js`)

Pure functions; work on the stickman and bean engines alike. `o.time` picks a palette from `SCENE.PAL`
(`dawn day dusk night storm`: top, mid, hor, far, light, amb).

- `sky(ctx, {time, horizon, sun:{x,y,r}, moon:{x,y,r}, clouds, stars, seed, t})` — gradient, glow, shaded drifting clouds, stars.
- `mountains(ctx, y, {time, layers, height, snow, col, seed})` — ranges with atmospheric perspective and shaded faces.
- `city(ctx, y, {time, layers, height, lit 0..1, col, seed})` — skyline with windows (lit at dusk/night), rooftop details.
- `street(ctx, y, {time, facades:[…], awning:[c1,c2], lamps:[x…], scroll, seed})` — eye-level street: facades, windows, doors,
  awnings, sidewalk, curb, road with lines. `scroll` slides it for walking/driving shots.
- `ground(ctx, y, {kind: grass|sand|asphalt|dirt|snow|tiles, detail, scroll})` — textured ground.
- `tree(ctx, x, y, s, {kind: round|pine|palm, leaf, season, fruit, t})`, `forest(ctx, y, {rows, time, kind, leaf, s, t})`.
- `water(ctx, y, {time, col, reflect:{x, w}, t})` — sea/lake with moving highlights and a light reflection.
- `room(ctx, {kind: bedroom|kitchen|classroom|office, time, wall, floor, floorY, window:[x,y,w,h], curtain, lamp, lampX, frame})` —
  detailed interior: floorboards, skirting, window with the outside (sky + city), curtains, shelf with books and a plant,
  furniture per kind, window light and lamp light pools.
- `market(ctx, y, {stalls, seed})` — Caribbean market stalls with fruit and fabrics; `taptap(ctx, x, y, s, {col, text, dir})` — a painted tap-tap.
- Atmosphere: `fog(ctx, y, h, col, a)`, `rays(ctx, x, y, {angle, spread, n, col, len, t})`, `light(ctx, time, k)` (tint characters into the scene's light),
  `parallax(ctx, camX, depth, fn)`, `mix(c1, c2, k)`.
- Camera: `CAM.move(ctx, lt, [[t, cx, cy, zoom, rot?, ease?], …])`, `CAM.handheld(t, amp, seed)` → [dx,dy], `CAM.shake(t, at, dur, amp)` → [dx,dy].
- Transitions (end of renderAt): `TRANS.dip(ctx, t, at, d, col)`, `flash`, `iris(ctx, t, at, d, x, y)`, `wipe`, `whip`.

Build anything missing in the film's `sets.js` with the same helpers (shaded shapes, outlines, gradients) so it matches.
