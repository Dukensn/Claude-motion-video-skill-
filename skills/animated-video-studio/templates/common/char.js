// char.js — CHAR: invented characters. Nothing is fixed: every design comes from a seed + choices, so two films (or two
// students) never get the same hero. Families: 'hose' (classic 2D cartoon: noodle limbs, gloves, pie eyes),
// 'flat' (modern TV cartoon), 'lanky' (long, thin, elegant), 'blob' (round, squishy), 'stick' (stick figures, many variants).
// Species: human cat mouse dog rabbit bear frog bird fox pig.
//
//   const HERO = CHAR.invent(seed, { family: 'hose', species: 'cat' });   // any field can be forced; the rest is invented
//   CHAR.draw(ctx, HERO, { x, y (feet), s, dir, pose, face, t });           // full body, returns joints (hands, head…)
//   CHAR.head(ctx, HERO, x, y, s, face, t);                                  // close-up head
//   CHAR.sheet(ctx, HERO, { name, line });                                   // the character sheet shown to the student
//   pose: name | object | CHAR.walk(phase) | CHAR.run(phase) | CHAR.sneak(phase) | CHAR.act(t, keys)
//   face: mood name | object | CHAR.face(mood, overrides)
// Pure functions of their arguments (seeded); blinking comes from t.
(function () {
  const { clamp, lerp, E, mulberry } = F;
  const hash = (a, b, c) => (F.hash(a, b, c) + 1) / 2;   // 0..1
  const TAU = Math.PI * 2;

  // ---------------- colour
  const hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${clamp(s, 0, 100)}%,${clamp(l, 0, 100)}%,${a})`;
  function shade(col, k) { // darken (k<0) / lighten (k>0) any hsla() or hex colour
    if (col.startsWith("hsla")) { const [h, s, l, a] = col.match(/[\d.]+/g).map(Number); return hsl(h, s, l + k * 100, a); }
    const n = parseInt(col.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = (v) => clamp(Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)), 0, 255);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  const SKINS = [[28, 55, 82], [26, 50, 70], [24, 45, 58], [22, 42, 44], [20, 40, 32], [30, 60, 76], [18, 38, 26]];
  const FURS = [[30, 15, 55], [25, 45, 45], [0, 0, 85], [0, 0, 30], [210, 10, 60], [35, 70, 55], [20, 60, 40], [40, 20, 75], [15, 30, 25], [200, 20, 75]];
  function palette(r, species) {
    const scheme = Math.floor(r() * 5), h0 = r() * 360;
    const hues = [[h0, h0 + 180, h0 + 30], [h0, h0 + 120, h0 + 240], [h0, h0 + 25, h0 - 25], [h0, h0 + 150, h0 + 210], [h0, h0 + 90, h0 + 180]][scheme];
    const sat = 45 + r() * 40, li = 38 + r() * 22;
    const sk = SKINS[Math.floor(r() * SKINS.length)], fu = FURS[Math.floor(r() * FURS.length)];
    const animal = species !== "human";
    const skin = animal ? hsl(fu[0], fu[1], fu[2]) : hsl(sk[0], sk[1], sk[2]);
    return {
      skin, belly: animal ? hsl(fu[0], fu[1] * 0.6, Math.min(92, fu[2] + 25)) : skin,
      main: hsl(hues[0], sat, li), second: hsl(hues[1], sat * 0.8, li + 12), accent: hsl(hues[2], 85, 55),
      hair: r() < 0.5 ? hsl(20 + r() * 20, 30 + r() * 30, 10 + r() * 25) : hsl(hues[1] + r() * 40, 50, 30 + r() * 30),
      line: r() < 0.75 ? "#151515" : hsl(hues[0], 40, 14), eyeWhite: "#fbfbf7", pupil: "#111",
      species: species === "frog" ? hsl(95 + r() * 40, 50, 48) : null,
    };
  }

  // ---------------- the design space
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const FAM = {
    hose: { headR: [58, 74], bodyW: [52, 70], bodyH: [80, 110], legLen: [70, 95], armLen: [78, 98], limbW: [11, 15], line: [4.5, 6], body: ["pear", "bean", "barrel"], hands: ["glove"], feet: ["shoes", "shoes", "boots"], eyes: ["pie", "pie", "oval", "big"] },
    flat: { headR: [56, 70], bodyW: [46, 62], bodyH: [90, 120], legLen: [80, 105], armLen: [80, 100], limbW: [14, 20], line: [4, 5.5], body: ["rect", "tri", "bean"], hands: ["mitten", "hand"], feet: ["shoes", "sneakers", "boots"], eyes: ["oval", "dot", "big", "sleepy"] },
    lanky: { headR: [42, 54], bodyW: [30, 42], bodyH: [120, 150], legLen: [120, 150], armLen: [110, 135], limbW: [8, 11], line: [3.5, 5], body: ["tri", "rect", "bean"], hands: ["hand", "glove"], feet: ["boots", "shoes"], eyes: ["oval", "sleepy", "dot"] },
    blob: { headR: [64, 80], bodyW: [70, 95], bodyH: [72, 95], legLen: [40, 56], armLen: [50, 66], limbW: [16, 22], line: [5, 7], body: ["barrel", "pear"], hands: ["mitten"], feet: ["none", "shoes"], eyes: ["big", "button", "dot", "oval"] },
    stick: { headR: [44, 60], bodyW: [6, 8], bodyH: [95, 120], legLen: [100, 125], armLen: [90, 110], limbW: [8, 13], line: [0, 0], body: ["stick"], hands: ["stick", "dot"], feet: ["none", "none", "shoes"], eyes: ["dot", "oval", "big", "button"] },
  };
  const SPECIES = ["human", "human", "human", "cat", "mouse", "dog", "rabbit", "bear", "frog", "bird", "fox", "pig"];
  const EARS = { human: ["none"], cat: ["cat"], mouse: ["mouse"], dog: ["dog", "dogUp"], rabbit: ["long"], bear: ["round"], frog: ["none"], bird: ["none"], fox: ["cat"], pig: ["pig"] };
  const NOSES = { human: ["button", "long", "triangle", "round", "none", "hook"], cat: ["cat"], mouse: ["ball"], dog: ["ball"], rabbit: ["cat"], bear: ["ball"], frog: ["none"], bird: ["beak"], fox: ["ball"], pig: ["snout"] };
  const TAILS = { human: ["none"], cat: ["cat"], mouse: ["thin"], dog: ["stub", "cat"], rabbit: ["puff"], bear: ["puff"], frog: ["none"], bird: ["feather"], fox: ["fox"], pig: ["curl"] };
  const HAIR = ["none", "tuft", "spikes", "bob", "bun", "curl", "mohawk", "long", "afro", "braids", "sidepart", "pigtails"];
  const HATS = ["none", "none", "none", "beanie", "cap", "bowler", "straw", "bow", "helmet", "flower", "beret", "headband", "chef", "tophat"];
  const OUTFITS = ["shorts", "overalls", "dress", "coat", "tshirt", "vest", "none", "hoodie", "suit", "jersey"];
  const DETAILS = ["none", "freckles", "bandage", "scarf", "patch", "whiskers", "teeth", "mole", "glasses", "earring", "tie", "backpack", "bowtie"];
  const BROWS = ["thick", "thin", "none", "bushy", "dash"];
  const QUIRKS = ["none", "bigEye", "crookedSmile", "oneBrow", "lazyLid", "gap", "squint"];

  function invent(seed = 1, force = {}) {
    const r = mulberry(Math.floor(seed * 7919) + 13);
    const family = force.family || pick(r, ["hose", "hose", "flat", "lanky", "blob", "stick"]);
    const Fm = FAM[family];
    const species = force.species || (family === "stick" ? "human" : pick(r, SPECIES));
    const rng = (a) => lerp(a[0], a[1], r());
    const d = {
      seed, family, species, name: force.name || "",
      headR: rng(Fm.headR), headSx: lerp(0.9, 1.12, r()), headSy: lerp(0.9, 1.1, r()), jaw: lerp(-0.15, 0.25, r()), headTop: lerp(-0.1, 0.15, r()),
      body: pick(r, Fm.body), bodyW: rng(Fm.bodyW), bodyH: rng(Fm.bodyH), legLen: rng(Fm.legLen), armLen: rng(Fm.armLen), limbW: rng(Fm.limbW), lineW: rng(Fm.line),
      hands: pick(r, Fm.hands), feet: pick(r, Fm.feet), footSize: lerp(0.8, 1.35, r()),
      eyes: pick(r, Fm.eyes), eyeSize: lerp(0.8, 1.25, r()), eyeGap: lerp(0.28, 0.46, r()), eyeY: lerp(-0.2, 0.08, r()), eyeTilt: lerp(-0.15, 0.15, r()),
      brows: pick(r, BROWS), nose: pick(r, NOSES[species]), noseSize: lerp(0.8, 1.4, r()), ears: pick(r, EARS[species]), tail: pick(r, TAILS[species]),
      mouthW: lerp(0.35, 0.6, r()), mouthY: lerp(0.38, 0.55, r()),
      hair: family === "stick" && r() < 0.3 ? "none" : pick(r, species === "human" ? HAIR : ["none", "none", "tuft", "bun", "spikes"]),
      hat: pick(r, HATS), outfit: family === "stick" ? pick(r, ["none", "none", "scarfOnly", "tshirt", "dress", "coat"]) : pick(r, OUTFITS),
      detail: pick(r, DETAILS), quirk: pick(r, QUIRKS),
      exag: lerp(0.8, 1.35, r()),               // how big the expressions go
      bounce: lerp(0.6, 1.4, r()),              // how springy the walk is
      pal: palette(r, species),
    };
    if (family === "stick") { d.pal.main = force.color || d.pal.main; d.headFill = pick(r, ["#fbfbf7", "#111", "skin", "main"]); }
    if (d.species === "human" && d.outfit === "none") d.outfit = pick(r, ["tshirt", "hoodie", "dress", "coat"]);
    Object.assign(d, force);
    if (force.pal) d.pal = Object.assign(palette(mulberry(seed), d.species), force.pal);
    return d;
  }

  // ---------------- poses (angles in radians; arm/leg 0 = straight down, + = forward toward dir)
  const deg = Math.PI / 180;
  const P = {
    stand: { lean: 0, sq: 1, armF: [-8, 0.3], armB: [-12, -0.3], legF: [6, 0], legB: [-6, 0], head: 0 },
    wave: { armF: [160, -0.6], armB: [-12, -0.3], head: 0.08 },
    cheer: { armF: [150, 0.4], armB: [-150, -0.4], sq: 1.06, head: -0.08 },
    point: { armF: [88, 0], armB: [-20, -0.4], lean: 0.05 },
    shrug: { armF: [55, 1.4], armB: [-55, -1.4], head: 0.15, sq: 0.97 },
    scared: { armF: [120, 1.2], armB: [-110, -1.2], lean: -0.15, sq: 0.9, legF: [14, 0.2], legB: [-14, 0.2] },
    think: { armF: [140, 1.9], armB: [-30, 0.8], head: 0.12, lean: 0.03 },
    sad: { armF: [-4, 0.1], armB: [-4, -0.1], lean: 0.12, sq: 0.94, head: 0.3 },
    angry: { armF: [30, -1.2], armB: [-30, 1.2], lean: 0.12, sq: 0.96, legF: [16, 0], legB: [-16, 0] },
    reach: { armF: [100, 0.1], armB: [70, 0.2], lean: 0.25, legF: [10, 0], legB: [-30, 0.4] },
    surprised: { armF: [140, -0.4], armB: [-140, 0.4], sq: 1.12, hop: 30, legF: [10, 0.3], legB: [-12, 0.3], head: -0.1 },
    crouch: { lean: 0.2, sq: 0.8, armF: [40, 0.8], armB: [-10, 0.8], legF: [30, 0.9], legB: [-10, 0.9] },
    proud: { lean: -0.08, armF: [-30, -1.3], armB: [30, 1.3], head: -0.12, sq: 1.03 },
    tiptoe: { lean: 0.18, armF: [70, 1.4], armB: [-60, 1.2], legF: [20, 0.5], legB: [-20, 0.2], hop: 6 },
  };
  function norm(p) { p = typeof p === "string" ? P[p] || P.stand : p || P.stand; return Object.assign({}, P.stand, p); }
  function mix(a, b, k) {
    a = norm(a); b = norm(b); const o = {};
    for (const f in a) o[f] = Array.isArray(a[f]) ? a[f].map((v, i) => lerp(v, b[f][i], k)) : lerp(a[f] || 0, b[f] || 0, k);
    return o;
  }
  // keyed acting with anticipation and overshoot for free: [[t, pose, ease?], …]
  function act(t, keys) {
    if (t <= keys[0][0]) return norm(keys[0][1]);
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, pa] = keys[i], [tb, pb, ez] = keys[i + 1];
      if (t <= tb) return mix(pa, pb, (ez || E.back)(clamp((t - ta) / (tb - ta), 0, 1)));
    }
    return norm(keys[keys.length - 1][1]);
  }
  const walk = (ph, k = 1) => { const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU); return { lean: 0.05, sq: 1 + 0.04 * Math.abs(c) * k, hop: 10 * Math.abs(c) * k, armF: [-28 * s, 0.4], armB: [28 * s, -0.4], legF: [26 * s, Math.max(0, c) * 0.9], legB: [-26 * s, Math.max(0, -c) * 0.9], head: 0.03 * s }; };
  const run = (ph, k = 1) => { const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU); return { lean: 0.3, sq: 1 + 0.08 * c * k, hop: 34 * Math.abs(c) * k, armF: [-70 * s + 20, 1.2], armB: [70 * s + 20, -1.2], legF: [55 * s + 10, 1.0 + 0.6 * c], legB: [-55 * s + 10, 1.0 - 0.6 * c], head: 0.06 }; };
  const sneak = (ph) => { const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU); return { lean: 0.22, sq: 0.92, hop: 18 * Math.max(0, c), armF: [80 + 10 * s, 1.5], armB: [-50, 1.3], legF: [30 * s + 10, 0.9 * Math.max(0, c)], legB: [-30 * s + 10, 0.9 * Math.max(0, -c)], head: -0.05 }; };

  // ---------------- faces
  const MOODS = {
    neutral: {}, happy: { mouth: { curve: 0.7, open: 0.15 }, brow: [0.1, 0.1], browUp: 0.1, cheek: 0.3 },
    laugh: { mouth: { curve: 0.9, open: 0.85, tongue: 1 }, lidBot: 0.45, brow: [0.2, 0.2], browUp: 0.2, cheek: 0.6 },
    sad: { mouth: { curve: -0.6, open: 0 }, brow: [0.9, 0.9], lidTop: 0.3, look: [0, 0.5] },
    cry: { mouth: { curve: -0.8, open: 0.6, wobble: 1 }, brow: [1, 1], lidTop: 0.25, tear: 1, pupil: 1.3 },
    angry: { mouth: { curve: -0.5, open: 0.25, teeth: 1 }, brow: [-1, -1], browUp: -0.2, lidTop: 0.3, pupil: 0.7 },
    furious: { mouth: { curve: -0.7, open: 0.8, teeth: 1 }, brow: [-1.2, -1.2], browUp: -0.3, lidTop: 0.15, pupil: 0.5, vein: 1 },
    scared: { mouth: { curve: -0.4, open: 0.55, wobble: 1 }, brow: [0.9, 0.9], browUp: 0.5, pupil: 0.5, sweat: 1 },
    surprised: { mouth: { curve: 0, open: 0.9, round: 1 }, brow: [0, 0], browUp: 0.7, pupil: 0.6, eyeScale: 1.2 },
    shock: { mouth: { curve: -0.2, open: 1, round: 1 }, browUp: 1, pupil: 0.3, eyeScale: 1.4, sweat: 1 },
    smug: { mouth: { curve: 0.55, open: 0, skew: 0.6 }, brow: [-0.3, 0.4], lidTop: 0.45, look: [0.5, 0] },
    sly: { mouth: { curve: 0.8, open: 0.2, teeth: 1, skew: 0.4 }, brow: [-0.6, -0.2], lidTop: 0.5, look: [0.8, 0] },
    tired: { mouth: { curve: -0.1, open: 0.1 }, lidTop: 0.6, brow: [0.4, 0.4], look: [0, 0.3] },
    confused: { mouth: { curve: -0.2, open: 0.1, skew: -0.6 }, brow: [0.6, -0.6], browUp: 0.2, look: [-0.4, -0.4] },
    love: { mouth: { curve: 0.8, open: 0.2 }, hearts: 1, cheek: 1, browUp: 0.3 },
    determined: { mouth: { curve: -0.1, open: 0, w: 0.8 }, brow: [-0.7, -0.7], lidTop: 0.25, look: [0.6, 0] },
    disgust: { mouth: { curve: -0.6, open: 0.2, skew: 0.8, tongue: 1 }, brow: [-0.4, 0.7], lidTop: 0.4, lidBot: 0.3 },
    embarrassed: { mouth: { curve: 0.2, open: 0, wobble: 1 }, brow: [0.7, 0.7], cheek: 1, look: [-0.6, 0.4], sweat: 1 },
    dreamy: { mouth: { curve: 0.4, open: 0 }, lidTop: 0.55, look: [0.3, -0.6], brow: [0.3, 0.3], browUp: 0.3 },
  };
  function face(m, over = {}) {
    const base = { mouth: { curve: 0.1, open: 0, w: 1, skew: 0, teeth: 0, tongue: 0, round: 0, wobble: 0 }, brow: [0, 0], browUp: 0, lidTop: 0, lidBot: 0, look: [0, 0], pupil: 1, eyeScale: 1, cheek: 0, tear: 0, sweat: 0 };
    const src = typeof m === "string" ? MOODS[m] || {} : m || {};
    const o = Object.assign({}, base, src, over);
    o.mouth = Object.assign({}, base.mouth, src.mouth || {}, over.mouth || {});
    return o;
  }
  function mixFace(a, b, k) {
    a = face(a); b = face(b); const o = face({});
    for (const f in o) { if (f === "mouth") { o.mouth = {}; for (const m in a.mouth) o.mouth[m] = lerp(a.mouth[m] || 0, b.mouth[m] || 0, k); } else if (Array.isArray(o[f])) o[f] = a[f].map((v, i) => lerp(v, b[f][i], k)); else if (typeof a[f] === "number") o[f] = lerp(a[f], b[f] || 0, k); }
    return o;
  }

  // ---------------- drawing helpers
  function outlineFill(ctx, d, fill, lw) { ctx.fillStyle = fill; ctx.fill(); if ((lw ?? d.lineW) > 0) { ctx.lineWidth = lw ?? d.lineW; ctx.strokeStyle = d.pal.line; ctx.lineJoin = "round"; ctx.stroke(); } }
  function tube(ctx, d, pts, w, col) {
    // noodle limb: quadratic through 3 points, outline first then colour
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (d.lineW > 0) { path(); ctx.lineWidth = w + d.lineW * 2; ctx.strokeStyle = d.pal.line; ctx.stroke(); }
    path(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
  }
  function limb(base, len, ang, bend, dir) {
    // returns [start, control, end]; ang measured from straight down, + toward dir
    const ex = base[0] + Math.sin(ang) * len * dir, ey = base[1] + Math.cos(ang) * len;
    const mx = (base[0] + ex) / 2, my = (base[1] + ey) / 2;
    const nx = -(ey - base[1]), ny = ex - base[0], nl = Math.hypot(nx, ny) || 1;
    const b = bend * len * 0.45 * dir;
    return [base, [mx + (nx / nl) * b, my + (ny / nl) * b], [ex, ey]];
  }
  function legPts(hip, len, ang, lift, dir) {
    // a lifted leg folds: the foot comes up and back, the knee pushes forward
    const L = len * (1 - 0.45 * lift);
    const ex = hip[0] + Math.sin(ang) * L * dir, ey = hip[1] + Math.cos(ang) * L;
    const kx = (hip[0] + ex) / 2 + lift * len * 0.45 * dir, ky = (hip[1] + ey) / 2;
    return [hip, [kx, ky], [ex, ey]];
  }

  function bodyPath(ctx, d, w, h) {
    ctx.beginPath();
    switch (d.body) {
      case "pear": ctx.moveTo(-w * 0.5, -h); ctx.bezierCurveTo(-w * 0.9, -h * 0.6, -w * 1.25, -h * 0.05, -w * 0.9, 0); ctx.lineTo(w * 0.9, 0); ctx.bezierCurveTo(w * 1.25, -h * 0.05, w * 0.9, -h * 0.6, w * 0.5, -h); ctx.quadraticCurveTo(0, -h * 1.12, -w * 0.5, -h); break;
      case "bean": ctx.ellipse(0, -h * 0.5, w * 0.8, h * 0.6, 0, 0, TAU); break;
      case "barrel": ctx.ellipse(0, -h * 0.48, w * 1.05, h * 0.58, 0, 0, TAU); break;
      case "rect": ctx.roundRect(-w * 0.75, -h, w * 1.5, h * 1.02, w * 0.3); break;
      case "tri": ctx.moveTo(-w * 0.95, -h); ctx.lineTo(w * 0.95, -h); ctx.quadraticCurveTo(w * 1.0, -h * 0.9, w * 0.55, 0); ctx.lineTo(-w * 0.55, 0); ctx.quadraticCurveTo(-w * 1.0, -h * 0.9, -w * 0.95, -h); break;
      default: ctx.moveTo(0, -h); ctx.lineTo(0, 0);
    }
  }

  // ---------------- head (local coords: centre 0,0, radius R) — also used for close-ups
  function drawHead(ctx, d, R, fc, t, dir = 1) {
    const pal = d.pal, lw = d.lineW || Math.max(3, d.limbW * 0.4), sx = d.headSx, sy = d.headSy;
    const headFill = d.family === "stick" ? (d.headFill === "skin" ? pal.skin : d.headFill === "main" ? pal.main : d.headFill || "#fbfbf7") : pal.species || pal.skin;
    const headShape = () => {
      ctx.beginPath();
      if (d.headShape === "round") { ctx.ellipse(0, 0, R * sx, R * sy, 0, 0, TAU); return; }
      const top = -R * sy * (1 + d.headTop), bot = R * sy * (1 + d.jaw * 0.5), wr = R * sx;
      ctx.moveTo(0, top); ctx.bezierCurveTo(wr * 1.05, top, wr * 1.08, bot * 0.55, wr * (0.75 + d.jaw * 0.4), bot * 0.85);
      ctx.quadraticCurveTo(0, bot * 1.15, -wr * (0.75 + d.jaw * 0.4), bot * 0.85); ctx.bezierCurveTo(-wr * 1.08, bot * 0.55, -wr * 1.05, top, 0, top); ctx.closePath();
    };
    const L = { line: pal.line, lw };
    // ears behind
    const ear = (side) => {
      ctx.save(); ctx.scale(side, 1);
      switch (d.ears) {
        case "cat": ctx.beginPath(); ctx.moveTo(R * 0.35, -R * 0.75); ctx.lineTo(R * 0.85, -R * 1.35); ctx.lineTo(R * 0.92, -R * 0.4); ctx.closePath(); outlineFill(ctx, d, headFill, lw); ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.75); ctx.lineTo(R * 0.8, -R * 1.12); ctx.lineTo(R * 0.82, -R * 0.55); ctx.closePath(); ctx.fillStyle = "#f2a0a8"; ctx.fill(); break;
        case "mouse": ctx.beginPath(); ctx.arc(R * 0.85, -R * 0.85, R * 0.55, 0, TAU); outlineFill(ctx, d, headFill, lw); ctx.beginPath(); ctx.arc(R * 0.85, -R * 0.85, R * 0.36, 0, TAU); ctx.fillStyle = shade(headFill, 0.25); ctx.fill(); break;
        case "round": ctx.beginPath(); ctx.arc(R * 0.72, -R * 0.78, R * 0.3, 0, TAU); outlineFill(ctx, d, headFill, lw); break;
        case "long": ctx.beginPath(); ctx.ellipse(R * 0.35, -R * 1.45, R * 0.2, R * 0.7, 0.15, 0, TAU); outlineFill(ctx, d, headFill, lw); ctx.beginPath(); ctx.ellipse(R * 0.35, -R * 1.45, R * 0.1, R * 0.5, 0.15, 0, TAU); ctx.fillStyle = "#f2a0a8"; ctx.fill(); break;
        case "dog": ctx.beginPath(); ctx.ellipse(R * 0.95, -R * 0.1, R * 0.25, R * 0.62, -0.25, 0, TAU); outlineFill(ctx, d, shade(headFill, -0.25), lw); break;
        case "dogUp": ctx.beginPath(); ctx.moveTo(R * 0.4, -R * 0.8); ctx.quadraticCurveTo(R * 1.1, -R * 1.5, R * 0.95, -R * 0.35); ctx.closePath(); outlineFill(ctx, d, shade(headFill, -0.2), lw); break;
        case "pig": ctx.beginPath(); ctx.moveTo(R * 0.45, -R * 0.8); ctx.lineTo(R * 1.0, -R * 1.1); ctx.lineTo(R * 0.9, -R * 0.5); ctx.closePath(); outlineFill(ctx, d, headFill, lw); break;
        case "none": if (d.species === "human" && d.family !== "stick") { ctx.beginPath(); ctx.ellipse(R * sx * 0.98, R * 0.05, R * 0.14, R * 0.2, 0, 0, TAU); outlineFill(ctx, d, headFill, lw * 0.8); } break;
      }
      ctx.restore();
    };
    // back hair
    if (["long", "bob", "braids", "pigtails"].includes(d.hair)) {
      ctx.beginPath(); const hl = d.hair === "long" ? 1.35 : d.hair === "bob" ? 0.75 : 0.4;
      ctx.ellipse(0, -R * 0.1 + R * hl * 0.4, R * sx * 1.12, R * sy * (0.85 + hl * 0.35), 0, 0, TAU); outlineFill(ctx, d, pal.hair, lw);
      if (d.hair === "pigtails" || d.hair === "braids") for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 1.15, R * 0.35, R * 0.28, R * 0.45, s * 0.3, 0, TAU); outlineFill(ctx, d, pal.hair, lw); }
    }
    if (d.hair === "afro") { ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = Math.PI + (i / 13) * Math.PI * 1.0 - 0.1, rr = R * 1.25; ctx.arc(Math.cos(a) * rr * sx, Math.sin(a) * rr * 0.9 - R * 0.15, R * 0.32, 0, TAU); } ctx.fillStyle = pal.hair; ctx.fill(); }
    ear(-1); ear(1);
    headShape(); outlineFill(ctx, d, headFill, lw);
    // soft shading on the head (light from top-left)
    if (d.family !== "stick" || d.headFill !== "#111") { ctx.save(); headShape(); ctx.clip(); const g = ctx.createRadialGradient(-R * 0.4, -R * 0.5, R * 0.1, 0, 0, R * 1.5); g.addColorStop(0, "rgba(255,255,255,0.22)"); g.addColorStop(0.55, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.22)"); ctx.fillStyle = g; ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4);
      if (d.species !== "human" && d.species !== "frog") { ctx.beginPath(); ctx.ellipse(0, R * 0.42, R * 0.62, R * 0.5, 0, 0, TAU); ctx.fillStyle = pal.belly; ctx.fill(); }
      ctx.restore(); headShape(); ctx.lineWidth = lw; ctx.strokeStyle = pal.line; ctx.stroke(); }
    const dark = d.family === "stick" && d.headFill === "#111";
    const ink = dark ? "#fbfbf7" : pal.line;
    // eyes
    const blinkPh = ((t || 0) + hash(d.seed, 1, 1) * 4) % 3.7, blink = t != null && blinkPh < 0.12 ? 1 - Math.abs(blinkPh - 0.06) / 0.06 : 0;
    const gap = R * d.eyeGap * 2, ey = R * d.eyeY, es = R * 0.24 * d.eyeSize * (fc.eyeScale || 1);
    const ex = fc.exag ?? d.exag;
    for (const side of [-1, 1]) {
      const cx = side * gap / 2 + (fc.look[0] || 0) * R * 0.06 * dir, cy = ey;
      let w = es * (d.eyes === "big" ? 1.15 : d.eyes === "dot" || d.eyes === "button" ? 0.5 : 0.85), h = es * (d.eyes === "big" ? 1.25 : d.eyes === "pie" ? 1.45 : d.eyes === "dot" || d.eyes === "button" ? 0.5 : 1.1);
      if (d.quirk === "bigEye" && side === 1) { w *= 1.18; h *= 1.18; }
      const lidT = clamp(Math.max(fc.lidTop + (d.quirk === "lazyLid" && side === -1 ? 0.25 : 0) + (d.eyes === "sleepy" ? 0.4 : 0), blink), 0, 1);
      const lidB = clamp(fc.lidBot + (d.quirk === "squint" ? 0.2 : 0), 0, 1);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(d.eyeTilt * side);
      if (d.eyes === "dot" || d.eyes === "button") {
        const k = 1 - lidT;
        if (k < 0.15) { ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, w * 0.5, w, 0); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke(); }
        else { ctx.beginPath(); ctx.ellipse((fc.look[0] || 0) * w * 0.3 * dir, (fc.look[1] || 0) * w * 0.3, w * (fc.pupil > 1 ? 1.15 : 1), h * k, 0, 0, TAU); ctx.fillStyle = ink; ctx.fill(); if (d.eyes === "button") { ctx.beginPath(); ctx.arc(-w * 0.3, -h * 0.3 * k, w * 0.28, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); } }
        ctx.restore(); continue;
      }
      const eyeP = () => { ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); };
      eyeP(); ctx.fillStyle = pal.eyeWhite; ctx.fill();
      ctx.save(); eyeP(); ctx.clip();
      const pr = w * 0.55 * clamp(fc.pupil, 0.25, 1.6), px = (fc.look[0] || 0) * w * 0.45 * dir, py = (fc.look[1] || 0) * h * 0.4 + h * 0.08;
      ctx.beginPath();
      if (d.eyes === "pie") { ctx.ellipse(px, py, pr * 0.8, pr * 1.35, 0, 0, TAU); ctx.fillStyle = pal.pupil; ctx.fill(); ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, pr * 1.4, -1.9, -1.35); ctx.closePath(); ctx.fillStyle = pal.eyeWhite; ctx.fill(); }
      else { ctx.arc(px, py, pr, 0, TAU); ctx.fillStyle = pal.pupil; ctx.fill(); ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.38, pr * 0.32, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); }
      // lids in skin colour
      const lidCol = headFill;
      if (lidT > 0) { ctx.fillStyle = lidCol; ctx.fillRect(-w * 1.2, -h * 1.2, w * 2.4, h * 2.4 * lidT * 0.5 + h * 0.2 * lidT); ctx.beginPath(); ctx.moveTo(-w * 1.2, -h + h * 2 * lidT * 0.98); ctx.lineTo(w * 1.2, -h + h * 2 * lidT * 0.98); ctx.lineWidth = lw * 0.9; ctx.strokeStyle = pal.line; ctx.stroke(); }
      if (lidB > 0) { ctx.fillStyle = lidCol; ctx.fillRect(-w * 1.2, h - h * 2 * lidB * 0.5, w * 2.4, h * 2); }
      if (fc.tear) { ctx.fillStyle = "rgba(120,180,255,0.5)"; ctx.fillRect(-w, h * 0.35, w * 2, h); }
      ctx.restore();
      eyeP(); ctx.lineWidth = lw * 0.85; ctx.strokeStyle = pal.line; ctx.stroke();
      ctx.restore();
    }
    // brows
    if (d.brows !== "none") {
      for (const side of [-1, 1]) {
        if (d.quirk === "oneBrow" && side === 1 && d.brows === "bushy") continue;
        const b = (fc.brow[side < 0 ? 0 : 1] || 0) * ex, up = fc.browUp * ex;
        const cx = side * gap / 2, cy = ey - es * 1.55 - up * R * 0.18 + (b < 0 ? -b * R * 0.06 : 0);
        const ang = -side * b * 0.45; // angry: inner end down
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
        const bw = es * (d.brows === "bushy" ? 1.2 : 1), th = d.brows === "thick" ? lw * 2.4 : d.brows === "bushy" ? lw * 3.2 : d.brows === "dash" ? lw * 1.8 : lw * 1.1;
        ctx.beginPath(); ctx.moveTo(-bw, b > 0 ? 0 : 2); ctx.quadraticCurveTo(0, -th * 0.6 - (b > 0 ? 0 : 4), bw, b > 0 ? 4 : 0); ctx.lineCap = "round"; ctx.lineWidth = th; ctx.strokeStyle = dark ? "#fbfbf7" : d.family === "stick" ? pal.line : shade(pal.hair, -0.2); ctx.stroke();
        ctx.restore();
      }
    }
    // nose / muzzle
    const ns = R * 0.12 * d.noseSize, ny = ey + es * 1.1;
    const noseDx = 0.12 * R * dir;
    switch (d.nose) {
      case "button": ctx.beginPath(); ctx.ellipse(noseDx, ny, ns * 0.9, ns * 0.7, 0, 0, TAU); outlineFill(ctx, d, shade(headFill, -0.08), lw * 0.8); break;
      case "round": ctx.beginPath(); ctx.arc(noseDx, ny, ns * 1.2, 0, TAU); outlineFill(ctx, d, shade(headFill, 0.05), lw * 0.8); break;
      case "long": ctx.beginPath(); ctx.moveTo(noseDx - ns * 0.3, ny - ns * 1.6); ctx.quadraticCurveTo(noseDx + ns * 2.2 * dir, ny + ns * 0.4, noseDx - ns * 0.4 * dir, ny + ns * 0.6); ctx.lineWidth = lw * 0.9; ctx.strokeStyle = pal.line; ctx.stroke(); break;
      case "hook": ctx.beginPath(); ctx.moveTo(noseDx, ny - ns * 1.5); ctx.quadraticCurveTo(noseDx + ns * 2 * dir, ny - ns * 0.5, noseDx + ns * 0.4 * dir, ny + ns * 0.8); ctx.lineTo(noseDx - ns * 0.4 * dir, ny + ns * 0.5); ctx.closePath(); outlineFill(ctx, d, shade(headFill, -0.05), lw * 0.8); break;
      case "triangle": ctx.beginPath(); ctx.moveTo(noseDx, ny - ns); ctx.lineTo(noseDx + ns * 0.9 * dir, ny + ns * 0.6); ctx.lineTo(noseDx - ns * 0.3 * dir, ny + ns * 0.6); ctx.closePath(); outlineFill(ctx, d, shade(headFill, -0.05), lw * 0.8); break;
      case "cat": ctx.beginPath(); ctx.moveTo(noseDx - ns * 0.8, ny - ns * 0.3); ctx.lineTo(noseDx + ns * 0.8, ny - ns * 0.3); ctx.lineTo(noseDx, ny + ns * 0.6); ctx.closePath(); outlineFill(ctx, d, "#e8788a", lw * 0.7); break;
      case "ball": ctx.beginPath(); ctx.ellipse(noseDx, ny, ns * 1.3, ns * 1.0, 0, 0, TAU); outlineFill(ctx, d, "#1a1a1a", lw * 0.6); ctx.beginPath(); ctx.ellipse(noseDx - ns * 0.4, ny - ns * 0.35, ns * 0.4, ns * 0.25, 0, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill(); break;
      case "snout": ctx.beginPath(); ctx.ellipse(noseDx, ny + ns * 0.4, ns * 1.8, ns * 1.3, 0, 0, TAU); outlineFill(ctx, d, shade(headFill, -0.1), lw * 0.8); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(noseDx + s * ns * 0.6, ny + ns * 0.4, ns * 0.3, ns * 0.5, 0, 0, TAU); ctx.fillStyle = pal.line; ctx.fill(); } break;
      case "beak": ctx.beginPath(); ctx.moveTo(noseDx - ns, ny - ns * 0.6); ctx.lineTo(noseDx + ns * 3 * dir, ny + ns * 0.4); ctx.lineTo(noseDx - ns, ny + ns * 1.2); ctx.closePath(); outlineFill(ctx, d, "#f2a33a", lw * 0.8); break;
    }
    // mouth
    const m = fc.mouth, mw = R * d.mouthW * (m.w || 1) * (1 - 0.35 * (m.round || 0)), my = R * d.mouthY + (d.nose === "snout" || d.nose === "beak" ? ns * 1.2 : 0);
    const curve = clamp(m.curve * ex, -1.3, 1.3), open = clamp(m.open * Math.min(ex, 1.2), 0, 1.2), sk = (m.skew || 0) + (d.quirk === "crookedSmile" ? 0.35 : 0);
    const lx = -mw + noseDx * 0.5, rx = mw + noseDx * 0.5, ly = my - curve * R * 0.12 * (1 - sk * 0.6), ry = my - curve * R * 0.12 * (1 + sk * 0.6);
    const wob = m.wobble ? Math.sin((t || 0) * 30) * R * 0.02 : 0;
    if (open < 0.05) {
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(noseDx * 0.5, my + curve * R * 0.22 + wob, rx, ry);
      ctx.lineWidth = lw * 1.05; ctx.lineCap = "round"; ctx.strokeStyle = ink; ctx.stroke();
    } else {
      const oh = R * 0.42 * open;
      ctx.beginPath();
      if (m.round > 0.5) ctx.ellipse(noseDx * 0.5, my + oh * 0.3, mw * 0.55, oh * 0.6, 0, 0, TAU);
      else { ctx.moveTo(lx, ly); ctx.quadraticCurveTo(noseDx * 0.5, my + curve * R * 0.12 - oh * 0.15 * (curve < 0 ? -1 : 0.3), rx, ry); ctx.quadraticCurveTo(noseDx * 0.5, my + oh + curve * R * 0.18 + wob, lx, ly); }
      ctx.closePath(); ctx.fillStyle = "#5a1620"; ctx.fill();
      ctx.save(); ctx.clip();
      if (m.tongue) { ctx.beginPath(); ctx.ellipse(noseDx * 0.5, my + oh * 0.85, mw * 0.55, oh * 0.45, 0, 0, TAU); ctx.fillStyle = "#e5677a"; ctx.fill(); }
      if (m.teeth || d.detail === "teeth") { ctx.fillStyle = "#fff"; ctx.fillRect(lx, Math.min(ly, ry) - 6, rx - lx, R * 0.09 + 6); if (d.quirk === "gap") { ctx.fillStyle = "#5a1620"; ctx.fillRect(noseDx * 0.5 - 3, Math.min(ly, ry) - 6, 6, R * 0.09 + 6); } }
      ctx.restore();
      ctx.lineWidth = lw * 0.95; ctx.strokeStyle = ink; ctx.stroke();
    }
    if (d.detail === "teeth" && open < 0.05) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.rect(noseDx * 0.5 - R * 0.07, my + curve * R * 0.1, R * 0.14, R * 0.1); ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = pal.line; ctx.stroke(); }
    // cheeks, whiskers, freckles, sweat, tears, vein, hearts
    if (fc.cheek) for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * gap * 0.75, ey + es * 1.5, R * 0.16, R * 0.09, 0, 0, TAU); ctx.fillStyle = `rgba(235,90,110,${0.45 * fc.cheek})`; ctx.fill(); }
    if (d.detail === "whiskers" || d.species === "cat" || d.species === "mouse") for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(s * R * 0.35 + noseDx, ny + i * R * 0.06); ctx.lineTo(s * R * 1.1 + noseDx, ny + i * R * 0.13 - R * 0.02); ctx.lineWidth = lw * 0.5; ctx.strokeStyle = pal.line; ctx.stroke(); }
    if (d.detail === "freckles") { ctx.fillStyle = shade(headFill, -0.35); for (let i = 0; i < 8; i++) { const s = i < 4 ? -1 : 1; ctx.beginPath(); ctx.arc(s * gap * (0.55 + hash(d.seed, i, 2) * 0.35), ey + es * 1.2 + hash(d.seed, i, 3) * R * 0.15, R * 0.022, 0, TAU); ctx.fill(); } }
    if (d.detail === "mole") { ctx.beginPath(); ctx.arc(R * 0.42, my - R * 0.08, R * 0.035, 0, TAU); ctx.fillStyle = pal.line; ctx.fill(); }
    if (d.detail === "bandage") { ctx.save(); ctx.translate(-R * 0.5, -R * 0.45); ctx.rotate(-0.5); ctx.beginPath(); ctx.roundRect(-R * 0.22, -R * 0.07, R * 0.44, R * 0.14, 6); outlineFill(ctx, d, "#f1d3a8", lw * 0.6); ctx.restore(); }
    if (d.detail === "patch") { ctx.beginPath(); ctx.ellipse(-gap / 2, ey, es * 1.05, es * 1.15, 0, 0, TAU); ctx.fillStyle = "#111"; ctx.fill(); ctx.beginPath(); ctx.moveTo(-R, ey - R * 0.5); ctx.lineTo(R, ey - R * 0.25); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = "#111"; ctx.stroke(); }
    if (d.detail === "glasses") { for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * gap / 2, ey, es * 1.3, 0, TAU); ctx.lineWidth = lw * 0.9; ctx.strokeStyle = pal.line; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-gap / 2 + es * 1.3, ey); ctx.lineTo(gap / 2 - es * 1.3, ey); ctx.stroke(); }
    if (d.detail === "earring") { ctx.beginPath(); ctx.arc(R * sx * 0.98, R * 0.32, R * 0.07, 0, TAU); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = "#f4c430"; ctx.stroke(); }
    if (fc.sweat) { const k = fc.sweat; ctx.beginPath(); ctx.moveTo(R * 0.85, -R * 0.4); ctx.quadraticCurveTo(R * 0.98, -R * 0.15, R * 0.88, -R * 0.08); ctx.quadraticCurveTo(R * 0.76, -R * 0.15, R * 0.85, -R * 0.4); ctx.fillStyle = `rgba(150,210,255,${0.9 * k})`; ctx.fill(); ctx.lineWidth = lw * 0.5; ctx.strokeStyle = pal.line; ctx.stroke(); }
    if (fc.tear) for (const s of [-1, 1]) { const ph = ((t || 0) * 1.5 + (s > 0 ? 0.5 : 0)) % 1; ctx.beginPath(); ctx.ellipse(s * gap / 2, ey + es + ph * R * 0.6, R * 0.05, R * 0.08, 0, 0, TAU); ctx.fillStyle = `rgba(120,190,255,${(1 - ph) * fc.tear})`; ctx.fill(); }
    if (fc.vein) { ctx.save(); ctx.translate(R * 0.55, -R * 0.65); ctx.strokeStyle = "#d62828"; ctx.lineWidth = lw; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(R * 0.05, R * 0.05); ctx.quadraticCurveTo(R * 0.1, R * 0.15, R * 0.2, R * 0.1); ctx.stroke(); } ctx.restore(); }
    if (fc.hearts) for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * gap / 2, ey); const k = 1 + 0.12 * Math.sin((t || 0) * 12); ctx.scale(k, k); ctx.beginPath(); const hr = es * 0.9; ctx.moveTo(0, hr * 0.8); ctx.bezierCurveTo(-hr * 1.6, -hr * 0.2, -hr * 0.5, -hr * 1.3, 0, -hr * 0.45); ctx.bezierCurveTo(hr * 0.5, -hr * 1.3, hr * 1.6, -hr * 0.2, 0, hr * 0.8); ctx.fillStyle = "#e63946"; ctx.fill(); ctx.restore(); }
    // front hair & hats
    const hc = pal.hair, top = -R * sy * (1 + d.headTop);
    switch (d.hair) {
      case "tuft": for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.12, top + 4); ctx.quadraticCurveTo(i * R * 0.25 + R * 0.1, top - R * 0.35, i * R * 0.3 + R * 0.2, top - R * 0.2); ctx.lineWidth = lw * 1.2; ctx.strokeStyle = d.family === "stick" ? pal.line : hc; ctx.stroke(); } break;
      case "spikes": ctx.beginPath(); ctx.moveTo(-R * 0.9, top + R * 0.45); for (let i = 0; i <= 6; i++) { const x = -R * 0.9 + i * R * 0.3; ctx.lineTo(x + R * 0.15, top - R * 0.3 - hash(d.seed, i, 5) * R * 0.2); ctx.lineTo(x + R * 0.3, top + R * 0.15); } ctx.quadraticCurveTo(0, top + R * 0.2, -R * 0.9, top + R * 0.45); outlineFill(ctx, d, hc, lw); break;
      case "mohawk": ctx.beginPath(); ctx.moveTo(-R * 0.18, top + 6); ctx.lineTo(0, top - R * 0.6); ctx.lineTo(R * 0.18, top + 6); ctx.closePath(); outlineFill(ctx, d, pal.accent, lw); break;
      case "curl": ctx.beginPath(); ctx.arc(R * 0.05, top - R * 0.12, R * 0.15, 0.3, TAU * 0.95); ctx.lineWidth = lw * 1.2; ctx.strokeStyle = hc; ctx.stroke(); break;
      case "bun": ctx.beginPath(); ctx.arc(0, top - R * 0.15, R * 0.28, 0, TAU); outlineFill(ctx, d, hc, lw); // fallthrough to fringe
      case "bob": case "long": case "braids": case "pigtails": case "sidepart":
        ctx.beginPath(); ctx.moveTo(-R * sx * 1.02, -R * 0.05); ctx.bezierCurveTo(-R * sx, top - R * 0.15, R * sx, top - R * 0.15, R * sx * 1.02, -R * 0.05);
        ctx.quadraticCurveTo(R * 0.6, top + R * 0.25, d.hair === "sidepart" ? -R * 0.1 : 0, top + R * 0.4); ctx.quadraticCurveTo(-R * 0.6, top + R * 0.35, -R * sx * 1.02, -R * 0.05); outlineFill(ctx, d, hc, lw); break;
      case "afro": ctx.beginPath(); ctx.ellipse(0, top + R * 0.1, R * sx * 0.95, R * 0.35, 0, Math.PI, TAU); ctx.fillStyle = hc; ctx.fill(); break;
    }
    const hat = d.hat;
    if (hat !== "none") {
      ctx.save(); ctx.translate(0, top + R * 0.1);
      const hcol = pal.second, hl = lw;
      switch (hat) {
        case "beanie": ctx.beginPath(); ctx.ellipse(0, R * 0.05, R * sx * 1.02, R * 0.75, 0, Math.PI, TAU); outlineFill(ctx, d, hcol, hl); ctx.beginPath(); ctx.roundRect(-R * sx * 1.05, -R * 0.05, R * sx * 2.1, R * 0.22, 8); outlineFill(ctx, d, shade(hcol, -0.15), hl); ctx.beginPath(); ctx.arc(0, -R * 0.72, R * 0.15, 0, TAU); outlineFill(ctx, d, pal.accent, hl); break;
        case "cap": ctx.beginPath(); ctx.ellipse(0, R * 0.08, R * sx * 0.98, R * 0.6, 0, Math.PI, TAU); outlineFill(ctx, d, hcol, hl); ctx.beginPath(); ctx.ellipse(R * 0.75 * dir, R * 0.08, R * 0.6, R * 0.14, 0, 0, TAU); outlineFill(ctx, d, shade(hcol, -0.2), hl); break;
        case "bowler": ctx.beginPath(); ctx.ellipse(0, R * 0.05, R * 1.1, R * 0.16, 0, 0, TAU); outlineFill(ctx, d, "#222", hl); ctx.beginPath(); ctx.ellipse(0, 0, R * 0.7, R * 0.6, 0, Math.PI, TAU); outlineFill(ctx, d, "#2b2b2b", hl); break;
        case "tophat": ctx.beginPath(); ctx.ellipse(0, R * 0.05, R * 1.0, R * 0.15, 0, 0, TAU); outlineFill(ctx, d, "#1d1d1d", hl); ctx.beginPath(); ctx.rect(-R * 0.55, -R * 1.0, R * 1.1, R * 1.02); outlineFill(ctx, d, "#262626", hl); ctx.fillStyle = pal.accent; ctx.fillRect(-R * 0.55, -R * 0.2, R * 1.1, R * 0.16); break;
        case "straw": ctx.beginPath(); ctx.ellipse(0, R * 0.02, R * 1.5, R * 0.25, 0, 0, TAU); outlineFill(ctx, d, "#e9c46a", hl); ctx.beginPath(); ctx.ellipse(0, -R * 0.05, R * 0.75, R * 0.5, 0, Math.PI, TAU); outlineFill(ctx, d, "#f2d17d", hl); ctx.fillStyle = pal.accent; ctx.fillRect(-R * 0.75, -R * 0.18, R * 1.5, R * 0.13); break;
        case "bow": ctx.translate(R * 0.55, R * 0.05); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * R * 0.42, -R * 0.24); ctx.lineTo(s * R * 0.42, R * 0.24); ctx.closePath(); outlineFill(ctx, d, pal.accent, hl); } ctx.beginPath(); ctx.arc(0, 0, R * 0.1, 0, TAU); outlineFill(ctx, d, shade(pal.accent, -0.2), hl); break;
        case "helmet": ctx.beginPath(); ctx.ellipse(0, R * 0.2, R * sx * 1.12, R * 0.9, 0, Math.PI, TAU); ctx.closePath(); outlineFill(ctx, d, pal.accent, hl); ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 0.35, R * 0.25, R * 0.12, -0.5, 0, TAU); ctx.fill(); break;
        case "flower": ctx.translate(-R * 0.6, R * 0.1); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 1.256) * R * 0.15, Math.sin(i * 1.256) * R * 0.15, R * 0.12, R * 0.12, 0, 0, TAU); outlineFill(ctx, d, pal.accent, hl * 0.7); } ctx.beginPath(); ctx.arc(0, 0, R * 0.09, 0, TAU); outlineFill(ctx, d, "#f4d35e", hl * 0.7); break;
        case "beret": ctx.rotate(-0.2 * dir); ctx.beginPath(); ctx.ellipse(0, -R * 0.05, R * 0.95, R * 0.35, 0, 0, TAU); outlineFill(ctx, d, hcol, hl); ctx.beginPath(); ctx.moveTo(0, -R * 0.4); ctx.lineTo(0, -R * 0.55); ctx.lineWidth = hl; ctx.strokeStyle = pal.line; ctx.stroke(); break;
        case "fedora": { const hc2 = d.hatCol || "#1d2433", band = d.bandCol || "#f2f2ee";
          ctx.rotate(-0.06 * dir);
          ctx.beginPath(); ctx.ellipse(0, R * 0.08, R * 1.32, R * 0.2, 0, 0, TAU); outlineFill(ctx, d, hc2, hl);
          ctx.beginPath(); ctx.moveTo(-R * 0.72, R * 0.05); ctx.bezierCurveTo(-R * 0.8, -R * 0.55, -R * 0.55, -R * 0.78, -R * 0.15, -R * 0.62); ctx.quadraticCurveTo(0, -R * 0.5, R * 0.15, -R * 0.62);
          ctx.bezierCurveTo(R * 0.55, -R * 0.78, R * 0.8, -R * 0.55, R * 0.72, R * 0.05); ctx.closePath(); outlineFill(ctx, d, hc2, hl);
          ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(-R * 0.74, -R * 0.05); ctx.lineTo(R * 0.74, -R * 0.05); ctx.lineTo(R * 0.73, -R * 0.2); ctx.lineTo(-R * 0.75, -R * 0.2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 0.45, R * 0.18, R * 0.08, -0.5, 0, TAU); ctx.fill(); break; }
        case "headband": ctx.beginPath(); ctx.roundRect(-R * sx * 1.02, R * 0.12, R * sx * 2.04, R * 0.2, 6); outlineFill(ctx, d, pal.accent, hl); break;
        case "chef": ctx.beginPath(); ctx.roundRect(-R * 0.7, -R * 0.2, R * 1.4, R * 0.35, 6); outlineFill(ctx, d, "#fff", hl); ctx.beginPath(); ctx.arc(-R * 0.4, -R * 0.45, R * 0.35, 0, TAU); ctx.arc(0, -R * 0.6, R * 0.4, 0, TAU); ctx.arc(R * 0.4, -R * 0.45, R * 0.35, 0, TAU); outlineFill(ctx, d, "#fff", hl); break;
      }
      ctx.restore();
    }
  }

  // ---------------- full body. Local: feet line at y=0. Returns screen-space joints.
  function draw(ctx, d, o = {}) {
    const s = o.s ?? 1, dir = o.dir ?? 1, t = o.t;
    const p = typeof o.pose === "object" && o.pose && o.pose.armF ? Object.assign({}, P.stand, o.pose) : norm(o.pose);
    const fc = typeof o.face === "object" && o.face && o.face.mouth ? o.face : face(o.face || "neutral");
    const sq = 1 + (p.sq - 1) * d.bounce, hop = (p.hop || 0) * d.bounce;
    const pal = d.pal, stick = d.family === "stick";
    ctx.save(); ctx.translate(o.x ?? 0, o.y ?? 0); ctx.scale(s, s);
    // contact shadow stays on the ground, shrinks when we hop
    if (o.shadow !== false) { const sw = (d.bodyW + d.legLen * 0.4) * (1 - clamp(hop / 200, 0, 0.5)); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sw); g.addColorStop(0, "rgba(0,0,0,0.38)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.save(); ctx.scale(1, 0.2); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, sw, 0, TAU); ctx.fill(); ctx.restore(); }
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.translate(0, -hop);
    const legLen = d.legLen, hipY = -legLen * (0.92 + 0.08 * sq);
    const lean = p.lean * dir;
    const bodyH = d.bodyH * sq, bodyW = d.bodyW / Math.sqrt(sq);
    const hip = [0, hipY];
    const footY = -hipY;
    const hipW = stick ? 0 : bodyW * 0.45;
    // legs (back first)
    const legCol = ["overalls", "suit", "jersey", "shorts", "tshirt", "hoodie", "coat", "vest"].includes(d.outfit) && d.outfit !== "shorts" ? pal.second : d.species === "human" ? pal.skin : pal.species || pal.skin;
    const legDraw = (side, L) => {
      const base = [hip[0] + side * hipW * 0.6, hip[1]];
      const pts = legPts(base, legLen * 0.98, L[0] * deg, L[1], dir);
      const col = stick ? pal.line : (d.outfit === "shorts" || d.outfit === "dress" || d.outfit === "none" ? (pal.species || pal.skin) : legCol);
      tube(ctx, d, pts, d.limbW * (stick ? 1 : 1.05), stick ? (d.headFill === "#111" ? "#111" : pal.line) : col);
      if (!stick && d.outfit === "shorts") { const k = [lerp(pts[0][0], pts[1][0], 0.6), lerp(pts[0][1], pts[1][1], 0.6)]; tube(ctx, d, [pts[0], [lerp(pts[0][0], k[0], 0.5), lerp(pts[0][1], k[1], 0.5)], k], d.limbW * 1.9, pal.main); }
      // foot
      const [fx, fy] = pts[2], fs = d.footSize;
      if (d.feet !== "none" || !stick) {
        ctx.beginPath();
        if (d.feet === "shoes" || d.feet === "sneakers") ctx.ellipse(fx + 14 * fs * dir, fy - 2, 26 * fs, 15 * fs, 0, 0, TAU);
        else if (d.feet === "boots") ctx.roundRect(fx - 12 * fs + (dir > 0 ? 0 : -12 * fs), fy - 24 * fs, 36 * fs, 26 * fs, 8);
        else ctx.ellipse(fx + 8 * dir, fy - 2, 14 * fs, 9 * fs, 0, 0, TAU);
        outlineFill(ctx, d, d.feet === "none" || d.feet === "bare" ? (pal.species || pal.skin) : d.feet === "sneakers" ? "#f4f4f4" : shade(pal.main, -0.45), d.lineW || 4);
        if (d.feet === "shoes") { ctx.beginPath(); ctx.ellipse(fx + 6 * fs * dir, fy - 8 * fs, 8 * fs, 4 * fs, 0, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fill(); }
      }
      return pts[2];
    };
    const footB = legDraw(-1, p.legB), footF = legDraw(1, p.legF);
    // body, leaning around the hip
    ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(lean);
    // tail (behind body)
    if (d.tail !== "none") {
      const w = Math.sin((t || 0) * 3 + d.seed) * 0.4;
      ctx.save(); ctx.translate(-bodyW * 0.6 * dir, -bodyH * 0.15);
      const tcol = pal.species || pal.skin; ctx.lineCap = "round";
      if (d.tail === "puff") { ctx.beginPath(); ctx.arc(-6 * dir, 0, 20, 0, TAU); outlineFill(ctx, d, "#f6f6f2"); }
      else if (d.tail === "curl") { ctx.beginPath(); ctx.arc(-14 * dir, -6, 12, 0, TAU * 0.85); ctx.lineWidth = 6; ctx.strokeStyle = "#e89aa8"; ctx.stroke(); }
      else { const len = d.tail === "fox" ? 110 : d.tail === "thin" ? 120 : d.tail === "feather" ? 60 : 95; const pts = [[0, 0], [-len * 0.7 * dir, 20 + w * 30], [-len * dir, -len * 0.7 + w * 40]]; tube(ctx, d, pts, d.tail === "fox" ? 26 : d.tail === "thin" ? 5 : 13, d.tail === "fox" ? "#e07a2f" : tcol); if (d.tail === "fox") { ctx.beginPath(); ctx.arc(pts[2][0], pts[2][1], 13, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); } }
      ctx.restore();
    }
    let shoulderY;
    if (stick) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -bodyH); ctx.lineCap = "round"; ctx.lineWidth = d.limbW; ctx.strokeStyle = d.headFill === "#111" ? "#111" : pal.line; ctx.stroke();
      if (d.outfit === "dress") { ctx.beginPath(); ctx.moveTo(-6, -bodyH * 0.75); ctx.lineTo(6, -bodyH * 0.75); ctx.lineTo(bodyH * 0.35, 10); ctx.lineTo(-bodyH * 0.35, 10); ctx.closePath(); ctx.fillStyle = pal.main; ctx.fill(); }
      if (d.outfit === "tshirt" || d.outfit === "coat") { ctx.beginPath(); ctx.roundRect(-d.limbW * 1.6, -bodyH * 1.0, d.limbW * 3.2, bodyH * (d.outfit === "coat" ? 1.05 : 0.72), d.limbW); ctx.fillStyle = pal.main; ctx.fill(); }
      if (d.outfit === "scarfOnly" || d.detail === "scarf") { ctx.beginPath(); ctx.roundRect(-18, -bodyH - 6, 36, 14, 6); ctx.fillStyle = pal.accent; ctx.fill(); ctx.fillRect(-14 * dir, -bodyH, 10, 40); }
      shoulderY = -bodyH * 0.92;
    } else {
      ctx.save(); bodyPath(ctx, d, bodyW, bodyH);
      const bodyCol = d.outfit === "none" ? (pal.species || pal.skin) : d.outfit === "overalls" ? pal.second : pal.main;
      outlineFill(ctx, d, bodyCol);
      ctx.save(); bodyPath(ctx, d, bodyW, bodyH); ctx.clip();
      // shading + outfit details clipped to the body
      const g = ctx.createLinearGradient(-bodyW, 0, bodyW, 0); g.addColorStop(0, "rgba(255,255,255,0.18)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.22)"); ctx.fillStyle = g; ctx.fillRect(-bodyW * 2, -bodyH * 1.3, bodyW * 4, bodyH * 1.4);
      if (d.outfit === "none" && d.species !== "human") { ctx.beginPath(); ctx.ellipse(0, -bodyH * 0.42, bodyW * 0.55, bodyH * 0.42, 0, 0, TAU); ctx.fillStyle = pal.belly; ctx.fill(); }
      if (d.outfit === "overalls") { ctx.fillStyle = pal.main; ctx.fillRect(-bodyW * 2, -bodyH * 1.3, bodyW * 4, bodyH * 0.55); ctx.fillStyle = pal.second; ctx.fillRect(-bodyW * 0.45, -bodyH * 0.85, bodyW * 0.9, bodyH); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * bodyW * 0.3, -bodyH * 0.7, 6, 0, TAU); ctx.fillStyle = "#f4c430"; ctx.fill(); } }
      if (d.outfit === "dress") { ctx.fillStyle = shade(pal.main, 0.15); ctx.fillRect(-bodyW * 2, -bodyH * 0.45, bodyW * 4, bodyH * 0.5); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-bodyW + i * bodyW * 0.25, -bodyH * 0.25 + (i % 2) * 18, 5, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill(); } }
      if (d.outfit === "coat" || d.outfit === "suit") { ctx.strokeStyle = pal.line; ctx.lineWidth = d.lineW * 0.7; ctx.beginPath(); ctx.moveTo(0, -bodyH); ctx.lineTo(0, 0); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(7 * dir, -bodyH * (0.75 - i * 0.22), 5, 0, TAU); ctx.fillStyle = pal.accent; ctx.fill(); } if (d.outfit === "suit") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(-bodyW * 0.25, -bodyH); ctx.lineTo(bodyW * 0.25, -bodyH); ctx.lineTo(0, -bodyH * 0.6); ctx.fill(); } }
      if (d.outfit === "vest") { ctx.fillStyle = pal.second; ctx.fillRect(-bodyW * 2, -bodyH * 1.3, bodyW * 1.6, bodyH * 1.4); ctx.fillRect(bodyW * 0.4, -bodyH * 1.3, bodyW * 2, bodyH * 1.4); }
      if (d.outfit === "jersey") { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `900 ${bodyH * 0.45}px Inter, sans-serif`; ctx.textAlign = "center"; ctx.fillText(String(1 + Math.floor(hash(d.seed, 2, 2) * 98)), 0, -bodyH * 0.3); }
      if (d.outfit === "hoodie") { ctx.fillStyle = shade(pal.main, -0.15); ctx.beginPath(); ctx.roundRect(-bodyW * 0.45, -bodyH * 0.45, bodyW * 0.9, bodyH * 0.3, 10); ctx.fill(); }
      if (d.outfit === "tshirt") { ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(0, -bodyH * 0.6, bodyW * 0.22, 0, TAU); ctx.fill(); }
      ctx.restore(); ctx.restore();
      if (d.detail === "backpack") { ctx.beginPath(); ctx.roundRect(-bodyW * 1.1 * dir - (dir > 0 ? 0 : bodyW * 0.6), -bodyH * 0.9, bodyW * 0.6, bodyH * 0.7, 12); outlineFill(ctx, d, pal.accent); }
      shoulderY = -bodyH * (d.body === "barrel" || d.body === "bean" ? 0.85 : 0.9);
    }
    const sw = stick ? d.limbW * 0.6 : bodyW * (d.body === "tri" ? 0.85 : d.body === "pear" ? 0.55 : 0.7);
    // arms (back arm first, then head, then front arm)
    const armCol = stick ? (d.headFill === "#111" ? "#111" : pal.line) : ["none", "dress", "vest"].includes(d.outfit) ? (pal.species || pal.skin) : (d.outfit === "overalls" ? pal.main : pal.main);
    const hand = (pts, col) => {
      const [hx, hy] = pts[2], r = d.limbW * 1.25 + 4;
      if (d.hands === "glove") { ctx.beginPath(); ctx.arc(hx, hy, r * 1.2, 0, TAU); outlineFill(ctx, d, "#fbfbf7", d.lineW); ctx.beginPath(); ctx.arc(hx + r * 0.8 * dir, hy - r * 0.6, r * 0.5, 0, TAU); outlineFill(ctx, d, "#fbfbf7", d.lineW * 0.8); const a = Math.atan2(pts[2][1] - pts[1][1], pts[2][0] - pts[1][0]); ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(-r * 1.15, 0, r * 0.35, r * 0.9, 0, 0, TAU); outlineFill(ctx, d, "#fbfbf7", d.lineW * 0.8); ctx.restore(); }
      else if (d.hands === "mitten") { ctx.beginPath(); ctx.ellipse(hx, hy, r, r * 1.1, 0, 0, TAU); outlineFill(ctx, d, col); }
      else if (d.hands === "hand") { ctx.beginPath(); ctx.arc(hx, hy, r * 0.85, 0, TAU); outlineFill(ctx, d, pal.species || pal.skin); ctx.beginPath(); ctx.arc(hx + r * 0.6 * dir, hy - r * 0.5, r * 0.35, 0, TAU); outlineFill(ctx, d, pal.species || pal.skin, d.lineW * 0.7); }
      else if (d.hands === "dot") { ctx.beginPath(); ctx.arc(hx, hy, d.limbW * 0.9, 0, TAU); ctx.fillStyle = armCol; ctx.fill(); }
    };
    const armDraw = (side, A) => {
      const base = [side * sw * 0.9 * dir, shoulderY + (stick ? 0 : 6)];
      const pts = limb(base, d.armLen, A[0] * deg, A[1], dir);
      tube(ctx, d, pts, d.limbW * (stick ? 1 : 0.95), armCol);
      if (!stick && !["none", "dress", "vest", "tshirt"].includes(d.outfit)) { /* full sleeve */ }
      else if (!stick && d.outfit === "tshirt") { const k = [lerp(pts[0][0], pts[2][0], 0.35), lerp(pts[0][1], pts[2][1], 0.35)]; tube(ctx, d, [pts[0], [lerp(pts[0][0], k[0], 0.5), lerp(pts[0][1], k[1], 0.5)], k], d.limbW * 1.7, pal.main); }
      if (!stick && ["coat", "suit", "hoodie", "overalls", "jersey"].includes(d.outfit)) { const k = [lerp(pts[0][0], pts[2][0], 0.85), lerp(pts[0][1], pts[2][1], 0.85)]; /* cuff */ ctx.beginPath(); ctx.arc(k[0], k[1], d.limbW * 0.75, 0, TAU); ctx.fillStyle = shade(armCol, -0.2); ctx.fill(); }
      if (d.species !== "human" && ["none", "dress", "vest"].includes(d.outfit) || d.species !== "human") { /* fur arms keep species colour if no sleeves */ }
      hand(pts, armCol);
      return pts[2];
    };
    const handB = armDraw(-1, p.armB);
    const raised = Math.abs(p.armF[0]) > 115; let handF = null;
    if (raised) handF = armDraw(1, p.armF);
    // neck + head
    const R = d.headR;
    const neck = d.neck || 0;
    const headY = shoulderY - R * (stick ? 1.12 : 0.82) - neck;
    if (neck > 0) tube(ctx, d, [[0, shoulderY + 4], [0, shoulderY - neck * 0.5], [0, headY + R * 0.7]], d.limbW * 1.05, armCol);
    ctx.save(); ctx.translate(0, headY); ctx.rotate((p.head || 0) * dir);
    if (d.detail === "scarf" && !stick) { ctx.beginPath(); ctx.roundRect(-R * 0.75, R * 0.7, R * 1.5, R * 0.32, 10); outlineFill(ctx, d, pal.accent); ctx.beginPath(); ctx.roundRect(-R * 0.6 * dir - 12, R * 0.85, 26, R * 0.9, 8); outlineFill(ctx, d, pal.accent); }
    if ((d.detail === "tie" || d.detail === "bowtie") && !stick) { ctx.beginPath(); if (d.detail === "tie") { ctx.moveTo(-10, R * 0.85); ctx.lineTo(10, R * 0.85); ctx.lineTo(14, R * 1.8); ctx.lineTo(0, R * 2.05); ctx.lineTo(-14, R * 1.8); } else { ctx.moveTo(0, R * 0.95); ctx.lineTo(-24, R * 0.8); ctx.lineTo(-24, R * 1.1); ctx.lineTo(0, R * 0.95); ctx.lineTo(24, R * 0.8); ctx.lineTo(24, R * 1.1); } ctx.closePath(); outlineFill(ctx, d, pal.accent); }
    drawHead(ctx, d, R, fc, t, dir);
    ctx.restore();
    if (!raised) handF = armDraw(1, p.armF);
    ctx.restore(); // body lean
    ctx.restore();
    // joints in screen space (approximate, ignores lean for hands)
    const toS = (pt) => { const c = Math.cos(lean), sn = Math.sin(lean); const x = pt[0] * c - pt[1] * sn + hip[0], y = pt[0] * sn + pt[1] * c + hip[1] - hop; return [(o.x ?? 0) + x * s, (o.y ?? 0) + y * s]; };
    return { handF: toS(handF), handB: toS(handB), head: toS([0, headY]), headR: R * s, footF: [(o.x ?? 0) + footF[0] * s, (o.y ?? 0) + (footF[1] - hop) * s], footB: [(o.x ?? 0) + footB[0] * s, (o.y ?? 0) + (footB[1] - hop) * s], height: (-(headY - R) - hipY) * s };
  }

  function head(ctx, d, x, y, s, fcIn, t, dir = 1) {
    const fc = typeof fcIn === "object" && fcIn && fcIn.mouth ? fcIn : face(fcIn || "neutral");
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawHead(ctx, d, d.headR, fc, t, dir); ctx.restore();
  }

  // ---------------- the character sheet (shown to the student before the film is made)
  function sheet(ctx, d, o = {}) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#f5efe3"); bg.addColorStop(1, "#e6dccb"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 1; for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = "#1a1a1a"; ctx.font = '400 84px "Lilita One", sans-serif'; ctx.textAlign = "left"; ctx.fillText(o.name || d.name || "???", 60, 110);
    ctx.font = '600 34px Inter, sans-serif'; ctx.fillStyle = "#555"; ctx.fillText(o.line || `${d.family} · ${d.species}`, 64, 160);
    const scale = Math.min(1.9, 640 / (d.legLen + d.bodyH + d.headR * 2.4));
    draw(ctx, d, { x: 330, y: 960, s: scale, dir: 1, pose: "stand", face: "neutral", t: 0.5 });
    draw(ctx, d, { x: 820, y: 960, s: scale * 0.9, dir: 1, pose: o.action || run(0.25), face: o.actionFace || "determined", t: 0.5 });
    const moods = o.moods || ["happy", "angry", "scared", "sad", "surprised", "smug"];
    moods.forEach((m, i) => { const cx = 1180 + (i % 3) * 230, cy = 330 + Math.floor(i / 3) * 290; head(ctx, d, cx, cy, 95 / d.headR, m, 0.5); ctx.font = '700 28px Inter, sans-serif'; ctx.fillStyle = "#444"; ctx.textAlign = "center"; ctx.fillText(o.moodLabels ? o.moodLabels[i] : m, cx, cy + 150); });
    const sw = [d.pal.main, d.pal.second, d.pal.accent, d.pal.species || d.pal.skin, d.pal.hair];
    sw.forEach((c, i) => { ctx.beginPath(); ctx.roundRect(1180 + i * 110 - 50, 930, 90, 70, 14); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#1a1a1a"; ctx.stroke(); });
    ctx.textAlign = "left";
  }

  window.CHAR = { invent, draw, head, sheet, face, mixFace, MOODS, P, act, mix, walk, run, sneak, palette, shade, hsl, FAM };
})();
