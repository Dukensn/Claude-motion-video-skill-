---
name: animated-short-film
description: Make a ~4-minute, wordless, emotional animated short film for YouTube (bean-character line-art or black-silhouette style, captions instead of voice, generated piano/strings score, close-up thumbnail, title and description). Use when someone asks for an animated story video, a touching short film, a YouTube animation "like Monk Mode Films / Last Soul / Day One Films", or gives this skill's link and wants a video.
---

# Animated short film

You make a complete YouTube short film: an original story, ~4 minutes, no voice-over, captions on screen, a generated score that sounds played (not robotic), sound effects, a 1920×1080 MP4, a thumbnail and the YouTube text. Everything is drawn in code on a canvas and rendered with HyperFrames, so it runs on any machine with Node, Python, ffmpeg and FluidSynth.

`SKILL` below means this skill's folder (the one holding this file). Work in the user's current directory; films go in `./films/<slug>/`.

## The rules that make it work

- **Original stories only.** Same kind of characters and pacing as those channels, never their characters, plots or titles.
- **Everything drawn is a pure function of time `t`.** No `Math.random()`, no `Date.now()`, no state carried between frames — use `F.hash`, `F.noise1`, `F.mulberry(seed)`. HyperFrames seeks frames out of order.
- **Captions carry the story.** No voice. Short lines (≤ 7 words), word-by-word reveal, big and readable (bean: `narr` size ≥ 58; silhouette: `card` ≥ 64, `speak` ≥ 56).
- **Something changes on screen at least every 3–4 seconds** (cut, camera push, caption, counter tick, expression change). Shots last 3–12 s; nothing static longer than ~6 s.
- **Full frame 16:9, no letterbox bars.**
- **The user is a thinking partner, not a client to impress.** Show the story beat sheet and stills before rendering, and ask for their judgement at those two checkpoints.

## Workflow

### 1. Setup (once per machine)

Run `bash SKILL/scripts/setup.sh`. It checks or installs node, python3 + `mido numpy`, ffmpeg, fluidsynth, the FluidR3_GM soundfont, Playwright Chromium and the HyperFrames CLI, and ends with `READY` or a list of what to fix. Fix every ✗ before continuing (see `references/setup.md`). Node scripts need Playwright resolvable: the shell scripts set `NODE_PATH=$(npm root -g)`; do the same when you call `node SKILL/scripts/*.cjs` yourself.

### 2. Intake — ask, don't guess

Read `references/intake.md`, then ask its questions in **one** AskUserQuestion call (4 questions max; the rest have defaults). Never start writing before you have: style, theme (or "you choose"), and the on-screen language.

### 3. Story

Read `references/story.md`. Write the beat sheet (title, logline, cold open, counter, antagonist, acts with timings, ending line) into `films/<slug>/STORY.md`. Show it to the user in a compact form and ask what they would change — one round, then build.

### 4. Build the film

```bash
bash SKILL/scripts/new-film.sh <bean|silhouette> <slug> "TITLE."
```

This copies the template (a working 36-second demo) into `films/<slug>/`. Then:

- Rewrite `assets/js/film.js` — the shot list. Keep its structure: `DURATION`, `shot(a, b, fn)`, `renderAt`, fades/dips, `window.FILM`. Read `references/style-bean.md` or `references/style-silhouette.md` for every drawing function available; look at `SKILL/examples/*/film.js` (the four full 4-minute films) for how real scenes are composed. Reuse sets and props; add new ones in a new file (`assets/js/sets4.js`, included in `index.html` before `film.js`) rather than editing the engine.
- New characters: bean — add a look with `C.LOOKS.name = {...}` at the top of film.js (see style-bean.md); silhouette — vary `kind`, `s`, `shoes`, `cap`.
- `DURATION` is the single source of truth; `scripts/sync-duration.sh` copies it into `index.html` (audio.sh and render.sh run it).

### 5. Check stills (the first checkpoint)

```bash
bash SKILL/scripts/sheet.sh films/<slug> films/<slug>/build/sheet1.png 3 12 25 40 ...   # up to 12 times per sheet
```

Look at every sheet yourself (Read the PNG) and fix: clipped text, characters cut by the frame, props floating, wrong drawing order, captions over faces, empty frames. Make a sheet for every shot of the film (several sheets). Show the user one or two sheets and ask what they feel is missing.

### 6. Music and sound

Read `references/music.md`. Write `tools/score.py` (cues in seconds, against the shot list) and `tools/mix.py` (effects tied to visible actions). Then:

```bash
bash SKILL/scripts/audio.sh films/<slug>
```

It renders MIDI with a sampled soundfont, mixes, and normalises to −14 LUFS. You cannot hear the result: check the printed loudness (target −16…−13 LUFS, peak ≤ −1 dB) and say plainly to the user that you could not listen to it.

### 7. Render

```bash
bash SKILL/scripts/render.sh films/<slug>
```

Runs `hyperframes check`, renders 1920×1080 30 fps, re-encodes H.264/AAC with faststart → `films/<slug>/renders/<slug>.mp4`. A 4-minute film takes ~10–20 minutes; run it in the background. `dead_stretch` lint warnings are expected for canvas films. Verify duration, resolution and a few frames from the MP4 (`ffmpeg -ss T -i … -frames:v 1`).

### 8. Thumbnail

Read `references/thumbnails.md`. Edit `thumb/thumb.html` (`T.main`) and render:

```bash
node SKILL/scripts/thumb.cjs films/<slug> films/<slug>/renders/thumbnail.png
```

Look at it at full size **and** at 320×180 (that is how YouTube shows it). Iterate until the face, the emotion and the title read at small size.

### 9. YouTube text

Read `references/youtube.md`; write `films/<slug>/youtube.md` (title, description, tags, chapters).

### 10. Deliver

Give the user the MP4, the thumbnail and youtube.md, with the measured facts (duration, resolution, loudness). Run `references/quality-checklist.md` before saying it is done. Uploading is manual unless the user has a tool that can publish to YouTube.

## Files

| Path | What |
| --- | --- |
| `templates/bean/`, `templates/silhouette/` | HyperFrames projects with the drawing engine and a 36 s demo `film.js` |
| `templates/common/scorelib.py`, `mixlib.py` | score (MIDI, humanised) and sound-effect/mix helpers |
| `templates/thumbnail/` | close-up thumbnail renderer + one page per style |
| `scripts/` | setup, new-film, sheet, audio, render, thumb, sync-duration |
| `examples/` | the four complete films (UNSENT, AGAIN, LITTLE BEAN in bean style; SOMEDAY in silhouette), their scores, mixes, thumbnails and YouTube text |
| `references/` | intake, story, both style APIs, music, thumbnails, YouTube, quality checklist, setup |
