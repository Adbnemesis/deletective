import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { actor, close, create, finish, hydrate, join, latest, noBrowserErrors, raw, ready, start, submit, voteAll, waitPhase, type Actor } from './helpers';

test('Duo: independent secret answers, rejected markup, refresh, reveal, sharing, rematch', async ({ browser }, info) => {
  const actors = [await actor(browser, 'Duo Host'), await actor(browser, 'Duo Friend')];
  const [host, friend] = actors;
  try {
    const code = await create(host, 'duo');
    await join(friend, code);
    await expect(host.page.locator('.player-name')).toHaveCount(2);
    await raw(friend, { type: 'start' });
    await expect(friend.page.getByRole('alert')).toContainText('Only the host');
    expect(latest(host).phase).toBe('lobby');
    const unauthorized = await friend.page.evaluate(code => new Promise<{ code: number; receivedState: boolean }>(resolve => {
      const appSocket = (window as unknown as { __deletectiveSocket: WebSocket }).__deletectiveSocket;
      const socket = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/rooms/${code}/ws`);
      (window as unknown as { __deletectiveSocket: WebSocket }).__deletectiveSocket = appSocket;
      let receivedState = false;
      socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token: '0'.repeat(64) }));
      socket.onmessage = event => { if (JSON.parse(event.data).type === 'state') receivedState = true; };
      socket.onclose = event => resolve({ code: event.code, receivedState });
    }), code);
    expect(unauthorized).toEqual({ code: 4001, receivedState: false });
    await host.page.getByRole('button', { name: 'Copy invite link' }).click();
    await expect(host.page.getByRole('status')).toContainText('Invite link copied');
    await start(host, actors);

    const malicious = '<img src=x onerror=alert(1)>';
    await submit(host, malicious);
    await expect(host.page.getByRole('alert')).toContainText('plain text');
    expect(latest(host).ownSubmission).toBeNull();
    await expect(host.page.locator('img[src="x"]')).toHaveCount(0);

    const first = 'I gave the garden gnome a management position.';
    const second = 'I taught the toaster to conduct performance reviews.';
    await submit(host, first);
    await expect(host.page.locator('.locked-answer')).toContainText(first);
    expect(friend.frames.join('\n')).not.toContain(first);
    await expect(friend.page.getByText(first, { exact: true })).toHaveCount(0);
    await host.page.reload();
    await expect(host.page.locator('.locked-answer')).toContainText(first);
    expect(latest(host).ownSubmission).toBe(first);
    expect(latest(host).you).not.toBe(latest(friend).you);
    expect(latest(friend).answers).toEqual([]);
    await submit(friend, second);
    await waitPhase(actors, 'reveal');
    for (const a of actors) {
      await expect(a.page.locator('.answer-text')).toHaveCount(2);
      expect(await a.page.locator('.answer-text').allTextContents()).toEqual(expect.arrayContaining([first, second]));
    }
    await host.page.waitForFunction(() => Array.from(document.querySelectorAll('.answer-card')).every(element => Number(getComputedStyle(element).opacity) === 1));
    await host.page.screenshot({ path: 'docs/screenshots/duo-reveal.png', fullPage: true });
    await host.page.getByRole('button', { name: 'React 😂', exact: true }).first().click();
    await expect.poll(() => latest(friend).answers.some(answer => answer.reactions['😂'] === 1)).toBe(true);
    await ready(actors, 'reveal');
    await waitPhase(actors, 'results');
    expect(latest(host).sharedScore).toBe(200);
    const downloaded = host.page.waitForEvent('download');
    await host.page.getByRole('button', { name: '↓ Download image', exact: true }).first().click();
    const file = await downloaded;
    expect(file.suggestedFilename()).toBe('deletective-chat.png');
    const bytes = await readFile((await file.path())!);
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.length).toBeGreaterThan(10_000);
    await finish(actors);
    await host.page.getByRole('button', { name: /Same friends\. New chaos\. Rematch/ }).click();
    await waitPhase(actors, 'lobby');
    await start(host, actors);
    await submit(host, 'My cactus has been elected head of catering.');
    await submit(friend, 'I replaced the agenda with a treasure map.');
    await waitPhase(actors, 'reveal');
    await ready(actors, 'reveal');
    await finish(actors);
    expect(latest(host).sharedScore).toBe(200);
    expect(latest(host).history).toHaveLength(1);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Couples: wholesome tailored pack, shared points, local hiding and session gallery', async ({ browser }, info) => {
  const actors = [await actor(browser, 'Partner One'), await actor(browser, 'Partner Two')];
  try {
    const code = await create(actors[0], 'couples', 1, 'wholesome');
    await join(actors[1], code);
    await start(actors[0], actors);
    expect(latest(actors[0]).settings.category).toBe('wholesome');
    expect(latest(actors[0]).prompt?.category).not.toBe('workplace');
    await submit(actors[0], 'I booked the houseplant a seat at the family dinner.');
    await submit(actors[1], 'We accidentally invited every duck from the park.');
    await waitPhase(actors, 'reveal');
    await actors[0].page.getByRole('button', { name: 'Hide', exact: true }).first().click();
    await expect(actors[0].page.locator('.answer-text').first()).toContainText('hidden this answer');
    await expect(actors[1].page.locator('.answer-text').first()).not.toContainText('hidden this answer');
    await ready(actors, 'reveal');
    await finish(actors);
    expect(latest(actors[0]).sharedScore).toBe(200);
    await actors[0].page.getByText('Your session’s restored messages', { exact: true }).click();
    await expect(actors[0].page.locator('.gallery-round')).toHaveCount(1);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Three-player Party: host disconnect and reconnect, anonymous reveal, self/duplicate vote rejection', async ({ browser }, info) => {
  test.setTimeout(110_000);
  const actors = [await actor(browser, 'Party Captain'), await actor(browser, 'Party Friend'), await actor(browser, 'Party Guest')];
  const [host, friend, guest] = actors;
  try {
    const code = await create(host, 'party');
    await join(friend, code); await join(guest, code);
    const originalHost = latest(host).you;
    await start(host, actors);
    await host.page.goto('/');
    await expect.poll(() => latest(friend)?.hostId, { timeout: 40_000 }).not.toBe(originalHost);
    await host.page.goto(`/room?code=${code}`);
    await hydrate(host.page);
    await expect(host.page.getByRole('textbox')).toBeVisible();
    expect(latest(host).you).toBe(originalHost);
    for (let i = 0; i < actors.length; i++) await submit(actors[i], `Party explanation ${i + 1}: the biscuit committee has spoken.`);
    await waitPhase(actors, 'reveal');
    expect(latest(friend).answers.every(answer => answer.author === undefined && answer.authorId === undefined)).toBe(true);
    await ready(actors, 'reveal');
    await waitPhase(actors, 'voting');
    const own = latest(friend).answers.find(answer => answer.own)!;
    const target = latest(friend).answers.find(answer => !answer.own)!;
    await raw(friend, { type: 'vote', answerId: own.id, roundId: latest(friend).roundId });
    await expect(friend.page.getByRole('alert')).toContainText('cannot vote for your own');
    await friend.page.locator('.answer-card').filter({ hasText: target.text }).getByRole('button', { name: 'Vote for this ↗' }).click();
    await raw(friend, { type: 'vote', answerId: target.id, roundId: latest(friend).roundId });
    await expect(friend.page.getByRole('alert')).toContainText('already voted');
    for (const a of [host, guest]) await a.page.getByRole('button', { name: 'Vote for this ↗', exact: true }).first().click();
    await waitPhase(actors, 'results');
    expect(latest(friend).answers.every(answer => Boolean(answer.author))).toBe(true);
    expect(latest(friend).answers.reduce((sum, answer) => sum + (answer.votes || 0), 0)).toBe(3);
    expect(latest(friend).players.reduce((sum, player) => sum + player.score, 0)).toBe(300);
    await finish(actors);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Six-player Party: a player leaves mid-round, remaining players finish synchronized voting', async ({ browser }, info) => {
  const actors: Actor[] = [];
  try {
    for (let i = 0; i < 6; i++) actors.push(await actor(browser, `Suspect ${i + 1}`));
    const code = await create(actors[0], 'party');
    for (const a of actors.slice(1)) await join(a, code);
    await expect(actors[0].page.locator('.player-name')).toHaveCount(6);
    await start(actors[0], actors);
    await actors[5].page.getByRole('button', { name: 'Leave room', exact: true }).click();
    await actors[5].page.waitForURL(/\/play$/);
    const remaining = actors.slice(0, 5);
    await expect.poll(() => latest(remaining[0]).players.length).toBe(5);
    for (let i = 0; i < remaining.length; i++) await submit(remaining[i], `Five friends, theory ${i + 1}: I gave the teapot a promotion.`);
    await waitPhase(remaining, 'reveal');
    for (const a of remaining) expect(latest(a).answers).toHaveLength(5);
    await ready(remaining, 'reveal');
    await voteAll(remaining);
    await waitPhase(remaining, 'results');
    expect(latest(remaining[0]).answers.reduce((sum, answer) => sum + (answer.votes || 0), 0)).toBe(5);
    await finish(remaining);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Reaction Chain: secret independent clues, reconstruction, participation scoring and role rotation', async ({ browser }, info) => {
  const actors = [await actor(browser, 'Chain Alpha'), await actor(browser, 'Chain Beta'), await actor(browser, 'Chain Gamma')];
  try {
    const code = await create(actors[0], 'chain', 3);
    for (const a of actors.slice(1)) await join(a, code);
    await start(actors[0], actors, 'reactions');
    const roleCounts = new Map<string, number>();
    for (let round = 1; round <= 3; round++) {
      await waitPhase(actors, 'reactions');
      const clueWriters = actors.filter(a => latest(a).players.find(player => player.id === latest(a).you)?.role === 'reaction');
      const writer = actors.find(a => !clueWriters.includes(a))!;
      expect(clueWriters).toHaveLength(2);
      roleCounts.set(writer.name, (roleCounts.get(writer.name) || 0) + 1);
      const clue = `Round ${round}: Why is the penguin wearing a tiny crown?`;
      await submit(clueWriters[0], clue, true);
      expect(clueWriters[1].frames.join('\n')).not.toContain(clue);
      expect(writer.frames.join('\n')).not.toContain(clue);
      await submit(clueWriters[1], `Round ${round}: The mayor is asking for an invitation.`, true);
      await waitPhase(actors, 'writing');
      await expect(writer.page.locator('.conversation')).toContainText(clue);
      await submit(writer, `Round ${round}: I accidentally opened a royal aquarium.`);
      await waitPhase(actors, 'reveal');
      await ready(actors, 'reveal');
      await waitPhase(actors, 'results');
      expect(latest(writer).sharedScore).toBe(round * 300);
      expect(latest(writer).answers).toHaveLength(1);
      await ready(actors, 'results');
    }
    await waitPhase(actors, 'complete');
    expect([...roleCounts.values()]).toEqual([1, 1, 1]);
    expect(latest(actors[0]).sharedScore).toBe(900);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Mobile: no horizontal overflow, usable composer in a reduced viewport, and synchronized reveal', async ({ browser }, info) => {
  const actors = [await actor(browser, 'Mobile Host', true), await actor(browser, 'Mobile Friend', true)];
  try {
    const code = await create(actors[0], 'duo'); await join(actors[1], code);
    await start(actors[0], actors);
    for (const a of actors) {
      const sizes = await a.page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
      expect(sizes.content).toBeLessThanOrEqual(sizes.width + 1);
      await a.page.setViewportSize({ width: 390, height: 420 });
      await a.page.getByRole('textbox').focus();
      await a.page.getByRole('textbox').fill('I enrolled our cactus in a dance competition.');
      await a.page.getByRole('button', { name: /^Lock answer/ }).scrollIntoViewIfNeeded();
      await expect(a.page.getByRole('button', { name: /^Lock answer/ })).toBeInViewport();
      if (a === actors[0]) await a.page.screenshot({ path: 'docs/screenshots/mobile-compose.png', fullPage: false });
      await a.page.getByRole('button', { name: /^Lock answer/ }).click();
    }
    await waitPhase(actors, 'reveal'); await ready(actors, 'reveal'); await finish(actors);
    await noBrowserErrors(actors, info);
  } finally { await close(actors); }
});

test('Invalid code, unknown room and unauthenticated WebSocket have clear outcomes', async ({ browser }, info) => {
  const a = await actor(browser, 'Unknown Visitor');
  try {
    await a.page.goto('/room?code=INVALID'); await hydrate(a.page);
    await expect(a.page.getByRole('heading', { name: 'That room code looks a little off.' })).toBeVisible();
    await a.page.goto('/room?code=ZZZZZZZZ'); await hydrate(a.page);
    await a.page.getByLabel('What should we call you?').fill(a.name);
    await a.page.getByRole('button', { name: 'Join the chat' }).click();
    await expect(a.page.getByRole('alert')).toContainText(/not found|expired/i);
    const result = await a.page.evaluate(() => new Promise<{ code: number; receivedState: boolean }>(resolve => {
      const socket = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/api/rooms/ZZZZZZZZ/ws`);
      let receivedState = false;
      socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token: '0'.repeat(64) }));
      socket.onmessage = event => { if (JSON.parse(event.data).type === 'state') receivedState = true; };
      socket.onclose = event => resolve({ code: event.code, receivedState });
      socket.onerror = () => resolve({ code: 1006, receivedState });
    }));
    expect(result.receivedState).toBe(false);
    expect([1006, 4001, 4004]).toContain(result.code);
    await noBrowserErrors([a], info);
  } finally { await close([a]); }
});

test('Expired saved room credentials show an actionable outcome without an endless reconnect loader', async ({ browser }, info) => {
  const a = await actor(browser, 'Returning Visitor');
  try {
    // A deleted Durable Object and a never-created code both return the same
    // terminal 404 route. This reproduces a stale browser credential without
    // making the suite wait for the two-hour room lifetime.
    await a.page.addInitScript(() => {
      sessionStorage.setItem('deletective:ZZZZZZZ9', JSON.stringify({
        code: 'ZZZZZZZ9', playerId: '00000000-0000-4000-8000-000000000000', token: '0'.repeat(64),
      }));
    });
    await a.page.goto('/room?code=ZZZZZZZ9');
    await hydrate(a.page);
    await expect(a.page.getByRole('heading', { name: 'The chat hit a detour.', exact: true })).toBeVisible();
    await expect(a.page.getByRole('alert')).toContainText(/not found|expired/i);
    await expect(a.page.getByRole('link', { name: 'Create a fresh room ↗', exact: true })).toHaveAttribute('href', '/play');
    await expect(a.page.locator('.loading-state')).toHaveCount(0);
    await noBrowserErrors([a], info);
  } finally { await close([a]); }
});
