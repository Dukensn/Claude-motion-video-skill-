# Art direction — you choose, every time

Nothing about the look is fixed. For each video, decide like a director and write the decisions at the top of
`SCRIPT.md` (5–8 lines). Different stories deserve different answers.

## The decisions

- **Detail level of the world.** Minimal (a colour field + one object — good for ideas, jokes, focus) · Medium
  (a readable set with 3–6 elements) · **Rich** (layered sets: sky, far, mid, near, foreground; textures; small life
  details — a cat on a wall, laundry, a flickering sign). What ifs, documentaries and stories set in a real place
  usually want **rich** sets; build them with `SCENE` (`references/scenery.md`) and add your own pieces in `sets.js`.
- **Depth.** At least three planes in wide shots. Far planes lighter and bluer (atmospheric perspective), near planes
  darker and sharper; use `CINE.dof` / blur for the planes out of focus; parallax when the camera moves.
- **Light.** Pick a time of day per scene (`SCENE.PAL`: dawn day dusk night storm) and one motivated light source
  (sun, lamp, phone, fire). Rim light separates characters from busy backgrounds. Light changes with the mood.
- **Characters: size and finish.** How big in frame (wide: 25–35 % of the height; medium: 50–70 %; close-up: the face
  fills a third). How detailed (a simple silhouette for crowds and fast action; full costume, clothes colours, rim
  light and expressive faces for the hero). The hero is always the most readable thing in the frame.
- **Camera grammar.** Plan shots like a storyboard: establishing wide → medium → close-up on the emotion;
  `CAM.move` for pushes, pulls, pans and tilts; `CAM.handheld` for tension; `CAM.shake` on impacts; low angle for
  power, high angle for weakness, top-down for maps and chases. Vary shot size every 2–4 s.
- **Transitions.** Hard cuts by default; `TRANS.whip` for energy, `TRANS.dip` for time passing, `TRANS.iris` for comedy,
  `TRANS.flash` for shocks, `TRANS.wipe` for chapters. Match cuts (same shape or movement across two shots) for wow moments.
- **Colour.** One palette per film (3–5 colours) + one accent reserved for the important thing.
- **Sound.** Per scene: music, ambience only, or silence (`story.md` §7).

## Mixing and inventing looks

Looks in `catalog/looks.json` are starting points, not boxes. A history video can use the cinematic figures in sketch
sets; a moral story can happen in a rich SCENE street; a comedy can be a documentary parody. If the story wants a look
that doesn't exist (claymation-like blobs, paper cut-outs, neon line art, pixel art), invent it in the film's
`sets.js` with Canvas 2D — gradients, shapes, outlines, textures — and keep it consistent across the whole film.
