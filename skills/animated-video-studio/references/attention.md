# What holds attention (measured on the reference channels)

Numbers from the reference videos the course studies (`scripts/analyze-reference.py`): narrated "What if" films
change shot every **3.3 s** on average (median 2.3 s, ~18 changes a minute); wordless "vs." action films 3.8–5.5 s;
emotional shorts 3.7 s with fades through black between scenes. Loudness −14 to −17 LUFS.

## The rules

1. **Hook in 3 seconds.** The first frame already shows the strange thing, the question or the threat. No logo, no
   "hi guys", no slow fade longer than 0.5 s. The title of the video appears on screen in the first 2 s (What if,
   history, explainer) or the situation is clear without words (comedy, action, moral).
2. **Something changes every 2–4 seconds** — a cut, a camera push, a new pose, a number appearing, an effect.
   Long shots (8–25 s) are allowed only when something keeps moving inside them (a chase, a counter climbing).
3. **Open loops.** Each section answers one question and opens the next ("But that wasn't the worst part.").
   Silent films do it with visible goals: we see what the character wants before they get it.
4. **Escalate.** Every beat raises the stakes or the absurdity a little; the biggest moment is in the last third.
5. **Pattern interrupts** every 20–40 s in long videos: a change of set, of colour, of music, a silence, a
   close-up, a top-down shot, a split screen, a number on screen.
6. **Data on screen.** When the narration says a number, show it (counter, stopwatch, bar, stamp). Counters
   that keep score (SEEN 1,004 / KNOWN 0) turn a moral into a game the viewer tracks.
7. **Sound on every action.** Hits, whooshes, pops, typing, breaths. Silence is a tool: one second before the
   twist. Music changes with each section.
8. **Payoff + button.** The ending pays off the hook's question, then one last small image or line (the pigeon
   drops a crumb; the counter ticks to 1). End on the image, not on "thanks for watching".
9. **Readable on a phone.** Big subtitles (2 lines max), faces big enough to read the emotion, one accent colour.
10. **Under-promise length, over-deliver story.** A tight 3 minutes beats a padded 8. Cut any beat that doesn't
    change something.

Check the finished stills against this list (`quality-checklist.md`), and re-measure your own render with
`python3 SKILL/scripts/analyze-reference.py films/<slug>/renders/<slug>.mp4` — aim for the numbers above.
