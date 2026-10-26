// Stickman engine: articulated figure, pose library, walk/run cycles, faces, looks and props.
// Angles are in degrees. A limb angle of 0 points straight down; positive rotates toward the
// direction the figure faces (90 = straight forward, 180 = straight up). Elbows bend forward
// (+), knees bend backward (+). Everything is a pure function of the pose you pass in.
(function () {
  const { clamp, lerp, E, noise1 } = F;
  const RAD = Math.PI / 180;
  const INK = "#151515";

  // proportions at scale 1 (figure ≈ 330 px tall)
  const B = { head: 34, neck: 12, torso: 104, upper: 58, fore: 54, thigh: 70, shin: 68, foot: 18, hand: 7, line: 9 };

  // ---------- poses: every field is optional; missing fields come from STAND
  const STAND = { x: 0, y: 0, torso: 0, head: 0, aF: 8, eF: 10, aB: -8, eB: 10, lF: 4, kF: 2, lB: -4, kB: 2 };
  const P = {
    stand: {},
    relaxed: { aF: 4, eF: 6, aB: -4, eB: 6, head: 3 },
    hipsHands: { aF: 30, eF: 110, aB: -30, eB: -110 },
    think: { aF: 40, eF: 125, head: -12, torso: 3, aB: -6 },          // hand on chin
    point: { aF: 92, eF: 0, aB: -6, torso: 3 },                        // arm straight forward
    pointUp: { aF: 160, eF: 5, aB: -6, head: -10 },
    wave: { aF: 150, eF: 25, aB: -8 },
    cheer: { aF: 165, eF: 8, aB: -165, eB: -8, head: -10, y: 4 },
    shrug: { aF: 35, eF: 95, aB: -35, eB: -95, head: 6 },
    facepalm: { aF: 55, eF: 120, head: 18, torso: 8 },
    scared: { aF: 70, eF: 95, aB: 40, eB: 100, torso: -10, head: -6, lF: 14, kF: 10, lB: -14, kB: 10, y: -8 },
    sad: { torso: 12, head: 22, aF: 2, eF: 4, aB: -2, eB: 4 },
    tired: { torso: 18, head: 25, aF: 2, aB: 2, kF: 8, kB: 8, y: -4 },
    sit: { lF: 88, kF: 88, lB: 82, kB: 84, aF: 30, eF: 40, aB: -5, eB: 30, y: -66 },      // on a seat at hip height
    sitGround: { lF: 80, kF: 120, lB: 70, kB: 125, aF: 20, eF: 40, aB: -30, eB: 0, torso: -5, y: -118 },
    crouch: { torso: 25, lF: 70, kF: 120, lB: 20, kB: 120, aF: 40, eF: 30, aB: -10, eB: 30, y: -60 },
    kneel: { torso: 5, lF: 85, kF: 85, lB: -10, kB: 100, aF: 20, eF: 20, aB: -10, y: -64 },
    carry: { aF: 75, eF: 70, aB: 70, eB: 75, torso: -4 },             // holding something in front
    lift: { aF: 170, eF: 10, aB: 170, eB: 10, lF: 18, kF: 6, lB: -18, kB: 6, torso: -3 },
    // fighting
    guard: { torso: 8, aF: 60, eF: 110, aB: 30, eB: 120, lF: 22, kF: 18, lB: -24, kB: 10, y: -8 },
    punch: { torso: 14, aF: 92, eF: 0, aB: 25, eB: 125, lF: 30, kF: 10, lB: -30, kB: 6, y: -6 },
    kick: { torso: -22, aF: 50, eF: 60, aB: -40, eB: 40, lF: 95, kF: 0, lB: -8, kB: 4, y: 0 },
    block: { torso: -6, aF: 120, eF: 100, aB: 100, eB: 110, lF: 18, kF: 14, lB: -24, kB: 10, y: -6 },
    hit: { torso: -28, head: -25, aF: 120, eF: 30, aB: -130, eB: 20, lF: 25, kF: 10, lB: -10, kB: 30 },
    fall: { torso: -70, head: -20, aF: 150, eF: 20, aB: -150, eB: 20, lF: 60, kF: 20, lB: 30, kB: 30, y: -60 },
    lie: { torso: -90, head: -5, aF: 170, eF: 5, aB: -170, eB: 5, lF: 90, kF: 0, lB: 88, kB: 0, y: -125 },
    jumpPrep: { torso: 25, lF: 55, kF: 95, lB: 35, kB: 95, aF: -35, eF: 10, aB: -50, eB: 10, y: -40 },
    jumpAir: { torso: -5, lF: 45, kF: 70, lB: -10, kB: 60, aF: 165, eF: 10, aB: 150, eB: 10, air: true },
    land: { torso: 20, lF: 50, kF: 85, lB: 20, kB: 85, aF: 60, eF: 20, aB: -40, eB: 20, y: -36 },
  };
  for (const k in P) P[k] = Object.assign({}, STAND, P[k]);

  function mixPose(a, b, k) {
    const o = {};
    for (const n in STAND) o[n] = lerp(a[n] ?? STAND[n], b[n] ?? STAND[n], k);
    o.air = k < 0.5 ? a.air : b.air;
    return o;
  }
  // keyed poses: [[t, pose|name, ease?], ...] -> pose at time t
  function posesAt(t, keys) {
    const get = (p) => (typeof p === "string" ? P[p] : Object.assign({}, STAND, p));
    if (t <= keys[0][0]) return get(keys[0][1]);
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        const [t0, p0] = keys[i - 1], [t1, p1, e] = keys[i];
        return mixPose(get(p0), get(p1), (e || E.io2)((t - t0) / (t1 - t0)));
      }
    }
    return get(keys[keys.length - 1][1]);
  }
  // add small offsets to a pose: tweak(P.point, {aF: 100})
  const tweak = (p, d) => Object.assign({}, typeof p === "string" ? P[p] : p, d);

  // ---------- cycles (phase in cycles; 1 cycle = 2 steps)
  function walk(phase, o = {}) {
    const a = Math.sin(phase * Math.PI * 2), c = Math.cos(phase * Math.PI * 2);
    const st = o.stride ?? 1;
    return Object.assign({}, STAND, {
      torso: 4 * st, head: -2,
      lF: 26 * a * st, kF: Math.max(0, 34 * c) * st + 4, lB: -26 * a * st, kB: Math.max(0, -34 * c) * st + 4,
      aF: -22 * a * st, eF: 14, aB: 22 * a * st, eB: 14,
      y: -Math.abs(Math.sin(phase * Math.PI * 2)) * 6 * st,
    });
  }
  function run(phase, o = {}) {
    const a = Math.sin(phase * Math.PI * 2), c = Math.cos(phase * Math.PI * 2);
    const st = o.stride ?? 1;
    return Object.assign({}, STAND, {
      torso: 16, head: -8,
      lF: 50 * a * st + 10, kF: (45 + 45 * -c) * st, lB: -50 * a * st + 10, kB: (45 + 45 * c) * st,
      aF: -55 * a, eF: 95, aB: 55 * a, eB: 95,
      y: -10 + Math.abs(Math.sin(phase * Math.PI * 2)) * 14, air: false,
    });
  }
  // breathing / idle sway on top of any pose
  function idle(p, t, seed = 1, amt = 1) {
    return Object.assign({}, p, {
      torso: p.torso + noise1(t * 0.6, seed) * 1.5 * amt,
      head: p.head + noise1(t * 0.5, seed + 9) * 3 * amt,
      aF: p.aF + noise1(t * 0.7, seed + 3) * 2 * amt,
      aB: p.aB + noise1(t * 0.7, seed + 5) * 2 * amt,
    });
  }

  // ---------- skeleton
  const dirv = (deg, dir) => [Math.sin(deg * RAD) * dir, Math.cos(deg * RAD)];
  function skeleton(x, y, s, pose, dir) {
    const p = pose;
    const hipH = (B.thigh + B.shin) * s;
    const hip = [x + p.x * s * dir, y - hipH - p.y * s];
    const leg = (a, k) => {
      const v1 = dirv(a, dir), knee = [hip[0] + v1[0] * B.thigh * s, hip[1] + v1[1] * B.thigh * s];
      const v2 = dirv(a - k, dir), ankle = [knee[0] + v2[0] * B.shin * s, knee[1] + v2[1] * B.shin * s];
      return { knee, ankle, footA: a - k };
    };
    let LF = leg(p.lF, p.kF), LB = leg(p.lB, p.kB);
    // ground the lowest foot unless airborne
    const tv = dirv(180 - p.torso, dir); // up the spine; + torso leans forward
    const neck = [hip[0] + tv[0] * B.torso * s, hip[1] + tv[1] * B.torso * s];
    const hv = dirv(180 - p.torso - p.head, dir);
    const head = [neck[0] + hv[0] * (B.neck + B.head) * s, neck[1] + hv[1] * (B.neck + B.head) * s];
    const shoulder = [hip[0] + tv[0] * (B.torso - 8) * s, hip[1] + tv[1] * (B.torso - 8) * s];
    const arm = (a, e) => {
      const v1 = dirv(a - p.torso, dir), elbow = [shoulder[0] + v1[0] * B.upper * s, shoulder[1] + v1[1] * B.upper * s];
      const v2 = dirv(a - p.torso + e, dir), hand = [elbow[0] + v2[0] * B.fore * s, elbow[1] + v2[1] * B.fore * s];
      return { elbow, hand, handA: a - p.torso + e };
    };
    const K = { hip, neck, head, headA: p.torso + p.head, shoulder, AF: arm(p.aF, p.eF), AB: arm(p.aB, p.eB), LF, LB, s, dir };
    // ground the lowest point (feet, knees, hands, head) unless airborne
    if (!p.air) {
      const low = Math.max(LF.ankle[1], LB.ankle[1], LF.knee[1], LB.knee[1], K.AF.hand[1], K.AB.hand[1], head[1] + B.head * s, hip[1]);
      const dy = y - low;
      for (const q of [hip, neck, head, shoulder, LF.knee, LF.ankle, LB.knee, LB.ankle, K.AF.elbow, K.AF.hand, K.AB.elbow, K.AB.hand]) q[1] += dy;
    }
    return K;
  }

  // ---------- drawing primitives
  function line(ctx, pts, w, col = INK) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  }
  function dot(ctx, x, y, r, col = INK) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }

  // ---------- face. e: {mood, look:[x,y] (-1..1), blink 0..1}
  // moods: neutral happy laugh sad cry angry scared surprised confused determined tired worried smirk
  function face(ctx, cx, cy, r, e, dir, profile, ink) {
    const mood = e.mood || "neutral";
    const look = e.look || [0, 0];
    const off = profile * 0.42 * r * dir;               // features slide toward the facing side
    const sep = r * (0.36 - profile * 0.12);
    const ex = cx + off + look[0] * r * 0.08, ey = cy - r * 0.08 + look[1] * r * 0.06;
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const lw = Math.max(2, r * 0.1);
    const blink = e.blink || 0;
    const eyes = (fn) => { for (const sd of [-1, 1]) fn(ex + sd * sep * 0.5, ey, sd); };
    const big = mood === "scared" || mood === "surprised";
    // eyes
    if (mood === "laugh" || (mood === "happy" && e.closed)) {
      eyes((x, y) => { ctx.beginPath(); ctx.arc(x, y + r * 0.04, r * 0.1, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke(); });
    } else if (mood === "tired" || blink > 0.7) {
      eyes((x, y) => line(ctx, [[x - r * 0.09, y], [x + r * 0.09, y]], lw, ink));
    } else if (big) {
      eyes((x, y) => {
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.15, r * 0.19, 0, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = ink; ctx.stroke();
        dot(ctx, x + look[0] * r * 0.05, y + look[1] * r * 0.05, r * 0.06, ink);
      });
    } else {
      eyes((x, y) => dot(ctx, x, y, r * 0.09 * (1 - blink * 0.8), ink));
    }
    // brows
    const brow = (x, y, sd, a, lift = 0) => {
      const bx = x, by = y - r * (0.22 + lift);
      const dx = r * 0.11, dy = Math.tan(a * RAD) * dx * sd;
      line(ctx, [[bx - dx, by - dy], [bx + dx, by + dy]], lw * 0.9, ink);
    };
    const B2 = { angry: [22, 0], determined: [12, -0.02], sad: [-20, 0.02], cry: [-22, 0.02], worried: [-18, 0.04], scared: [-15, 0.12], surprised: [0, 0.16], confused: [null] }[mood];
    if (B2) {
      if (B2[0] === null) { eyes((x, y, sd) => brow(x, y, sd, sd < 0 ? -15 : 10, sd < 0 ? 0.1 : 0)); }
      else eyes((x, y, sd) => brow(x, y, sd, B2[0], B2[1]));
    } else if (mood === "confused") {
      eyes((x, y, sd) => brow(x, y, sd, 0, sd > 0 ? 0.12 : 0));
    }
    // mouth
    const mx = cx + off * 1.05, my = cy + r * 0.38, mw = r * (0.32 - profile * 0.08);
    ctx.lineWidth = lw; ctx.strokeStyle = ink;
    ctx.beginPath();
    switch (mood) {
      case "happy": ctx.arc(mx, my - r * 0.12, mw * 0.8, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); break;
      case "smirk": ctx.moveTo(mx - mw * 0.6, my); ctx.quadraticCurveTo(mx + mw * 0.3, my + r * 0.04, mx + mw * 0.7, my - r * 0.1); ctx.stroke(); break;
      case "laugh":
        ctx.moveTo(mx - mw * 0.8, my - r * 0.06); ctx.lineTo(mx + mw * 0.8, my - r * 0.06); ctx.arc(mx, my - r * 0.06, mw * 0.8, 0, Math.PI); ctx.closePath();
        ctx.fillStyle = ink; ctx.fill(); break;
      case "sad": case "cry": ctx.arc(mx, my + r * 0.14, mw * 0.6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); break;
      case "angry": ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke(); break;
      case "determined": ctx.moveTo(mx - mw * 0.55, my); ctx.quadraticCurveTo(mx, my - r * 0.04, mx + mw * 0.55, my - r * 0.03); ctx.stroke(); break;
      case "scared": case "worried": {
        const n = 5; for (let i = 0; i <= n; i++) { const x = mx - mw * 0.6 + (i / n) * mw * 1.2, y = my + (i % 2 ? -1 : 1) * r * 0.035; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); break;
      }
      case "surprised": ctx.ellipse(mx, my, mw * 0.28, mw * 0.36, 0, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); break;
      case "confused": ctx.moveTo(mx - mw * 0.5, my); ctx.bezierCurveTo(mx - mw * 0.2, my - r * 0.08, mx + mw * 0.2, my + r * 0.08, mx + mw * 0.5, my - r * 0.02); ctx.stroke(); break;
      case "tired": ctx.moveTo(mx - mw * 0.4, my + r * 0.02); ctx.lineTo(mx + mw * 0.4, my + r * 0.02); ctx.stroke(); break;
      default: ctx.moveTo(mx - mw * 0.4, my); ctx.lineTo(mx + mw * 0.4, my); ctx.stroke();
    }
    if (mood === "cry" || e.tear) {
      ctx.fillStyle = "#6fb6ff";
      eyes((x, y) => { ctx.beginPath(); ctx.ellipse(x, y + r * 0.22 + (e.tearY || 0) * r * 0.3, r * 0.05, r * 0.09, 0, 0, Math.PI * 2); ctx.fill(); });
    }
    if (e.sweat) {
      ctx.fillStyle = "#7cc7ff"; const sx = cx - dir * r * 0.75, sy = cy - r * 0.45;
      ctx.beginPath(); ctx.moveTo(sx, sy - r * 0.18); ctx.quadraticCurveTo(sx + r * 0.12, sy + r * 0.02, sx, sy + r * 0.06); ctx.quadraticCurveTo(sx - r * 0.12, sy + r * 0.02, sx, sy - r * 0.18); ctx.fill();
    }
    if (e.blush) {
      ctx.fillStyle = `rgba(255,120,120,${0.35 * e.blush})`;
      eyes((x, y) => { ctx.beginPath(); ctx.ellipse(x + (x > ex ? 1 : -1) * r * 0.05, y + r * 0.2, r * 0.1, r * 0.05, 0, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.restore();
  }

  // ---------- looks: what makes each character recognisable (keep them true stickmen)
  // {color (accent), hat: cap|top|helmet|crown|band|hood|cowboy|beanie|wizard|none, hair: spike|tuft|pony|bun|long|curly|bald|none,
  //  glasses, beard: short|long, mustache, cape, scarf, belt, tie, skirt, backpack, ink, headFill, scale}
  const LOOKS = {
    hero: { color: "#e63946", hat: "band" },
    kid: { color: "#f4a261", hair: "tuft", scale: 0.72 },
    elder: { color: "#8d99ae", beard: "long", hair: "bald", glasses: true },
    scientist: { color: "#2a9d8f", glasses: true, hair: "spike" },
    girl: { color: "#c77dff", hair: "pony" },
    villain: { color: "#222", cape: true, hat: "top", mustache: true },
    caveman: { color: "#a0522d", hair: "curly", beard: "short", belt: true },
    knight: { color: "#577590", hat: "helmet", cape: true },
    king: { color: "#e9c46a", hat: "crown", cape: true, beard: "short" },
    astronaut: { color: "#ffffff", hat: "helmetGlass", backpack: true },
  };

  function hat(ctx, h, r, L, ink, dir) {
    const col = L.color || "#e63946";
    ctx.save(); ctx.translate(h[0], h[1]);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const lw = Math.max(2.5, r * 0.12);
    ctx.lineWidth = lw; ctx.strokeStyle = ink;
    switch (L.hat) {
      case "cap":
        ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dir * r * 0.6, -r * 0.4); ctx.lineTo(dir * r * 1.55, -r * 0.3); ctx.stroke(); break;
      case "top":
        ctx.fillStyle = col; ctx.beginPath(); ctx.rect(-r * 0.62, -r * 2.0, r * 1.24, r * 1.15); ctx.fill(); ctx.stroke();
        line(ctx, [[-r * 1.05, -r * 0.85], [r * 1.05, -r * 0.85]], lw * 1.3, ink); break;
      case "cowboy":
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.8); ctx.quadraticCurveTo(0, -r * 2.1, r * 0.6, -r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * 1.4, -r * 0.95); ctx.quadraticCurveTo(0, -r * 0.55, r * 1.4, -r * 0.95); ctx.stroke(); break;
      case "helmet":
        ctx.beginPath(); ctx.arc(0, -r * 0.28, r * 1.08, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#b8c2cc"; ctx.fill(); ctx.stroke();
        line(ctx, [[0, -r * 1.12], [0, -r * 1.5]], lw, ink); dot(ctx, 0, -r * 1.55, r * 0.15, col); break;
      case "helmetGlass":
        ctx.beginPath(); ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2); ctx.fillStyle = "rgba(170,210,255,0.25)"; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-r * 0.5, -r * 0.6, r * 0.35, Math.PI, Math.PI * 1.5); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke(); break;
      case "crown":
        ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.75); ctx.lineTo(-r * 0.8, -r * 1.5); ctx.lineTo(-r * 0.35, -r * 1.1); ctx.lineTo(0, -r * 1.6); ctx.lineTo(r * 0.35, -r * 1.1); ctx.lineTo(r * 0.8, -r * 1.5); ctx.lineTo(r * 0.75, -r * 0.75); ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.stroke(); break;
      case "band":
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = col; ctx.fillRect(-r, -r * 0.62, r * 2, r * 0.28); ctx.restore();
        ctx.strokeStyle = col; ctx.lineWidth = lw * 1.2;
        ctx.beginPath(); ctx.moveTo(-dir * r * 0.95, -r * 0.5); ctx.quadraticCurveTo(-dir * r * 1.5, -r * 0.4, -dir * r * 1.9, -r * 0.1); ctx.stroke(); break;
      case "beanie":
        ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 1.04, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); dot(ctx, 0, -r * 1.2, r * 0.22, col); break;
      case "wizard":
        ctx.beginPath(); ctx.moveTo(-r * 1.2, -r * 0.7); ctx.lineTo(dir * r * 0.5, -r * 2.8); ctx.lineTo(r * 1.2, -r * 0.7); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); break;
      case "hood":
        ctx.beginPath(); ctx.arc(0, 0, r * 1.25, Math.PI * 0.85, Math.PI * 2.15); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); break;
    }
    ctx.restore();
  }
  function hair(ctx, h, r, L, ink, dir) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.fillStyle = L.hairColor || ink; ctx.strokeStyle = L.hairColor || ink; ctx.lineCap = "round";
    const lw = Math.max(2.5, r * 0.13); ctx.lineWidth = lw;
    switch (L.hair) {
      case "spike": for (let i = -2; i <= 2; i++) line(ctx, [[i * r * 0.28, -r * 0.92], [i * r * 0.38, -r * 1.35]], lw, L.hairColor || ink); break;
      case "tuft": ctx.beginPath(); ctx.moveTo(-r * 0.1, -r); ctx.quadraticCurveTo(r * 0.1, -r * 1.5, r * 0.45, -r * 1.3); ctx.stroke(); break;
      case "curly": for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.26, 0, Math.PI * 2); ctx.fill(); } break;
      case "pony":
        ctx.beginPath(); ctx.arc(0, 0, r * 1.02, Math.PI * 1.0, Math.PI * 2.0); ctx.lineWidth = lw * 1.4; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-dir * r * 0.9, -r * 0.6); ctx.quadraticCurveTo(-dir * r * 1.7, -r * 0.4, -dir * r * 1.5, r * 0.6); ctx.lineWidth = lw * 2.2; ctx.stroke(); break;
      case "bun": ctx.beginPath(); ctx.arc(0, 0, r * 1.02, Math.PI * 1.0, Math.PI * 2.0); ctx.lineWidth = lw * 1.4; ctx.stroke(); dot(ctx, 0, -r * 1.2, r * 0.35, L.hairColor || ink); break;
      case "long":
        ctx.beginPath(); ctx.moveTo(-r * 1.05, r * 0.9); ctx.lineTo(-r * 1.05, 0); ctx.arc(0, 0, r * 1.05, Math.PI, 0); ctx.lineTo(r * 1.05, r * 0.9); ctx.lineWidth = lw * 1.5; ctx.stroke(); break;
    }
    ctx.restore();
  }

  // props held in the front hand, aligned with the forearm: sword stick spear torch phone book pointer flag shield club cup
  function prop(ctx, kind, hand, ang, dir, s, ink, col) {
    ctx.save(); ctx.translate(hand[0], hand[1]);
    // weapons and pointers continue the forearm; everything else stays upright in the fist
    const along = kind === "sword" || kind === "spear" || kind === "pointer" || kind === "stick" || kind === "club";
    if (along) ctx.rotate(Math.PI - ang * RAD * dir);
    ctx.scale(dir, 1);
    const lw = B.line * s * 0.8;
    // local frame: -y is "out of the fist" (forearm direction for weapons, up for the rest)
    switch (kind) {
      case "sword": line(ctx, [[0, 10 * s], [0, -150 * s]], lw * 0.9, "#9aa5b1"); line(ctx, [[-16 * s, 0], [16 * s, 0]], lw, ink); line(ctx, [[0, 0], [0, 18 * s]], lw, ink); break;
      case "stick": case "club": line(ctx, [[0, 30 * s], [0, -120 * s]], kind === "club" ? lw * 2 : lw, "#8b5a2b"); break;
      case "spear": line(ctx, [[0, 60 * s], [0, -170 * s]], lw * 0.8, "#8b5a2b"); ctx.beginPath(); ctx.moveTo(0, -200 * s); ctx.lineTo(9 * s, -165 * s); ctx.lineTo(-9 * s, -165 * s); ctx.closePath(); ctx.fillStyle = "#777"; ctx.fill(); break;
      case "torch": line(ctx, [[0, 10 * s], [0, -70 * s]], lw, "#8b5a2b"); ctx.beginPath(); ctx.moveTo(0, -120 * s); ctx.quadraticCurveTo(22 * s, -85 * s, 0, -70 * s); ctx.quadraticCurveTo(-22 * s, -85 * s, 0, -120 * s); ctx.fillStyle = "#ff9f1c"; ctx.fill(); break;
      case "phone": ctx.fillStyle = ink; ctx.fillRect(-10 * s, -26 * s, 20 * s, 36 * s); ctx.fillStyle = "#7fd1ff"; ctx.fillRect(-7 * s, -22 * s, 14 * s, 26 * s); break;
      case "book": ctx.fillStyle = col || "#e63946"; ctx.fillRect(-4 * s, -30 * s, 34 * s, 42 * s); ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.5; ctx.strokeRect(-4 * s, -30 * s, 34 * s, 42 * s); break;
      case "pointer": line(ctx, [[0, 6 * s], [0, -110 * s]], lw * 0.5, "#555"); dot(ctx, 0, -110 * s, 5 * s, "#e63946"); break;
      case "flag": line(ctx, [[0, 30 * s], [0, -150 * s]], lw * 0.7, ink); ctx.fillStyle = col || "#e63946"; ctx.beginPath(); ctx.moveTo(0, -150 * s); ctx.lineTo(60 * s, -130 * s); ctx.lineTo(0, -110 * s); ctx.fill(); break;
      case "shield": ctx.beginPath(); ctx.ellipse(0, -6 * s, 30 * s, 40 * s, 0, 0, Math.PI * 2); ctx.fillStyle = col || "#577590"; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = ink; ctx.stroke(); break;
      case "cup": ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.5; ctx.beginPath(); ctx.rect(-12 * s, -28 * s, 24 * s, 28 * s); ctx.fill(); ctx.stroke(); break;
    }
    ctx.restore();
  }

  // ---------- the figure
  // o: {x, y (ground), s, dir (1 right / -1 left), pose, look (LOOKS name or object), face:{mood,look,blink,sweat,tear,blush},
  //     profile 0..1 (0 = facing camera, 1 = side), hold: prop name (front hand), holdB: prop in back hand, ink, alpha, t (for blinking), seed}
  function draw(ctx, o) {
    const L = typeof o.look === "string" ? (LOOKS[o.look] || {}) : (o.look || {});
    const s = (o.s ?? 1) * (L.scale ?? 1);
    const dir = o.dir ?? 1;
    const pose = Object.assign({}, STAND, typeof o.pose === "string" ? P[o.pose] : o.pose || {});
    const k = skeleton(o.x, o.y, s, pose, dir);
    const ink = o.ink || L.ink || INK;
    const lw = B.line * s;
    const r = B.head * s;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    // cape behind everything
    if (L.cape) {
      const flap = o.t != null ? noise1(o.t * 1.5, 3) * 10 * s : 0;
      ctx.beginPath(); ctx.moveTo(k.neck[0], k.neck[1] + 4 * s);
      ctx.quadraticCurveTo(k.hip[0] - dir * 40 * s, k.hip[1], k.hip[0] - dir * (55 * s + flap), k.hip[1] + 40 * s);
      ctx.lineTo(k.hip[0] - dir * 8 * s, k.hip[1] + 30 * s); ctx.closePath();
      ctx.fillStyle = L.color || "#e63946"; ctx.fill();
    }
    if (L.backpack) { ctx.fillStyle = L.color === "#ffffff" ? "#cfd6de" : (L.color || "#555"); const bx = k.shoulder[0] - dir * 22 * s, by = k.shoulder[1] + 10 * s; ctx.beginPath(); ctx.roundRect(bx - 18 * s, by, 36 * s, 60 * s, 8 * s); ctx.fill(); ctx.lineWidth = lw * 0.5; ctx.strokeStyle = ink; ctx.stroke(); }
    // back limbs (slightly greyed so the front ones read)
    const back = o.flatBack ? ink : mixInk(ink);
    line(ctx, [k.hip, k.LB.knee, k.LB.ankle], lw, back);
    footLine(ctx, k.LB.ankle, k.LB.footA, dir, s, lw, back);
    if (o.holdB) prop(ctx, o.holdB, k.AB.hand, k.AB.handA, dir, s, ink, L.color);
    line(ctx, [k.shoulder, k.AB.elbow, k.AB.hand], lw, back);
    dot(ctx, k.AB.hand[0], k.AB.hand[1], B.hand * s, back);
    // torso + neck
    line(ctx, [k.hip, k.neck], lw, ink);
    if (L.skirt) { ctx.beginPath(); ctx.moveTo(k.hip[0] - 4 * s, k.hip[1] - 14 * s); ctx.lineTo(k.hip[0] - 30 * s, k.hip[1] + 34 * s); ctx.lineTo(k.hip[0] + 30 * s, k.hip[1] + 34 * s); ctx.lineTo(k.hip[0] + 4 * s, k.hip[1] - 14 * s); ctx.closePath(); ctx.fillStyle = L.color; ctx.fill(); }
    if (L.belt) line(ctx, [[k.hip[0] - 12 * s, k.hip[1] - 6 * s], [k.hip[0] + 12 * s, k.hip[1] - 6 * s]], lw * 0.8, L.color);
    if (L.tie) line(ctx, [k.neck, [lerp(k.neck[0], k.hip[0], 0.4), lerp(k.neck[1], k.hip[1], 0.4)]], lw * 0.9, L.color);
    if (L.scarf) { line(ctx, [[k.neck[0] - 12 * s, k.neck[1] + 4 * s], [k.neck[0] + 12 * s, k.neck[1] + 4 * s]], lw * 1.2, L.color); line(ctx, [[k.neck[0] - dir * 6 * s, k.neck[1] + 6 * s], [k.neck[0] - dir * 30 * s, k.neck[1] + 34 * s]], lw, L.color); }
    // front leg
    line(ctx, [k.hip, k.LF.knee, k.LF.ankle], lw, ink);
    footLine(ctx, k.LF.ankle, k.LF.footA, dir, s, lw, ink);
    // head
    const prof = o.profile ?? 0.55;
    const hc = k.head;
    if (L.hat === "hood") hat(ctx, hc, r, L, ink, dir);
    if (L.hair === "long" || L.hair === "pony") hair(ctx, hc, r, L, ink, dir);
    ctx.beginPath(); ctx.arc(hc[0], hc[1], r, 0, Math.PI * 2);
    ctx.fillStyle = L.headFill || "#ffffff"; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
    const blink = o.t != null ? blinkAt(o.t, o.seed || 1) : 0;
    ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(k.headA * RAD * 0.35 * dir); ctx.translate(-hc[0], -hc[1]);
    face(ctx, hc[0], hc[1], r, Object.assign({ blink }, o.face || {}), dir, prof, ink);
    if (L.glasses) { const gx = hc[0] + prof * 0.42 * r * dir, gy = hc[1] - r * 0.08, sp = r * (0.36 - prof * 0.12) * 0.5; ctx.lineWidth = lw * 0.45; ctx.strokeStyle = ink; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(gx + sd * sp, gy, r * 0.17, 0, Math.PI * 2); ctx.stroke(); } line(ctx, [[gx - sp + r * 0.17, gy], [gx + sp - r * 0.17, gy]], lw * 0.45, ink); }
    if (L.beard) { ctx.beginPath(); ctx.arc(hc[0] + prof * 0.3 * r * dir, hc[1] + r * 0.45, r * (L.beard === "long" ? 0.55 : 0.4), 0, Math.PI); ctx.fillStyle = L.hairColor || "#7a7a7a"; ctx.fill(); }
    if (L.mustache) { ctx.lineWidth = lw * 0.7; ctx.strokeStyle = ink; ctx.beginPath(); const mx = hc[0] + prof * 0.42 * r * dir, my = hc[1] + r * 0.25; ctx.moveTo(mx - r * 0.35, my + r * 0.08); ctx.quadraticCurveTo(mx, my - r * 0.08, mx + r * 0.35, my + r * 0.08); ctx.stroke(); }
    ctx.restore();
    if (L.hair && L.hair !== "long" && L.hair !== "pony") hair(ctx, hc, r, L, ink, dir);
    if (L.hat && L.hat !== "hood") hat(ctx, hc, r, L, ink, dir);
    // front arm last
    if (o.hold) prop(ctx, o.hold, k.AF.hand, k.AF.handA, dir, s, ink, L.color);
    line(ctx, [k.shoulder, k.AF.elbow, k.AF.hand], lw, ink);
    dot(ctx, k.AF.hand[0], k.AF.hand[1], B.hand * s, ink);
    ctx.restore();
    return k; // joints in screen space: k.head, k.AF.hand, k.AB.hand, k.LF.ankle, k.hip...
  }
  function footLine(ctx, a, ang, dir, s, lw, col) { line(ctx, [a, [a[0] + dir * B.foot * s, a[1] + 1]], lw, col); }
  function mixInk(ink) { return ink === INK ? "#3c3c3c" : ink; }
  function blinkAt(t, seed) {
    const period = 3.2 + ((seed * 0.37) % 1.6);
    const ph = (t + seed * 0.71) % period;
    return ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0;
  }

  // motion trail: draw the figure at earlier times, fading (fn(t) -> draw options)
  function trail(ctx, fn, t, n = 4, dt = 1 / 30) {
    for (let i = n; i >= 1; i--) draw(ctx, Object.assign(fn(t - i * dt), { alpha: 0.12 * (n - i + 1) / n, face: { mood: "neutral" } }));
    return draw(ctx, fn(t));
  }

  window.STICK = { draw, P, STAND, posesAt, mixPose, tweak, walk, run, idle, trail, face, prop, LOOKS, B, INK, line, dot, skeleton };
})();
