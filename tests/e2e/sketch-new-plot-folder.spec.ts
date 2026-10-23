import type { Page } from '@playwright/test';
import { pick, test as folderTest } from './sketch-folder';
import { PENTAGON, WINDOW, clickAt, expect, rests, startOwn, type Own } from './sketch-own-pad';
import { NEAR_GOLDEN } from './sketch-cadastre';

// The story's main path, end to end (story ST-041, task T-041.5): on the pad served as plain
// files, with the stand-in for swisstopo, in a browser that takes folders, a plot marked, named
// and made lands in a folder picked as the very file that the pad's server made, shows in the
// pad, and asked the stand-in what the server asked and nothing more. Its pad and its stand-in
// are the case's own, started as sketch-own-pad.ts starts them (`startOwn`), behind the gate of
// the pad's checks; its browser is sketch-folder.ts's - a profile of its own, for a folder's
// handle in the store crashes any other (tools/sketch/store/CLAUDE.md, "Gotchas") - on the pad's
// address, and with the stand-in picker. One case: the other rows of the story's Behaviour are
// sketch-new-plot-made.spec.ts's. Page code is handed over as text.

const NOTE = "Somebody's note, which lay in the folder before.\n";
// The eight GETs of the ground that the server asked for that plot, one after the other, as
// sketch-new-plot-made.spec.ts states them - the collection, the tiles by their names, and of
// each tile its head and two parts - and their ranges, as making.check.js has them by hand.
const tileOf = (name: string): string[] =>
  Array<string>(3).fill(`/ch.swisstopo.swissalti3d/${name}/${name}_0.5_2056_5728.tif`);
const TERRAIN = ['/api/stac/v1/collections/ch.swisstopo.swissalti3d', '/api/stac/v1/search'];
TERRAIN.push(...tileOf('swissalti3d_2021_2599-1200'), ...tileOf('swissalti3d_2025_2600-1200'));
const TILE = ['bytes=0-16383', 'bytes=a part', 'bytes=a part'];
const RANGES = [null, null, ...TILE, ...TILE];
const TERRAIN_AT = /^\/(api\/stac\/|ch\.swisstopo\.swissalti3d\/)/;

// The case's pad and stand-in, started before its browser and stopped after it; the browser on
// the pad's address, letting the stand-in's origin through; and the gate, before the case's
// first page: what goes to neither the pad nor the stand-in is refused, and fails the case.
const test = folderTest.extend<{ own: Own }>({
  own: async ({ playwright }, use) => {
    const api = await playwright.request.newContext();
    let own: Own | null = null;
    try {
      own = await startOwn(api);
      await use(own);
    } finally {
      await Promise.all([own?.stop(), api.dispose()]);
    }
  },
  baseURL: async ({ own }, use) => use(own.origin),
  alsoAsks: async ({ own }, use) => use(own.standIn.origin),
  folders: async ({ folders, own }, use) => {
    const left: string[] = [];
    await folders.browser.route('**/*', (route) => {
      const to = new URL(route.request().url()).origin;
      if (to === own.origin || to === own.standIn.origin) return route.fallback();
      left.push(route.request().url());
      return route.abort('blockedbyclient');
    });
    await use(folders);
    expect(left, 'a request went to neither the pad nor its stand-in').toEqual([]);
  },
});

/** The record that the case's browser holds of a plot, as far as the case reads it - or null. */
type Held = { way: string; text: string; folder: string | null; opened: string };
const heldOf = (page: Page, id: string): Promise<Held | null> =>
  page.evaluate(`import('/store/held.js').then(async ({ plot }) => {
    const record = await plot(${JSON.stringify(id)});
    return record && { way: record.way, text: record.text, folder: record.folder?.name ?? null,
      opened: record.opened };
  })`);

test("a plot made from the map into a folder picked: the server's very file, shown in the pad", async ({
  folders,
  own,
}, testInfo) => {
  // Noon of the golden file's day, here; a folder `picked` with somebody's file in it, which the
  // picker hands over; and a cookie for the stand-in's host, which no request takes there.
  await folders.browser.clock.setFixedTime(new Date(2026, 9, 20, 12));
  await folders.write(NOTE, 'picked', 'note.txt');
  await folders.picks('picked');
  await folders.browser.addCookies([{ name: 'made-up', value: 'cookie', url: own.standIn.origin }]);
  // The pad's own page, told whom the map asks; File, "New plot"; Find `lane`, its first place,
  // level 28; the pentagon; the name.
  const page = await folders.browser.newPage();
  await page.setViewportSize(WINDOW);
  const asks = `?asks=${new URL(own.standIn.origin).port}`;
  await page.goto(`/${asks}`);
  await expect(page.locator('html[data-shown="example"]')).toHaveCount(1);
  await pick(page.locator('#new-plot'));
  await page.waitForURL(
    ({ pathname, search }) => `${pathname}${search}` === `/map/index.html${asks}`,
  );
  await rests(page, 15);
  await page.locator('#find-words').fill('lane');
  await page.locator('#find-words').press('Enter');
  await page.locator('#places > *').first().click();
  for (let at = 26; at < 28; at += 1) await page.keyboard.press('+');
  await rests(page, 28);
  await clickAt(page, ...PENTAGON);
  await expect(page.locator('#corners-said')).toHaveText('5 corners, 520 m².');
  await page.locator('#name').fill('Trial slope');
  // Made: the picker hands over `picked`, and the pad's own page opens on the plot made.
  await page.locator('#make').click();
  await page.waitForURL(({ pathname }) => pathname === '/');
  await expect(page.locator('html[data-shown="Trial slope"]')).toHaveCount(1);
  const shows = `globalThis.PLOT?.way === 'folder' && globalThis.SITE?.name === 'Trial slope'`;
  expect(await page.evaluate<boolean>(shows), 'the pad does not show the plot made').toBe(true);
  await expect(page.locator('#title')).toHaveText('Trial slope');
  await expect(page.locator('#alarm')).toBeEmpty();
  await page.screenshot({ path: testInfo.outputPath('made-folder.png') });

  // The folder: `Trial slope/plot.json`, the golden file byte for byte - of the photo where there
  // is no cadastre (sketch-cadastre.ts) - beside an empty `sketches/`; and what lay there before.
  const made = await folders.read('picked', 'Trial slope', 'plot.json');
  expect(made === NEAR_GOLDEN, 'the plot made is not the golden file').toBe(true);
  expect(await folders.list('picked')).toEqual(['Trial slope', 'note.txt']);
  expect(await folders.read('picked', 'note.txt')).toBe(NOTE);
  expect(await folders.list('picked', 'Trial slope')).toEqual(['plot.json', 'sketches']);
  expect(await folders.list('picked', 'Trial slope', 'sketches')).toEqual([]);
  // The store: the plot of the folder way, its folder's handle, that very text, of the day.
  const held = await heldOf(page, 'Trial slope');
  expect(held?.text === NEAR_GOLDEN, 'the plot held is not the golden file').toBe(true);
  expect(held).toMatchObject({ way: 'folder', folder: 'Trial slope', opened: '2026-10-20' });

  // What the stand-in heard of the ground: the eight GETs, target and range, one after the other,
  // with the pad's origin - and no other; at most a preflight of one of them; and of nothing that
  // it heard a referrer, the cookie, or a word of the plot's name.
  const heard = await own.standIn.asked();
  const gets = heard.filter(({ method, target }) => method === 'GET' && TERRAIN_AT.test(target));
  expect(gets.map(({ target }) => target.split('?')[0])).toEqual(TERRAIN);
  const parts = gets.map(({ range }) => range?.replace(/=[1-9]\d*-\d+$/, '=a part') ?? null);
  expect(parts).toEqual(RANGES);
  expect(gets.every((one) => one.beside === 0 && one.origin === own.origin)).toBe(true);
  const other = heard.filter((one) => one.method !== 'GET');
  expect(other.every((one) => one.method === 'OPTIONS' && TERRAIN_AT.test(one.target))).toBe(true);
  expect(heard.filter((one) => one.origin !== own.origin)).toEqual([]);
  for (const one of heard) expect(one).toMatchObject({ referer: null, cookie: null });
  expect(/trial|slope/i.test(JSON.stringify(heard))).toBe(false);
});
