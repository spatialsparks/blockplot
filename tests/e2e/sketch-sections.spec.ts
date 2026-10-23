import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { pixelOf, placeOf } from './sketch-paper';

// The sections beside the paper, end to end, on the made-up plot with the made-up sketch (story
// ST-032, task T-032.4): what the owner does. Left of the paper, under the levels or the slice,
// "Sections" - in each of the five views, with "New section" and no row at first. A section is
// made and named - a name that is taken, an empty one and one of 61 characters are refused in
// the model's words, in the alarm - and is picked: its row shows pressed, and nothing of the
// toolbar does. It is filled by a click on a block, emptied by a second, filled by a box;
// meanwhile a block that is not of it is paler on the paper, and one of it as it was. Each step
// is undone and done again. Escape, another tool, a colour and O end the pick, and a click is
// then that tool's. What a row does besides is sketch-sections-steps.spec.ts's. `pnpm sketch
// --demo` serves the pad on the made-up plot: the real plot is in no part of this run, and a
// case asks yes or no whether its page is on the made-up plot before a matcher reads that page
// (directive 34).

const HOUSE = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// Places of the made-up house on the level at 817 m, which the file opens on: in the night
// rooms, clear of what stands in them; in the roof terrace; and beside it all. And the five
// views, and whether each looks from above.
type Place = readonly [column: number, row: number];
const AT = { night: [32.5, 31.5], terrace: [48.5, 36.5], beside: [10.5, 40.5] } as const;
const VIEWS = [
  ['top', true],
  ['side', false],
  ['far', false],
  ['front', false],
  ['back', false],
] as const;
// The model's sentences for a name that is taken, one of nothing and one of 61 characters.
const TAKEN = 'There is a section "Upper home" already.';
const EMPTY = 'A section needs a name.';
const LONG = "A section's name has 60 characters at the most: this one has 61.";

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

/** Opens a page of the pad with the made-up sketch in its store - put there once - and fails unless it is on the made-up plot: asked yes or no, before a matcher reads the page. */
async function openPad(page: Page, address = '/#top'): Promise<void> {
  const seed = `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${JSON.stringify(HOUSE)});`;
  await page.addInitScript(seed);
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await page.waitForLoadState('load');
}

/** The sketch that the browser keeps, as the text it is kept as. */
const kept = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
/** The same with these sections, and the blocks of these names in them - as the pad writes it. */
function housed(sections: unknown[], of: Record<string, number>): string {
  const doc = JSON.parse(HOUSE) as { things: Record<string, unknown>[] };
  for (const thing of doc.things) {
    if (typeof thing['name'] === 'string' && thing['name'] in of)
      thing['section'] = of[thing['name']];
  }
  return JSON.stringify({ ...doc, sections });
}

/** A place of the paper in the page, in pixels (sketch-paper.ts). */
const onPage = placeOf;
/** A drag on the paper with the tool that is on, from a place to another: a click, where the two are one. */
async function drag(page: Page, from: Place, to: Place = from): Promise<void> {
  await page.mouse.move(...(await onPage(page, from)));
  await page.mouse.down();
  await page.mouse.move(...(await onPage(page, to)), { steps: 4 });
  await page.mouse.up();
}
/** The colour of the paper's picture in the middle of a place, its red, green and blue. */
const colourAt = async (page: Page, place: Place): Promise<number[]> => {
  const at = await pixelOf(page, place);
  return page.evaluate<number[]>(`(() => {
    const canvas = document.getElementById('paper');
    return [...canvas.getContext('2d').getImageData(${at[0]}, ${at[1]}, 1, 1).data].slice(0, 3);
  })()`);
};
const lightOf = async (page: Page, place: Place): Promise<number> =>
  (await colourAt(page, place)).reduce((sum, one) => sum + one, 0);

/** "New section", and the name typed into its question - or the question put away. */
async function make(page: Page, name: string | null): Promise<void> {
  page.once('dialog', (dialog) => void (name === null ? dialog.dismiss() : dialog.accept(name)));
  await page.locator('#section-add').click();
}
/** A section's row, by its place in the list: its name, its switch, and what it holds. */
function row(page: Page, place: number): Record<'name' | 'switch' | 'holds', Locator> {
  const item = page.locator('#sections > li').nth(place);
  return {
    name: item.locator('button').first(),
    switch: item.locator('button').nth(1),
    holds: item.locator('small'),
  };
}
/** What of the toolbar, and of the list, shows pressed. */
const pressed = (page: Page, part: string): Locator =>
  page.locator(`${part} [aria-pressed="true"]`);
/** Undo, then Redo: the kept sketch is the text of before the step, and then the one after. */
async function undoAndRedo(page: Page, before: string, after: string): Promise<void> {
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(before);
  await page.keyboard.press('Control+y');
  await expect.poll(() => kept(page)).toBe(after);
}

test('in each of the five views "Sections" stands under the levels or the slice and over the hint, with "New section" and no row', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  const LEFT = `[...document.getElementById('left').children].map((one) => one.id)`;
  /** Where a part reaches on the page, from its top to its foot, in pixels. */
  const span = async (part: string): Promise<number[]> => {
    const box = await page.locator(part).boundingBox();
    return [box?.y ?? NaN, (box?.y ?? NaN) + (box?.height ?? NaN)];
  };
  for (const [view, above] of VIEWS) {
    // Each view a page of its own: the pad's two addresses by turns, for a hash alone is no load.
    await openPad(page, `${view === 'side' || view === 'front' ? '/index.html' : '/'}#${view}`);
    // The parts of the left side, in their order: the levels' and the slice's, then the
    // sections', then the hint of the layers.
    expect(await page.evaluate<string[]>(LEFT), view).toEqual([
      ...['layers-title', 'level-tools', 'layers', 'every-lines', 'cut-tools'],
      ...['sections-title', 'section-tools', 'sections', 'sections-hint', 'layers-hint'],
    ]);
    // It stands under what shows of the levels or the slice, and the hint of the layers under it.
    await expect(page.locator(above ? '#layers' : '#cut-tools')).toBeVisible();
    const [, foot = NaN] = await span(above ? '#layers' : '#cut-tools');
    const [[heading = NaN], [hint = NaN]] = [
      await span('#sections-title'),
      await span('#layers-hint'),
    ];
    expect([heading >= foot, hint > heading], view).toEqual([true, true]);
    await expect(page.locator('#sections-title')).toHaveText('Sections');
    await expect(page.locator('#section-add')).toHaveText('New section');
    await expect(page.locator('#section-add')).toBeVisible();
    for (const id of ['#section-rename', '#section-remove'])
      await expect(page.locator(id)).toBeHidden();
    await expect(page.locator('#sections > li')).toHaveCount(0);
    await expect(page.locator('#sections-hint')).toContainText(
      'second click on a block takes it out',
    );
  }
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a section is made and named - a name taken, empty or too long refused in words - picked, and filled by clicks and by a box; each step undone and done again', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  expect(await kept(page)).toBe(HOUSE);
  // The paper with no section picked: a place of the night rooms, and one of the roof terrace.
  const plain = { night: await colourAt(page, AT.night), terrace: await lightOf(page, AT.terrace) };

  // Made and named: its row, picked - pressed - and nothing of the toolbar pressed. Undo and Redo.
  const upper = row(page, 0);
  const MADE = housed([{ id: 1, name: 'Upper home' }], {});
  await make(page, 'Upper home');
  await expect(upper.name).toHaveText('Upper home');
  await expect(upper.name).toHaveAttribute('aria-pressed', 'true');
  await expect(upper.switch).toHaveText('shown');
  await expect(upper.holds).toHaveText('no block yet');
  await expect(pressed(page, 'header')).toHaveCount(0);
  await expect.poll(() => kept(page)).toBe(MADE);
  await undoAndRedo(page, HOUSE, MADE);
  // Redo has it back, and not picked: a click on its name picks it again.
  await expect(pressed(page, '#sections')).toHaveCount(0);
  await upper.name.click();
  await expect(upper.name).toHaveAttribute('aria-pressed', 'true');
  await expect(pressed(page, 'header')).toHaveCount(0);

  // A name that is taken, one of nothing and one of 61 characters are refused in the model's
  // words; a question put away is nothing. The section stays picked.
  await make(page, 'upper HOME');
  await expect(page.locator('#alarm')).toHaveText(TAKEN);
  await make(page, '');
  await expect(page.locator('#alarm')).toHaveText(EMPTY);
  await make(page, 'x'.repeat(61));
  await expect(page.locator('#alarm')).toHaveText(LONG);
  await make(page, null);
  await expect(page.locator('#sections > li')).toHaveCount(1);
  expect(await kept(page)).toBe(MADE);
  await expect(upper.name).toHaveAttribute('aria-pressed', 'true');

  // A click on the night rooms: both their boxes are in it, in one step. The roof terrace, which
  // is not of it, is paler than with no section picked, and the night rooms are as they were.
  const NIGHT = housed([{ id: 1, name: 'Upper home' }], { 'Night rooms': 1 });
  await drag(page, AT.night);
  await expect(upper.holds).toHaveText('1 block');
  await expect.poll(() => kept(page)).toBe(NIGHT);
  await expect(page.locator('#alarm')).toBeEmpty();
  await expect.poll(() => lightOf(page, AT.terrace)).toBeGreaterThan(plain.terrace);
  await expect.poll(() => colourAt(page, AT.night)).toEqual(plain.night);
  await undoAndRedo(page, MADE, NIGHT);
  // A second click takes them out again: the text of before.
  await drag(page, AT.night);
  await expect(upper.holds).toHaveText('no block yet');
  await expect.poll(() => kept(page)).toBe(MADE);
  await undoAndRedo(page, NIGHT, MADE);
  // A box over the upper floor: its three blocks, in one step - its `id` on the four boxes.
  const FILLED = housed([{ id: 1, name: 'Upper home' }], {
    'Night rooms': 1,
    Bath: 1,
    'Roof terrace': 1,
  });
  await drag(page, [29.5, 21.5], [50.5, 38.5]);
  await expect(upper.holds).toHaveText('3 blocks');
  await expect.poll(() => kept(page)).toBe(FILLED);
  expect(FILLED.split('"section":1').length - 1).toBe(4);
  await undoAndRedo(page, MADE, FILLED);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('Escape, another tool, a colour and O each end the pick, and a click on the paper is then that tool’s', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  await make(page, 'Upper home');
  const MADE = housed([{ id: 1, name: 'Upper home' }], {});
  await expect.poll(() => kept(page)).toBe(MADE);
  const { name } = row(page, 0);
  const things = async (): Promise<Record<string, unknown>[]> =>
    (JSON.parse(await kept(page)) as { things: Record<string, unknown>[] }).things;
  /** The section picked - by a click on its name, where it is not picked - then this ended it: no row shows pressed, and the toolbar shows what is named. */
  async function ends(end: () => Promise<void>, shows: string): Promise<void> {
    if ((await name.getAttribute('aria-pressed')) !== 'true') await name.click();
    await expect(name).toHaveAttribute('aria-pressed', 'true');
    await expect(pressed(page, 'header')).toHaveCount(0);
    await end();
    await expect(pressed(page, '#sections')).toHaveCount(0);
    const said = `[...document.querySelectorAll('header [aria-pressed="true"]')].map((one) => one.getAttribute('aria-label') ?? one.textContent.trim())`;
    await expect.poll(() => page.evaluate<string[]>(said)).toEqual([shows]);
  }

  // Escape: Select, and a click on the night rooms selects them - and puts them in no section.
  await ends(() => page.keyboard.press('Escape'), 'Select');
  await drag(page, AT.night);
  await expect(page.locator('#picked')).toContainText('Night rooms');
  expect(await kept(page)).toBe(MADE);
  // Another tool, Erase: a click on the roof terrace takes it away. Undo has it back.
  await ends(() => page.locator('[data-tool="erase"]').click(), 'Erase');
  await drag(page, AT.terrace);
  await expect.poll(() => kept(page)).not.toContain('Roof terrace');
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(MADE);
  // A colour, blue: the Block tool, and a click beside it all draws a block in blue.
  await ends(async () => {
    await page.locator('#colours-open').click();
    await page.locator('#colours [aria-label="blue"]').click();
  }, 'blue');
  await drag(page, AT.beside);
  await expect.poll(async () => (await things()).at(-1)).toMatchObject({ colour: 6 });
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(MADE);
  // O: the Object tool, and a click sets a person down.
  await ends(() => page.keyboard.press('o'), 'Person');
  await drag(page, AT.beside);
  await expect.poll(async () => (await things()).at(-1)).toMatchObject({ kind: 'person' });
  await page.keyboard.press('Control+z');
  await expect.poll(() => kept(page)).toBe(MADE);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
