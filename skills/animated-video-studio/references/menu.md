# The launch menu and the studio memory

## First message of a session

1. Run `python3 SKILL/scripts/profile.py get` (it restores the student's memory, even in a fresh cloud session).
2. **Returning student** (the profile has a `number`): greet them by what they made last ("Last time: *THE LAST CROISSANT*."), and offer in one AskUserQuestion: *Same kind again (Recommended)* · *Show me the menu*. "Same kind" skips straight to the script — keep their voice/format/count unless they say otherwise.
3. **New student, or "menu"**: send the board and the cards, then ask for a number.
   - Send `SKILL/catalog/menu.jpg` with the file-sending tool (caption: "Choisis ton numéro / Chwazi nimewo ou / Pick your number").
   - Then send the 12 cards `SKILL/catalog/01.jpg … 12.jpg` in one call (they open them full screen on a phone).
   - Ask in their language: "Which number do you want? (1–12)". A free answer is fine ("8", "the croissant one", "le 4").
   - Look the number up in `SKILL/catalog/catalog.json`: it gives the **style** (engine for new-film.sh), the **type** (its guide in `references/types/`) and the usual voice choice.
4. Save it: `python3 SKILL/scripts/profile.py set number=<n> style=<style> type=<type>`.

## The four questions (one AskUserQuestion, their language)

1. **Voice** — *Expressive voice (needs your free Gemini key)* · *Natural voice, no key (clear but not emotional)* · *No voice: captions + music*. Recommend what the card's `voice` says (narrator → expressive; none/captions → no voice).
2. **Format** — *YouTube 16:9 (Recommended)* · *Short 9:16*. YouTube first; Shorts when they ask or for the comedy card.
3. **How many videos** — *1* · *3* · *5*. Several = a series: same world, new story each time.
4. **Test first** — *Yes, a 30-second test first (Recommended)* · *No, make the full video*.

Save: `profile.py set voice=gemini|kokoro|none format=16:9|9:16 count=<n> test=yes|no language=<code>`.
Then — before anything technical — write the script (`references/creative.md`).

## The test

A 30-second cut of the real video: the hook and the first beats, with the final look, voice and music. Render it,
send it, ask one question ("What do you want more of — or less?"), apply the answer to the full script, then make the
full video. The test's shots are reused, not thrown away.

## After each video

`profile.py made '{"title": "...", "premise": "...", "cast": "...", "sets": "...", "tone": "..."}'`, then commit and push
`.studio/profile.json` with the session's work (the student never sees this). Next time, `profile.py used` lists
everything already made: never reuse a premise, a hero's look or a main set from that list.
