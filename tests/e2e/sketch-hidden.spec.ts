import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { asNow, VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// A hidden section on the paper, end to end, on the made-up plot (story ST-032, task T-032.3):
// the made-up house of version 4 - without its lawn and its cut, so that its ground is the
// hill's own whatever is taken out - with its upper home in a section that the sketch says is
// hidden, beside the same house with the upper home taken out of the text. In each of the five
// views the paper of the one is the paper of the other, by the pixels of its canvas, and so is
// the picture that File saves; with the section shown it is another. From above, the level of
// the upper home says that sixteen things are hidden on it, Select has nothing there, and
// "Delete" says how much of what it would take is hidden. In a slice through both floors no
// click of Select and no click or box of the eraser or of Merge reaches it. The 3D page shows
// the whole house, hidden or not. The switch that hides a section is T-032.4's: here the sketch
// says so. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of
// site.js. The real plot is in no part of this run: a case asks yes or no whether its page is on
// the made-up plot, before a matcher reads that page (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage to show the house on';

// THE UPPER HOME, as tests/__fixtures__/CLAUDE.md has it: at 817 m, row 18 of a standing view,
// the two boxes of the night rooms, the bath and the roof terrace - four boxes - and the twelve
// objects that stand on that level. The house of version 4 as the pad of now reads it, drawn on
// the level at 814 m.
type Thing = { name?: string; floor?: number | string; group?: number; colour?: number };
const UPPER = ['Night rooms', 'Bath', 'Roof terrace'];
const upper = (thing: Thing): boolean => UPPER.includes(thing.name ?? '') || thing.floor === 18;
const lower = (thing: Thing): boolean => !upper(thing);
// And on the lower floor, in the slice along row 30, the three boxes of the house beside them.
const THREE = ['Day rooms', 'Glass porch', 'Store'];
const ofThree = (thing: Thing): boolean => THREE.includes(thing.name ?? '');
const thingsOf = (text: string): Thing[] => (JSON.parse(text) as { things: Thing[] }).things;
const DRAWN = asNow('made-up', 4).replace('"top":18,', '"top":24,');
// SHOWN: `,"section":1` on the four boxes, and the section in the list. HIDDEN: the same with
// the section hidden. WITHOUT: the house with those four boxes and twelve objects taken out.
const SHOWN = UPPER.reduce(
  (text, name) => text.replaceAll(`"name":"${name}"`, `"name":"${name}","section":1`),
  DRAWN,
).replace(/}$/, ',"sections":[{"id":1,"name":"Upper home"}]}');
const HIDDEN = SHOWN.replace('"Upper home"}', '"Upper home","hidden":true}');
const WITHOUT = JSON.stringify({ ...JSON.parse(DRAWN), things: thingsOf(DRAWN).filter(lower) });
const UPPER_TEXT = JSON.stringify(thingsOf(HIDDEN).filter(upper));
// The night rooms lie at column 32 and row 31 of the top view's paper, on the level at 817 m,
// and at column 35 and row 15 of the side view's, in the slice along row 30
// (tests/e2e/sketch-frame.spec.ts).
const VIEWS = ['top', 'side', 'far', 'front', 'back'] as const;

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

/** Opens a page of the pad with a sketch in its store - put there by a page of the pad, and the page loaded anew: what it shows is what it draws as it opens. It fails unless the page is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string, sketch: string): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = `globalThis.SITE?.name === ${JSON.stringify(PLOT)}`;
  await page.goto(address);
  expect(await page.evaluate<boolean>(madeUp), 'the pad is not on the made-up plot').toBe(true);
  await page.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(sketch)})`);
  await page.reload();
  expect(await page.evaluate<boolean>(madeUp), 'the pad is not on the made-up plot').toBe(true);
}

/** The sketch that the browser keeps. */
const kept = async (page: Page): Promise<string> =>
  (await page.evaluate<string | null>(`localStorage.getItem(${STORE})`)) ?? '';

/** The paper's own pixels, as a PNG: once the browser has shown two frames more. Page code. */
const paperOf = (page: Page): Promise<string> =>
  page.evaluate<string>(`new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(
    () => done(document.getElementById('paper').toDataURL('image/png')),
  )))`);

// Page code: how many pixels of two pictures, each a PNG as an address, are of another colour,
// in red, green, blue or how clear - every one of them, where the two are of another size.
const apart = (one: string, other: string): string => `Promise.all(
  [${JSON.stringify(one)}, ${JSON.stringify(other)}].map((source) => new Promise((done) => {
    const picture = new Image();
    picture.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [picture.width, picture.height];
      const pen = canvas.getContext('2d');
      pen.drawImage(picture, 0, 0);
      done(pen.getImageData(0, 0, canvas.width, canvas.height).data);
    };
    picture.src = source;
  })),
).then(([here, there]) => {
  if (here.length !== there.length) return Math.max(here.length, there.length) / 4;
  let other = 0;
  for (let at = 0; at < here.length; at += 4) {
    if ([0, 1, 2, 3].some((n) => here[at + n] !== there[at + n])) other += 1;
  }
  return other;
})`;
const png = (bytes: Buffer): string => `data:image/png;base64,${bytes.toString('base64')}`;

/** Where a place of the paper lies on the page, in pixels: a column and a row of its cells. */
async function paperAt(page: Page): Promise<(column: number, row: number) => [number, number]> {
  const [[x0, y0], [x1, y1]] = [await placeOf(page, [0, 0]), await placeOf(page, [1, 1])];
  return (column, row) => [x0 + column * (x1 - x0), y0 + row * (y1 - y0)];
}

/** A box of a tool dragged over the whole paper, from its first pixel to its last. */
async function overAll(page: Page, tool: string): Promise<void> {
  await page.locator(`[data-tool="${tool}"]`).click();
  const ends = await page.evaluate<[number, number]>(
    '[globalThis.paper.WIDE, globalThis.paper.ROWS]',
  );
  const [[left, top], [right, foot]] = [await placeOf(page, [0, 0]), await placeOf(page, ends)];
  await page.mouse.move(left + 1, top + 1);
  await page.mouse.down();
  await page.mouse.move(right - 1, foot - 1, { steps: 8 });
  await page.mouse.up();
}

test('the four houses are what they say: sixteen things of the upper home, four of them boxes in the section', () => {
  expect(JSON.parse(DRAWN)).toMatchObject({ space: VERSION, on: { top: 24, side: 30, end: 36 } });
  expect([thingsOf(DRAWN).filter(upper).length, thingsOf(WITHOUT).length]).toEqual([16, 19]);
  expect(SHOWN.split(',"section":1').length - 1).toBe(4);
  // As the pad writes it: what Undo keeps again is the very text.
  expect(JSON.stringify(JSON.parse(HIDDEN))).toBe(HIDDEN);
  expect(HIDDEN).toContain('"hidden":true');
});

for (const view of VIEWS) {
  test(`${view}: the paper of the house with its upper home hidden is the paper of the house without it, and with the section shown another`, async ({
    page,
    baseURL,
  }) => {
    const heard = watch(page, baseURL);
    const papers: string[] = [];
    for (const house of [HIDDEN, WITHOUT, SHOWN]) {
      await open(page, `/#${view}`, house);
      papers.push(await paperOf(page));
    }
    const [hidden = '', without = '', shown = ''] = papers;
    const others = await page.evaluate<number>(apart(hidden, without));
    expect(others, 'pixels of another colour than without the upper home').toBe(0);
    const shownOthers = await page.evaluate<number>(apart(shown, without));
    expect(shownOthers, 'the section shown looks as if it were hidden').toBeGreaterThan(0);
    expect(heard).toEqual([]);
  });
}

test('the picture that File saves from above is the picture of the house without the upper home, and with the section shown another', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  const pictures: string[] = [];
  for (const house of [HIDDEN, WITHOUT, SHOWN]) {
    await open(page, '/#top', house);
    await page.getByRole('button', { name: 'File', exact: true }).click();
    const saving = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Picture (PNG)' }).click();
    const download = await saving;
    expect(download.suggestedFilename()).toBe('sketch-top-Level 814 m.png');
    pictures.push(png(readFileSync(await download.path())));
  }
  const [hidden = '', without = '', shown = ''] = pictures;
  expect(await page.evaluate<number>(apart(hidden, without)), 'another picture').toBe(0);
  expect(await page.evaluate<number>(apart(shown, without)), 'the same picture').toBeGreaterThan(0);
  expect(heard).toEqual([]);
});

test('from above, on the level at 817 m: its line says 16 hidden, Select has nothing where the night rooms lie, and "Delete" says 16 of 16 are hidden and, dismissed, takes nothing', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  // Drawn on: the level is picked, kept with the sketch and no step to undo.
  const ON_817 = HIDDEN.replace('"top":24,', '"top":18,');
  for (const [house, said, selects] of [
    [HIDDEN, ['16 hidden', '4 blocks, 13 objects', '2 objects'], false],
    [SHOWN, ['4 blocks, 12 objects', '4 blocks, 13 objects', '2 objects'], true],
  ] as const) {
    await open(page, '/#top', house);
    await page.locator('#layers button', { hasText: 'Level 817 m' }).click();
    await expect(page.locator('#layers small')).toHaveText(said);
    await page.locator('[data-tool="move"]').click();
    const at = await paperAt(page);
    await page.mouse.click(...at(32, 31));
    await expect(page.locator('#picked')).toBeVisible({ visible: selects });
    await expect(page.locator('#none-picked')).toBeVisible({ visible: !selects });
  }
  // Hidden once more. The tab had the night rooms selected, by their place in the sketch: hidden
  // now, they are selected no more. And the question of "Delete", dismissed: the sketch that
  // the browser keeps is the text it was.
  await open(page, '/#top', ON_817);
  await expect(page.locator('#none-picked')).toBeVisible();
  await expect(page.locator('#picked')).toBeHidden();
  let question = '';
  page.once('dialog', (dialog) => {
    question = dialog.message();
    void dialog.dismiss();
  });
  await page.locator('#remove').click();
  await expect
    .poll(() => question)
    .toBe(
      'Delete Level 817 m, with all that stands on it (16, 16 of them hidden)? Undo brings it back while this tab stays open.',
    );
  expect(await kept(page)).toBe(ON_817);
  await expect(page.locator('#layers small').first()).toHaveText('16 hidden');
  expect(heard).toEqual([]);
});

test('in the slice through both floors no click of Select and no click or box of the eraser or of Merge reaches the hidden upper home', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await open(page, '/#side', HIDDEN);
  await expect(page.locator('#cut-at')).toHaveText(
    'Slice 13 m across the plot: 3 blocks, 4 objects, 3 hidden.',
  );
  // Where the night rooms lie, column 35 and row 15: Select selects nothing, and a click of the
  // eraser leaves the sketch that the browser keeps the text it was.
  const at = await paperAt(page);
  await page.locator('[data-tool="move"]').click();
  await page.mouse.click(...at(35, 15));
  await expect(page.locator('#none-picked')).toBeVisible();
  await expect(page.locator('#picked')).toBeHidden();
  await page.locator('[data-tool="erase"]').click();
  await page.mouse.click(...at(35, 15));
  expect(await kept(page)).toBe(HIDDEN);
  // A box of the eraser over the whole paper takes the day rooms, the porch and the store, and of
  // the upper home nothing: its four boxes and its twelve objects, each the text it was.
  await overAll(page, 'erase');
  await expect.poll(() => kept(page)).not.toBe(HIDDEN);
  const erased = thingsOf(await kept(page));
  expect(erased.filter(ofThree)).toEqual([]);
  expect(JSON.stringify(erased.filter(upper))).toBe(UPPER_TEXT);
  // Undo; and a box of Merge over the whole paper makes one block of those three, in the day
  // rooms' colour, and leaves the four boxes as they were.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => kept(page)).toBe(HIDDEN);
  await overAll(page, 'merge');
  await expect.poll(() => kept(page)).not.toBe(HIDDEN);
  // Its `group` is the next one, 2: the night rooms keep their 1.
  const merged = thingsOf(await kept(page));
  const told = merged
    .filter(ofThree)
    .map(({ group, colour }) => `group ${group}, colour ${colour}`);
  expect(told).toEqual(['group 2, colour 2', 'group 2, colour 2', 'group 2, colour 2']);
  expect(JSON.stringify(merged.filter(upper))).toBe(UPPER_TEXT);
  expect(heard).toEqual([]);
});

test('the 3D page shows the whole house with the section hidden as with it shown: 35 solids, and the same picture of its stage', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  const body = page.locator('body');
  const pictures: Buffer[] = [];
  for (const house of [SHOWN, HIDDEN]) {
    await open(page, '/3d.html', house);
    await expect(body).toHaveAttribute('data-stage', /^(drawn|none)$/);
    test.skip((await body.getAttribute('data-stage')) !== 'drawn', NO_STAGE);
    await expect(body).toHaveAttribute('data-solids', '35');
    await expect(body).toHaveAttribute('data-shown', '35');
    // The stage as it shows once it has been drawn: when the browser has shown six frames more.
    await page.evaluate(`(async () => {
      for (let left = 6; left > 0; left -= 1) await new Promise(requestAnimationFrame);
    })()`);
    pictures.push(await page.locator('#stage canvas').screenshot());
  }
  const [shown, hidden] = pictures;
  if (!shown || !hidden) throw new Error('no picture of the stage');
  expect(await page.evaluate<number>(apart(png(shown), png(hidden))), 'another picture').toBe(0);
  expect(heard).toEqual([]);
});
