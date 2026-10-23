import { expect, test, type Locator, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { pixelOf, placeOf, scaleOf } from './sketch-paper';

// The list of categories beside the paper, end to end, on the made-up plot (story ST-028): what
// the owner does. From above, with Select: a block is selected, and under the pad's words of it
// stands a list - at its first entry, which reads what the block's name gives, until a category
// is picked for it - over a sentence that says which category the block has, and by what. A
// pick is in the sketch that the browser keeps, in the pad's words, and on the paper where the
// block has no name; the next key is a tool's; Undo takes the pick back. A pick takes away what
// C had set, and the first entry the pick. K takes the focus to the list, Escape gives it back.
// The sketch is this test's own, so that it holds whatever the made-up house gains. `pnpm sketch
// --demo` serves the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part
// of this run, and a case asks yes or no whether its page is on the made-up plot before a
// matcher reads that page (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// A place of the top view's paper, which is not shown from behind (sketch-paper.ts).
type Place = readonly [column: number, row: number];

// THE SKETCH: on one level, at 815 m - row 22 of a standing view - three blocks of 4 m by 4 m in
// rows 16 to 24 of the top view, and a car. The first block has no name; the second is a
// kitchen by its name; the name of the third holds no word of the list. The two slices run
// clear of them all. It is written as the pad writes a sketch, key for key: so the text that
// the browser keeps after an Undo is this text.
const LEVEL = 22;
const lies = (column: number) => ({ x: [column, column + 8], y: [16, 24], z: [16, LEVEL] });
const SKETCH = {
  space: VERSION,
  things: [
    { ...lies(20), colour: 1 },
    { ...lies(32), colour: 1, name: 'Kitchen / Dining' },
    { ...lies(44), colour: 1, name: 'Day rooms' },
    { kind: 'car', x: 62, y: 20, floor: LEVEL },
  ],
  floors: [],
  notes: [],
  on: { top: LEVEL, side: 40, end: 76 },
  show: { top: {} },
};
// The middle of each block, and of the car: 4.5 m by 2 m, it lies on columns 58 to 67.
const AT = { bare: [24, 20], kitchen: [36, 20], day: [48, 20], car: [62.5, 20] } as const;
const NO_NAME = 'Block: a room, as it has no name.';
// What a box says in the sketch once a Bathroom is picked for its block.
const BATHROOM = '"category":"bathroom"';
// A word on a block is more ink than this (`ink`): "Bathroom" is 44 pixels at 8 a cell, and no word is none.
const INK_OF_A_WORD = 10;

/** Every error of the console and every error no script caught, and every request to another origin: heard from before the page loads. */
function watch(page: Page, baseURL: string | undefined): string[] {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => {
    if (message.type() === 'error') heard.push(message.text());
  });
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Waits until the page is the top view of the pad, loaded, and fails unless it is on the made-up plot: asked yes or no, before a matcher reads the page. */
async function expectPad(page: Page): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.waitForLoadState('load');
}

/** Opens the top view of the pad with the test's own sketch in its store - put there once: what the pad keeps after it stays through a reload. */
async function openPad(page: Page): Promise<void> {
  const own = JSON.stringify(JSON.stringify(SKETCH));
  const seed = `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${own});`;
  await page.addInitScript(seed);
  await page.goto('/#top');
  await expectPad(page);
}

/** The sketch that the browser keeps, as the text it is kept as - and the first of its things, read: the block without a name. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);
const box = async (page: Page): Promise<unknown> =>
  (JSON.parse(await keptText(page)) as { things: unknown[] }).things[0];

/** A click on a place of the paper, with the tool that is on: with Select, what lies there is selected. */
async function click(page: Page, place: Place): Promise<void> {
  await page.mouse.click(...(await placeOf(page, place)));
}

/**
 * How much ink the paper's picture has about a place: of a strip three cells to either side of it
 * and one cell high, the pixels whose red, green and blue are under 400 together - the ink has
 * 123, the colour of these blocks 505, a line of the grid over it more. A word written there is
 * ink - and so is the label of what is selected: a case looks with nothing selected.
 */
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

/** What has the focus, by its tag: BODY, where the focus is the page's. */
const focus = (page: Page): Promise<string> =>
  page.evaluate<string>('document.activeElement?.tagName ?? "nothing"');

/** The parts beside the paper: the pad's words of what is selected, the row of the list, the list, its first entry, and the sentence under it. */
function beside(page: Page): Record<'words' | 'row' | 'list' | 'first' | 'said', Locator> {
  const list = page.locator('#category');
  return {
    words: page.locator('#picked'),
    row: page.locator('#picked + #category-row'),
    list,
    first: list.locator('option').first(),
    said: page.locator('#category-row > #category + #category-said'),
  };
}

/** A category picked as a person picks one: the list has the focus, and then stands at the entry of that word - at its first entry, for no word. */
async function pick(list: Locator, key: string): Promise<void> {
  await list.focus();
  await list.selectOption(key === '' ? { index: 0 } : key);
}

test('beside the paper a list says what the selected block is, and by what; of an object and of nothing there is none', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  const { words, row, list, first, said } = beside(page);

  // Nothing is selected: no list, and K changes nothing - the focus stays the page's.
  const before = await keptText(page);
  await expect(row).toBeHidden();
  await page.keyboard.press('k');
  await expect(row).toBeHidden();
  expect([await focus(page), await keptText(page)]).toEqual(['BODY', before]);

  // The block named "Kitchen / Dining": under the pad's words the list, at its first entry, which
  // reads what the name gives, and the sentence. The list: that entry, and thirty in five groups.
  await click(page, AT.kitchen);
  await expect(words).toContainText('Kitchen / Dining: a room, by its name.');
  await expect(row).toBeVisible();
  await expect(list).toHaveValue('');
  await expect(first).toHaveText('By its name: Kitchen');
  await expect(said).toHaveText('Category: Kitchen, by its name.');
  await expect(list).toHaveAttribute('title', /category of the selected block.+\(K\)$/);
  const groups = await page.evaluate<string[]>(`[...document.querySelectorAll('#category optgroup')]
    .map((group) => group.label + ': ' + group.querySelectorAll('option').length)`);
  expect(groups).toEqual(['A room: 22', 'Open air: 5', 'Glass: 1', 'Ground: 1', 'A cut: 1']);
  await expect(list.locator('option')).toHaveCount(31);

  // The block named "Day rooms": its name holds no word of the list.
  await click(page, AT.day);
  await expect(words).toContainText('Day rooms: a room, by its name.');
  await expect(list).toHaveValue('');
  await expect(first).toHaveText('By its name: no category');
  await expect(said).toHaveText('No category: its name holds no word of the list.');

  // The car: an object has no category, and there is no list. Nor for nothing, after Escape.
  await click(page, AT.car);
  await expect(words).toContainText('Car: 4.5 m by 2 m, 1.5 m high');
  await expect(row).toBeHidden();
  await click(page, AT.day);
  await expect(row).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(words).toBeHidden();
  await expect(row).toBeHidden();
  expect(await keptText(page)).toBe(before);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a category picked for a block without a name is in the sketch, in the words and on the paper; the next key is a tool’s, and Undo takes the pick back', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  const { words, row, list, first, said } = beside(page);
  const before = await keptText(page);
  // With nothing selected, the block shows no word: its middle is its colour, and the grid.
  expect(await ink(page, AT.bare)).toBe(0);

  await click(page, AT.bare);
  await expect(words).toContainText(NO_NAME);
  await expect(first).toHaveText('By its name: no category');
  await expect(said).toHaveText('No category: it has no name.');
  // Bathroom, picked: that box says so in the sketch that the browser keeps - its first box, and
  // nothing else of the text is another.
  await pick(list, 'bathroom');
  await expect(said).toHaveText('Category: Bathroom, picked from the list.');
  await expect(words).toContainText('Block: a room, by its category. C changes it.');
  await expect(list).toHaveValue('bathroom');
  await expect(first).toHaveText('By its name: no category');
  expect(before).not.toContain('category');
  expect(await keptText(page)).toBe(before.replace('"colour":1}', `"colour":1,${BATHROOM}}`));

  // The focus is the page's: a B now takes Block, so a colour shows pressed, and picks no Bedroom.
  expect(await focus(page)).toBe('BODY');
  await expect(page.locator('#palette [aria-pressed="true"]')).toHaveCount(0);
  await page.keyboard.press('b');
  await expect(page.locator('#palette [aria-pressed="true"]')).toHaveCount(1);
  await expect(list).toHaveValue('bathroom');
  expect(await box(page)).toMatchObject({ category: 'bathroom' });

  // Escape, and nothing is selected: the paper has ink in the middle of the block, where it had
  // none - the category's word, where a name would stand.
  await page.keyboard.press('Escape');
  await expect(row).toBeHidden();
  await expect.poll(() => ink(page, AT.bare)).toBeGreaterThan(INK_OF_A_WORD);

  // Undo: the sketch that the browser keeps is the text of before, and the paper has no word.
  await page.keyboard.press('Control+z');
  await expect.poll(() => keptText(page)).toBe(before);
  await expect.poll(() => ink(page, AT.bare)).toBe(0);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a pick takes away what C had set, the first entry takes the pick away, K and Escape take and give the focus, and a reload shows what was picked last', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await openPad(page);
  const { words, row, list, first, said } = beside(page);
  const before = await keptText(page);
  await click(page, AT.bare);
  await expect(words).toContainText(NO_NAME);

  // A Balcony counts as open air. C sets by hand, against the category: the box says both.
  await pick(list, 'balcony');
  await expect(words).toContainText('Block: open air, by its category.');
  await page.keyboard.press('c');
  await expect(words).toContainText('Block: a room, set by hand.');
  await expect(said).toHaveText('Category: Balcony, picked from the list.');
  expect(await box(page)).toMatchObject({ category: 'balcony', is: 'room' });
  // Storage, picked: what C had set is taken away, and the block counts as its category says.
  await pick(list, 'storage');
  await expect(words).toContainText('Block: a room, by its category.');
  expect(await box(page)).toEqual({ ...SKETCH.things[0], category: 'storage' });
  // The first entry, "by its name": the box says no category - the text of before the picks -
  // and the paper shows no word on it.
  await pick(list, '');
  await expect(words).toContainText(NO_NAME);
  await expect(list).toHaveValue('');
  await expect(said).toHaveText('No category: it has no name.');
  expect(await keptText(page)).toBe(before);
  await page.keyboard.press('Escape');
  await expect(row).toBeHidden();
  await expect.poll(() => ink(page, AT.bare)).toBe(0);

  // K, with the block selected: the list has the focus - and the key was not typed into it,
  // which would be a Kitchen. Escape gives the focus back, and is the list's: the block stays
  // selected. The next key is a tool's.
  await click(page, AT.bare);
  await expect(row).toBeVisible();
  await page.keyboard.press('k');
  await expect(list).toBeFocused();
  await expect(list).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(list).not.toBeFocused();
  expect([await focus(page), await keptText(page)]).toEqual(['BODY', before]);
  await expect(row).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.locator('[data-tool="erase"]')).toHaveAttribute('aria-pressed', 'true');

  // A Garden, picked, and the page loaded anew: the block is selected as it was, the list stands
  // at Garden, and the paper shows the word.
  await pick(list, 'garden');
  await expect(said).toHaveText('Category: Garden, picked from the list.');
  await page.reload();
  await expectPad(page);
  await expect(list).toHaveValue('garden');
  await expect(first).toHaveText('By its name: no category');
  await expect(said).toHaveText('Category: Garden, picked from the list.');
  await expect(words).toContainText('Block: open air, by its category.');
  expect(await box(page)).toEqual({ ...SKETCH.things[0], category: 'garden' });
  await page.keyboard.press('Escape');
  await expect(row).toBeHidden();
  await expect.poll(() => ink(page, AT.bare)).toBeGreaterThan(INK_OF_A_WORD);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
