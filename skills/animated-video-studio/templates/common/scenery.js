// scenery.js — detailed environments and camera grammar for every style (copied to assets/js by new-film.sh).
// SCENE: layered skies, mountains with atmospheric perspective, cities with lit windows, streets, forests, water,
// detailed interiors, a Caribbean market and tap-tap bus, fog, light rays, ground textures, parallax.
// CAM / TRANS: camera moves and shot transitions. Everything is a pure function of its arguments (seeded, no Math.random).
(function () {
  const { W, H, clamp, lerp, E, mulberry, noise1 } = F;
  const TAU = Math.PI * 2;
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rg = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, "0")).join(""); };
  const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OUT = (ctx, w = 3, c = "rgba(0,0,0,0.55)") => { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); };

  // ---------- palettes (time of day): top, mid, horizon, far (haze), light (sun/moon), ambient tint
  const PAL = {
    dawn: { top: "#2d3a6b", mid: "#c97b8c", hor: "#ffcf9e", far: "#a98aa8", light: "#fff1d0", amb: "#ffd9c0" },
    day: { top: "#3d8fe0", mid: "#7cc0f4", hor: "#d9f0ff", far: "#9fc3d9", light: "#ffffff", amb: "#ffffff" },
    dusk: { top: "#1d1640", mid: "#6a3d7a", hor: "#f2a65a", far: "#8a5a78", light: "#ffd9a0", amb: "#ffb98a" },
    night: { top: "#050816", mid: "#111a3a", hor: "#2a3560", far: "#1b2445", light: "#dfe8ff", amb: "#7f95d9" },
    storm: { top: "#2a2f3a", mid: "#48505e", hor: "#7a828f", far: "#5d6470", light: "#e8eef7", amb: "#a9b3c2" },
  };

  // ---------- sky: gradient, sun or moon with glow, layered shaded clouds, stars
  function sky(ctx, o = {}) {
    const p = PAL[o.time || "day"], hz = o.horizon ?? H * 0.62;
    ctx.fillStyle = lg(ctx, 0, 0, 0, hz, [[0, p.top], [0.6, p.mid], [1, p.hor]]); ctx.fillRect(-W, -H, W * 3, H * 3);
    if (o.time === "night" || o.stars) { const r = mulberry(o.seed || 3); for (let i = 0; i < (o.stars || 180); i++) { const x = r() * W, y = r() * hz * 0.9, a = 0.3 + r() * 0.7 * (0.6 + 0.4 * Math.sin((o.t || 0) * 2 + i)); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, r() > 0.9 ? 3 : 2, r() > 0.9 ? 3 : 2); } }
    const body = o.sun || o.moon;
    if (body) { const { x, y, r = 70 } = body; ctx.fillStyle = rg(ctx, x, y, 0, r * 8, [[0, p.light + "aa"], [0.25, p.light + "33"], [1, p.light + "00"]]); ctx.fillRect(x - r * 8, y - r * 8, r * 16, r * 16);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = p.light; ctx.fill();
      if (o.moon) { ctx.fillStyle = "rgba(150,160,190,0.35)"; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.15], [-0.05, 0.35, 0.12]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.fill(); } } }
    const r = mulberry((o.seed || 5) + 11);
    for (let i = 0; i < (o.clouds ?? 4); i++) cloud(ctx, ((r() * (W + 600) + (o.t || 0) * (8 + r() * 10)) % (W + 600)) - 300, hz * (0.12 + r() * 0.5), 0.6 + r() * 0.9, p, (o.seed || 5) + i);
  }
  function cloud(ctx, x, y, s, p, seed) {
    const r = mulberry(seed * 7 + 1), puffs = [];
    for (let i = 0; i < 7; i++) puffs.push([(i - 3) * 55 * s + (r() - 0.5) * 30 * s, -r() * 45 * s, (45 + r() * 45) * s]);
    ctx.save(); ctx.globalAlpha *= 0.92;
    for (const [dx, dy, rr] of puffs) { ctx.beginPath(); ctx.arc(x + dx, y + dy + rr * 0.25, rr, 0, TAU); ctx.fillStyle = mix(p.far.length === 7 ? p.far : "#999999", "#ffffff", 0.35); ctx.fill(); }
    for (const [dx, dy, rr] of puffs) { ctx.beginPath(); ctx.arc(x + dx - rr * 0.12, y + dy, rr * 0.92, 0, TAU); ctx.fillStyle = mix(p.hor, "#ffffff", 0.55); ctx.fill(); }
    ctx.restore();
  }

  // ---------- mountains: n ranges, far ones lighter (atmospheric perspective), optional snow caps
  function mountains(ctx, y, o = {}) {
    const p = PAL[o.time || "day"], n = o.layers || 3, base = o.col || "#4a5d6e";
    for (let L = 0; L < n; L++) {
      const k = (n - 1 - L) / Math.max(1, n - 1), col = mix(base, p.far, 0.15 + k * 0.7), r = mulberry((o.seed || 2) * 13 + L);
      const h = (o.height || 360) * (0.55 + 0.45 * (1 - k)), yy = y - k * 60;
      ctx.beginPath(); ctx.moveTo(-W, H * 2); let x = -100; ctx.lineTo(x, yy);
      const peaks = [];
      while (x < W + 200) { const w = 160 + r() * 260, ph = h * (0.5 + r() * 0.5); peaks.push([x + w / 2, yy - ph, w]); ctx.lineTo(x + w * 0.5, yy - ph); ctx.lineTo(x + w, yy - r() * 30); x += w * 0.85; }
      ctx.lineTo(W * 2, H * 2); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = "rgba(0,0,0,0.12)";   // shaded side of each peak
      for (const [px, py, w] of peaks) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + w * 0.5, yy + 10); ctx.lineTo(px + w * 0.05, yy + 10); ctx.closePath(); ctx.fill(); }
      if (o.snow) { ctx.fillStyle = mix("#ffffff", p.far, k * 0.5); for (const [px, py, w] of peaks) { if (py > yy - h * 0.7) continue; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + w * 0.16, py + h * 0.18); ctx.lineTo(px + w * 0.05, py + h * 0.15); ctx.lineTo(px - w * 0.05, py + h * 0.2); ctx.lineTo(px - w * 0.16, py + h * 0.17); ctx.closePath(); ctx.fill(); } }
      ctx.restore();
    }
  }

  // ---------- city skyline: n layers of buildings with windows (k = share lit), rooftop details
  function city(ctx, y, o = {}) {
    const p = PAL[o.time || "dusk"], n = o.layers || 3, night = o.time === "night" || o.time === "dusk";
    for (let L = 0; L < n; L++) {
      const k = (n - 1 - L) / Math.max(1, n - 1), r = mulberry((o.seed || 4) * 17 + L), base = o.col || (night ? "#1b1830" : "#56657a");
      const col = mix(base, p.far, 0.1 + k * 0.6), sc = 1 - k * 0.35; let x = -80 + r() * 60;
      while (x < W + 80) {
        const w = (90 + r() * 150) * sc, h = (o.height || 420) * (0.35 + r() * 0.75) * sc, top = y - h - k * 40;
        ctx.fillStyle = col; ctx.fillRect(x, top, w, H * 2);
        ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(x, top, w * 0.12, H);    // lit edge
        const t = r(); if (t < 0.25) { ctx.fillStyle = col; ctx.fillRect(x + w * 0.4, top - 40 * sc, 6, 40 * sc); } else if (t < 0.4) { ctx.fillStyle = col; ctx.fillRect(x + w * 0.2, top - 26 * sc, w * 0.25, 26 * sc); }
        if (L >= n - 2 || !o.farPlain) {
          const cw = 14 * sc, ch = 18 * sc, gx = 26 * sc, gy = 34 * sc;
          for (let wy = top + 20 * sc; wy < y - 20; wy += gy) for (let wx = x + 14 * sc; wx < x + w - cw - 8; wx += gx) {
            const lit = night ? hashf(wx, wy, L) < (o.lit ?? 0.45) : false;
            ctx.fillStyle = lit ? `rgba(255,${200 + hashf(wx, wy, 9) * 40 | 0},120,${0.75 - k * 0.4})` : `rgba(${night ? "20,24,40" : "180,210,235"},${night ? 0.6 : 0.35 - k * 0.2})`;
            ctx.fillRect(wx, wy, cw, ch);
          }
        }
        x += w + (4 + r() * 18) * sc;
      }
      if (k > 0) { ctx.fillStyle = lg(ctx, 0, y - 200, 0, y, [[0, p.far + "00"], [1, p.far + "55"]]); ctx.fillRect(-W, y - 200, W * 3, 200); }
    }
  }
  const hashf = (a, b, c) => { let h = (Math.floor(a) * 374761393 + Math.floor(b) * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ---------- ground textures: grass sand asphalt dirt snow tiles
  function ground(ctx, y, o = {}) {
    const kind = o.kind || "grass", r = mulberry(o.seed || 8);
    const base = { grass: "#5f9e4b", sand: "#e3c98f", asphalt: "#3b3d44", dirt: "#8a6a4a", snow: "#eef3fa", tiles: "#c9b8a0" }[kind];
    ctx.fillStyle = lg(ctx, 0, y, 0, H, [[0, mix(base, "#ffffff", 0.08)], [1, mix(base, "#000000", 0.25)]]); ctx.fillRect(-W, y, W * 3, H * 2);
    if (kind === "grass") for (let i = 0; i < (o.detail ?? 900); i++) { const x = r() * W, yy = y + Math.pow(r(), 1.6) * (H - y), h = 6 + (yy - y) * 0.05 + r() * 8; ctx.strokeStyle = r() > 0.5 ? "#4c8a3c" : "#76b85c"; ctx.lineWidth = 1.5 + (yy - y) * 0.004; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + (r() - 0.5) * 6, yy - h); ctx.stroke(); }
    if (kind === "sand" || kind === "dirt" || kind === "snow") for (let i = 0; i < (o.detail ?? 500); i++) { const x = r() * W, yy = y + r() * (H - y); ctx.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; ctx.fillRect(x, yy, 2 + r() * 4, 1 + r() * 2); }
    if (kind === "asphalt") { for (let i = 0; i < (o.detail ?? 600); i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`; ctx.fillRect(r() * W, y + r() * (H - y), 2, 2); }
      if (o.lines !== false) { ctx.fillStyle = "rgba(255,230,150,0.75)"; const ly = y + (H - y) * 0.45; for (let x = -((o.scroll || 0) % 220); x < W; x += 220) ctx.fillRect(x, ly, 120, 8); } }
    if (kind === "tiles") { ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 2; for (let yy = y; yy < H; yy += 40) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); } for (let x = 0; x < W; x += 80) for (let yy = y; yy < H; yy += 40) { ctx.beginPath(); ctx.moveTo(x + ((yy / 40) % 2) * 40, yy); ctx.lineTo(x + ((yy / 40) % 2) * 40, yy + 40); ctx.stroke(); } }
    ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); OUT(ctx, 3, "rgba(0,0,0,0.25)");
  }

  // ---------- a tree with layered foliage clusters (lit side + shade) — kind: round pine palm
  function tree(ctx, x, y, s = 1, o = {}) {
    const kind = o.kind || "round", r = mulberry(o.seed || Math.round(x)), leaf = o.leaf || (o.season === "autumn" ? "#d9822b" : "#4f8f3a"), sway = Math.sin((o.t || 0) * 1.2 + x) * 4 * s;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (kind === "palm") {
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(10, -200, 30 + sway, -380); ctx.lineTo(44 + sway, -378); ctx.quadraticCurveTo(26, -200, 12, 0); ctx.closePath(); ctx.fillStyle = "#8a6a4a"; ctx.fill(); OUT(ctx, 2);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + sway * 0.01; ctx.beginPath(); ctx.moveTo(37 + sway, -380); ctx.quadraticCurveTo(37 + sway + Math.cos(a) * 120, -380 + Math.sin(a) * 120 - 40, 37 + sway + Math.cos(a) * 220, -380 + Math.sin(a) * 160 + 60); ctx.lineWidth = 26; ctx.strokeStyle = i % 2 ? "#3f8a3a" : "#56a548"; ctx.lineCap = "round"; ctx.stroke(); }
    } else if (kind === "pine") {
      ctx.fillStyle = "#6b4a32"; ctx.fillRect(-10, -60, 20, 60);
      for (let i = 0; i < 4; i++) { const w = 120 - i * 24, yy = -60 - i * 70; ctx.beginPath(); ctx.moveTo(-w + sway * i * 0.3, yy); ctx.lineTo(sway * i * 0.5, yy - 130); ctx.lineTo(w + sway * i * 0.3, yy); ctx.closePath(); ctx.fillStyle = i % 2 ? "#2f6b44" : "#3a7d50"; ctx.fill(); OUT(ctx, 2); }
    } else {
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-8, -170); ctx.lineTo(8, -170); ctx.lineTo(16, 0); ctx.closePath(); ctx.fillStyle = "#7a5530"; ctx.fill(); OUT(ctx, 2);
      const blobs = []; for (let i = 0; i < 9; i++) blobs.push([(r() - 0.5) * 180, -200 - r() * 150, 50 + r() * 45]);
      for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx + sway, by + 8, br, 0, TAU); ctx.fillStyle = mix(leaf, "#000000", 0.25); ctx.fill(); }
      for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx + sway - br * 0.12, by - br * 0.1, br * 0.86, 0, TAU); ctx.fillStyle = leaf; ctx.fill(); }
      for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx + sway - br * 0.3, by - br * 0.35, br * 0.35, 0, TAU); ctx.fillStyle = mix(leaf, "#ffffff", 0.2); ctx.fill(); }
      if (o.fruit) { ctx.fillStyle = o.fruit; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * 160 + sway, -200 - r() * 120, 9, 0, TAU); ctx.fill(); } }
    }
    ctx.restore();
  }
  // a forest band: rows of trees, far rows smaller and hazier
  function forest(ctx, y, o = {}) {
    const p = PAL[o.time || "day"], rows = o.rows || 3;
    for (let L = 0; L < rows; L++) { const k = (rows - 1 - L) / Math.max(1, rows - 1), r = mulberry((o.seed || 6) * 5 + L), s = (o.s || 1) * (0.45 + 0.55 * (1 - k));
      ctx.save(); ctx.globalAlpha *= 1; for (let x = -100 + r() * 80; x < W + 100; x += (90 + r() * 120) * s) tree(ctx, x, y - k * 70, s * (0.8 + r() * 0.4), { kind: o.kind || (r() > 0.6 ? "pine" : "round"), leaf: mix(o.leaf || "#4f8f3a", p.far, k * 0.6), seed: Math.round(x) + L, t: o.t });
      if (k > 0) { ctx.fillStyle = p.far + "44"; ctx.fillRect(-W, y - k * 70 - 400, W * 3, 420); } ctx.restore(); }
  }

  // ---------- water with reflections and moving highlights
  function water(ctx, y, o = {}) {
    const p = PAL[o.time || "day"], t = o.t || 0;
    ctx.fillStyle = lg(ctx, 0, y, 0, H, [[0, o.col || mix(p.hor, "#1d5f8a", 0.6)], [1, mix(o.col || "#1d5f8a", "#000000", 0.4)]]); ctx.fillRect(-W, y, W * 3, H * 2);
    const r = mulberry(o.seed || 12);
    for (let i = 0; i < 70; i++) { const yy = y + Math.pow(r(), 1.5) * (H - y), w = 20 + (yy - y) * 0.25 + r() * 60, x = ((r() * W + t * (20 + r() * 30)) % (W + 200)) - 100;
      ctx.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.15})`; ctx.fillRect(x, yy, w, 2 + (yy - y) * 0.004); }
    if (o.reflect) { const { x, w = 60 } = o.reflect; ctx.fillStyle = lg(ctx, 0, y, 0, H, [[0, p.light + "88"], [1, p.light + "00"]]); for (let i = 0; i < 18; i++) { const yy = y + i * 18, ww = w * (1 + i * 0.08) * (0.7 + 0.3 * Math.sin(t * 3 + i)); ctx.fillRect(x - ww / 2, yy, ww, 6); } }
  }

  // ---------- a detailed street at eye level: buildings' ground floors, sidewalk, curb, road, props
  function street(ctx, y, o = {}) {
    const p = PAL[o.time || "day"], r = mulberry(o.seed || 21), night = o.time === "night" || o.time === "dusk";
    // facades
    let x = -40 - ((o.scroll || 0) % 2000);
    const cols = o.facades || ["#d9a066", "#7aa6c2", "#c96b5a", "#e3d4a8", "#8fb98b", "#b08bc2"];
    while (x < W + 40) { const w = 260 + r() * 220, c = cols[Math.floor(r() * cols.length)], top = y - 520 - r() * 200;
      ctx.fillStyle = mix(c, p.amb, 0.15); ctx.fillRect(x, top, w, y - top); ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(x + w - 14, top, 14, y - top);
      ctx.fillStyle = mix(c, "#000000", 0.25); ctx.fillRect(x - 6, top - 14, w + 12, 18);   // cornice
      for (let wx = x + 30; wx < x + w - 70; wx += 110) for (let wy = top + 50; wy < y - 230; wy += 130) { window_(ctx, wx, wy, 60, 80, night && hashf(wx, wy, 3) < 0.5, p); }
      const dx = x + w * 0.5 - 45; ctx.fillStyle = mix(c, "#000000", 0.45); ctx.fillRect(dx, y - 190, 90, 190); ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(dx + 8, y - 180, 30, 70);
      if (r() > 0.5) { awning(ctx, x + 20, y - 240, w - 40, o.awning || ["#e63946", "#ffffff"]); }
      x += w;
    }
    // sidewalk + curb + road
    rect(ctx, -W, y, W * 3, 70, mix("#bdb6aa", p.amb, 0.1)); for (let sx = -((o.scroll || 0) % 120); sx < W; sx += 120) { ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(sx, y, 3, 70); }
    rect(ctx, -W, y + 70, W * 3, 14, "#8e877c");
    ground(ctx, y + 84, { kind: "asphalt", scroll: o.scroll, detail: 300 });
    for (const lx of o.lamps || []) streetLamp(ctx, lx - (o.scroll || 0), y + 66, night);
  }
  function window_(ctx, x, y, w, h, lit, p) {
    ctx.fillStyle = lit ? "#ffd98a" : mix(p.top, "#9fc3d9", 0.5); ctx.fillRect(x, y, w, h);
    if (!lit) { ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.moveTo(x, y + h * 0.6); ctx.lineTo(x + w * 0.6, y); ctx.lineTo(x + w * 0.8, y); ctx.lineTo(x, y + h * 0.8); ctx.fill(); }
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h); ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(x - 6, y + h, w + 12, 8);
  }
  function awning(ctx, x, y, w, cols) { const n = Math.max(3, Math.round(w / 50)), sw = w / n; for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(x + i * sw, y); ctx.lineTo(x + (i + 1) * sw, y); ctx.lineTo(x + (i + 1) * sw + 8, y + 60); ctx.quadraticCurveTo(x + (i + 0.5) * sw + 4, y + 78, x + i * sw + 8, y + 60); ctx.closePath(); ctx.fill(); } }
  function streetLamp(ctx, x, y, on) {
    ctx.fillStyle = "#2c2f38"; ctx.fillRect(x - 6, y - 420, 12, 420); ctx.fillRect(x - 6, y - 420, 70, 10); ctx.fillRect(x + 50, y - 414, 24, 22);
    if (on) { ctx.fillStyle = rg(ctx, x + 62, y - 395, 0, 200, [[0, "rgba(255,220,150,0.6)"], [1, "rgba(255,220,150,0)"]]); ctx.fillRect(x - 140, y - 600, 400, 400); }
  }

  // ---------- interiors: bedroom kitchen classroom office — floor, walls, window with view, furniture, light pool
  function room(ctx, o = {}) {
    const kind = o.kind || "bedroom", p = PAL[o.time || "day"], wall = o.wall || "#e8dcc6", fy = o.floorY ?? H * 0.74, night = o.time === "night";
    ctx.fillStyle = lg(ctx, 0, 0, 0, fy, [[0, mix(wall, "#000000", night ? 0.55 : 0.08)], [1, mix(wall, "#000000", night ? 0.45 : 0)]]); ctx.fillRect(-W, -H, W * 3, fy + H);
    // floor boards
    ctx.fillStyle = mix(o.floor || "#a8794e", "#000000", night ? 0.45 : 0); ctx.fillRect(-W, fy, W * 3, H * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2; for (let yy = fy + 24; yy < H; yy += 28 + (yy - fy) * 0.15) { ctx.beginPath(); ctx.moveTo(-W, yy); ctx.lineTo(W * 2, yy); ctx.stroke(); }
    rect(ctx, -W, fy - 22, W * 3, 22, mix(wall, "#000000", 0.25));
    // window with the outside
    const [wx, wy, ww, wh] = o.window || [W * 0.58, H * 0.13, W * 0.26, H * 0.36];
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); sky(ctx, { time: o.time || "day", horizon: wy + wh, sun: o.time === "night" ? null : { x: wx + ww * 0.7, y: wy + wh * 0.35, r: 30 }, moon: night ? { x: wx + ww * 0.7, y: wy + wh * 0.3, r: 26 } : null, clouds: 2, seed: 4, t: o.t });
    city(ctx, wy + wh, { time: o.time || "day", layers: 2, height: wh * 0.7, seed: 3 }); ctx.restore();
    ctx.strokeStyle = "#f4f0e8"; ctx.lineWidth = 16; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = o.curtain || "#c95b4b"; for (const sx of [wx - 60, wx + ww + 10]) { ctx.beginPath(); ctx.moveTo(sx, wy - 30); ctx.lineTo(sx + 50, wy - 30); ctx.quadraticCurveTo(sx + 60, wy + wh * 0.6, sx + 40, wy + wh + 40); ctx.lineTo(sx, wy + wh + 40); ctx.closePath(); ctx.fill(); }
    rect(ctx, wx - 80, wy - 40, ww + 160, 12, "#6b4a32");
    // the light from the window on the floor
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = night ? "rgba(120,140,220,0.12)" : "rgba(255,236,190,0.25)";
    ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx + ww * 0.7, fy + 200); ctx.lineTo(wx - ww * 0.6, fy + 200); ctx.closePath(); ctx.fill(); ctx.restore();
    // shelf with books, a frame, a plant
    const sx = W * 0.12, sy = H * 0.28; rect(ctx, sx, sy, 300, 14, "#6b4a32");
    const r = mulberry(7); let bx = sx + 10; for (let i = 0; i < 9; i++) { const bw = 18 + r() * 14, bh = 60 + r() * 40; rect(ctx, bx, sy - bh, bw, bh, ["#c0392b", "#2c7fb8", "#f4a261", "#2a9d8f", "#8e5ea2", "#e9c46a"][i % 6]); bx += bw + 2; }
    ctx.fillStyle = "#3a6e3a"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(sx + 270 + Math.cos(i) * 14, sy - 40 - i * 6, 10, 26, i - 2.5, 0, TAU); ctx.fill(); } rect(ctx, sx + 252, sy - 26, 36, 26, "#c4704f");
    rect(ctx, sx + 40, sy + 70, 120, 90, "#3a2a20"); rect(ctx, sx + 50, sy + 80, 100, 70, o.frame || "#9fc3d9");
    if (kind === "bedroom") { rect(ctx, W * 0.08, fy - 150, 560, 150, "#5a6e8c"); rect(ctx, W * 0.08, fy - 190, 560, 50, "#f2efe9"); rect(ctx, W * 0.08 - 20, fy - 260, 30, 260, "#6b4a32"); ctx.fillStyle = "#e8b04b"; ctx.beginPath(); ctx.ellipse(W * 0.08 + 90, fy - 200, 70, 30, 0, 0, TAU); ctx.fill(); }
    if (kind === "kitchen") { rect(ctx, W * 0.05, fy - 300, W * 0.38, 300, "#dfe6ec"); rect(ctx, W * 0.05, fy - 310, W * 0.38, 18, "#8a6a4a"); for (let i = 0; i < 4; i++) { rect(ctx, W * 0.07 + i * 175, fy - 270, 150, 240, "rgba(0,0,0,0.06)"); rect(ctx, W * 0.07 + i * 175 + 120, fy - 160, 10, 40, "#999"); } }
    if (kind === "classroom") { rect(ctx, W * 0.1, H * 0.12, W * 0.42, H * 0.36, "#2f4f3a"); ctx.strokeStyle = "#8a6a4a"; ctx.lineWidth = 14; ctx.strokeRect(W * 0.1, H * 0.12, W * 0.42, H * 0.36); }
    if (kind === "office") { rect(ctx, W * 0.1, fy - 130, 520, 20, "#6b4a32"); rect(ctx, W * 0.1 + 20, fy - 110, 14, 110, "#4a3424"); rect(ctx, W * 0.1 + 486, fy - 110, 14, 110, "#4a3424"); rect(ctx, W * 0.1 + 180, fy - 300, 220, 150, "#1b1b22"); rect(ctx, W * 0.1 + 190, fy - 290, 200, 130, "#6fb6ff"); }
    // lamp light pool (night)
    if (night || o.lamp) { ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = rg(ctx, o.lampX ?? W * 0.3, fy - 260, 0, 520, [[0, "rgba(255,200,120,0.45)"], [1, "rgba(255,200,120,0)"]]); ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
  }

  // ---------- a Caribbean market street: stalls with fruit and fabric, a painted tap-tap bus
  function market(ctx, y, o = {}) {
    const r = mulberry(o.seed || 31), fruit = ["#f4a261", "#e63946", "#ffd166", "#06d6a0", "#8338ec"];
    for (let i = 0; i < (o.stalls || 4); i++) { const x = 120 + i * (W - 240) / Math.max(1, (o.stalls || 4) - 1) - 130;
      rect(ctx, x, y - 130, 260, 130, "#8a5a32"); rect(ctx, x - 10, y - 140, 280, 16, "#6b4426");
      for (let k = 0; k < 18; k++) { ctx.beginPath(); ctx.arc(x + 20 + (k % 9) * 28, y - 152 - Math.floor(k / 9) * 22, 13, 0, TAU); ctx.fillStyle = fruit[(i + k) % fruit.length]; ctx.fill(); }
      rect(ctx, x + 6, y - 380, 10, 240, "#5a3a20"); rect(ctx, x + 244, y - 380, 10, 240, "#5a3a20");
      awning(ctx, x - 20, y - 400, 300, [["#e63946", "#ffd166"], ["#1d3557", "#ffffff"], ["#2a9d8f", "#f4a261"], ["#8338ec", "#ffd166"]][i % 4]);
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y - 330); ctx.quadraticCurveTo(x + 130, y - 300 + r() * 20, x + 280, y - 330); ctx.stroke();
      for (let k = 0; k < 5; k++) rect(ctx, x + k * 56, y - 328 + Math.sin(k) * 6, 30, 50, fruit[(k + i * 2) % fruit.length] + "cc");
    }
  }
  function taptap(ctx, x, y, s = 1, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
    const body = [[-260, -60], [240, -60], [260, -40], [260, -20], [-260, -20]];
    ctx.beginPath(); ctx.roundRect(-260, -260, 470, 200, 18); ctx.fillStyle = o.col || "#f4c430"; ctx.fill(); OUT(ctx, 5, "#111");
    ctx.beginPath(); ctx.moveTo(210, -260); ctx.lineTo(260, -200); ctx.lineTo(260, -60); ctx.lineTo(210, -60); ctx.closePath(); ctx.fillStyle = "#e63946"; ctx.fill(); OUT(ctx, 5, "#111");
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(-240 + i * 110, -240, 90, 70, 10); ctx.fillStyle = "#a8d8f0"; ctx.fill(); OUT(ctx, 4, "#111"); }
    const st = ["#e63946", "#1d3557", "#2a9d8f", "#8338ec", "#ff6b9a"]; for (let i = 0; i < 18; i++) { ctx.fillStyle = st[i % 5]; ctx.beginPath(); ctx.moveTo(-260 + i * 27, -150); ctx.lineTo(-247 + i * 27, -125); ctx.lineTo(-234 + i * 27, -150); ctx.fill(); }
    ctx.font = "400 40px 'Lilita One', Inter"; ctx.fillStyle = "#1d3557"; ctx.textAlign = "center"; ctx.fillText(o.text || "BONDYE BON", -30, -80);
    ctx.beginPath(); ctx.roundRect(-270, -70, 540, 40, 8); ctx.fillStyle = "#2c2c2c"; ctx.fill();
    for (const wx of [-170, 160]) { ctx.beginPath(); ctx.arc(wx, -25, 42, 0, TAU); ctx.fillStyle = "#1b1b1b"; ctx.fill(); ctx.beginPath(); ctx.arc(wx, -25, 18, 0, TAU); ctx.fillStyle = "#bbb"; ctx.fill(); }
    ctx.restore();
  }

  // ---------- atmosphere
  function fog(ctx, y, h, col = "#ffffff", a = 0.5) { ctx.fillStyle = lg(ctx, 0, y - h, 0, y + h, [[0, col + "00"], [0.5, col + Math.round(a * 255).toString(16).padStart(2, "0")], [1, col + "00"]]); ctx.fillRect(-W, y - h, W * 3, h * 2); }
  function rays(ctx, x, y, o = {}) {
    ctx.save(); ctx.globalCompositeOperation = "screen"; const n = o.n || 7, len = o.len || H * 1.4, col = o.col || "rgba(255,240,200,0.12)";
    for (let i = 0; i < n; i++) { const a = (o.angle ?? 1.2) + (i - n / 2) * (o.spread || 0.09) + Math.sin((o.t || 0) * 0.3 + i) * 0.01, w = 0.02 + (i % 3) * 0.012;
      ctx.fillStyle = lg(ctx, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, [[0, col], [1, "rgba(0,0,0,0)"]]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len); ctx.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  // tint the whole frame with the time of day (call after drawing characters so they sit in the same light)
  function light(ctx, time, k = 1) { const p = PAL[time]; if (!p || k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.25 * k; ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = p.amb; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // parallax: draw fn shifted by the camera offset times (1 - depth). depth 0 = at infinity, 1 = at the subject
  function parallax(ctx, camX, depth, fn) { ctx.save(); ctx.translate(-camX * depth, 0); fn(); ctx.restore(); }

  // ---------- CAMERA: keyed moves and shakes (use inside a shot, around the set)
  const CAM = {
    // move(ctx, lt, [[t, cx, cy, zoom, rot?, ease?], …]) — keyframed camera
    move(ctx, lt, keys) {
      let a = keys[0], b = keys[keys.length - 1];
      for (let i = 0; i < keys.length - 1; i++) if (lt >= keys[i][0] && lt <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
      const k = b[0] === a[0] ? 1 : (b[5] || E.io2)(clamp((lt - a[0]) / (b[0] - a[0]), 0, 1));
      const cx = lerp(a[1], b[1], k), cy = lerp(a[2], b[2], k), z = lerp(a[3], b[3], k), r = lerp(a[4] || 0, b[4] || 0, k);
      ctx.translate(W / 2, H / 2); ctx.rotate(r); ctx.scale(z, z); ctx.translate(-cx, -cy);
      return { cx, cy, z };
    },
    handheld(t, amp = 4, seed = 1) { return [noise1(t * 0.9, seed) * amp, noise1(t * 0.8, seed + 7) * amp]; },
    shake(t, a, dur = 0.4, amp = 18) { const k = clamp(1 - (t - a) / dur, 0, 1); if (t < a || k <= 0) return [0, 0]; return [Math.sin(t * 90) * amp * k, Math.cos(t * 77) * amp * k]; },
  };
  // ---------- TRANSITIONS between shots (call at the end of renderAt with the time of the cut)
  const TRANS = {
    dip(ctx, t, at, d = 0.5, col = "#000") { const k = 1 - Math.abs(t - at) / (d / 2); if (k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(k, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); },
    flash(ctx, t, at, d = 0.25) { TRANS.dip(ctx, t, at, d, "#fff"); },
    iris(ctx, t, at, d = 0.8, x = W / 2, y = H / 2) { const k = Math.abs(t - at) / (d / 2); if (k >= 1) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, Math.hypot(W, H) * E.io2(k), 0, TAU, true); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore(); },
    wipe(ctx, t, at, d = 0.5, col = "#111") { const k = (t - (at - d / 2)) / d; if (k <= 0 || k >= 1) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = col; const x = lerp(-W, W, E.io2(k)); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W, 0); ctx.lineTo(x + W - 200, H); ctx.lineTo(x - 200, H); ctx.closePath(); ctx.fill(); ctx.restore(); },
    // whip pan: motion-blur streaks across the cut
    whip(ctx, t, at, d = 0.3) { const k = 1 - Math.abs(t - at) / (d / 2); if (k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = k * 0.85; const r = mulberry(Math.round(at * 10));
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(${200 + r() * 55 | 0},${200 + r() * 55 | 0},${200 + r() * 55 | 0},${0.2 + r() * 0.4})`; ctx.fillRect(0, r() * H, W, 4 + r() * 30); } ctx.restore(); },
  };

  window.SCENE = { PAL, sky, cloud, mountains, city, ground, tree, forest, water, street, window: window_, awning, streetLamp, room, market, taptap, fog, rays, light, parallax, mix };
  window.CAM = CAM; window.TRANS = TRANS;
})();
