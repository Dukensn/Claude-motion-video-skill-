// usage: node thumb.cjs <film-dir> <out.png> [name=main] [scale=1.3333]
// Renders T[name]() from <film-dir>/thumb/thumb.html. The page draws in 1920x1080 coordinates; the canvas is
// enlarged by `scale` (default 2560x1440) so the thumbnail stays sharp, then a .jpg under YouTube's 2 MB limit
// is written next to the .png.
const { chromium } = require('playwright'); const path = require('path'); const { execFileSync } = require('child_process'); const fs = require('fs');
(async () => {
  const [dir, out, name = 'main', scaleArg] = process.argv.slice(2);
  const k = parseFloat(scaleArg || '1.3333');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(dir, 'thumb', 'thumb.html'));
  await p.evaluate(async () => { for (const f of FONTS) await document.fonts.load(f); });
  await p.evaluate(({ n, k }) => {
    const c = document.getElementById('c'); const w = c.width, h = c.height;
    c.width = Math.round(w * k); c.height = Math.round(h * k); c.style.width = w + 'px'; c.style.height = h + 'px';
    // every setTransform the page makes is scaled, so its drawing code stays in base coordinates
    const P = CanvasRenderingContext2D.prototype, st = P.setTransform;
    P.setTransform = function (a, b2, c2, d, e, f) { if (typeof a === 'object') return st.call(this, a); return st.call(this, a * k, b2 * k, c2 * k, d * k, e * k, f * k); };
    const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0);
    T[n]();
  }, { n: name, k });
  const data = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  const jpg = out.replace(/\.png$/i, '') + '.jpg';
  for (const q of [2, 3, 4, 6]) {           // highest quality that fits in 2 MB
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', out, '-q:v', String(q), jpg]);
    if (fs.statSync(jpg).size < 2 * 1024 * 1024) break;
  }
  if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exitCode = 1; }
  await b.close();
  console.log(`thumbnail -> ${out} + ${jpg}`);
})();
