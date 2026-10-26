# Stickman style — engine reference

Clean black stick figures (white round head, tiny eyes, thick round lines) on flat, simple sets; one accent colour; big readable type. Script order in `index.html`: core → stick → world → timeline → text → (your sets.js) → film. Canvas is `F.W × F.H` (1920×1080, or 1080×1920 with `window.FRAME`).

## STICK (stick.js)

`STICK.draw(ctx, o)` → returns joints `{head, neck, hip, shoulder, AF:{elbow,hand}, AB:{...}, LF:{knee,ankle}, LB}` in screen space (attach things to hands).
`o = { x, y (ground line), s (scale; 1 ≈ 330 px tall), dir (1 right, -1 left), pose, look, face, profile (0 front … 1 side, default 0.55), hold (prop in front hand), holdB (back hand), t (enables blinking + cape flutter), seed, alpha, ink }`

**Poses** — angles in degrees; a limb at 0 points down, + rotates toward the facing side (90 = forward, 180 = up); `torso` + leans forward; elbows `eF/eB` bend forward, knees `kF/kB` bend back; `x, y` offset the hip; `air: true` skips grounding (jumps). Front limbs `aF, eF, lF, kF`; back limbs `aB, eB, lB, kB`; `head` tilts.
Library `STICK.P`: stand relaxed hipsHands think point pointUp wave cheer shrug facepalm scared sad tired sit sitGround crouch kneel carry lift guard punch kick block hit fall lie jumpPrep jumpAir land.
- `posesAt(t, [[t0, "stand"], [t1, "point", E.out3], [t2, {aF: 120, eF: 30}]])` — keyed poses (names or objects).
- `walk(phase, {stride})`, `run(phase, {stride})` — cycles; phase advances ~1.6/s walking, ~2.4/s running: `walk(t * 1.6)`. Move `x` at ~170 px/s (walk) or ~420 px/s (run) at s = 1 so feet don't slide.
- `idle(pose, t, seed)` — breathing sway; wrap still poses with it.
- `tweak(pose, {aF: 100})`, `mixPose(a, b, k)`.
- `trail(ctx, tt => opts, t, n)` — motion ghosts for fast moves.

**Faces** — `face: { mood, look:[x,y], sweat, tear, blush }`; moods: neutral happy laugh sad cry angry scared surprised confused determined tired worried smirk. Blinks are automatic when `t` is passed.

**Looks (the character sheet)** — define each character once at the top of film.js:
```js
const MAYA = { color: "#2a9d8f", hair: "pony", glasses: true };          // accent colour + 1–2 features
const GRANDPA = { color: "#8d99ae", hair: "bald", beard: "long", scale: 0.95 };
```
fields: `color` (accent), `hat: cap|top|cowboy|helmet|helmetGlass|crown|band|beanie|wizard|hood`, `hair: spike|tuft|curly|pony|bun|long|bald`, `hairColor`, `glasses`, `beard: short|long`, `mustache`, `cape`, `scarf`, `belt`, `tie`, `skirt`, `backpack`, `headFill`, `ink`, `scale` (0.72 for a kid). Presets in `STICK.LOOKS`: hero kid elder scientist girl villain caveman knight king astronaut (starting points — make new ones per film).
**Props** (`hold`): sword stick club spear torch phone book pointer flag shield cup. Weapons follow the forearm; the rest stay upright.

## WORLD (world.js)

- `BG`: `paper(col)`, `sky({top,bottom,stars,sun,moon,t})`, `night(o)`, `sunset(o)`, `ground(y,o)`, `hills(y,{cols,seed})`, `mountains(y)`, `city(y,{night,seed})`, `room({wall,floor,floorCol,window:[x,y,w,h],door:[x,w],board:[x,y,w,h],night})`, `space({t})`, `desert(y)`, `ocean(y,t)`, `dojo()`, `spot(col)`.
- Bodies: `earth(ctx,x,y,r,rot)`, `moon(ctx,x,y,r,{alpha})`, `sun(ctx,x,y,r)`, `planet(ctx,x,y,r,col,ring)`, `stars`.
- `PROP`: `tree(x,y,s,'round'|'pine')`, `rock`, `cave`, `fire(x,y,t,s)`, `table`, `chair`, `rocket(x,y,s,flame,t)`, `sign(x,y,text)`.
- `FX`: `flash(ctx,t,at,frames)` colour inversion, `whiteFlash(ctx,t,at,dur)`, `impact(ctx,x,y,t,at,size,col)`, `speedLines(ctx,x,y,dir,t,k)`, `focusLines(ctx,cx,cy,t,k)`, `dust(ctx,x,y,t,at)`, `icon(ctx,'?'|'!'|'...'|'zzz'|'heart'|'bulb',x,y,t,a,b)`, `shake(t,a,b,amp)` → [dx,dy], `vignette`, `fade(ctx,k)`.
- `GFX`: `label(ctx,text,x,y,t,a,b,{size,font:'ui'|'hand'|'title',col,box})`, `arrow(ctx,a,b,k,{bend,col,w})`, `drawOn(ctx,pts,k)`, `counter(ctx,x,y,t,t0,t1,from,to,{size,fmt,col})`, `bars(ctx,x,y,w,h,[{label,v,col,text}],t,t0,{max})`, `timeline(ctx,x,y,w,[{label,at}],t,t0)`, `ring(ctx,x,y,r,k,col)`, `icon(ctx,'earth'|'moon'|'sun'|'clock'|'heart'|'coin'|'atom'|'bulb'|'skull'|'question',x,y,s)`, `morph(ctx,x,y,size,k,col)`, `whiteboard(ctx,x,y,w,h)`.
- `cam(ctx, cx, cy, zoom, rot)` — wrap in `ctx.save()/restore()`.

## TXT (text.js)

- `at("id", off)`, `end("id", off)`, `lineAt(t)`, `VO` (from timeline.js).
- `subtitles(ctx, t, {accent, size, y, maxW, upper, band})` — karaoke subtitle of the current narration line (call once in renderAt, after the shot).
- `caption(ctx, [{text, size, weight, delay, color}], t, a, b, {center, cy, x})` — silent-film caption, words reveal with blur.
- `title(ctx, [{t:"WHAT IF THE "}, {t:"MOON", c:"#ffd166"}], x, y, t, a, b, {size})` — big Lilita One hook/title.

## Patterns

- `renderAt` draws the shot, then `subtitles`, then `FX.vignette`, then fades. Keep that order.
- Narrator-character in the corner for explainers (`s: 0.9`, pointing with `hold: "pointer"`).
- Ground everyone on the same `y` per set; scale for depth (back characters `s: 0.8`, slightly higher `y`).
- Read `templates/stickman/assets/js/film.js` (the demo) before writing your own.
