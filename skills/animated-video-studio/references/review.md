# The quality gate — is it boring? confusing? creative? (before the student sees anything)

Run it twice: on the **stills** (before the audio) and on the **render** (before delivering). Be the harshest viewer.

1. **Measure.** `bash SKILL/scripts/review.sh films/<slug>` → shot lengths, changes per minute (by quarter), silences,
   loudness, and contact sheets of your own video. Targets (`attention.md`): first change < 3 s, median shot 2–4 s,
   ≥ 15 changes/min for narrated videos (≥ 10 for slow emotional ones), no quarter much slower than the others.
2. **Look at every sheet** and answer honestly, in `films/<slug>/REVIEW.md`:
   - **Boring?** Any 5 s where nothing changes? A set reused too often? The middle sagging?
   - **Confusing?** Could a stranger tell who wants what, in each scene, with the sound off?
   - **Creative?** Is there at least one image or moment nobody has seen in this kind of video? Is the twist earned?
   - **Beautiful?** Are the sets as detailed as the art direction promised? Is the hero always readable?
     Is the light consistent? Do characters sit in the set (same light, shadows on the ground)?
   - **True?** (facts, names, dates) · **Readable on a phone?** (text size, faces)
   - Score each 1–5. **Any score under 4 → fix it and run the gate again.** Don't deliver a 3.
3. Only then show stills / send the video, and tell the student in one line what you improved after your own review.
