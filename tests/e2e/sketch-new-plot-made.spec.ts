import { readFileSync } from 'node:fs';
import type { Locator, Page, Route } from '@playwright/test';
import { PENTAGON, clickAt, expect, openNear } from './sketch-own-pad';
import { rests, test, wrongOf } from './sketch-own-pad';
import { NEAR_CREDIT, NEAR_GOLDEN } from './sketch-cadastre';

// A plot named and made, end to end (story ST-031, task T-031.7; made in the page since ST-041,
// T-041.3), and what sketch-new-plot.spec.ts had no room for: the folder that a name will get,
// with nothing asked; "Make the plot" with the pentagon of the first hand case of a plot - the
// ground asked by the page, the pad open on the new plot in all six views, its file offered, what
// the stand-in was asked; a plot marked on the aerial photo; what is refused, in words, with
// nothing held or offered. A corner set where a picture did not come is
// sketch-new-plot-unseen.spec.ts's. Each case has a pad and a stand-in of its own
// (sketch-own-pad.ts), of made-up ground, in a browser that takes no folder: a folder's handle in
// the store would crash this kind of browser (tools/sketch/store/CLAUDE.md, "Gotchas"), and the
// folder way is T-041.5's. Page code is handed over as text.

const FETCHING =
  'The ground is being fetched from swisstopo, and the plot is made of it: this takes a few seconds.';
const CROSSES = 'Its outline crosses itself.';
const lies = (folder: string): string => `It will lie in the folder "${folder}".`;
/** This machine's day, as the store notes the day a plot was opened: `2026-10-20`. */
const today = (): string => new Date().toLocaleDateString('sv-SE');
// The plot of the pentagon's order, as the pad's server made it on 2026-10-20 and as the page
// makes it (tools/sketch/new-plot/making.check.js) - on the photo where there is no cadastre
// (sketch-cadastre.ts): of another day, it says that day.
const madeOn = (day: string): string => NEAR_GOLDEN.replaceAll('on 2026-10-20', `on ${day}`);
// What the page asks of the terrain for that plot, one thing after the other, as the pad's server
// asked it: the collection, the tiles by their names, and of each tile its head and two parts.
const tileOf = (name: string): string[] =>
  Array<string>(3).fill(`/ch.swisstopo.swissalti3d/${name}/${name}_0.5_2056_5728.tif`);
const TERRAIN = ['/api/stac/v1/collections/ch.swisstopo.swissalti3d', '/api/stac/v1/search'];
TERRAIN.push(...tileOf('swissalti3d_2021_2599-1200'), ...tileOf('swissalti3d_2025_2600-1200'));
const SEARCH = '/rest/services/api/SearchServer?searchText=lane&type=locations&sr=2056&limit=10';
const PICTURE = /^\/1\.0\.0\/ch\.[a-z.-]+\/default\/current\/2056\/\d+\/\d+\/\d+\.(png|jpeg)$/;
/** A plot's file, as far as a case reads it: its words, its figures, and its lists. */
type Words = Record<'format' | 'name' | 'credit', string> & { sources: string[] };
type Figures = Record<'version' | 'cellM' | 'bearingDeg' | 'xFromM' | 'xToM' | 'yFromM', number>;
type Lists = { sideM: number[]; outline: number[][]; ground: { baseM: number; rowsCm: string[] } };
type Plot = Words & Figures & Lists & { yToM: number; originLV95: number[] };
/** The text of a plot that the browser of a page holds, by its id - or null. */
const heldOf = (page: Page, id: string): Promise<string | null> =>
  page.evaluate(
    `import('/store/held.js').then(async ({ plot }) => (await plot('${id}'))?.text ?? null)`,
  );
const TERRAIN_AT = /^\/(api\/stac\/|ch\.swisstopo\.swissalti3d\/)/;
// Every case in a browser that takes no folder: the plot made is offered as its file.
test.beforeEach(async ({ pad }) => {
  await pad.browser.addInitScript(() => {
    delete (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  });
});
/** The parts of the naming and the making, each by its id. */
const PARTS = { name: '#name', folder: '#folder', make: '#make', said: '#make-said', body: 'body' };
type Making = Record<keyof typeof PARTS, Locator>;
const makingOn = (page: Page): Making =>
  Object.fromEntries(Object.entries(PARTS).map(([k, at]) => [k, page.locator(at)])) as Making;
/** Waits until a window shows the pad on a plot, at the pad's own address and as a view, held in the browser (T-040.2) - asked yes or no, of its PLOT and its site: its id, and its name, which is the id unless another is given. */
async function onPlot(page: Page, id: string, at: string, view: string, name = id): Promise<void> {
  await page.waitForURL(({ pathname, hash }) => `${pathname}${hash}` === `/${at}`);
  await expect(page).toHaveTitle(`${view} — sketch pad`);
  await expect(page.locator(`html[data-shown="${id}"]`)).toHaveCount(1);
  const shows = `globalThis.PLOT?.way === 'file' && globalThis.SITE?.name === '${name}'`;
  expect(await page.evaluate<boolean>(shows), `/${at} is not the plot ${id}`).toBe(true);
}

test('a name shows the folder that the plot will get, at every letter, with nothing asked', async ({
  pad,
}) => {
  // The page asks no list of the plots (T-040.3): a name shows the folder that it gets were none
  // taken - but `home`, the pad's own, which gets -2.
  const page = await pad.browser.newPage();
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  await page.goto(pad.map);
  await rests(page, 15);
  const ours = asked.filter((url) => url.startsWith(pad.origin) && !/\.(js|css|html)$/.test(url));
  expect(ours).toEqual([`${pad.origin}${pad.map}`]);
  asked.length = 0;
  const { name, folder, make } = makingOn(page);
  await expect(name).toHaveAttribute('maxlength', '80');
  await expect(folder).toHaveText('');
  await name.fill('Terrace');
  await expect(folder).toHaveText(lies('Terrace'));
  // The pad's own two get a figure; what the rule of a folder does not take is left out, or
  // written plain; a name that Windows keeps for a device gets `plot-` before it; of blanks, nothing.
  const FOLDERS = ['home', 'home-2', '***', 'plot', 'con', 'plot-con', 'Example', 'Example-2'];
  FOLDERS.push('Bärenhöhe, Parzelle 12', 'Barenhohe Parzelle 12', '  ', '');
  for (let at = 0; at < FOLDERS.length; at += 2) {
    await name.fill(FOLDERS[at] ?? '');
    const its = FOLDERS[at + 1] ?? '';
    await expect(folder).toHaveText(its && lies(its));
  }
  // At every letter: the last one makes the name one of the pad's own two.
  await name.fill('');
  await name.pressSequentially('hom');
  await expect(folder).toHaveText(lies('hom'));
  await name.press('e');
  await expect(folder).toHaveText(lies('home-2'));
  await expect(page.locator('body')).toHaveAttribute('data-folder', lies('home-2'));
  // With a name and no corner, nothing is made. And nothing was asked for any of it - of the
  // pad's server neither, and of the stand-in the twelve pictures of the first view alone.
  await expect(make).toBeDisabled();
  await name.press('Enter');
  expect(asked).toEqual([]);
  expect(await pad.standIn.asked()).toHaveLength(12);
});

test('"Make the plot": the ground asked by the page, the file offered, the pad open on the plot', async ({
  pad,
}, testInfo) => {
  // A cookie that the browser holds for the stand-in's host: no request takes it there.
  await pad.browser.addCookies([{ name: 'made-up', value: 'cookie', url: pad.standIn.origin }]);
  const page = await openNear(pad, 28);
  const { name, folder, make, said, body } = makingOn(page);
  // Off until there are three corners and a name.
  await clickAt(page, ...PENTAGON.slice(0, 4));
  await name.fill('Trial slope');
  await expect(folder).toHaveText(lies('Trial slope'));
  await expect(make).toBeDisabled();
  await clickAt(page, ...PENTAGON.slice(4));
  await expect(page.locator('#corners-said')).toHaveText('5 corners, 520 m².');
  await expect(make).toBeEnabled();
  await name.fill(' ');
  await expect(make).toBeDisabled();
  await name.fill(' Trial slope ');
  // Pressed: the ground is asked once, by the page - the case holds its first request back - the
  // button is off, and the page says that the ground is being fetched. A second press, and Enter
  // in the field, do nothing, and a letter typed meanwhile takes nothing of what it says away.
  const orders: string[] = [];
  page.on('request', (request) => request.method() === 'POST' && orders.push(request.url()));
  const held: Route[] = [];
  await page.route('**/api/stac/v1/collections/**', (route) => void held.push(route));
  const offered = page.waitForEvent('download');
  await make.click();
  await expect.poll(() => held.length).toBe(1);
  await expect(make).toBeDisabled();
  await expect(said).toHaveText(FETCHING);
  await expect(body).toHaveAttribute('data-making', 'true');
  for (const key of ['Enter', '!']) await name.press(key);
  await page.evaluate(`document.getElementById('naming').requestSubmit()`);
  await expect(said).toHaveText(FETCHING);
  expect(held).toHaveLength(1);
  await held[0]?.fallback();
  // Made: its file offered as plot.json - the plot the server made of that order, but for the
  // day - and the pad's own address on the plot held in the browser, that very text, from above -
  // its name in the toolbar, no alarm - in the map's place: the history is two steps.
  const download = await offered;
  expect(download.suggestedFilename()).toBe('plot.json');
  const text = readFileSync(await download.path(), 'utf8');
  expect(text === madeOn(today()), 'the file offered is not the golden one of today').toBe(true);
  await onPlot(page, 'Trial slope', '', 'Top view');
  expect((await heldOf(page, 'Trial slope')) === text, 'the plot held is not the file').toBe(true);
  expect(await page.evaluate<number>('history.length')).toBe(2);
  await expect(page.locator('#title')).toHaveText('Trial slope');
  await expect(page.locator('#alarm')).toBeEmpty();
  await expect(page.locator('#layers li')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('made.png') });
  // Each of the five other views, by its key, is that plot with no alarm; and 3D drew it.
  const VIEWS = { side: 'Side view', far: 'Other side', front: 'Front view', back: 'Back view' };
  for (const [at, [hash, view]] of Object.entries(VIEWS).entries()) {
    await page.keyboard.press(String(at + 2));
    await onPlot(page, 'Trial slope', `#${hash}`, view);
    await expect(page.locator('#alarm')).toBeEmpty();
  }
  await page.keyboard.press('6');
  await onPlot(page, 'Trial slope', '3d.html', '3D');
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  await expect(page.locator('body')).toHaveAttribute('data-solids', '0');
  // "Open plot" lists it, with the area that its outline encloses.
  await page.keyboard.press('1');
  await onPlot(page, 'Trial slope', 'index.html#top', 'Top view');
  await page.locator('#file-menu').click();
  await page.locator('#open-plot').click();
  const listed = page.locator('#plot-list > p').filter({ hasText: 'Trial slope' });
  await expect(listed).toHaveText(`Trial slope 520 m², opened ${today()}, this browser, shows now`);
  // Its file: of version 2, with the frame, the outline and the paper of the hand case - 80 cells
  // by 60 - and x downhill: in every row of the ground the first height is the largest. Every
  // height of it is the golden file's, tests/__fixtures__/new-plot/trial-slope.json.
  const file = JSON.parse(text) as Plot;
  expect([file.format, file.version, file.name]).toEqual(['blockplot/plot', 2, 'Trial slope']);
  expect([file.bearingDeg, file.originLV95]).toEqual([36.8699, [2600020, 1200010]]);
  expect([file.ground.baseM, file.sideM]).toEqual([554, [551, 575]]);
  expect(file.outline.flat()).toEqual([0, 0, 30, 0, 30, 12, 10, 20, 0, 20]);
  const cells = [file.xToM - file.xFromM, file.yToM - file.yFromM].map((m) => m / file.cellM);
  const rows = file.ground.rowsCm.map((row) => row.split(' ').map(Number));
  const falls = rows.every((row) => row.length === 81 && Math.max(...row.slice(1)) < (row[0] ?? 0));
  expect([cells, rows.length, falls]).toEqual([[80, 60], 61, true]);
  expect(file.credit).toBe(NEAR_CREDIT);
  // What the stand-in was asked, all of it by the page, with the pad's origin: pictures of the
  // map, one search and the eight GETs of the terrain, one after the other - and for those, at
  // most a preflight. No order went to the pad's server, and no request holds a word of the
  // plot's name, a referrer or the cookie.
  expect(orders).toEqual([]);
  const heard = await pad.standIn.asked();
  expect(heard.filter((one) => one.origin !== pad.origin)).toEqual([]);
  const gets = heard.filter(({ method, target }) => method === 'GET' && TERRAIN_AT.test(target));
  expect(gets.map(({ target }) => target.split('?')[0])).toEqual(TERRAIN);
  expect(gets.every((one) => one.beside === 0)).toBe(true);
  const rest = heard.filter((one) => !gets.includes(one) && one.method === 'GET');
  expect(rest.filter(({ target }) => !PICTURE.test(target)).map((one) => one.target)).toEqual([
    SEARCH,
  ]);
  const other = heard.filter((one) => one.method !== 'GET');
  expect(other.every((one) => one.method === 'OPTIONS' && TERRAIN_AT.test(one.target))).toBe(true);
  for (const one of heard) expect(one).toMatchObject({ referer: null, cookie: null });
  expect(/trial|slope/i.test(JSON.stringify(heard))).toBe(false);
});

test('corners marked with the aerial photo showing: the plot says so for good', async ({ pad }) => {
  // The photo at the switch, and three corners on it: 10 m east of the first, and 10 m north.
  const page = await openNear(pad, 28);
  const { name, body } = makingOn(page);
  await page.locator('#photo').click();
  expect(await rests(page, 28)).toMatchObject({ shows: 'photo' });
  await clickAt(page, 0, 0, 100, 0, 0, 100);
  await expect(page.locator('#corners-said')).toHaveText('3 corners, 50 m².');
  await expect(body).toHaveAttribute('data-on', 'photo');
  // Enter in the field of the name makes the plot, as the button does - under the id that the
  // name's folder gives, and the name as it was given.
  await name.fill('Photo, of 50 m²');
  await name.press('Enter');
  await onPlot(page, 'Photo of 50 m', '', 'Top view', 'Photo, of 50 m²');
  const { credit, sources } = JSON.parse((await heldOf(page, 'Photo of 50 m')) ?? '') as Plot;
  expect(credit).toBe(
    'Outline: marked by hand on the aerial photo, no survey. Ground: swissALTI3D. © swisstopo',
  );
  expect(sources[0]).toMatch(
    /^Outline: marked by hand on the aerial photo, on 20\d\d-\d\d-\d\d\. /,
  );
});

test('what is refused is said in words, and nothing is held or offered', async ({ pad }) => {
  const page = await openNear(pad, 28);
  const { name, make, said } = makingOn(page);
  const paper = page.locator('#paper-said');
  const [orders, offered]: [string[], string[]] = [[], []];
  page.on('request', (request) => request.method() === 'POST' && orders.push(request.url()));
  page.on('download', (download) => offered.push(download.suggestedFilename()));
  // The four corners of a bow - a rectangle's, in the order 1, 2, 4, 3: said beside the paper,
  // with no sheet on the map; and at the press, in the same sentence, with nothing asked.
  await clickAt(page, 0, 0, 240, 0, 0, 160, 240, 160);
  await expect(page.locator('#corners-said')).toHaveText('4 corners.');
  await expect(paper).toHaveText(CROSSES);
  await expect(page.locator('#sheet')).toHaveAttribute('points', '');
  await name.fill('Bow');
  await make.click();
  await expect(said).toHaveText(CROSSES);
  await expect(make).toBeEnabled();
  // What was said of a press holds no longer once the plot is another.
  await page.locator('#start-again').click();
  await expect(said).toHaveText('');
  // Half a metre a pixel, for what follows. A paper too large is sketch-new-plot-large.spec.ts's.
  for (const level of [27, 26]) {
    await page.locator('#further').click();
    await rests(page, level);
  }
  // The bow was no order, and the stand-in was asked nothing for it: pictures and the one
  // search, and nothing of the terrain.
  const heard = await pad.standIn.asked();
  expect(heard.filter(({ target }) => TERRAIN_AT.test(target))).toEqual([]);
  // With the stand-in stopped the ground does not come: the page says what did not come, in the
  // words that the pad's server said, and the button is on again.
  await clickAt(page, 0, 0, 40, 0, 0, 40);
  await expect(page.locator('#corners-said')).toHaveText('3 corners, 200 m².');
  await pad.standIn.stop();
  await make.click();
  await expect(said).toHaveText(
    `The plot was not made: The ground did not come: The service could not be reached: ${pad.standIn.origin}/api/stac/v1/collections/ch.swisstopo.swissalti3d`,
  );
  await expect(make).toBeEnabled();
  expect(await wrongOf(pad, 1)).toEqual(['Failed to load resource: net::ERR_CONNECTION_REFUSED']);
  // And of both nothing was sent, held or offered: no order, no plot in the browser's store, no
  // file.
  expect(orders).toEqual([]);
  const none = `import('/store/held.js').then(async ({ held }) => (await held()).length)`;
  expect([await page.evaluate<number>(none), offered]).toEqual([0, []]);
});
