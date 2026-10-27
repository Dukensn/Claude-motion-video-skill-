# Quality checklist (run before delivering)

Each item comes from a real mistake made while making the example films.

**Format**
- [ ] 1920×1080, 30 fps, full frame — no letterbox bars (`post` without `bars`). Duration within ±5 s of the target.
- [ ] H.264 yuv420p + AAC, faststart (render.sh does this). Integrated loudness −16…−13 LUFS, peak ≤ −1 dB.

**Readability**
- [ ] Captions big enough on a phone: bean `narr` ≥ 58 px, bubbles ≥ 44; silhouette cards ≥ 64, `speak` ≥ 56. Never more than 2 lines at once.
- [ ] Captions never cover a face or the phone screen; on phone close-ups put captions to the side (`narr` with `x`, `center`, `cy`).
- [ ] Phone close-ups show the whole chat — the bottom (input/last message) must not be cut by the frame. Move the phone up when the keyboard is hidden.
- [ ] Every caption stays on screen long enough to read twice (≈ 0.35 s per word + 1 s).

**Stickman / narration**
- [ ] Every narration line has something on screen that shows it (no talking over an unrelated image).
- [ ] Subtitles never cover a face, a graph label or the key object; on light sets the dark band keeps them readable.
- [ ] Characters keep the same look (accessory, colour) in every shot; nobody's feet float or sink (same ground `y` per set).
- [ ] Walk/run speed matches the stride (feet don't skate).
- [ ] Graph numbers match the narration exactly; facts verified or hedged.
- [ ] Voice and music: music audible but never over the words; no clicks between clips.

**Drawing**
- [ ] Hands actually hold what they hold (phone, pen, cup): check `P.out` points in stills.
- [ ] Drawing order: scarves/hair/props in front of or behind the body as in real life; characters between bench layers.
- [ ] Sitting characters sit on the seat, feet on the floor; nothing floats.
- [ ] The antagonist reads as a character (silhouette, face, crown/feature), not a blob or a pill shape.
- [ ] No frame is empty or static for more than ~6 s; something changes every 3–4 s.

**Story**
- [ ] Cold open: two lines, the second twists the first.
- [ ] Counter visible and changing; the object appears early and in the final shot.
- [ ] One silence before the turn; ending aphorism + title card.
- [ ] Original: no characters, situations or titles from the reference channels or the example films.

**Delivery**
- [ ] Thumbnail checked at full size and at 320×180.
- [ ] youtube.md with title, description, chapters that match the real timings, tags.
- [ ] Tell the user what you could not check (you cannot hear audio).
