# Cartoon style — engine reference (`TOON`, on the stickman engine)

Chunky comedy characters with thick black outlines, big heads, big eyes; flat bright sets; comic effects. Bodies use
the stickman skeleton: STICK.P poses, walk, run, posesAt, tweak all work. Vertical Shorts by default (`SHORT` marker).

- `TOON.fig(ctx, {x, y, s, dir, pose, look, face, hold, t})` → joints (+ `headC`, `headR`). s 1.3–1.9.
  `look = {skin, shirt, pants, shoes, build:'normal'|'wide'|'kid'|'tall', hair:'short'|'spiky'|'long'|'bun'|'curly'|'bald', hairCol,
  hat:'chef'|'cap'|'beanie'|'helmet'|'tophat'|'crown'|'bandana'|'mask', hatCol, mustache, beard, glasses, apron, tie, stripes}`.
  `face = {mood: neutral|happy|laugh|smug|angry|sad|cry|scared|surprised|confused|tired|sneaky, look:[x,y], talk 0..1, sweat, tear, blush, dizzy}`.
  `hold = 'baguette'|'bat'|'phone'|'cup'|'croissant'|{kind:'sign', text}`.
- Animals & props: `pigeon(ctx, x, y, s, {dir, fly, t, mood:'sneaky', croissant, look})`, `croissant`, `lamp(ctx, x, y, s)`, `stall(ctx, x, y, s, {sign, col})`.
  Invent more in your film's sets.js with `TOON.blob(ctx, fill)` and `TOON.tube(ctx, pts, w, col)` so they share the outline.
- Sets: `sky(ctx, {top, bottom, clouds, seed})`, `ground(ctx, y, {col, path})`.
- Comedy FX: `pow(ctx, "BONK!", x, y, t, a, {dur, col, textCol, size})`, `arcs(ctx, x, y, r, a0, a1)` (swing lines), `dust(ctx, x, y, t, a)`, `star`, `dizzy`,
  `say(ctx, text, x, y, t, a, b, {tail:[x,y], size, cps})` (typing speech bubble; screen coordinates — draw after `ctx.restore()`).

Patterns: hold still 0.5 s before the disaster, then hit; cut to the reaction; a sound on every action (FILM.events() → mix.py).
Demo: `templates/styles/cartoon/assets/js/film.js`.
