// style.js — CINEMATIC stick figures: black heads, coloured clothes, rim light, dusk palettes, depth of field.
// Built on the stickman engine (same poses: STICK.P, walk, run, posesAt…; same WORLD.cam, TXT subtitles).
// Everything is a pure function of its arguments.
(function () {
  const { W, H, clamp, lerp, mulberry, noise1 } = F;
  const { B, STAND, P, skeleton } = STICK;
  const TAU = Math.PI * 2;
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rg = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const HEAD = "#0c0b10";

  function seg(ctx, pts, w, col) {
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  }
  // a limb with a rim of light on the lit side: the rim line first, nudged toward the light, then the limb
  function lit(ctx, pts, w, col, rim, side) {
    if (rim) seg(ctx, pts.map(([x, y]) => [x + side * w * 0.22, y - w * 0.12]), w, rim);
    seg(ctx, pts.map(([x, y]) => [x - side * w * 0.06, y]), w * 0.92, col);
  }
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(clamp(v * k, 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  // ---------- the figure
  // o: {x, y (ground), s, dir, pose (name or object), look:{top, pants, hat:'cap'|'beanie'|null, hatCol, hair:'bun'|'curly'|'spike'|null,
  //     glasses, coat (long), skin?}, face:{mood, look:[x,y], glow}, rim:{col, side (-1 light from left, 1 from right)}, alpha, t}
  // returns the skeleton (k.head, k.AF.hand…) so props can be attached.
  function fig(ctx, o) {
    const L = o.look || {}; const s = o.s ?? 1, dir = o.dir ?? 1;
    const pose = Object.assign({}, STAND, typeof o.pose === "string" ? P[o.pose] : o.pose || {});
    const k = skeleton(o.x, o.y, s, pose, dir);
    const top = L.top || "#e4572e", pants = L.pants || "#23232e", rim = o.rim ? o.rim.col : null, side = o.rim ? o.rim.side : -1;
    const lwArm = 15 * s, lwLeg = 18 * s, lwBody = 40 * s, r = B.head * s * 1.25;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    // back limbs, darker
    lit(ctx, [k.hip, k.LB.knee, k.LB.ankle], lwLeg, shade(pants, 0.7), null, side);
    seg(ctx, [k.LB.ankle, [k.LB.ankle[0] + dir * 16 * s, k.LB.ankle[1]]], 12 * s, HEAD);
    lit(ctx, [k.shoulder, k.AB.elbow, k.AB.hand], lwArm, shade(top, 0.62), null, side);
    ctx.beginPath(); ctx.arc(k.AB.hand[0], k.AB.hand[1], 8 * s, 0, TAU); ctx.fillStyle = HEAD; ctx.fill();
    // body: one thick stroke from shoulders to hips (+ long coat)
    const sh = [lerp(k.neck[0], k.hip[0], 0.12), lerp(k.neck[1], k.hip[1], 0.12)];
    if (L.coat) lit(ctx, [sh, [k.hip[0], k.hip[1] + 40 * s]], lwBody * 1.15, top, rim, side);
    lit(ctx, [sh, k.hip], lwBody, top, rim, side);
    if (L.hood !== false) { ctx.beginPath(); ctx.arc(k.neck[0], k.neck[1] + 6 * s, 16 * s, 0, Math.PI); ctx.fillStyle = shade(top, 0.75); ctx.fill(); }
    // front leg
    lit(ctx, [k.hip, k.LF.knee, k.LF.ankle], lwLeg, pants, rim, side);
    seg(ctx, [k.LF.ankle, [k.LF.ankle[0] + dir * 16 * s, k.LF.ankle[1]]], 12 * s, HEAD);
    // head
    const [hx, hy] = k.head;
    if (L.hair === "bun") { ctx.beginPath(); ctx.arc(hx - dir * r * 0.55, hy - r * 0.75, r * 0.45, 0, TAU); ctx.fillStyle = HEAD; ctx.fill(); }
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fillStyle = HEAD; ctx.fill();
    if (rim) { ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.clip(); ctx.shadowColor = rim; ctx.shadowBlur = r * 0.5;
      ctx.beginPath(); const a0 = side < 0 ? Math.PI * 0.55 : -Math.PI * 0.45; ctx.arc(hx, hy, r, a0, a0 + Math.PI * 0.95); ctx.lineWidth = r * 0.16; ctx.strokeStyle = rim; ctx.stroke(); ctx.restore(); }
    if (L.hair === "curly") for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); ctx.beginPath(); ctx.arc(hx + Math.cos(a) * r, hy + Math.sin(a) * r, r * 0.3, 0, TAU); ctx.fillStyle = HEAD; ctx.fill(); }
    if (L.hair === "spike") for (let i = -2; i <= 2; i++) seg(ctx, [[hx + i * r * 0.28, hy - r * 0.9], [hx + i * r * 0.4, hy - r * 1.35]], r * 0.16, HEAD);
    face(ctx, hx, hy, r, o.face || {}, dir, o.t);
    if (L.glasses) { ctx.lineWidth = r * 0.07; ctx.strokeStyle = L.glassesCol || "#9fe7a8"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + dir * r * 0.18 + sd * r * 0.33, hy - r * 0.08, r * 0.27, 0, TAU); ctx.stroke(); } }
    if (L.hat === "cap") { const c = L.hatCol || "#f4c430"; ctx.beginPath(); ctx.arc(hx, hy - r * 0.12, r * 1.03, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      seg(ctx, [[hx + dir * r * 0.5, hy - r * 0.42], [hx + dir * r * 1.55, hy - r * 0.3]], r * 0.22, c); }
    if (L.hat === "beanie") { ctx.beginPath(); ctx.arc(hx, hy - r * 0.08, r * 1.05, Math.PI, 0); ctx.closePath(); ctx.fillStyle = L.hatCol || "#6c5ce7"; ctx.fill(); }
    // front arm last
    lit(ctx, [k.shoulder, k.AF.elbow, k.AF.hand], lwArm, top, rim, side);
    ctx.beginPath(); ctx.arc(k.AF.hand[0], k.AF.hand[1], 8 * s, 0, TAU); ctx.fillStyle = HEAD; ctx.fill();
    ctx.restore();
    return k;
  }

  // white cartoon eyes on a black head. mood: neutral happy sad angry scared surprised tired smug determined
  function face(ctx, x, y, r, e, dir, t) {
    const mood = e.mood || "neutral", look = e.look || [0.3 * dir, 0];
    const blink = t != null && ((t * 0.31 + (e.seed || 0)) % 3.7) < 0.12 && !e.glow;
    const ex = x + dir * r * 0.2 + look[0] * r * 0.12, ey = y - r * 0.1 + look[1] * r * 0.1, sep = r * 0.33;
    const big = mood === "scared" || mood === "surprised";
    const er = r * (big ? 0.24 : 0.2);
    for (const sd of [-1, 1]) {
      const cx = ex + sd * sep;
      if (e.glow) { ctx.fillStyle = rg(ctx, cx, ey, 0, er * 3.4, [[0, "rgba(255,230,90,0.6)"], [1, "rgba(255,230,90,0)"]]); ctx.fillRect(cx - er * 4, ey - er * 4, er * 8, er * 8); }
      if (blink || mood === "tired") { seg(ctx, [[cx - er, ey], [cx + er, ey]], r * 0.07, "#fff"); continue; }
      if (mood === "happy") { ctx.beginPath(); ctx.arc(cx, ey + er * 0.4, er, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = r * 0.08; ctx.strokeStyle = "#fff"; ctx.stroke(); continue; }
      ctx.beginPath(); ctx.ellipse(cx, ey, er, er * 1.18, 0, 0, TAU); ctx.fillStyle = e.glow ? "#ffe35a" : "#fff"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + look[0] * er * 0.45, ey + look[1] * er * 0.35, er * (e.glow ? 0.22 : 0.45), er * 0.62, 0, 0, TAU); ctx.fillStyle = HEAD; ctx.fill();
      if (mood === "sad" || mood === "angry" || mood === "determined" || mood === "smug") {
        const tilt = (mood === "sad" ? -1 : 1) * sd * 0.35;
        ctx.save(); ctx.translate(cx, ey - er * 1.25); ctx.rotate(tilt); ctx.fillStyle = HEAD; ctx.fillRect(-er * 1.3, -er * 0.9, er * 2.6, er * 0.9);
        seg(ctx, [[-er * 1.05, er * 0.05], [er * 1.05, er * 0.05]], r * 0.07, "#fff"); ctx.restore();
      }
    }
    // mouth: small white shapes
    const mx = ex, my = y + r * 0.42;
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff"; ctx.lineWidth = r * 0.07; ctx.lineCap = "round";
    if (mood === "happy" || mood === "smug") { ctx.beginPath(); ctx.arc(mx, my - r * 0.1, r * 0.2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    else if (big) { ctx.beginPath(); ctx.ellipse(mx, my, r * 0.11, r * 0.14, 0, 0, TAU); ctx.fill(); }
    else if (mood === "sad" || mood === "angry") { ctx.beginPath(); ctx.arc(mx, my + r * 0.12, r * 0.16, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(mx, my, r * 0.1, r * 0.06, 0, 0, TAU); ctx.fill(); }
  }

  // close-up bust (thumbnails, reaction shots): head radius R at (x, y)
  function bust(ctx, x, y, R, o = {}) {
    const L = o.look || {}, top = L.top || "#e4572e", rim = o.rim ? o.rim.col : "#ffb35c", side = o.rim ? o.rim.side : -1, dir = o.dir ?? 1;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - R * 1.7, y + R * 3.4); ctx.quadraticCurveTo(x - R * 1.6, y + R * 1.2, x - R * 0.5, y + R * 0.95);
    ctx.lineTo(x + R * 0.5, y + R * 0.95); ctx.quadraticCurveTo(x + R * 1.6, y + R * 1.2, x + R * 1.7, y + R * 3.4); ctx.closePath();
    ctx.fillStyle = lg(ctx, x - R * 2 * side, 0, x + R * 2 * side, 0, [[0, top], [1, shade(top, 0.45)]]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.shadowColor = rim; ctx.shadowBlur = R * 0.3; ctx.lineWidth = R * 0.08; ctx.strokeStyle = rim;
    ctx.beginPath(); ctx.moveTo(x + side * R * 1.66, y + R * 3.4); ctx.quadraticCurveTo(x + side * R * 1.56, y + R * 1.25, x + side * R * 0.5, y + R * 1.0); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = HEAD; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip(); ctx.shadowColor = rim; ctx.shadowBlur = R * 0.35;
    const a0 = side < 0 ? Math.PI * 0.62 : -Math.PI * 0.45; ctx.beginPath(); ctx.arc(x, y, R, a0, a0 + Math.PI * 0.85); ctx.lineWidth = R * 0.09; ctx.strokeStyle = rim; ctx.stroke(); ctx.restore();
    if (L.hat === "cap") { const c = L.hatCol || "#f4c430"; ctx.beginPath(); ctx.arc(x, y - R * 0.12, R * 1.03, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); seg(ctx, [[x + dir * R * 0.5, y - R * 0.42], [x + dir * R * 1.55, y - R * 0.3]], R * 0.22, c); }
    face(ctx, x, y, R, Object.assign({ look: [0.2 * dir, 0] }, o.face || {}), dir, o.t);
    ctx.restore();
  }

  // ---------- light, sets and film look
  // dusk sky: top → mid → horizon, a sun with glow and soft rays
  function sky(ctx, o = {}) {
    ctx.fillStyle = lg(ctx, 0, 0, 0, o.horizon ?? H * 0.7, [[0, o.top || "#1d1640"], [0.55, o.mid || "#5a3d7a"], [1, o.bottom || "#f2a65a"]]);
    ctx.fillRect(-W, -H, W * 3, H * 3);
    if (o.sun) {
      const { x, y, r = 70 } = o.sun;
      ctx.fillStyle = rg(ctx, x, y, 0, r * 9, [[0, "rgba(255,225,170,0.55)"], [1, "rgba(255,200,140,0)"]]); ctx.fillRect(x - r * 9, y - r * 9, r * 18, r * 18);
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#ffe9c2";
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + (o.t || 0) * 0.02; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r * 14, a, a + 0.07); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = "#fff4dc"; ctx.fill();
    }
    if (o.clouds) for (let i = 0; i < o.clouds; i++) { const r = mulberry(i + 9); const cx = r() * W, cy = H * (0.15 + r() * 0.35), w = 200 + r() * 300;
      ctx.fillStyle = lg(ctx, 0, cy - 14, 0, cy + 14, [[0, "rgba(255,210,170,0.55)"], [1, "rgba(120,80,140,0.3)"]]); ctx.beginPath(); ctx.ellipse(cx, cy, w, 14, 0, 0, TAU); ctx.fill(); }
  }
  // skyline silhouette with lit windows; blur > 0 pushes it out of focus
  function city(ctx, y, o = {}) {
    if (o.blur) return dof(ctx, o.blur, (c) => city(c, y, Object.assign({}, o, { blur: 0 })));
    ctx.save();
    const r = mulberry(o.seed || 7); let x = -60;
    while (x < W + 60) {
      const w = 70 + r() * 140, h = (o.h || 260) * (0.5 + r());
      ctx.fillStyle = o.col || "#2a2140"; ctx.fillRect(x, y - h, w, h + H);
      if (o.lights !== false) for (let i = 0; i < 12; i++) if (r() > 0.55) { ctx.fillStyle = `rgba(255,${180 + r() * 50 | 0},110,${0.5 + r() * 0.4})`; ctx.fillRect(x + 8 + r() * (w - 24), y - h + 14 + r() * (h - 30), 10, 13); }
      x += w + 6 + r() * 20;
    }
    ctx.restore();
  }
  // a street front: pavement, railing, a tree and lamp posts (silhouettes catch the sky colour)
  function street(ctx, y, o = {}) {
    ctx.fillStyle = o.ground || "#2b2233"; ctx.fillRect(-W, y, W * 3, H * 2);
    ctx.fillStyle = "rgba(255,190,140,0.18)"; ctx.fillRect(-W, y, W * 3, 6);
    ctx.strokeStyle = o.rail || "#1a1424"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-W, y - 70); ctx.lineTo(W * 2, y - 70); ctx.stroke();
    for (let x = -40; x < W + 40; x += 34) { ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x, y); ctx.stroke(); }
    for (const lx of o.lamps || []) lamp(ctx, lx, y, o.lampOn ?? 1);
    if (o.tree != null) { ctx.fillStyle = "#1a1424"; ctx.fillRect(o.tree - 10, y - 330, 20, 330); for (const [dx, dy, rr] of [[0, -360, 120], [-90, -300, 90], [90, -300, 95]]) { ctx.beginPath(); ctx.arc(o.tree + dx, y + dy, rr, 0, TAU); ctx.fill(); } }
  }
  function lamp(ctx, x, y, on = 1) {
    ctx.fillStyle = "#151020"; ctx.fillRect(x - 6, y - 420, 12, 420); ctx.fillRect(x - 6, y - 420, 60, 10);
    if (on > 0) {
      ctx.fillStyle = rg(ctx, x + 50, y - 400, 0, 160, [[0, `rgba(255,220,150,${0.7 * on})`], [1, "rgba(255,220,150,0)"]]); ctx.fillRect(x - 120, y - 560, 340, 320);
      ctx.save(); ctx.globalAlpha = 0.16 * on; ctx.fillStyle = "#ffe2a8"; ctx.beginPath(); ctx.moveTo(x + 40, y - 400); ctx.lineTo(x - 90, y); ctx.lineTo(x + 190, y); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  // dark interior with a big window onto the dusk, optional desk + monitor glow
  function room(ctx, o = {}) {
    ctx.fillStyle = lg(ctx, 0, 0, 0, H, [[0, o.wall || "#2a2236"], [1, "#16121e"]]); ctx.fillRect(-W, -H, W * 3, H * 3);
    const [wx, wy, ww, wh] = o.window || [W * 0.55, H * 0.12, W * 0.38, H * 0.5];
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    sky(ctx, { top: "#3a2a66", mid: "#9a5a8a", bottom: "#ffb36b", horizon: wy + wh, sun: { x: wx + ww * 0.6, y: wy + wh * 0.8, r: 40 } });
    ctx.restore();
    ctx.strokeStyle = "#120e18"; ctx.lineWidth = 16; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    ctx.fillStyle = rg(ctx, wx + ww / 2, wy + wh, 0, ww, [[0, "rgba(255,170,110,0.25)"], [1, "rgba(255,170,110,0)"]]); ctx.fillRect(wx - ww, wy, ww * 3, H);
    ctx.fillStyle = o.floor || "#1e1828"; ctx.fillRect(-W, o.floorY ?? H * 0.8, W * 3, H);
    if (o.desk) { const [dx, dy] = o.desk; ctx.fillStyle = "#120e18"; ctx.fillRect(dx - 200, dy, 400, 18); ctx.fillRect(dx - 190, dy, 14, 160); ctx.fillRect(dx + 176, dy, 14, 160);
      ctx.fillStyle = "#0a0a10"; ctx.fillRect(dx - 70, dy - 120, 160, 100); ctx.fillStyle = "#6fb6ff"; ctx.fillRect(dx - 62, dy - 112, 144, 84);
      ctx.fillStyle = rg(ctx, dx + 10, dy - 70, 0, 260, [[0, "rgba(110,180,255,0.35)"], [1, "rgba(110,180,255,0)"]]); ctx.fillRect(dx - 260, dy - 330, 520, 520); }
  }
  // sports pitch at dusk with floodlights; goal at gx
  function pitch(ctx, y, o = {}) {
    ctx.fillStyle = lg(ctx, 0, y, 0, H, [[0, "#2f6b3e"], [1, "#163a22"]]); ctx.fillRect(-W, y, W * 3, H * 2);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"; ctx.fillRect(i * W / 8, y, W / 8, H); }
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-W, y + 60); ctx.lineTo(W * 2, y + 60); ctx.stroke();
    for (const fx of o.lights || [W * 0.12, W * 0.88]) { ctx.fillStyle = "#1a1424"; ctx.fillRect(fx - 5, y - 520, 10, 520); ctx.fillRect(fx - 60, y - 560, 120, 50);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = "#fff6d8"; ctx.fillRect(fx - 52 + i * 18, y - 552, 12, 34); }
      ctx.fillStyle = rg(ctx, fx, y - 535, 0, 300, [[0, "rgba(255,245,210,0.45)"], [1, "rgba(255,245,210,0)"]]); ctx.fillRect(fx - 300, y - 835, 600, 600); }
    if (o.goal != null) { const gx = o.goal; ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 9; ctx.strokeRect(gx - 180, y - 190, 360, 250);
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2; for (let i = 1; i < 12; i++) { ctx.beginPath(); ctx.moveTo(gx - 180 + i * 30, y - 190); ctx.lineTo(gx - 180 + i * 30, y + 60); ctx.stroke(); } }
  }
  // out-of-focus light orbs
  function bokeh(ctx, n = 20, seed = 3, o = {}) {
    const r = mulberry(seed);
    for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * (o.top ?? 0.75), rr = 20 + r() * 60;
      ctx.fillStyle = rg(ctx, x, y, 0, rr, [[0, `rgba(255,${150 + r() * 90 | 0},${90 + r() * 80 | 0},${0.25 + r() * 0.2})`], [1, "rgba(255,170,90,0)"]]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  }
  // draw fn() blurred (depth of field)
  // Blur is expensive at full size: draw the layer at 1/4 resolution, blur it there (px/4), scale it back up.
  let LOW = null;
  function dof(ctx, px, fn) {
    if (!LOW) LOW = document.createElement("canvas");
    const q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q);
    if (LOW.width !== w || LOW.height !== h) { LOW.width = w; LOW.height = h; }
    const lo = LOW.getContext("2d"), m = ctx.getTransform();
    lo.setTransform(1, 0, 0, 1, 0, 0); lo.clearRect(0, 0, w, h);
    lo.setTransform(m.a / q, m.b / q, m.c / q, m.d / q, m.e / q, m.f / q);
    const real = ctx; fn(lo);
    real.save(); real.setTransform(1, 0, 0, 1, 0, 0); real.imageSmoothingEnabled = true; real.filter = `blur(${Math.max(0.5, px / q)}px)`;
    real.drawImage(LOW, 0, 0, w, h, 0, 0, W, H); real.restore();
  }
  // final film look: tint, vignette, grain (call after the shot, before subtitles)
  function grade(ctx, o = {}) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.tint) { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = o.tint; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; }
    if (o.dark) { ctx.fillStyle = `rgba(5,5,20,${o.dark})`; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = rg(ctx, W / 2, H / 2, Math.min(W, H) * 0.35, Math.max(W, H) * 0.75, [[0, "rgba(0,0,0,0)"], [1, `rgba(0,0,0,${o.vignette ?? 0.55})`]]); ctx.fillRect(0, 0, W, H);
    const r = mulberry((o.frame || 0) % 24 + 1); ctx.globalAlpha = o.grain ?? 0.05;
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = r() > 0.5 ? "#fff" : "#000"; ctx.fillRect(r() * W, r() * H, 2, 2); }
    ctx.restore();
  }
  // a light cone (window, lamp, phone): soft additive wedge from (x,y) toward the ground
  function cone(ctx, x, y, w, h, col = "rgba(255,226,168,0.2)") {
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = lg(ctx, x, y, x, y + h, [[0, col], [1, "rgba(0,0,0,0)"]]);
    ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - w / 2, y + h); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // ---------- data overlays (the narration's numbers, on screen)
  function stat(ctx, text, x, y, t, a, b = 1e9, o = {}) {
    if (t < a || t > b) return; const k = clamp((t - a) / 0.25, 0, 1) * clamp((b - t) / 0.25, 0, 1);
    ctx.save(); ctx.globalAlpha *= k; ctx.font = `800 ${o.size || 54}px Inter`; ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 12; ctx.fillStyle = o.col || "#ffd27a"; ctx.fillText(text, x, y + (1 - k) * 12); ctx.restore();
  }
  // round stopwatch, hand at fraction v (0..1)
  function stopwatch(ctx, x, y, r, v, o = {}) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = o.face || "#f4ede0"; ctx.fill(); ctx.lineWidth = r * 0.1; ctx.strokeStyle = "#2a2233"; ctx.stroke();
    ctx.fillStyle = "#2a2233"; ctx.fillRect(-r * 0.12, -r * 1.3, r * 0.24, r * 0.22);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78); ctx.lineTo(Math.sin(a) * r * 0.9, -Math.cos(a) * r * 0.9); ctx.lineWidth = r * 0.04; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.7, -Math.PI / 2, -Math.PI / 2 + v * TAU); ctx.closePath(); ctx.fillStyle = "rgba(228,87,46,0.35)"; ctx.fill();
    const a = v * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * r * 0.75, -Math.cos(a) * r * 0.75); ctx.lineWidth = r * 0.06; ctx.strokeStyle = "#e4572e"; ctx.stroke();
    ctx.restore();
  }
  // flip-card scoreboard "A : B"
  function scoreboard(ctx, x, y, a, b, o = {}) {
    const s = o.s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = "#3a2a1e"; ctx.beginPath(); ctx.roundRect(-230, -120, 460, 240, 18); ctx.fill();
    for (const [dx, v] of [[-110, a], [110, b]]) { ctx.fillStyle = "#f6efe2"; ctx.beginPath(); ctx.roundRect(dx - 85, -95, 170, 190, 10); ctx.fill();
      ctx.fillStyle = "#1b1b1b"; ctx.font = "800 130px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(v), dx, 6);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(dx - 85, -2, 170, 4); }
    ctx.fillStyle = "#f6efe2"; ctx.beginPath(); ctx.arc(0, -30, 10, 0, TAU); ctx.arc(0, 30, 10, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // horizontal comparison bars [{label, v (0..1), col}] grown with k
  function compare(ctx, x, y, w, rows, k = 1, o = {}) {
    rows.forEach((r, i) => {
      const yy = y + i * (o.gap || 110);
      ctx.font = "800 44px Inter"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(r.label, x, yy);
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.roundRect(x + 260, yy - 26, w, 52, 26); ctx.fill();
      ctx.fillStyle = r.col; ctx.beginPath(); ctx.roundRect(x + 260, yy - 26, Math.max(52, w * r.v * k), 52, 26); ctx.fill();
      if (r.text) { ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(r.text, x + 280 + Math.max(52, w * r.v * k), yy); }
    });
  }

  window.CINE = { fig, face, bust, sky, city, street, lamp, room, pitch, bokeh, dof, grade, cone, stat, stopwatch, scoreboard, compare, shade };
})();
