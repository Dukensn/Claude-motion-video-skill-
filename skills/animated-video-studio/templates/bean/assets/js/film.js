// film.js — the shot list. THIS is the file you rewrite for every new film.
// Demo (36 s): cold open card → room with HUD → phone draft typed and deleted → the antagonist whispers → closing line → title.
// Every shot: shot(start, end, (ctx, lt, t) => { ... }) where lt = time inside the shot, t = film time.
(function () {
  const { W, H, PAL, G, clamp, lerp, E, prog, key } = F;
  const { drawHead, drawPerson, drawPride } = C;
  const { narr, hand, hud, bubble, post } = X;
  const { typer, KB, thumbFor, cam, phoneShot, hudFrom } = KIT;

  const DURATION = 36; // keep in sync with data-duration in index.html

  // HUD keyframes: [time, label, number A, number B, visible]
  const HUD = [[6.0, "APRIL", 0, 0, 1], [20.6, "APRIL", 1, 0, 1], [28.0, "APRIL", 1, 0, 0]];
  const HUD_STYLE = { l1: "DRAFTS", l2: "SENT", bw: 290 };

  const HIST = [{ who: "mom", text: "just tell me you ate.", ts: "Mar 14" }];

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  // 0 — cold open: setup line + twist line
  shot(0, 6.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [
      { text: "He wrote her a message every night.", size: 60, weight: "400" },
      { text: "He never sent one.", size: 78, delay: 1.8 },
    ], t, 0.5, 5.6, { center: true, gap: 1.4 });
  }, { look: { vignette: 0 } });

  // 1 — the room, phone glowing on his face
  shot(6.0, 13.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 700 + lt * 3, 580, key(lt, [[0, 1.22], [7, 1.32, E.sine]]));
    Pr.theoRoom(ctx, { clock: "11:52", lamp: 0.8 });
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64,
      armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12, tilt: 0.12,
      e: { eyes: "dot", look: [0.3, 0.7], brow: 0.5, mouth: "flat" }, lit: 0.8, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
    ctx.restore();
    narr(ctx, [{ text: "They hadn't spoken since March." }], t, 8.0, 12.6);
  });

  // 2 — the draft: typed, then deleted (the HUD counts it)
  const OPS = [[14.0, "type", "hey mom", 7], [16.0, "type", " i'm sorry about", 10], [18.8, "del", "all", 18]];
  shot(13.0, 22.0, (ctx, lt, t) => {
    const ty = typer(t, OPS);
    phoneShot(ctx, t, {
      st: { msgs: HIST, header: "Mom", status: "last seen yesterday", input: ty.text, caret: true, kb: true, pressed: ty.pressed, clock: "11:53" },
      thumb: thumbFor(t, ty), push: (tt) => 0.05 * prog(tt, 13, 22, E.sine),
    });
  });

  // 3 — the antagonist (an emotion with a neon outline) whispers in handwriting
  shot(22.0, 28.0, (ctx, lt, t) => {
    ctx.save();
    cam(ctx, 690, 560, key(lt, [[0, 1.55], [6, 1.65, E.sine]]));
    Pr.theoRoom(ctx, { clock: "11:58", lamp: 0.8 });
    drawPride(ctx, 380, 830, { alpha: prog(lt, 0.3, 1.8, E.out2), s: 1.0, grin: 1.1, look: 6 });
    drawPerson(ctx, { x: 560, y: 702, s: 1.1, pose: "sit", face: 0.6, legDir: 1, legDrop: 64, armL: [0.9, 1.6], armR: [-0.6, -1.7], lean: 0.12,
      e: { eyes: "dot", look: [-0.2, 0.2], brow: lt > 3 ? -0.6 : 0.5, mouth: lt > 3 ? "frown" : "flat" }, lit: 0.8, phone: { hand: "R", glow: 1, rot: 0.3, dx: -6 } });
    ctx.restore();
    hand(ctx, "let her text first.", 1000, 300, t, 23.0, 27.6, { size: 64, rot: -0.06 });
  });

  // 4 — the closing line, then the title card
  shot(28.0, 32.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    narr(ctx, [{ text: "Pride waits for the perfect words.", size: 62, weight: "400" }, { text: "Love just says hi.", size: 80, delay: 1.6 }], t, 28.4, 31.8, { center: true, gap: 1.4 });
  }, { look: { vignette: 0 } });
  shot(32.0, 36.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.2, 1.0) * (1 - prog(lt, 3.3, 4.0));
    ctx.save(); ctx.globalAlpha = a;
    X.setFont(ctx, 150); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = PAL.white;
    ctx.fillText("SAY HI.", W / 2, 470);
    ctx.strokeStyle = PAL.amber; ctx.lineWidth = 7; ctx.lineCap = "round";
    const uw = 460 * prog(lt, 0.8, 1.6, E.out3); ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 552); ctx.lineTo(W / 2 + uw / 2, 552); ctx.stroke();
    ctx.restore();
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
    if (h) hud(ctx, h);
    // fades from black at chosen shot starts, dips to black before them
    let black = 0;
    for (const [ft, d] of [[6.0, 0.8], [28.0, 0.5]]) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    for (const [a, b] of [[27.4, 28.0]]) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black }, s.look || {}));
    ctx.restore();
  }

  // typing times for the sound mix (keyboard taps)
  function events() {
    const taps = [];
    let prev = 0;
    for (let tt = OPS[0][0]; tt < OPS[OPS.length - 1][0] + 4; tt += 1 / 240) {
      const n = typer(tt, OPS).text.length;
      if (n !== prev) { taps.push([+tt.toFixed(3), n > prev ? "key" : "del"]); prev = n; }
    }
    return { taps };
  }

  window.FILM = { renderAt, DURATION, SHOTS, events };
})();
