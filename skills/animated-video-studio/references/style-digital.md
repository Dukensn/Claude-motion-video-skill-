# Digital style — engine reference (`DIGI`, on the stickman engine)

A faceless coloured stick figure inside software. STICK poses / walk / run / posesAt, WORLD.FX (impact, speedLines,
icon, flash) and WORLD.cam all work.

- `DIGI.stick(ctx, {x, y, s, dir, pose, col, t, seed})` → joints. One hero colour per film (e.g. `#00b4d8`); s 0.6–1.0 inside UIs.
- Worlds:
  - `sheet(ctx, {file, formula, data:{"B2": 931…}, sel:[c0,r0,c1,r1], selCol, hide:{ref:1}, cw, ch, x0, y0, brand})` → `{cell(c,r), rect(c,r)}`; grid lines at `y0 + r*ch`, `x0 + c*cw` (defaults 170/52, 70/160).
  - `code(ctx, {lines, x, y, size, caret:[line,col], out, title, t})` → `{lineY(i), x0, lh, charW}` — syntax-coloured editor + output panel; `typed(text, t, a, cps)` for typing.
  - `desktop(ctx, {wall0, wall1, icons, clock})`, `win(ctx, x, y, w, h, title)` → content rect, `icon(ctx, x, y, name)`.
  - `level(ctx, {scroll, bg, line, blocks:[[x,y,w,h]], spikes:[[x,y]], orbs, portals:[[x,y,col]], ground})` → ground y — a neon platform level.
- Props & villains: `cell(ctx, x, y, text, angle)`, `errorBox(ctx, x, y, text, angle, {eyes, look, s})`, `cursor(ctx, x, y, s, {click 0..1, hand})`.
- Effects: `pixels(ctx, x, y, t, at, {n, cols, life})` (square burst), `glitch(ctx, k, seed)` (slice + RGB, after the shot).

Patterns: the user's cursor as a god; each software rule becomes a gag (copy-paste clones, delete as a weapon);
on-screen key names ("Ctrl + V") as captions. Demo: `templates/styles/digital/assets/js/film.js`.
