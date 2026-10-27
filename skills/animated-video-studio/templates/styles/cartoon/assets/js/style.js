// style.js — CARTOON COMEDY: chunky characters with thick black outlines, big heads and big expressions,
// flat bright sets, comic effects (POW!, dizzy stars, sweat, motion arcs), speech bubbles. Made for gags and Shorts.
// Bodies follow the stickman skeleton, so every STICK pose / walk / run / posesAt works here.
(function () {
  const { W, H, G, clamp, lerp, E, prog, mulberry, noise1 } = F;
  const { B, STAND, P, skeleton } = STICK;
  const TAU = Math.PI * 2, O = "#141414";
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

  function tube(ctx, pts, w, col, ow = 7) {   // a limb: black outline under a coloured core
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    path(); ctx.lineWidth = w + ow * 2; ctx.strokeStyle = O; ctx.stroke();
    path(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
  }
  function blob(ctx, fill, ow = 7) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = ow; ctx.strokeStyle = O; ctx.lineJoin = "round"; ctx.stroke(); }
  const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };

  // ---------- the character
  // look: {skin, shirt, pants, shoes, build:'normal'|'wide'|'tall'|'kid', hair:'short'|'spiky'|'long'|'bun'|'curly'|'bald', hairCol,
  //        hat:'chef'|'cap'|'beanie'|'helmet'|'tophat'|'crown'|'bandana'|'mask', hatCol, mustache, beard, glasses, apron (colour), tie (colour), stripes (shirt colour 2)}
  // o: {x, y (ground), s, dir, pose, look, face:{mood, look:[x,y], talk (0..1 mouth open), sweat, tear, blush, dizzy}, hold:{kind:'baguette'|'bat'|'phone'|'cup'|'sign', text}, t}
  function fig(ctx, o) {
    const L = o.look || {}, s = o.s ?? 1, dir = o.dir ?? 1, build = L.build || "normal";
    const pose = Object.assign({}, STAND, typeof o.pose === "string" ? P[o.pose] : o.pose || {});
    const k = skeleton(o.x, o.y, s, pose, dir);
    const skin = L.skin || "#ffd9b3", shirt = L.shirt || "#4d96ff", pants = L.pants || "#2d3a5a", shoes = L.shoes || "#222";
    const wide = build === "wide" ? 1.35 : build === "kid" ? 0.95 : 1, ow = 6.5 * s;
    const limb = 22 * s * (build === "wide" ? 1.15 : 1), bodyW = 78 * s * wide, headR = 64 * s * (build === "kid" ? 1.12 : 1);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    // back leg + arm
    tube(ctx, [k.hip, k.LB.knee, k.LB.ankle], limb, pants, ow);
    shoe(ctx, k.LB.ankle, dir, s, shoes);
    tube(ctx, [k.shoulder, k.AB.elbow, k.AB.hand], limb * 0.85, shirt, ow); circ(ctx, k.AB.hand[0], k.AB.hand[1], 13 * s); blob(ctx, skin, ow * 0.8);
    // torso: a rounded block along the spine
    const ang = Math.atan2(k.neck[1] - k.hip[1], k.neck[0] - k.hip[0]) + Math.PI / 2, len = Math.hypot(k.neck[0] - k.hip[0], k.neck[1] - k.hip[1]);
    ctx.save(); ctx.translate((k.neck[0] + k.hip[0]) / 2, (k.neck[1] + k.hip[1]) / 2); ctx.rotate(ang);
    ctx.beginPath(); ctx.roundRect(-bodyW / 2, -len / 2 - 14 * s, bodyW, len + 34 * s, 26 * s); blob(ctx, shirt, ow);
    if (L.stripes) { ctx.save(); ctx.beginPath(); ctx.roundRect(-bodyW / 2, -len / 2 - 14 * s, bodyW, len + 34 * s, 26 * s); ctx.clip(); ctx.fillStyle = L.stripes; for (let i = 0; i < 6; i++) ctx.fillRect(-bodyW, -len / 2 + i * 26 * s, bodyW * 2, 12 * s); ctx.restore(); ctx.beginPath(); ctx.roundRect(-bodyW / 2, -len / 2 - 14 * s, bodyW, len + 34 * s, 26 * s); ctx.lineWidth = ow; ctx.strokeStyle = O; ctx.stroke(); }
    if (L.apron) { ctx.beginPath(); ctx.roundRect(-bodyW * 0.32, -len * 0.15, bodyW * 0.64, len * 0.75 + 20 * s, 10 * s); blob(ctx, L.apron, ow * 0.8); }
    if (L.tie) { ctx.beginPath(); ctx.moveTo(0, -len / 2 - 6 * s); ctx.lineTo(10 * s, -len / 2 + 30 * s); ctx.lineTo(0, -len / 2 + 60 * s); ctx.lineTo(-10 * s, -len / 2 + 30 * s); ctx.closePath(); blob(ctx, L.tie, ow * 0.6); }
    ctx.restore();
    // front leg
    tube(ctx, [k.hip, k.LF.knee, k.LF.ankle], limb, pants, ow);
    shoe(ctx, k.LF.ankle, dir, s, shoes);
    // head
    const [hx, hy] = [k.head[0], k.head[1] - 16 * s];
    if (L.hair === "long") { ctx.beginPath(); ctx.roundRect(hx - headR * 1.05, hy - headR * 0.6, headR * 2.1, headR * 1.7, headR * 0.5); blob(ctx, L.hairCol || "#5a3825", ow); }
    if (L.hair === "bun") { circ(ctx, hx - dir * headR * 0.2, hy - headR * 1.05, headR * 0.42); blob(ctx, L.hairCol || "#5a3825", ow); }
    circ(ctx, hx, hy, headR); blob(ctx, skin, ow);
    hair(ctx, hx, hy, headR, L, dir, ow);
    face(ctx, hx, hy, headR, o.face || {}, dir, L, s, o.t);
    hat(ctx, hx, hy, headR, L, dir, ow);
    // held object + front arm
    if (o.hold) held(ctx, o.hold, k.AF.hand, k.AF.elbow, s, dir);
    tube(ctx, [k.shoulder, k.AF.elbow, k.AF.hand], limb * 0.85, shirt, ow); circ(ctx, k.AF.hand[0], k.AF.hand[1], 13 * s); blob(ctx, skin, ow * 0.8);
    if (o.face && o.face.dizzy) dizzy(ctx, hx, hy - headR * 1.2, headR, o.t || 0);
    ctx.restore();
    k.headC = [hx, hy]; k.headR = headR;
    return k;
  }
  function shoe(ctx, a, dir, s, col) { ctx.beginPath(); ctx.ellipse(a[0] + dir * 12 * s, a[1] + 4 * s, 26 * s, 13 * s, 0, 0, TAU); blob(ctx, col, 5 * s); }
  function hair(ctx, x, y, r, L, dir, ow) {
    const c = L.hairCol || "#5a3825";
    if (!L.hair || L.hair === "bald") return;
    if (L.hair === "short" || L.hair === "long" || L.hair === "bun") { ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(x, y - r * 0.45, x - r * 0.98, y - r * 0.2); blob(ctx, c, ow); }
    if (L.hair === "spiky") { ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.2); for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.05 + i * 0.15); ctx.lineTo(x + Math.cos(a) * r * (i % 2 ? 1.45 : 0.95), y + Math.sin(a) * r * (i % 2 ? 1.45 : 0.95)); } ctx.closePath(); blob(ctx, c, ow); }
    if (L.hair === "curly") for (let i = 0; i < 8; i++) { const a = Math.PI * (1.0 + i * 0.143); circ(ctx, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.3); blob(ctx, c, ow * 0.7); }
  }
  function hat(ctx, x, y, r, L, dir, ow) {
    const c = L.hatCol;
    switch (L.hat) {
      case "chef": ctx.beginPath(); ctx.roundRect(x - r * 0.75, y - r * 1.55, r * 1.5, r * 0.8, r * 0.15); blob(ctx, "#fff", ow); ctx.beginPath(); ctx.ellipse(x, y - r * 1.75, r * 1.0, r * 0.6, 0, 0, TAU); blob(ctx, "#fff", ow); break;
      case "cap": ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); blob(ctx, c || "#e63946", ow); ctx.beginPath(); ctx.ellipse(x + dir * r * 0.95, y - r * 0.38, r * 0.6, r * 0.16, 0, 0, TAU); blob(ctx, c || "#e63946", ow); break;
      case "beanie": ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.04, Math.PI, 0); ctx.closePath(); blob(ctx, c || "#6c5ce7", ow); circ(ctx, x, y - r * 1.2, r * 0.22); blob(ctx, c || "#6c5ce7", ow); break;
      case "helmet": ctx.beginPath(); ctx.arc(x, y - r * 0.05, r * 1.12, Math.PI, 0); ctx.closePath(); blob(ctx, c || "#2c3e70", ow); ctx.beginPath(); ctx.roundRect(x - r * 0.95, y - r * 0.45, r * 1.9, r * 0.32, r * 0.1); blob(ctx, "rgba(160,210,255,0.9)", ow * 0.7); break;
      case "tophat": ctx.beginPath(); ctx.roundRect(x - r * 0.6, y - r * 2.0, r * 1.2, r * 1.2, 6); blob(ctx, c || "#222", ow); ctx.beginPath(); ctx.ellipse(x, y - r * 0.82, r * 1.05, r * 0.18, 0, 0, TAU); blob(ctx, c || "#222", ow); break;
      case "crown": ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.8); ctx.lineTo(x - r * 0.8, y - r * 1.55); ctx.lineTo(x - r * 0.35, y - r * 1.15); ctx.lineTo(x, y - r * 1.65); ctx.lineTo(x + r * 0.35, y - r * 1.15); ctx.lineTo(x + r * 0.8, y - r * 1.55); ctx.lineTo(x + r * 0.7, y - r * 0.8); ctx.closePath(); blob(ctx, "#ffd166", ow); break;
      case "bandana": ctx.beginPath(); ctx.arc(x, y - r * 0.05, r * 1.03, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); blob(ctx, c || "#e63946", ow); ctx.beginPath(); ctx.moveTo(x - dir * r * 0.95, y - r * 0.3); ctx.lineTo(x - dir * r * 1.5, y - r * 0.1); ctx.lineTo(x - dir * r * 1.35, y + r * 0.2); ctx.closePath(); blob(ctx, c || "#e63946", ow * 0.7); break;
      case "mask": ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.fillStyle = c || "#111"; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.fillStyle = L.skin || "#ffd9b3"; ctx.beginPath(); ctx.roundRect(x - r * 0.75 + dir * r * 0.1, y - r * 0.32, r * 1.5, r * 0.42, r * 0.2); ctx.fill(); ctx.restore(); circ(ctx, x, y, r); ctx.lineWidth = ow; ctx.strokeStyle = O; ctx.stroke(); break;
    }
  }
  // big readable expressions. mood: neutral happy laugh smug angry sad cry scared surprised confused tired sneaky
  function face(ctx, x, y, r, e, dir, L, s, t) {
    const mood = e.mood || "neutral", lk = e.look || [0.25 * dir, 0];
    const ex = x + dir * r * 0.18, ey = y - r * 0.12, sep = r * 0.36;
    const blink = t != null && ((t * 0.37 + (e.seed || 0)) % 3.3) < 0.12;
    const big = mood === "scared" || mood === "surprised", er = r * (big ? 0.27 : 0.21);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const sd of [-1, 1]) {
      const cx = ex + sd * sep;
      if (L.hat === "mask" || blink || mood === "laugh" || mood === "tired") {
        ctx.beginPath(); if (mood === "laugh") ctx.arc(cx, ey + er * 0.5, er, Math.PI * 1.1, Math.PI * 1.9); else { ctx.moveTo(cx - er, ey); ctx.lineTo(cx + er, ey); }
        ctx.lineWidth = 6 * s; ctx.strokeStyle = O; ctx.stroke(); if (L.hat !== "mask") continue;
      }
      if (L.hat === "mask" && !blink) { circ(ctx, cx, ey, er * 0.8); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 4 * s; ctx.strokeStyle = O; ctx.stroke(); circ(ctx, cx + lk[0] * er * 0.4, ey, er * 0.38); ctx.fillStyle = O; ctx.fill(); continue; }
      circ(ctx, cx, ey, er); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 5 * s; ctx.strokeStyle = O; ctx.stroke();
      const pr = er * (big ? 0.32 : 0.48); circ(ctx, cx + lk[0] * er * 0.45, ey + lk[1] * er * 0.45, pr); ctx.fillStyle = O; ctx.fill();
      circ(ctx, cx + lk[0] * er * 0.45 - pr * 0.35, ey + lk[1] * er * 0.45 - pr * 0.35, pr * 0.3); ctx.fillStyle = "#fff"; ctx.fill();
      // brows
      const bt = mood === "angry" ? sd * 0.45 : mood === "sad" || mood === "cry" || mood === "scared" ? -sd * 0.4 : mood === "sneaky" || mood === "smug" ? sd * 0.2 : 0;
      ctx.save(); ctx.translate(cx, ey - er * (mood === "surprised" ? 1.9 : 1.45)); ctx.rotate(bt); ctx.beginPath(); ctx.moveTo(-er, 0); ctx.lineTo(er, 0); ctx.lineWidth = 7 * s; ctx.strokeStyle = O; ctx.stroke(); ctx.restore();
    }
    if (L.glasses) { ctx.lineWidth = 4.5 * s; ctx.strokeStyle = O; for (const sd of [-1, 1]) { circ(ctx, ex + sd * sep, ey, er * 1.35); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(ex - sep + er * 1.35, ey); ctx.lineTo(ex + sep - er * 1.35, ey); ctx.stroke(); }
    // nose
    ctx.beginPath(); ctx.ellipse(ex + dir * r * 0.12, y + r * 0.14, r * 0.13, r * 0.1, 0, 0, TAU); ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fill();
    // mouth
    const mx = ex, my = y + r * 0.45, mw = r * 0.34, talk = e.talk || 0;
    ctx.lineWidth = 6 * s; ctx.strokeStyle = O;
    if (L.mustache) { ctx.beginPath(); ctx.moveTo(mx - r * 0.45, my - r * 0.06); ctx.quadraticCurveTo(mx, my - r * 0.38, mx + r * 0.45, my - r * 0.06); ctx.quadraticCurveTo(mx, my - r * 0.12, mx - r * 0.45, my - r * 0.06); ctx.fillStyle = L.hairCol || "#4a2c1a"; ctx.fill(); ctx.lineWidth = 4 * s; ctx.stroke(); ctx.lineWidth = 6 * s; }
    if (L.beard) { ctx.beginPath(); ctx.arc(x + dir * r * 0.1, y + r * 0.35, r * 0.62, 0.1, Math.PI - 0.1); ctx.fillStyle = L.hairCol || "#4a2c1a"; ctx.fill(); }
    if (talk > 0.05 || big || mood === "laugh") { ctx.beginPath(); ctx.ellipse(mx, my + r * 0.04, mw * (big ? 0.55 : 0.75), r * (0.08 + 0.16 * Math.max(talk, big ? 1 : mood === "laugh" ? 0.8 : 0)), 0, 0, TAU); ctx.fillStyle = "#7a1f2b"; ctx.fill(); ctx.stroke(); }
    else if (mood === "happy" || mood === "smug" || mood === "sneaky") { ctx.beginPath(); ctx.arc(mx + (mood === "smug" ? dir * 6 : 0), my - r * 0.12, mw, Math.PI * 0.15, Math.PI * (mood === "smug" ? 0.6 : 0.85)); ctx.stroke(); }
    else if (mood === "sad" || mood === "cry" || mood === "angry") { ctx.beginPath(); ctx.arc(mx, my + r * 0.2, mw * 0.8, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    else if (mood === "confused") { ctx.beginPath(); ctx.moveTo(mx - mw, my + 4); ctx.quadraticCurveTo(mx, my - 10, mx + mw, my + 8); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke(); }
    if (e.sweat) { ctx.beginPath(); const sx = x - dir * r * 0.85, sy = y - r * 0.5; ctx.moveTo(sx, sy - 18 * s); ctx.quadraticCurveTo(sx + 12 * s, sy + 6 * s, sx, sy + 10 * s); ctx.quadraticCurveTo(sx - 12 * s, sy + 6 * s, sx, sy - 18 * s); ctx.fillStyle = "#7fd1ff"; ctx.fill(); ctx.lineWidth = 3 * s; ctx.stroke(); }
    if (e.tear || mood === "cry") { ctx.fillStyle = "#7fd1ff"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(ex + sd * sep, ey + r * 0.38, 7 * s, 16 * s, 0, 0, TAU); ctx.fill(); } }
    if (e.blush) { ctx.fillStyle = "rgba(255,90,110,0.35)"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(ex + sd * sep * 1.3, y + r * 0.22, 16 * s, 9 * s, 0, 0, TAU); ctx.fill(); } }
  }
  function held(ctx, h, hand, elbow, s, dir) {
    const kind = typeof h === "string" ? h : h.kind, a = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]);
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(a + Math.PI / 2);
    if (kind === "baguette" || kind === "bat") { ctx.beginPath(); ctx.roundRect(-14 * s, -230 * s, 28 * s, 260 * s, 14 * s); blob(ctx, kind === "bat" ? "#c68b59" : "#e0a458", 6 * s);
      if (kind === "baguette") for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8 * s, -190 * s + i * 50 * s); ctx.lineTo(8 * s, -205 * s + i * 50 * s); ctx.lineWidth = 4 * s; ctx.strokeStyle = "#9c6a2c"; ctx.stroke(); } }
    else if (kind === "phone") { ctx.beginPath(); ctx.roundRect(-16 * s, -34 * s, 32 * s, 56 * s, 6 * s); blob(ctx, "#222", 4 * s); }
    else if (kind === "cup") { ctx.beginPath(); ctx.roundRect(-18 * s, -40 * s, 36 * s, 44 * s, 6 * s); blob(ctx, "#fff", 4 * s); }
    else if (kind === "sign") { ctx.rotate(-(a + Math.PI / 2)); ctx.beginPath(); ctx.roundRect(-110 * s, -170 * s, 220 * s, 110 * s, 10 * s); blob(ctx, "#fff7e0", 5 * s); ctx.font = `800 ${34 * s}px Inter`; ctx.fillStyle = O; ctx.textAlign = "center"; ctx.fillText(h.text || "", 0, -104 * s); }
    else if (kind === "croissant") croissant(ctx, 0, -20 * s, s);
    ctx.restore();
  }
  function dizzy(ctx, x, y, r, t) { for (let i = 0; i < 4; i++) { const a = t * 4 + i * TAU / 4; star(ctx, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.25, r * 0.16, "#ffd166"); } }
  function star(ctx, x, y, r, col) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); blob(ctx, col, 3); }

  // ---------- animals and props
  function pigeon(ctx, x, y, s, o = {}) {
    const dir = o.dir ?? 1, t = o.t || 0, fly = o.fly || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    if (fly) { const f = Math.sin(t * 30) * 0.6; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(-10, -60); ctx.rotate(sd * 0.2 - 0.6 + f); ctx.beginPath(); ctx.ellipse(-60, 0, 80, 26, 0, 0, TAU); blob(ctx, "#8791a5", 7); ctx.restore(); } }
    if (!fly) for (const lx of [-25, 25]) { ctx.beginPath(); ctx.moveTo(lx, 60); ctx.lineTo(lx + 6, 120); ctx.lineWidth = 10; ctx.strokeStyle = "#ff9f1c"; ctx.lineCap = "round"; ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 0, 120, 90, -0.15, 0, TAU); blob(ctx, "#9aa3b5", 8);
    ctx.beginPath(); ctx.ellipse(55, -110, 66, 62, 0, 0, TAU); blob(ctx, "#8791a5", 8);
    ctx.beginPath(); ctx.ellipse(38, -62, 48, 24, 0, 0, TAU); blob(ctx, "#4fae7a", 6);
    circ(ctx, 80, -128, 21); blob(ctx, "#ff9f1c", 6); circ(ctx, 86 + (o.look || 0) * 4, -128, 9); ctx.fillStyle = O; ctx.fill();
    if (o.mood === "sneaky") { ctx.beginPath(); ctx.moveTo(60, -152); ctx.lineTo(102, -142); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(118, -112); ctx.lineTo(160, -100); ctx.lineTo(118, -92); ctx.closePath(); blob(ctx, "#f4c542", 6);
    if (o.croissant) croissant(ctx, 175, -96, 0.9);
    ctx.restore();
  }
  function croissant(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-70, 10); ctx.quadraticCurveTo(-40, -55, 0, -52); ctx.quadraticCurveTo(40, -55, 70, 10); ctx.quadraticCurveTo(0, -10, -70, 10); blob(ctx, "#f0b25a", 6);
    for (const dx of [-30, 0, 30]) { ctx.beginPath(); ctx.moveTo(dx - 6, -40); ctx.lineTo(dx + 6, -8); ctx.lineWidth = 4; ctx.strokeStyle = "#b9722c"; ctx.stroke(); }
    ctx.restore();
  }
  function lamp(ctx, x, y, s = 1) { ctx.beginPath(); ctx.roundRect(x - 14 * s, y - 620 * s, 28 * s, 620 * s, 10); blob(ctx, "#3a4a5c", 6); ctx.beginPath(); ctx.roundRect(x - 70 * s, y - 680 * s, 140 * s, 70 * s, 20); blob(ctx, "#ffe08a", 6); }
  function stall(ctx, x, y, s = 1, o = {}) {   // a little shop counter with an awning
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.roundRect(-260, -260, 520, 260, 12); blob(ctx, "#e9d5b7", 7);
    ctx.beginPath(); ctx.rect(-300, -620, 600, 40); blob(ctx, "#8b5a2b", 6);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-300 + i * 100, -580); ctx.lineTo(-300 + (i + 1) * 100, -580); ctx.quadraticCurveTo(-250 + i * 100, -500, -300 + i * 100, -580); blob(ctx, i % 2 ? "#fff" : (o.col || "#e63946"), 5); }
    for (const px of [-280, 280]) { ctx.beginPath(); ctx.rect(px - 10, -580, 20, 320); blob(ctx, "#8b5a2b", 5); }
    if (o.sign) { ctx.font = "400 70px 'Lilita One'"; ctx.textAlign = "center"; ctx.lineWidth = 8; ctx.strokeStyle = O; ctx.strokeText(o.sign, 0, -650); ctx.fillStyle = "#ffd166"; ctx.fillText(o.sign, 0, -650); }
    ctx.restore();
  }
  // ---------- sets
  function sky(ctx, o = {}) {
    ctx.fillStyle = lg(ctx, 0, 0, 0, o.horizon ?? H * 0.65, [[0, o.top || "#2fb5ff"], [1, o.bottom || "#c8eeff"]]); ctx.fillRect(-W, -H, W * 3, H * 3);
    const r = mulberry(o.seed || 4);
    for (let i = 0; i < (o.clouds ?? 3); i++) { const cx = r() * W + Math.sin((G.t || 0) * 0.05 + i) * 20, cy = H * (0.1 + r() * 0.2), sc = 0.8 + r() * 0.6;
      ctx.fillStyle = "#fff"; for (const [dx, dy, rr] of [[0, 0, 70], [70, -22, 85], [150, 0, 65]]) { circ(ctx, cx + dx * sc, cy + dy * sc, rr * sc); ctx.fill(); } }
  }
  function ground(ctx, y, o = {}) {
    ctx.fillStyle = o.col || "#7dc95e"; ctx.fillRect(-W, y, W * 3, H * 2);
    if (o.path) { ctx.fillStyle = o.path; ctx.fillRect(-W, y + 40, W * 3, H); }
    ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.lineWidth = 7; ctx.strokeStyle = O; ctx.stroke();
  }
  // ---------- comic effects
  function pow(ctx, text, x, y, t, a, o = {}) {
    const dt = t - a; if (dt < 0 || dt > (o.dur || 0.7)) return; const k = E.back(clamp(dt / 0.15, 0, 1)) * clamp(((o.dur || 0.7) - dt) / 0.15, 0, 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(o.rot ?? -0.12);
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const ang = (i / 24) * TAU, rr = i % 2 ? 110 : 170; ctx.lineTo(Math.cos(ang) * rr * 1.25, Math.sin(ang) * rr * 0.85); } ctx.closePath(); blob(ctx, o.col || "#ffd166", 7);
    ctx.font = `400 ${o.size || 90}px "Lilita One"`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 10; ctx.strokeStyle = O; ctx.strokeText(text, 0, 4); ctx.fillStyle = o.textCol || "#e63946"; ctx.fillText(text, 0, 4);
    ctx.restore();
  }
  function arcs(ctx, x, y, r, a0, a1, n = 3) { for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(x, y, r + i * 30, a0, a1); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(20,20,20,0.55)"; ctx.lineCap = "round"; ctx.stroke(); } }
  function dust(ctx, x, y, t, a) { const dt = t - a; if (dt < 0 || dt > 0.6) return; for (let i = 0; i < 5; i++) { circ(ctx, x + (i - 2) * 40 * (1 + dt * 2), y - dt * 40 - (i % 2) * 20, 30 * (1 - dt / 0.6) + 10); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill(); } }
  // speech bubble that types in (cps), tail to [tx, ty]
  function say(ctx, text, x, y, t, a, b, o = {}) {
    if (t < a || t > b) return; const k = E.back(clamp((t - a) / 0.2, 0, 1)); const shown = text.slice(0, Math.floor((t - a) * (o.cps || 30)));
    const size = o.size || 52; ctx.save(); ctx.font = `800 ${size}px Inter`; const w = Math.max(ctx.measureText(text).width + 70, 160), h = size * 1.9;
    ctx.translate(x, y); ctx.scale(k, k);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.moveTo(-20, h / 2 - 2); ctx.lineTo((o.tail ? o.tail[0] - x : -40), (o.tail ? o.tail[1] - y : h / 2 + 50)); ctx.lineTo(20, h / 2 - 2); blob(ctx, "#fff", 6);
    ctx.fillStyle = O; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(shown, 0, 2); ctx.restore();
  }
  window.TOON = { fig, face, pigeon, croissant, lamp, stall, sky, ground, pow, arcs, dust, say, star, dizzy, tube, blob };
})();
