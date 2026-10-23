import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';
import { placeOf } from './sketch-paper';

// The plot a page shows, from the browser (story ST-040, task T-040.2), on the made-up pad of the
// project, `pnpm sketch --demo`: a page shows the plot that its tab notes, else the one that the
// browser showed last - a plot the browser holds, read from its store, or the example - and the
// pad's own plot where neither is noted. Plots are held by the case: a page imports the pad's
// own store, /store/held.js, and holds the made-up fixtures of tests/__fixtures__/plots as plots
// of the file way - no folder's handle, which would want a profile of its own. Each case has a
// browser of its own, which holds nothing as it begins. A case asks yes or no which plot a page
// shows (`SITE.name`, `PLOT`) once the page marks itself shown (`html[data-shown]`), and after
// every case no page has said an error or asked another origin (directive 34).

// The made-up plots: of each its name, the key that the browser keeps its sketch under (`keyOf`
// of tools/sketch/store/rules.js, stated a second time) and how many cells wide its paper is.
const PLOTS = {
  home: ['Made-up orchard plot', 'blockplot/sketch/space', 48],
  terrace: ['Made-up terrace, by the lake / north', 'blockplot/sketch/plot/terrace/space', 60],
  example: ['Made-up hillside plot', 'blockplot/sketch/plot/example/space', 92],
} as const;
type Plot = keyof typeof PLOTS;
// The two notes, `TAB` and `LAST` of tools/sketch/store/rules.js, stated a second time.
const [TAB, LAST] = ['blockplot/plot/tab', 'blockplot/plot/last'];
const fixture = (id: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../__fixtures__/plots/${id}/plot.json`, import.meta.url)),
    'utf8',
  );

/** A browser of the case's own, on the made-up pad, which hears what its pages say is wrong. */
const test = base.extend<{ own: BrowserContext }>({
  own: async ({ browser, baseURL }, use) => {
    if (baseURL === undefined) throw new Error('the project names no address of the pad');
    const [context, wrong] = [await browser.newContext({ baseURL }), [] as string[]];
    context.on('weberror', (error) => wrong.push(error.error().message));
    context.on('console', (message) => message.type() === 'error' && wrong.push(message.text()));
    context.on('request', (request) => {
      if (new URL(request.url()).origin !== baseURL) wrong.push(`asked: ${request.url()}`);
    });
    await use(context);
    expect(wrong).toEqual([]);
    await context.close();
  },
});

/** Holds the made-up plots in the browser's store, as plots of the file way, by the pad's own store and reader. Page code, handed over as text: these tests are typed for Node. */
async function hold(page: Page, ids: Plot[]): Promise<void> {
  const texts = JSON.stringify(Object.fromEntries(ids.map((id) => [id, fixture(id)])));
  await page.evaluate(`(async () => {
    const [{ hold }, { recordOf }, { read }] = await Promise.all(
      ['/store/held.js', '/store/rules.js', '/plot-file.js'].map((at) => import(at)));
    for (const [id, text] of Object.entries(${texts})) {
      await hold(recordOf({ id, site: read(text).site, text, way: 'file', day: '2026-10-20' }));
    }
  })()`);
}
/** Notes a plot for the tab, the browser's last, or both - null takes a note out. */
async function note(page: Page, notes: { tab?: string | null; last?: string | null }) {
  const [tab, last] = [JSON.stringify(notes.tab), JSON.stringify(notes.last)];
  await page.evaluate(`{
    const put = (store, key, id) => id === null ? store.removeItem(key) : id !== undefined && store.setItem(key, id);
    put(sessionStorage, '${TAB}', ${tab ?? 'undefined'});
    put(localStorage, '${LAST}', ${last ?? 'undefined'});
  }`);
}
/** Waits until a page marks itself shown on this plot, and fails unless it is that plot - asked yes or no, by its script's site and its PLOT: the example's own for the example. */
async function expectShown(page: Page, plot: Plot, way: 'file' | 'example') {
  await expect(page.locator(`html[data-shown="${plot}"]`)).toHaveCount(1);
  const named = `globalThis.SITE?.name === ${JSON.stringify(PLOTS[plot][0])}`;
  const own = JSON.stringify({ id: plot, key: PLOTS[plot][1], way });
  const plotted = `JSON.stringify(globalThis.PLOT) === '${own}'`;
  expect(await page.evaluate<boolean>(`${named} && ${plotted}`), `not the plot ${plot}`).toBe(true);
}
/** What the browser notes: the tab's plot and the last, and every key of the sketches' store. */
const notes = (page: Page): Promise<[string | null, string | null]> =>
  page.evaluate<[string | null, string | null]>(
    `[sessionStorage.getItem('${TAB}'), localStorage.getItem('${LAST}')]`,
  );
const keys = (page: Page): Promise<string[]> =>
  page.evaluate<string[]>(
    `Object.keys(localStorage).filter((key) => key.endsWith('/space')).sort()`,
  );
/** A block drawn with the Block tool, so many cells in from the corner of the plot's paper (sketch-paper.ts). */
async function block(page: Page, _plot: Plot, at: number): Promise<void> {
  await page.keyboard.press('b');
  await page.mouse.move(...(await placeOf(page, [at + 0.5, 8.5])));
  await page.mouse.down();
  await page.mouse.move(...(await placeOf(page, [at + 5.5, 13.5])), { steps: 6 });
  await page.mouse.up();
}
const things = (page: Page): Promise<number> => page.evaluate<number>('sketch.doc.things.length');

test('a fresh browser opens on the made-up plot at once, and notes nothing', async ({ own }) => {
  const page = await own.newPage();
  await page.goto('/#top');
  // At once: the example's scripts have run by the time the page is there.
  const at = `globalThis.SITE?.name === ${JSON.stringify(PLOTS.example[0])} && globalThis.PLOT?.id === 'example'`;
  expect(await page.evaluate<boolean>(at)).toBe(true);
  await expectShown(page, 'example', 'example');
  expect([await notes(page), await page.evaluate('globalThis.GONE')]).toEqual([
    [null, null],
    undefined,
  ]);
});

test("the tab's plot shows in the five views, 3D and Info, with its sketch under its own key", async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#side');
  await hold(page, ['terrace', 'home']);
  await note(page, { tab: 'terrace' });
  await page.reload();
  await expectShown(page, 'terrace', 'file');
  // The tab notes it, and the browser as the last; a block drawn is under its own key alone.
  expect(await notes(page)).toEqual(['terrace', 'terrace']);
  await block(page, 'terrace', 10);
  await expect.poll(() => keys(page)).toEqual([PLOTS.terrace[1]]);
  // Each of the four other views, by its key, and 3D, and Info: the same plot, its block there.
  const VIEWS = { 1: 'Top view', 3: 'Other side', 4: 'Front view', 5: 'Back view' };
  for (const [key, view] of Object.entries(VIEWS)) {
    await page.keyboard.press(key);
    await expect(page).toHaveTitle(`${view} — sketch pad`);
    await expectShown(page, 'terrace', 'file');
    expect(await things(page)).toBe(1);
  }
  await page.goto('/3d.html');
  await expectShown(page, 'terrace', 'file');
  await expect(page.locator('body')).toHaveAttribute('data-solids', '1');
  await page.goto('/info.html');
  await expectShown(page, 'terrace', 'file');
  // Home noted for the tab: its sketch is the first key's, which holds nothing - and the terrace's
  // block stays under the terrace's key.
  await note(page, { tab: 'home' });
  await page.goto('/#side');
  await expectShown(page, 'home', 'file');
  expect([await things(page), await notes(page)]).toEqual([0, ['home', 'home']]);
  await block(page, 'home', 4);
  await expect.poll(() => keys(page)).toEqual([PLOTS.terrace[1], PLOTS.home[1]]);
});

test('a new page opens on the plot shown last; two windows on two plots each keep theirs', async ({
  own,
}) => {
  const one = await own.newPage();
  await one.goto('/#top');
  await hold(one, ['terrace', 'home']);
  await note(one, { tab: 'terrace' });
  await one.reload();
  await expectShown(one, 'terrace', 'file');
  // A new page of the same browser: the last, which it notes for its own tab.
  const two = await own.newPage();
  await two.goto('/#side');
  await expectShown(two, 'terrace', 'file');
  expect(await notes(two)).toEqual(['terrace', 'terrace']);
  // The second window on home: the last is home - and the first, reloaded, keeps its terrace,
  // and notes it the last again; the second, reloaded, keeps home.
  await note(two, { tab: 'home' });
  await two.reload();
  await expectShown(two, 'home', 'file');
  expect(await notes(one)).toEqual(['terrace', 'home']);
  await one.reload();
  await expectShown(one, 'terrace', 'file');
  await one.goto('/3d.html');
  await expectShown(one, 'terrace', 'file');
  await two.reload();
  await expectShown(two, 'home', 'file');
  // A third page opens on the one shown last: home.
  const three = await own.newPage();
  await three.goto('/info.html');
  await expectShown(three, 'home', 'file');
});

test('the example noted shows the example, under its own key', async ({ own }) => {
  const page = await own.newPage();
  await page.goto('/#side');
  await note(page, { last: 'example' });
  await page.reload();
  await expectShown(page, 'example', 'example');
  expect(await notes(page)).toEqual(['example', 'example']);
  await expect(page.locator('#credit')).toHaveText(/^A made-up plot, for tests and for a look: /);
  await block(page, 'example', 40);
  await expect.poll(() => keys(page)).toEqual([PLOTS.example[1]]);
});

test('a note of a plot the browser does not hold opens the example, says it GONE and takes both notes out', async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#top');
  await note(page, { tab: 'nowhere', last: 'nowhere' });
  await page.reload();
  await expectShown(page, 'example', 'example');
  expect([await page.evaluate('globalThis.GONE'), await notes(page)]).toEqual([
    'nowhere',
    [null, null],
  ]);
});
