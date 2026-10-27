// style.js — STICK vs. A DIGITAL WORLD: a coloured stick figure lives inside software (a spreadsheet, a code editor,
// a desktop, a platform-game level) and fights, uses and breaks it. Wordless action-comedy.
// Built on the stickman engine (STICK poses, walk/run, WORLD.FX impacts, WORLD.cam). Pure functions of their arguments.
(function () {
  const { W, H, clamp, lerp, E, prog, mulberry, noise1 } = F;
  const TAU = Math.PI * 2;
  const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

  // ---------- the figure: a faceless coloured stick figure (filled head), STICK poses
  // o: same as STICK.draw + col (the figure's colour). Returns the joints.
  function stick(ctx, o) {
    const col = o.col || "#00b4d8";
    return STICK.draw(ctx, Object.assign({}, o, { ink: col, look: Object.assign({ headFill: col }, o.look || {}), face: o.face || { mood: "neutral" }, flatBack: true }));
  }

  // ---------- typed text helper: the part of `text` typed by time t (starting at a, cps chars/s)
  const typed = (text, t, a, cps = 18) => text.slice(0, clamp(Math.floor((t - a) * cps), 0, text.length));

  // ---------- SPREADSHEET
  // o: {file, formula, cols (12), rows (18), cw (160), ch (52), x0 (70), y0 (170), data: {"B2": "931", ...}, sel: [c0,r0,c1,r1], selCol, hide: {"C4":1}}
  // returns {cell(c, r) -> [x, y] centre, rect(c, r) -> [x, y, w, h]}
  function sheet(ctx, o = {}) {
    const cw = o.cw || 160, ch = o.ch || 52, ox = o.x0 ?? 70, oy = o.y0 ?? 170, cols = o.cols || Math.ceil((W - ox) / cw), rows = o.rows || Math.ceil((H - oy) / ch);
    ctx.fillStyle = "#f7f8fa"; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.fillStyle = o.brand || "#1f7a4d"; ctx.fillRect(-W, 0, W * 3, 70);
    ctx.fillStyle = "#e8eaed"; ctx.fillRect(-W, 70, W * 3, 56); ctx.fillStyle = "#fff"; ctx.fillRect(150, 80, Math.min(900, W - 200), 36);
    ctx.font = "600 26px Inter"; ctx.fillStyle = "#202124"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.fillText("fx   " + (o.formula || ""), 165, 108);
    ctx.font = "700 28px Inter"; ctx.fillStyle = "#fff"; ctx.fillText(o.file || "Book1.xlsx", 30, 46);
    ctx.fillStyle = "#eef0f3"; ctx.fillRect(-W, 126, W * 3, 44); ctx.fillRect(-W, 126, W + ox, H * 2);
    ctx.font = "600 22px Inter"; ctx.fillStyle = "#5f6368"; ctx.textAlign = "center";
    for (let c = 0; c < cols; c++) ctx.fillText(String.fromCharCode(65 + (c % 26)), ox + c * cw + cw / 2, 156);
    for (let r = 0; r < rows; r++) ctx.fillText(String(r + 1), ox / 2, oy + r * ch + 34);
    ctx.strokeStyle = "#dadce0"; ctx.lineWidth = 1.5;
    for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(ox + c * cw, 126); ctx.lineTo(ox + c * cw, oy + rows * ch); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, oy + r * ch); ctx.lineTo(ox + cols * cw, oy + r * ch); ctx.stroke(); }
    const rect = (c, r) => [ox + c * cw, oy + r * ch, cw, ch];
    const cell = (c, r) => [ox + c * cw + cw / 2, oy + r * ch + ch / 2];
    ctx.font = "500 24px Inter"; ctx.textAlign = "right";
    for (const [ref, v] of Object.entries(o.data || {})) {
      if (o.hide && o.hide[ref]) continue;
      const c = ref.charCodeAt(0) - 65, r = parseInt(ref.slice(1), 10) - 1; const [x, y] = rect(c, r);
      ctx.fillStyle = String(v).startsWith("#") ? "#d93025" : "#3c4043"; ctx.fillText(String(v), x + cw - 14, y + 34);
    }
    if (o.sel) { const [c0, r0, c1, r1] = o.sel; const [x, y] = rect(c0, r0); ctx.strokeStyle = o.selCol || "#1a73e8"; ctx.lineWidth = 5; ctx.strokeRect(x, y, (c1 - c0 + 1) * cw, (r1 - r0 + 1) * ch);
      ctx.fillStyle = o.selCol || "#1a73e8"; ctx.fillRect(x + (c1 - c0 + 1) * cw - 7, y + (r1 - r0 + 1) * ch - 7, 14, 14); }
    ctx.textAlign = "left";
    return { cell, rect, cw, ch };
  }
  // a loose cell (flying, falling, kicked): centre x,y, rotation a
  function cell(ctx, x, y, text, a = 0, o = {}) {
    const cw = o.cw || 160, ch = o.ch || 52;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = o.fill || "#fff"; ctx.fillRect(-cw / 2, -ch / 2, cw, ch); ctx.strokeStyle = o.line || "#9aa0a6"; ctx.lineWidth = 2; ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
    ctx.font = "600 24px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = String(text).startsWith("#") ? "#d93025" : "#3c4043"; ctx.fillText(String(text), 0, 1);
    ctx.restore();
  }
  // an error badge (#REF!, #DIV/0!, SyntaxError…) — the usual villain
  function errorBox(ctx, x, y, text, a = 0, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); const s = o.s || 1; ctx.scale(s, s);
    ctx.font = "800 50px Inter"; const w = ctx.measureText(text).width + 70;
    ctx.fillStyle = o.fill || "#fce8e6"; ctx.fillRect(-w / 2, -55, w, 110); ctx.strokeStyle = o.col || "#d93025"; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -55, w, 110);
    ctx.fillStyle = o.col || "#d93025"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 3);
    if (o.eyes) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 34, -82, 18, 14, 0, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.beginPath(); ctx.arc(sd * 34 + (o.look || 0) * 8, -80, 7, 0, TAU); ctx.fillStyle = "#111"; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-56, -104); ctx.lineTo(-14, -92); ctx.moveTo(56, -104); ctx.lineTo(14, -92); ctx.lineWidth = 6; ctx.strokeStyle = o.col || "#d93025"; ctx.stroke(); }
    ctx.restore();
  }

  // ---------- CODE EDITOR (dark): lines of code with simple syntax colours, a caret, an output panel
  // o: {lines: [...], x, y, size, caret: [line, col], out: "text", title}
  const KW = /\b(def|return|if|else|elif|for|while|in|import|from|class|True|False|None|print|let|const|function|var)\b/;
  function code(ctx, o = {}) {
    ctx.fillStyle = o.bg || "#0d0f14"; ctx.fillRect(-W, -H, W * 3, H * 3);
    if (o.title !== false) { ctx.fillStyle = "#1a1d24"; ctx.fillRect(-W, 0, W * 3, 60); ctx.font = "600 24px Inter"; ctx.fillStyle = "#9aa4b2"; ctx.textAlign = "left"; ctx.fillText(o.title || "main.py", 40, 39);
      for (const [i, c] of ["#ff5f56", "#ffbd2e", "#27c93f"].entries()) { ctx.beginPath(); ctx.arc(W - 120 + i * 32, 30, 9, 0, TAU); ctx.fillStyle = c; ctx.fill(); } }
    const size = o.size || 44, x0 = o.x ?? 120, y0 = o.y ?? 160, lh = size * 1.45;
    ctx.font = `500 ${size}px "DejaVu Sans Mono", Menlo, Consolas, monospace`; ctx.textBaseline = "alphabetic";
    (o.lines || []).forEach((ln, i) => {
      ctx.fillStyle = "#4b5263"; ctx.textAlign = "right"; ctx.fillText(String(i + 1), x0 - 40, y0 + i * lh); ctx.textAlign = "left";
      let x = x0; for (const tok of ln.split(/(\s+|[()[\]{}.,:=+\-*/"'])/).filter((s) => s !== "")) {
        ctx.fillStyle = KW.test(tok) ? "#c678dd" : /^\d+$/.test(tok) ? "#d19a66" : /^["']/.test(tok) ? "#98c379" : /^[()[\]{}]$/.test(tok) ? "#e5c07b" : "#e6e6e6";
        ctx.fillText(tok, x, y0 + i * lh); x += ctx.measureText(tok).width;
      }
    });
    if (o.caret && Math.floor((o.t || 0) * 2) % 2 === 0) { const [li, col] = o.caret; const pre = (o.lines[li] || "").slice(0, col); ctx.fillStyle = "#e6e6e6"; ctx.fillRect(x0 + ctx.measureText(pre).width + 2, y0 + li * lh - size * 0.85, 4, size); }
    if (o.out != null) { ctx.fillStyle = "#14171e"; ctx.fillRect(-W, H - 220, W * 3, 220); ctx.font = "600 26px Inter"; ctx.fillStyle = "#6b7280"; ctx.fillText("OUTPUT", 40, H - 180);
      ctx.font = `500 40px "DejaVu Sans Mono", monospace`; ctx.fillStyle = o.outCol || "#e6e6e6"; ctx.fillText(o.out, 40, H - 110); }
    return { lineY: (i) => y0 + i * lh, x0, lh, charW: ctx.measureText("m").width };
  }

  // ---------- DESKTOP: wallpaper, icons, windows, taskbar, the mouse cursor
  function desktop(ctx, o = {}) {
    ctx.fillStyle = lg(ctx, 0, 0, W, H, [[0, o.wall0 || "#3a7bd5"], [1, o.wall1 || "#6dd5ed"]]); ctx.fillRect(-W, -H, W * 3, H * 3);
    for (const [i, name] of (o.icons || ["Folder", "Notes", "Trash"]).entries()) icon(ctx, 90, 120 + i * 170, name);
    ctx.fillStyle = "rgba(20,24,34,0.85)"; ctx.fillRect(-W, H - 70, W * 3, 70);
    ctx.fillStyle = "#fff"; ctx.font = "700 26px Inter"; ctx.textAlign = "right"; ctx.fillText(o.clock || "9:41", W - 40, H - 26); ctx.textAlign = "left";
    ctx.beginPath(); ctx.arc(50, H - 35, 20, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
  }
  function icon(ctx, x, y, name) {
    ctx.save(); ctx.translate(x, y);
    if (name === "Trash") { ctx.fillStyle = "#e8edf3"; ctx.fillRect(-32, -30, 64, 74); ctx.fillStyle = "#c3ccd8"; ctx.fillRect(-40, -42, 80, 14); }
    else if (name === "Folder") { ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.roundRect(-46, -30, 92, 70, 8); ctx.fill(); ctx.fillStyle = "#f4b400"; ctx.fillRect(-46, -42, 40, 16); }
    else { ctx.fillStyle = "#fff"; ctx.fillRect(-34, -42, 68, 86); ctx.fillStyle = "#b8c2cc"; for (let i = 0; i < 4; i++) ctx.fillRect(-24, -26 + i * 16, 48, 5); }
    ctx.fillStyle = "#fff"; ctx.font = "600 22px Inter"; ctx.textAlign = "center"; ctx.fillText(name, 0, 76); ctx.restore();
  }
  function win(ctx, x, y, w, h, title, o = {}) {
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 30; ctx.fillStyle = o.fill || "#fff"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.restore();
    ctx.fillStyle = "#eceff3"; ctx.beginPath(); ctx.roundRect(x, y, w, 54, [14, 14, 0, 0]); ctx.fill();
    ctx.fillStyle = "#333"; ctx.font = "700 24px Inter"; ctx.textAlign = "left"; ctx.fillText(title, x + 24, y + 36);
    for (const [i, c] of ["#ff5f56", "#ffbd2e", "#27c93f"].entries()) { ctx.beginPath(); ctx.arc(x + w - 100 + i * 30, y + 27, 9, 0, TAU); ctx.fillStyle = c; ctx.fill(); }
    return [x, y + 54, w, h - 54];
  }
  function cursor(ctx, x, y, s = 1, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.hand) { ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-8, -2, 22, 40, 10); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(21, 54); ctx.lineTo(29, 50); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#111"; ctx.stroke(); }
    if (o.click) { ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 20 + o.click * 40, 0, TAU); ctx.globalAlpha = 1 - o.click; ctx.stroke(); }
    ctx.restore();
  }

  // ---------- PLATFORM LEVEL (neon blocks, spikes, portals, orbs) — scroll moves the world to the left
  // o: {scroll, bg, line, blocks: [[x, y, w, h]], spikes: [[x, y]], orbs: [[x, y]], portals: [[x, y, col]]}, ground y
  function level(ctx, o = {}) {
    const sc = o.scroll || 0, bg = o.bg || "#2a1446", line = o.line || "#ffffff";
    ctx.fillStyle = bg; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 2;
    for (let x = -((sc * 0.3) % 160); x < W; x += 160) for (let y = 0; y < H; y += 160) ctx.strokeRect(x, y, 160, 160);
    ctx.save(); ctx.translate(-sc, 0); ctx.shadowColor = line; ctx.shadowBlur = 12; ctx.strokeStyle = line; ctx.lineWidth = 4;
    const gy = o.ground ?? H * 0.78;
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(sc - 100, gy, W + 200, H); ctx.beginPath(); ctx.moveTo(sc - 100, gy); ctx.lineTo(sc + W + 100, gy); ctx.stroke();
    for (const [x, y, w, h] of o.blocks || []) { ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      ctx.save(); ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; for (let gx = x + 40; gx < x + w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } for (let gy2 = y + 40; gy2 < y + h; gy2 += 40) { ctx.beginPath(); ctx.moveTo(x, gy2); ctx.lineTo(x + w, gy2); ctx.stroke(); } ctx.restore(); }
    for (const [x, y] of o.spikes || []) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x, y - 56); ctx.lineTo(x + 30, y); ctx.closePath(); ctx.fillStyle = "#000"; ctx.fill(); ctx.stroke(); }
    for (const [x, y] of o.orbs || []) { ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fillStyle = "#ffe14d"; ctx.fill(); ctx.stroke(); }
    for (const [x, y, col] of o.portals || []) { ctx.strokeStyle = col || "#ff4fd8"; ctx.shadowColor = col || "#ff4fd8"; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(x, y, 34, 100, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    return gy;
  }

  // ---------- effects
  // glitch: horizontal slices shifted, RGB split (call at the end of a shot, k 0..1)
  function glitch(ctx, k, seed = 1) {
    if (k <= 0) return; const r = mulberry(seed);
    const img = ctx.getImageData(0, 0, W, H);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 10 * k; i++) { const y = r() * H, h = 10 + r() * 60, dx = (r() - 0.5) * 120 * k; ctx.putImageData(img, dx, 0, 0, y, W, h); }
    ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.25 * k; ctx.fillStyle = "#ff0040"; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // square pixels bursting from (x, y) after time `at`
  function pixels(ctx, x, y, t, at, o = {}) {
    const dt = t - at; if (dt < 0 || dt > (o.life || 1.2)) return; const r = mulberry(o.seed || 3); const cols = o.cols || ["#00b4d8", "#ffd166", "#ef476f", "#06d6a0"];
    for (let i = 0; i < (o.n || 26); i++) { const a = r() * TAU, v = 300 + r() * 700, s = 8 + r() * 16;
      const px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 900 * dt * dt; ctx.globalAlpha = 1 - dt / (o.life || 1.2); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(px - s / 2, py - s / 2, s, s); }
    ctx.globalAlpha = 1;
  }

  window.DIGI = { stick, typed, sheet, cell, errorBox, code, desktop, icon, win, cursor, level, glitch, pixels };
})();
