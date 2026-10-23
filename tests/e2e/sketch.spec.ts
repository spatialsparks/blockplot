import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The sketch pad, end to end, on its made-up plot: `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run -
// no case reads site.js, and where a case could be shown another plot than the made-up one, it
// asks yes or no first, so that a failure quotes nothing of it into a report (directive 34).

const fromRoot = (file: string): Buffer =>
  readFileSync(fileURLToPath(new URL(`../../${file}`, import.meta.url)));
const DEMO_SITE = fromRoot('tools/sketch/demo-site.js');
// The made-up sketch, in the form "Save file" writes: a small house on the made-up plot.
const SKETCH = fromRoot('tests/__fixtures__/sketch/made-up.json').toString('utf8');
// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE_KEY = 'blockplot/sketch/plot/example/space';

// What tools/sketch/demo-site.js says of its plot, worked out by hand there.
const PLOT = 'Made-up hillside plot';
const CREDIT = 'A made-up plot, for tests and for a look: no real property, no measured ground.';
// Its paper is 46 m down the plot, 31 m across it and 20 m up, in cells of half a metre.
const [ALONG, ACROSS, UP] = [92, 62, 40] as const;
// Each view: what its switch calls it, what it says it shows, and how many cells its paper is
// wide and high. The plot runs downhill at a bearing of 232 degrees, to the south-west: a slice
// along it is seen from a quarter on - 322 degrees, or 142 from the other side - and a slice
// across it from below, or from above at 52 degrees.
const ALONG_THE_PLOT = 'A slice along the plot, seen from the';
const ACROSS_THE_PLOT = 'A slice across the plot, seen from the';
const VIEWS = [
  { view: 'top', name: 'Top view', title: `${PLOT}, 644 m²`, cells: [ALONG, ACROSS] },
  { view: 'side', name: 'Side view', title: `${ALONG_THE_PLOT} north-west`, cells: [ALONG, UP] },
  { view: 'far', name: 'Other side', title: `${ALONG_THE_PLOT} south-east`, cells: [ALONG, UP] },
  {
    view: 'front',
    name: 'Front view',
    title: `${ACROSS_THE_PLOT} south-west`,
    cells: [ACROSS, UP],
  },
  { view: 'back', name: 'Back view', title: `${ACROSS_THE_PLOT} north-east`, cells: [ACROSS, UP] },
] as const;

// No such host exists: `.invalid` is reserved for that, and the case that asks it answers the
// address itself, in the browser.
const ELSEWHERE = 'https://example.invalid/';

interface Seen {
  /** Every error of the console, and every error no script caught. */
  readonly errors: string[];
  /** Every request to another origin than the page's own. */
  readonly elsewhere: string[];
}

/** What goes wrong in the page and what it asks of another origin, heard from before it loads. */
function watch(page: Page, baseURL: string | undefined): Seen {
  const own = new URL(baseURL ?? '').origin;
  const seen: Seen = { errors: [], elsewhere: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') seen.errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    seen.errors.push(error.message);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) seen.elsewhere.push(url);
  });
  return seen;
}

/** Fails unless the page is on the made-up plot: asked yes or no, and before any matcher reads the page. */
async function expectMadeUpPlot(page: Page): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
}

/** Puts the made-up sketch into the page's store, before the page loads. */
async function keepMadeUpSketch(page: Page): Promise<void> {
  const [key, sketch] = [JSON.stringify(STORE_KEY), JSON.stringify(SKETCH)];
  await page.addInitScript(`localStorage.setItem(${key}, ${sketch});`);
}

for (const { view, name, title, cells } of VIEWS) {
  test(`${name}: opens on the made-up plot, with no alarm, no error and no request elsewhere`, async ({
    page,
    baseURL,
  }) => {
    const seen = watch(page, baseURL);

    await page.goto(`/#${view}`);
    await expectMadeUpPlot(page);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(`${name} — sketch pad`);
    await expect(page.locator('#title')).toHaveText(title);
    await expect(page.locator('#credit')).toHaveText(CREDIT);
    // The paper was drawn: the canvas is the window, with no edge of the paper's (ST-042) - as
    // many of the screen's pixels as it is wide and high - and this view's paper lies on it from
    // left to right, each cell the same whole number of pixels.
    const [width, height, wide, high, px] = await page.evaluate<
      [number, number, number, number, number]
    >(
      `(({ width, height, clientWidth, clientHeight }) => [width, height, clientWidth,
        clientHeight, globalThis.zoom.px])(document.getElementById('paper'))`,
    );
    expect(width).toBeGreaterThan(0);
    expect([width, height]).toEqual([wide, high]);
    expect(Number.isInteger(px)).toBe(true);
    expect(cells[0] * px).toBeLessThanOrEqual(width);
    await expect(page.locator('#alarm')).toBeEmpty();
    expect(seen.errors).toEqual([]);
    expect(seen.elsewhere).toEqual([]);
  });
}

test('with the made-up sketch in its store, the top view lists the levels of that sketch', async ({
  page,
  baseURL,
}) => {
  const seen = watch(page, baseURL);
  await keepMadeUpSketch(page);

  await page.goto('/#top');
  await expectMadeUpPlot(page);

  // The side view shows from 806 to 826 m, and a level is named by the height of its floor. Row
  // 18 is 826 - 18 / 2 = 817 m: on it stand the two boxes of the night rooms, the bath and the
  // roof terrace, with twelve objects - three windows, two doors, a bed, a wardrobe, a desk and
  // its chair, a toilet, a washbasin and a shower. Row 24 is 814 m: on it stand the day rooms,
  // the porch, the store, the garden and the cut beside the day rooms, with thirteen objects - a
  // window, two doors, the staircase and the wide staircase beside it, a counter with a sink and
  // a hob on it, a fridge, a table and its two chairs, and a sofa. The cut is a block with no
  // name for which the category "Ground cut" was picked (story ST-028): its floor is the ground
  // where the hill stood higher, and from above it is a block as any other, the fifth on the
  // level of its floor - it makes none of its own. Row 28 is 812 m: there the lawn before the
  // porch has its floor, alone - a block of ground (story ST-027), a box 2 m high with its top in
  // row 24: its top shapes the ground, and from above it is a block too, on the level of its
  // floor. The car and the tree stand on the ground, the tree on the lawn. A top that slopes -
  // the porch's, the bath's - makes no level and takes no block off one: a level is the floor of
  // a block. The highest level is listed first, and is the one drawn on. The smaller house of
  // before is counted in sketch-file.spec.ts, and so is this one without its cut, and without
  // its lawn too.
  const layers = page.locator('#layers li');
  await expect(layers.locator('button:first-child')).toHaveText([
    'Level 817 m',
    'Level 814 m',
    'Level 812 m',
    'Ground',
  ]);
  await expect(layers.locator('small')).toHaveText([
    '4 blocks, 12 objects',
    '5 blocks, 13 objects',
    '1 block',
    '2 objects',
  ]);
  await expect(page.getByRole('button', { name: 'Level 817 m' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(seen.errors).toEqual([]);
  expect(seen.elsewhere).toEqual([]);
});

test('the made-up sketch is a file the pad saves: opened and saved again, it is the same, byte for byte', async ({
  page,
}) => {
  await keepMadeUpSketch(page);
  await page.goto('/#top');
  // Its three levels and the ground: the page has read the sketch.
  await expect(page.locator('#layers li')).toHaveCount(4);

  // "Save file" is an entry of the File menu: File first, which opens it.
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save file' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^sketch-\d{4}-\d{2}-\d{2}\.json$/);
  expect(readFileSync(await download.path(), 'utf8')).toBe(SKETCH);
});

test('no file is named site.js, and the page loads demo-site.js, the made-up site, byte for byte', async ({
  page,
  request,
}) => {
  expect(DEMO_SITE.includes(PLOT), 'demo-site.js is not the made-up site').toBe(true);
  // The server gives no plot (ST-040): site.js is no file, under whatever case - asked with no
  // page open first. Yes or no, each time: a matcher prints what it is handed.
  for (const name of ['/site.js', '/SITE.js']) {
    const asked = await request.get(name);
    expect(asked.status(), name).toBe(404);
  }
  // The page with nothing noted shows the example, and asks for the made-up site by its own
  // name, demo-site.js, in the place of site.js - which it never asks for.
  const named: string[] = [];
  page.on('request', (one) => named.push(new URL(one.url()).pathname));
  const [served] = await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname === '/demo-site.js'),
    page.goto('/'),
  ]);
  expect(served.status()).toBe(200);
  expect((await served.body()).equals(DEMO_SITE), 'the page got another site').toBe(true);
  await expect(page.locator('html[data-shown="example"]')).toHaveCount(1);
  expect(named.includes('/site.js'), 'the page asked for site.js').toBe(false);
});

// The cases above can fail: a request that leaves the page's origin is heard. The pad's policy
// refuses connections, not pictures, so a picture from elsewhere is asked for - and answered
// here, in the browser, so that nothing leaves this machine.
test('a request that leaves the origin of the page is heard', async ({ page, baseURL }) => {
  await page.route(`${ELSEWHERE}**`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );
  const seen = watch(page, baseURL);
  await page.goto('/');
  expect(seen.elsewhere).toEqual([]);

  await page.evaluate(`new Promise((done) => {
    const picture = new Image();
    picture.onload = picture.onerror = () => done();
    picture.src = ${JSON.stringify(`${ELSEWHERE}picture.svg`)};
  })`);

  expect(seen.elsewhere).toEqual([`${ELSEWHERE}picture.svg`]);
});
