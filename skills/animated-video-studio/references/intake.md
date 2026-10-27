# Intake

The intake is now the launch menu + four questions: see `menu.md`.

Word budgets for narration (≈150 words per minute): 30 s test ≈ 70 words · 1 min ≈ 140 · 3 min ≈ 400–500 · 8 min ≈ 1,000–1,200 · 12 min ≈ 1,500–1,800 · 20 min ≈ 2,500–3,000.

Vertical Short: `FORMAT=short bash SKILL/scripts/new-film.sh <style> <slug> "TITLE"` sets `window.FRAME = { W: 1080, H: 1920 }` (sync-duration.sh fixes the rest). Compose every shot for the tall frame: place things relative to `W` and `H`, centre the camera with `cam(ctx, W / 2, y, z)`, characters bigger, words in the middle 80 %, subtitles at `y: H * 0.72–0.8`. The cartoon style starts vertical; `FORMAT=wide` is not needed for others (16:9 is the default).
