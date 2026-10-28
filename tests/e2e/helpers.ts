import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import type { ClientAction, Mode, RoomView } from '../../packages/shared/types';

export type Actor = {
  context: BrowserContext; page: Page; name: string;
  states: RoomView[]; frames: string[]; errors: string[]; pageErrors: string[]; socketUrls: string[];
};

export async function actor(browser: Browser, name: string, mobile = false): Promise<Actor> {
  const context = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8787',
    ...(mobile ? { viewport: { width: 390, height: 720 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
  const page = await context.newPage();
  const result: Actor = { context, page, name, states: [], frames: [], errors: [], pageErrors: [], socketUrls: [] };
  page.on('pageerror', error => result.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /Content Security Policy|Refused to (?:execute|connect|load)/i.test(message.text())) result.pageErrors.push(message.text());
  });
  page.on('websocket', socket => {
    result.socketUrls.push(socket.url());
    socket.on('framereceived', frame => {
      const value = typeof frame.payload === 'string' ? frame.payload : frame.payload.toString();
      result.frames.push(value);
      try {
        const message = JSON.parse(value);
        if (message.type === 'state') result.states.push(message.state);
        if (message.type === 'error') result.errors.push(message.message);
      } catch { /* Invalid server frames are covered by the absence of state below. */ }
    });
  });
  // Retain the application's own socket for adversarial actions that the UI
  // correctly prevents (self-voting, repeated votes, unauthorized host actions).
  await page.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = new Proxy(Native, {
      construct(Target, args) {
        const socket = new Target(args[0], args[1]);
        (window as unknown as { __deletectiveSocket: WebSocket }).__deletectiveSocket = socket;
        return socket;
      },
    });
  });
  return result;
}

export function latest(a: Actor): RoomView { return a.states[a.states.length - 1]; }
export async function hydrate(page: Page) {
  await page.waitForFunction(() => Array.from(document.querySelectorAll('astro-island')).every(element => !element.hasAttribute('ssr')));
}

export async function create(a: Actor, mode: Mode, rounds = 1, pack = 'all'): Promise<string> {
  await a.page.goto(`/play?mode=${mode}`);
  await hydrate(a.page);
  await a.page.getByLabel('What should we call you?').fill(a.name);
  await a.page.getByLabel('Who’s playing?').selectOption(mode);
  if (pack !== 'all') {
    await a.page.getByText('Make it your kind of chaos · round settings', { exact: true }).click();
    await a.page.getByLabel('Prompt pack').selectOption(pack);
  }
  await a.page.getByRole('button', { name: /^Create .* room/ }).click();
  await a.page.waitForURL(/\/room\?code=[A-Z2-9]{8}$/);
  await expect.poll(() => latest(a)?.phase).toBe('lobby');
  await a.page.getByText('Adjust this session', { exact: true }).click();
  await a.page.getByRole('combobox', { name: 'Rounds', exact: true }).selectOption(String(rounds));
  await a.page.getByRole('combobox', { name: 'Timer', exact: true }).selectOption('60');
  await expect.poll(() => latest(a)?.settings.rounds).toBe(rounds);
  return latest(a).code;
}

export async function join(a: Actor, code: string) {
  await a.page.goto(`/room?code=${code}`);
  await hydrate(a.page);
  await a.page.getByLabel('What should we call you?').fill(a.name);
  await a.page.getByRole('button', { name: 'Join the chat' }).click();
  await expect.poll(() => latest(a)?.phase).toBe('lobby');
}

export async function waitPhase(actors: Actor[], phase: RoomView['phase']) {
  for (const a of actors) await expect.poll(() => latest(a)?.phase).toBe(phase);
}

export async function start(a: Actor, actors: Actor[], phase: RoomView['phase'] = 'writing') {
  await a.page.getByRole('button', { name: 'Everyone’s here. Let’s play ↗', exact: true }).click();
  await waitPhase(actors, phase);
}

export async function submit(a: Actor, text: string, reaction = false) {
  await a.page.getByRole('textbox').fill(text);
  await a.page.getByRole('button', { name: reaction ? /^Lock reaction/ : /^Lock answer/ }).click();
}

export async function raw(a: Actor, action: ClientAction) {
  await a.page.evaluate(value => {
    const socket = (window as unknown as { __deletectiveSocket: WebSocket }).__deletectiveSocket;
    socket.send(JSON.stringify({ ...value, requestId: crypto.randomUUID() }));
  }, action);
}

export async function ready(actors: Actor[], phase: 'reveal' | 'results') {
  for (const a of actors) {
    if (latest(a)?.phase !== phase) continue;
    const button = a.page.locator('.continue-bar button');
    if (await button.count()) await button.click();
  }
}

export async function finish(actors: Actor[]) {
  await waitPhase(actors, 'results');
  await ready(actors, 'results');
  await waitPhase(actors, 'complete');
}

export async function voteAll(actors: Actor[]) {
  await waitPhase(actors, 'voting');
  for (const a of actors) {
    const state = latest(a);
    const target = state.answers.find(answer => !answer.own);
    expect(target).toBeTruthy();
    const article = a.page.locator('.answer-card').filter({ hasText: target!.text });
    await article.getByRole('button', { name: 'Vote for this ↗', exact: true }).click();
  }
}

export async function noBrowserErrors(actors: Actor[], info: TestInfo) {
  for (const a of actors) expect(a.pageErrors, `${info.project.name}/${a.name} browser errors`).toEqual([]);
  for (const a of actors) expect(a.socketUrls.every(url => !url.includes('token=') && !url.includes('playerId='))).toBe(true);
}

export async function close(actors: Actor[]) {
  await Promise.allSettled(actors.map(a => a.context.close()));
}
