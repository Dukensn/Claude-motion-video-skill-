// usage: node duration.cjs <film-dir>  -> prints FILM.DURATION and the frame size (W H) as the page computes them
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2], 'index.html'));
  const r = await p.evaluate(() => ({ d: window.FILM && FILM.DURATION, w: F.W, h: F.H }));
  await b.close();
  if (errs.length || !r.d) { console.error('ERRORS:\n' + errs.join('\n')); process.exit(1); }
  console.log(`${r.d} ${r.w} ${r.h}`);
})();
