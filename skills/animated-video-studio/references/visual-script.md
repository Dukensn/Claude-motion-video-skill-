# From script to shots

Every narration line becomes something the viewer *sees*. Plan a shot list before coding: for each line, write one sentence of action.

## Rules

- **Show the line.** "He searched for food" → he searches (crouch, look around, find something). Not a random scene.
- **One main action per shot** (+ one supporting action + a clear ending moment): walk → notice → stop and look. Not walk → run → climb → fight → fall in 8 seconds.
- **Shots of 3–10 s.** A long narration line can hold one continuous shot; a montage of short lines can cut faster.
- **Keep the place until the story moves.** Several lines in the same location stay in the same set; change the camera (push in, new angle) instead of the set.
- **Continuity**: same `look` objects all film long; if he holds a torch at the end of a shot, he holds it at the start of the next.
- **Camera**: default is calm — fixed or a slow push (`cam` zoom 1.0 → 1.08 over a shot). Use shake, flashes, fast zooms and speed lines only for impacts and big reveals (action type uses them more).
- **Every element has a reason.** No random props, animals or extra characters.
- **Graphics carry numbers.** When the narration says a number, a comparison or a process, draw it (`GFX.counter`, `GFX.bars`, `GFX.arrow`, `GFX.timeline`, `GFX.label`).
- **Faces carry emotion**: set `face.mood` per beat (neutral → worried → surprised → happy) and let it change inside a shot.

## Anchoring to the voice

```js
shot(at("winter"), at("fire"), (ctx, lt, t) => { ... });          // shot = the span of narration lines
GFX.label(ctx, "-40°C", 1500, 300, t, at("cold") + 0.4);            // a label appears 0.4 s into a line
draw(ctx, { ..., pose: posesAt(t, [[at("found"), "stand"], [at("found") + 0.5, "point"]]) });
```

When the voice is regenerated, timings move and the picture follows.
