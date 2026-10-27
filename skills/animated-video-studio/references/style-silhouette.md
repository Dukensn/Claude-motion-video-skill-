# Silhouette style — engine reference

Solid black figures with a soft grey rim light, big white eyes, grey brows and coloured sneakers, on flat, softly graded sets (light greys, warm sunsets). Interstitial cards in italic EB Garamond on black; floating dialogue in white Comic Neue over a blurred dark band. Calm, warm, a little melancholy. Script order: core → fx → sil → flat → (your sets) → film.

Shared helpers from **F** and **X** are the same as the bean style (`prog key step win E hash noise1 mulberry`, `post`, `narr`, `hand`, `bubble`). The demo film.js defines three local helpers you keep:
- `card(ctx, lines, t, a, b, {size (≥64), stagger})` — italic serif lines on black.
- `speak(ctx, text, x, y, t, a, b, {size (≥56), color})` — floating dialogue.
- `bokehBg(ctx, warm)` — blurred background for phone shots.
- `cam(ctx, cx, cy, z)`.

**SIL (sil.js)**
- `sil(ctx, P)` — full figure. `P = {x, y (feet), s (scale; 0.7 for a child), kind:'noah'|'dad' (dad: cap, heavier, older), pose:'stand'|'sit', face:-1..1, walk (phase), lean, tilt, armL:[a1,a2], armR:[a1,a2], legDir, legDrop, e, cane, band, shoes (colour), alpha, noBlink, noShadow}`. `P.out` gives hand/head points.
- `close(ctx, x, y, r, e, {cap, seed, noBlink})` — head-and-shoulders close-up.
- `e = {eyes:'open'|'wide'|'half'|'happy'|'teary'|'closed', look:[x,y], brow, browUp, smile, mouth:'oh', tear, lid, mustache}`.
- New characters: vary `kind`, `s`, `shoes`, `cap`/`band`; for a woman or a kid with a different head shape, copy `sil()` into `sets4.js` and change the head/hair path — keep the black fill + rim.

**FLAT (flat.js)** — `apartment({dust 0..1, lamp, night, kitchenLight, photo})`, `guitar`, `list({items, reveal 0..1, crossed:[0..1,…]})` (a pinned "SOMEDAY" list — change its heading by copying it), `phone(ctx, cx, cy, sc, rot, {mode:'call'|'text'|'active'|'lock', date, input, msgs, timer})`, `thumb(ctx, x, y)` (pointing silhouette thumb), `calendar(ctx, checked, {title})`, `fretboard(ctx, chord, {k, day, lamp})` + `CHORDS`, `dadHouse({car})`, `carSide(ctx, x, y, s, {color, guitar})`, `road(ctx, t, {mode, car})` (sunset drive), `beach(ctx)`, `windowSky`, `glow(ctx,x,y,r,rgba)`, `grad`, `rr`, `txt`.

## Patterns

- Wide shot → close-up → object insert (phone, list, calendar) → card. Cards between acts (every 40–60 s).
- Warmth tells time: cool greys for the "someday" life, warm oranges at the turn and the ending.
- Read `SKILL/examples/someday/film.js` for the full film.
