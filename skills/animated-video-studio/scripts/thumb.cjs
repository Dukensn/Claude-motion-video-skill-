// usage: node thumb.cjs <film-dir> <out.png> [name=main]  -> renders T[name]() from <film-dir>/thumb/thumb.html at 1920x1080
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [dir, out, name = 'main'] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(dir, 'thumb', 'thumb.html'));
  await p.evaluate(async () => { for (const f of FONTS) await document.fonts.load(f); });
  await p.evaluate(n => T[n](), name);
  await p.locator('#c').screenshot({ path: out });
  if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exitCode = 1; }
  await b.close();
})();
