// kit.js — helpers shared by every bean-style film: typing simulation, phone close-ups, camera, shake, HUD keys.
(function () {
  const { W, H, BAR, PAL, G, clamp, lerp, E, prog, key, step, win, noise1, hash } = F;
  // ops: [t, 'type', text, cps] | [t, 'del', count|'all', cps] | [t, 'set', text]
  function typer(t, ops) {
    let text = "", pressed = "", last = -1;
    for (const op of ops) {
      const [t0, kind] = op;
      if (t < t0) break;
      if (kind === "set") { text = op[2]; continue; }
      if (kind === "type") {
        const s = op[2], cps = op[3] || 9;
        // slightly uneven rhythm
        let tt = t0, n = 0;
        for (let i = 0; i < s.length; i++) {
          const dt = (1 / cps) * (0.7 + 0.6 * (hash(i, Math.floor(t0 * 10), 3) + 1) / 2);
          if (t >= tt) { n = i + 1; last = tt; } else break;
          tt += dt;
        }
        text += s.slice(0, n);
        if (n > 0 && t - last < 0.09) pressed = s[n - 1].toLowerCase();
      }
      if (kind === "del") {
        const cps = op[3] || 18;
        const total = op[2] === "all" ? text.length : op[2];
        const n = Math.min(total, Math.floor((t - t0) * cps) + 1);
        text = text.slice(0, Math.max(0, text.length - n));
        if (n < total || t - t0 - total / cps < 0.1) pressed = "⌫";
      }
    }
    return { text, pressed };
  }
  const KB = (() => {
    // key centers in phone space (must mirror Pr.phone keyboard layout)
    const PH = 1080, kbH = 330, ky = PH / 2 - kbH;
    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    const m = {};
    rows.forEach((r, ri) => {
      const rw = r.length * 54 - 8;
      [...r].forEach((ch, i) => (m[ch] = [-rw / 2 + i * 54 + 23, ky + 24 + ri * 70 + 29]));
    });
    m[" "] = [0, ky + 24 + 3 * 70 + 29];
    m["⌫"] = [232, ky + 24 + 2 * 70 + 29];
    m["send"] = [224, PH / 2 - kbH - 68];
    return m;
  })();
  function thumbFor(t, ty, rest) {
    const p = ty.pressed;
    if (p && KB[p]) return { x: KB[p][0], y: KB[p][1] + 6, press: 1 };
    if (p && /[^a-z]/.test(p)) return { x: KB[" "][0] + 40, y: KB[" "][1], press: 1 };
    return rest || { x: 150 + noise1(t * 0.8, 3) * 20, y: 300 + noise1(t * 0.7, 4) * 14, press: 0 };
  }

  // ---------- camera helper
  function cam(ctx, cx, cy, z, rot = 0) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.rotate(rot);
    ctx.translate(-cx, -cy);
  }
  function shake(t, a, b, amp) {
    const k = win(t, a, b, 0, b - a);
    return [noise1(t * 40, 1) * amp * k, noise1(t * 40, 2) * amp * k];
  }

  // generic phone close-up shot
  function phoneShot(ctx, t, o) {
    // dim room behind, blurred bokeh
    ctx.fillStyle = "#0b0c10"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(o.px ?? 1100, 560, 50, o.px ?? 1100, 560, 900);
    g.addColorStop(0, "#1a1d27"); g.addColorStop(1, "#08090c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 230 + noise1(t * 0.1, i) * 30, y = 300 + (i % 3) * 170;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 60 + (i % 3) * 20);
      rg.addColorStop(0, i % 2 ? "rgba(255,190,120,0.18)" : "rgba(130,160,220,0.14)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.fillRect(x - 100, y - 100, 200, 200);
    }
    ctx.restore();
    const px = o.px ?? 1060, py = o.py ?? 560, sc = o.sc ?? 1.0, rot = o.rot ?? -0.05;
    const dz = o.push ? o.push(t) : 0;
    ctx.save();
    ctx.translate(px, py); ctx.scale(1 + dz, 1 + dz); ctx.translate(-px, -py);
    const dr = noise1(t * 0.35, 9) * 0.008;
    if (o.hand !== false) Pr.phoneHand(ctx, px, py, sc, rot + dr, o.thumb, "back");
    Pr.phone(ctx, px, py, sc, rot + dr, o.st);
    if (o.hand !== false) Pr.phoneHand(ctx, px, py, sc, rot + dr, o.thumb, "front");
    ctx.restore();
  }

  // ---------- HUD timeline (label, drafts, sent)

  // HUD from keyframes: [time, label, a, b, visible]; numbers roll when they change under the same label
  function hudFrom(t, K, o = {}) {
    if (t < K[0][0]) return null;
    let cur = K[0], prev = null;
    for (const k of K) if (t >= k[0]) { prev = cur; cur = k; }
    const since = t - cur[0];
    let a = cur[2], fD = 0, fS = 0;
    if (prev && prev[2] !== cur[2] && since < 1.2 && prev[4] && cur[4]) {
      a = Math.round(lerp(prev[2], cur[2], E.out3(clamp(since / 0.9, 0, 1))));
      fD = Math.max(0, 1 - since / 0.5);
    }
    if (prev && prev[3] !== cur[3] && since < 1.4) fS = Math.max(0, 1 - since / 1.2);
    let alpha = cur[4];
    if (prev && prev[4] !== cur[4]) alpha = cur[4] ? clamp(since / 0.4, 0, 1) : 1 - clamp(since / 0.3, 0, 1);
    return Object.assign({ label: cur[1], drafts: Number(a).toLocaleString("en-US"), sent: cur[3], fD, fS, alpha }, o,
      { sCol: cur[3] > 0 ? (o.accent || PAL.amberHot) : "#f1f1f1" });
  }

  window.KIT = { typer, KB, thumbFor, cam, shake, phoneShot, hudFrom };
})();
