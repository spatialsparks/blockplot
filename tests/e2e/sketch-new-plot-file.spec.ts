import { readFileSync } from 'node:fs';
import { expect, openMap, rests, test, viewOf } from './sketch-own-pad';

// A plot made from a GeoJSON file of its outline (story ST-045, task T-045.5): the story's one
// end-to-end test, its main path. The made-up pentagon of the first hand case of a plot, given to
// New plot as a file of LV95 with no `crs`, taken onto the map without a corner clicked, named and
// made. It names nothing of the cadastre, and so passes in both trees, Blockplot's among them. On
// a pad and a stand-in of its own (sketch-own-pad.ts), of made-up ground, in a browser that takes
// no folder - as sketch-new-plot-made.spec.ts has it: the plot made is offered as its file. Every
// refusal, WGS84 converted and the ring's rule are the fast gate's, geojson.check.js and
// marking-geojson.check.js. Page code is handed over as text.

/** This machine's day, as the plot says the day its file was read on: `2026-10-23`. */
const today = (): string => new Date().toLocaleDateString('sv-SE');
// The pentagon's corners in LV95, each `[e, n]`, and the file that gives them: a Feature with a
// name, its Polygon closed by the first corner again, and no crs.
const CORNERS = [
  [2600020, 1200010],
  [2600038, 1200034],
  [2600028.4, 1200041.2],
  [2600010, 1200030],
  [2600004, 1200022],
];
const GEOJSON = {
  type: 'Feature',
  properties: { name: 'Trial slope' },
  geometry: { type: 'Polygon', coordinates: [[...CORNERS, CORNERS[0]]] },
};
const FILE = {
  name: 'trial-slope.geojson',
  mimeType: 'application/geo+json',
  buffer: Buffer.from(JSON.stringify(GEOJSON)),
};
/** The corners as the body says them, `marked`: each to the centimetre, a blank a corner. */
const MARKED = CORNERS.map((corner) => corner.map((at) => at.toFixed(2)).join()).join(' ');
const FIRST_SAID =
  'Choose a GeoJSON file of your plot, or paste one: it is read in this page, and nothing of it is sent.';
// The plot of the pentagon taken from a file (T-045.1), as the page makes it: of another day, it
// says that day - the day its file was read, and the days of its ground.
const GOLDEN = readFileSync(
  new URL('../__fixtures__/new-plot/trial-slope-file.json', import.meta.url),
  'utf8',
);
const madeOn = (day: string): string => GOLDEN.replaceAll('on 2026-10-20', `on ${day}`);
// What the page asks of the terrain for that plot, one thing after the other, as
// sketch-new-plot-made.spec.ts has it: the collection, the tiles by their names, and of each tile
// its head and two parts. And the address of a picture of the map.
const tileOf = (name: string): string[] =>
  Array<string>(3).fill(`/ch.swisstopo.swissalti3d/${name}/${name}_0.5_2056_5728.tif`);
const TERRAIN = ['/api/stac/v1/collections/ch.swisstopo.swissalti3d', '/api/stac/v1/search'];
TERRAIN.push(...tileOf('swissalti3d_2021_2599-1200'), ...tileOf('swissalti3d_2025_2600-1200'));
const TERRAIN_AT = /^\/(api\/stac\/|ch\.swisstopo\.swissalti3d\/)/;
const PICTURE = /^\/1\.0\.0\/ch\.[a-z.-]+\/default\/current\/2056\/\d+\/\d+\/\d+\.(png|jpeg)$/;

// In a browser that takes no folder: the plot made is offered as its file.
test.beforeEach(async ({ pad }) => {
  await pad.browser.addInitScript(() => {
    delete (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  });
});

test('a GeoJSON file of the pentagon chosen, taken and made, and nothing of it sent', async ({
  pad,
}, testInfo) => {
  const page = await openMap(pad);
  // Every request of the page from here on: none may carry the file.
  const sent: (string | null)[] = [];
  page.on('request', (request) => sent.push(request.postData()));
  const said = page.locator('#file-said');
  const take = page.locator('#file-take');
  const body = page.locator('body');
  await expect(said).toHaveText(FIRST_SAID);
  await expect(take).toBeEnabled();
  // The file chosen and taken: its five corners marked as the file gives them, on nothing, its
  // own as given; no parcel.
  await page.locator('#file-choose').setInputFiles(FILE);
  await take.click();
  await expect(said).toHaveText("The file's outline is marked: 5 corners.");
  await expect(body).toHaveAttribute('data-marked', MARKED);
  await expect(body).toHaveAttribute('data-file', 'lv95');
  await expect(body).toHaveAttribute('data-given', 'true');
  await expect(body).toHaveAttribute('data-on', '');
  await expect(body).toHaveAttribute('data-parcel', '');
  await expect(page.locator('#corners-said')).toHaveText('5 corners, 520 m².');
  await expect(page.locator('#no-survey')).toHaveText(
    'From a file you gave: no survey, and of no legal effect.',
  );
  // The map gone to them: the middle of their box, E 2 600 021, N 1 200 025.6, at rest.
  const middle = async (): Promise<number[]> => {
    const { e, n } = await viewOf(page);
    return [e, n];
  };
  await expect.poll(middle).toEqual([2_600_021, 1_200_025.6]);
  await rests(page, (await viewOf(page)).level);
  await page.screenshot({ path: testInfo.outputPath('file.png') });
  // Named and made: its file offered as plot.json - the golden plot of a file, of today.
  await page.locator('#name').fill('Trial slope');
  const offered = page.waitForEvent('download');
  await page.locator('#make').click();
  const download = await offered;
  expect(download.suggestedFilename()).toBe('plot.json');
  const text = readFileSync(await download.path(), 'utf8');
  expect(text === madeOn(today()), 'the file offered is not the golden one of today').toBe(true);
  await page.waitForURL(({ pathname }) => pathname === '/');
  // No request of the page carried a body. And the stand-in was asked, all of it by the page with
  // the pad's origin, pictures of the map and the eight GETs of the ground, one after the other -
  // for those, at most a preflight - and nothing else: no search, and no word of the file.
  expect(sent.filter((one) => one !== null)).toEqual([]);
  const heard = await pad.standIn.asked();
  expect(heard.filter((one) => one.origin !== pad.origin)).toEqual([]);
  const gets = heard.filter(({ method, target }) => method === 'GET' && TERRAIN_AT.test(target));
  expect(gets.map(({ target }) => target.split('?')[0])).toEqual(TERRAIN);
  expect(gets.every((one) => one.beside === 0)).toBe(true);
  const rest = heard.filter((one) => !gets.includes(one) && one.method === 'GET');
  expect(rest.filter(({ target }) => !PICTURE.test(target)).map((one) => one.target)).toEqual([]);
  const other = heard.filter((one) => one.method !== 'GET');
  expect(other.every((one) => one.method === 'OPTIONS' && TERRAIN_AT.test(one.target))).toBe(true);
  expect(/trial|slope|geojson|feature|polygon/i.test(JSON.stringify(heard))).toBe(false);
});
