import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { pixelOf, placeOf, scaleOf } from './sketch-paper';

// The steps of a section beside the paper, end to end, on the made-up plot (story ST-032, task
// T-032.4): what the owner does with a section once it is there. Its row renames it, moves it
// down and up, hides it - the paper then has no ink where its blocks lay - shows it and removes
// it, each step undone and done again; the list right of the paper says the section of a block
// selected with Select, and a pick there puts the block into another, with the focus given
// back; and a page loaded anew shows the list as it was left, while "Save file" saves the sketch
// that the browser keeps. Making, picking and filling a section is sketch-sections.spec.ts's.
// The sketch is the made-up house with two sections, "Upper home" on its upper floor and "Lower
// home" with no block, as the pad writes them. `pnpm sketch --demo` serves the pad on the made-up
// plot: the real plot is in no part of this run, and a case asks yes or no whether its page is
// on the made-up plot before a matcher reads that page (directive 34).

const HOUSE = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// Places of the made-up house on the level at 817 m, which the file opens on: in the night
// rooms, clear of what stands in them, and on the bed there - 2 m by 2 m, on columns 43 to 47 -
// a cell right of its middle, so that a strip of three cells to either side stays clear of the
// wide staircase under it, which ends at column 42.
type Place = readonly [column: number, row: number];
const AT = { night: [32.5, 31.5], bed: [46, 26] } as const;
type Sketch = { things: Record<string, unknown>[]; sections?: unknown[] };

/** The made-up house with these sections, and the blocks of these names in them - the field last on a box and the list last in the sketch, as the pad writes them. */
function housed(sections: unknown[], of: Record<string, number>): string {
  const doc = JSON.parse(HOUSE) as Sketch;
  for (const thing of doc.things) {
    const name = thing['name'];
    if (typeof name === 'string' && name in of) thing['section'] = of[name];
  }
  return JSON.stringify({ ...doc, sections });
}
const [UPPER, LOWER] = [
  { id: 1, name: 'Upper home' },
  { id: 2, name: 'Lower home' },
];
const UPPER_FLOOR = { 'Night rooms': 1, Bath: 1, 'Roof terrace': 1 };
const TWO = housed([UPPER, LOWER], UPPER_FLOOR);

/** Every error of the console and every error no script caught, and every request to another origin: heard from before the page loads. */
function watch(page: Page, baseURL: string | undefined): string[] {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => void (message.type() === 'error' && heard.push(message.text())));
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Waits until the page is the top view of the pad, loaded, and fails unless it is on the made-up plot: asked yes or no, before a matcher reads the page. */
async function expectPad(page: Page): Promise<void> {
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.waitForLoadState('load');
}
/** Opens the top view of the pad with the two sections' sketch in its store, put there once. */
async function openPad(page: Page): Promise<void> {
  const seed = `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${JSON.stringify(TWO)});`;
  await page.addInitScript(seed);
  await page.goto('/#top');
  await expectPad(page);
}

/** The sketch that the browser keeps, as the text it is kept as. */
const kept = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
/** A click on a place of the paper, with the tool that is on. */
async function click(page: Page, place: Place): Promise<void> {
  await page.mouse.click(...(await placeOf(page, place)));
}
/** How much ink the paper's picture has about a place: of a strip three cells to either side and one cell high, the pixels whose red, green and blue are under 400 together. What a layer beside the one drawn on shows, faded, is none. */
const ink = async (page: Page, [column, row]: Place): Promise<number> => {
  const [[x, y], cell] = [
    await pixelOf(page, [column - 3, row - 0.5], Math.round),
    await scaleOf(page),
  ];
  return page.evaluate<number>(`(() => {
    const canvas = document.getElementById('paper');
    const [x, y, cell] = [${x}, ${y}, ${cell}];
    const { data } = canvas.getContext('2d').getImageData(x, y, 6 * cell, cell);
    let dark = 0;
    for (let at = 0; at < data.length; at += 4)
      if (data[at] + data[at + 1] + data[at + 2] < 400) dark += 1;
    return dark;
  })()`);
};

/** A section's row, by its place in the list: its name, its switch, its two arrows, and what it holds. */
function row(
  page: Page,
  place: number,
): Record<'name' | 'shows' | 'up' | 'down' | 'holds', Locator> {
  const item = page.locator('#sections > li').nth(place);
  const arrow = (way: string) =>
    item.getByRole('button', { name: `Move this section ${way} in the list` });
  const [name, shows] = [item.locator('button').first(), item.locator('button').nth(1)];
  return { name, shows, up: arrow('up'), down: arrow('down'), holds: item.locator('small') };
}
/** The list as it stands: each row's name, its word, what it holds, and whether it shows pressed. */
const listed = (page: Page): Promise<string[]> =>
  page.evaluate<string[]>(`[...document.querySelectorAll('#sections > li')].map((item) => {
    const [name, shows] = item.querySelectorAll('button');
    const holds = item.querySelector('small').textContent;
    return [name.textContent, shows.textContent, holds, name.getAttribute('aria-pressed')].join(', ');
  })`);
/** Undo, then Redo: the kept sketch is the text of before the step, and then the one after. */
async function undoAndRedo(page: Page, before: string, after: string): Promise<void> {
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(before);
  await page.keyboard.press('Control+y');
  await expect.poll(() => kept(page)).toBe(after);
}
/** The same sketch with its sections the other way round. */
function swapped(text: string): string {
  const doc = JSON.parse(text) as Sketch;
  return JSON.stringify({ ...doc, sections: [...(doc.sections ?? [])].reverse() });
}

test('a section is renamed, moved down and up, hidden, shown and removed, and each step is undone and done again', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  expect(await kept(page)).toBe(TWO);
  expect(await listed(page)).toEqual([
    'Upper home, shown, 3 blocks, false',
    'Lower home, shown, no block yet, false',
  ]);
  const upper = row(page, 0);
  await upper.name.click();
  await expect(upper.name).toHaveAttribute('aria-pressed', 'true');

  // RENAMED: "Rename" asks with the name it has, and the new one is the section's in the list.
  const RENAMED = TWO.replace('"name":"Upper home"', '"name":"Home 1"');
  let offered = '';
  page.once('dialog', (dialog) => {
    offered = dialog.defaultValue();
    void dialog.accept('Home 1');
  });
  await page.locator('#section-rename').click();
  await expect(upper.name).toHaveText('Home 1');
  expect(offered).toBe('Upper home');
  await expect.poll(() => kept(page)).toBe(RENAMED);
  await undoAndRedo(page, TWO, RENAMED);

  // MOVED DOWN, and up again: the list has the other order, and so has the sketch.
  await upper.down.click();
  expect(await listed(page)).toEqual([
    'Lower home, shown, no block yet, false',
    'Home 1, shown, 3 blocks, true',
  ]);
  await expect.poll(() => kept(page)).toBe(swapped(RENAMED));
  await undoAndRedo(page, RENAMED, swapped(RENAMED));
  await row(page, 1).up.click();
  await expect.poll(() => kept(page)).toBe(RENAMED);
  await undoAndRedo(page, swapped(RENAMED), RENAMED);

  // HIDDEN: the row says so, the paper has no ink where the night rooms lay - the bed, which stood
  // there in full - and the sketch says `"hidden":true`. SHOWN again, the bed is there.
  expect(await ink(page, AT.bed)).toBeGreaterThan(10);
  const HIDDEN = RENAMED.replace('"name":"Home 1"', '"name":"Home 1","hidden":true');
  await upper.shows.click();
  await expect(upper.shows).toHaveText('hidden');
  await expect.poll(() => kept(page)).toBe(HIDDEN);
  await expect.poll(() => ink(page, AT.bed)).toBe(0);
  await undoAndRedo(page, RENAMED, HIDDEN);
  await expect.poll(() => ink(page, AT.bed)).toBe(0);
  await upper.shows.click();
  await expect(upper.shows).toHaveText('shown');
  await expect.poll(() => kept(page)).toBe(RENAMED);
  await expect.poll(() => ink(page, AT.bed)).toBeGreaterThan(10);
  await undoAndRedo(page, HIDDEN, RENAMED);

  // REMOVED, with no question: its four boxes say no section, and are otherwise the text they were.
  await expect(upper.name).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#section-remove').click();
  const REMOVED = housed([LOWER], {});
  await expect.poll(() => kept(page)).toBe(REMOVED);
  expect(await listed(page)).toEqual(['Lower home, shown, no block yet, false']);
  await undoAndRedo(page, RENAMED, REMOVED);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('the section of a block selected with Select stands right of the paper, and a pick there puts the block into another, with the focus given back', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  const [side, list] = [page.locator('#section-row'), page.locator('#section-row > #section')];
  // Nothing selected: no list. The night rooms: under the colour of the block, a list at "Upper
  // home", with "No section" and every section by its name.
  await expect(side).toBeHidden();
  await click(page, AT.night);
  await expect(page.locator('#picked')).toContainText('Night rooms');
  await expect(page.locator('#selected > #swatch-row + #section-row')).toBeVisible();
  await expect(list).toHaveValue('1');
  await expect(list.locator('option')).toHaveText(['No section', 'Upper home', 'Lower home']);
  // "Lower home", picked as a person picks: both boxes of the night rooms are in it, the list
  // stands there, and the focus is the page's - the next key is a tool's.
  await list.focus();
  await list.selectOption('2');
  await expect
    .poll(() => kept(page))
    .toBe(housed([UPPER, LOWER], { ...UPPER_FLOOR, 'Night rooms': 2 }));
  await expect(list).toHaveValue('2');
  await expect(list).not.toBeFocused();
  await page.keyboard.press('e');
  await expect(page.locator('[data-tool="erase"]')).toHaveAttribute('aria-pressed', 'true');
  // "No section": out of every section. Escape in the list gives the focus back, the block selected.
  await list.focus();
  await list.selectOption({ index: 0 });
  await expect.poll(() => kept(page)).toBe(housed([UPPER, LOWER], { Bath: 1, 'Roof terrace': 1 }));
  await list.focus();
  await page.keyboard.press('Escape');
  await expect(list).not.toBeFocused();
  await expect(side).toBeVisible();
  // Undo takes both picks back. Of an object, the bed, there is no list; and of nothing neither.
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(TWO);
  await page.keyboard.press('s');
  await click(page, AT.bed);
  await expect(page.locator('#picked')).toContainText('Bed');
  await expect(side).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(side).toBeHidden();
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('loaded anew, the list is as it was left, with no section picked, and "Save file" saves the sketch that the browser keeps', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  // "Lower home" moved up, "Upper home" hidden and picked.
  await row(page, 1).up.click();
  await row(page, 1).shows.click();
  await row(page, 1).name.click();
  const LEFT = ['Lower home, shown, no block yet, false', 'Upper home, hidden, 3 blocks, true'];
  await expect.poll(() => listed(page)).toEqual(LEFT);
  const left = await kept(page);
  expect(left).toBe(
    swapped(TWO).replace('"name":"Upper home"', '"name":"Upper home","hidden":true'),
  );

  await page.reload();
  await expectPad(page);
  expect(await kept(page)).toBe(left);
  await expect.poll(() => listed(page)).toEqual(LEFT.map((one) => one.replace('true', 'false')));
  await expect(page.locator('[data-tool="move"]')).toHaveAttribute('aria-pressed', 'true');
  // "Save file", in the File menu, saves that sketch, byte for byte.
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save file' }).click(),
  ]);
  expect(readFileSync(await download.path(), 'utf8')).toBe(left);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
