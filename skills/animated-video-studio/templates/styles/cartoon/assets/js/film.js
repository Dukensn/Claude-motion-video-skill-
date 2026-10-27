// film.js — the shot list. THIS is the file you rewrite for every new video.
// Demo (cartoon comedy, vertical Short 1080x1920, 20 s): "THE LAST CROISSANT".
// Comedy grammar: set-up (what he wants) → the threat → the turn-away → the steal → the chase → the backfire → the button.
// Big expressions, one gag per beat, a sound on every action, speech bubbles of 2–5 words.
(function () {
  const { W, H, G, clamp, lerp, E, prog, key } = F;
  const { P, posesAt, walk, run, idle, tweak } = STICK;
  const { FX, cam } = WORLD;
  const { title } = TXT;
  const { fig, pigeon, croissant, lamp, stall, sky, ground, pow, arcs, dust, say } = TOON;

  const DURATION = VO.duration || 20;
  const BAKER = { skin: "#ffd9b3", shirt: "#ffffff", pants: "#2c3e50", hat: "chef", mustache: true, hairCol: "#4a2c1a", apron: "#e74c3c", build: "wide" };
  const GROUND = 1500, COUNTER = 1240;   // counter top (stall at y = GROUND, 260 tall)

  const SHOTS = [];
  const shot = (a, b, f) => SHOTS.push({ a, b, f });
  const set = (ctx) => { sky(ctx, { clouds: 3 }); ground(ctx, GROUND, { col: "#9bd770", path: "#f2e7b6" }); stall(ctx, 540, GROUND, 1, { sign: "BEST CROISSANT", col: "#e63946" }); };

  // 0 — the set-up: the last croissant of the day
  shot(0, 3, (ctx, lt, t) => {
    ctx.save(); cam(ctx, W / 2, 1010, key(lt, [[0, 1.3], [3, 1.38, E.sine]]));
    set(ctx);
    croissant(ctx, 560, COUNTER - 6, E.back(prog(lt, 0.4, 0.8)));
    fig(ctx, { x: 330, y: GROUND, s: 1.5, dir: 1, look: BAKER, pose: posesAt(lt, [[0, "stand"], [0.3, tweak(P.point, { aF: 70 })], [0.9, "hipsHands"]]), face: { mood: "happy", look: [0.6, 0.4] }, t });
    ctx.restore();
    say(ctx, "The last one!", 420, 380, t, 1.0, 3.0, { tail: [330, 560] });
  });

  // 1 — the threat: a pigeon lands, eyes on the prize
  shot(3, 6, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 620, 1150, key(lt, [[0, 1.2], [3, 1.45, E.io2]]));
    set(ctx); croissant(ctx, 560, COUNTER - 6, 1);
    fig(ctx, { x: 330, y: GROUND, s: 1.5, dir: 1, look: BAKER, pose: idle(P.hipsHands, t), face: { mood: "happy" }, t });
    const land = prog(lt, 0, 0.9, E.out3);
    pigeon(ctx, lerp(1200, 790, land), lerp(500, COUNTER - 95, land), 0.85, { dir: -1, fly: land < 1 ? 1 : 0, t, mood: lt > 1.2 ? "sneaky" : null, look: -1 });
    ctx.restore();
  });

  // 2 — the turn-away: a customer waves; the pigeon strikes
  shot(6, 9, (ctx, lt, t) => {
    ctx.save(); cam(ctx, W / 2, 1010, 1.25);
    set(ctx);
    const grab = 1.4;
    if (lt < grab) croissant(ctx, 560, COUNTER - 6, 1);
    fig(ctx, { x: 330, y: GROUND, s: 1.5, dir: -1, look: BAKER, pose: idle(P.wave, t), face: { mood: "happy", talk: lt < 1.2 ? Math.abs(Math.sin(t * 12)) : 0 }, t });
    pigeon(ctx, lerp(790, 640, prog(lt, grab - 0.3, grab, E.in2)), COUNTER - 95, 0.85, { dir: -1, t, mood: "sneaky", croissant: lt > grab });
    ctx.restore();
    say(ctx, "Bonjour madame!", 300, 470, t, 6.1, 7.6, { tail: [200, 600], size: 46 });
    FX.icon(ctx, "...", 760, 880, t, 6 + grab + 0.2, 9);
  });

  // 3 — the discovery
  shot(9, 11, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 400, 1000, key(lt, [[0, 1.5], [0.25, 1.75, E.out3]]));
    set(ctx);
    fig(ctx, { x: 330, y: GROUND, s: 1.5, dir: 1, look: BAKER, pose: posesAt(lt, [[0, "stand"], [0.2, "scared"]]), face: { mood: lt < 0.2 ? "neutral" : "surprised", sweat: true }, t });
    pigeon(ctx, lerp(640, 1100, prog(lt, 0.4, 2)), lerp(COUNTER - 95, 700, prog(lt, 0.4, 2)), 0.75, { dir: 1, t, fly: 1, croissant: true });
    ctx.restore();
    FX.icon(ctx, "!", 540, 300, t, 9.2, 11);
  });

  // 4 — the chase and the backfire: swing, miss, BONK
  shot(11, 15, (ctx, lt, t) => {
    const swing = 2.2, hit = 2.5;
    ctx.save(); cam(ctx, W / 2, 1010, 1.22);
    sky(ctx, { clouds: 2, seed: 9 }); ground(ctx, GROUND, { col: "#9bd770", path: "#f2e7b6" });
    lamp(ctx, 760, GROUND, 1.1);
    const bx = lt < hit ? lerp(-100, 560, prog(lt, 0, hit, E.lin)) : 560;
    const pose = lt < swing ? run(lt * 2.6) : lt < hit + 0.2 ? posesAt(lt, [[swing, tweak(P.punch, { aF: 150 })], [hit, P.punch]]) : P.hit;
    fig(ctx, { x: bx, y: GROUND, s: 1.5, dir: 1, look: BAKER, pose, hold: lt < hit + 0.2 ? "baguette" : null, face: { mood: lt < hit ? "angry" : "tired", dizzy: lt > hit + 0.2 }, t });
    if (lt > swing - 0.1 && lt < hit + 0.1) arcs(ctx, bx + 60, GROUND - 330, 180, -1.8, -0.6);
    pigeon(ctx, lerp(500, 980, prog(lt, 0, 3.5)), 620 + Math.sin(t * 3) * 40, 0.6, { dir: 1, t, fly: 1, croissant: true });
    ctx.restore();
    pow(ctx, "BONK!", 760, 760, t, 11 + hit, { dur: 0.9 });
  });

  // 5 — the button: the pigeon eats on top of the lamp; crumbs rain on the baker
  shot(15, DURATION, (ctx, lt, t) => {
    ctx.save(); cam(ctx, W / 2, 1060, key(lt, [[0, 1.15], [5, 1.22, E.sine]]));
    sky(ctx, { clouds: 2, seed: 9 }); ground(ctx, GROUND, { col: "#9bd770", path: "#f2e7b6" });
    lamp(ctx, 760, GROUND, 1.1);
    pigeon(ctx, 760, GROUND - 860, 0.55, { dir: -1, t, croissant: lt < 2.6, mood: "sneaky" });
    for (let i = 0; i < 9; i++) { const ph = ((lt * 0.9 + i * 0.37) % 1.4); ctx.fillStyle = "#e0a458"; ctx.beginPath(); ctx.arc(700 + (i % 3) * 30 - ph * 60, GROUND - 780 + ph * 520, 8, 0, Math.PI * 2); ctx.fill(); }
    fig(ctx, { x: 560, y: GROUND, s: 1.5, dir: 1, look: BAKER, pose: lt < 1.5 ? P.sitGround : idle(P.facepalm, t), face: { mood: lt < 1.5 ? "tired" : "sad", dizzy: lt < 1.5 }, t });
    ctx.restore();
    say(ctx, "That was MY croissant.", W / 2 - 60, 520, t, 16.6, 19.4, { size: 46, tail: [520, 760] });
    title(ctx, [{ t: "THE LAST" }], W / 2, 150, t, 17.8, 1e9, { size: 120 });
    title(ctx, [{ t: "CROISSANT", c: "#ffd166" }], W / 2, 275, t, 18.0, 1e9, { size: 120 });
  });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    FX.fade(ctx, 1 - prog(t, 0, 0.3) + prog(t, DURATION - 0.5, DURATION));
    ctx.restore();
  }

  const events = () => ({ taps: [], pop: [0.4], flap: [3.0, 10.4, 11.0], grab: [7.4], gasp: [9.2], whoosh: [13.2], bonk: [13.5], crunch: [15.5, 16.2, 16.9], talk: [[1.0, 1.6], [6.1, 7.0], [16.6, 18.0]] });
  window.FILM = { renderAt, DURATION, SHOTS, events };
})();
