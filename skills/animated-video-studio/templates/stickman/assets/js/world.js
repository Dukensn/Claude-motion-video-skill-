// World: flat 2D sets, effects (impacts, flashes, speed lines), and explainer graphics.
// Clean simple shapes, flat colours, one accent. Everything is a function of time.
(function () {
  const { W, H, clamp, lerp, E, prog, hash, mulberry, noise1 } = F;
  const INK = "#151515";
  const TAU = Math.PI * 2;
  const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rg = (ctx, x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function stroke(ctx, w, col = INK) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); }

  // ---------- backgrounds
  const BG = {
    // plain paper: the classic stickman look
    paper(ctx, col = "#f4f1ea") { ctx.fillStyle = col; ctx.fillRect(-W, -H, W * 3, H * 3); },
    sky(ctx, o = {}) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, o.horizon ?? H, [[0, o.top || "#7ec8ff"], [1, o.bottom || "#e6f6ff"]]); ctx.fillRect(-W, -H, W * 3, H * 3); // oversized: survives camera moves
      if (o.stars) stars(ctx, o.stars, o.t || 0, o.seed || 4);
      if (o.sun) sun(ctx, o.sun.x, o.sun.y, o.sun.r || 70, o.sun.col);
      if (o.moon) moon(ctx, o.moon.x, o.moon.y, o.moon.r || 60, o.moon);
    },
    night(ctx, o = {}) { BG.sky(ctx, Object.assign({ top: "#0b1230", bottom: "#28305e", stars: 140 }, o)); },
    sunset(ctx, o = {}) { BG.sky(ctx, Object.assign({ top: "#3d2c6e", bottom: "#ff9e6b" }, o)); },
    ground(ctx, y, o = {}) {
      ctx.fillStyle = o.col || "#e7e2d6"; ctx.fillRect(-W, y, W * 3, H * 2);
      ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); stroke(ctx, o.line ?? 5, o.lineCol || INK);
    },
    hills(ctx, y, o = {}) {
      const cols = o.cols || ["#9fd08a", "#7fbf6a", "#5fa452"];
      cols.forEach((c, i) => {
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y - 60 + i * 50 + noise1(x / (380 - i * 80) + i * 7, (o.seed || 2) + i) * (90 - i * 20));
        ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      });
    },
    mountains(ctx, y, o = {}) {
      const r = mulberry(o.seed || 5);
      [["#8b9bb4", 1], ["#6e7f9b", 0.7]].forEach(([c, k], i) => {
        ctx.beginPath(); ctx.moveTo(0, y);
        let x = -100; while (x < W + 200) { const w = 220 + r() * 260; ctx.lineTo(x + w / 2, y - (180 + r() * 220) * k); ctx.lineTo(x + w, y); x += w * 0.8; }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      });
    },
    city(ctx, y, o = {}) {
      const r = mulberry(o.seed || 8);
      const night = !!o.night;
      let x = -20;
      while (x < W) {
        const w = 90 + r() * 120, h = 160 + r() * 380;
        ctx.fillStyle = night ? "#1d2238" : (o.col || "#c9cfd8"); ctx.fillRect(x, y - h, w, h);
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x, y - h, w, h);
        for (let wy = y - h + 24; wy < y - 30; wy += 42) for (let wx = x + 16; wx < x + w - 20; wx += 34) {
          const lit = night ? r() < 0.45 : false;
          ctx.fillStyle = lit ? "#ffd56b" : (night ? "#2c3352" : "#e9eef5"); ctx.fillRect(wx, wy, 16, 22);
        }
        x += w + 8 + r() * 20;
      }
    },
    room(ctx, o = {}) {
      const fy = o.floor ?? H * 0.78;
      ctx.fillStyle = o.wall || "#efe9dd"; ctx.fillRect(-W, -H, W * 3, fy + H);
      ctx.fillStyle = o.floorCol || "#d8cbb3"; ctx.fillRect(-W, fy, W * 3, H * 2);
      ctx.beginPath(); ctx.moveTo(-W, fy); ctx.lineTo(W * 2, fy); stroke(ctx, 5);
      if (o.window) { const [x, y, w, h] = o.window; ctx.fillStyle = o.night ? "#1b2346" : "#bfe6ff"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(x, y, w, h); ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); }
      if (o.door) { const [x, w] = o.door; ctx.fillStyle = "#b88a5a"; ctx.fillRect(x, fy - 330, w, 330); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(x, fy - 330, w, 330); circle(ctx, x + w - 26, fy - 165, 8); ctx.fillStyle = INK; ctx.fill(); }
      if (o.board) whiteboard(ctx, ...o.board);
    },
    space(ctx, o = {}) { ctx.fillStyle = lg(ctx, 0, 0, W, H, [[0, "#05060f"], [1, "#141a3a"]]); ctx.fillRect(-W, -H, W * 3, H * 3); stars(ctx, o.stars ?? 260, o.t || 0, o.seed || 9); },
    desert(ctx, y, o = {}) { BG.sky(ctx, { top: "#ffd89a", bottom: "#fff3d6", sun: o.sun }); ctx.fillStyle = "#e9c27a"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 260) * 30); ctx.lineTo(W, H); ctx.fill(); },
    ocean(ctx, y, t = 0) {
      ctx.fillStyle = lg(ctx, 0, y, 0, H, [[0, "#3a8fd6"], [1, "#16507f"]]); ctx.fillRect(-W, y, W * 3, H * 2);
      for (let row = 0; row < 4; row++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) { const yy = y + 20 + row * 50 + Math.sin(x / 80 + t * 2 + row) * 6; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } stroke(ctx, 3, "rgba(255,255,255,0.45)"); }
    },
    dojo(ctx, o = {}) {
      const fy = o.floor ?? H * 0.8;
      ctx.fillStyle = "#e9d8b4"; ctx.fillRect(0, 0, W, fy);
      for (let x = 0; x < W; x += 240) { ctx.fillStyle = "#d9c49a"; ctx.fillRect(x + 110, 0, 20, fy); }
      ctx.fillStyle = "#b9844f"; ctx.fillRect(0, fy, W, H - fy);
      for (let x = 0; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x - 120, H); stroke(ctx, 3, "rgba(0,0,0,0.15)"); }
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); stroke(ctx, 5);
    },
    // a single colour wash with a soft spotlight: for focus moments and fights
    spot(ctx, col = "#1b1b1f", x = W / 2, y = H * 0.55) { ctx.fillStyle = col; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.fillStyle = rg(ctx, x, y, 0, H * 0.7, [[0, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]]); ctx.fillRect(0, 0, W, H); },
  };

  function stars(ctx, n, t, seed) {
    const r = mulberry(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H * 0.85, s = 0.8 + r() * 2.2, tw = 0.6 + 0.4 * Math.sin(t * (1 + r() * 2) + i);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * tw * r()})`; ctx.fillRect(x, y, s, s);
    }
  }
  function sun(ctx, x, y, r, col = "#ffd166") {
    ctx.fillStyle = rg(ctx, x, y, r * 0.6, r * 3, [[0, "rgba(255,220,120,0.6)"], [1, "rgba(255,220,120,0)"]]); ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    circle(ctx, x, y, r); ctx.fillStyle = col; ctx.fill(); stroke(ctx, 5);
  }
  // o: {phase 0..1 (0 new, 0.5 full), glow, alpha}
  function moon(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = rg(ctx, x, y, r * 0.8, r * 3, [[0, "rgba(220,230,255,0.35)"], [1, "rgba(220,230,255,0)"]]); ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    circle(ctx, x, y, r); ctx.fillStyle = "#f2f0e6"; ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.08)"; for (const [cx, cy, cr] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [0.05, -0.45, 0.1], [-0.1, 0.4, 0.13]]) { circle(ctx, x + cx * r, y + cy * r, cr * r); ctx.fill(); }
    if (o.line !== false) { circle(ctx, x, y, r); stroke(ctx, 4); }
    ctx.restore();
  }
  // earth with simple continents; rot shifts them
  function earth(ctx, x, y, r, rot = 0) {
    ctx.save();
    circle(ctx, x, y, r); ctx.fillStyle = "#3a86ff"; ctx.fill(); ctx.clip();
    ctx.fillStyle = "#57cc99";
    const blobs = [[-0.35, -0.25, 0.38, 0.28], [0.3, 0.1, 0.3, 0.4], [-0.1, 0.45, 0.25, 0.15], [0.55, -0.5, 0.2, 0.15]];
    for (const [bx, by, rx, ry] of blobs) { ctx.beginPath(); ctx.ellipse(x + (((bx + rot + 1.5) % 2) - 1) * r * 1.2, y + by * r, rx * r, ry * r, 0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rg(ctx, x - r * 0.4, y - r * 0.4, r * 0.1, r * 1.4, [[0, "rgba(255,255,255,0.25)"], [1, "rgba(0,0,30,0.35)"]]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
    circle(ctx, x, y, r); stroke(ctx, 5);
  }
  function planet(ctx, x, y, r, col = "#e76f51", ring = false) {
    if (ring) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.45, -0.3, Math.PI, TAU); stroke(ctx, 6, "#e9c46a"); }
    circle(ctx, x, y, r); ctx.fillStyle = col; ctx.fill(); stroke(ctx, 5);
    if (ring) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.45, -0.3, 0, Math.PI); stroke(ctx, 6, "#e9c46a"); }
  }

  // ---------- props in the world
  const PROP = {
    tree(ctx, x, y, s = 1, kind = "round") {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 140 * s); stroke(ctx, 14 * s, "#7a5230");
      if (kind === "pine") { ctx.beginPath(); ctx.moveTo(x - 80 * s, y - 80 * s); ctx.lineTo(x, y - 330 * s); ctx.lineTo(x + 80 * s, y - 80 * s); ctx.closePath(); ctx.fillStyle = "#2d6a4f"; ctx.fill(); stroke(ctx, 5); }
      else { circle(ctx, x, y - 200 * s, 95 * s); ctx.fillStyle = "#52b788"; ctx.fill(); stroke(ctx, 5); }
    },
    rock(ctx, x, y, s = 1) { ctx.beginPath(); ctx.moveTo(x - 70 * s, y); ctx.quadraticCurveTo(x - 60 * s, y - 70 * s, x, y - 80 * s); ctx.quadraticCurveTo(x + 70 * s, y - 60 * s, x + 75 * s, y); ctx.closePath(); ctx.fillStyle = "#a8a29e"; ctx.fill(); stroke(ctx, 5); },
    cave(ctx, x, y, s = 1) { ctx.beginPath(); ctx.moveTo(x - 320 * s, y); ctx.quadraticCurveTo(x - 280 * s, y - 380 * s, x, y - 400 * s); ctx.quadraticCurveTo(x + 300 * s, y - 380 * s, x + 340 * s, y); ctx.closePath(); ctx.fillStyle = "#8d8178"; ctx.fill(); stroke(ctx, 6); ctx.beginPath(); ctx.ellipse(x, y, 130 * s, 190 * s, 0, Math.PI, TAU); ctx.fillStyle = "#1e1a17"; ctx.fill(); },
    fire(ctx, x, y, t, s = 1) {
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 50 * s + i * 30 * s, y); ctx.lineTo(x - 20 * s + i * 10 * s, y - 14 * s); stroke(ctx, 10 * s, "#7a5230"); }
      const f = (k, col, sc) => { const h = (90 + noise1(t * 6, k) * 20) * s * sc; ctx.beginPath(); ctx.moveTo(x - 40 * s * sc, y - 6); ctx.quadraticCurveTo(x - 30 * s * sc, y - h * 0.6, x + noise1(t * 4, k + 3) * 12, y - h); ctx.quadraticCurveTo(x + 30 * s * sc, y - h * 0.6, x + 40 * s * sc, y - 6); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      f(1, "#f77f00", 1); f(2, "#fcbf49", 0.65);
      ctx.fillStyle = rg(ctx, x, y - 40 * s, 10, 260 * s, [[0, "rgba(255,170,60,0.35)"], [1, "rgba(255,170,60,0)"]]); ctx.fillRect(x - 260 * s, y - 300 * s, 520 * s, 520 * s);
    },
    table(ctx, x, y, w = 260) { ctx.fillStyle = "#b07d4f"; ctx.fillRect(x - w / 2, y - 120, w, 18); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(x - w / 2, y - 120, w, 18); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * (w / 2 - 20), y - 102); ctx.lineTo(x + sx * (w / 2 - 20), y); stroke(ctx, 8); } },
    chair(ctx, x, y, dir = 1) { ctx.beginPath(); ctx.moveTo(x - 40, y - 132); ctx.lineTo(x + 40, y - 132); stroke(ctx, 10, "#7a5230"); ctx.beginPath(); ctx.moveTo(x - dir * 40, y - 132); ctx.lineTo(x - dir * 44, y - 260); stroke(ctx, 10, "#7a5230"); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * 34, y - 128); ctx.lineTo(x + sx * 34, y); stroke(ctx, 8, "#7a5230"); } },
    rocket(ctx, x, y, s = 1, flame = 0, t = 0) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      if (flame > 0) { const h = (80 + noise1(t * 10, 2) * 20) * flame; ctx.beginPath(); ctx.moveTo(-26, 60); ctx.quadraticCurveTo(0, 60 + h * 1.6, 26, 60); ctx.fillStyle = "#f77f00"; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(0, -150); ctx.quadraticCurveTo(50, -80, 40, 60); ctx.lineTo(-40, 60); ctx.quadraticCurveTo(-50, -80, 0, -150); ctx.fillStyle = "#f1f1f1"; ctx.fill(); stroke(ctx, 6);
      circle(ctx, 0, -50, 18); ctx.fillStyle = "#7fd1ff"; ctx.fill(); stroke(ctx, 5);
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 38, 10); ctx.lineTo(sd * 70, 70); ctx.lineTo(sd * 40, 60); ctx.closePath(); ctx.fillStyle = "#e63946"; ctx.fill(); stroke(ctx, 5); }
      ctx.restore();
    },
    sign(ctx, x, y, text, o = {}) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 170); stroke(ctx, 8, "#7a5230"); ctx.font = `700 ${o.size || 34}px ${FONTS.ui}`; const w = ctx.measureText(text).width + 40; ctx.fillStyle = "#f3e2b3"; ctx.fillRect(x - w / 2, y - 230, w, 70); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(x - w / 2, y - 230, w, 70); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y - 195); },
  };

  function whiteboard(ctx, x, y, w, h) {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#7a7f87"; ctx.lineWidth = 10; ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + 40, y + h + 6); ctx.lineTo(x + w - 40, y + h + 6); stroke(ctx, 8, "#7a7f87");
  }

  // ---------- effects
  const FX = {
    // colour inversion flash for impacts (1–2 frames): FX.flash(ctx, t, hitTime)
    flash(ctx, t, at, frames = 2) {
      if (t < at || t > at + frames / 30) return;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "difference"; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
    whiteFlash(ctx, t, at, dur = 0.25) { const k = 1 - clamp((t - at) / dur, 0, 1); if (t < at || k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); },
    // comic impact star at (x,y), expanding after `at`
    impact(ctx, x, y, t, at, size = 120, col = "#ffd166") {
      const k = (t - at) / 0.35; if (k < 0 || k > 1) return;
      const r = size * E.out3(k), a = 1 - k;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const ang = (i / 16) * TAU, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); stroke(ctx, 5);
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * TAU + 0.2; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r * 1.1, Math.sin(ang) * r * 1.1); ctx.lineTo(Math.cos(ang) * r * 1.5, Math.sin(ang) * r * 1.5); stroke(ctx, 6); }
      ctx.restore();
    },
    // horizontal speed lines behind a moving figure (dir = direction of travel)
    speedLines(ctx, x, y, dir, t, k = 1, seed = 3) {
      const r = mulberry(seed + Math.floor(t * 15));
      ctx.save(); ctx.globalAlpha *= k;
      for (let i = 0; i < 14; i++) { const yy = y - 260 + r() * 300, len = 80 + r() * 220, x0 = x - dir * (60 + r() * 200); ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 - dir * len, yy); stroke(ctx, 3 + r() * 3, "rgba(20,20,20,0.5)"); }
      ctx.restore();
    },
    // full-screen radial speed lines (focus / shock)
    focusLines(ctx, cx, cy, t, k = 1) {
      const r = mulberry(11 + Math.floor(t * 12));
      ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = "rgba(0,0,0,0.85)";
      for (let i = 0; i < 70; i++) { const a = r() * TAU, w = 0.004 + r() * 0.01, r0 = 380 + r() * 200, r1 = 1400; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1); ctx.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1); ctx.fill(); }
      ctx.restore();
    },
    dust(ctx, x, y, t, at, n = 6) {
      const k = (t - at) / 0.8; if (k < 0 || k > 1) return;
      for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1, d = (40 + i * 22) * E.out3(k); circle(ctx, x + sd * d, y - 14 - i * 3 * k, (16 + i * 3) * (1 - k * 0.5)); ctx.fillStyle = `rgba(160,150,135,${0.6 * (1 - k)})`; ctx.fill(); }
    },
    // icons above a head: "?", "!", "...", "zzz", "♥", "💡"(bulb)
    icon(ctx, kind, x, y, t, a, b) {
      if (t < a || t > b) return;
      const k = E.back(clamp((t - a) / 0.3, 0, 1)), out = clamp((b - t) / 0.25, 0, 1);
      ctx.save(); ctx.globalAlpha *= out; ctx.translate(x, y + (1 - k) * 20); ctx.scale(k, k);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `900 84px ${FONTS.title}`; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = "round";
      const txt = { "?": "?", "!": "!", "...": "...", zzz: "z z z", heart: "♥" }[kind];
      if (kind === "bulb") { circle(ctx, 0, 0, 34); ctx.fillStyle = "#ffd166"; ctx.fill(); stroke(ctx, 6); ctx.fillStyle = "#adb5bd"; ctx.fillRect(-16, 32, 32, 22); for (let i = 0; i < 8; i++) { const ang = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 48, Math.sin(ang) * 48); ctx.lineTo(Math.cos(ang) * 66, Math.sin(ang) * 66); stroke(ctx, 6, "#ffd166"); } }
      else { ctx.fillStyle = kind === "heart" ? "#e63946" : kind === "!" ? "#e63946" : "#ffffff"; ctx.strokeText(txt, 0, 0); ctx.fillText(txt, 0, 0); }
      ctx.restore();
    },
    shake(t, a, b, amp = 14) { if (t < a || t > b) return [0, 0]; const k = 1 - (t - a) / (b - a); return [noise1(t * 40, 1) * amp * k, noise1(t * 40, 2) * amp * k]; },
    vignette(ctx, a = 0.35) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = rg(ctx, W / 2, H / 2, H * 0.4, H * 1.05, [[0, "rgba(0,0,0,0)"], [1, `rgba(0,0,0,${a})`]]); ctx.fillRect(0, 0, W, H); ctx.restore(); },
    fade(ctx, k, col = "#000") { if (k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(k, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); },
  };

  // ---------- explainer graphics
  const FONTS = { ui: "'Inter', 'Helvetica Neue', Arial, sans-serif", hand: "'Caveat', cursive", title: "'Lilita One', 'Impact', sans-serif" };
  // draw a polyline progressively (k 0..1): arrows, circles, underlines
  function drawOn(ctx, pts, k, w = 6, col = INK) {
    if (k <= 0) return;
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
    let left = tot * clamp(k, 0, 1);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= L[i - 1]; }
    stroke(ctx, w, col);
  }
  const GFX = {
    drawOn,
    arrow(ctx, a, b, k = 1, o = {}) {
      const bend = o.bend ?? 0.2, mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]]); }
      drawOn(ctx, pts, k, o.w || 6, o.col || INK);
      if (k >= 1) { const p = pts[23], q = pts[24], ang = Math.atan2(q[1] - p[1], q[0] - p[0]); ctx.beginPath(); ctx.moveTo(q[0] + Math.cos(ang + 2.6) * 26, q[1] + Math.sin(ang + 2.6) * 26); ctx.lineTo(q[0], q[1]); ctx.lineTo(q[0] + Math.cos(ang - 2.6) * 26, q[1] + Math.sin(ang - 2.6) * 26); stroke(ctx, o.w || 6, o.col || INK); }
    },
    // text label that pops in: o {size, font:'ui'|'hand'|'title', col, bg, align, box}
    label(ctx, text, x, y, t, a, b = 1e9, o = {}) {
      if (t < a || t > b) return;
      const k = E.back(clamp((t - a) / 0.35, 0, 1)), out = clamp((b - t) / 0.3, 0, 1);
      ctx.save(); ctx.globalAlpha *= out; ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = `${o.weight || (o.font === "hand" ? 700 : 800)} ${o.size || 48}px ${FONTS[o.font || "ui"]}`; ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle";
      if (o.box) { const w = ctx.measureText(text).width + 40, h = (o.size || 48) * 1.4; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.fillStyle = o.box; ctx.fill(); stroke(ctx, 5); }
      ctx.fillStyle = o.col || INK; ctx.fillText(text, 0, 2);
      ctx.restore();
    },
    // counter rolling from a to b over [t0, t1]: fmt(n) -> string
    counter(ctx, x, y, t, t0, t1, a, b, o = {}) {
      const v = lerp(a, b, prog(t, t0, t1, E.out3));
      const s = o.fmt ? o.fmt(v) : Math.round(v).toLocaleString("en-US");
      ctx.font = `900 ${o.size || 120}px ${FONTS[o.font || "title"]}`; ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = (o.size || 120) * 0.12; ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.strokeText(s, x, y);
      ctx.fillStyle = o.col || "#ffd166"; ctx.fillText(s, x, y);
    },
    // bar chart that grows with a stagger. data: [{label, v, col}], max
    bars(ctx, x, y, w, h, data, t, t0, o = {}) {
      const n = data.length, gap = 30, bw = (w - gap * (n - 1)) / n, max = o.max || Math.max(...data.map((d) => d.v));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); stroke(ctx, 5);
      data.forEach((d, i) => {
        const k = prog(t, t0 + i * 0.25, t0 + i * 0.25 + 0.8, E.out3), bh = (d.v / max) * h * k, bx = x + i * (bw + gap);
        ctx.fillStyle = d.col || "#4dabf7"; ctx.fillRect(bx, y - bh, bw, bh); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(bx, y - bh, bw, bh);
        ctx.font = `700 ${o.size || 34}px ${FONTS.ui}`; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(d.label, bx + bw / 2, y + 14);
        if (k > 0.95 && d.text) { ctx.textBaseline = "bottom"; ctx.fillText(d.text, bx + bw / 2, y - bh - 10); }
      });
    },
    // timeline with dots: marks [{label, at (0..1 along)}]
    timeline(ctx, x, y, w, marks, t, t0, o = {}) {
      drawOn(ctx, [[x, y], [x + w, y]], prog(t, t0, t0 + 1), 6);
      marks.forEach((m, i) => { const at = t0 + 0.6 + i * (o.stagger ?? 0.5); if (t < at) return; const k = E.back(clamp((t - at) / 0.3, 0, 1)); const mx = x + m.at * w; circle(ctx, mx, y, 14 * k); ctx.fillStyle = m.col || "#e63946"; ctx.fill(); stroke(ctx, 4); GFX.label(ctx, m.label, mx, y + (i % 2 ? 60 : -60), t, at, 1e9, { size: o.size || 34 }); });
    },
    // ring progress 0..1
    ring(ctx, x, y, r, k, col = "#e63946") { circle(ctx, x, y, r); stroke(ctx, r * 0.18, "rgba(0,0,0,0.1)"); ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); stroke(ctx, r * 0.18, col); },
    // simple icons: earth moon sun clock heart coin atom bulb skull question
    icon(ctx, kind, x, y, s = 1, o = {}) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      switch (kind) {
        case "earth": earth(ctx, 0, 0, 60, o.rot || 0); break;
        case "moon": moon(ctx, 0, 0, 50); break;
        case "sun": sun(ctx, 0, 0, 50); break;
        case "clock": circle(ctx, 0, 0, 60); ctx.fillStyle = "#fff"; ctx.fill(); stroke(ctx, 6); { const a = (o.t || 0) * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * 40, -Math.cos(a) * 40); stroke(ctx, 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a / 12) * 26, -Math.cos(a / 12) * 26); stroke(ctx, 7); } break;
        case "heart": ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-90, -20, -40, -80, 0, -35); ctx.bezierCurveTo(40, -80, 90, -20, 0, 40); ctx.fillStyle = "#e63946"; ctx.fill(); stroke(ctx, 6); break;
        case "coin": circle(ctx, 0, 0, 50); ctx.fillStyle = "#ffd166"; ctx.fill(); stroke(ctx, 6); ctx.font = `900 56px ${FONTS.title}`; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", 0, 3); break;
        case "atom": for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 70, 24, (i * Math.PI) / 3 + (o.t || 0), 0, TAU); stroke(ctx, 5, "#4dabf7"); } circle(ctx, 0, 0, 12); ctx.fillStyle = "#e63946"; ctx.fill(); break;
        case "bulb": circle(ctx, 0, -10, 46); ctx.fillStyle = "#ffd166"; ctx.fill(); stroke(ctx, 6); ctx.fillStyle = "#adb5bd"; ctx.fillRect(-20, 34, 40, 26); ctx.strokeRect(-20, 34, 40, 26); break;
        case "skull": circle(ctx, 0, -10, 50); ctx.fillStyle = "#fff"; ctx.fill(); stroke(ctx, 6); ctx.fillStyle = INK; circle(ctx, -18, -14, 12); ctx.fill(); circle(ctx, 18, -14, 12); ctx.fill(); ctx.fillRect(-20, 30, 40, 18); break;
        case "question": ctx.font = `900 130px ${FONTS.title}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText("?", 0, 0); ctx.fillStyle = "#ffd166"; ctx.fillText("?", 0, 0); break;
      }
      ctx.restore();
    },
    // morph between a circle (k=0) and a rounded square (k=1)
    morph(ctx, x, y, size, k, col = "#4dabf7") { const r = lerp(size / 2, size * 0.12, k); ctx.beginPath(); ctx.roundRect(x - size / 2, y - size / 2, size, size, r); ctx.fillStyle = col; ctx.fill(); stroke(ctx, 6); },
    whiteboard,
  };

  // camera: centre (cx, cy) at zoom z, optional rotation (radians)
  function cam(ctx, cx, cy, z = 1, rot = 0) { ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-cx, -cy); }

  window.WORLD = { BG, PROP, FX, GFX, FONTS, cam, earth, moon, sun, planet, stars, circle, stroke, lg, rg, INK };
})();
