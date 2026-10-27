# Type: Emotional story (silent, captions + music)

These films hold attention without a voice because every one follows the same spine. Fill it with an original situation.

## The spine (for ~4:00)

| Time | Beat | Notes |
| --- | --- | --- |
| 0:00–0:07 | **Cold open card**: two lines on black. Line 1 sets a habit, line 2 twists it. | "He wrote his mom a message every night." / "He never sent one." |
| 0:07–0:45 | **The world + the counter.** Show the habit happening. Introduce the counter (top-left HUD or a list/calendar). | The counter is the film's clock: DRAFTS/SENT, DAYS/CALLS, NOTES/YEARS. It must change on screen several times. |
| 0:45–1:30 | **The antagonist.** A feeling made visible (Pride, Forgetting, Fear, "Someday"…) whispers short handwritten lines. Show *why* the hero obeys it (a flashback, a hurt). | The antagonist never physically harms; it persuades. Its lines are 2–5 words. |
| 1:30–2:30 | **Escalation.** Time skips (months, seasons, years); the counter climbs; small near-misses. One moment where the other side is shown hurting too. | Use a montage: 3–5 s shots, the counter ticking. |
| 2:30–3:15 | **The turn.** Something irreversible or almost: a missed call, a hospital, a last day, a found box of notes. The hero chooses against the antagonist. | Silence in the music before the turn. |
| 3:15–3:50 | **The act.** One simple action — send, call, drive, show up — and the other person's reaction. The antagonist shrinks/dissolves. | Let it breathe: longer shots, music opens. |
| 3:50–4:05 | **Aphorism card** (1–2 lines) then **title card**. | "Pride waits for the perfect words. Love just says hi." |

Scale for 2 min / 60 s by keeping cold open, counter, antagonist, turn and act, and cutting escalation.

## Craft rules

- One hero, one relationship, one object that carries meaning (a phone, a lunchbox note, a guitar, a thread). The object appears in the first minute and in the last shot and the thumbnail.
- Specific beats real people recognise: typing and deleting, "last seen yesterday", the 3:17 AM typing dots, the declined call.
- Caption lines ≤ 7 words, present tense or simple past, no explanations of feelings ("He was sad") — show it.
- Hope at the end, even when the ending is bittersweet. No deaths shown on screen; imply.
- Titles: one or two words + a period (UNSENT. / AGAIN. / SOMEDAY.).
- Check it is original: don't reuse the example films' situations; if the user's idea is close to a known video, change the relationship, the object and the antagonist.

## STORY.md format

```
# TITLE.
Logline: one sentence.
Style: bean | silhouette — Accent: #hex — Counter: LABEL1 / LABEL2 — Antagonist: name, look, voice
Object: …
## Beats
0:00–0:07  Cold open: "…" / "…"
0:07–0:20  …
…
## Ending
Aphorism: "…" / "…"
```

Show the user the logline, the antagonist and the ending line, and ask what they would change. That is the moment their own taste matters most.

## Ideas and style

Roll `python3 SKILL/scripts/ideas.py emotional` for a fresh relationship, object, antagonist and twist, then write 10 loglines. The bean and silhouette styles were built for this type (see the four examples); stickman works too — keep the sets dark and warm, let faces (`sad`, `worried`, `cry`, `happy`) and slow pushes carry the feeling, and personify the antagonist as a second figure with its own colour (copy `STICK.draw` with a glowing `ink`, or use `look: {color, cape: true}` in a dark tone).
