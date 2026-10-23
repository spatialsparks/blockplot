import { expect, test, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { pixelOf, placeOf } from './sketch-paper';

// The story's main path of guide lines (ST-039, T-039.4), end to end, on the made-up plot from
// above: the owner adds a colour of their own, picks it, draws a line of four corners with Alt
// held at the second, ends it with Enter, selects it and ticks "On every level" - and the line
// is in the sketch as drawn, in that colour on the level drawn on and on the next, and kept and
// opened again as it was. The switch of a line, the list of the lines on every level and the
// recolouring are held by the pad's checks (lines/every.check.js, lines/recolour.check.js): one
// browser test a story. On `pnpm sketch --demo`, never the real plot: the case asks so before it
// reads (directive 34), and that the page asked nobody.

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// The top view's paper has cells of 0.5 m, and is not shown from behind (sketch-paper.ts).
const CELL_M = 0.5;
type Place = readonly [column: number, row: number];
type Note = Readonly<{ view: string; at: unknown; line?: readonly unknown[] }>;
type Sketch = Readonly<{ notes: readonly Note[]; colours?: readonly unknown[] }>;

// THE SKETCH, this test's own: two levels and nothing on them, drawn on the first; the slices
// run clear of where the line goes.
const [LEVEL, NEXT] = [22, 26];
const SKETCH = {
  space: VERSION,
  things: [],
  floors: [LEVEL, NEXT],
  notes: [],
  on: { top: LEVEL, side: 44, end: 76 },
  show: { top: {} },
};
// The colour of the owner's, its value as the chooser gives it and the pixels of the paper.
const [VALUE, NAME, RGB] = ['#c0392b', 'Boundary', [192, 57, 43]] as const;
// The four corners, in cells: whole cells but the second, which Alt puts where the pointer is.
const CORNERS: readonly Place[] = [
  [20, 10],
  [50.37, 12.61],
  [50, 30],
  [20, 30],
];
// A place on the third segment, which lies along row 30.
const ON_THE_LINE: Place = [35, 30];

/** The sketch that the browser keeps. */
const kept = async (page: Page): Promise<Sketch> =>
  JSON.parse(await page.evaluate<string>(`localStorage.getItem(${STORE})`)) as Sketch;

/** Opens the top view with the test's own sketch, and fails unless it is on the made-up plot. It gives what is heard: every error, and every request to another origin. */
async function openPad(page: Page, baseURL: string | undefined): Promise<string[]> {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => void (message.type() === 'error' && heard.push(message.text())));
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.push(`elsewhere: ${url}`);
  });
  const sketch = JSON.stringify(JSON.stringify(SKETCH));
  await page.addInitScript(
    `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${sketch});`,
  );
  await page.goto('/#top');
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.waitForLoadState('load');
  return heard;
}

/** Where a place of the paper is on the page, in whole pixels; and the place in cells that the pad reads there. */
async function onPage(page: Page, place: Place): Promise<[number, number, Place]> {
  const [x, y] = await placeOf(page, place);
  const [[x0, y0], [x1, y1]] = [await placeOf(page, [0, 0]), await placeOf(page, [1, 1])];
  const [px, py] = [Math.round(x), Math.round(y)];
  return [px, py, [(px - x0) / (x1 - x0), (py - y0) / (y1 - y0)]];
}

/** A place in cells to the centimetre, as Alt puts a point there (lines/model.js, `snapped`). */
const toCm = (cells: number): number => Math.round(cells * CELL_M * 100) / (CELL_M * 100) + 0;

/** Whether the paper has a pixel of the colour within two pixels of a place on it. */
const drawnIn = async (page: Page, place: Place): Promise<boolean> => {
  const [x, y] = await pixelOf(page, place, (pixel) => Math.round(pixel - 2));
  return page.evaluate<boolean>(`(() => {
    const canvas = document.getElementById('paper');
    const { data } = canvas.getContext('2d').getImageData(${x}, ${y}, 5, 5);
    const near = (at) => [0, 1, 2].every((n) => Math.abs(data[at + n] - ${JSON.stringify(RGB)}[n]) <= 6);
    for (let at = 0; at < data.length; at += 4) if (near(at)) return true;
    return false;
  })()`);
};

/** An entry of the File menu, pressed: File first, which opens the menu, and then the entry. */
async function fromFile(page: Page, entry: string): Promise<void> {
  await page.locator('#file-menu').click();
  await page.locator(entry).click();
}

test('a colour of my own, a line of four corners with one off the grid, on every level, kept and opened again', async ({
  page,
  baseURL,
}) => {
  const heard = await openPad(page, baseURL);

  // A COLOUR OF MY OWN: the arrow opens the colours, the chooser gives the value, and the pad
  // asks for its name. Then it is picked from the owner's list.
  await page.locator('#colours-open').click();
  let asked = '';
  page.once('dialog', (dialog) => {
    asked = dialog.message();
    void dialog.accept(NAME);
  });
  await page.locator('#colour-chooser').fill(VALUE);
  await expect.poll(async () => (await kept(page)).colours).toEqual([{ name: NAME, value: VALUE }]);
  expect(asked).toBe('Name of the new colour: up to 30 characters');
  if (await page.locator('#colours').isHidden()) await page.locator('#colours-open').click();
  await page.locator(`#own-colours [data-colour="${VALUE}"]`).click();
  await expect(page.locator('#colour')).toHaveAttribute('aria-label', NAME);

  // LINE, FOUR CORNERS, Alt held at the second, and Enter: one note more.
  await page.keyboard.press('l');
  await expect(page.locator('[data-tool="line"]')).toHaveAttribute('aria-pressed', 'true');
  const points: number[][] = [];
  for (const [at, corner] of CORNERS.entries()) {
    const [x, y, read] = await onPage(page, corner);
    const alt = at === 1;
    if (alt) await page.keyboard.down('Alt');
    await page.mouse.click(x, y);
    if (alt) await page.keyboard.up('Alt');
    points.push(alt ? read.map(toCm) : corner.map(Math.round));
  }
  // Off the grid, and not on it: the second point lies between grid points.
  expect(points[1]?.every((v) => !Number.isInteger(v))).toBe(true);
  await page.keyboard.press('Enter');
  const line = [...points.flat(), VALUE];
  await expect
    .poll(async () => (await kept(page)).notes.at(-1))
    .toEqual({
      view: 'top',
      at: LEVEL,
      line,
    });

  // SELECTED WITH SELECT, and "On every level" ticked: the note says so, in one step more.
  await page.keyboard.press('s');
  const [x, y] = await onPage(page, ON_THE_LINE);
  await page.mouse.click(x, y);
  await expect(page.locator('#picked')).toHaveText(/^Line of 4 corners, .* m long, in Boundary\.$/);
  await expect(page.locator('#segments li')).toHaveCount(3);
  await page.locator('#line-every').check();
  const EVERY = { view: 'top', at: 'every', line };
  await expect.poll(async () => (await kept(page)).notes.at(-1)).toEqual(EVERY);
  await expect(page.locator('#line-shown')).toBeChecked();

  // DRAWN IN THAT COLOUR on the level drawn on and, after Page Down, on the next: with no line
  // selected, whose mark would lie over it.
  await page.keyboard.press('Escape');
  await expect(page.locator('#line-row')).toBeHidden();
  await expect.poll(() => drawnIn(page, ON_THE_LINE)).toBe(true);
  await page.locator('#paper').hover();
  await page.keyboard.press('PageDown');
  await expect(page.locator('#layers [aria-pressed="true"]')).toHaveText(/^Level 813 m$/);
  await expect.poll(() => drawnIn(page, ON_THE_LINE)).toBe(true);

  // KEPT under a name of the case's, undone back to an empty paper, and opened again with Open
  // kept: the note and the colours are as they were.
  const name = `Guide lines ${String(Date.now())} ${String(process.pid)}`;
  await fromFile(page, '#keep');
  const window = page.getByRole('dialog');
  await window.locator('#kept-name').fill(name);
  await window.locator('#kept-name').press('Enter');
  await expect(window.locator('#kept-said')).toHaveText(/^Kept in this browser only/);
  await window.getByRole('button', { name: 'Close' }).click();
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => (await kept(page)).notes).toEqual([]);
  await fromFile(page, '#open-kept');
  await window.locator('#kept-list button', { hasText: name }).click();
  await expect(window).toBeHidden();
  const opened = await kept(page);
  expect([opened.notes.at(-1), opened.colours]).toEqual([EVERY, [{ name: NAME, value: VALUE }]]);

  // The page said nothing wrong, and asked nobody.
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
