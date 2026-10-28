// film.js — the shot list. THIS is the file you rewrite for every new film.
// Demo (moral short film, 30 s, captions + music): "FIVE MORE MINUTES."
// Grammar: a cold-open card with a twist line → the habit (a counter keeps score) → the temptation whispers →
// the cost, shown not told (split screen) → the choice → a closing line and a title card.
(function () {
  const { W, H, PAL, G, clamp, lerp, E, prog, key } = F;
  const { drawPerson } = C;
  const { narr, hand, hud, post } = X;
  const { cam, phoneShot, hudFrom } = KIT;
  const { tempter, split, cafe } = MORAL;

  const DURATION = 30; // keep in sync with data-duration in index.html (scripts/sync-duration.sh does it)
  const PINK = "#ff4fa3";
  // counters top-left: [time, label, A, B, visible]
  const HUD = [[4.0, "3:47 AM", 12408, 0, 1], [8.0, "3:51 AM", 12731, 0, 1], [20.5, "3:52 AM", 12731, 1, 1], [25.0, "", 12731, 1, 0]];
  const HUD_STYLE = { l1: "SCROLLED", l2: "CALLED MOM", bw: 340, accent: PINK };
  // the character, defined once
  const SAM = { x: 600, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12, kind: "theo" };

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  // 0 — cold open
  shot(0, 4.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [{ text: "He always had five more minutes.", size: 62, weight: "400" }, { text: "Just never for her.", size: 80, delay: 1.5 }], t, 0.3, 3.8, { center: true, gap: 1.4 });
  }, { look: { vignette: 0 } });

  // 1 — the habit: 3:47 AM, the phone glow, the counter climbing
  shot(4.0, 9.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 700, 560, key(lt, [[0, 1.25], [5, 1.38, E.sine]]));
    Pr.theoRoom(ctx, { clock: lt < 4 ? "3:47" : "3:51", lamp: 0, dark: 0.3, rain: 1 });
    drawPerson(ctx, Object.assign({}, SAM, { e: { eyes: "half", look: [0.3, 0.7], brow: 0.3, mouth: "flat" }, lit: 0.9, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } }));
    ctx.restore();
  });

  // 2 — the temptation whispers
  shot(9.0, 14.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 690, 560, key(lt, [[0, 1.5], [5, 1.62, E.sine]]));
    Pr.theoRoom(ctx, { clock: "3:51", lamp: 0, dark: 0.3, rain: 1 });
    tempter(ctx, 390, 830, { alpha: prog(lt, 0.2, 1.4, E.out2), col: PINK, grin: 1.2, look: 6, reach: [1.2 - 0.3 * prog(lt, 1, 3), 0.9] });
    drawPerson(ctx, Object.assign({}, SAM, { e: { eyes: "half", look: [0.2, 0.7], brow: 0.2, mouth: "small" }, lit: 0.9, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } }));
    ctx.restore();
    hand(ctx, "just five more minutes…", 1020, 300, t, 9.8, 13.6, { size: 66, rot: -0.05, color: PINK, glow: PINK });
  });

  // 3 — the cost, side by side: his endless feed / his mother at the kitchen table, two cups, one empty chair
  shot(14.0, 19.5, (ctx, lt, t) => {
    split(ctx,
      (c) => { c.fillStyle = "#0e0e14"; c.fillRect(-W, 0, W * 3, H); phoneShot(c, t, { st: { lock: true, screenOn: 1, lockTime: "3:52", lockDate: "Tuesday", notif: 1, notifTitle: "Mom", notifText: "Missed call (3)" }, push: () => 0.02 }); },
      (c) => { Pr.kitchen(c, { mode: "night", lamp: 1, steam: 1, table: 1 }); drawPerson(c, { x: 820, y: 760, s: 1.0, pose: "sit", kind: "mom", face: -0.3, legDir: -1, legDrop: 60, armL: [0.4, 1.2], armR: [-0.4, -1.2], e: { eyes: "half", look: [0.5, 0.2], brow: 0.6, mouth: "flat" }, lit: 0.6 }); },
      { k: prog(lt, 0, 0.6, E.out3), labels: ["his night", "her night"] });
    narr(ctx, [{ text: "She called three times." }], t, 15.0, 19.2);
  });

  // 4 — the choice: he looks up; the shadow dissolves; he presses call
  shot(19.5, 25.0, (ctx, lt, t) => {
    const choose = 1.0;
    ctx.save(); cam(ctx, 690, 560, key(lt, [[0, 1.62], [5.5, 1.45, E.io2]]));
    Pr.theoRoom(ctx, { clock: "3:52", lamp: prog(lt, choose, choose + 1.5), dark: 0.3 * (1 - prog(lt, choose, choose + 1.5)), rain: 1 });
    tempter(ctx, 390, 830, { alpha: 1, col: PINK, grin: lerp(1.2, -0.4, prog(lt, choose, choose + 1)), look: 6, dissolve: prog(lt, choose + 0.4, choose + 2.2) });
    drawPerson(ctx, Object.assign({}, SAM, { e: { eyes: lt < choose ? "half" : "wide", look: [0.6, 0.2], brow: 0.5, mouth: lt < choose + 2 ? "flat" : "smile", tear: prog(lt, 1.6, 3) * 0.6 }, lit: 0.9, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } }));
    ctx.restore();
    narr(ctx, [{ text: "This time, he called back." }], t, 21.0, 24.8);
  });

  // 5 — closing line + title card
  shot(25.0, DURATION, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [{ text: "Five minutes for the feed.", size: 60, weight: "400" }, { text: "Five minutes for her.", size: 78, delay: 1.3 }], t, 25.3, 27.6, { center: true, gap: 1.4 });
    const a = prog(t, 27.8, 28.4) * (1 - prog(t, DURATION - 0.4, DURATION));
    ctx.save(); ctx.globalAlpha = a; X.setFont(ctx, 130); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = PAL.white; ctx.fillText("FIVE MORE MINUTES.", W / 2, 520);
    ctx.strokeStyle = PINK; ctx.lineWidth = 7; ctx.lineCap = "round"; const uw = 700 * prog(t, 28.4, 29.2, E.out3); ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 600); ctx.lineTo(W / 2 + uw / 2, 600); ctx.stroke(); ctx.restore();
  }, { look: { vignette: 0 } });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    const h = hudFrom(t, HUD, HUD_STYLE);
    if (h && t > 4 && t < 25) hud(ctx, h);
    let black = 0;
    for (const [ft, d] of [[4.0, 0.7], [25.0, 0.5]]) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    post(ctx, Object.assign({ black }, s.look || {}));
    ctx.restore();
  }

  const events = () => ({ taps: [], whisper: [9.8], swipe: [4.6, 6.2, 7.8, 10.5, 12.0], ring: [21.8] });
  window.FILM = { renderAt, DURATION, SHOTS, events };
})();
