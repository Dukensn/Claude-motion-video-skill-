# The launch menu (generated fresh) and the studio memory

There is no saved catalogue of pictures. At the start, **you invent the proposals and draw a new preview for each**,
so every student — and every session — sees a different menu.

## First message of a session

1. `python3 SKILL/scripts/profile.py get` (restores the student's memory, even in a fresh cloud session).
2. Returning student with a `kind` saved → greet them by what they made last and offer, in one AskUserQuestion:
   *Same kind again (Recommended)* · *Show me new ideas*. "Same kind" goes straight to the questions/story.
3. **Ask the video's language before anything is drawn** (one AskUserQuestion, unless `profile.py get` already has
   `language`): *English (Recommended)* · *Français* · *Another language*. Videos are made in **English or French by
   default** — the student still talks with you in their own language (Kreyòl…); only the video changes. Save it at once:
   `profile.py set language=en|fr|…`.
4. Otherwise (or "new ideas"): **generate the menu — in the video's language.**

## Generating the menu

1. **Invent 6 proposals** across different kinds of video — comedy, What if, history, moral, documentary, emotional,
   action, explainer, or a kind nobody asked for — each with its own look from `SKILL/catalog/looks.json` (only
   `"offer": true` looks; the classic stick figure is kept in the skill but not offered for now). Each proposal is
   a real idea (story.md: a title, a one-line hook), not a category name, written for the audience of the video's
   language (an English or French viewer must understand it without local knowledge). Never reuse `profile.py used` ideas.
2. `bash SKILL/scripts/menu.sh` → `films/_menu/` with two drawing pages:
   `films/_menu/stick/thumb/thumb.html` (CINE, SKETCH, TOON, DIGI, SCENE, VFX, STICK) and
   `films/_menu/bean/thumb/thumb.html` (bean characters, MORAL, SCENE, VFX).
3. In those pages write `T.p1()…T.p6()` — one **poster frame** per proposal: a detailed set (SCENE), the
   character(s) mid-action with a strong emotion, the story's key object, a 2–3 word title (`TH.title`). Draw it like
   the best frame of that future video, not like a logo. Render each:
   `node SKILL/scripts/thumb.cjs films/_menu/stick films/_menu/out/p1.png p1` (bean page for bean/moral looks).
   Look at every preview yourself and redraw the weak ones.
4. Write `films/_menu/menu.json` — `{"title": "Choisis ton numéro", "items": [{"image": "films/_menu/out/p1.png", "name": "« 1 % » — sketch comédie", "line": "one-line hook"}, …]}`
   (poster titles, card names and hook lines in **the video's language**, so the student sees the real titles) — then `python3 SKILL/scripts/board.py films/_menu/menu.json`.
5. Send `films/_menu/out/board.jpg`, then the cards `01.jpg … 06.jpg`, and ask for a number. A free answer is fine
   ("le 3", "the bus one", "mix 1 and 4", "something else about football" → invent again).
6. Save: `profile.py set kind=<kind> style=<look> pick="<title>"` — the chosen proposal becomes the story's starting
   point (still developed through story.md: concepts, scoring, but/therefore).

## The four questions (one AskUserQuestion, their language)

1. **Voice** — *Natural voice (Recommended — Kokoro, ready, nothing to set up)* · *More emotional, expressive voice
   (Gemini — needs your own free key, set up once)* · *No voice: captions / sound only*. Recommend no voice for
   silent kinds (comedy, moral, emotional, action).
2. **Format** — *YouTube 16:9 (Recommended)* · *Short 9:16*.
3. **How many videos** — *1* · *3* · *5*.
4. **Test first** — *Yes, a 30-second test first (Recommended)* · *No, make the full video*.

Save: `profile.py set voice=kokoro|gemini|none format=16:9|9:16 count=<n> test=yes|no` (the language was saved before the menu).

**Expressive voice chosen → the student's own Gemini key, stored once in their cloud environment.**
Check: `python3 -c "import os; print(bool(os.environ.get('GEMINI_API_KEY')))"`. If `True`, go on. Otherwise explain in a
few short lines — **never ask them to paste the key in the chat**, never write it into the repository (their fork is public):
1. Create your free key: https://aistudio.google.com/apikey (your teacher's video shows how).
2. In the Claude app, open the environment menu in the session's title bar → **Edit** → add an environment variable
   (or a secret) named `GEMINI_API_KEY` with your key → save.
3. Start a new session: from then on every session has it.
On a computer, `export GEMINI_API_KEY=...` in their shell profile, or the key alone in `~/.config/video-studio/gemini_key`.
Until it's set, continue with the natural voice (Kokoro). If the voice still falls back with "cannot reach Gemini", the
environment's network access blocks `generativelanguage.googleapis.com` (same Edit screen → allowed domains).

## Reference videos

If the student shares a video, take its techniques (`fetch-reference.sh`). In a cloud session YouTube links are usually
blocked: ask them to **screen-record** the video on their phone (iPhone: Control Centre; Android: quick settings),
1–3 minutes is enough, and send the recording in the chat.

## The test

A 30-second cut of the real video: hook and first beats, final look and sound. Render, send, one question, apply.

## After each video

`profile.py made '{"title": "...", "premise": "...", "cast": "...", "sets": "...", "tone": "..."}'`, then commit and push
`.studio/profile.json` with the session's work.
