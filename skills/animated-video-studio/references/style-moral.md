# Moral style — engine reference (`MORAL`, on the bean engine)

Everything in `style-bean.md` (C.drawPerson / drawHead, Pr rooms and phone, X.narr / hand / hud, KIT.cam / phoneShot / hudFrom)
plus:

- `MORAL.tempter(ctx, x, y, {col, hot, alpha, s, grin, look, lean, angry, reach:[a1,a2], dissolve, crown})` — the personified
  temptation: a dark shape with a neon edge (pink lust/phone, green envy, red anger, purple pride…).
- `MORAL.rain(ctx, t, {n, speed, len, col, seed})`, `busStop(ctx, {lamp})`, `cafe(ctx, {cups:[x…], steam, rain})`,
  `umbrella(ctx, x, y, s, col, k open)`.
- `MORAL.split(ctx, leftFn, rightFn, {k, labels:[l, r]})` — two lives side by side (his night / her night).
- Counters: `KIT.hudFrom(t, [[time, label, A, B, visible]…], {l1, l2, bw, accent})` + `X.hud(ctx, h)` — the score of the habit.
- Phone lock screen: `phoneShot(ctx, t, {st: {lock: true, lockTime, lockDate, notif: 1, notifTitle, notifText}})`.

Patterns: cold-open card (rule line + twist line) → habit with a counter → whisper (X.hand in the tempter's colour) →
the cost (split) → the choice (dissolve the tempter, counter changes) → closing card + title. Demo: `templates/styles/moral/assets/js/film.js`.
