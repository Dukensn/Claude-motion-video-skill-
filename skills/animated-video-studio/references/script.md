# Writing the script

## Narrated (What if, documentary, explainer)

Write `SCRIPT.md` as clean paragraph narration first (no timestamps), then split it into `narration.json` lines.

- **Hook in the first 10 seconds**: a question, a strange fact, or "you" in a familiar moment that turns strange. Never "In this video…".
- **Curiosity loops**: every section answers one question and opens the next ("But that created a new problem." / "And this is the part most people miss."). Vary these transitions; never repeat one.
- **Fact → meaning → consequence**, not lists of facts.
- **Sentence rhythm**: mostly short, some medium, an occasional longer explanation followed by a punchline. Read it aloud in your head.
- **Speak to the viewer** when it fits: "you", "imagine", "here's the strange part".
- **Ending**: return to the opening image or question, connect to everyday life, end on a thought — not "thanks for watching" (unless they ask for a call to action).
- **Accuracy**: no invented dates, studies, scientists, quotes or numbers. Uncertain → "scientists think", "the evidence suggests". Verify with web search when available.
- **Original**: if the student gives reference scripts, take the *techniques* (hook type, rhythm, loops), never their sentences.

### narration.json lines

One line = one subtitle = one voice clip, 4–16 words, cut at natural pauses. Give every line a short `id` you will use in film.js (`"hook"`, `"winter"`, `"fire-1"`). Add `"pause": 0.8` after a line that needs to land, `"hide": true` for a line that should be heard but not subtitled. Character dialogue: add `"voice": "af_heart"` on that line.

## Silent (emotional, action)

Beat sheet in `STORY.md` (see `types/emotional.md`), and the on-screen caption lines in `narration.json` with `"voice": null` — voice.py then times them by reading speed. You can also place captions by hand in film.js with `TXT.caption`.

## Final check before showing the student

1. Does the first line create a question? 2. Does each paragraph move forward? 3. Is there a turn the viewer didn't expect? 4. Does the length match the word budget? 5. Is every fact true or hedged? 6. Does the ending feel earned? 7. Is it original?
