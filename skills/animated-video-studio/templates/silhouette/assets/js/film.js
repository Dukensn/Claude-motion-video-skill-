// film.js — the shot list. THIS is the file you rewrite for every new film.
// Demo (36 s), silhouette style: serif card → pinning a list → the list → a dusty guitar ("someday.") → a declined call → closing card → title.
// Every shot: shot(start, end, (ctx, lt, t) => { ... }) where lt = time inside the shot, t = film time.
(function () {
  const { W, H, G, clamp, lerp, E, prog, key, noise1 } = F;
  const { sil, close } = SIL;
  const { post } = X;
  const SERIF = "'EB Garamond', Georgia, serif";
  const COMIC = "'Comic Neue', sans-serif";
  const DURATION = 36; // keep in sync with data-duration in index.html

  function cam(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  const screen = (ctx, f) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); f(); ctx.restore(); };

  // italic serif interstitial on black
  function card(ctx, lines, t, a, b, o = {}) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (t < a || t > b) return;
    const out = clamp((b - t) / 0.6, 0, 1);
    lines.forEach((l, i) => {
      const la = a + (i * (o.stagger ?? 1.6));
      const k = clamp((t - la) / 0.9, 0, 1);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = E.out2(k) * out;
      ctx.font = `italic 400 ${o.size || 66}px ${SERIF}`; ctx.fillStyle = "#e9e9e4"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * (o.size || 66) * 1.35);
      ctx.restore();
    });
  }
  // floating dialogue, white comic type over a soft dark band
  function speak(ctx, text, x, y, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const k = clamp((t - a) / 0.25, 0, 1), out = clamp((b - t) / 0.3, 0, 1);
    const size = o.size || 56;
    ctx.save();
    ctx.globalAlpha = k * out;
    ctx.font = `700 ${size}px ${COMIC}`;
    const w = ctx.measureText(text).width;
    ctx.filter = "blur(18px)"; ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(x, y, w / 2 + 50, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.filter = "none";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 7; ctx.strokeStyle = "rgba(10,10,14,0.9)"; ctx.lineJoin = "round"; ctx.strokeText(text, x, y + (1 - k) * 6);
    ctx.fillStyle = o.color || "#ffffff"; ctx.fillText(text, x, y + (1 - k) * 6);
    ctx.restore();
  }
  function bokehBg(ctx, warm) {
    ctx.fillStyle = FLAT.grad(ctx, 0, 0, 0, H, [[0, warm ? "#3a3438" : "#2a2e38"], [1, warm ? "#1c181c" : "#15171d"]]); ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) FLAT.glow(ctx, 180 + i * 230, 260 + (i % 3) * 200, 120, warm ? "rgba(255,200,140,0.12)" : "rgba(160,180,230,0.10)");
  }

  const SHOTS = [];
  const shot = (a, b, f, o = {}) => SHOTS.push(Object.assign({ a, b, f }, o));
  const ITEMS = ["learn guitar", "write a book", "call dad more", "take dad to the ocean"];

  // 0 — cold open card
  shot(0, 6.0, (ctx, lt, t) => card(ctx, ["Someday is the most comfortable word we have."], t, 0.5, 5.6, { size: 64 }), { look: { vignette: 0 } });

  // 1 — pinning the list
  shot(6.0, 12.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1240, 560, key(lt, [[0, 1.35], [6, 1.45, E.sine]]));
    FLAT.apartment(ctx, { dust: 0.2 });
    const reach = prog(lt, 1.0, 2.2, E.out3) * (1 - prog(lt, 4.4, 5.4));
    sil(ctx, { kind: "noah", x: 1130, y: 840, s: 1.1, face: 0.6, armL: [0.1, 0.1], armR: [lerp(-0.2, 2.9, reach), lerp(-0.1, 0.4, reach)],
      e: { eyes: "open", look: [0.8, -0.5], brow: 0.1 } });
    ctx.restore();
  });
  // 2 — the list
  shot(12.0, 18.0, (ctx, lt, t) => { FLAT.list(ctx, { items: ITEMS, reveal: prog(lt, 0.5, 4.5, E.lin) }); });

  // 3 — the guitar gathers dust
  shot(18.0, 22.0, (ctx, lt, t) => {
    ctx.save(); cam(ctx, 1060, 640, key(lt, [[0, 2.2], [4, 2.35, E.sine]]));
    FLAT.apartment(ctx, { dust: 1 });
    ctx.restore();
    speak(ctx, "someday.", 1300, 300, t, 18.8, 21.6);
  });
  // 4 — a declined call
  shot(22.0, 26.0, (ctx, lt, t) => {
    bokehBg(ctx, false);
    FLAT.phone(ctx, 1000, 560, 0.86, -0.04, { mode: "call", date: "Tue, Mar 4" });
    const tap = prog(t, 24.6, 25.1, E.io2);
    FLAT.thumb(ctx, lerp(1040, 900, tap), lerp(960, 850, tap));
  });
  // 5 — closing card
  shot(26.0, 31.0, (ctx, lt, t) => card(ctx, ["Someday isn't a day of the week."], t, 26.4, 30.6), { look: { vignette: 0 } });

  // 6 — title
  shot(31.0, 36.0, (ctx, lt, t) => {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const a = prog(lt, 0.3, 1.2) * (1 - prog(lt, 4.2, 5.0));
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `400 120px ${SERIF}`; ctx.fillStyle = "#f2f2ee"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.letterSpacing = "26px"; ctx.fillText("SOMEDAY", W / 2 + 13, 490); ctx.letterSpacing = "0px";
    ctx.globalAlpha = a * prog(lt, 1.4, 2.2);
    ctx.font = `italic 400 46px ${SERIF}`; ctx.fillStyle = "#d9d9d4";
    ctx.fillText("Pick one thing.", W / 2, 600);
    ctx.restore();
  }, { look: { vignette: 0 } });

  function renderAt(ctx, t) {
    t = clamp(t, 0, DURATION - 1 / 60);
    G.t = t; G.frame = Math.round(t * 30); G.boil = Math.floor(t * 12);
    let s = SHOTS[0];
    for (const sh of SHOTS) if (t >= sh.a && t < sh.b) s = sh;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save(); s.f(ctx, t - s.a, t); ctx.restore();
    let black = 0;
    const FADES = [[6.0, 0.8], [12.0, 0.4], [26.0, 0.5]]; // [start, length]: fade in from black
    for (const [ft, d] of FADES) if (t >= ft && t < ft + d) black = Math.max(black, 1 - (t - ft) / d);
    const DIPS = [[25.4, 26.0]]; // [a, b]: fade out to black
    for (const [a, b] of DIPS) if (t >= a && t < b) black = Math.max(black, (t - a) / (b - a));
    post(ctx, Object.assign({ black, vignette: 0.5, grain: 0.035 }, s.look || {}));
    ctx.restore();
  }

  window.FILM = { renderAt, DURATION, SHOTS, events: () => ({ taps: [] }) };
})();
