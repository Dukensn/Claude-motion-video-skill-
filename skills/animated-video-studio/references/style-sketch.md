# Sketch style — engine reference (`SKETCH`, on the stickman engine)

Ink on parchment: wobbly pen lines that boil 8×/s, hatching for shade, period costumes, maps, red accents, stamps
and "profile cards". STICK poses, walk/run, WORLD.cam, WORLD.PROP.fire, GFX.arrow work.

- Pen: `line(ctx, pts, w, col, seed, amp)`, `hatch(ctx, poly, {angle, gap, col})`; colours `SKETCH.INK`, `SKETCH.RED`.
- Paper: `paper(ctx, {c0, c1, seed})` (call first), `age(ctx, k)` (burnt-edge vignette, after the shot).
- People: `fig(ctx, {...STICK.draw options, costume, col, hatCol})` → joints. costume: `general` (bicorne, sash, epaulettes), `soldier`, `tricorn`, `pirate`,
  `roman` (+`helmet:true`), `knight`, `pharaoh`, `samurai`, `king`, `queen`, `peasant`, `scholar` — add more in your film's sets.js (same `line()` pen).
  `bicorne(ctx, x, y, s, col, dir)`, `crowd(ctx, x0, x1, y, {n, rows, s, dir, costume, col, hold, every, pose (name or fn(i,row)), mood, t})`.
- Scenery: `mountains(ctx, [[x, baseY, w, h]], {fill})`, `ground(ctx, y)`, `building(ctx, 'temple'|'fort'|'palace'|'house', x, y, s)`, `ship(ctx, x, y, s, {flag})`, `sea(ctx, y)`,
  `tree(ctx, x, y, h, k 0..1 drawn, {roots, leaf})`.
- Maps: `map(ctx, {x, y, s, land:[poly…], regions:[{poly, k, col}], routes:[{pts, k, col}], labels:[[text, x, y, size, col]], sea})` — draw your own coastline polygons.
- Titles & humour: `card(ctx, "NAME\nNAME", ["trait", …], x, y, t, a, {size, tx, ty, step})` (ticks appear one by one), `stamp(ctx, "1791", x, y, t, a)`, `banner(ctx, text, x, y, w, {rot})`.

Patterns: open on the profile card; a map + date stamp for every jump in time; costumes from the right period;
a crowd = an army or a people. Demo: `templates/styles/sketch/assets/js/film.js`.
