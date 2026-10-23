import { expect, test, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// Objects sized by dragging (story ST-035), end to end: the story's main path, the first row of
// its Behaviour, on the made-up plot. From above, on an empty sketch of the test's own, a single
// bed and a kitchen counter are picked in the gallery and set down with a click each; with Select
// the bed's long side is dragged one cell further, to 1.5 m deep, and the counter's end two cells
// further, to 3.5 m long; the counter is clicked and 0.95 typed into its "m high" field. The
// panel says each size, the sketch that the browser keeps says them - of the version the pad
// writes - and the 3D page in White shows the two built from their sizes: three parts more than
// at the sizes they were set down at, one pillow and two fronts. Every count of parts is the
// page's own (`data-parts`): no case counts them by hand. `pnpm sketch --demo` serves
// the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part of this run, a
// page is asked yes or no whether it is on the made-up plot before a matcher reads it, and
// neither page asks another machine (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing is drawn';
// A place of the top view's paper, which is not shown from behind.
type Place = readonly [column: number, row: number];
type Thing = { kind: string; long?: number; deep?: number; high?: number };
type Kept = { space: number; things: Thing[] };

// THE SKETCH, this test's own: nothing drawn, written as the pad writes an empty sketch.
const EMPTY = { space: VERSION, things: [], floors: [], notes: [], on: {}, show: { top: {} } };
// What is set down, in this order, and where: a click sets an object's middle down at the nearest
// half cell, and what is whole cells long lies on whole cells (sketch.js, `rect`). The single bed,
// 2 m by 1 m, lies from column 19 to 23 and from row 20 to 22: its south side, a long side, is at
// row 22. The counter, 2.5 m by 0.5 m, lies from column 38 to 43 in row 30: its east end is at 43.
const SET_DOWN: readonly [kind: string, at: Place][] = [
  ['singlebed', [20.3, 20.4]],
  ['counter', [40.3, 30.4]],
];
// Each drag, from where it takes hold to where it lets go: the bed's side one row further, the
// counter's end two columns further.
const DRAGS: readonly (readonly [Place, Place])[] = [
  [
    [21, 21.9],
    [21, 22.9],
  ],
  [
    [42.9, 30.5],
    [44.9, 30.5],
  ],
];
// The two as the browser keeps them then: the bed from row 20 to 23, the counter from column 38
// to 45 - each with the sizes it says, written after what it was set down with.
const BED = '{"kind":"bed","x":21,"y":21.5,"floor":"ground","deep":1.5}';
const COUNTER = '{"kind":"counter","x":41.5,"y":30.5,"floor":"ground","long":3.5,"high":0.95}';
const [ON_BED, ON_COUNTER]: readonly [Place, Place] = [
  [21, 21.5],
  [40.5, 30.5],
];

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

test('a single bed made 1.5 m deep and a counter made 3.5 m long and 0.95 m high from above are kept with their sizes, and built from them in 3D', async ({
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
  await expect(page.locator('#layers small')).toHaveText(['2 objects']);
  const things = async (): Promise<Thing[]> => (JSON.parse(await keptText(page)) as Kept).things;
  await expect
    .poll(async () => (await things()).map((thing) => thing.kind))
    .toEqual(['bed', 'counter']);
  expect((await things()).map(({ long, deep, high }) => [long, deep, high])).toEqual([
    [undefined, 1, undefined],
    [undefined, undefined, undefined],
  ]);

  // S, and the bed's long side and the counter's end dragged, each with the far side staying.
  await page.keyboard.press('s');
  for (const [from, to] of DRAGS) {
    await page.mouse.move(...(await onPaper(page, from)));
    await page.mouse.down();
    await page.mouse.move(...(await onPaper(page, to)), { steps: 6 });
    await page.mouse.up();
  }
  // The bed, clicked: the panel says it is 2 m by 1.5 m, and shows no height to type - a bed
  // takes none.
  const picked = page.locator('#picked');
  await page.mouse.click(...(await onPaper(page, ON_BED)));
  await expect(picked).toContainText('Bed: 2 m by 1.5 m, 1 m high, ');
  await expect(page.locator('#object-high-row')).toBeHidden();

  // The counter, clicked: its height in the field, 0.9 m. 0.95 typed, and Enter.
  await page.mouse.click(...(await onPaper(page, ON_COUNTER)));
  await expect(picked).toContainText('Kitchen counter: 3.5 m by 0.5 m, 0.9 m high, ');
  const field = page.locator('#object-high-row > #object-high');
  await expect(field).toHaveValue('0.9');
  await field.fill('0.95');
  await field.press('Enter');
  await expect(picked).toContainText('Kitchen counter: 3.5 m by 0.5 m, 0.95 m high, ');
  await expect(field).not.toBeFocused();

  // The sketch that the browser keeps: of the version the pad writes, the bed with its depth and
  // the counter with its length and its height.
  await expect.poll(() => keptText(page)).toContain(COUNTER);
  const kept = await keptText(page);
  expect([(JSON.parse(kept) as Kept).space, kept.includes(BED)]).toEqual([VERSION, true]);

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

  // The same sketch with the two at the sizes they were set down at - the bed 1 m deep, the
  // counter with no length and no height of its own - kept by the pad's window: the 3D page
  // draws it at once, three parts fewer - a pillow of two, two fronts of six.
  const asSetDown = kept
    .replace(BED, BED.replace('"deep":1.5', '"deep":1'))
    .replace(COUNTER, COUNTER.replace(',"long":3.5,"high":0.95', ''));
  expect(asSetDown).not.toBe(kept);
  await keeps(page, asSetDown);
  await expect.poll(() => said(three, 'parts')).toBe(parts - 3);

  await expect(page.locator('#alarm')).toBeEmpty();
  expect([heard, heardThere]).toEqual([[], []]);
});
