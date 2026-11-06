// rig.js — RIG: a 2.5D camera for 2D films. The set is split into depth layers; the camera dollies, pans, tilts and
// racks focus through them, so a flat drawing feels like a 3D space. It never stands still.
// Pure functions of t (the offscreen canvases are only a scratch cache, cleared every frame).
//
//   const cam = RIG.attend(t, a, b, targets, { mode: 'action'|'emotion'|'calm', seed });   // the camera decides where to look
//   RIG.render(ctx, t, layers, cam);                                                      // draws every layer with parallax + depth of field
//
// layers: [{ z, draw(c, t) }] — z = depth. 0.5 foreground (passes in front of the lens), 1 = the subject plane,
//         2–4 middle (houses, trees), 8+ far (mountains, skyline), Infinity = sky. Each layer draws in plain 1920×1080
//         coordinates, as if the camera were at rest; RIG moves it.
// cam:    { x, y (point looked at, subject-plane coords), zoom, rot, focus (z that is sharp), aperture (blur strength) }
(function () {
  const { W, H, clamp, lerp, E, noise1 } = F;
  const hash = (a, b, c) => (F.hash(a, b, c) + 1) / 2;   // 0..1
  const pool = [];
  function scratch(i) {
    if (!pool[i]) { const c = document.createElement("canvas"); c.width = W / 2; c.height = H / 2; pool[i] = c; }
    const c = pool[i], g = c.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); return [c, g];
  }

  // transform of a layer at depth z for camera cam (exposed so you can place things on screen, e.g. a caption on a face)
  function layerXform(z, cam) {
    const f = z === Infinity ? 0 : 1 / z;                  // parallax factor: near layers move more
    const zl = Math.max(0.05, 1 + (cam.zoom - 1) * f * (cam.dolly ?? 1)); // dolly: near layers grow faster than far ones
    return { f, zl, ox: (cam.x - W / 2) * f, oy: (cam.y - H / 2) * f, rot: (cam.rot || 0) * Math.min(1, 0.4 + f) };
  }
  function apply(g, z, cam, scale = 1) {
    const L = layerXform(z, cam);
    g.scale(scale, scale); g.translate(W / 2, H / 2); g.rotate(L.rot); g.scale(L.zl, L.zl); g.translate(-W / 2 - L.ox, -H / 2 - L.oy);
  }
  // screen position of a point (x, y) living on layer z
  function toScreen(x, y, z, cam) {
    const L = layerXform(z, cam), c = Math.cos(L.rot), s = Math.sin(L.rot);
    const px = (x - W / 2 + 0 - L.ox) * L.zl, py = (y - H / 2 - L.oy) * L.zl;
    return [W / 2 + px * c - py * s, H / 2 + px * s + py * c];
  }
  function blurFor(z, cam) {
    const ap = cam.aperture ?? 7, fz = cam.focus ?? 1;
    if (ap <= 0) return 0;
    const d = z === Infinity ? 3 : Math.abs(Math.log2(z / fz));
    return Math.min(cam.maxBlur ?? 18, ap * d);
  }

  function render(ctx, t, layers, cam) {
    const list = layers.slice().sort((a, b) => b.z - a.z);
    let k = 0;
    for (const L of list) {
      const b = L.sharp ? 0 : blurFor(L.z, cam);
      if (b < 0.7) { ctx.save(); apply(ctx, L.z, cam); L.draw(ctx, t); ctx.restore(); continue; }
      const [c, g] = scratch(k++ % 3);
      g.save(); apply(g, L.z, cam, 0.5); L.draw(g, t); g.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${b.toFixed(1)}px)`; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
    }
  }

  // ---- keyed camera: [[t, {x, y, zoom, rot, focus, aperture}, ease?], …] → cam at t (missing fields carry over)
  function path(t, keys) {
    const full = []; let prev = { x: W / 2, y: H / 2, zoom: 1, rot: 0, focus: 1, aperture: 7 };
    for (const k of keys) { prev = Object.assign({}, prev, k[1]); full.push([k[0], prev, k[2]]); }
    if (t <= full[0][0]) return Object.assign({}, full[0][1]);
    for (let i = 0; i < full.length - 1; i++) {
      const [ta, A] = full[i], [tb, B, ez] = full[i + 1];
      if (t <= tb) { const u = (ez || E.io3)(clamp((t - ta) / (tb - ta), 0, 1)); const o = {}; for (const f in B) o[f] = typeof B[f] === "number" ? lerp(A[f], B[f], u) : B[f]; return o; }
    }
    return Object.assign({}, full[full.length - 1][1]);
  }

  // ---- the attention camera. targets: [{ x, y, z (depth of the thing, for focus), zoom, hold? (relative weight) }]
  // mode 'action': hop to a new point every 0.5–0.9 s (fast ease, overshoot, handheld energy)
  // mode 'emotion': one long move (1.6–2.6 s per point), slow push-in, almost no shake — the contrast that makes it land
  // mode 'calm': 1–1.5 s per point, smooth drift
  const MODES = {
    action: { min: 0.5, max: 0.9, move: 0.28, ease: E.out3, shake: 7, creep: 0.05, drift: 26 },
    calm: { min: 1.0, max: 1.5, move: 0.6, ease: E.io3, shake: 2.5, creep: 0.04, drift: 30 },
    emotion: { min: 1.6, max: 2.6, move: 1.1, ease: E.io3, shake: 0.8, creep: 0.09, drift: 14 },
  };
  function plan(a, b, targets, o = {}) {
    const M = Object.assign({}, MODES[o.mode || "action"], o.tune || {}), seed = o.seed ?? 1;
    const hops = []; let tt = a, i = 0, last = -1;
    while (tt < b - 0.05) {
      const r = hash(seed, i, 3);
      let idx = o.order ? o.order[i % o.order.length] : Math.floor(hash(seed, i, 9) * targets.length);
      if (!o.order && targets.length > 1 && idx === last) idx = (idx + 1) % targets.length;
      const T = targets[idx];
      const dur = lerp(M.min, M.max, r) * (T.hold || 1);
      hops.push({ t: tt, dur, T, i }); last = idx; tt += dur; i++;
    }
    return { hops, M, seed };
  }
  function attend(t, a, b, targets, o = {}) {
    const P = plan(a, b, targets, o), { hops, M, seed } = P;
    let h = hops.length - 1; for (let j = 0; j < hops.length; j++) if (t < hops[j].t + hops[j].dur) { h = j; break; }
    const cur = hops[h], prev = hops[h - 1] || cur;
    const view = (hop, lt) => {             // where the camera sits inside a hop: target + slow drift + zoom creep
      const T = hop.T, dx = (hash(seed, hop.i, 5) - 0.5) * 2 * M.drift, dy = (hash(seed, hop.i, 6) - 0.5) * M.drift;
      const u = clamp(lt / hop.dur, 0, 1);
      return { x: T.x + dx * (u - 0.5), y: T.y + dy * (u - 0.5), zoom: (T.zoom || 1.4) * (1 + M.creep * u), focus: T.z ?? 1, rot: (T.rot || 0) + (hash(seed, hop.i, 8) - 0.5) * 0.03 };
    };
    const lt = t - cur.t, A = view(prev, prev.dur), B = view(cur, lt);
    const k = h === 0 && !o.from ? 1 : M.ease(clamp(lt / M.move, 0, 1));
    const from = h === 0 && o.from ? o.from : A;
    const fk = E.io2(clamp(lt / Math.min(0.35, M.move + 0.1), 0, 1));   // focus pulls a little behind the move: a rack
    const [hx, hy] = [noise1(t * 1.3, seed) * M.shake, noise1(t * 1.1, seed + 11) * M.shake];
    return {
      x: lerp(from.x, B.x, k) + hx, y: lerp(from.y, B.y, k) + hy, zoom: lerp(from.zoom, B.zoom, k), rot: lerp(from.rot, B.rot, k),
      focus: Math.exp(lerp(Math.log(from.focus), Math.log(B.focus), fk)), aperture: o.aperture ?? 7, hop: cur.i, hopT: lt,
    };
  }
  // list of hop times inside [a, b] (for whooshes in the mix: FILM.events())
  function hopTimes(a, b, targets, o = {}) { return plan(a, b, targets, o).hops.map((h) => +h.t.toFixed(3)); }

  // blend two cameras (a cut that glides instead of jumping)
  function blend(c1, c2, k) { const o = {}; for (const f in c1) o[f] = typeof c1[f] === "number" && typeof c2[f] === "number" ? lerp(c1[f], c2[f], k) : (k < 0.5 ? c1[f] : c2[f]); return o; }

  // contact shadow under feet / objects: grounds characters in the set
  function shadow(ctx, x, y, w, a = 0.35, col = "0,0,0") {
    const g = ctx.createRadialGradient(x, y, 0, x, y, w); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.22); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // lens finish: vignette, grain, light leak, slight chromatic edge. Call last (screen space).
  function lens(ctx, t, o = {}) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.vignette ?? 0.45) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${o.vignette ?? 0.45})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (o.leak) { const lx = W * (0.15 + 0.1 * Math.sin(t * 0.4)); const g = ctx.createRadialGradient(lx, 0, 0, lx, 0, W * 0.6); g.addColorStop(0, o.leak); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; }
    if (o.grain ?? 0.03) { const fr = Math.floor(t * 24); ctx.globalAlpha = o.grain ?? 0.03; for (let i = 0; i < 900; i++) { const x = hash(fr, i, 1) * W, y = hash(fr, i, 2) * H; ctx.fillStyle = hash(fr, i, 3) > 0.5 ? "#fff" : "#000"; ctx.fillRect(x, y, 2, 2); } }
    ctx.restore();
  }
  // a quick directional streak when the camera hops fast (fake motion blur between two points)
  function streak(ctx, t, hopT, dir = 1, k = 1) {
    const u = 1 - clamp(hopT / 0.18, 0, 1); if (u <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.18 * u * k; ctx.fillStyle = "#fff";
    for (let i = 0; i < 26; i++) { const y = hash(Math.floor(t * 30), i, 4) * H; ctx.fillRect(0, y, W, 1 + hash(i, 2, 2) * 3); }
    ctx.restore();
  }

  window.RIG = { render, path, attend, plan, hopTimes, blend, toScreen, layerXform, apply, blurFor, shadow, lens, streak, MODES };
})();
