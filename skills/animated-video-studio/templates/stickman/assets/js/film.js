// film.js — the shot list. THIS is the file you rewrite for every new video.
// Demo: a narrated "What if" (about 40 s). Shots are anchored to narration lines with at("id") / end("id"),
// so when the voice changes length the picture follows. Every shot: shot(a, b, (ctx, lt, t) => {...}).
(function () {
  const { W, H, G, clamp, lerp, E, prog, key } = F;
  const { draw, P, posesAt, walk, run, idle, tweak } = STICK;
  const { BG, PROP, FX, GFX, cam, earth, moon } = WORLD;
  const { VO, at, end, subtitles, caption, title } = TXT;

  const DURATION = VO.duration || 40; // set by tools/voice.py (narration length + tail)
  const ACCENT = "#ffd166";
  const HERO = { color: "#e63946", hat: "band" };   // our narrator-character: red headband

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));

  // 0 — HOOK: night, the hero looks up at the Moon; big question pops
  shot(0, at("dark"), (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.0], [6, 1.08, E.sine]]));
    BG.night(ctx, { t, moon: { x: 1480, y: 380, r: 90 } });
    BG.hills(ctx, 900, { cols: ["#1f3a3a", "#173030", "#102424"] });
    draw(ctx, { x: 700, y: 930, s: 1.15, dir: 1, look: HERO, t, pose: idle(P.stand, t), face: { mood: "happy", look: [0.6, -0.8] }, ink: "#0d0d0d" });
    ctx.restore();
    title(ctx, [{ t: "WHAT IF THE " }, { t: "MOON", c: ACCENT }], W / 2, 170, t, 0.5, at("dark") - 0.1, { size: 120 });
    title(ctx, [{ t: "DISAPPEARED?" }], W / 2, 300, t, 1.0, at("dark") - 0.1, { size: 120 });
  });

  // 1 — THE MOON VANISHES: flash, the sky goes darker, "?" over his head
  shot(at("dark"), at("tides"), (ctx, lt, t) => {
    const gone = at("dark") + 0.9;
    const [sx, sy] = FX.shake(t, gone, gone + 0.5, 10);
    ctx.save(); cam(ctx, 900 + sx, 600 + sy, key(lt, [[0, 1.15], [4, 1.25, E.sine]]));
    BG.night(ctx, { t, top: t > gone ? "#05070f" : "#0b1230", moon: t < gone ? { x: 1380, y: 260, r: 90 } : null });
    if (t >= gone) { const k = prog(t, gone, gone + 0.6, E.out3); ctx.save(); ctx.globalAlpha = 1 - k; moon(ctx, 1480, 380, 90 * (1 + k * 0.6)); ctx.restore(); }
    BG.hills(ctx, 900, { cols: ["#1f3a3a", "#173030", "#102424"] });
    const mood = t < gone ? "neutral" : "surprised";
    draw(ctx, { x: 700, y: 930, s: 1.15, dir: 1, look: HERO, t, pose: t < gone ? P.stand : posesAt(t, [[gone, "stand"], [gone + 0.3, "scared"]]), face: { mood, look: [0.6, -0.8], sweat: t > gone + 0.6 } });
    FX.icon(ctx, "?", 760, 450, t, gone + 0.7, at("tides") - 0.1);
    ctx.restore();
    FX.whiteFlash(ctx, t, gone, 0.3);
  });

  // 2 — MORNING AT THE BEACH: he runs to the water, which has pulled back
  shot(at("tides"), at("pull"), (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 560, 1.0);
    BG.sky(ctx, { top: "#8fd3ff", bottom: "#fff1d6", sun: { x: 300, y: 220, r: 70 } });
    const sea = 640 + prog(lt, 0.5, 4, E.io2) * 120;           // the waterline drops
    BG.ocean(ctx, sea, t);
    ctx.fillStyle = "#f2d49b"; ctx.beginPath(); ctx.moveTo(0, 860); ctx.lineTo(W, 800); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    const x = lerp(250, 1100, prog(lt, 0, 3.0, E.lin));
    const pose = lt < 3.0 ? run(lt * 1.6) : posesAt(lt, [[3.0, run(0)], [3.4, "point"]]);
    if (lt < 3.0) FX.speedLines(ctx, x, 830, 1, t, 0.8);
    draw(ctx, { x, y: 845, s: 1.0, dir: 1, look: HERO, t, pose, face: { mood: lt < 3 ? "determined" : "worried" } });
    FX.dust(ctx, x - 40, 845, t, at("tides") + 0.4);
    ctx.restore();
  });

  // 3 — EXPLAINER: Earth, Moon and the tidal bulge, drawn on a whiteboard
  shot(at("pull"), at("tilt"), (ctx, lt, t) => {
    BG.room(ctx, { wall: "#eef1f4", floor: 900, board: [260, 110, 1400, 640] });
    const t0 = at("pull");
    // Earth with a bulge pointing to the Moon
    const k = prog(t, t0 + 0.3, t0 + 1.2, E.out3);
    const bulge = t < at("third") ? 1 : lerp(1, 0.33, prog(t, at("third") + 0.4, at("third") + 1.6));
    ctx.save(); ctx.beginPath(); ctx.ellipse(720, 430, 150 * k + 60 * bulge * k, 150 * k, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(77,171,247,0.35)"; ctx.fill(); ctx.restore();
    earth(ctx, 720, 430, 140 * k, t * 0.05);
    const mk = prog(t, t0 + 0.8, t0 + 1.6, E.back);
    if (t < at("third") + 0.4) moon(ctx, 1320, 430, 80 * mk);
    else { ctx.save(); ctx.globalAlpha = 1 - prog(t, at("third") + 0.1, at("third") + 0.5); moon(ctx, 1320, 430, 80); ctx.restore(); }
    GFX.arrow(ctx, [1250, 430], [920, 430], prog(t, t0 + 1.4, t0 + 2.2), { bend: 0, col: "#e63946" });
    GFX.label(ctx, "PULL", 1085, 380, t, t0 + 2.0, at("third") + 0.3, { font: "hand", size: 64, col: "#e63946" });
    // the counter: tide height shrinking to a third
    if (t > at("third")) {
      GFX.bars(ctx, 1150, 690, 420, 230, [{ label: "Today", v: 100, col: "#4dabf7" }, { label: "No Moon", v: lerp(100, 33, prog(t, at("third") + 0.6, at("third") + 2.0)), col: "#adb5bd" }], t, at("third") + 0.2, { max: 100, size: 30 });
    }
    // the hero points at the board
    draw(ctx, { x: 1760, y: 960, s: 0.95, dir: -1, look: HERO, t, pose: idle(t < t0 + 1.5 ? P.stand : P.point, t), face: { mood: "happy" }, hold: t > t0 + 1.5 ? "pointer" : null });
  });

  // 4 — TILT: Earth wobbles in space; the hero, tiny on top, tries to keep his balance
  shot(at("tilt"), at("thanks"), (ctx, lt, t) => {
    BG.space(ctx, { t });
    const tilt = 23 + Math.sin(lt * 1.3) * prog(lt, 1, 4) * 15;
    ctx.save(); ctx.translate(960, 560); ctx.rotate((tilt * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, -420); ctx.lineTo(0, 420); ctx.setLineDash([18, 14]); WORLD.stroke(ctx, 5, "rgba(255,255,255,0.6)"); ctx.setLineDash([]);
    earth(ctx, 0, 0, 250, t * 0.1);
    draw(ctx, { x: 0, y: -248, s: 0.8, dir: 1, look: HERO, t, pose: Math.sin(lt * 1.3) > 0 ? P.scared : tweak(P.scared, { torso: 15 }), face: { mood: "scared" } });
    ctx.restore();
    GFX.label(ctx, `${Math.round(tilt)}°`, 1500, 300, t, at("tilt") + 1.0, 1e9, { size: 90, font: "title", col: ACCENT });
    if (t > at("seasons")) {
      GFX.icon(ctx, "sun", 330, 300, prog(t, at("seasons") + 0.2, at("seasons") + 0.6, E.back));
      GFX.label(ctx, "❄", 330, 640, t, at("seasons") + 0.9, 1e9, { size: 140, col: "#a5d8ff" });
    }
  });

  // 5 — ENDING: the Moon is back; he waves at it
  shot(at("thanks"), DURATION, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.12], [6, 1.0, E.sine]]));
    BG.night(ctx, { t, moon: { x: 1480, y: 380, r: 90 } });
    BG.hills(ctx, 900, { cols: ["#1f3a3a", "#173030", "#102424"] });
    draw(ctx, { x: 700, y: 930, s: 1.15, dir: 1, look: HERO, t, pose: posesAt(lt, [[0, "stand"], [1.2, "wave"], [1.6, P.wave], [1.9, tweak(P.wave, { eF: 50 })], [2.2, P.wave], [2.5, tweak(P.wave, { eF: 50 })]]), face: { mood: "happy", look: [0.6, -0.8] } });
    FX.icon(ctx, "heart", 1250, 330, t, at("thanks") + 2.2, DURATION);
    ctx.restore();
  });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    subtitles(ctx, t, { accent: ACCENT });
    FX.vignette(ctx, 0.25);
    // fade in at the start, out at the end; a quick dip into the explainer
    FX.fade(ctx, 1 - prog(t, 0, 0.6) + prog(t, DURATION - 0.8, DURATION));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
