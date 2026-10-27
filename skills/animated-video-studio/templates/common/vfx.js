// vfx.js — effects for every style: auras, beams, explosions, smoke, sparks, ambient particles, and "looks"
// (glow, neon, ghost, hologram, ice, poison, energy, teleport, impact, hit flash) applied to anything you draw.
// The catalogue follows the effect presets of StykAnimate (github.com/Dukensn/StykAnimate-App, GPL-3) — this file is an
// independent, much smaller Canvas 2D implementation, written for this skill. Everything is a pure function of time:
// particles come from a seeded hash, never Math.random, so frames can render in any order.
(function () {
  const { W, H, clamp, lerp, E, mulberry } = F;
  const TAU = Math.PI * 2;
  const hash = (i, k, seed = 1) => { let h = (i * 374761393 + k * 668265263 + seed * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rgba = (c, a) => { if (c.startsWith("rgba")) return c; const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  function soft(ctx, x, y, r, col, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

  // ---------- emitters: a particle i is born at (i / rate) and lives `life` seconds
  function emit(t, rate, life, fn, seed = 1, t0 = 0, t1 = 1e9) {
    const first = Math.max(0, Math.floor((t - life - t0) * rate)), last = Math.floor((Math.min(t, t1) - t0) * rate);
    for (let i = first; i <= last; i++) { const born = t0 + i / rate, age = t - born; if (age < 0 || age > life) continue; fn(i, age / life, age, (k) => hash(i, k, seed)); }
  }

  // ---------- auras around a figure (feet at x, y; h = figure height). kind: fire electric shadow holy energy
  function aura(ctx, x, y, h, t, o = {}) {
    const kind = o.kind || "energy", k = o.k ?? 1, col = o.col || { fire: "#ff7a1a", electric: "#7fd8ff", shadow: "#6a2bd9", holy: "#ffe9a8", energy: "#5bc0ff" }[kind];
    if (k <= 0) return; ctx.save(); ctx.globalAlpha *= k; ctx.globalCompositeOperation = kind === "shadow" ? "source-over" : "lighter";
    soft(ctx, x, y - h * 0.5, h * 0.75, col, kind === "shadow" ? 0.35 : 0.22);
    if (kind === "holy") { ctx.save(); ctx.globalAlpha *= 0.35; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.12; ctx.fillStyle = rgba(col, 0.5); ctx.beginPath(); ctx.moveTo(x, y - h * 1.6); ctx.lineTo(x + Math.cos(a - 0.03) * h * 2.5, y - h * 1.6 - Math.sin(a) * -h * 2.5); ctx.lineTo(x + Math.cos(a + 0.03) * h * 2.5, y - h * 1.6 - Math.sin(a) * -h * 2.5); ctx.fill(); } ctx.restore();
      ctx.lineWidth = h * 0.02; ctx.strokeStyle = rgba(col, 0.9); ctx.beginPath(); ctx.ellipse(x, y - h * 1.08, h * 0.18, h * 0.05, 0, 0, TAU); ctx.stroke(); }
    emit(t, kind === "electric" ? 18 : 34, kind === "shadow" ? 1.4 : 0.8, (i, p, age, r) => {
      const sx = x + (r(1) - 0.5) * h * 0.5, sy = y - r(2) * h * 0.9;
      if (kind === "electric") { if (p > 0.25) return; ctx.strokeStyle = rgba(r(5) > 0.5 ? "#ffffff" : col, 0.9); ctx.lineWidth = 2 + r(6) * 3; ctx.beginPath(); let px = sx, py = sy; ctx.moveTo(px, py);
        for (let s = 0; s < 5; s++) { px += (r(10 + s) - 0.5) * h * 0.22; py += (r(20 + s) - 0.5) * h * 0.22; ctx.lineTo(px, py); } ctx.stroke(); return; }
      const rise = (kind === "shadow" ? 0.5 : 1) * h * 0.55 * p, wob = Math.sin(age * 6 + r(3) * 9) * h * 0.04;
      const rr = h * (kind === "fire" ? 0.11 : 0.08) * (1 - p * 0.7) * (0.6 + r(4));
      soft(ctx, sx + wob, sy - rise, rr * 2, kind === "fire" && p < 0.3 ? "#fff1a8" : col, (1 - p) * (kind === "shadow" ? 0.55 : 0.7));
    }, o.seed || 3);
    ctx.restore();
  }

  // ---------- beam from (x0,y0) to (x1,y1): grows over `grow` s from time a, holds, fades by a + dur
  function beam(ctx, x0, y0, x1, y1, t, a, o = {}) {
    const dur = o.dur || 1.2, grow = o.grow || 0.2, dt = t - a; if (dt < 0 || dt > dur) return;
    const k = E.out3(clamp(dt / grow, 0, 1)), fade = clamp((dur - dt) / 0.25, 0, 1), w = (o.width || 40) * fade * (1 + 0.12 * Math.sin(dt * 60));
    const ex = lerp(x0, x1, k), ey = lerp(y0, y1, k), col = o.col || "#5bc0ff";
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (const [ww, c, al] of [[w * 3, col, 0.18], [w * 1.6, col, 0.45], [w, col, 0.85], [w * 0.4, "#ffffff", 1]]) { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = ww; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke(); }
    soft(ctx, x0, y0, w * 2.5, col, 0.8 * fade); soft(ctx, ex, ey, w * 3, "#ffffff", 0.7 * fade);
    ctx.restore();
  }

  // ---------- explosion at (x, y) at time a: flash, fireball, shock ring, debris, then smoke
  function explosion(ctx, x, y, t, a, o = {}) {
    const dt = t - a, size = o.size || 220, col = o.col || "#ff7a1a"; if (dt < 0 || dt > 3) return;
    ctx.save();
    if (dt < 0.12) soft(ctx, x, y, size * 3, "#ffffff", 1 - dt / 0.12);
    ctx.globalCompositeOperation = "lighter";
    const fk = clamp(dt / 0.6, 0, 1); for (let i = 0; i < 14; i++) { const ang = hash(i, 1, 7) * TAU, d = size * E.out3(fk) * (0.3 + hash(i, 2, 7) * 0.7);
      soft(ctx, x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.8, size * (0.55 - fk * 0.4), i % 3 ? col : "#ffd36a", (1 - fk) * 0.9); }
    if (dt < 0.6) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - dt / 0.6)})`; ctx.lineWidth = 10 * (1 - dt / 0.6) + 2; ctx.beginPath(); ctx.ellipse(x, y, size * 2.2 * E.out3(dt / 0.6), size * 1.3 * E.out3(dt / 0.6), 0, 0, TAU); ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 16; i++) { if (dt > 1.2) break; const ang = -Math.PI * hash(i, 3, 9), v = size * (2 + hash(i, 4, 9) * 3);
      const px = x + Math.cos(ang) * v * dt, py = y + Math.sin(ang) * v * dt + 900 * dt * dt; ctx.fillStyle = o.debris || "#3a2a20"; ctx.fillRect(px - 5, py - 5, 10, 10); }
    if (dt > 0.3) smokePuffs(ctx, x, y, dt - 0.3, size, o.smoke || "#4a4040");
    ctx.restore();
  }
  function smokePuffs(ctx, x, y, dt, size, col) {
    for (let i = 0; i < 9; i++) { const p = clamp(dt / 2.6, 0, 1), ang = hash(i, 5, 11) * TAU, d = size * 0.6 * (0.3 + hash(i, 6, 11));
      const px = x + Math.cos(ang) * d * (0.5 + p), py = y + Math.sin(ang) * d * 0.4 - size * 0.8 * p; soft(ctx, px, py, size * (0.45 + p * 0.6), col, 0.55 * (1 - p)); }
  }
  // ---------- continuous smoke column at (x, y) (chimneys, fires, smouldering ruins)
  function smoke(ctx, x, y, t, o = {}) {
    const size = o.size || 60, col = o.col || "#5b5555";
    emit(t, o.rate || 3, o.life || 4, (i, p, age, r) => { const px = x + Math.sin(age * 0.8 + r(1) * 6) * size * 0.6 * p + (o.wind || 0) * age * 40, py = y - p * (o.height || 500);
      soft(ctx, px, py, size * (0.6 + p * 1.6), col, 0.5 * (1 - p) * clamp(p * 6, 0, 1)); }, o.seed || 5);
  }
  // ---------- sparks bursting at time a (sword clash, metal hit, magic)
  function sparks(ctx, x, y, t, a, o = {}) {
    const dt = t - a; if (dt < 0 || dt > 0.8) return; const n = o.n || 22, col = o.col || "#ffd36a";
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (let i = 0; i < n; i++) { const ang = (o.dir ?? -Math.PI / 2) + (hash(i, 1, 3) - 0.5) * (o.spread ?? TAU), v = 500 + hash(i, 2, 3) * 900;
      const px = x + Math.cos(ang) * v * dt, py = y + Math.sin(ang) * v * dt + 700 * dt * dt, len = 0.03;
      ctx.strokeStyle = rgba(col, 1 - dt / 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(ang) * v * len, py - (Math.sin(ang) * v + 1400 * dt) * len); ctx.stroke(); }
    soft(ctx, x, y, 80 * (1 - dt / 0.8), "#ffffff", 0.8 * (1 - dt / 0.8));
    ctx.restore();
  }
  // ---------- ambient particles over the frame: embers snow dust magic bubbles leaves
  function particles(ctx, t, o = {}) {
    const kind = o.kind || "dust", area = o.area || [0, 0, W, H], n = o.n || 40;
    const cfg = { embers: ["#ffb35c", -60, 6, true], snow: ["#ffffff", 80, 7, false], dust: ["#fff3d6", -10, 3, false], magic: ["#c9a7ff", -40, 5, true], bubbles: ["#bfe8ff", -90, 12, false], leaves: ["#d9822b", 70, 10, false] }[kind];
    const [col, vy, rr, add] = cfg; ctx.save(); if (add) ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) { const r = (k) => hash(i, k, o.seed || 2), [ax, ay, aw, ah] = area;
      const px = ax + ((r(1) * aw + Math.sin(t * (0.5 + r(2)) + r(3) * 9) * 40) % aw + aw) % aw, py = ay + (((r(4) * ah + vy * t * (0.6 + r(5))) % ah) + ah) % ah;
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
      if (kind === "bubbles") { ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, rr * (0.5 + r(6)), 0, TAU); ctx.stroke(); }
      else if (kind === "leaves") { ctx.save(); ctx.translate(px, py); ctx.rotate(t * 2 + i); ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (add) soft(ctx, px, py, rr * 3, col, a); else { ctx.fillStyle = rgba(col, a * 0.8); ctx.beginPath(); ctx.arc(px, py, rr * (0.4 + r(6) * 0.6), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------- LOOKS: draw(fn) into a layer, then composite it with a look. fn(c) draws with the same transform.
  // name: glow neon ghost hologram ice poison energy teleport (o.k = 0..1 progress) impact hitFlash; o.col overrides the colour
  let L1 = null, L2 = null;
  function layers() { if (!L1) { L1 = document.createElement("canvas"); L2 = document.createElement("canvas"); } for (const c of [L1, L2]) if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } return [L1.getContext("2d"), L2.getContext("2d")]; }
  function look(ctx, name, fn, o = {}) {
    const [a, b] = layers(), m = ctx.getTransform();
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, H); a.setTransform(m); fn(a); a.setTransform(1, 0, 0, 1, 0, 0);
    const tint = (col, mix) => { b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.globalCompositeOperation = "source-over"; b.drawImage(L1, 0, 0); b.globalCompositeOperation = "source-atop"; b.globalAlpha = mix; b.fillStyle = col; b.fillRect(0, 0, W, H); b.globalAlpha = 1; b.globalCompositeOperation = "source-over"; return L2; };
    const glowWith = (img, col, r, n = 2) => { for (let i = 0; i < n; i++) { ctx.filter = `drop-shadow(0 0 ${r}px ${col})`; ctx.drawImage(img, 0, 0); } ctx.filter = "none"; };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const col = o.col;
    switch (name) {
      case "glow": glowWith(L1, col || "#5bc0ff", o.r || 18); ctx.drawImage(L1, 0, 0); break;
      case "neon": glowWith(L1, col || "#ff4fd8", o.r || 16, 3); break;
      case "energy": glowWith(tint(col || "#55ccff", 0.6), col || "#55ccff", o.r || 16); break;
      case "ghost": ctx.globalAlpha = o.alpha ?? 0.55; ctx.filter = "blur(2px)"; ctx.drawImage(tint(col || "#99bbff", 0.7), 0, 0); break;
      case "hologram": { const img = tint(col || "#31dfff", 0.8);   // scanlines cut into the layer only
        b.globalCompositeOperation = "destination-out"; b.fillStyle = "#000"; for (let y = ((o.t || 0) * 60) % 6; y < H; y += 6) b.fillRect(0, y, W, 2); b.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.9; glowWith(img, col || "#2dcfff", 8, 1); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.3; ctx.drawImage(img, 3, 0); break; }
      case "ice": glowWith(tint(col || "#8fd3ff", 0.65), "#e6fbff", 3, 2); ctx.drawImage(L2, 0, 0); break;
      case "poison": glowWith(tint(col || "#8bff22", 0.6), col || "#8bff22", 14); break;
      case "impact": { ctx.globalCompositeOperation = "lighter"; ctx.drawImage(tint("#ff2a50", 1), -(o.amount || 10), 0); ctx.drawImage(tint("#2affe0", 1), o.amount || 10, 0); ctx.globalCompositeOperation = "source-over"; ctx.drawImage(tint("#ffffff", 0.5), 0, 0); break; }
      case "hitFlash": ctx.drawImage(tint(col || "#ffffff", o.mix ?? 1), 0, 0); break;
      case "teleport": { const k = clamp(o.k ?? 0.5, 0, 1); // dissolve: square cells vanish by a seeded threshold, edge glows
        b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.drawImage(L1, 0, 0); b.globalCompositeOperation = "destination-out"; const cs = o.cell || 10;
        for (let y = 0; y < H; y += cs) for (let x = 0; x < W; x += cs) { const v = hash(x / cs, y / cs, 4) * 0.8 + (1 - y / H) * 0.2; if (v < k) b.fillRect(x, y, cs, cs); }
        b.globalCompositeOperation = "source-over"; glowWith(L2, col || "#49dcff", 10, 2); break; }
      default: ctx.drawImage(L1, 0, 0);
    }
    ctx.restore();
  }

  // ---------- whole-frame grades (call after the shot): goldenHour night retro dream
  function grade(ctx, name, k = 1) {
    if (k <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = k;
    if (name === "goldenHour") { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "#ffb060"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "screen"; soft(ctx, W * 0.8, H * 0.2, W * 0.7, "#ffcf8a", 0.35); }
    else if (name === "night") { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "#3a4a8a"; ctx.fillRect(0, 0, W, H); }
    else if (name === "retro") { ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "#c8a070"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; const r = mulberry(7); ctx.globalAlpha = 0.08 * k; for (let i = 0; i < 3000; i++) { ctx.fillStyle = r() > 0.5 ? "#fff" : "#000"; ctx.fillRect(r() * W, r() * H, 2, 2); } }
    else if (name === "dream") { ctx.globalCompositeOperation = "screen"; ctx.fillStyle = "rgba(200,170,255,0.25)"; ctx.fillRect(0, 0, W, H); soft(ctx, W / 2, H / 2, W * 0.6, "#ffffff", 0.2); }
    ctx.restore();
  }

  window.VFX = { aura, beam, explosion, smoke, sparks, particles, look, grade, emit, soft };
})();
