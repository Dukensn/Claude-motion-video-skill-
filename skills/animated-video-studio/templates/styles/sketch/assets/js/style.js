// style.js — HISTORY IN SKETCH: ink on parchment. Stick figures in period costume, hatched mountains and buildings,
// hand-drawn maps with campaign arrows, red banners, date stamps, "profile cards" with checkmarks (the humour).
// Built on the stickman engine (STICK poses, walk/run, WORLD.cam, GFX.arrow). Lines "boil" (re-jitter 8×/s) like pen on paper.
(function () {
  const { W, H, G, clamp, lerp, E, prog, mulberry, hash } = F;
  const TAU = Math.PI * 2;
  const INK = "#2b2117", RED = "#b5121b", PAPER0 = "#f3e6c8", PAPER1 = "#e2cfa3";
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rg = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const boil = () => Math.floor((G.t || 0) * 8);

  // ---------- pen
  // wobbly ink polyline (two passes, jitter changes 8×/s so the drawing feels alive)
  function line(ctx, pts, w = 4, col = INK, seed = 1, amp = 2.2) {
    const r = mulberry(seed * 131 + boil());
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => { const jx = (r() - 0.5) * amp, jy = (r() - 0.5) * amp; i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy); });
      ctx.lineWidth = w * (pass ? 0.5 : 1); ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    }
  }
  // parallel hatching inside a polygon (shading)
  function hatch(ctx, poly, o = {}) {
    const ang = o.angle ?? -0.8, gap = o.gap || 14, col = o.col || "rgba(43,33,23,0.55)";
    ctx.save(); ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]); const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    ctx.translate(cx, cy); ctx.rotate(ang); ctx.strokeStyle = col; ctx.lineWidth = o.w || 1.8;
    const r = mulberry(7 + boil());
    for (let x = -R; x < R; x += gap) { ctx.beginPath(); ctx.moveTo(x + (r() - 0.5) * 3, -R); ctx.lineTo(x + (r() - 0.5) * 3, R); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- paper
  function paper(ctx, o = {}) {
    ctx.fillStyle = lg(ctx, 0, 0, W, H, [[0, o.c0 || PAPER0], [1, o.c1 || PAPER1]]); ctx.fillRect(-W, -H, W * 3, H * 3);
    const r = mulberry(o.seed || 21);
    for (let i = 0; i < 180; i++) { ctx.fillStyle = `rgba(120,90,50,${0.03 + r() * 0.05})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, 10 + r() * 70, 0, TAU); ctx.fill(); }
  }
  function age(ctx, k = 0.45) {   // burnt-edge vignette (after the shot)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rg(ctx, W / 2, H / 2, Math.min(W, H) * 0.35, Math.max(W, H) * 0.72, [[0, "rgba(60,40,20,0)"], [1, `rgba(60,40,20,${k})`]]); ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // ---------- figures in costume
  // costume: roman (laurel or crested helmet + red cloak), general (bicorne + sash + epaulettes), soldier (shako-like cap),
  //          tricorn, pirate (bandana + tricorn), knight (helmet + tabard), pharaoh (nemes), samurai (kabuto), king (crown + robe),
  //          peasant (straw hat), scholar (cap + book), queen (crown + dress)
  // o: STICK.draw options + costume, col (accent: cloak/sash colour), s, dir, pose
  function fig(ctx, o) {
    const col = o.col || RED, s = o.s ?? 1, dir = o.dir ?? 1;
    const look = Object.assign({ color: col }, o.look || {});
    if (o.costume === "king" || o.costume === "roman") look.cape = true;
    if (o.costume === "queen") look.skirt = true;
    const k = STICK.draw(ctx, Object.assign({}, o, { ink: o.ink || INK, look }));
    const [hx, hy] = k.head, r = STICK.B.head * s;
    const sh = k.shoulder, hip = k.hip;
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
    const ink = (w) => { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.stroke(); };
    switch (o.costume) {
      case "general":
        line(ctx, [[sh[0] - dir * 12 * s, sh[1]], [hip[0] + dir * 10 * s, hip[1] - 8 * s]], 14 * s, col, 3, 1);
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sh[0] + sd * 15 * s, sh[1] + 2 * s, 14 * s, 6 * s, 0, 0, TAU); ctx.fillStyle = "#e9c46a"; ctx.fill(); ink(1.6 * s); }
        bicorne(ctx, hx, hy - r * 0.95, s * 0.95, o.hatCol || "#1d3557", dir); break;
      case "soldier": ctx.fillStyle = o.hatCol || "#1d3557"; ctx.fillRect(hx - r * 0.75, hy - r * 1.9, r * 1.5, r * 1.15); ctx.strokeStyle = INK; ctx.lineWidth = 2 * s; ctx.strokeRect(hx - r * 0.75, hy - r * 1.9, r * 1.5, r * 1.15);
        ctx.beginPath(); ctx.arc(hx, hy - r * 2.0, r * 0.18, 0, TAU); ctx.fillStyle = col; ctx.fill(); break;
      case "tricorn": case "pirate":
        ctx.beginPath(); ctx.moveTo(hx - r * 1.35, hy - r * 0.75); ctx.quadraticCurveTo(hx, hy - r * 2.2, hx + r * 1.35, hy - r * 0.75); ctx.quadraticCurveTo(hx, hy - r * 1.1, hx - r * 1.35, hy - r * 0.75); ctx.fillStyle = o.hatCol || "#2b2117"; ctx.fill(); ink(2 * s);
        if (o.costume === "pirate") { line(ctx, [[hx + dir * r * 0.05, hy - r * 0.45], [hx + dir * r * 0.75, hy - r * 0.05]], 2.5 * s, INK, 5, 0.5); ctx.beginPath(); ctx.ellipse(hx + dir * r * 0.42, hy - r * 0.1, r * 0.2, r * 0.16, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); } break;
      case "roman":
        if (o.helmet) { ctx.beginPath(); ctx.arc(hx, hy - r * 0.2, r * 1.06, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#b8a77a"; ctx.fill(); ink(2 * s);
          ctx.beginPath(); ctx.ellipse(hx, hy - r * 1.35, r * 0.95, r * 0.32, 0, Math.PI, 0); ctx.fillStyle = col; ctx.fill(); ink(1.6 * s); }
        else for (let i = 0; i < 7; i++) { const a = Math.PI * (1.0 + i / 6); ctx.beginPath(); ctx.ellipse(hx + Math.cos(a) * r * 1.0, hy + Math.sin(a) * r * 1.0, r * 0.26, r * 0.12, a + 1.2, 0, TAU); ctx.fillStyle = "#c9a227"; ctx.fill(); }
        break;
      case "knight": ctx.beginPath(); ctx.arc(hx, hy - r * 0.05, r * 1.12, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.fillStyle = "#9aa3ad"; ctx.fill(); ink(2 * s);
        ctx.fillStyle = INK; ctx.fillRect(hx - r * 0.7, hy - r * 0.15, r * 1.4, r * 0.14);
        line(ctx, [[sh[0], sh[1] + 6 * s], [hip[0], hip[1]]], 26 * s, col, 9, 0.8); break;
      case "pharaoh": ctx.beginPath(); ctx.moveTo(hx - r * 1.1, hy + r * 1.1); ctx.lineTo(hx - r * 1.05, hy - r * 0.6); ctx.quadraticCurveTo(hx, hy - r * 1.5, hx + r * 1.05, hy - r * 0.6); ctx.lineTo(hx + r * 1.1, hy + r * 1.1); ctx.lineTo(hx + r * 0.75, hy + r * 0.2); ctx.lineTo(hx - r * 0.75, hy + r * 0.2); ctx.closePath();
        ctx.fillStyle = "#e9c46a"; ctx.fill(); ink(2 * s); for (let i = -2; i <= 2; i++) line(ctx, [[hx - r * 1.0, hy - r * 0.3 + i * r * 0.25], [hx - r * 0.8, hy - r * 0.3 + i * r * 0.25]], 3 * s, "#1d3557", i, 0.5); break;
      case "samurai": ctx.beginPath(); ctx.arc(hx, hy - r * 0.1, r * 1.1, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#3a2a24"; ctx.fill(); ink(2 * s);
        ctx.beginPath(); ctx.moveTo(hx - r * 0.7, hy - r * 1.0); ctx.lineTo(hx - r * 1.1, hy - r * 1.9); ctx.moveTo(hx + r * 0.7, hy - r * 1.0); ctx.lineTo(hx + r * 1.1, hy - r * 1.9); ctx.lineWidth = 5 * s; ctx.strokeStyle = "#c9a227"; ctx.stroke(); break;
      case "king": case "queen": ctx.beginPath(); ctx.moveTo(hx - r * 0.75, hy - r * 0.75); ctx.lineTo(hx - r * 0.8, hy - r * 1.5); ctx.lineTo(hx - r * 0.35, hy - r * 1.1); ctx.lineTo(hx, hy - r * 1.6); ctx.lineTo(hx + r * 0.35, hy - r * 1.1); ctx.lineTo(hx + r * 0.8, hy - r * 1.5); ctx.lineTo(hx + r * 0.75, hy - r * 0.75); ctx.closePath(); ctx.fillStyle = "#c9a227"; ctx.fill(); ink(2 * s); break;
      case "peasant": ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.75, r * 1.6, r * 0.32, 0, 0, TAU); ctx.fillStyle = "#d9b45a"; ctx.fill(); ink(1.6 * s);
        ctx.beginPath(); ctx.ellipse(hx, hy - r * 1.0, r * 0.7, r * 0.45, 0, Math.PI, 0); ctx.fill(); ink(1.6 * s); break;
      case "scholar": ctx.fillStyle = INK; ctx.fillRect(hx - r * 0.9, hy - r * 1.35, r * 1.8, r * 0.35); ctx.fillRect(hx - r * 0.5, hy - r * 1.7, r, r * 0.4); break;
    }
    ctx.restore();
    return k;
  }
  function bicorne(ctx, x, y, s, col = "#1d3557", dir = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-62, 8); ctx.quadraticCurveTo(0, -52, 62, 8); ctx.quadraticCurveTo(0, -6, -62, 8); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(dir * 12, -18, 8, 0, TAU); ctx.fillStyle = RED; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // rows of small figures (armies, crowds): n per row, rows deep; costume + pose for all
  function crowd(ctx, x0, x1, y, o = {}) {
    const rows = o.rows || 2, n = o.n || 12, s = o.s || 0.45;
    for (let rI = rows - 1; rI >= 0; rI--) for (let i = 0; i < n; i++) {
      const sx = lerp(x0, x1, (i + (rI % 2) * 0.5) / n), sy = y - rI * 40 * s / 0.45, seed = i * 7 + rI;
      const pose = typeof o.pose === "function" ? o.pose(i, rI) : o.pose || (i % 4 ? "stand" : "cheer");
      fig(ctx, { x: sx, y: sy, s: s * (1 - rI * 0.08), dir: o.dir ?? -1, costume: o.costume, col: o.col, pose, hold: o.hold && (i % (o.every || 3) === 0) ? o.hold : null, face: { mood: o.mood || (seed % 3 ? "determined" : "angry") }, t: o.t, seed });
    }
  }

  // ---------- scenery
  function mountains(ctx, list, o = {}) {   // list: [[x, baseY, w, h]]
    for (const [x0, y0, w, h] of list) {
      const poly = [[x0, y0], [x0 + w * 0.5, y0 - h], [x0 + w, y0]];
      ctx.fillStyle = o.fill || "rgba(243,230,200,0.9)"; ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.fill();
      hatch(ctx, [[x0 + w * 0.5, y0 - h], [x0 + w, y0], [x0 + w * 0.62, y0]], { gap: 12 });
      line(ctx, poly, 4, INK, x0);
    }
  }
  function ground(ctx, y, o = {}) { ctx.fillStyle = o.fill || "rgba(226,207,163,0.6)"; ctx.fillRect(-W, y, W * 3, H); line(ctx, [[-50, y], [W * 0.3, y - 6], [W * 0.7, y + 4], [W + 50, y]], 4, INK, 99); }
  // buildings: temple (columns), fort (walls + towers), house, palace (dome)
  function building(ctx, kind, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const box = (pts) => { ctx.fillStyle = "rgba(243,230,200,0.95)"; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); line(ctx, [...pts, pts[0]], 4, INK, pts.length * 3); };
    if (kind === "temple") { box([[-220, 0], [220, 0], [220, -30], [-220, -30]]); for (let i = 0; i < 6; i++) box([[-190 + i * 72, -30], [-160 + i * 72, -30], [-160 + i * 72, -260], [-190 + i * 72, -260]]); box([[-240, -260], [240, -260], [0, -360]]); }
    else if (kind === "fort") { box([[-260, 0], [260, 0], [260, -200], [-260, -200]]); for (const tx of [-260, 260]) box([[tx - 60, 0], [tx + 60, 0], [tx + 60, -300], [tx - 60, -300]]);
      for (let i = -5; i <= 5; i++) box([[i * 40 - 14, -200], [i * 40 + 14, -200], [i * 40 + 14, -230], [i * 40 - 14, -230]]); hatch(ctx, [[-60, 0], [60, 0], [60, -120], [-60, -120]], { gap: 10, angle: 0.8 }); }
    else if (kind === "palace") { box([[-260, 0], [260, 0], [260, -220], [-260, -220]]); ctx.fillStyle = "rgba(243,230,200,0.95)"; ctx.beginPath(); ctx.arc(0, -220, 140, Math.PI, 0); ctx.fill(); line(ctx, Array.from({ length: 13 }, (_, i) => [Math.cos(Math.PI + i * Math.PI / 12) * 140, -220 + Math.sin(Math.PI + i * Math.PI / 12) * 140]), 4, INK, 4);
      for (let i = -3; i <= 3; i++) box([[i * 70 - 18, 0], [i * 70 + 18, 0], [i * 70 + 18, -120], [i * 70 - 18, -120]]); }
    else { box([[-120, 0], [120, 0], [120, -150], [-120, -150]]); box([[-150, -150], [150, -150], [0, -260]]); box([[-30, 0], [30, 0], [30, -90], [-30, -90]]); }
    ctx.restore();
  }
  function ship(ctx, x, y, s = 1, o = {}) {
    ctx.save(); ctx.translate(x, y + Math.sin((G.t || 0) * 1.6) * 6); ctx.rotate(Math.sin((G.t || 0) * 1.2) * 0.02); ctx.scale(s, s);
    const hull = [[-260, -40], [260, -40], [200, 50], [-210, 50]]; ctx.fillStyle = "#8a5a32"; ctx.beginPath(); hull.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); line(ctx, [...hull, hull[0]], 4, INK, 3);
    hatch(ctx, hull, { gap: 9, angle: 0 });
    for (const [mx, h] of [[-90, 330], [90, 380]]) { line(ctx, [[mx, -40], [mx, -40 - h]], 6, INK, mx); const sail = [[mx - 100, -40 - h + 30], [mx + 100, -40 - h + 30], [mx + 110, -100], [mx - 110, -100]];
      ctx.fillStyle = "#f6ecd6"; ctx.beginPath(); sail.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); line(ctx, [...sail, sail[0]], 3, INK, mx + 1); }
    if (o.flag) { ctx.fillStyle = o.flag; ctx.fillRect(90, -440, 60, 36); }
    ctx.restore();
  }
  function sea(ctx, y) { ctx.fillStyle = "rgba(120,150,170,0.35)"; ctx.fillRect(-W, y, W * 3, H); for (let i = 0; i < 8; i++) line(ctx, Array.from({ length: 30 }, (_, j) => [j * 70 - 40, y + 30 + i * 50 + Math.sin(j * 0.9 + i + (G.t || 0) * 2) * 8]), 2.2, "rgba(43,33,23,0.6)", i + 50); }

  // ---------- maps
  // land: polygon points (your coastline), fill: paper; regions: [{poly, col, k (0..1 hatch fill)}]; labels: [[text, x, y, size]]
  // routes: [{pts, k (0..1 drawn), col}] dashed campaign arrows
  function map(ctx, o) {
    const { x = 0, y = 0, s = 1 } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.sea !== false) { ctx.fillStyle = "rgba(120,150,170,0.25)"; ctx.fillRect(-W, -H, W * 3, H * 3); }
    for (const land of o.land || []) { ctx.fillStyle = PAPER0; ctx.beginPath(); land.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); line(ctx, [...land, land[0]], 4, INK, land.length); }
    for (const rgn of o.regions || []) { if ((rgn.k ?? 1) <= 0) continue; ctx.save(); ctx.globalAlpha = rgn.k ?? 1; ctx.fillStyle = rgn.col || "rgba(181,18,27,0.35)"; ctx.beginPath(); rgn.poly.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fill(); hatch(ctx, rgn.poly, { col: rgn.hatch || "rgba(181,18,27,0.6)", gap: 11 }); ctx.restore(); }
    for (const rt of o.routes || []) { const k = rt.k ?? 1; if (k <= 0) continue; ctx.save(); ctx.setLineDash([18, 12]); const n = Math.max(2, Math.round(rt.pts.length * k)); const pts = rt.pts.slice(0, n);
      ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.lineWidth = 7; ctx.strokeStyle = rt.col || RED; ctx.stroke(); ctx.setLineDash([]);
      const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2]; const a = Math.atan2(ay - by, ax - bx); ctx.beginPath(); ctx.moveTo(ax + Math.cos(a) * 18, ay + Math.sin(a) * 18); ctx.lineTo(ax + Math.cos(a + 2.4) * 22, ay + Math.sin(a + 2.4) * 22); ctx.lineTo(ax + Math.cos(a - 2.4) * 22, ay + Math.sin(a - 2.4) * 22); ctx.closePath(); ctx.fillStyle = rt.col || RED; ctx.fill(); ctx.restore(); }
    for (const [text, lx, ly, size = 46, col = INK] of o.labels || []) { ctx.font = `700 ${size}px Caveat`; ctx.fillStyle = col; ctx.textAlign = "center"; ctx.fillText(text, lx, ly); ctx.textAlign = "left"; }
    ctx.restore();
  }

  // ---------- titles and the humour
  // red cloth banner with a word on it
  function banner(ctx, text, x, y, w = 520, o = {}) {
    const h = o.h || 110; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = o.col || RED; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2 - 30, 0); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2 + 30, 0); ctx.closePath(); ctx.fill();
    line(ctx, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - 30, 0], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2 + 30, 0], [-w / 2, -h / 2]], 3, INK, 8);
    ctx.font = `400 ${o.size || 70}px "Lilita One"`; ctx.fillStyle = "#f6ecd6"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 4); ctx.restore();
  }
  // big name + checklist that ticks in one by one from time a (the "profile card")
  function card(ctx, name, traits, x, y, t, a, o = {}) {
    const k = E.back(prog(t, a, a + 0.4)); if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.font = `400 ${o.size || 120}px "Lilita One"`; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round"; ctx.lineWidth = (o.size || 120) * 0.09; ctx.strokeStyle = INK;
    name.split("\n").forEach((ln, i) => { ctx.strokeText(ln, 0, i * (o.size || 120) * 0.95); ctx.fillStyle = RED; ctx.fillText(ln, 0, i * (o.size || 120) * 0.95); });
    ctx.restore();
    traits.forEach((tr, i) => {
      const ta = a + 0.5 + i * (o.step || 0.55); if (t < ta) return; const kk = E.out3(prog(t, ta, ta + 0.25));
      ctx.save(); ctx.globalAlpha = kk; ctx.font = `700 ${o.tsize || 62}px Caveat`; ctx.fillStyle = INK; ctx.fillText("✓ " + tr, (o.tx ?? x) + (1 - kk) * 30, (o.ty ?? y + 200) + i * (o.tsize || 62) * 1.1); ctx.restore();
    });
  }
  // a date in a stamped box ("1791")
  function stamp(ctx, text, x, y, t, a, o = {}) {
    const k = prog(t, a, a + 0.25); if (k <= 0) return; const sc = lerp(1.8, 1, E.out3(k));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.08); ctx.scale(sc, sc); ctx.globalAlpha = k;
    ctx.font = `400 ${o.size || 90}px "Lilita One"`; const w = ctx.measureText(text).width + 50, h = (o.size || 90) * 1.15;
    ctx.strokeStyle = o.col || RED; ctx.lineWidth = 7; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.fillStyle = o.col || RED; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 4);
    ctx.restore();
  }
  // a tree drawn by the pen (k 0..1), for metaphors (roots, family trees, "the tree of liberty")
  function tree(ctx, x, y, h, k, o = {}) {
    const r = mulberry(o.seed || 5);
    const branch = (x0, y0, a, len, depth, kk) => {
      if (depth === 0 || kk <= 0) return; const l = len * Math.min(1, kk * 1.5);
      const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; line(ctx, [[x0, y0], [x1, y1]], depth * 3.2, INK, depth * 11 + Math.round(x0));
      const sub = (kk - 0.15) / 0.85;
      if (sub > 0) for (const d of [-0.45, 0.4]) branch(x1, y1, a + d + (r() - 0.5) * 0.3, len * 0.72, depth - 1, sub);
      if (depth <= 2 && kk > 0.7) { ctx.fillStyle = o.leaf || "rgba(80,120,60,0.55)"; ctx.beginPath(); ctx.arc(x1, y1, 22 * Math.min(1, (kk - 0.7) / 0.3), 0, TAU); ctx.fill(); }
    };
    branch(x, y, -Math.PI / 2, h * 0.35, 6, k);
    if (o.roots) for (const a of [0.5, 1.2, 1.9, 2.6]) line(ctx, [[x, y], [x + Math.cos(a) * h * 0.25 * k, y + Math.sin(a) * h * 0.12 * k]], 6, INK, a * 10);
  }

  window.SKETCH = { INK, RED, line, hatch, paper, age, fig, bicorne, crowd, mountains, ground, building, ship, sea, map, banner, card, stamp, tree };
})();
