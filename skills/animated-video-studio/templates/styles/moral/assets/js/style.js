// style.js — MORAL SHORT FILM on the bean engine: a soft round character, a personified temptation (a dark
// shadow with a neon outline and a grin), counters on screen that keep score of the bad habit, handwritten whispers,
// rain, bus stops, cafés, split screens for "two paths". Uses C (characters), Pr (props), X (captions, HUD), KIT.
(function () {
  const { W, H, PAL, G, clamp, lerp, E, prog, noise1, mulberry } = F;
  const TAU = Math.PI * 2;

  // the temptation: Pride's body recoloured (col = its neon), no crown by default.
  // o: everything drawPride takes (alpha, s, grin, look, lean, angry, reach, dissolve) + col, crown
  function tempter(ctx, x, y, o = {}) {
    const keep = [PAL.amber, PAL.amberHot];
    PAL.amber = o.col || "#ff4fa3"; PAL.amberHot = o.hot || "#ff8cc6";
    C.drawPride(ctx, x, y, Object.assign({ crown: false }, o));
    PAL.amber = keep[0]; PAL.amberHot = keep[1];
  }
  // rain streaks over the whole frame (call after the set)
  function rain(ctx, t, o = {}) {
    const r = mulberry(o.seed || 3), n = o.n || 160, sp = o.speed || 1400, len = o.len || 34;
    ctx.save(); ctx.strokeStyle = o.col || "rgba(190,205,230,0.35)"; ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) { const x0 = r() * (W + 200) - 100, ph = r(); const y = ((ph * (H + 200) + t * sp) % (H + 200)) - 100; const x = x0 - (y / H) * 60;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + len); ctx.stroke(); }
    ctx.restore();
  }
  // a bus stop at night: shelter, bench, a street light; rain optional (front layer = glass + bench front)
  function busStop(ctx, o = {}) {
    ctx.fillStyle = "#15161c"; ctx.fillRect(-W, -H, W * 3, H * 3);
    const r = mulberry(5); ctx.fillStyle = "#1d1f27";
    for (let x = -40; x < W + 40; x += 140 + r() * 80) { const h = 300 + r() * 380; ctx.fillRect(x, 720 - h, 120 + r() * 60, h); for (let i = 0; i < 8; i++) if (r() > 0.6) { ctx.fillStyle = "rgba(255,210,140,0.35)"; ctx.fillRect(x + 12 + r() * 90, 720 - h + 20 + r() * (h - 40), 12, 16); ctx.fillStyle = "#1d1f27"; } }
    ctx.fillStyle = "#24262f"; ctx.fillRect(-W, 720, W * 3, 400); ctx.fillStyle = "#2c2f39"; ctx.fillRect(-W, 820, W * 3, 20);
    // shelter
    ctx.fillStyle = "rgba(120,135,160,0.18)"; ctx.fillRect(560, 330, 800, 420); ctx.strokeStyle = "#555b6b"; ctx.lineWidth = 8; ctx.strokeRect(560, 330, 800, 420);
    ctx.fillStyle = "#3a3e4c"; ctx.fillRect(540, 300, 840, 36);
    ctx.fillStyle = `rgba(230,235,255,${0.55 + 0.1 * Math.sin((G.t || 0) * 3)})`; ctx.fillRect(700, 344, 520, 10);
    ctx.fillStyle = "#3a3e4c"; ctx.fillRect(640, 690, 640, 16); ctx.fillRect(660, 706, 14, 60); ctx.fillRect(1250, 706, 14, 60);
    // street light cone
    if (o.lamp !== false) { ctx.fillStyle = "#2b2d36"; ctx.fillRect(1540, 160, 14, 600); const g = ctx.createRadialGradient(1547, 170, 0, 1547, 170, 520); g.addColorStop(0, "rgba(255,214,140,0.45)"); g.addColorStop(1, "rgba(255,214,140,0)"); ctx.fillStyle = g; ctx.fillRect(1000, 0, 1100, 900); }
  }
  // a warm café window: table, two cups, a hanging lamp (for the "real life" side of the story)
  function cafe(ctx, o = {}) {
    ctx.fillStyle = "#2a1d17"; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.fillStyle = "#3a2a20"; ctx.fillRect(-W, 760, W * 3, 400);
    const g = ctx.createRadialGradient(960, 260, 0, 960, 260, 700); g.addColorStop(0, "rgba(255,200,120,0.55)"); g.addColorStop(1, "rgba(255,200,120,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1a120e"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(960, 0); ctx.lineTo(960, 200); ctx.stroke();
    ctx.fillStyle = "#ffcf7a"; ctx.beginPath(); ctx.moveTo(900, 250); ctx.lineTo(1020, 250); ctx.lineTo(990, 200); ctx.lineTo(930, 200); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#5a3d2b"; ctx.fillRect(700, 700, 520, 24); ctx.fillRect(940, 724, 40, 200);
    for (const cx of o.cups || [860, 1060]) { ctx.fillStyle = "#f2efe9"; ctx.fillRect(cx - 26, 660, 52, 40); ctx.strokeStyle = "#1a120e"; ctx.lineWidth = 3; ctx.strokeRect(cx - 26, 660, 52, 40); if (o.steam !== false) Pr.steam(ctx, cx, 650, 0.6, 2, 70); }
    if (o.rain) rain(ctx, G.t || 0, { n: 60, col: "rgba(255,220,180,0.15)" });
  }
  // an umbrella (open k 0..1) held at (x, y)
  function umbrella(ctx, x, y, s = 1, col = "#f4c430", k = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -230); ctx.stroke();
    const w = 40 + 170 * k; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w, -200 + 30 * (1 - k)); ctx.quadraticCurveTo(0, -330, w, -200 + 30 * (1 - k));
    for (let i = 3; i >= -3; i--) ctx.quadraticCurveTo(i * w / 3.5 + w / 7, -185, i * w / 3.5, -200 + 30 * (1 - k)); ctx.closePath(); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }
  // two paths side by side: draw left(ctx) and right(ctx) each in its own half, with labels; k slides the divider in
  function split(ctx, left, right, o = {}) {
    const k = o.k ?? 1, mid = W / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, mid, H); ctx.clip(); ctx.translate(-W / 4, 0); left(ctx); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(mid, 0, mid, H); ctx.clip(); ctx.translate(W / 4, 0); right(ctx); ctx.restore();
    ctx.fillStyle = "#000"; ctx.fillRect(mid - 4, (1 - k) * H, 8, H * k);
    ctx.font = "700 44px 'Comic Neue', Inter"; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
    if (o.labels) { ctx.fillText(o.labels[0], mid / 2, 90); ctx.fillText(o.labels[1], mid * 1.5, 90); }
    ctx.textAlign = "left";
  }
  window.MORAL = { tempter, rain, busStop, cafe, umbrella, split };
})();
