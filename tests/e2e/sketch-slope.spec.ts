import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { pixelOf, placeOf, scaleOf } from './sketch-paper';

// A top that slopes, in the pad, end to end, on the made-up plot with the made-up sketch: in a
// standing view a top corner of a box is pulled with Shift held, and the sketch that the browser
// keeps says the slope, the pad says it, and the paper and the areas beside it show it; Undo
// takes it back to the byte; it is saved and there after a reload; the top view shows the way it
// falls; it is pulled across the plot in the front view, and back up to nothing; and without
// Shift a corner makes the box larger. `pnpm sketch --demo` serves the pad, whose page puts tools/sketch/demo-site.js in
// the place of site.js: the real plot is in no part of this run, and a case asks yes or no
// whether its page is on the made-up plot before a matcher reads that page (directive 34).

const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';

type Place = readonly [column: number, row: number];
// What this test reads of a sketch file: of a thing where it lies, its name and its slope.
type Thing = Readonly<Partial<Record<'x' | 'y' | 'z' | 'name' | 'slope', unknown>>>;
type Sketch = Readonly<{ things: readonly Thing[]; on: Readonly<Record<string, unknown>> }>;
// The views this test draws in: how many cells wide their paper is - 46 m down the plot, 31 m
// across it - and whether they show it from behind, its columns counted from the right.
const VIEWS = {
  top: { name: 'Top view', wide: 92, flipped: false },
  side: { name: 'Side view', wide: 92, flipped: false },
  front: { name: 'Front view', wide: 62, flipped: true },
} as const;
type View = keyof typeof VIEWS;

// The box this test slopes, and no other: the one of the two boxes of the night rooms that both
// slices of the file run through - columns 30 to 40, rows 30 to 38 of the top view, its top in
// row 12 of a standing view and its floor in row 18, at 817 m. Found in the file by where it
// lies: the test asks of this box alone whether it says `slope`, whatever the rest of the
// house says. On the slice along the plot no other block touches its uphill top corner, and on
// the slice across the plot none touches the corner at row 38.
const LIES = { x: [30, 40], y: [30, 38], z: [12, 18] } as const;
const FILE = JSON.parse(SKETCH) as Sketch;
const lies = (thing: Thing, where: object): boolean =>
  JSON.stringify({ x: thing.x, y: thing.y, z: thing.z }) === JSON.stringify(where);
const AT = FILE.things.findIndex((thing) => thing.name === 'Night rooms' && lies(thing, LIES));

/** Every error of the console and every error no script caught, and every request to another origin: heard from before the page loads. */
function watch(page: Page, baseURL: string | undefined): string[] {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => {
    if (message.type() === 'error') heard.push(message.text());
  });
  page.on('pageerror', (error) => {
    heard.push(error.message);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Fails unless the page is on the made-up plot: asked yes or no. */
async function expectMadeUpPlot(page: Page): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
}

/** Waits until the page is this view of the pad, loaded - anew, where a key went to it: only then is its title the view's. */
async function expectView(page: Page, view: View): Promise<void> {
  await expect(page).toHaveTitle(`${VIEWS[view].name} — sketch pad`);
  await page.waitForLoadState('load');
  await expectMadeUpPlot(page);
}

/** Opens a view of the pad with the made-up sketch in its store - put there once: what the pad keeps after it stays through a reload. */
async function openPad(page: Page, view: View): Promise<void> {
  const seed = `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${JSON.stringify(SKETCH)});`;
  await page.addInitScript(seed);
  await page.goto(`/#${view}`);
  // Before any matcher reads the page. A view that a key goes to later is a page of this pad.
  await expectMadeUpPlot(page);
  await expectView(page, view);
}

/** The sketch that the browser keeps, as text. */
const kept = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
/** What the test's own box says of a slope in that sketch: null where it says none. */
const slope = async (page: Page): Promise<unknown> =>
  (JSON.parse(await kept(page)) as Sketch).things[AT]?.slope ?? null;

/** Where a place of a view's paper is on the page, in pixels. */
async function onPage(page: Page, view: View, [column, row]: Place): Promise<[number, number]> {
  const { wide, flipped } = VIEWS[view];
  return placeOf(page, [flipped ? wide - column : column, row]);
}

/** A drag with Select, the tool the pad opens with, from a place of the paper to another - with Shift held, or without. */
async function drag(page: Page, view: View, from: Place, to: Place, shift: boolean): Promise<void> {
  const [start, end] = [await onPage(page, view, from), await onPage(page, view, to)];
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(...start);
  await page.mouse.down();
  await page.mouse.move(...end, { steps: 6 });
  await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
}

/**
 * What the paper's picture shows about a place of it, in cells of a view that is not flipped:
 * the colour of the pixel there - red, green, blue - and how many of the pixels within a fifth
 * of a cell of it are nearer to an ink than to the colour a block of that ink is filled with.
 */
async function shown(page: Page, place: Place, ink = '#000000'): Promise<[number[], number]> {
  const [[x, y], cell] = [await pixelOf(page, place), await scaleOf(page)];
  return page.evaluate<[number[], number]>(`(() => {
    const paper = document.getElementById('paper');
    const [x, y, cell] = [${x}, ${y}, ${cell}];
    const [near, wide] = [Math.floor(cell / 5), 2 * Math.floor(cell / 5) + 1];
    const pixels = paper.getContext('2d').getImageData(x - near, y - near, wide, wide).data;
    const ink = [1, 3, 5].map((at) => parseInt(${JSON.stringify(ink)}.slice(at, at + 2), 16));
    // A block is filled with its ink at six tenths, over the white of the paper (draw.js).
    const fill = ink.map((part) => 0.6 * part + 0.4 * 255);
    const far = (pixel, from) => from.reduce((sum, part, at) => sum + Math.abs(part - pixel[at]), 0);
    let inked = 0;
    for (let at = 0; at < pixels.length; at += 4) {
      const pixel = pixels.slice(at, at + 3);
      if (far(pixel, ink) < far(pixel, fill)) inked += 1;
    }
    const middle = 4 * (wide * near + near);
    return [[...pixels.slice(middle, middle + 3)], inked];
  })()`);
}
const colour = async (page: Page, at: Place): Promise<number[]> => (await shown(page, at))[0];

/** What the pad says beside the paper that the colour of the test's box covers of the layer drawn on. */
const covered = (page: Page): Promise<string> =>
  page.evaluate<string>(`(() => {
    const hex = paper.hex(sketch.doc.things[${AT}].colour);
    const ink = 'rgb(' + [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(', ') + ')';
    const dots = [...document.querySelectorAll('#areas i')];
    return dots.find((dot) => dot.style.backgroundColor === ink)?.parentElement.textContent.trim();
  })()`);

// On the slice along the plot the box lies from column 30 to 40, and its uphill top corner is at
// column 30 in row 12. Three places of that paper, each in the middle of a cell and clear of the
// edge that Select draws round the box: inside the box under that corner, and by its floor; and
// beside the box, where nothing is drawn.
const [CORNER, MIDDLE] = [
  [30.1, 12.1],
  [35, 15],
] as const;
const [UNDER_CORNER, BY_FLOOR, BESIDE] = [
  [30.5, 13.5],
  [30.5, 17.5],
  [28.5, 13.5],
] as const;
const HOW = 'With Shift held down, drag a top corner of a box down to slope its top';

test.beforeEach(() => {
  expect(AT, 'the made-up sketch has no box of the night rooms where this test pulls').not.toBe(-1);
  expect(FILE.things[AT]?.slope, 'that box slopes already').toBeUndefined();
  const slices = [FILE.on['side'], FILE.on['end']];
  expect(slices, 'the slices of the file run through other boxes').toEqual([30, 36]);
});

test('in the side view a top corner pulled with Shift slopes the top of its box: kept, said and shown - and Undo has the file again', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page, 'side');

  // The box is a box: its colour under its corner as by its floor, and not the paper's - and of
  // the slice that colour covers the face of this box alone, 5 m by 3 m. Select on it, the pad
  // says beside the paper how a top is sloped, before anything is.
  const [paper, block] = [await colour(page, BESIDE), await colour(page, BY_FLOOR)];
  expect(paper).toEqual([255, 255, 255]);
  expect(block).not.toEqual(paper);
  expect(await colour(page, UNDER_CORNER)).toEqual(block);
  expect(await covered(page)).toBe('15 m²');
  await drag(page, 'side', MIDDLE, MIDDLE, false);
  await expect(page.locator('#picked')).toContainText(HOW);
  await expect(page.locator('#picked')).not.toContainText('falls');
  expect(await kept(page)).toBe(SKETCH);

  // The uphill corner pulled four rows down, 2 m: that end of the top lies in row 16, 1 m over
  // the floor, and the downhill end at the box's top, 3 m over it. The sketch says so of this
  // box, from its own two columns; the pad says which way the top falls, and from how high to
  // how high; and the paper is the paper's colour over the line and the block's under it.
  await drag(page, 'side', CORNER, [30.1, 16.2], true);
  await expect.poll(() => slope(page)).toEqual({ x: [30, 40], z: [16, 12] });
  await expect(page.locator('#picked')).toContainText(
    'The top of this box falls up the plot, from 3 m over its floor to 1 m.',
  );
  await expect(page.locator('#picked')).toContainText(HOW);
  await expect.poll(() => colour(page, UNDER_CORNER)).toEqual(paper);
  expect(await colour(page, BY_FLOOR)).toEqual(block);
  // And the area beside the paper is what is filled: 5 m long, 1 m high at one end and 3 m at
  // the other, 2 m in the mean.
  expect(await covered(page)).toBe('10 m²');
  // The heavier edge of what is selected stays round the box itself: its top edge runs on over
  // the paper, in ink, to the corner that was pulled.
  const INK = [0x1f, 0x29, 0x33];
  expect(await colour(page, [30.5, 12])).toEqual(INK);
  await expect(page.locator('#alarm')).toBeEmpty();

  // Undo: the sketch that the browser keeps is the file again, byte for byte, and the box a box.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => kept(page)).toBe(SKETCH);
  await expect.poll(() => colour(page, UNDER_CORNER)).toEqual(block);
  await expect(page.locator('#picked')).not.toContainText('falls');
  expect(heard).toEqual([]);
});

test('a slope is saved with the sketch and there after a reload, and the top view shows which way it falls', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page, 'side');
  const paper = await colour(page, BESIDE);

  // Pulled three rows down: 1.5 m. "Save file", an entry of the File menu, saves the sketch that
  // the browser keeps, with the slope of this box in it.
  await drag(page, 'side', CORNER, [30.1, 15.2], true);
  await expect.poll(() => slope(page)).toEqual({ x: [30, 40], z: [15, 12] });
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save file' }).click();
  const download = await saving;
  const saved = readFileSync(await download.path(), 'utf8');
  expect(saved).toBe(await kept(page));
  expect((JSON.parse(saved) as Sketch).things[AT]?.slope).toEqual({ x: [30, 40], z: [15, 12] });

  // Loaded anew, the page shows it: the paper over the line of the top, and the words.
  await page.reload();
  await expectView(page, 'side');
  expect(await slope(page)).toEqual({ x: [30, 40], z: [15, 12] });
  await expect.poll(() => colour(page, UNDER_CORNER)).toEqual(paper);
  await expect(page.locator('#picked')).toContainText('falls up the plot, from 3 m over its floor');

  // From above, key 1, the box lies on columns 30 to 40 and rows 30 to 38, and has an arrow in
  // its block's ink down its top: half as long as the box, a quarter of the way across it - in
  // row 32, from column 37.5 to column 32.5, where its head is. The top falls up the plot.
  await page.keyboard.press('1');
  await expectView(page, 'top');
  const hex = await page.evaluate<string>(`paper.hex(sketch.doc.things[${AT}].colour)`);
  const ink = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  await expect.poll(async () => (await shown(page, [35.5, 32], hex))[0]).toEqual(ink);
  const [, head] = await shown(page, [33, 31.75], hex);
  const [, tail] = await shown(page, [37, 31.75], hex);
  expect(head, 'the arrow has no head at the lower end of the top').toBeGreaterThan(0);
  expect(tail, 'the arrow has a head at the higher end of the top').toBe(0);
  await expect(page.locator('#picked')).toContainText('falls up the plot');
  await expect(page.locator('#picked')).not.toContainText('Shift');
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('in the front view a top is pulled across the plot, and back up to nothing; without Shift the corner makes the box larger', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page, 'front');

  // The paper of the slice across the plot runs along the rows of the top view, and the front
  // view shows it from behind: the box lies on it from row 30 to row 38, and no other block
  // touches its top corner at row 38. Pulled three rows down, that end of the top lies in row
  // 15, 1.5 m over the floor: the top falls across the plot, towards the side that the side
  // view looks from, and the slope is said from the box's own two rows.
  await drag(page, 'front', [37.9, 12.1], [37.9, 15.2], true);
  await expect.poll(() => slope(page)).toEqual({ y: [30, 38], z: [12, 15] });
  await expect(page.locator('#picked')).toContainText(
    'The top of this box falls towards the north-west side, from 3 m over its floor to 1.5 m.',
  );

  // Pulled back up, three rows and more, the box says no slope: the sketch is the file again.
  await drag(page, 'front', [37.9, 12.1], [37.9, 8], true);
  await expect.poll(() => slope(page)).toBeNull();
  expect(await kept(page)).toBe(SKETCH);
  await expect(page.locator('#picked')).not.toContainText('falls');

  // Without Shift the same corner makes the box larger, as it did: two rows higher and two rows
  // wider - and its top is level.
  await drag(page, 'front', [37.9, 12.1], [40.1, 9.9], false);
  await expect
    .poll(async () => (JSON.parse(await kept(page)) as Sketch).things[AT])
    .toMatchObject({ x: [30, 40], y: [30, 40], z: [10, 18] });
  expect(await slope(page)).toBeNull();
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
