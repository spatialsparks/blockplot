import { expect, test, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// More objects, built by code (story ST-034), end to end: the story's main path, the first row of
// its Behaviour, on the made-up plot. From above, on an empty sketch of the test's own, an office
// chair, a floor lamp, a cupboard and a grill are picked in the gallery and set down with a click
// each; with Select the cupboard is dragged at its east end three cells further, to 2.5 m. The
// line under the paper says so, the sketch that the browser keeps says so - of the version the
// pad writes - and the 3D page in White shows each of them built of its pieces: the cupboard
// three parts more than at its own length, a door each half metre. Every count of parts is the
// page's own (`data-parts`): no case counts them by hand. `pnpm sketch --demo` serves
// the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part of this run, and
// a page is asked yes or no whether it is on the made-up plot before a matcher reads it, and
// neither page asks another machine (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing is drawn';
// A place of the top view's paper, which is not shown from behind.
type Place = readonly [column: number, row: number];
type Kept = { space: number; things: { kind: string; long?: number }[] };

// THE SKETCH, this test's own: nothing drawn, written as the pad writes an empty sketch.
const EMPTY = { space: VERSION, things: [], floors: [], notes: [], on: {}, show: { top: {} } };
// What is set down, in this order, and where: a click on a place sets the object down about the
// nearest half cell. The cupboard, 1 m by 0.5 m, lies from column 40 to 42 and in row 20; its
// east end is at column 42.
const SET_DOWN: readonly [kind: string, at: Place][] = [
  ['officechair', [20.3, 20.4]],
  ['floorlamp', [26.3, 20.4]],
  ['cupboard', [40.3, 20.4]],
  ['grill', [60.3, 20.4]],
];
const [EAST_END, FURTHER]: readonly [Place, Place] = [
  [41.9, 20.5],
  [44.9, 20.5],
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

/** Where a place of the top view's paper is on the page, in pixels (sketch-paper.ts). */
const onPaper = placeOf;

/** What the 3D page's body says under a name, as a number. */
const said = async (page: Page, name: string): Promise<number> =>
  Number(await page.locator('body').getAttribute(`data-${name}`));

test('an office chair, a floor lamp, a cupboard dragged to 2.5 m and a grill are set down from above, kept, and built of their pieces in 3D', async ({
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

  // O, and each kind picked in the gallery and set down by a click on the paper.
  await page.keyboard.press('o');
  for (const [kind, at] of SET_DOWN) {
    await page.locator(`#gallery button[data-kind="${kind}"]`).click();
    await expect(page.locator('#gallery [aria-pressed="true"]')).toHaveAttribute('data-kind', kind);
    await page.mouse.click(...(await onPaper(page, at)));
  }
  await expect(page.locator('#layers small')).toHaveText(['4 objects']);
  const kinds = async (): Promise<string[]> =>
    (JSON.parse(await keptText(page)) as Kept).things.map((thing) => thing.kind);
  await expect.poll(kinds).toEqual(SET_DOWN.map(([kind]) => kind));
  expect(await keptText(page)).not.toContain('"long"');

  // S, and the cupboard dragged at its east end three cells further: 2.5 m long, its west end
  // where it was. Over it, the line under the paper says so.
  await page.keyboard.press('s');
  const [from, to] = [await onPaper(page, EAST_END), await onPaper(page, FURTHER)];
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(...to, { steps: 6 });
  await page.mouse.up();
  await page.mouse.move(...(await onPaper(page, [42.5, 20.5])));
  await expect(page.locator('#status')).toContainText('a cupboard of 2.5 m by 0.5 m');

  // The sketch that the browser keeps: of the version the pad writes, the four kinds in the
  // order they were set down, and the cupboard with its length.
  const cupboard = '{"kind":"cupboard","x":42.5,"y":20.5,"floor":"ground","long":2.5}';
  await expect.poll(() => keptText(page)).toContain(cupboard);
  const kept = JSON.parse(await keptText(page)) as Kept;
  expect([kept.space, await kinds()]).toEqual([VERSION, SET_DOWN.map(([kind]) => kind)]);

  // The 3D page on that sketch, in White: more parts than the sketch has things - each of the
  // four is its pieces.
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

  // Undo, on the pad: the drag is one step, and the cupboard is at its own length again, with no
  // length in the sketch. The 3D page draws it at once - three parts fewer: two doors of five.
  await page.bringToFront();
  await page.keyboard.press('Control+z');
  await expect.poll(() => keptText(page)).not.toContain('"long"');
  await expect.poll(() => kinds()).toEqual(SET_DOWN.map(([kind]) => kind));
  await expect.poll(() => said(three, 'parts')).toBe(parts - 3);

  await expect(page.locator('#alarm')).toBeEmpty();
  expect([heard, heardThere]).toEqual([[], []]);
});
