import { expect, test, type Page } from '@playwright/test';
import { pixelOf, placeOf } from './sketch-paper';

// The shaped ground in the pad, end to end, on the made-up plot (story ST-027): what the owner
// does. In the side view a block is drawn with the Block tool, selected, and stepped to ground
// with C: the sketch that the browser keeps says so, the ground of the slice rises beside the
// block, and the pad measures a place from the ground as it is shaped. Its top edge pulled under
// the hill with Select lowers the ground; Undo and a reload show the ground as it was; a slice
// beside the block shows the ground on its way back to the hill; and from above the block is a
// block. The sketch is this test's own - nothing drawn, its slice along row 30 of the top view -
// so that it holds whatever the made-up house gains. `pnpm sketch --demo` serves
// the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part of this run,
// and a case asks yes or no whether its page is on the made-up plot before a matcher reads that
// page (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// Nothing drawn, in a sketch of version 5: the pad reads it, and keeps a sketch of the version it
// writes from the first stroke on - no case here asks which version is kept.
const EMPTY = { space: 5, things: [], floors: [], notes: [], on: { side: 30 }, show: {} };

type Place = readonly [column: number, row: number];
// What this test reads of a sketch: of a thing where it lies and what it says it is, and where
// the slices run.
type Thing = Readonly<Partial<Record<'x' | 'y' | 'z' | 'is', unknown>>>;
type Sketch = Readonly<{ things: readonly Thing[]; on: Readonly<Record<string, unknown>> }>;
// The two views this test looks at. Neither shows its paper from behind.
const VIEWS = { side: 'Side view', top: 'Top view' } as const;

// The made-up ground is a plane: at column c and row r of the top view's paper it lies at
// 820 - 0.1 c - 0.02 r m, and a height h lies in row 2 (826 - h) of a standing paper. So on the
// slice along row 30 the hill runs in row 13.2 + 0.2 c.
// THE BLOCK is drawn on that slice from column 40 to 50 and from row 16 to 28: 6 m deep about
// the slice, rows 24 to 36 of the top view, with its top at 826 - 8 = 818 m.
const LIES = { x: [40, 50], y: [24, 36], z: [16, 28] } as const;
const [FROM, TO, INSIDE] = [
  [40.5, 16.5],
  [49.5, 27.5],
  [45, 22],
] as const;
// A PLACE OVER ITS MIDDLE, column 45 and row 14: 819 m above sea level. The hill lies at 814.9 m
// there, 4.1 m under the place, and the block's top 1.0 m under it.
const OVER_BLOCK = [45, 14] as const;
// TWO PLACES BESIDE ITS DOWNHILL END, at column 51.5, each clear of every line of the grid. There
// the hill runs in row 23.5, and with the block's top for ground, the ground in row 17.1. The
// first, in row 20.5, lies between the two: over the hill, and under the ground once it is
// filled. The second, in row 24.75, lies under the hill - and over the ground once the block's
// top is pulled down to row 26, where the ground then runs in row 26.0.
const [OVER_HILL, UNDER_HILL] = [
  [51.5, 20.5],
  [51.5, 24.75],
] as const;
// The paper, and the tint under the line of the ground (land.js): red, green, blue.
const [PAPER, TINT] = [
  [255, 255, 255],
  [0xf1, 0xeb, 0xe0],
];
const GROUND = 'ground, set by hand';

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
async function expectView(page: Page, view: keyof typeof VIEWS): Promise<void> {
  await expect(page).toHaveTitle(`${VIEWS[view]} — sketch pad`);
  await page.waitForLoadState('load');
  await expectMadeUpPlot(page);
}

/** Opens the side view of the pad with the test's own sketch in its store - put there once: what the pad keeps after it stays through a reload. */
async function openPad(page: Page): Promise<void> {
  const empty = JSON.stringify(JSON.stringify(EMPTY));
  const seed = `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${empty});`;
  await page.addInitScript(seed);
  await page.goto('/#side');
  // Before any matcher reads the page. A view that a key goes to later is a page of this pad.
  await expectMadeUpPlot(page);
  await expectView(page, 'side');
}

/** The sketch that the browser keeps: as the text it is kept as, and read. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
const kept = async (page: Page): Promise<Sketch> => JSON.parse(await keptText(page)) as Sketch;

/** Where a place of the paper is on the page, in pixels (sketch-paper.ts). */
const onPage = placeOf;

/** A drag with the tool that is on, from a place of the paper to another: a click, where the two are one. */
async function drag(page: Page, from: Place, to: Place): Promise<void> {
  const [start, end] = [await onPage(page, from), await onPage(page, to)];
  await page.mouse.move(...start);
  await page.mouse.down();
  await page.mouse.move(...end, { steps: 6 });
  await page.mouse.up();
}

/** The colour of the paper's picture at a place of the paper: red, green, blue. */
const colour = async (page: Page, place: Place): Promise<number[]> => {
  const [x, y] = await pixelOf(page, place);
  return page.evaluate<number[]>(`(() => {
    const canvas = document.getElementById('paper');
    return [...canvas.getContext('2d').getImageData(${x}, ${y}, 1, 1).data.slice(0, 3)];
  })()`);
};

/** Waits until the paper shows these colours at the two places beside the block: the one over the line of the hill, and the one under it. */
async function expectBeside(page: Page, over: number[], under: number[]): Promise<void> {
  await expect.poll(() => colour(page, OVER_HILL), 'over the line of the hill').toEqual(over);
  await expect.poll(() => colour(page, UNDER_HILL), 'under the line of the hill').toEqual(under);
}

/** Brings the pointer to the place over the block, from beside it: the pad says a place when the pointer moves. */
async function point(page: Page): Promise<void> {
  const [x, y] = await onPage(page, OVER_BLOCK);
  await page.mouse.move(x + 30, y);
  await page.mouse.move(x, y);
}

/** Waits until the pad says of the place over the block that it lies so far above the ground at the slice - to a decimetre: a pointer is a pixel off, a twelfth of a cell. */
async function expectAbove(page: Page, metres: number): Promise<void> {
  await point(page);
  const figures = [-0.1, 0, 0.1].map((off) => (metres + off).toFixed(1).replace('.', '\\.'));
  const words = new RegExp(`, (${figures.join('|')}) m above the ground at the slice$`);
  await expect(page.locator('#status')).toHaveText(words);
}

/** Draws the block with the Block tool - taken by its key, for it has no button - and selects it: a room, as it has no name. */
async function block(page: Page): Promise<void> {
  await page.keyboard.press('b');
  await drag(page, FROM, TO);
  await expect.poll(async () => (await kept(page)).things).toMatchObject([LIES]);
  await page.locator('[data-tool="move"]').click();
  await drag(page, INSIDE, INSIDE);
  await expect(page.locator('#picked')).toContainText('Block: a room, as it has no name.');
}

/** Presses C until the pad says that the selected block is ground, set by hand, and where its top lies: a step for each thing a block counts as, and after each the pad's words are others. */
async function setToGround(page: Page): Promise<void> {
  const words = page.locator('#picked');
  for (let steps = 0; steps < 6; steps += 1) {
    const said = (await words.textContent()) ?? '';
    if (said.includes(GROUND)) break;
    await page.keyboard.press('c');
    await expect(words).not.toHaveText(said);
  }
  await expect(words).toContainText(`Block: ${GROUND}. C changes it.`);
  await expect(words).toContainText('Its top is 818 m above sea level.');
}

test('in the side view a block drawn and stepped to ground with C raises the ground beside it, and the pad measures from it', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  // The hint beside the paper is all that tells the owner how.
  await expect(page.locator('#layers-hint')).toContainText(
    'A block that C sets to ground shapes the ground: its top is the ground there, and from it the ground runs out to the plot boundary.',
  );

  // A block, and a room: the ground is the hill. Beside the block the paper is paper over the
  // line of the hill and tinted under it, and the place over the block lies 4.1 m over the hill.
  await block(page);
  await expectBeside(page, PAPER, TINT);
  await expectAbove(page, 4.1);
  expect(await keptText(page)).not.toContain('"is"');

  // Ground: the sketch that the browser keeps says so of that box. Beside the block the ground
  // has risen over the first place, which is tinted now; and the place over the block lies 1.0 m
  // over the ground.
  await setToGround(page);
  expect(await keptText(page)).toContain('"is":"ground"');
  expect((await kept(page)).things).toMatchObject([{ ...LIES, is: 'ground' }]);
  await expectBeside(page, TINT, TINT);
  await expectAbove(page, 1.0);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('its top edge pulled under the hill lowers the ground, and Undo and a reload show the ground as it was', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  await block(page);
  await setToGround(page);
  await expectBeside(page, TINT, TINT);

  // The top edge, in row 16, pulled ten rows down with Select: the top lies in row 26, 813 m,
  // 1.9 m under the hill at the block's middle. Beside the block both places are paper: the
  // ground is cut down under the second. And the place over the block lies 6.0 m over it.
  await drag(page, [42, 16.2], [42, 26.2]);
  await expect.poll(async () => (await kept(page)).things).toMatchObject([{ z: [26, 28] }]);
  await expect(page.locator('#picked')).toContainText('Its top is 813 m above sea level.');
  await expectBeside(page, PAPER, PAPER);
  await expectAbove(page, 6.0);

  // Undo: the top is in row 16 again, and the ground as it was, by the same two places.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect
    .poll(async () => (await kept(page)).things)
    .toMatchObject([{ ...LIES, is: 'ground' }]);
  await expectBeside(page, TINT, TINT);
  await expectAbove(page, 1.0);

  // Loaded anew, the page shows it so: the ground is worked out as the page opens.
  await page.reload();
  await expectView(page, 'side');
  await expectBeside(page, TINT, TINT);
  await expectAbove(page, 1.0);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a slice beside the block shows the ground on its way back to the hill, and from above the block is a block in its colour', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  await block(page);
  await setToGround(page);
  await expectAbove(page, 1.0);

  // The slice stepped eight rows on, to row 38 of the top view, 9 m across the plot: beside the
  // block, which ends at row 36. There the hill lies at 820 - 4.5 - 0.76 = 814.74 m under the
  // place, 4.3 m under it. The pad says a height between that and the 1.0 m over the block.
  for (let steps = 0; steps < 8; steps += 1) await page.keyboard.press('PageDown');
  await expect(page.locator('#cut-at')).toHaveText('Slice 9 m across the plot: nothing yet.');
  expect((await kept(page)).on['side']).toBe(38);
  await point(page);
  const above = async (): Promise<number> => {
    const said = (await page.locator('#status').textContent()) ?? '';
    return Number(/, ([\d.]+) m above the ground at the slice$/.exec(said)?.[1]);
  };
  await expect
    .poll(above, 'beside the block the ground is as high as its top')
    .toBeGreaterThan(1.1);
  expect(await above(), 'beside the block the ground is the hill').toBeLessThan(4.2);

  // From above, key 1, on the level that the block stands on: the block lies on columns 40 to 50
  // and rows 24 to 36, filled with its colour at six tenths over the white of the paper
  // (draw.js) - to a step of a colour, as a browser rounds it - and beside it the paper is paper.
  await page.keyboard.press('1');
  await expectView(page, 'top');
  const hex = await page.evaluate<string>('paper.hex(sketch.doc.things[0].colour)');
  const filled = [1, 3, 5].map((at) => 0.6 * parseInt(hex.slice(at, at + 2), 16) + 0.4 * 255);
  const off = async (): Promise<number> => {
    const shown = await colour(page, [42.5, 26.5]);
    return Math.max(...shown.map((part, at) => Math.abs(part - (filled[at] ?? 0))));
  };
  await expect.poll(off, 'the block is not filled with its colour').toBeLessThanOrEqual(1);
  expect(await colour(page, [52.5, 26.5])).toEqual(PAPER);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
