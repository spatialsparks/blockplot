import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';

// Settings of the pad's 3D page, end to end, on the made-up plot with the made-up sketch: the
// eight figures of the house, each with its words, its range and "Default"; a figure typed, drawn
// at once and kept in the sketch - `figures`, and nothing else - through a reload, into the file
// that "Save file" saves in the top view of the same tab, and taken back by the pad's Undo; what
// is refused, beside its field; a key typed into a field, which is no view's and steps no level;
// a figure set and a block drawn in another window; a page that was never told of either; and a
// sketch that cannot be read, over which nothing is written. No Settings where there is no
// stage: sketch-3d-controls.spec.ts. What they take of the stage while they are open, and that
// it has it back: sketch-3d-header.spec.ts. `pnpm sketch --demo` serves the pad on its made-up
// plot, and the real plot is in no part of this run: a case asks yes or no whether its page is
// on the made-up plot, before a matcher reads that page (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so there are no Settings';
const THINGS = (JSON.parse(SKETCH) as { things: unknown[] }).things.length;
const SOLIDS = THINGS - 2; // The last two of its things, ground and a cut, are no solids.
/** A sketch with these figures, as the pad writes it: `figures` last, and nothing else changed. */
const figured = (sketch: string, figures: object): string =>
  `${sketch.slice(0, -1)},"figures":${JSON.stringify(figures)}}`;
// A block of the test's own beside the made-up house, as another window draws one; and a text
// that the pad cannot read as a sketch: it holds a kind that no pad knows.
const BLOCK = { x: [60, 66], y: [24, 30], z: [18, 24], colour: 3, name: 'Drawn elsewhere' };
const UNREAD = `{"space":3,"things":[{"kind":"unicorn","x":1,"y":1,"floor":"ground"}],"floors":[],"notes":[]}`;
// What Settings say of each figure, by hand (story ST-024, rule 2): its words, its range, and
// the default that its field says of a sketch that says nothing.
const LISTED = [
  ['How thick an outer wall is', 'from 0.1 to 0.8 m', '0.4'],
  ['How thick an inner wall is', 'from 0.05 to 0.5 m', '0.2'],
  ['How thick a floor is', 'from 0.1 to 0.6 m', '0.3'],
  ['How thick a roof is', 'from 0.1 to 0.8 m', '0.3'],
  ['How high a railing is', 'from 0.5 to 1.5 m', '1'],
  ["How high a door's opening is", 'from 1.8 to 2.6 m', '2.1'],
  ['How high a window is', 'from 0.3 to 2.5 m', '1.5'],
  ["How high a window's sill lies over the floor", 'from 0 to 1.5 m', '0.9'],
] as const;
// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A page that hears of no change from another window: the browser's word of one stops here.
const DEAF = `addEventListener('storage', (event) => event.stopImmediatePropagation(), true)`;
// What every field says; and which take nothing, of every field and "Default" or of some.
const SAID = `[...document.querySelectorAll('#figures input')].map((field) => field.value)`;
const off = (page: Page, which = '#figures input, #figures button'): Promise<boolean[]> =>
  page.evaluate<boolean[]>(`[...document.querySelectorAll('${which}')].map((one) => one.disabled)`);

// Every case opens in a tab that has the made-up sketch in the pad's store: put there once, so
// that a page which wrote over it is not hidden by the next load.
test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** Opens a page of the pad, fails unless it is on the made-up plot - asked yes or no, before any matcher reads it - and says whether a stage is drawn there. */
async function open(page: Page, address = '/3d.html'): Promise<boolean> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  if (address !== '/3d.html') return false;
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}
/** Over when the page is in front and the browser has shown it some frames more: what it was told by then, it has drawn. */
async function shown(page: Page): Promise<void> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
}
/** The stage as it shows once it has been drawn. */
const picture = (page: Page): Promise<Buffer> =>
  shown(page).then(() => page.locator('#stage canvas').screenshot());
/** What the browser keeps as the sketch, as it is kept. */
const kept = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${JSON.stringify(KEY)})`);
/** Settings, opened by their button: found by its word alone, as a look finds it. */
const settings = (page: Page): Promise<void> => page.locator('text=Settings').click();
/** A figure's row of Settings: its field, its "Default", and what is said beside it. */
function row(page: Page, name: string): Record<'field' | 'back' | 'refused', Locator> {
  const line = page.locator(`#figures li[data-figure="${name}"]`);
  const [field, back] = [line.locator('input'), line.getByRole('button')];
  return { field, back, refused: line.locator('.refused') };
}

test('a figure typed is drawn and kept at once, and what is refused changes nothing', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  test.skip(!(await open(page)), NO_STAGE);
  // Closed as the page opens, and opened by the one thing of the page that says "Settings".
  await expect(page.locator('text=Settings')).toHaveCount(1);
  await expect(page.locator('#settings')).toBeHidden();
  await settings(page);
  await expect(page.locator('#settings-open')).toHaveAttribute('aria-expanded', 'true');
  // Eight figures: the words of each, its unit, its range, and its default in its field - with
  // "Default" off, for every figure of this sketch is its default.
  const rows = page.locator('#figures li');
  await expect(rows.locator('label')).toHaveText(LISTED.map(([words]) => words));
  await expect(rows.locator('.group span')).toHaveText(LISTED.map(() => 'm'));
  await expect(rows.locator('small:not(.refused)')).toHaveText(LISTED.map(([, range]) => range));
  await expect(rows.getByRole('button')).toHaveText(LISTED.map(() => 'Default'));
  expect(await page.evaluate<string[]>(SAID)).toEqual(LISTED.map(([, , usual]) => usual));
  expect(await off(page, '#figures button')).toEqual(LISTED.map(() => true));

  // White, from above, a level down: the upper storey is open, and its walls show how thick
  // they are. A mark is set that a page loaded anew would not have.
  await page.locator('button[data-way=white]').click();
  await page.locator('#stands [data-stand="above"]').click();
  await page.keyboard.press('PageDown');
  await expect(page.locator('body')).toHaveAttribute('data-level', '817');
  const thick = await picture(page);
  await page.evaluate('globalThis.stayed = true');

  // The outer walls from 0.4 m to 0.3 m, a key at a time. "0" is no outer wall: it is refused
  // beside the field, in words that name the range, and nothing is written. "0.3" is one: the
  // sketch that the browser keeps has it at once, as its `figures`, and is else what it was.
  const outer = row(page, 'outerWallM');
  await outer.field.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('0');
  const WALL = 'How thick an outer wall is: a number from 0.1 to 0.8 m.';
  await expect(outer.refused).toHaveText(`${WALL} 0 m is too little.`);
  expect(await kept(page)).toBe(SKETCH);
  await page.keyboard.type('.3');
  await expect(outer.refused).toBeEmpty();
  expect(await kept(page)).toBe(figured(SKETCH, { outerWallM: 0.3 }));
  // Its "Default" is on now, and no other. And the house is drawn with it, with no reload.
  expect(await off(page, '#figures button')).toEqual(LISTED.map((_, at) => at > 0));
  expect((await picture(page)).equals(thick), 'the walls are as thick as before').toBe(false);
  expect(await page.evaluate<unknown>('globalThis.stayed'), 'the page loaded anew').toBe(true);

  // "Default" leaves the sketch without the figure: byte for byte what it was before Settings
  // were touched - and the house is the house it was, to the pixel.
  await outer.back.click();
  expect(await kept(page)).toBe(SKETCH);
  await expect(outer.field).toHaveValue('0.4');
  await expect(outer.back).toBeDisabled();
  expect((await picture(page)).equals(thick), 'the house is not as it was').toBe(true);

  // A railing of five metres, one below its range, and no number: each is refused beside the
  // field, in words that name the range; nothing is written, and the house stays.
  const railing = row(page, 'railingHighM');
  const RAILING = 'How high a railing is: a number from 0.5 to 1.5 m.';
  const REFUSED = ['5 m is too much.', '0.2 m is too little.', '"high" is none.'];
  for (const [at, text] of ['5', '0.2', 'high'].entries()) {
    await railing.field.fill(text);
    await expect(railing.refused).toHaveText(`${RAILING} ${REFUSED[at]}`);
    expect(await kept(page)).toBe(SKETCH);
  }
  expect((await picture(page)).equals(thick), 'a refused figure was drawn').toBe(true);
  // Left, the field says the last good figure again, and the words beside it still say why.
  await railing.field.press('Enter');
  await expect(railing.field).toHaveValue('1');
  await expect(railing.refused).toHaveText(`${RAILING} "high" is none.`);
  expect(errors).toEqual([]);
});

test('a figure is there after a reload, in the file the top view saves, and for its Undo', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  const FIGURED = figured(SKETCH, { outerWallM: 0.3 });
  const outer = row(page, 'outerWallM');
  await settings(page);
  await outer.field.fill('0.3');
  expect(await kept(page)).toBe(FIGURED);
  // After a reload the field says the changed figure, and its "Default" is on.
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-stage', 'drawn');
  await settings(page);
  await expect(outer.field).toHaveValue('0.3');
  await expect(outer.back).toBeEnabled();
  // "Save file" in the top view of the same tab saves that sketch: the figure, and all else.
  await page.getByRole('link', { name: 'Top view' }).click();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const saving = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save file' }).click();
  const download = await saving;
  expect(readFileSync(await download.path(), 'utf8')).toBe(FIGURED);
  // And the figure is a step of the pad's: its Undo takes it back, and nothing else.
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await kept(page)).toBe(SKETCH);
  await page.keyboard.press('6');
  await expect(page).toHaveTitle('3D — sketch pad');
  await settings(page);
  await expect(outer.field).toHaveValue('0.4');
});

test('a figure and a Page Down typed into a field go to no view and step no level', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  const [body, door] = [page.locator('body'), row(page, 'doorHighM')];
  await settings(page);
  await page.evaluate('globalThis.stayed = true');
  await door.field.click();
  await page.keyboard.press('End');
  // The 1 of "2.1" taken away leaves "2.": a door of 2 m, kept at once - and the field keeps its
  // point. "4", the front view's key, is a door of 2.4 m here; "v", the next view's, no number.
  await page.keyboard.press('Backspace');
  expect(await kept(page)).toBe(figured(SKETCH, { doorHighM: 2 }));
  await expect(door.field).toHaveValue('2.');
  await page.keyboard.press('4');
  expect(await kept(page)).toBe(figured(SKETCH, { doorHighM: 2.4 }));
  await page.keyboard.press('v');
  await expect(door.refused).toHaveText(/a number from 1\.8 to 2\.6 m\. "2\.4v" is none\.$/);
  // Page Down and Page Up are the field's too: the house stays whole.
  for (const key of ['PageDown', 'PageDown', 'PageUp']) await page.keyboard.press(key);
  await expect(body).toHaveAttribute('data-level', 'all');
  // Enter gives the keys back: the field says the sketch's figure, and Page Down steps a level.
  await page.keyboard.press('Enter');
  await expect(door.field).toHaveValue('2.4');
  await page.keyboard.press('PageDown');
  await expect(body).toHaveAttribute('data-level', '817');
  expect(await page.evaluate<unknown>('globalThis.stayed'), 'the page went to a view').toBe(true);
});

test('a figure set and a block drawn in another window are here at once, and stay', async ({
  page,
  context,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  await page.locator('button[data-way=white]').click();
  const pane = row(page, 'windowHighM');
  await settings(page);
  // A window of 1.2 m, typed here, and the stage as it shows it. Then the pad, in another window,
  // sets that figure by its own scripts and keeps it as it keeps a stroke: the field here says
  // it all the same, and the night rooms' window is drawn 0.6 m high - no longer the 1.2 m.
  await pane.field.fill('1.2');
  const [typed, pad] = [await picture(page), await context.newPage()];
  await open(pad, '/#top');
  await pad.evaluate(`sketch.change((doc) => figures.set(doc, 'windowHighM', 0.6))`);
  await expect(pane.field).toHaveValue('0.6');
  await expect(pane.back).toBeEnabled();
  expect((await picture(page)).equals(typed), 'the windows are as high as before').toBe(false);
  // Then a block is drawn there, while Settings are open here. The next figure that is typed
  // here is written into the sketch with the block, and with the other window's figure.
  await pad.evaluate(`sketch.change((doc) => doc.things.push(${JSON.stringify(BLOCK)}))`);
  await expect(page.locator('body')).toHaveAttribute('data-solids', String(SOLIDS + 1));
  await row(page, 'doorHighM').field.fill('2.4');
  const now = JSON.parse(await kept(page)) as { things: unknown[]; figures: unknown };
  expect(now.things.at(-1)).toEqual(BLOCK);
  expect(now.figures).toEqual({ doorHighM: 2.4, windowHighM: 0.6 });
});

test('a page that was never told writes into the newest drawing, and over no sketch that cannot be read', async ({
  page,
  context,
}) => {
  await page.addInitScript(DEAF);
  test.skip(!(await open(page)), NO_STAGE);
  await settings(page);
  const [body, floor] = [page.locator('body'), row(page, 'floorSlabM')];
  const pad = await context.newPage();
  await open(pad, '/#top');
  // Another window draws a block, and this page does not hear of it: it shows the house of before.
  // The figure typed here is written into the newer sketch, block and all - and then shown.
  await pad.evaluate(`sketch.change((doc) => doc.things.push(${JSON.stringify(BLOCK)}))`);
  await shown(page);
  await expect(body).toHaveAttribute('data-solids', String(SOLIDS));
  await floor.field.fill('0.25');
  const now = JSON.parse(await kept(page)) as { things: unknown[]; figures: unknown };
  expect([now.things.length, now.things.at(-1)]).toEqual([THINGS + 1, BLOCK]);
  expect(now.figures).toEqual({ floorSlabM: 0.25 });
  await expect(body).toHaveAttribute('data-solids', String(SOLIDS + 1));
  // Then the other window keeps what no pad can read. A figure typed here writes nothing over it
  // and sets nothing aside; it is said why, once, over the fields, which take nothing from then on.
  const locked = async (): Promise<void> => {
    await expect(page.locator('#settings-said')).toHaveText(/^No figure can be changed here: /);
    expect(await off(page)).toEqual(Array(16).fill(true));
    expect(await kept(page)).toBe(UNREAD);
    expect(await page.evaluate<string[]>('Object.keys(localStorage)')).toEqual([KEY]);
  };
  await pad.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(UNREAD)})`);
  await floor.field.fill('0.2');
  await locked();
  await expect(floor.refused).toBeEmpty();
  // So it is where the page opens on such a text: every field says the default of its figure.
  await page.reload();
  await expect(body).toHaveAttribute('data-stage', 'drawn');
  await settings(page);
  await locked();
  expect(await page.evaluate<string[]>(SAID)).toEqual(LISTED.map(([, , usual]) => usual));
});
