# Bean style — engine reference

Cream round-headed "bean" characters with dark clothes, drawn in hand-sketched lines that **boil** (re-jitter 12×/s) on dark line-art rooms. One accent colour per film (amber, red, yellow…). An emotion is personified as a glowing figure (Pride: black shape, amber neon edge, crown; Forgetting: pale dashed ghost). Narration in Comic Neue, the antagonist's voice in amber handwritten Caveat.

Canvas is 1920×1080. Coordinates below are canvas pixels before camera transforms. Script order in `index.html`: core → chars → props → fx → sets2 → sets3 → kit → (your sets4) → film.

## Globals

**F (core.js)** — `W, H, PAL, FONT, G` (G.t / G.frame / G.boil are set by renderAt), `clamp, lerp`,
`E` easings: `lin in2 out2 io2 in3 out3 io3 out5 sine back spring`,
`prog(t,a,b,ease)` → 0..1 over [a,b]; `key(t, [[t0,v0],[t1,v1,ease],…])` keyed value; `step(t,[[t,"state"],…])`; `win(t,a,b,fadeIn,fadeOut)` → 0..1 window;
`hash(a,b,c)`, `noise1(x,seed)`, `mulberry(seed)` (deterministic randomness — never Math.random);
sketch drawing: `skLine(ctx, pts, {w,color,seed,amp})`, `skShape(ctx, pts, fill, opt)`, `skRect/skRR/skEll`, `rectPts/rrPts/ellPts`, `blob`, `jit`.
`PAL`: bg bg2 fill fill2 line lineDim ink cream creamShade hoodie hoodieDark amber amberHot white grey blue red cardigan tear.

**C (chars.js)**
- `drawPerson(ctx, P)` — full body. `P = {x, y (feet line), s (scale ~1.1), kind (look name), pose:'stand'|'sit', face:-1..1 (turn), lean, tilt, armL:[a1,a2], armR:[a1,a2] (shoulder/elbow angles, radians), legDir, legDrop (sit), walk (phase, animate with t), breathe, e (expression), phone:{hand:'R'|'L', glow, rot, dx}, hood, scarf, cane, lit (0..1 light from front), flip, seed}`. After drawing, `P.out.L / P.out.R / P.out.head` hold screen points (attach props to hands).
- `drawHead(ctx, cx, cy, r, e, o)` — close-ups (r 150–300). `o = {kind, tilt, lit, litX, squash, hood, seed}`.
- expression `e = {eyes:'dot'|'wide'|'half'|'happy'|'teary'|'closed', look:[x,y] (-1..1), brow (-1 angry … 1 sad), browUp, mouth:'flat'|'small'|'smile'|'grin'|'frown'|'open'|'oh'|'wobble'|'cry', tear (0..1 running tears), blush, sweat, squint, lid, noBlink}`. Blinking is automatic.
- `drawPride(ctx, x, y, {alpha, s, grin, look, lean, angry, reach:[a1,a2], crown, crownLift, crownRot, dissolve})` — the personified emotion. Recolour or reshape it for a new antagonist by copying it into your own `sets4.js` (e.g. Fear: blue edge, no crown, many eyes).
- `C.LOOKS` — character looks. Existing: theo, mom, leoYoung, leoOld, maeYoung, maeOld, dad, dadGrey, lilyKid, lilyTeen, lily. **New character** (top of film.js):
  ```js
  C.LOOKS.nora = { body: "#7a4e6b", pants: "#2c2f38", seed: 71, hr: 62, tH: 92, shW: 42, hipW: 46, detail: "sweater", hair: "long", hairC: "#3b2a22" };
  ```
  fields: `body pants` colours, `seed` (unique), `hr` head radius, `tH` torso height (kids ~66), `shW hipW`, `detail: hoodie|buttons|jacket|sweater`, `hair: messy|sides|long|pigtails|ponytail`, `hairC`, `bun, fringe, ribbon, glasses, mustache, wrinkles, stubble`.

**Pr (props.js)** — `theoRoom({clock, lamp 0..1, dark, rain, noodles, photoGlow, pillow})` bedroom with seven-segment clock; `kitchen({mode:'night'|'past'|'day', lamp, steam, table})`, `table`, `bowl`, `steam`, `photoFrame`, `moonWindow(x,y,w,h,{moon,rain,day,sky})`, `sevenSeg`, `lamp`, `noodleCup`;
`phone(ctx, cx, cy, scale, rot, st)` — chat app: `st = {msgs:[{who:'me'|'mom'|…, text, ts}], header, status, input, caret, typing, kb (keyboard), pressed, sendHot, receipt, clock, placeholder}`; lock screen `{screenOn, lockTime, lockDate, notif, notifTitle, notifText}`; call screen `{call:0..1, callLabel}`; `phoneHand(...)`.

**X (fx.js)**
- `narr(ctx, lines, t, a, b, o)` — narration caption, words reveal with blur, visible over [a,b]. `lines = [{text, size (≥58), weight, color, delay}]`, `o = {y (default 935), x, center, cy, gap, align}`.
- `hand(ctx, text, x, y, t, a, b, {size, rot, color, glow, cps, align})` — the antagonist's handwritten voice.
- `bubble(ctx, text, x, y, t, a, b, {size (≥44), tail:[x,y], fill, color, typeDur})` — speech bubble.
- `hud(ctx, h)` — top-left counter (use `KIT.hudFrom` to build `h`).
- `post(ctx, {black 0..1, vignette, grain, bars})` — film look; `sepia(ctx, k)` for flashbacks; `setFont`.

**S2 (sets2.js)** — `park({season:'spring'|'summer'|'autumn'|'winter', mode:'present'|'past', lamp})` + `bench(ctx,'back'|'front',{…})` (characters sit between the two layers); `livingRoom({night, lamp, photoFade})`, `armchair`, `sideTable`, `teacup`, `weddingPhoto`, `hallway`; `thread(ctx, a, b, alpha, sag, {w, glow, k})` (red thread); `drawForget(ctx,x,y,{alpha,s,reach})`; `fog(ctx,k)`; `petals(ctx, n, color, {snow, wind, seed})`; sketchbook: `sketchbook`, `pencilPortrait`, `pageText`, `pencilHand`.

**S3 (sets3.js)** — `note(ctx, x, y, w, h, rot, lines, {k, size, ink, paper, doodle, heart, crumpled})` (napkin/sticky note), `heart`, `doodle`, `lunchbox({open, note, color})`, `cafeteria`, `lockers`, `trashcan`, `street`, `car({color, lights, boxes})`, `shoebox({count})`, `drawer`, `jar`.

**KIT (kit.js)**
- `cam(ctx, cx, cy, zoom, rot)` — camera: centre (cx,cy) at zoom. Wrap in `ctx.save()/restore()`. Animate with `key()` for slow pushes (1.2 → 1.35 over a shot).
- `shake(t, a, b, amp)` → [dx,dy].
- `typer(t, ops)` — typing simulation. `ops = [[t,'type',text,cps], [t,'del',n|'all',cps], [t,'set',text]]` → `{text, pressed}`.
- `thumbFor(t, ty, rest)` — thumb pose following the typing.
- `phoneShot(ctx, t, {st, thumb, push, sc, px, py, rot, hand})` — complete phone close-up.
- `hudFrom(t, K, {l1, l2, bw, accent})` with `K = [[time, label, A, B, visible], …]` — numbers roll and pop when they change.

## Patterns

- Shot skeleton: `ctx.save(); cam(...); set(...); characters...; ctx.restore(); narr(...)` — captions after restore so they are not zoomed.
- Close-ups: `drawHead` with r ≈ 220 centred off-thirds, background set blurred via `ctx.filter = "blur(6px)"` on a zoomed set.
- Montage of time passing: 3–4 s shots, HUD label changes (months), same framing, different clock/lamp/season.
- Flashback: `sepia(ctx, k)` + `mode:'past'` sets, captions in a lighter weight.
- Look at `SKILL/examples/unsent/film.js`, `again/film.js`, `little-bean/film.js` for complete scenes (they use these same APIs; their local helpers like `typer` became KIT).
