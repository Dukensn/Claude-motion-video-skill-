// usage: node still.cjs <film-dir> <outdir> t1 t2 ...   -> one PNG per time (seconds), named tSSSSSS.png
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [proj, out, ...ts] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); });
  await page.goto('file://' + path.resolve(proj, 'index.html'));
  await page.evaluate(() => window.__hf.buildReady.fonts);
  for (const t of ts) {
    await page.evaluate(t => window.__renderAt(+t), t);
    await page.locator('#film').screenshot({ path: path.join(out, `t${String(t).padStart(6, '0')}.png`) });
  }
  if (errs.length) { console.log('ERRORS:\n' + [...new Set(errs)].join('\n')); process.exitCode = 1; }
  await browser.close();
})();
