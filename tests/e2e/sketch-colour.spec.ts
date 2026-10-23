import { expect, test, type Locator, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// A colour is the Block tool, and a block's colour stands beside the paper, on the made-up plot
// (ST-029; ST-039): a colour picked in the toolbar's menu takes Block in it - with any tool but
// Line - and paints nothing; the selected block's swatch paints every box of it, in one step. On
// `pnpm sketch --demo`, never the real plot: each case asks so before it reads (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// A place of the top view's paper, which is not shown from behind (sketch-paper.ts).
type Place = readonly [column: number, row: number];
type Sketch = Readonly<{ things: readonly unknown[]; notes: readonly unknown[] }>;

// THE SKETCH, this test's own: on one level, at 815 m - row 22 of a standing view - a red block
// of two boxes of 4 m by 4 m, side by side, and a car; the two slices run clear of all that is
// drawn here. It is written as the pad writes a sketch: an Undo has this text, key for key.
const LEVEL = 22;
const lies = (column: number) => ({ x: [column, column + 8], y: [16, 24], z: [16, LEVEL] });
// Three colours by their places in the pad's list (paper.js), its names, what a swatch shows.
const [RED, GREEN, BLUE] = [1, 4, 6];
const NAMES = 'ink red orange yellow green teal blue purple pink brown grey'.split(' ');
const SHOWN = { red: 'rgb(217, 72, 43)', green: 'rgb(90, 158, 75)' } as const;
const SKETCH = {
  space: VERSION,
  things: [
    { ...lies(20), colour: RED, group: 1 },
    { ...lies(28), colour: RED, group: 1 },
    { kind: 'car', x: 62, y: 20, floor: LEVEL },
  ],
  floors: [],
  notes: [],
  on: { top: LEVEL, side: 44, end: 76 },
  show: { top: {} },
};
// The middle of each box of the block and of the car, and a place of the paper beside them all.
const AT = { block: [24, 20], second: [32, 20], car: [62.5, 20], beside: [45, 20] } as const;
/** What each box of the block says in the sketch, in a colour by its place in the list. */
const boxIn = (place: number): string => `"colour":${place},"group":1`;

/** The sketch that the browser keeps: as the text it is kept as, and the last of its things. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
const kept = async (page: Page): Promise<Sketch> => JSON.parse(await keptText(page)) as Sketch;
const last = async (page: Page): Promise<unknown> => (await kept(page)).things.at(-1);

/** Opens the top view of the pad with the test's own sketch in its store, and fails unless it is on the made-up plot: asked yes or no, before a matcher reads the page. It gives that sketch as the browser keeps it, and what is heard from before the page loads: every error, and every request to another origin. */
async function openPad(page: Page, baseURL: string | undefined): Promise<[string, string[]]> {
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
  return [await keptText(page), heard];
}

/** Where a part of the page lies, in pixels: its left edge, its top, how wide and how high. */
async function lying(part: Locator): Promise<Record<'x' | 'y' | 'width' | 'height', number>> {
  const box = await part.boundingBox();
  if (box === null) throw new Error('a part of the page is not seen');
  return box;
}

/** A drag with the tool that is on, from a place of the paper to another: a click, where the two are one. */
async function drag(page: Page, from: Place, to: Place = from): Promise<void> {
  await page.mouse.move(...(await placeOf(page, from)));
  await page.mouse.down();
  await page.mouse.move(...(await placeOf(page, to)), { steps: 4 });
  await page.mouse.up();
}

/** Waits until one thing of the toolbar shows pressed, and it is this one - by the name it is read out by: a tool by its word, a colour by its name. */
async function expectPressed(page: Page, name: string): Promise<void> {
  const pressed = `[...document.querySelectorAll('header [aria-pressed="true"]')]
    .map((one) => one.getAttribute('aria-label') ?? one.textContent.trim())`;
  await expect.poll(() => page.evaluate<string[]>(pressed), `${name}, alone`).toEqual([name]);
}

/** A colour by its name, in the toolbar's menu or in the colours of the swatch: it answers to its name in both while those are open. */
const colour = (page: Page, palette: '#colours' | '#swatch-palette', name: string): Locator =>
  page.locator(palette).getByRole('button', { name, exact: true });
/** A colour of the toolbar picked by its name: the arrow opens the menu, and the colour is clicked there. */
async function pick(page: Page, name: string): Promise<void> {
  await page.locator('#colours-open').click();
  await colour(page, '#colours', name).click();
}

/** The parts beside the paper: the pad's words of what is selected, the row of the swatch, the swatch, the name of its colour, and its colours. */
const beside = (page: Page) => ({
  words: page.locator('#picked'),
  row: page.locator('#selected > #swatch-row'),
  swatch: page.locator('#swatch-row > #swatch'),
  name: page.locator('#swatch-row > #swatch-name'),
  palette: page.locator('#swatch-row > #swatch-palette'),
});

test('a colour takes the Block tool and paints nothing', async ({ page, baseURL }) => {
  const [before, heard] = await openPad(page, baseURL);
  const { words, name } = beside(page);
  // The pad opens with Select, and no colour shows pressed. The red block is selected.
  await expectPressed(page, 'Select');
  await drag(page, AT.block);
  await expect(words).toContainText('Block of 2 boxes: a room, as it has no name.');
  // Blue, picked in the toolbar's menu: `#colour` shows it pressed, alone; nothing is painted.
  await pick(page, 'blue');
  await expectPressed(page, 'blue');
  expect(await keptText(page)).toBe(before);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  await expect(name).toHaveText('red');
  // A drag on the paper draws a block that says the place of blue: a storey high, six rows.
  await drag(page, [50.5, 30.5], [55.5, 35.5]);
  const drawn = { x: [50, 56], y: [30, 36], z: [LEVEL - 6, LEVEL], colour: BLUE };
  await expect.poll(() => last(page)).toEqual(drawn);

  // S: Select shows pressed, and no colour. The colour is remembered: a line drawn with L is
  // blue, and B takes Block in blue again.
  await page.keyboard.press('s');
  await expectPressed(page, 'Select');
  await expect(page.locator('#palette [aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.press('l');
  await drag(page, [58.2, 30.1], [64.1, 30.2]);
  const line = { view: 'top', at: LEVEL, line: [58, 30, 64, 30, BLUE] };
  await expect.poll(async () => (await kept(page)).notes).toEqual([line]);
  await page.keyboard.press('b');
  await expectPressed(page, 'blue');

  // A height takes Block too: with Select, 4.5 typed into the field - the colour picked last
  // shows pressed - and Enter, which gives the focus back: the next block is nine rows high.
  await page.keyboard.press('s');
  await expectPressed(page, 'Select');
  await page.locator('#high').selectText();
  await page.keyboard.type('4.5');
  await expectPressed(page, 'blue');
  await page.keyboard.press('Enter');
  await expect(page.locator('#high')).not.toBeFocused();
  await drag(page, [66.5, 30.5], [69.5, 33.5]);
  const higher = { x: [66, 70], y: [30, 34], z: [LEVEL - 9, LEVEL], colour: BLUE };
  await expect.poll(() => last(page)).toEqual(higher);
  // Nothing of all this painted the red block: both of its boxes say red.
  expect((await keptText(page)).split(boxIn(RED))).toHaveLength(3);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a pick of the swatch beside the paper paints the block', async ({ page, baseURL }) => {
  const [before, heard] = await openPad(page, baseURL);
  const { swatch, name, palette } = beside(page);
  // Blue is the colour that Block draws in; then Select again, and the red block is selected.
  await pick(page, 'blue');
  await page.keyboard.press('s');
  await drag(page, AT.second);
  // The swatch, right of the paper under the list of categories: in red, beside "red". It says
  // that its colours are shut, and they do not show.
  await expect(page.locator('#selected > #category-row + #swatch-row')).toBeVisible();
  await expect(swatch).toHaveCSS('background-color', SHOWN.red);
  await expect(name).toHaveText('red');
  await expect(swatch).toHaveAttribute('aria-expanded', 'false');
  await expect(palette).toBeHidden();
  const paper = await lying(page.locator('#paper'));
  // A click on it opens the colours: eleven, by their places and names in the list's order, the
  // first with the focus and red marked, not pressed; green answers here alone, the toolbar's shut.
  await swatch.click();
  await expect(swatch).toHaveAttribute('aria-expanded', 'true');
  const said = `[...document.querySelectorAll('#swatch-palette button')]
    .map((one) => one.dataset.colour + ' ' + one.getAttribute('aria-label'))`;
  expect(await page.evaluate<string[]>(said)).toEqual(NAMES.map((one, place) => `${place} ${one}`));
  for (const one of NAMES) await expect(colour(page, '#swatch-palette', one)).toBeVisible();
  await expect(page.getByRole('button', { name: 'green', exact: true })).toHaveCount(1);
  await expect(colour(page, '#swatch-palette', 'ink')).toBeFocused();
  await expect(palette.locator('[aria-current]')).toHaveAttribute('data-colour', String(RED));
  await expect(palette.locator('[aria-pressed]')).toHaveCount(0);
  // They lie under the swatch, inside the right side, and take no room: the paper lies where it lay.
  const [button, colours] = [await lying(swatch), await lying(palette)];
  const right = await lying(page.locator('#right'));
  expect(colours.y).toBeGreaterThanOrEqual(button.y + button.height);
  expect(colours.x).toBeGreaterThanOrEqual(right.x);
  expect(colours.x + colours.width).toBeLessThanOrEqual(right.x + right.width);
  expect(await lying(page.locator('#paper'))).toEqual(paper);

  // Green, picked: both boxes say the place of green, and nothing else of the text is another.
  // The colours are shut, the swatch is green and says so, and the block is selected still.
  await colour(page, '#swatch-palette', 'green').click();
  await expect(name).toHaveText('green');
  await expect(swatch).toHaveCSS('background-color', SHOWN.green);
  expect(before.split(boxIn(RED))).toHaveLength(3);
  const painted = before.replaceAll(boxIn(RED), boxIn(GREEN));
  expect(await keptText(page)).toBe(painted);
  await expect(palette).toBeHidden();
  await expect(swatch).toHaveAttribute('aria-expanded', 'false');
  // The focus is the page's, and the colour that Block draws in is what it was: B takes Block
  // in blue, and a block drawn now says the place of blue.
  await page.keyboard.press('b');
  await expectPressed(page, 'blue');
  await drag(page, [50.5, 30.5], [55.5, 35.5]);
  await expect.poll(() => last(page)).toMatchObject({ colour: BLUE });
  // Undo: the block that was drawn goes, and the red block is green still. Undo again: red.
  await page.keyboard.press('Control+z');
  await expect.poll(() => keptText(page)).toBe(painted);
  await page.keyboard.press('Control+z');
  await expect.poll(() => keptText(page)).toBe(before);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('the colours have the keys, and shut with nothing painted', async ({ page, baseURL }) => {
  const [before, heard] = await openPad(page, baseURL);
  const { words, row, swatch, name, palette } = beside(page);
  // The block is selected and stepped with C to a room set by hand: a step to undo.
  await drag(page, AT.block);
  await page.keyboard.press('c');
  await expect(words).toContainText('Block of 2 boxes: a room, set by hand.');
  const stepped = await keptText(page);
  expect(stepped === before, 'C changed nothing').toBe(false);
  // Open, no key is the page's: B and O take no tool, 2 goes to no view, K gives the list of
  // categories no focus, C steps nothing and Ctrl+Z undoes nothing.
  await swatch.click();
  await expect(palette).toBeVisible();
  for (const key of ['b', 'o', '2', 'k', 'c', 'Control+z']) await page.keyboard.press(key);
  await expectPressed(page, 'Select');
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expect(colour(page, '#swatch-palette', 'ink')).toBeFocused();
  expect(await keptText(page)).toBe(stepped);
  // Escape shuts them, gives the swatch the focus and ends there: nothing is painted, and the
  // block is selected still. Shut, a key is the page's again: Ctrl+Z takes the step back.
  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();
  await expect(swatch).toBeFocused();
  await expect(words).toContainText('a room, set by hand');
  await expect(name).toHaveText('red');
  expect(await keptText(page)).toBe(stepped);
  await page.keyboard.press('Control+z');
  await expect.poll(() => keptText(page)).toBe(before);
  // Open again, and a click on the paper beside the block: shut, and nothing painted. The click
  // is the paper's too: with Select nothing lies there, so nothing is selected - no swatch.
  await drag(page, AT.block);
  await swatch.click();
  await expect(palette).toBeVisible();
  await drag(page, AT.beside);
  await expect(palette).toBeHidden();
  await expect(row).toBeHidden();
  await expect(page.locator('#none-picked')).toBeVisible();
  // The car: the pad's words of it, and no swatch. The block by its other box: the swatch. And
  // Escape, which is the page's now: nothing is selected, and there is no swatch.
  await drag(page, AT.car);
  await expect(words).toContainText('Car: 4.5 m by 2 m, 1.5 m high');
  await expect(row).toBeHidden();
  await drag(page, AT.second);
  await expect(row).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(words).toBeHidden();
  await expect(row).toBeHidden();
  expect(await keptText(page)).toBe(before);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('with every tool, one thing of the toolbar shows pressed', async ({ page, baseURL }) => {
  const [before, heard] = await openPad(page, baseURL);
  // There is no Block button. By its key, Block shows as the colour it draws in: red at first.
  await expect(page.locator('[data-tool="block"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Block', exact: true })).toHaveCount(0);
  const KEYS = { b: 'red', s: 'Select', g: 'Merge', o: 'Person', l: 'Line', t: 'Label' };
  for (const [key, shows] of Object.entries({ ...KEYS, e: 'Erase', m: 'Select', B: 'red' })) {
    await page.keyboard.press(key);
    await expectPressed(page, shows);
  }
  // By its button - Object's says its object, a person; and Block by its menu's eleven, to grey.
  for (const word of ['Select', 'Merge', 'Line', 'Label', 'Erase', 'Person']) {
    await page.locator('header').getByRole('button', { name: word, exact: true }).click();
    await expectPressed(page, word);
  }
  for (const one of NAMES) {
    await pick(page, one);
    await expectPressed(page, one);
  }
  // The tab keeps the tool and its colour: loaded anew, grey shows pressed, alone.
  await page.reload();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expectPressed(page, 'grey');
  expect(await keptText(page)).toBe(before);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
