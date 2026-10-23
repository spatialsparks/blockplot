import { expect, test, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// Objects as I want them (story ST-037), end to end: the story's main path, the first row of its
// Behaviour, on the made-up plot. From above, on an empty sketch of the test's own, a wardrobe
// and a staircase are picked in the gallery and set down with a click each; with Select the
// wardrobe's end is dragged two cells further, 1.5 to 2.5 m, and the staircase's end four, 4.5
// to 6.5 m. The line under the paper says the staircase's steps, the sketch that the browser
// keeps says the two lengths - of the version the pad writes - and the 3D page in White builds
// the staircase with four steps more than at the size it was set down at and the wardrobe with
// one door more: five parts, by the page's own count (`data-parts`), never by hand. Then the
// wardrobe is clicked and Delete pressed - gone; Undo - back, 2.5 m long; and the right button on
// it, which opens its menu and erases nothing, Delete in its menu - gone again. `pnpm sketch --demo` serves the pad, whose page puts tools/sketch/demo-site.js in
// the place of site.js: the real plot is in no part of this run, a page is asked yes or no
// whether it is on the made-up plot before a matcher reads it, and neither page asks another
// machine (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing is drawn';
// A place of the top view's paper, which is not shown from behind.
type Place = readonly [column: number, row: number];
type Thing = { kind: string; long?: number };
type Kept = { space: number; things: Thing[] };

// THE SKETCH, this test's own: nothing drawn, written as the pad writes an empty sketch.
const EMPTY = { space: VERSION, things: [], floors: [], notes: [], on: {}, show: { top: {} } };
// What is set down, in this order, and where: a click sets an object's middle down at the nearest
// half cell, and what is whole cells long lies on whole cells (sketch.js, `rect`). The wardrobe,
// 1.5 m by 0.5 m, lies from column 19 to 22 in row 20: its east end is at 22. The staircase,
// 4.5 m by 1 m, lies from column 36 to 45 and from row 30 to 32: its east end is at 45.
const SET_DOWN: readonly [kind: string, at: Place][] = [
  ['wardrobe', [20.3, 20.4]],
  ['stairs', [40.3, 30.4]],
];
// Each drag, from where it takes hold to where it lets go: the wardrobe's end two columns
// further, the staircase's four.
const DRAGS: readonly (readonly [Place, Place])[] = [
  [
    [21.9, 20.5],
    [23.9, 20.5],
  ],
  [
    [44.9, 31],
    [48.9, 31],
  ],
];
// Then: the wardrobe from column 19 to 24, its middle in 21.5; the staircase from 36 to 49.
const [ON_WARDROBE, ON_STAIRS]: readonly [Place, Place] = [
  [21.5, 20.5],
  [42.5, 31],
];
// What the line under the paper says of a staircase 3 m high and 6.5 m long (T-037.2's table).
const STEPS = '20 steps, each 15 cm by 32.5 cm';

/** Listens to a page from before it loads: every error it says, and every request to another origin. */
function listen(page: Page, origin: string): string[] {
  const heard: string[] = [];
  page.on('console', (message) => void (message.type() === 'error' && heard.push(message.text())));
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== origin) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Fails unless the page is on the made-up plot: asked yes or no, before a matcher reads it. */
async function expectMadeUp(page: Page): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the page is not on the made-up plot').toBe(true);
}

/** The sketch that the browser keeps, as the text it is kept as. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);

/** Has the browser keep a sketch, from a page: every other window of the pad hears of it. */
const keeps = (page: Page, text: string) =>
  page.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(text)})`);

/** Where a place of the top view's paper is on the page, in pixels (sketch-paper.ts). */
const onPaper = placeOf;

/** What the 3D page's body says under a name, as a number. */
const said = async (page: Page, name: string): Promise<number> =>
  Number(await page.locator('body').getAttribute(`data-${name}`));

test('a wardrobe dragged to 2.5 m and a staircase to 6.5 m from above are kept and built so, the line says its steps, and the wardrobe goes by Delete and by the menu', async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? '').origin;
  const heard = listen(page, origin);
  const sketch = JSON.stringify(JSON.stringify(EMPTY));
  await page.addInitScript(
    `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${sketch});`,
  );
  await page.goto('/#top');
  await expectMadeUp(page);
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.waitForLoadState('load');

  // O, and each picked by its tile in the gallery and set down by a click on the paper.
  await page.keyboard.press('o');
  for (const [kind, at] of SET_DOWN) {
    await page.locator(`#gallery button[data-kind="${kind}"]`).click();
    await expect(page.locator('#gallery [aria-pressed="true"]')).toHaveAttribute('data-kind', kind);
    await page.mouse.click(...(await onPaper(page, at)));
  }
  const things = async (): Promise<Thing[]> => (JSON.parse(await keptText(page)) as Kept).things;
  const lengths = async () => (await things()).map(({ kind, long }) => [kind, long]);
  await expect.poll(lengths).toEqual([
    ['wardrobe', undefined],
    ['stairs', undefined],
  ]);

  // S, and the two ends dragged, each with the far end staying.
  await page.keyboard.press('s');
  for (const [from, to] of DRAGS) {
    await page.mouse.move(...(await onPaper(page, from)));
    await page.mouse.down();
    await page.mouse.move(...(await onPaper(page, to)), { steps: 6 });
    await page.mouse.up();
  }
  // The sketch that the browser keeps: of the version the pad writes, with the two lengths.
  await expect.poll(lengths).toEqual([
    ['wardrobe', 2.5],
    ['stairs', 6.5],
  ]);
  const kept = await keptText(page);
  expect((JSON.parse(kept) as Kept).space).toBe(VERSION);
  // The pointer on the staircase: the line under the paper says its steps.
  await page.mouse.move(...(await onPaper(page, ON_STAIRS)));
  await expect(page.locator('#status')).toContainText(STEPS);

  // The 3D page on that sketch, in White.
  const three = await context.newPage();
  const heardThere = listen(three, origin);
  await three.goto('/3d.html');
  await expectMadeUp(three);
  const body = three.locator('body');
  await expect(body).toHaveAttribute('data-stage', /^(drawn|none)$/);
  test.skip((await body.getAttribute('data-stage')) !== 'drawn', NO_STAGE);
  await three.locator('button[data-way=white]').click();
  await expect(body).toHaveAttribute('data-way', 'white');
  const parts = await said(three, 'parts');
  expect(parts).toBeGreaterThan(SET_DOWN.length);

  // The same sketch with the two at the sizes they were set down at - no length of their own -
  // kept by the pad's window: the 3D page draws it at once, five parts fewer - four steps of the
  // staircase, and a door of the wardrobe's three.
  const asSetDown = JSON.parse(kept) as Kept;
  for (const thing of asSetDown.things) delete thing.long;
  await keeps(page, JSON.stringify(asSetDown));
  await expect.poll(() => said(three, 'parts')).toBe(parts - 5);

  // Back from above, the wardrobe clicked and Delete pressed: it is gone. Undo: it is back, 2.5 m
  // long - the pad keeps the sketch it has, the one with the lengths.
  await page.bringToFront();
  await page.mouse.click(...(await onPaper(page, ON_WARDROBE)));
  await expect(page.locator('#picked')).toContainText('Wardrobe');
  await page.keyboard.press('Delete');
  await expect.poll(lengths).toEqual([['stairs', 6.5]]);
  await page.locator('#undo').click();
  await expect.poll(lengths).toEqual([
    ['wardrobe', 2.5],
    ['stairs', 6.5],
  ]);
  // The right button on it, and Delete in its menu: it is gone again.
  await page.mouse.click(...(await onPaper(page, ON_WARDROBE)), { button: 'right' });
  const menu = page.locator('#right-menu');
  await expect(menu).toBeVisible();
  await expect.poll(lengths).toEqual([
    ['wardrobe', 2.5],
    ['stairs', 6.5],
  ]);
  await menu.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect.poll(lengths).toEqual([['stairs', 6.5]]);
  await expect(menu).toBeHidden();

  await expect(page.locator('#alarm')).toBeEmpty();
  expect([heard, heardThere]).toEqual([[], []]);
});
