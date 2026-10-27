# Intake

Ask in **one** AskUserQuestion call (max 4 questions, 2–4 options each, recommended first). Write the questions and options in the student's language. Skip anything they already told you.

1. **Video type** (header "Type")
   - *What if…* — "What if the Moon disappeared?" Narrated, curious, fast. (`types/what-if.md`)
   - *Documentary* — "How did ancient humans survive winter?" Narrated, researched, curiosity loops. (`types/documentary.md`)
   - *Emotional story* — a touching wordless short film with captions and music. (`types/emotional.md`)
   - *Action / fight* or *Explainer* — the student can type either under "Other"; or ask a follow-up. (`types/action.md`, `types/explainer.md`)
2. **Style** (header "Style")
   - *Stickman (Recommended)* — clean black stick figures, flat colour sets, infographics. Works for every type.
   - *Bean line-art* — cream round characters, dark sketchy rooms, a glowing emotion-character. Emotional stories.
   - *Silhouettes* — black figures with white eyes on soft flat sets. Emotional stories.
3. **Voice** (header "Voice")
   - *Narrator voice (Recommended for What if / documentary / explainer)* — local AI voice; then ask the language (English, French, Spanish…).
   - *No voice, captions + music (Recommended for emotional / action)*.
4. **Format & length** (header "Format")
   - *YouTube 16:9, ~3–4 min* · *YouTube 16:9, 8–12 min* · *Short 9:16, < 60 s*. Documentary also offers 20 min.

Defaults: on-screen language = narration language; accent colour chosen by you per story; no channel name on screen.

Word budgets for narration (≈150 words per minute): 1 min ≈ 140 words · 3 min ≈ 400–500 · 8 min ≈ 1,000–1,200 · 12 min ≈ 1,500–1,800 · 20 min ≈ 2,500–3,000.

Vertical Short: in `index.html` set `window.FRAME = { W: 1080, H: 1920 }` (sync-duration.sh fixes the rest). Compose every shot for the tall frame: place things relative to `W` and `H` (not the demo's 1920×1080 numbers), centre the camera with `cam(ctx, W / 2, H / 2, z)`, characters bigger (`s: 1.4–1.8`), words in the middle 80 %, subtitles at `y: H * 0.72`.

After the answers, restate the brief in one line and go to the ideas.
