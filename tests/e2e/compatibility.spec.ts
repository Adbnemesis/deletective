import { test, expect } from '@playwright/test';
import { actor, close, create, finish, hydrate, join, latest, noBrowserErrors, ready, start, submit, waitPhase } from './helpers';

test('browser compatibility: genuine Duo clients complete a session', async ({ browser }, info) => {
  const actors = [await actor(browser, 'Compat Host'), await actor(browser, 'Compat Friend')];
  try {
    const code = await create(actors[0], 'duo'); await join(actors[1], code);
    await start(actors[0], actors);
    await submit(actors[0], 'I gave the houseplant its own parking space.');
    expect(actors[1].frames.join('\n')).not.toContain('I gave the houseplant its own parking space.');
    await submit(actors[1], 'I booked the toaster a relaxing weekend away.');
    await waitPhase(actors, 'reveal');
    await expect(actors[1].page.locator('.answer-text')).toHaveCount(2);
    await ready(actors, 'reveal'); await finish(actors);
    expect(latest(actors[0]).sharedScore).toBe(200);
    await noBrowserErrors(actors, info);
    info.annotations.push({ type: 'browser-version', description: `${info.project.name}: ${browser.version()}` });
  } finally { await close(actors); }
});

test('browser compatibility: daily is server-dated, persists locally, and downloads a chat image', async ({ browser }, info) => {
  const a = await actor(browser, 'Daily Visitor');
  try {
    await a.page.clock.setFixedTime(new Date('2099-01-01T12:00:00.000Z'));
    const responsePromise = a.page.waitForResponse(response => response.url().endsWith('/api/daily') && response.request().method() === 'GET');
    await a.page.goto('/daily'); await hydrate(a.page);
    const daily = await (await responsePromise).json();
    expect(daily.example).toBeUndefined(); expect(daily.prompt.example).toBeUndefined();
    expect(daily.date).not.toBe('2099-01-01');
    const answer = info.project.name === 'chromium' ? 'A'.repeat(240) : 'I signed the birthday cake up for a leadership course.';
    await a.page.getByRole('textbox').fill(answer);
    await a.page.getByRole('button', { name: 'Restore message ↗', exact: true }).click();
    await expect(a.page.getByText('Case creatively closed. ✓', { exact: true })).toBeVisible();
    await expect(a.page.locator('.daily-answer').first()).toContainText(answer);
    await expect(a.page.getByText('1 day in a row', { exact: true })).toBeVisible();
    const downloadPromise = a.page.waitForEvent('download');
    await a.page.getByRole('button', { name: '↓ Download image', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('deletective-chat.png');
    if (info.project.name === 'chromium') await download.saveAs('docs/screenshots/daily-longword-card.png');
    await a.page.reload();
    await expect(a.page.getByText('Case creatively closed. ✓', { exact: true })).toBeVisible();
    await expect(a.page.getByRole('textbox')).toHaveCount(0);
    await a.page.getByRole('button', { name: 'Clear my local answer and streak', exact: true }).click();
    await expect(a.page.getByRole('textbox')).toBeVisible();
    await noBrowserErrors([a], info);
  } finally { await close([a]); }
});

test('browser compatibility: public pages are meaningful without JavaScript; rooms stay noindex', async ({ browser, request }, info) => {
  const context = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8787', javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ['/', '/2-player', '/couples', '/party', '/how-to-play', '/daily', '/faq']) {
      const response = await page.goto(path); expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect((await page.locator('main').innerText()).length).toBeGreaterThan(100);
      expect(await page.locator('title').textContent()).toContain('Deletective');
    }
    const privatePage = await request.get('/room?code=ABCDEFGH');
    const html = await privatePage.text();
    expect(html).toMatch(/name="robots" content="noindex, nofollow"/);
    expect(privatePage.headers()['x-robots-tag']).toContain('noindex');
    const robots = await (await request.get('/robots.txt')).text();
    // Development builds intentionally block every route until a verified
    // PUBLIC_SITE_URL is configured; both policies protect private rooms.
    expect(robots).toMatch(/Disallow:\s*\/(?:room|$)/m);
    const map = await (await request.get('/sitemap.xml')).text();
    expect(map).not.toContain('/room'); expect(map).not.toContain('/play');
    info.annotations.push({ type: 'browser-version', description: `${info.project.name}: ${browser.version()}` });
  } finally { await context.close(); }
});
