// film.js — the shot list. THIS is the file you rewrite for every new video.
// Demo (digital style, 22 s, wordless): "STICK vs. THE SPREADSHEET".
// A stick figure pops out of a cell, kicks numbers around, gets chased by an angry error, traps it in a selection
// and deletes it — then the user's cursor copy-pastes him everywhere. No dialogue: every beat is a visible action,
// one beat every 2–4 s, sound effects on every hit.
(function () {
  const { W, H, G, clamp, lerp, E, prog, key } = F;
  const { P, posesAt, walk, run, idle, tweak } = STICK;
  const { FX, cam } = WORLD;
  const { title } = TXT;
  const { stick, sheet, cell, errorBox, cursor, pixels, glitch } = DIGI;

  const DURATION = VO.duration || 22;
  const BLUE = "#00b4d8";                      // our hero's colour — the only character colour in the film
  const DATA = { B2: 931, B3: 399, B4: 299, B5: 173, B6: 310, B7: 557, B8: 169, B9: 976, D3: 42, G4: 88 };
  const ROW = (r) => 170 + r * 52, COLX = (c) => 70 + c * 160;   // grid lines (sheet defaults)

  const SHOTS = [];
  const shot = (a, b, f) => SHOTS.push({ a, b, f });

  // 0 — the click: the cursor clicks C5, a stick figure pops out of the cell
  shot(0, 3.5, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 540, key(lt, [[0, 1.0], [3.5, 1.15, E.sine]]));
    sheet(ctx, { file: "Budget_FINAL_v7.xlsx", formula: lt > 1.2 ? "=C5" : "", data: DATA, sel: lt > 1.2 ? [2, 4, 2, 4] : null });
    const pop = E.back(prog(lt, 1.5, 1.9));
    if (pop > 0) stick(ctx, { x: COLX(2) + 80, y: ROW(4) + 52 * (1 - pop), s: 0.85 * pop, dir: 1, col: BLUE, pose: posesAt(lt, [[1.5, "jumpAir"], [1.9, "land"], [2.3, "stand"], [2.6, "wave"]]), t });
    pixels(ctx, COLX(2) + 80, ROW(4) + 26, t, 1.5, { n: 20 });
    const cx = lerp(1500, COLX(2) + 90, prog(lt, 0.1, 1.1, E.io2)), cy = lerp(900, ROW(4) + 30, prog(lt, 0.1, 1.1, E.io2));
    cursor(ctx, cx, cy, 1.2, { click: lt > 1.2 && lt < 1.6 ? (lt - 1.2) / 0.4 : 0 });
    ctx.restore();
  });

  // 1 — the kick: he struts along row 9 and punts the numbers off the sheet
  shot(3.5, 7.5, (ctx, lt, t) => {
    const x = lerp(COLX(1), COLX(5), prog(lt, 0, 3.4, E.lin));
    ctx.save(); cam(ctx, x + 80, 560, 1.45);
    sheet(ctx, { file: "Budget_FINAL_v7.xlsx", formula: "=SUM(B2:B9)", data: DATA });
    // two loose numbers lie on his path; each flies off when his foot hits it
    for (const [at, v] of [[1.5, 7], [2.9, 12]]) {
      const x0 = lerp(COLX(1), COLX(5), at / 3.4) + 95, y0 = ROW(8) - 26, dt = lt - at;
      if (dt < 0) cell(ctx, x0, y0, v, 0);
      else { cell(ctx, x0 + dt * 1100, y0 - dt * 800 + dt * dt * 900, v, dt * 7); FX.impact(ctx, x0 - 20, y0, t, 3.5 + at, 110, "#ffd166"); }
    }
    const kick = (lt > 1.25 && lt < 1.75) || (lt > 2.65 && lt < 3.15);
    stick(ctx, { x, y: ROW(8), s: 0.85, dir: 1, col: BLUE, pose: kick ? P.kick : walk(lt * 1.8), t });
    ctx.restore();
  });

  // 2 — the chase: #REF! wakes up, angry, and charges; he runs
  shot(7.5, 11.5, (ctx, lt, t) => {
    const ex = lerp(1900, 1100, prog(lt, 0.2, 1.2, E.out3)) - Math.max(0, lt - 1.8) * 420;
    const sx = lt < 1.8 ? 820 : 820 - (lt - 1.8) * 500;
    ctx.save(); cam(ctx, lt < 1.8 ? 960 : 960 - (lt - 1.8) * 300, 560, 1.25);
    sheet(ctx, { file: "Budget_FINAL_v7.xlsx", formula: "=B9/0", data: DATA });
    errorBox(ctx, ex, ROW(8) - 56, "#REF!", Math.sin(t * 9) * 0.06, { eyes: true, look: -1 });
    stick(ctx, { x: sx, y: ROW(9), s: 0.85, dir: lt < 1.8 ? 1 : -1, col: BLUE, pose: lt < 1.8 ? posesAt(lt, [[0, "stand"], [1.0, "scared"]]) : run(lt * 2.6), t });
    FX.icon(ctx, "!", sx + 40, ROW(9) - 330, t, 8.5, 9.4);
    if (lt > 1.8) FX.speedLines(ctx, sx + 80, ROW(9) - 90, -1, t, 0.8);
    ctx.restore();
  });

  // 3 — the trap: he drags a selection around the error… and hits Delete
  shot(11.5, 15.5, (ctx, lt, t) => {
    const k = prog(lt, 0.6, 2.0, E.io2), gone = 2.4;
    ctx.save(); cam(ctx, 960, 560, 1.15);
    sheet(ctx, { file: "Budget_FINAL_v7.xlsx", formula: lt > gone ? "" : "=B9/0", data: DATA, sel: [4, 5, Math.round(lerp(4, 8, k)), Math.round(lerp(5, 9, k))], selCol: "#1a73e8" });
    if (lt < gone) errorBox(ctx, COLX(7), ROW(7) + 10, "#REF!", Math.sin(t * 14) * 0.08, { eyes: true, look: -1, s: 0.8 });
    pixels(ctx, COLX(7), ROW(7) + 10, t, 11.5 + gone, { n: 34, cols: ["#d93025", "#fce8e6", "#ffffff"] });
    stick(ctx, { x: COLX(4) - 40, y: ROW(5) + 30, s: 0.85, dir: 1, col: BLUE, pose: lt < 2.0 ? tweak(P.point, { aF: 60 + 40 * k }) : posesAt(lt, [[2.0, "stand"], [2.5, "cheer"]]), t });
    if (lt > 1.9 && lt < 2.6) { ctx.font = "800 46px Inter"; ctx.fillStyle = "#1a73e8"; ctx.fillText("DELETE", COLX(4) - 120, ROW(3)); }
    ctx.restore();
    FX.flash(ctx, t, 11.5 + gone, 2);
  });

  // 4 — the twist: the user's cursor grabs him… Ctrl+C, Ctrl+V, V, V, V
  shot(15.5, DURATION, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 540, key(lt, [[0, 1.2], [3, 1.0, E.io2]]));
    sheet(ctx, { file: "Budget_FINAL_v7.xlsx", formula: "=COPY(STICK)", data: DATA });
    const spots = [[2, 4], [5, 3], [7, 6], [3, 9], [9, 8], [10, 3]];
    spots.forEach(([c, r], i) => {
      const at = i === 0 ? 0 : 1.6 + i * 0.35, k = E.back(prog(lt, at, at + 0.3));
      if (k <= 0) return;
      stick(ctx, { x: COLX(c) + 80, y: ROW(r + 1), s: 0.72 * k, dir: i % 2 ? -1 : 1, col: BLUE, pose: lt < 3.8 ? posesAt(lt, [[0, "stand"], [0.8, "scared"]]) : idle(i % 2 ? P.cheer : P.wave, t), t, seed: i + 1 });
      if (i) pixels(ctx, COLX(c) + 80, ROW(r + 1) - 60, t, 15.5 + at, { n: 12, seed: i });
    });
    const cx = lerp(1700, COLX(2) + 100, prog(lt, 0.1, 0.8, E.io2)), cy = lerp(200, ROW(4) - 60, prog(lt, 0.1, 0.8, E.io2));
    cursor(ctx, cx, cy, 1.4, { hand: lt > 0.8 && lt < 1.6 });
    ctx.restore();
    if (lt > 0.9 && lt < 1.6) { ctx.font = "800 70px Inter"; ctx.fillStyle = "#202124"; ctx.textAlign = "center"; ctx.fillText("Ctrl + C", W / 2, 260); ctx.textAlign = "left"; }
    if (lt > 1.7 && lt < 3.6) { ctx.font = "800 70px Inter"; ctx.fillStyle = "#202124"; ctx.textAlign = "center"; ctx.fillText("Ctrl + V", W / 2, 260); ctx.textAlign = "left"; }
    title(ctx, [{ t: "STICK ", c: BLUE }, { t: "vs. THE " }, { t: "SPREADSHEET", c: "#34c27a" }], W / 2, 980, t, 19.2, 1e9, { size: 96 });
  });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    if (t > 9.3 && t < 9.6) glitch(ctx, 1 - Math.abs(t - 9.45) / 0.15, G.frame);   // the error lunges
    FX.fade(ctx, 1 - prog(t, 0, 0.3) + prog(t, DURATION - 0.6, DURATION));
    ctx.restore();
  }

  // sound cues for tools/mix.py (scripts/events.cjs writes them to build/events.json)
  const events = () => ({ taps: [], hits: [5.0, 6.4], click: [1.2, 16.3], pop: [1.5, 17.5, 17.85, 18.2, 18.55, 18.9], whoosh: [3.5, 7.5, 9.3, 11.5, 15.5], del: [13.9] });
  window.FILM = { renderAt, DURATION, SHOTS, events };
})();
