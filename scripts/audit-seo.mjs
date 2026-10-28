#!/usr/bin/env node
/** Project-owned audit of generated HTML, optional HTTP headers and Chromium rendering.
 * This is a bounded structural audit, not a ranking, rich-result or Core Web Vitals score.
 * Run after build: node scripts/audit-seo.mjs [--base http://127.0.0.1:8787] [--browser]
 * Production fixture: --dist /path/to/build --site https://deletective.example
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function option(name, fallback = '') { const at = args.indexOf(name); return at === -1 ? fallback : args[at + 1] || ''; }
const buildRoot = resolve(projectRoot, option('--dist', 'dist'));
const base = option('--base', process.env.SEO_BASE_URL || '').replace(/\/$/, '');
const expectedSite = option('--site', process.env.PUBLIC_SITE_URL || '');
const browserRequested = args.includes('--browser');
const output = option('--output');
const expectedOrigin = expectedSite ? new URL(expectedSite).origin : '';
const publicRoutes = ['/', '/2-player', '/couples', '/party', '/daily', '/how-to-play', '/about', '/faq', '/privacy', '/terms'];
const privateRoutes = ['/play', '/room', '/404'];
const results = { checkedAt: new Date().toISOString(), buildDirectory: relative(projectRoot, buildRoot) || '.', base: base || null, expectedSite: expectedOrigin || null, mode: expectedOrigin ? 'configured-origin' : 'provisional-noindex', checks: [], pages: [], http: [], browser: null, assets: {} };
const check = (name, pass, detail, severity = 'error') => results.checks.push({ name, status: pass ? 'pass' : severity === 'warning' ? 'warning' : 'fail', detail });
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([a-f\d]+);/ig, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const text = html => decode(html.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
function attrs(tag) { return Object.fromEntries([...tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3])])); }
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(m => attrs(m[0]));
const meta = (html, name) => tags(html, 'meta').find(a => a.name === name || a.property === name)?.content;
const schema = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m => attrs(m[1]).type === 'application/ld+json').map(m => JSON.parse(m[2]));
const mainText = html => text(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '');
const fileFor = route => route === '/404' ? join(buildRoot, '404.html') : join(buildRoot, route.slice(1), 'index.html');
function inspect(html, route, source) {
  const title = text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = meta(html, 'description') || '';
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => text(m[1]));
  const robots = meta(html, 'robots') || '';
  const canonicalTags = tags(html, 'link').filter(a => a.rel === 'canonical');
  const canonical = canonicalTags[0]?.href || null;
  const isPublic = publicRoutes.includes(route);
  check(`${source} ${route}: title`, Boolean(title), title);
  check(`${source} ${route}: description`, description.length > 20, `${description.length} characters`);
  check(`${source} ${route}: language`, /<html\b[^>]*\blang=["']en["']/i.test(html), 'English document language');
  check(`${source} ${route}: viewport`, /width=device-width/.test(meta(html, 'viewport') || ''), 'Responsive viewport');
  if (isPublic) {
    check(`${source} ${route}: meaningful initial HTML`, mainText(html).length > 100, `${mainText(html).length} main-content characters before JavaScript`);
    check(`${source} ${route}: primary heading`, headings.length === 1 && headings[0].length > 5, `${headings.length} h1: ${headings.join(' | ')}`);
    check(`${source} ${route}: Open Graph`, Boolean(meta(html, 'og:title') && meta(html, 'og:description')), 'Title and description present');
    check(`${source} ${route}: index policy`, expectedOrigin ? !/noindex/i.test(robots) : /noindex/i.test(robots), robots);
    if (expectedOrigin) {
      check(`${source} ${route}: self canonical`, canonicalTags.length === 1 && [new URL(route, expectedOrigin).href, new URL(route === '/' ? '/' : `${route}/`, expectedOrigin).href].includes(canonical), canonical || 'missing');
      check(`${source} ${route}: social URL`, meta(html, 'og:url') === canonical, meta(html, 'og:url') || 'missing');
      const image = meta(html, 'og:image') || '';
      check(`${source} ${route}: social image`, image.startsWith(`${expectedOrigin}/`) && /\.(png|jpe?g)(?:\?|$)/i.test(image), image || 'missing', 'warning');
    } else check(`${source} ${route}: no unowned canonical`, !canonical || /localhost|127\.0\.0\.1/.test(canonical), canonical || 'omitted while provisional');
    try {
      const blocks = schema(html);
      check(`${source} ${route}: JSON-LD syntax`, blocks.length > 0, `${blocks.length} JSON-LD block(s), parsed`);
      for (const block of blocks) {
        const objects = block['@graph'] || [block];
        for (const item of objects) {
          check(`${source} ${route}: truthful free app schema`, item['@context'] === 'https://schema.org' && item['@type'] === 'WebApplication' && item.name === 'Deletective' && item.isAccessibleForFree === true && Number(item.offers?.price) === 0, 'Describes current free browser application');
          check(`${source} ${route}: no invented ratings`, !item.aggregateRating && !item.review && !item.interactionStatistic, 'No rating/review/popularity data supplied');
        }
      }
    } catch (error) { check(`${source} ${route}: JSON-LD syntax`, false, String(error)); }
  } else {
    check(`${source} ${route}: private noindex`, /noindex/i.test(robots), robots);
    check(`${source} ${route}: no private canonical`, canonicalTags.length === 0, canonical || 'omitted');
    check(`${source} ${route}: no private schema`, !/application\/ld\+json/i.test(html), 'No room/play/404 structured-data publication');
  }
  return { route, title, description, h1: headings, robots, canonical, mainCharacters: mainText(html).length, initialHtmlBytes: Buffer.byteLength(html) };
}
async function filesBelow(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? filesBelow(join(dir, e.name)) : [join(dir, e.name)]));
  return nested.flat();
}
function sitemapLocations(xml) {
  if (!/^\s*<\?xml\s+version=["']1\.0["'][^?]*\?>\s*<urlset\s+xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["'][^>]*>/i.test(xml)) throw new Error('Missing XML declaration or sitemap namespace');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unexpected document/entity declaration');
  const stack = [];
  for (const m of xml.matchAll(/<\/?([A-Za-z][\w:]*)\b[^>]*>/g)) {
    const [token, name] = m;
    if (!['urlset', 'url', 'loc', 'lastmod'].includes(name)) throw new Error(`Unexpected sitemap element ${name}`);
    if (!token.startsWith('</')) {
      const parent = { urlset: undefined, url: 'urlset', loc: 'url', lastmod: 'url' }[name];
      if (stack.at(-1) !== parent) throw new Error(`Unexpected parent for ${name}`);
    }
    if (token.startsWith('</')) { if (stack.pop() !== name) throw new Error(`Unbalanced sitemap element ${name}`); }
    else if (!token.endsWith('/>')) stack.push(name);
  }
  if (stack.length) throw new Error('Unclosed XML elements');
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i.test(xml)) throw new Error('Unescaped XML ampersand');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
}
try {
  const htmlByRoute = new Map();
  for (const route of [...publicRoutes, ...privateRoutes]) {
    try { const html = await readFile(fileFor(route), 'utf8'); htmlByRoute.set(route, html); results.pages.push(inspect(html, route, 'build')); }
    catch (error) { check(`build ${route}: file`, false, String(error)); }
  }
  for (const key of ['title', 'description']) {
    const values = results.pages.filter(p => publicRoutes.includes(p.route)).map(p => p[key]);
    check(`public ${key} uniqueness`, new Set(values).size === values.length, `${new Set(values).size}/${values.length} unique`);
  }
  for (const [route, html] of htmlByRoute) {
    if (!publicRoutes.includes(route)) continue;
    const idSet = new Set([...html.matchAll(/\bid=(?:"([^"]+)"|'([^']+)')/g)].map(m => decode(m[1] || m[2])));
    for (const anchor of tags(html, 'a')) {
      if (!anchor.href || /^(mailto:|tel:|https?:\/\/|javascript:|data:)/i.test(anchor.href)) continue;
      const url = new URL(anchor.href, `https://audit.invalid${route === '/' ? '/' : `${route}/`}`);
      if (url.hash && url.pathname.replace(/\/$/, '') === route.replace(/\/$/, '')) check(`build ${route}: local anchor ${url.hash}`, idSet.has(decodeURIComponent(url.hash.slice(1))), anchor.href);
      const normalized = url.pathname.replace(/\/$/, '') || '/';
      const exists = htmlByRoute.has(normalized) || (await stat(join(buildRoot, url.pathname)).catch(() => null))?.isFile();
      check(`build ${route}: link ${anchor.href}`, Boolean(exists), 'Internal destination exists; query strings do not change static route');
    }
  }
  const xml = await readFile(join(buildRoot, 'sitemap.xml'), 'utf8');
  const robots = await readFile(join(buildRoot, 'robots.txt'), 'utf8');
  let locations = [];
  try { locations = sitemapLocations(xml); check('sitemap XML structure', true, `${locations.length} locations`); } catch (error) { check('sitemap XML structure', false, String(error)); }
  check('sitemap unique locations', new Set(locations).size === locations.length, `${locations.length} total`);
  check('sitemap excludes private/API/answer URLs', locations.every(loc => !/\/(?:room|play|api|results|share)(?:\/|\?|$)/i.test(new URL(loc).pathname) && !new URL(loc).search), 'No private, API, generated answer or parameter URL');
  if (expectedOrigin) {
    check('sitemap expected coverage', locations.length === publicRoutes.length && results.pages.filter(page => publicRoutes.includes(page.route)).every(page => locations.includes(page.canonical)), locations.join(', '));
    check('sitemap HTTPS origin', locations.every(loc => new URL(loc).origin === expectedOrigin && new URL(loc).protocol === 'https:'), expectedOrigin);
    check('robots public crawl policy', /Allow:\s*\/\s*$/im.test(robots) && !/^Disallow:\s*\/\s*$/im.test(robots), robots.trim());
    check('robots declares configured sitemap', robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`), robots.trim());
  } else {
    check('provisional sitemap empty', locations.length === 0, 'No unverified production-domain URLs emitted');
    check('provisional robots blocks crawling', /^Disallow:\s*\/\s*$/im.test(robots), robots.trim());
  }
  const allFiles = await filesBelow(buildRoot);
  const assetFiles = allFiles.filter(p => ['.js', '.css', '.woff2'].includes(extname(p)));
  const assets = await Promise.all(assetFiles.map(async file => { const bytes = await readFile(file); return { path: relative(buildRoot, file), kind: extname(file).slice(1), bytes: bytes.length, gzipBytes: gzipSync(bytes).length }; }));
  results.assets = { fileCount: assets.length, totals: Object.fromEntries(['js', 'css', 'woff2'].map(kind => [kind, { bytes: assets.filter(a => a.kind === kind).reduce((n, a) => n + a.bytes, 0), gzipBytes: assets.filter(a => a.kind === kind).reduce((n, a) => n + a.gzipBytes, 0) }])), files: assets, note: 'All emitted assets, not measured initial page transfer. Gzip sizes calculated locally; woff2 is already compressed.' };
  check('no source tooling in static assets', allFiles.every(p => !/(?:^|\/)(?:tools|tests|docs|packages|scripts|node_modules)\//.test(relative(buildRoot, p))), `${allFiles.length} output files inspected`);
  try {
    const png = await readFile(join(buildRoot, 'social-card.png'));
    check('social preview PNG dimensions', png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, `${png.readUInt32BE(16)}×${png.readUInt32BE(20)}; ${png.length} bytes`);
  } catch (error) { check('social preview PNG available', false, String(error), 'warning'); }
  if (base) {
    for (const route of [...publicRoutes, '/play', '/room', '/room/SEOAUDIT', '/not-a-real-deletective-page', '/api/health', '/api/not-a-route', '/robots.txt', '/sitemap.xml']) {
      try {
        let response = await fetch(`${base}${route}`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
        const redirects = [];
        while ([301, 302, 307, 308].includes(response.status) && redirects.length < 3) {
          const target = new URL(response.headers.get('location') || '', `${base}${route}`);
          if (target.origin !== new URL(base).origin) throw new Error('Unexpected cross-origin redirect');
          redirects.push({ status: response.status, location: target.pathname + target.search });
          response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
        }
        check(`HTTP ${route}: bounded redirects`, redirects.length <= 1, JSON.stringify(redirects));
        if (expectedOrigin && publicRoutes.includes(route)) {
          const declared = results.pages.find(page => page.route === route)?.canonical;
          const finalPath = new URL(response.url).pathname;
          check(`HTTP ${route}: canonical target`, declared && new URL(declared).pathname === finalPath, `${finalPath}; declared ${declared}`);
        }
        const html = await response.text();
        results.http.push({ route, redirects, finalUrl: response.url, status: response.status, contentType: response.headers.get('content-type'), robots: response.headers.get('x-robots-tag'), cache: response.headers.get('cache-control'), csp: response.headers.get('content-security-policy') });
        const expected = route.startsWith('/not-a-real') || route === '/api/not-a-route' ? 404 : 200;
        check(`HTTP ${route}: status`, response.status === expected, `${response.status}, expected ${expected}`);
        if (publicRoutes.includes(route)) inspect(html, route, 'HTTP');
        if (route.startsWith('/room') || route.startsWith('/api')) check(`HTTP ${route}: private response noindex`, /noindex/i.test(response.headers.get('x-robots-tag') || ''), response.headers.get('x-robots-tag') || 'missing');
        if (route.startsWith('/room')) check(`HTTP ${route}: no cache`, /no-store/i.test(response.headers.get('cache-control') || ''), response.headers.get('cache-control') || 'missing');
        if (publicRoutes.includes(route) || route.startsWith('/room')) check(`HTTP ${route}: CSP present`, Boolean(response.headers.get('content-security-policy')), 'CSP response header');
      } catch (error) { check(`HTTP ${route}: reachable`, false, String(error)); }
    }
  }
  if (browserRequested) {
    if (!base) throw new Error('--browser requires --base URL');
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    results.browser = { engine: 'Chromium', version: browser.version(), pages: [], note: 'Rendered DOM and local navigation checks only. Not Lighthouse, field Core Web Vitals, real-device keyboard or cross-browser certification.' };
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      for (const route of publicRoutes) {
        const page = await context.newPage();
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
        const evidence = await page.evaluate(() => ({ title: document.title, h1: [...document.querySelectorAll('h1')].map(e => e.textContent?.trim()), mainCharacters: document.querySelector('main')?.textContent?.trim().length || 0, schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent || '')), canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth, navigationMilliseconds: performance.getEntriesByType('navigation')[0]?.duration || null }));
        results.browser.pages.push({ route, ...evidence });
        check(`Chromium ${route}: rendered main and heading`, evidence.mainCharacters > 100 && evidence.h1.length === 1, `${evidence.mainCharacters} characters; ${evidence.h1.length} h1`);
        check(`Chromium ${route}: rendered schema`, evidence.schemas.length > 0, `${evidence.schemas.length} parsed JSON-LD blocks`);
        check(`Chromium ${route}: desktop overflow`, !evidence.horizontalOverflow, '1280px viewport');
        await page.setViewportSize({ width: 390, height: 844 });
        check(`Chromium ${route}: mobile width overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '390px simulated viewport; not physical-device keyboard test');
        await page.close();
      }
      await context.close();
    } finally { await browser.close(); }
  }
} catch (error) { check('audit execution', false, error.stack || String(error)); }
const statuses = results.checks.reduce((counts, item) => ({ ...counts, [item.status]: (counts[item.status] || 0) + 1 }), {});
results.summary = { pass: statuses.pass || 0, fail: statuses.fail || 0, warning: statuses.warning || 0, publicPages: results.pages.filter(p => publicRoutes.includes(p.route)).length, privatePages: results.pages.filter(p => privateRoutes.includes(p.route)).length, limitations: ['No ranking/volume/authority measurement', 'No external rich-results validator', 'No live production/CDN verification', 'No Lighthouse or field Core Web Vitals', 'HTML checks cover this project generated markup, not a general-purpose HTML conformance parser'] };
if (output) await writeFile(resolve(projectRoot, output), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ ...results.summary, mode: results.mode, output: output || null, failures: results.checks.filter(c => c.status === 'fail'), warnings: results.checks.filter(c => c.status === 'warning'), assetTotals: results.assets.totals }, null, 2));
if (statuses.fail) process.exitCode = 1;
