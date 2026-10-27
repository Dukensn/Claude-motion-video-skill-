# Script first: invent like a director with no limits

The student picked a **look and a kind of video** (a menu number). Everything else is yours to invent: the story,
the tone, the characters and how they look, the places, the twists. Write the script **before** you open any engine
reference or style file. You don't know yet what the engine can do — and that is the point: a script written inside
the tool's limits produces the same video every student gets. A script written freely, then built, produces new ones.

## 1. Roll the dice, check the memory

- `python3 SKILL/scripts/ideas.py <type>` — random ingredients (use them as sparks, never as-is).
- `python3 SKILL/scripts/profile.py used` — what this student already made: no premise, hero look or main set repeats.
- Mix tones on purpose. A comedy can turn tender in the last 10 seconds; a documentary can have one absurd joke;
  a moral story can open like a thriller. Pick one main tone and one counter-tone.

## 2. Write `films/<slug>/SCRIPT.md` — the director's script

```
# TITLE (2–4 words)
Logline: one sentence — who wants what, what stands in the way, what's at stake.
Tone: main + counter-tone (e.g. slapstick + one tender beat). Length: ~30 s test / full length.
Promise: what the viewer gets if they stay (the question the hook opens).

## Cast (invent each one — name, silhouette, colours, one detail you'd remember, how they move, what they want)
## Places (each set: time of day, weather, light, one memorable object)
## Beats (numbered; one beat = one visible change, 2–4 s each; the hook is beat 1, under 3 s)
1. [0:00] HOOK — what we see, what we hear, the text on screen
2. ...
## Words (narration lines, captions or speech bubbles, in the video's language)
## Sound (music mood per section; every hit, whoosh and silence that matters)
## Ending (the payoff + a last "button" image or line)
## Thumbnail idea (one frame, one emotion, 2–3 words)
```

Write it as if you had a film crew and any budget: dragons, a crowd of 300, a storm at sea, a phone that talks,
a city made of cheese. Be specific and visual ("her yellow umbrella is the only colour on the grey street"), not
abstract ("she feels lonely").

Show the student the logline, the hook, the twist and the ending (not the whole document) and ask what they'd change.
One round, then lock it.

## 3. Production plan — make the script possible, don't shrink it

Only now read the style reference (`references/style-<style>.md`, `references/vfx.md`). Go through the beats and mark
each need:

- **exists** — the engine draws it (a pose, a set, an effect);
- **build** — not in the engine yet: write it. New sets, props, creatures, vehicles, costumes, effects go in the film's
  own `assets/js/sets.js` (loaded before film.js), drawn in the same style (same line weight, palette, outline).
  A dragon is a few curves, a crowd is a loop, a storm is VFX.particles + a flash. Building is normal, not an exception;
- **adapt** — truly out of reach (photo-real faces, real logos, copyrighted characters): find the stylised way and
  tell the student in one line.

Never cut a beat because "the engine has no X" without trying to build X first. Keep a short list of what you
built; good additions can later move into the engine.

## Originality rules

- New names, new looks, new places every time. Don't reuse the demo films' characters, titles or jokes.
- Reference videos teach **techniques** (pacing, framing, structure), never stories, characters, titles or designs.
- Real people and history: true facts, hedged when uncertain; respectful even when funny.
