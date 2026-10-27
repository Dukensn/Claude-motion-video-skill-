// film.js — the shot list. THIS is the file you rewrite for every new video.
// Demo (history sketch style, ~32 s, narrated): Toussaint Louverture in 7 shots.
// Grammar: ink on parchment, a "profile card" with ticks for the humour, maps with hatched regions and date stamps,
// period costumes, one red accent. Facts are checked; uncertain ones are hedged ("around 1743", "reportedly").
(function () {
  const { W, H, G, clamp, lerp, E, prog, key } = F;
  const { P, posesAt, walk, run, idle, tweak } = STICK;
  const { FX, cam } = WORLD;
  const { VO, at, end, subtitles, title } = TXT;
  const S = SKETCH;

  const DURATION = VO.duration || 32;
  const BLUE = "#1d3557";
  const TL = { costume: "general", col: S.RED, hatCol: BLUE };            // Toussaint: general's bicorne, red sash
  const FR = { costume: "general", col: "#1d3557", hatCol: "#2b2117" };    // the French officer: dark hat, blue sash
  // a rough Hispaniola and its western third (Saint-Domingue, today Haiti)
  const ISLAND = [[230, 320], [330, 300], [430, 290], [520, 260], [620, 250], [760, 240], [900, 250], [1050, 270], [1200, 290], [1350, 320], [1480, 330], [1600, 360], [1680, 400], [1660, 440], [1560, 470], [1450, 520], [1300, 560], [1150, 560], [1050, 600], [950, 640], [850, 620], [760, 600], [640, 610], [520, 620], [380, 610], [260, 590], [190, 560], [260, 540], [400, 540], [520, 520], [560, 470], [520, 430], [450, 420], [380, 380], [300, 350]];
  const WEST = [[230, 320], [330, 300], [430, 290], [520, 260], [620, 250], [700, 246], [690, 400], [680, 605], [640, 610], [520, 620], [380, 610], [260, 590], [190, 560], [260, 540], [400, 540], [520, 520], [560, 470], [520, 430], [450, 420], [380, 380], [300, 350]];

  const SHOTS = [];
  const shot = (a, b, f) => SHOTS.push({ a, b, f });
  const GROUND = 960;

  // 0 — HOOK: the profile card
  shot(0, at("born"), (ctx, lt, t) => {
    S.paper(ctx);
    S.mountains(ctx, [[980, 760, 520, 330], [1330, 760, 600, 420]]);
    S.ground(ctx, 760);
    S.crowd(ctx, 1000, 1880, 900, { n: 12, rows: 2, s: 0.5, costume: "soldier", col: S.RED, hold: "spear", every: 2, t });
    S.fig(ctx, { x: 700, y: GROUND + 40, s: 1.9, dir: 1, pose: idle(P.pointUp, t), hold: "sword", face: { mood: "smirk" }, t, ...TL });
    S.card(ctx, "TOUSSAINT\nLOUVERTURE", ["General", "Strategist", "Absolute legend"], 60, 150, t, 0.3, { size: 100, tx: 60, ty: 330, step: 0.6 });
  });

  // 1 — BORN: the map, the colony hatched, a date stamp
  shot(at("born"), at("revolt"), (ctx, lt, t) => {
    S.paper(ctx);
    ctx.save(); cam(ctx, 960, 470, key(lt, [[0, 0.92], [4.5, 1.08, E.sine]]));
    S.map(ctx, { x: 40, y: 40, land: [ISLAND], regions: [{ poly: WEST, k: prog(lt, 1.2, 2.0) }], labels: [["Saint-Domingue", 440, 230, 54, S.RED], ["(French colony)", 440, 690, 40], ["Atlantic Ocean", 1100, 150, 44]] });
    ctx.restore();
    S.stamp(ctx, "c. 1743", 1600, 700, t, at("born") + 0.6);
  });

  // 2 — REVOLT: night of 1791, torches, the crowd charges behind him
  shot(at("revolt"), at("rule"), (ctx, lt, t) => {
    S.paper(ctx, { c0: "#d9c49a", c1: "#bfa676" });
    ctx.save(); cam(ctx, 960, 560, key(lt, [[0, 1.08], [5, 1.0, E.io2]]));
    S.mountains(ctx, [[-100, 760, 700, 380], [500, 760, 600, 300], [1200, 760, 800, 420]], { fill: "rgba(210,190,150,0.9)" });
    S.ground(ctx, 760, { fill: "rgba(180,160,120,0.5)" });
    S.crowd(ctx, 80, 1500, 930, { n: 14, rows: 3, s: 0.55, dir: 1, costume: "peasant", hold: "torch", every: 2, pose: (i) => (i % 3 ? run(t * 2.4 + i) : "cheer"), t });
    for (let i = 0; i < 6; i++) WORLD.PROP.fire(ctx, 160 + i * 230, 700 - (i % 2) * 40, t + i, 0.35);
    S.fig(ctx, { x: lerp(1250, 1380, prog(lt, 0, 4)), y: GROUND, s: 1.7, dir: 1, pose: lt < 1.2 ? run(t * 2.4) : idle(P.point, t), hold: "sword", face: { mood: "determined" }, t, ...TL });
    ctx.restore();
    S.stamp(ctx, "1791", 300, 170, t, at("revolt") + 0.2);
  });

  // 3 — RULE: the whole island hatched, Toussaint with the constitution
  shot(at("rule"), at("trap"), (ctx, lt, t) => {
    S.paper(ctx);
    S.map(ctx, { x: 520, y: 120, s: 0.75, land: [ISLAND], regions: [{ poly: WEST }, { poly: ISLAND, k: prog(lt, 0.6, 1.6), col: "rgba(181,18,27,0.2)" }], labels: [["Hispaniola", 950, 760, 60, S.RED]] });
    S.fig(ctx, { x: 330, y: GROUND, s: 1.7, dir: 1, pose: idle(P.hipsHands, t), face: { mood: "smirk" }, t, ...TL });
    const k = E.back(prog(lt, 1.0, 1.5));
    if (k > 0) { ctx.save(); ctx.translate(560, 560); ctx.scale(k, k); ctx.rotate(-0.08); ctx.fillStyle = "#f6ecd6"; ctx.fillRect(-120, -160, 240, 320); S.line(ctx, [[-120, -160], [120, -160], [120, 160], [-120, 160], [-120, -160]], 3, S.INK, 4);
      ctx.font = "400 40px 'Lilita One'"; ctx.fillStyle = S.RED; ctx.textAlign = "center"; ctx.fillText("CONSTITUTION", 0, -100); ctx.font = "700 36px Caveat"; ctx.fillStyle = S.INK; ctx.fillText("1801", 0, -55);
      for (let i = 0; i < 6; i++) S.line(ctx, [[-90, -10 + i * 26], [90 - (i % 3) * 20, -10 + i * 26]], 2, "rgba(43,33,23,0.6)", i); ctx.textAlign = "left"; ctx.restore(); }
    S.stamp(ctx, "1801", 1640, 150, t, at("rule") + 0.4);
  });

  // 4 — TRAP: a handshake at a table… then soldiers close in
  shot(at("trap"), at("tree"), (ctx, lt, t) => {
    const closing = prog(lt, 1.6, 3.0, E.io2);
    S.paper(ctx, { c0: lerp(0, 1, closing) > 0.5 ? "#d4bf94" : "#e8d8b2" });
    ctx.save(); cam(ctx, 960, 600, key(lt, [[0, 1.0], [3.5, 1.2, E.io2]]));
    S.building(ctx, "house", 960, 760, 1.4);
    S.ground(ctx, 760);
    ctx.fillStyle = "#8a5a32"; ctx.fillRect(820, 820, 280, 20); S.line(ctx, [[820, 820], [1100, 820]], 3, S.INK, 2); S.line(ctx, [[840, 840], [840, 960]], 5, S.INK, 3); S.line(ctx, [[1080, 840], [1080, 960]], 5, S.INK, 4);
    S.fig(ctx, { x: 700, y: GROUND, s: 1.5, dir: 1, pose: lt < 1.6 ? tweak(P.point, { aF: 70 }) : P.scared, face: { mood: lt < 1.6 ? "neutral" : "surprised" }, t, ...TL });
    S.fig(ctx, { x: 1220, y: GROUND, s: 1.5, dir: -1, pose: lt < 1.6 ? tweak(P.point, { aF: 70 }) : P.hipsHands, face: { mood: lt < 1.6 ? "happy" : "smirk" }, t, ...FR });
    S.crowd(ctx, lerp(-500, 120, closing), lerp(-60, 520, closing), GROUND, { n: 5, rows: 1, s: 0.9, dir: 1, costume: "soldier", col: BLUE, hold: "spear", every: 1, pose: "stand", t });
    S.crowd(ctx, lerp(1980, 1420, closing), lerp(2400, 1840, closing), GROUND, { n: 5, rows: 1, s: 0.9, dir: -1, costume: "soldier", col: BLUE, hold: "spear", every: 1, pose: "stand", t });
    FX.icon(ctx, "!", 700, 520, t, at("trap") + 1.8, 1e9);
    ctx.restore();
    if (lt > 2.0) S.banner(ctx, "TRAP", W / 2, 170, 420, { rot: -0.04 });
  });

  // 5 — TREE: a ship at sea; the pen draws a tree that keeps its roots
  shot(at("tree"), at("end"), (ctx, lt, t) => {
    S.paper(ctx);
    S.sea(ctx, 720);
    S.ship(ctx, 560, 720, 0.9, { flag: "#ffffff" });
    S.fig(ctx, { x: 640, y: 680, s: 0.55, dir: -1, pose: P.relaxed, face: { mood: "sad" }, t, ...TL });
    S.tree(ctx, 1380, 700, 820, prog(lt, 0.4, 4.6, E.io2), { roots: true });
    if (lt > 3.0) { ctx.font = "700 54px Caveat"; ctx.fillStyle = S.RED; ctx.textAlign = "center"; ctx.fillText("the tree of liberty", 1380, 800); ctx.textAlign = "left"; }
  });

  // 6 — END: prison dark → dawn, the crowd with the blue-and-red flag; 1804
  shot(at("end"), DURATION, (ctx, lt, t) => {
    const dawn = prog(lt, 2.6, 4.2, E.io2);
    S.paper(ctx, { c0: dawn > 0.5 ? "#f6e3b8" : "#b9a37b", c1: dawn > 0.5 ? "#f0c98a" : "#9c8662" });
    if (dawn < 1) {    // the cell window
      ctx.save(); ctx.globalAlpha = 1 - dawn; ctx.fillStyle = "rgba(40,30,20,0.55)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e6d2a8"; ctx.fillRect(820, 260, 280, 220); for (let i = 1; i < 5; i++) S.line(ctx, [[820 + i * 56, 260], [820 + i * 56, 480]], 8, S.INK, i);
      S.stamp(ctx, "1803", 960, 640, t, at("end") + 0.4, { col: "#e6d2a8" }); ctx.restore();
    }
    if (dawn > 0) {
      ctx.save(); ctx.globalAlpha = dawn;
      ctx.fillStyle = "rgba(255,190,90,0.4)"; ctx.beginPath(); ctx.arc(960, 760, 260, Math.PI, 0); ctx.fill();
      S.mountains(ctx, [[-100, 760, 760, 360], [1240, 760, 820, 400]]);
      S.ground(ctx, 760);
      S.crowd(ctx, 120, 1800, 930, { n: 16, rows: 3, s: 0.55, dir: 1, costume: "peasant", pose: "cheer", t });
      ctx.save(); ctx.translate(960, 420); S.line(ctx, [[0, 0], [0, 420]], 8, S.INK, 2); ctx.fillStyle = "#1d3557"; ctx.fillRect(4, 0, 110, 150); ctx.fillStyle = S.RED; ctx.fillRect(114, 0, 110, 150); S.line(ctx, [[4, 0], [224, 0], [224, 150], [4, 150], [4, 0]], 3, S.INK, 6); ctx.restore();
      S.stamp(ctx, "HAITI · 1804", 960, 200, t, at("end") + 3.2, { size: 100 });
      ctx.restore();
    }
  });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 8);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    S.age(ctx, 0.45);
    subtitles(ctx, t, { accent: "#ffd27a" });
    FX.fade(ctx, 1 - prog(t, 0, 0.4) + prog(t, DURATION - 0.8, DURATION));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
