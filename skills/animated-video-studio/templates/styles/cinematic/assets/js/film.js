// film.js — the shot list. THIS is the file you rewrite for every new video.
// Demo (cinematic style, ~26 s, narrated): "What if you could see in the dark, like a cat?"
// Cinematic grammar: rim-lit characters, dusk palettes, depth of field (blurred layers), slow camera pushes,
// extreme close-ups, data on screen. Shots are anchored to narration lines with at("id") / end("id").
(function () {
  const { W, H, G, clamp, lerp, E, prog, key } = F;
  const { P, posesAt, walk, run, idle, tweak } = STICK;
  const { FX, GFX, cam } = WORLD;
  const { VO, at, end, subtitles, title } = TXT;
  const { fig, bust, sky, city, street, room, bokeh, dof, grade, stat, compare, cone } = CINE;

  const DURATION = VO.duration || 26;
  const ACCENT = "#ffd27a";
  // the cast — defined once, never changed between shots
  const NIA = { top: "#e4572e", pants: "#2a2438", hair: "bun" };              // our hero: orange hoodie, hair bun
  const OSI = { top: "#2e9e6a", pants: "#1f2a2a", hat: "cap", hatCol: "#f4c430" }; // her friend: green hoodie, yellow cap
  const DUSK = { col: "#ffb35c", side: -1 }, MOON = { col: "#8fd3ff", side: 1 };

  const SHOTS = [];
  const shot = (a, b, f) => SHOTS.push({ a, b, f });
  const GROUND = 960;

  // 0 — HOOK: dusk street; Nia walks in, stops, turns to us — her eyes light up
  shot(0, at("mirror"), (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 540, key(lt, [[0, 1.0], [4, 1.08, E.sine]]));
    sky(ctx, { top: "#140f30", mid: "#4a2f6e", bottom: "#e88a5a", sun: { x: 1450, y: 640, r: 60 }, t, clouds: 5 });
    city(ctx, 760, { blur: 6, col: "#2a1d3c", seed: 4 });
    street(ctx, GROUND, { lamps: [320, 1600], lampOn: prog(lt, 0.5, 1.5), tree: 1180 });
    dof(ctx, 5, (c) => fig(c, { x: 1450, y: GROUND - 30, s: 1.05, dir: -1, look: OSI, pose: idle(P.relaxed, t), rim: DUSK, t }));
    const x = lerp(-80, 760, prog(lt, 0, 2.2, E.out2));
    const pose = lt < 2.2 ? walk(lt * 1.7) : posesAt(lt, [[2.2, "stand"], [2.6, "relaxed"]]);
    fig(ctx, { x, y: GROUND, s: 1.75, dir: 1, look: NIA, pose, rim: DUSK, face: { mood: lt < 2.6 ? "neutral" : "smug", glow: lt > 2.7, look: [0.2, 0] }, t });
    ctx.restore();
    title(ctx, [{ t: "WHAT IF YOU COULD" }], W / 2, 150, t, 0.4, at("mirror") - 0.1, { size: 92 });
    title(ctx, [{ t: "SEE IN THE " }, { t: "DARK?", c: "#ffe35a" }], W / 2, 260, t, 0.8, at("mirror") - 0.1, { size: 110 });
  });

  // 1 — MIRROR: extreme close-up, slow push; a label names the secret
  shot(at("mirror"), at("bounce"), (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 540, key(lt, [[0, 1.0], [3, 1.12, E.sine]]));
    sky(ctx, { top: "#0f0b24", mid: "#2b1c4a", bottom: "#6a3a5a" });
    bokeh(ctx, 26, 5);
    bust(ctx, 1080, 520, 260, { look: NIA, rim: DUSK, face: { mood: "neutral", glow: true, look: [-0.3, 0] }, dir: -1, t });
    ctx.restore();
    stat(ctx, "TAPETUM LUCIDUM", 470, 380, t, at("mirror") + 0.9, at("bounce") - 0.1, { size: 58 });
    stat(ctx, "a mirror behind the retina", 470, 450, t, at("mirror") + 1.3, at("bounce") - 0.1, { size: 36, col: "#ffffff" });
  });

  // 2 — BOUNCE: the eye as a diagram; a ray goes in, hits the mirror, comes back out
  shot(at("bounce"), at("sixth"), (ctx, lt, t) => {
    ctx.fillStyle = "#0e0a1c"; ctx.fillRect(0, 0, W, H); bokeh(ctx, 12, 8);
    const cx = 1060, cy = 540, R = 300;
    ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = "#1c1630"; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = "#f4ede0"; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-R * 0.86, 0, 40, 110, 0, 0, Math.PI * 2); ctx.fillStyle = "#8fd3ff55"; ctx.fill(); ctx.strokeStyle = "#8fd3ff"; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R - 22, -0.9, 0.9); ctx.lineWidth = 22; ctx.strokeStyle = "#ffe35a"; ctx.shadowColor = "#ffe35a"; ctx.shadowBlur = 30; ctx.stroke();
    ctx.restore();
    const k1 = prog(lt, 0.3, 1.5, E.io2), k2 = prog(lt, 1.7, 2.9, E.io2);
    GFX.arrow(ctx, [cx - 760, cy - 40], [cx + R - 40, cy - 10], k1, { col: "#ffffff", w: 10, bend: 0 });
    if (k2 > 0) GFX.arrow(ctx, [cx + R - 40, cy + 10], [cx - 760, cy + 60], k2, { col: "#ffe35a", w: 10, bend: 0 });
    stat(ctx, "light in", cx - 600, cy - 110, t, at("bounce") + 0.5, 1e9, { col: "#fff", size: 40 });
    stat(ctx, "second chance", cx - 560, cy + 140, t, at("bounce") + 2.2, 1e9, { size: 44 });
    stat(ctx, "MIRROR", cx + 170, cy - 300, t, at("bounce") + 1.4, 1e9, { size: 44 });
  });

  // 3 — ONE SIXTH: her room at dusk, out of focus; the comparison grows on top
  shot(at("sixth"), at("night"), (ctx, lt, t) => {
    dof(ctx, 9, (c) => { room(c, { desk: [1300, 760] }); fig(c, { x: 640, y: 930, s: 1.3, dir: 1, look: NIA, pose: idle(P.think, t), rim: DUSK, face: { mood: "surprised" }, t }); });
    ctx.fillStyle = "rgba(10,8,20,0.45)"; ctx.fillRect(0, 0, W, H);
    const k = prog(lt, 0.4, 1.8, E.out3);
    compare(ctx, 380, 440, 900, [{ label: "YOU", v: 1, col: "#8fd3ff", text: "100%" }, { label: "CAT", v: 1 / 6, col: "#ffe35a", text: "≈ 17%" }], k, { gap: 140 });
    stat(ctx, "light needed to see", W / 2, 300, t, at("sixth") + 0.3, 1e9, { size: 48, col: "#fff" });
  });

  // 4 — NIGHT: the street goes dark… then, through her eyes, it brightens. Osi trips in the dark.
  shot(at("night"), at("price"), (ctx, lt, t) => {
    const vis = prog(lt, 1.0, 2.4, E.io2);       // 0 = human eyes, 1 = cat eyes
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.05], [4, 1.15, E.sine]]));
    sky(ctx, { top: "#05060f", mid: "#141a33", bottom: "#24304d" });
    city(ctx, 760, { blur: 5, col: "#121628", seed: 9 });
    street(ctx, GROUND, { lamps: [1500], lampOn: 0.15, ground: "#151824" });
    fig(ctx, { x: 1320, y: GROUND, s: 1.5, dir: -1, look: OSI, pose: posesAt(lt, [[0, "stand"], [1.6, "scared"]]), rim: MOON, face: { mood: lt < 1.6 ? "neutral" : "scared", look: [-0.6, 0.2] }, t });
    const x = lerp(260, 820, prog(lt, 0.2, 2.6, E.lin));
    fig(ctx, { x, y: GROUND, s: 1.7, dir: 1, look: NIA, pose: lt < 2.6 ? run(lt * 2.4) : P.relaxed, rim: MOON, face: { mood: "happy", glow: true }, t });
    if (lt < 2.6) FX.speedLines(ctx, x - 60, GROUND - 200, 1, t, 0.6);
    FX.icon(ctx, "?", 1320, 400, t, at("night") + 1.8, 1e9);
    ctx.restore();
    // what she sees: the night lifted toward evening (a warm screen pass)
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = `rgba(120,140,190,${0.42 * vis})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    stat(ctx, "CAT VISION", W / 2, 120, t, at("night") + 1.2, 1e9, { size: 50, col: "#ffe35a" });
  });

  // 5 — THE PRICE: daylight, colours drained, details soft; she squints
  shot(at("price"), at("end"), (ctx, lt, t) => {
    const k = prog(lt, 0.5, 1.6, E.io2);
    ctx.save(); ctx.filter = `saturate(${1 - 0.75 * k}) blur(${2.5 * k}px)`;
    sky(ctx, { top: "#6fb4ff", mid: "#a8d4ff", bottom: "#fff1d6", sun: { x: 300, y: 200, r: 80 } });
    city(ctx, 760, { col: "#8b93b8", lights: false, seed: 4 });
    street(ctx, GROUND, { ground: "#9d9aa6", rail: "#6b6880", tree: 1500 });
    ctx.restore();
    fig(ctx, { x: 820, y: GROUND, s: 1.85, dir: 1, look: NIA, pose: idle(tweak(P.wave, { aF: 168, eF: 70, head: 8 }), t), rim: { col: "#fff6e0", side: -1 }, face: { mood: "tired" }, t });
    stat(ctx, "fewer colors", 1450, 250, t, at("price") + 1.2, 1e9, { size: 50, col: "#ffffff" });
    stat(ctx, "softer details", 1450, 330, t, at("price") + 1.8, 1e9, { size: 50, col: "#ffffff" });
  });

  // 6 — END: rooftop, moonlight, both sitting; the question lands
  shot(at("end"), DURATION, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.12], [5, 1.0, E.sine]]));
    sky(ctx, { top: "#070a1c", mid: "#1a2246", bottom: "#3b3a6b" });
    WORLD.stars(ctx, 120, t, 6); WORLD.moon(ctx, 1650, 330, 80);
    city(ctx, 920, { col: "#141a33", seed: 2, h: 340 });
    ctx.fillStyle = "#0d0f1c"; ctx.fillRect(-W, 900, W * 3, H);
    fig(ctx, { x: 800, y: 905, s: 1.6, dir: 1, look: NIA, pose: P.sitGround, rim: MOON, face: { mood: "happy", glow: true, look: [0.5, -0.6] }, t });
    fig(ctx, { x: 1080, y: 905, s: 1.45, dir: -1, look: OSI, pose: P.sitGround, rim: MOON, face: { mood: "smug", look: [-0.5, -0.3] }, t });
    ctx.restore();
    title(ctx, [{ t: "COLORS " }, { t: "OR", c: ACCENT }, { t: " NIGHT?" }], W / 2, 190, t, end("end") - 0.6, 1e9, { size: 110 });
  });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    grade(ctx, { vignette: 0.55, grain: 0.05, frame: G.frame });
    subtitles(ctx, t, { accent: ACCENT });
    FX.fade(ctx, 1 - prog(t, 0, 0.5) + prog(t, DURATION - 0.8, DURATION));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
