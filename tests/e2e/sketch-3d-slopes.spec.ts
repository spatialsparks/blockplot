import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The tops that slope and the wide staircase on the pad's 3D page, end to end, on the made-up
// plot with made-up sketches (story ST-026): the made-up house, whose porch and whose bath have
// tops that slope, beside the same house made level, from one stand - in the Volumes, in White
// and in Materials the two pictures differ, and the sloping house hides less of the backdrop,
// while the page says as many solids of both; a wide staircase alone is sixteen parts, as a
// staircase is; and File's "3D file (GLB)" saves the sloping house, and says so. `pnpm sketch
// --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of site.js. The real plot
// is in no part of this run: a case asks yes or no whether its page is on the made-up plot,
// before a matcher reads that page (directive 34). What a rule builds under a slope, part by
// part, is its own check's, in Node: here a browser draws it, and saves it.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing slopes on it';
const THINGS = (JSON.parse(SKETCH) as { things: unknown[] }).things.length;
// Its solids: a thing each, but for the last two - the lawn, ground, and the cut: no solids.
const SOLIDS = THINGS - 2;
// The same house made level: what its porch and its bath say of a slope, taken out of the text
// (tests/__fixtures__/CLAUDE.md). Nothing else of it is another: where the two houses differ in
// a picture, a top slopes.
const SLOPES = [',"slope":{"x":[50,58],"z":[18,22]}', ',"slope":{"y":[30,38],"z":[12,14]}'];
const LEVEL = SLOPES.reduce((text, slope) => text.replace(slope, ''), SKETCH);
/** A sketch of one object alone, on the ground in the middle of the plot, as the pad keeps it. */
const alone = (kind: string): string =>
  JSON.stringify({
    space: 4,
    things: [{ kind, x: 40.5, y: 30, floor: 'ground' }],
    floors: [],
    notes: [],
    on: {},
    show: { top: {} },
  });
const WAYS = ['volumes', 'white', 'materials'] as const;
// So many pixels at the least, where two pictures differ and where one shows more backdrop.
const SOME = 1000;

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// What a picture of the stage shows against another of the same view: how many pixels of each
// are the backdrop - the colour in the top left corner of the picture, which the ground does
// not reach once it is switched off - and how many are another colour in the other. Two pixels
// are apart where one of red, green and blue differs by more than a tenth of what a screen
// shows; a pixel is the backdrop where none differs from it by more than 2 of 255. Where a sky
// is given - in Materials, whose sky pales towards the horizon (ST-033) - the backdrop is every
// colour between its horizon's and its zenith's, in red, in green and in blue, as near.
type Seen = Record<'backdrop' | 'backdropThere' | 'apart', number>;
type Sky = readonly (readonly number[])[] | null;
const seenIn = (png: Buffer, other: Buffer, sky: Sky = null): string => `Promise.all(
  ['${png.toString('base64')}', '${other.toString('base64')}'].map((png) => new Promise((done) => {
    const picture = new Image();
    picture.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [picture.width, picture.height];
      const pen = canvas.getContext('2d');
      pen.drawImage(picture, 0, 0);
      done(pen.getImageData(0, 0, canvas.width, canvas.height).data);
    };
    picture.src = 'data:image/png;base64,' + png;
  })),
).then(([here, there]) => {
  // How far a pixel of one picture is from a pixel of another: by the one of red, green and
  // blue that is furthest.
  const off = (of, at, to, from) =>
    Math.max(...[0, 1, 2].map((n) => Math.abs(of[at + n] - to[from + n])));
  const sky = ${JSON.stringify(sky)};
  const behind = (of, at) =>
    sky === null
      ? off(of, at, of, 0) <= 2
      : [0, 1, 2].every((n) => {
          const ends = sky.map((end) => end[n]);
          return of[at + n] >= Math.min(...ends) - 2 && of[at + n] <= Math.max(...ends) + 2;
        });
  const count = { backdrop: 0, backdropThere: 0, apart: 0 };
  for (let at = 0; at < here.length; at += 4) {
    if (behind(here, at)) count.backdrop += 1;
    if (behind(there, at)) count.backdropThere += 1;
    if (off(here, at, there, at) > 25) count.apart += 1;
  }
  return count;
})`;

/** What goes wrong in a page, and what it asks of another origin, heard from before it loads. */
function watch(page: Page, baseURL: string | undefined): Record<'errors' | 'elsewhere', string[]> {
  const own = new URL(baseURL ?? '').origin;
  const heard = { errors: [] as string[], elsewhere: [] as string[] };
  page.on('pageerror', (error) => heard.errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && heard.errors.push(message.text()));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.elsewhere.push(url);
  });
  return heard;
}
/** Opens a page of the pad, fails unless it is on the made-up plot - asked yes or no, before any matcher reads it - and says whether a stage is drawn there. */
async function open(page: Page, address = '/3d.html'): Promise<boolean> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  if (address !== '/3d.html') return false;
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}
/** The stage as it shows once it has been drawn: over when the browser has shown some frames more. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
  return page.locator('#stage canvas').screenshot();
}
/** Picks a way, and gives the picture of it once the body says that it shows. */
async function shownAs(page: Page, way: string): Promise<Buffer> {
  await page.locator(`button[data-way=${way}]`).click();
  await expect(page.locator('body')).toHaveAttribute('data-way', way);
  return picture(page);
}
/** What the body says under a name, as a number. */
const said = async (page: Page, name: string): Promise<number> =>
  Number(await page.locator('body').getAttribute(`data-${name}`));
/** Has a page of the pad keep a sketch, as the pad does with every stroke. */
const keeps = (pad: Page, sketch: string) =>
  pad.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(sketch)})`);

// Every case opens in a tab that has the made-up sketch in the pad's store.
test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

test('the sloping house differs from the same house made level in each of the three ways, and hides less of the backdrop', async ({
  page,
  context,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  test.skip(!(await open(page)), NO_STAGE);
  // The level house is the made-up one but for its two slopes: each was in the text once, and
  // it holds as many things.
  expect(SLOPES.map((slope) => SKETCH.split(slope).length)).toEqual([2, 2]);
  expect(LEVEL.includes('slope')).toBe(false);
  expect((JSON.parse(LEVEL) as { things: unknown[] }).things).toHaveLength(THINGS);

  // From the side, where the porch's roof falls to the right and the bath's toward the eye, and
  // with the ground off: all that is no house, car or tree is the backdrop then. The made-up
  // house in each way, and of its solids what the body says.
  await page.locator('#stands [data-stand="left"]').click();
  await page.getByLabel('Ground').uncheck();
  await expect(page.locator('body')).toHaveAttribute('data-ground', 'off');
  const sloping: Buffer[] = [];
  const solids: number[][] = [];
  for (const way of WAYS) {
    sloping.push(await shownAs(page, way));
    solids.push([await said(page, 'solids'), await said(page, 'shown')]);
  }
  // Another window keeps the level house, as the pad does with every stroke: this page draws
  // it with no reload and from where it stood - the picture is another. The level house in each
  // way, the last way first.
  const pad = await context.newPage();
  await open(pad, '/#top');
  await keeps(pad, LEVEL);
  await expect
    .poll(async () => (await picture(page)).equals(sloping.at(-1) ?? Buffer.of()))
    .toBe(false);
  const level: Buffer[] = [];
  for (const way of [...WAYS].reverse()) {
    level.unshift(await shownAs(page, way));
    expect([await said(page, 'solids'), await said(page, 'shown')]).toEqual([SOLIDS, SOLIDS]);
  }
  expect(solids).toEqual(WAYS.map(() => [SOLIDS, SOLIDS]));
  // In each way the two pictures differ - and the sloping house hides less: past the porch's
  // roof, which comes down to a metre over its floor, more of the backdrop shows. In Materials
  // that is the sky, as the page's lights give it.
  const sky = await page.evaluate<number[][]>(`import('/view3d/lights.js').then(({ SKY }) =>
    [SKY.horizon, SKY.zenith].map((hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))))`);
  for (const [at, way] of WAYS.entries()) {
    const [here, there] = [sloping[at], level[at]];
    if (!here || !there) throw new Error(`no picture of ${way}`);
    const seen = await page.evaluate<Seen>(seenIn(here, there, way === 'materials' ? sky : null));
    expect(seen.apart, `${way}: the two houses look alike`).toBeGreaterThan(SOME);
    expect(seen.backdropThere, `${way}: no backdrop`).toBeGreaterThan(SOME);
    expect(seen.backdrop - seen.backdropThere, `${way}: no more backdrop`).toBeGreaterThan(SOME);
  }
  // The page wrote nothing of the sketch, asked nobody else, and nothing went wrong.
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(LEVEL);
  expect(heard).toEqual({ errors: [], elsewhere: [] });
});

test('a wide staircase alone on the ground is sixteen parts, as a staircase is', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  test.skip(!(await open(page)), NO_STAGE);
  // Each alone in the pad's store, and the page loaded anew: one solid, and in White the steps
  // of a flight of one storey - sixteen, whichever of the two it is.
  for (const kind of ['widestairs', 'stairs']) {
    await keeps(page, alone(kind));
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-stage', 'drawn');
    await shownAs(page, 'white');
    const says = [await said(page, 'solids'), await said(page, 'shown'), await said(page, 'parts')];
    expect(says, kind).toEqual([1, 1, 16]);
  }
  expect(heard).toEqual({ errors: [], elsewhere: [] });
});

// The stage has the plot's x, its height over the lowest point of the ground - 809.56 m, as
// sketch-3d-file.spec.ts works it out - and its y the other way round.
const LOWEST_M = 809.56;
type Stretch = readonly [number, number];
/** The highest point of a binary glTF, in metres above sea level, among those that lie within a stretch of the plot's x and of its y: its meshes' places, three numbers of four bytes a point. */
function highestIn(file: Buffer, [x0, x1]: Stretch, [y0, y1]: Stretch): number {
  type Gltf = Record<'accessors' | 'bufferViews' | 'meshes', Record<string, unknown>[]>;
  expect(file.toString('latin1', 0, 4)).toBe('glTF');
  const long = file.readUInt32LE(12);
  const json = JSON.parse(file.toString('utf8', 20, 20 + long)) as Gltf;
  let highest = -Infinity;
  for (const mesh of json.meshes) {
    const [{ attributes }] = mesh['primitives'] as [{ attributes: { POSITION: number } }];
    const places = json.accessors[attributes.POSITION] as { bufferView: number; count: number };
    const from = 28 + long + Number(json.bufferViews[places.bufferView]?.['byteOffset']);
    for (let at = 0; at < places.count; at += 1) {
      const read = (byte: number): number => file.readFloatLE(from + 12 * at + byte);
      const [x, height, y] = [read(0), read(4) + LOWEST_M, -read(8)];
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) highest = Math.max(highest, height);
    }
  }
  return highest;
}

test('"3D file (GLB)", an entry of File, saves the sloping house, and says so', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  test.skip(!(await open(page)), NO_STAGE);
  expect(SLOPES.every((slope) => SKETCH.includes(slope))).toBe(true);
  await shownAs(page, 'white');
  // File first, which opens its menu, and then the entry.
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '3D file (GLB)' }).click(),
  ]);
  const name = download.suggestedFilename();
  expect(name).toMatch(/^house-\d{4}-\d{2}-\d{2}\.glb$/);
  await expect(page.locator('#said')).toHaveText(
    `Saved as ${name}, where this browser saves its files.`,
  );
  // The file holds the house under its two tops, by hand (docs/sketch/pad-gotchas.md, for a column
  // and a row in metres). At the porch's downhill end, x = 25 m, across its 6 m from y = 10 m
  // on, nothing is higher than the roof's member: 815 m, a metre over the porch's floor, and
  // 0.025 m more where the member is 0.05 m deep. It alone holds that height there: beside the
  // lawn the garden's railing ends short of the porch. A level porch stands to 817 m there. And
  // at the bath's outer wall, y = 9 m, by its corner at the terrace, nothing is higher than its
  // roof, which has come down a metre: 819 m, where a level bath stands to 820 m.
  const file = readFileSync(await download.path());
  expect(highestIn(file, [24.9, 25.01], [9.99, 16.01])).toBeCloseTo(815.025, 2);
  expect(highestIn(file, [17.5, 18.01], [8.99, 9.01])).toBeCloseTo(819, 2);
  // The page wrote nothing of the sketch, asked nobody else, and nothing went wrong.
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
  expect(heard).toEqual({ errors: [], elsewhere: [] });
});
