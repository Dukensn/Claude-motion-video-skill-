# Music and sound

The score is written as MIDI against the film's cue times (in seconds), then played by FluidSynth with a **sampled** General MIDI soundfont (FluidR3_GM: recorded piano, strings, nylon guitar, music box). That plus humanised timing/velocity, sustain pedal and reverb is what keeps it from sounding robotic. Never use oscillator synths for music.

## scorelib (`tools/scorelib.py`, imported by `tools/score.py`)

All times are film seconds; names like `"A4"`.

- `note(inst, t, dur, pitch, vel)` — one humanised note. Instruments: `piano strings cello violin box (music box) celesta guitar (nylon) pad trem timp voice (oohs, for humming)`.
- `pedal(t)` re-pedal the piano at t; `pedal_off(t)`; `silence(inst, t)` cut dead (hard silence on picture); `swell(inst, a, b, v0, v1)` expression ramp; `cc(inst, t, ctrl, val)`.
- Harmony from voicings `V` (C Cadd9 Dm D Dsus4 Em E F G Gm Am A Bb Bm; add more with `V.update({...})`): `arp(t, dur, chord, vel)`, `broken(...)`, `progression(t, [chords], dur_each, vel)` → end time, `waltz(t, bar, chord)`, `pad(inst, t, dur, chord, vel)`, `pick(t, chord, dur)` fingerpicked guitar, `strum`, `bar_strums`.
- `melody(inst, t0, [(pitch|None, beats), …], beat_seconds, vel)` → end time.
- `write(path)` at the end (the template writes `build/score.mid`).

## Scoring the film

1. List the cue points from film.js: cold open, each act change, the turn, the act, the ending card, the title.
2. Give each section a texture and a dynamic:
   - Cold open: 1–2 soft piano notes, lots of air.
   - Everyday life: sparse broken chords (vel 36–46), slow (3–4 s per chord). Bean: piano. Silhouette: nylon guitar + music box.
   - Antagonist: low cello/strings pad swelling, the piano holds a single note; minor chords.
   - Montage: a steady pattern (waltz or arpeggio) with a melody that repeats as time passes.
   - Before the turn: **silence** (`silence()` + `pedal_off()`) for 1–3 s. The silence is the loudest moment.
   - The act and the ending: the theme opens up — strings swell (`swell` 50→100), melody one octave higher, vel 55–65.
   - Title: one last chord, let it ring.
3. One theme (4–8 notes) introduced early and returned at the end changes the meaning of the ending.
4. Keep the mix boosted: in mix.py the score goes in at ×3; effects are quiet.

## Under a narrator

With a voice, the music is a bed, not a song: simple textures (pad, celesta, soft piano pulse, light strings), steady, no busy melody while words are spoken. Put the melody in the gaps (hook, chapter cards, ending). In `score.py`, read the narration timings with `T = timeline()` and place cues at `T["id"]["a"]`. In `mix.py`:

```python
duck = M.voiceover("build/timeline.json")                 # voice clips at their times; returns where the voice speaks
M.music(M.load("build/score.wav"), gain=1.6, duck=duck)   # music dips ~55 % under every sentence
```

Action videos: tight percussion-like cues (timp hits on impacts, low strings ostinato), `M.punch()` on every hit, `M.whoosh()` on fast moves, `M.boom()` for big impacts.

## Sound effects (`tools/mix.py` with mixlib)

`M.init(DURATION)`, `M.put(M.load("build/score.wav"), 0, 3.0)`, then effects tied to what is visible, landing **one frame (1/30 s) after** the picture:
`roomtone(a, b, level)` (interiors, 0.03–0.05), `taps(times, gain)` (typing; times come from `FILM.events()` → `build/events.json`), `thump(f0, dur, click)` (door, drop, heartbeat), `whoosh(dur)` (transitions), `breath(dur)` (the antagonist's whisper), `buzz/buzzes(t, k)` (phone vibration), `pop()`, `crackle(dur)`, `scratch(a, b)` (pencil), `page(t)`, `cough(t)`, `wind(a, b, level)`, `engine(a, b, level)`, `waves(a, b, level)`. `M.finish("build/premix.wav")`.

`scripts/audio.sh` then compresses gently and normalises to −14 LUFS / −1.5 dBTP. Target after measuring: −16 to −13 LUFS integrated, true peak ≤ −1 dB. If effects dominate the peak, lower them, don't lower the score.

You can't listen. Say so to the user and ask them to listen to the mix (`assets/audio/mix.wav`) before the long render if they can.

## No downloads needed

Stock-music sites (Pixabay, Freesound, Hugging Face) are often blocked or licence-unclear; this pipeline generates everything locally, so every film is free to monetise.
