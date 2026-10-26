// Text on screen: voice-over timeline helpers, karaoke subtitles, silent captions, hook and title cards.
// window.VO comes from assets/js/timeline.js (written by scripts/voice.sh from narration.json).
(function () {
  const { W, H, clamp, E, prog } = F;
  const { FONTS, INK } = WORLD;
  const VO = window.VO || { lines: [], end: 0 };

  // ---------- timeline helpers: anchor shots to narration lines by id
  const byId = {};
  VO.lines.forEach((l, i) => { byId[l.id] = l; l.i = i; });
  const at = (id, off = 0) => { const l = byId[id]; if (!l) throw new Error("no narration line '" + id + "'"); return l.a + off; };
  const end = (id, off = 0) => { const l = byId[id]; if (!l) throw new Error("no narration line '" + id + "'"); return l.b + off; };
  const lineAt = (t) => { for (const l of VO.lines) if (t >= l.a && t < l.b) return l; return null; };

  // word timings inside a line: spread by character count (+ a little weight for punctuation pauses)
  function words(l) {
    if (l._w) return l._w;
    const ws = (l.caption || l.text).split(/\s+/).filter(Boolean);
    const weight = ws.map((w) => w.length + 2 + (/[,;:]$/.test(w) ? 3 : 0) + (/[.!?…]$/.test(w) ? 5 : 0));
    const tot = weight.reduce((a, b) => a + b, 0);
    let acc = l.a;
    l._w = ws.map((w, i) => { const d = ((l.b - l.a) * weight[i]) / tot; const o = { w, a: acc, b: acc + d }; acc += d; return o; });
    return l._w;
  }

  // wrap words into lines that fit maxW at the current font
  function wrap(ctx, ws, maxW) {
    const rows = [[]]; let cur = 0;
    const sp = parseFloat(ctx.font.match(/(\d+)px/)[1]) * 0.3;
    for (const o of ws) {
      const w = ctx.measureText(o.w).width;
      if (cur + w > maxW && rows[rows.length - 1].length) { rows.push([]); cur = 0; }
      rows[rows.length - 1].push(Object.assign({ width: w }, o)); cur += w + sp;
    }
    return rows;
  }

  // ---------- karaoke subtitle of the current narration line (o: {size, y, accent, maxW, upper})
  function subtitles(ctx, t, o = {}) {
    const l = lineAt(t);
    if (!l || l.hide) return;
    const size = o.size || Math.round(Math.min(W, H) * 0.062);
    ctx.save();
    ctx.font = `800 ${size}px ${FONTS.ui}`;
    ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.lineJoin = "round";
    const ws = words(l).map((x) => Object.assign({}, x, { w: o.upper ? x.w.toUpperCase() : x.w }));
    const rows = wrap(ctx, ws, o.maxW || W * 0.8);
    const sp = size * 0.32, lh = size * 1.18;
    const y0 = (o.y ?? H * 0.86) - ((rows.length - 1) * lh) / 2;
    const k = clamp((t - l.a) / 0.12, 0, 1) * clamp((l.b - t) / 0.12, 0, 1);
    ctx.globalAlpha = k;
    // soft dark band behind the rows so the words read on any background
    if (o.band !== false) {
      const bw = Math.max(...rows.map((row) => row.reduce((s, x) => s + x.width, 0) + sp * (row.length - 1))) + size * 1.2;
      ctx.save(); ctx.globalAlpha = k * 0.5; ctx.fillStyle = "#000"; ctx.filter = "blur(10px)";
      ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, y0 - lh * 0.6, bw, lh * (rows.length + 0.2), size * 0.4); ctx.fill(); ctx.restore();
    }
    rows.forEach((row, ri) => {
      const rw = row.reduce((s, x) => s + x.width, 0) + sp * (row.length - 1);
      let x = W / 2 - rw / 2;
      for (const wd of row) {
        const on = t >= wd.a, cur = t >= wd.a && t < wd.b;
        const pop = cur ? 1 + 0.08 * E.out2(clamp((t - wd.a) / 0.12, 0, 1)) : 1;
        ctx.save(); ctx.translate(x + wd.width / 2, y0 + ri * lh); ctx.scale(pop, pop);
        ctx.lineWidth = size * 0.12; ctx.strokeStyle = INK; ctx.strokeText(wd.w, -wd.width / 2, 0);
        ctx.fillStyle = cur ? (o.accent || "#ffd166") : on ? "#ffffff" : "rgba(255,255,255,0.75)";
        ctx.fillText(wd.w, -wd.width / 2, 0);
        ctx.restore();
        x += wd.width + sp;
      }
    });
    ctx.restore();
  }

  // ---------- silent-film caption: lines reveal word by word (blur + fade) over [a, b]
  function caption(ctx, lines, t, a, b, o = {}) {
    if (t < a || t > b) return;
    const out = clamp((b - t) / 0.5, 0, 1);
    const size0 = o.size || Math.round(Math.min(W, H) * 0.056);
    const gap = o.gap ?? 1.35;
    const total = lines.reduce((s, L) => s + (L.size || size0) * gap, 0);
    let y = (o.cy ?? (o.center ? H / 2 : H * 0.86)) - total / 2 + (lines[0].size || size0) * gap / 2;
    ctx.save(); ctx.textBaseline = "middle"; ctx.textAlign = "left";
    for (const L of lines) {
      const size = L.size || size0;
      ctx.font = `${L.weight || 800} ${size}px ${FONTS[L.font || "ui"]}`;
      const ws = L.text.split(" "), sp = ctx.measureText(" ").width;
      const tw = ws.reduce((s, w) => s + ctx.measureText(w).width, 0) + sp * (ws.length - 1);
      let x = (o.x ?? W / 2) - tw / 2;
      ws.forEach((w, i) => {
        const wa = a + (L.delay || 0) + i * 0.09, k = clamp((t - wa) / 0.35, 0, 1);
        if (k > 0) {
          ctx.save(); ctx.globalAlpha = E.out2(k) * out; ctx.filter = k < 1 ? `blur(${(1 - k) * 8}px)` : "none";
          ctx.lineWidth = size * 0.2; ctx.lineJoin = "round"; ctx.strokeStyle = o.stroke ?? INK;
          if (o.stroke !== null) ctx.strokeText(w, x, y + (1 - k) * 8);
          ctx.fillStyle = L.color || o.color || "#ffffff"; ctx.fillText(w, x, y + (1 - k) * 8);
          ctx.restore();
        }
        x += ctx.measureText(w).width + sp;
      });
      y += size * gap;
    }
    ctx.restore();
  }

  // ---------- big hook / title card: words [{t, c}] in Lilita One with thick stroke; pops in at a
  function title(ctx, parts, x, y, t, a, b = 1e9, o = {}) {
    if (t < a || t > b) return;
    const size = o.size || Math.round(Math.min(W, H) * 0.13);
    const k = E.back(clamp((t - a) / 0.45, 0, 1)), out = clamp((b - t) / 0.4, 0, 1);
    ctx.save(); ctx.globalAlpha *= out; ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(o.rot || 0);
    ctx.font = `400 ${size}px ${FONTS.title}`; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    const tw = parts.reduce((s, p) => s + ctx.measureText(p.t).width, 0);
    let px = o.align === "left" ? 0 : -tw / 2;
    for (const p of parts) {
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = INK; ctx.strokeText(p.t, px + size * 0.04, size * 0.06);
      ctx.strokeText(p.t, px, 0);
      ctx.fillStyle = p.c || "#ffffff"; ctx.fillText(p.t, px, 0);
      px += ctx.measureText(p.t).width;
    }
    ctx.restore();
  }

  window.TXT = { VO, at, end, lineAt, words, subtitles, caption, title };
})();
