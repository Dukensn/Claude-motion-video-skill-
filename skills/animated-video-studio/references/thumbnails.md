# Thumbnails

The thumbnail decides whether anyone watches. The first versions in this project were rejected as dull — wide scenes, small faces, quiet titles. What worked:

1. **Extreme close-up** of the hero's face filling ~40 % of the frame (`TH.hero` r ≈ 280–320, or `SIL.close`).
2. **Exaggerated emotion**: teary eyes with running tears, wobbling mouth, sweat drop, blush. Bigger than in the film.
3. **One story object in the foreground**, held up to camera (phone with the unsent message, the note, the list) — it is the question the viewer wants answered.
4. **Dramatic light**: dark blurred background (`TH.blurLayer` of a set), coloured key light on the face, a rim light in the accent colour, a glow behind the object. Optional: the antagonist looming large behind, half out of frame.
5. **Title**: 2–3 words, Lilita One, thick black stroke + shadow, one word in the accent colour, ending with a period (`TH.title(ctx, [[{t:'214 ', c:'#ffb13d'}, {t:'DRAFTS.'}]], x, y, size)`). A number is strong. It must not repeat the video title word for word — it adds to it.
6. Vignette, high contrast, nothing small. Check it at 320×180: if the emotion and the title don't read, simplify.

## Stickman thumbnails

`thumb/thumb.html` (from `thumb-stickman.html`) loads the stickman engine: draw the hero huge (`STICK.draw` with `s: 4–5`, head ≈ a third of the frame, cropped by the bottom edge), an exaggerated `face` (scared, surprised, cry + sweat), the question-object big and glowing (the cracked Moon, the giant wave, the mysterious box), `FX.focusLines` behind, and `TH.title` with 2–3 words ("NO MOON?", "DAY 1,000.", "THEY ATE WHAT?"). Same rules as below.

## TH (thumbs.js)

- `hero(ctx, x, y, R, {kind:'theo'|'leo'|'mae'|'dad', eyes:'wide'|'teary'|'blank'|'closed'|'happy', look:[x,y], brow, mouth:'wobble'|'cry'|'gasp'|'smile'|'flat', tears, sweat, blush, key:{x,y,col}, rim:{col, side:±1}, tilt, dark})` — big shaded bean head.
- `torso(ctx, x, y, R, colour, {scarf})`, `hand`, `grip(ctx, x, y, scale, rot, side)` (fingers holding an object), `glow(ctx, x, y, r, rgba)`, `blurLayer(ctx, W, H, px, drawFn)`, `title(ctx, lines, x, y, size)`.
- Any engine drawing works inside the page (`Pr.phone`, `S3.note`, `FLAT.list`, `C.drawPride`, `SIL.close`…).

Edit `T.main()` in `films/<slug>/thumb/thumb.html`; render with `node SKILL/scripts/thumb.cjs films/<slug> out.png`. You may add `T.alt()` variants and render them with a third argument to offer the user two choices.

See `SKILL/examples/thumbnails/*.png` for the four approved thumbnails.
