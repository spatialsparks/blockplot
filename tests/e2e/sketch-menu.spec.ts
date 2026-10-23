import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { placeOf } from './sketch-paper';

// File is a menu, on both pages of the sketch pad, end to end, on the made-up plot with the
// made-up sketch (story ST-029, task T-029.2). On the pad's page: shut, no entry shows; a click
// on File opens its six entries in their order, one under the other, with "Export" over the
// last, and moves nothing of the page; open, the menu has the keys - no tool, no view, no level,
// no list, no undo - and Escape shuts it, gives File the focus and leaves what is selected; a
// click on the paper or on another control shuts it, and so does the focus gone elsewhere;
// "Open file" and "Picture (PNG)" do through the menu what their buttons did. "Save file" is
// pressed so in sketch.spec.ts, Keep and Open kept in sketch-kept.spec.ts, and the 3D page's
// entry in sketch-3d-header.spec.ts. And the switch of views stands where the pad has it: its
// seven links lie at the same pixels on both pages. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time. And another made-up sketch, as a file to open:
// the golden file that holds every part of the format.
const golden = (name: string): string =>
  fileURLToPath(new URL(`../__fixtures__/sketch/${name}.json`, import.meta.url));
const SKETCH = readFileSync(golden('made-up'), 'utf8');
const OTHER = golden('every-part');
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage to stand File beside';
// The level that the made-up sketch is drawn on: the highest, which the top view lists first.
const DRAWN_ON = 'Level 817 m';
// The entries of the pad's File menu, in their order: the last stands under the word "Export".
const ENTRIES = ['Open file', 'Open kept', 'Open plot', 'Save file', 'Keep', 'Picture (PNG)'];
// The night rooms of the made-up sketch lie on the level that the top view is drawn on, around
// column 32 and row 31 of its paper (sketch-paper.ts).
const ON_A_BLOCK = [32, 31] as const;

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
// Where File and the seven links of the switch lie: of each its words, and its left edge, its
// top, its width and its height in pixels - seen or not.
type Lies = [words: string, left: number, top: number, width: number, height: number];
const SWITCH = `[...document.querySelectorAll('#file-menu, #views a')].map((one) => {
  const { left, top, width, height } = one.getBoundingClientRect();
  return [one.textContent.trim(), left, top, width, height];
})`;
const STANDS = 'File|Top view|Side view|Other side|Front view|Back view|3D|Info'.split('|');

// Every case opens in a tab that has the made-up sketch in the pad's store.
test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await page.waitForLoadState('load');
}
/** The two parts of File: its button, found by its name, and the part that the button opens. */
const menu = (page: Page): Record<'file' | 'entries', Locator> => ({
  file: page.getByRole('button', { name: 'File', exact: true }),
  entries: page.locator('#file-entries'),
});
/** The sketch that the browser keeps. */
const kept = (page: Page): Promise<string | null> =>
  page.evaluate<string | null>(`localStorage.getItem(${JSON.stringify(KEY)})`);
/** Where a part of the page lies: left, top, width and height, in pixels. */
async function lies(page: Page, part: string): Promise<number[]> {
  const box = await page.locator(part).boundingBox();
  if (box === null) throw new Error(`the page shows no ${part}`);
  return [box.x, box.y, box.width, box.height];
}
/** A click on the paper of the top view, at a column and a row of it. */
async function clickPaper(page: Page, place: readonly [number, number]): Promise<void> {
  await page.mouse.click(...(await placeOf(page, place)));
}

test('File is one button: a click opens its six entries one under the other, "Export" over the last, and moves nothing', async ({
  page,
}) => {
  await open(page, '/#top');
  const { file, entries } = menu(page);
  // Shut: one button that says so, and no entry shows - none answers to its name.
  await expect(file).toHaveAttribute('id', 'file-menu');
  await expect(file).toHaveAttribute('aria-controls', 'file-entries');
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(entries).toBeHidden();
  for (const name of ENTRIES) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  const before = [await lies(page, 'header'), await lies(page, '#paper')];

  // A click: File says that it is open, and the entries show in their order - the word "Export"
  // before the last - and the first of them has the focus.
  await file.click();
  await expect(file).toHaveAttribute('aria-expanded', 'true');
  await expect(entries).toBeVisible();
  const shown = [...ENTRIES.slice(0, -1), 'Export', ...ENTRIES.slice(-1)];
  await expect(entries.locator(':scope > *')).toHaveText(shown);
  await expect(entries.getByRole('button')).toHaveText(ENTRIES);
  await expect(page.getByRole('button', { name: 'Open file' })).toBeFocused();
  // They lie under the button, one under the other: each begins no higher than where the one
  // before it ends. And the menu takes no room: the toolbar is as high, and the paper lies
  // where it lay.
  const [, top = NaN, , high = NaN] = await lies(page, '#file-menu');
  const feet: number[] = [top + high];
  for (const one of await entries.locator(':scope > *').all()) {
    const box = await one.boundingBox();
    expect(box?.y, (await one.textContent()) ?? '').toBeGreaterThanOrEqual(feet.at(-1) ?? NaN);
    feet.push((box?.y ?? NaN) + (box?.height ?? NaN));
  }
  expect(feet).toHaveLength(shown.length + 1);
  expect([await lies(page, 'header'), await lies(page, '#paper')]).toEqual(before);

  // A second click shuts it.
  await file.click();
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(entries).toBeHidden();
});

test('open, the menu has the keys; Escape shuts it, gives File the focus and leaves the block selected', async ({
  page,
}) => {
  await open(page, '/#top');
  const { file, entries } = menu(page);
  // A block is selected, with Select, the tool the pad opens with - and stepped with C to a
  // room set by hand: a change of the sketch, and so a step to undo.
  await clickPaper(page, ON_A_BLOCK);
  const picked = page.locator('#picked');
  await expect(picked).toBeVisible();
  await page.keyboard.press('c');
  await expect.poll(() => kept(page)).not.toBe(SKETCH);
  const [stepped, words] = [await kept(page), (await picked.textContent()) ?? ''];
  await page.evaluate('globalThis.stayed = true');

  // Open, no key is the page's: B takes no tool and O none, 2 and V go to no view, K gives the
  // list of categories no focus, C steps nothing, Page Down goes to no level and Ctrl+Z undoes
  // nothing. The page was not loaded anew, and the sketch is the text it was.
  await file.click();
  await expect(entries).toBeVisible();
  for (const key of ['b', 'o', '2', 'v', 'k', 'c', 'PageDown', 'Control+z']) {
    await page.keyboard.press(key);
  }
  await expect(page.locator('[data-tool="move"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveTitle('Top view — sketch pad');
  expect(await page.evaluate<boolean>('globalThis.stayed === true')).toBe(true);
  await expect(page.getByRole('button', { name: 'Open file' })).toBeFocused();
  await expect(page.getByRole('button', { name: DRAWN_ON })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect((await kept(page)) === stepped, 'a key changed the sketch').toBe(true);
  await expect(entries).toBeVisible();

  // Escape shuts the menu and gives File the focus - and ends there: the block is selected
  // still, where an Escape of the page's leaves nothing selected.
  await page.keyboard.press('Escape');
  await expect(entries).toBeHidden();
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(file).toBeFocused();
  await expect(picked).toBeVisible();
  await expect(picked).toHaveText(words);
  // Shut, a key is what it was: Ctrl+Z takes the step back, B takes the Block tool, and Escape
  // leaves nothing selected.
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(SKETCH);
  await page.keyboard.press('b');
  await expect(page.locator('#palette [aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(picked).toBeHidden();
});

test('a click on the paper shuts the menu, and so do a click on another control and the focus gone elsewhere', async ({
  page,
}) => {
  await open(page, '/#top');
  const { file, entries } = menu(page);
  // A click on the word in the menu is no pick, and shuts nothing.
  await file.click();
  await entries.getByText('Export').click();
  await expect(entries).toBeVisible();
  // A click on the paper shuts it - and is the paper's too: Select takes the block there.
  await clickPaper(page, ON_A_BLOCK);
  await expect(entries).toBeHidden();
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#picked')).toBeVisible();
  // A click on another control shuts it, and that control does what it does.
  await file.click();
  await expect(entries).toBeVisible();
  await page.locator('[data-tool="line"]').click();
  await expect(entries).toBeHidden();
  await expect(page.locator('[data-tool="line"]')).toHaveAttribute('aria-pressed', 'true');
  // Tab goes from entry to entry, and from the last one out of the menu, to the switch of views:
  // the menu shuts as the focus leaves it. Back to File from its first entry, it stays open.
  await file.click();
  await page.keyboard.press('Shift+Tab');
  await expect(file).toBeFocused();
  await expect(entries).toBeVisible();
  await page.getByRole('button', { name: 'Picture (PNG)' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Top view' })).toBeFocused();
  await expect(entries).toBeHidden();
});

test('"Open file", picked from the menu, opens a sketch by the file chooser, and Undo brings back the one that was there', async ({
  page,
}) => {
  await open(page, '/#top');
  const { file, entries } = menu(page);
  await file.click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Open file' }).click(),
  ]);
  // The entry heard its click - the browser asks for a file - and the menu is shut.
  await expect(entries).toBeHidden();
  // The file takes the place of the sketch that was there: the browser keeps it, to the letter.
  const other = readFileSync(OTHER, 'utf8');
  expect(other === SKETCH, 'the file to open is the sketch that is open').toBe(false);
  await chooser.setFiles(OTHER);
  await expect.poll(async () => (await kept(page)) === other, { message: 'not opened' }).toBe(true);
  await expect(page.locator('#alarm')).toBeEmpty();
  // One change, as it was: Undo brings back the made-up sketch.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => kept(page)).toBe(SKETCH);
});

test('"Picture (PNG)", picked from the menu, saves the paper as a picture, as large as the paper', async ({
  page,
}) => {
  await open(page, '/#top');
  const { file, entries } = menu(page);
  await file.click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Picture (PNG)' }).click();
  const download = await saving;
  // Named after the view and the layer drawn on: the highest level of the made-up sketch.
  expect(download.suggestedFilename()).toBe(`sketch-top-${DRAWN_ON}.png`);
  // A PNG says what it is in its first eight bytes, and after them how wide and how high.
  const picture = readFileSync(await download.path());
  expect(picture.toString('latin1', 0, 8)).toBe('\x89PNG\r\n\x1a\n');
  const paper = await page.evaluate<number[]>(
    `[document.getElementById('paper').width, document.getElementById('paper').height]`,
  );
  expect([picture.readUInt32BE(16), picture.readUInt32BE(20)]).toEqual(paper);
  // The pick shut the menu, and a key is the page's again: B takes the Block tool.
  await expect(entries).toBeHidden();
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('b');
  await expect(page.locator('#palette [aria-pressed="true"]')).toHaveCount(1);
});

// The switch of views stands where the pad has it: File is one button on both pages, and keeps
// its place on the 3D page where that has no stage and File is not seen.
for (const [width, height, stage] of [
  [1440, 900, true],
  [1440, 900, false],
  [1280, 720, true],
  [1280, 720, false],
] as const) {
  test(`in a window of ${width} by ${height}, ${stage ? 'with a stage' : 'without WebGL'}, the seven links of the switch lie at the same pixels on both pages`, async ({
    page,
  }) => {
    if (!stage) await page.addInitScript(NO_WEBGL);
    await page.setViewportSize({ width, height });
    // The pad's page, from above and standing up: a view of it is the page loaded anew.
    await open(page, '/#top');
    const pad = await page.evaluate<Lies[]>(SWITCH);
    expect(pad.map(([words]) => words)).toEqual(STANDS);
    expect(pad.every(([, , , wide, high]) => wide > 0 && high > 0)).toBe(true);
    await page.goto('about:blank');
    await open(page, '/#side');
    await expect(page).toHaveTitle('Side view — sketch pad');
    expect(await page.evaluate<Lies[]>(SWITCH)).toEqual(pad);

    // The 3D page: File and the seven links, each where the pad has it, to the pixel.
    await open(page, '/3d.html');
    await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
    const drawn = (await page.locator('body').getAttribute('data-stage')) === 'drawn';
    test.skip(stage && !drawn, NO_STAGE);
    expect(drawn).toBe(stage);
    expect(await page.evaluate<Lies[]>(SWITCH)).toEqual(pad);
    // With a stage File is seen there, and without one it is not: it keeps its place.
    await expect(page.locator('#file-menu')).toBeVisible({ visible: stage });
    for (const link of await page.locator('#views a').all()) await expect(link).toBeVisible();
  });
}
