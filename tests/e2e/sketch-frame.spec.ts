import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { placeOf } from './sketch-paper';

// The frame of the pad's two pages, end to end, on the made-up plot with the made-up sketch
// (story ST-029, task T-029.1): which place holds which control. The pad's toolbar is five
// groups in one order - File, View, Edit, Block, Objects - and after them the words that name
// the plot or the slice, in each of its five views; a group is read out by its name, and the
// stylesheet writes that name under it - but File, which is one button that says its own name,
// with its entries in the part that the button opens (T-029.2); the levels, or the slice,
// stand left of the paper and what is selected right of it; with nothing selected the right
// side says so, and the paper lies where it lay once a block is selected; and a button whose
// text is a sign answers to a name in words. The 3D page begins with File and View too. What a
// control does is every other test's: here it is found where it stands - what File's menu does
// is sketch-menu.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no control of one';

// A group of a toolbar: its id, and the name it is read out by. And a place of a page with the
// things that stand in it, in their order: each by what finds it.
type Groups = readonly (readonly [id: string, name: string])[];
type Places = Record<string, readonly string[]>;
const tool = (word: string): string => `[data-tool="${word}"]`;
const way = (word: string): string => `[data-way="${word}"]`;

// File, the first group of both pages: one button, `#file-menu`, which says its own name - so
// the group is named by its button, and has no word under it - and the part that the button
// opens, `#file-entries`, which holds the entries.
const FILE = ['file-group', 'File'] as const;

// The pad's page, index.html: the first table of the card. A thing that a script makes is there
// once the page has loaded - "Open kept" and "Keep" (kept.js), the row of the list of categories
// (category-list.js), the row of a block's colour (swatch.js), the gallery (gallery.js). The
// Block group holds how high a block is and the colours - the colour to draw with, its arrow and
// their menu (palette.js, ST-039) - and no button of its own: a colour is the Block tool
// (T-029.3). The Objects group holds one button, the Object tool, with the picture and the name
// of its object, and no list of kinds: the gallery stands right of the paper (T-029.4).
// After the groups stands Distances, in none, and its panel first in the right side (T-036.3).
// A selected line's panel stands after the swatch's row, and the lines on every level under the
// levels' list (lines/panel.js, lines/list.js, ST-039): each hidden until it has something.
const PAD_GROUPS: Groups = [
  FILE,
  ['view-group', 'View'],
  ['edit-group', 'Edit'],
  ['block-group', 'Block'],
  ['objects-group', 'Objects'],
];
const PAD: Places = {
  body: ['header', '#alarm', '#work', '#left', '#scroller', '#paper', '#right', 'footer'],
  footer: ['#status', '#areas', '#credit'],
  '#file-group': ['#file-menu', '#file-entries', '#file'],
  '#file-entries': ['#open', '#open-kept', '#open-plot', '#save', '#keep', '#picture'],
  '#view-group': ['#views', '#smaller', '#larger', '#fit'],
  '#edit-group': ['#undo', '#redo', ...['move', 'merge', 'line', 'text', 'erase'].map(tool)],
  '#block-group': ['#high-row', '#high', '#palette', '#colour', '#colours-open', '#colours'],
  '#objects-group': [tool('object'), '#object-picture', '#object-name'],
  '#left': [
    ...['#layers-title', '#level-tools', '#add', '#remove', '#layers', '#every-lines'],
    ...['#cut-tools', '#cut-at', '#nearer', '#cut', '#farther', '#layers-hint'],
  ],
  '#right': [
    ...['#distances', '#selected', '#picked', '#category-row', '#category', '#category-said'],
    ...['#swatch-row', '#swatch', '#swatch-name', '#swatch-palette'],
    ...['#line-row', '#line-levels', '#line-every', '#line-shown', '#segments'],
    '#none-picked',
    '#gallery',
  ],
  '#selected': ['#picked', '#category-row', '#swatch-row', '#line-row', '#none-picked'],
  '#swatch-row': ['#swatch', '#swatch-name', '#swatch-palette'],
};

// The 3D page, 3d.html: the second table of the card. After its groups the toolbar holds two
// buttons that stand in none, Settings and Full screen (T-033.6); the levels stand left of the
// stage, alone in their side, and the figures that Settings open right of it (T-029.5).
const SOLID_GROUPS: Groups = [
  FILE,
  ['view-group', 'View'],
  ['ways', 'Shown as'],
  ['stands', 'Seen from'],
  ['with', 'With'],
];
const SOLID: Places = {
  body: ['header', '#said', '#work', '#side', '#stage', '#settings'],
  '#file-group': ['#file-menu', '#file-entries'],
  '#file-entries': ['#picture', '#save', '#save-why', '#earth', '#earth-why', '#earth-raise'],
  '#view-group': ['#views'],
  '#ways': ['volumes', 'white', 'materials'].map(way),
  '#with': ['#ground-row', '#ground', '#shadows-row', '#shadows'],
  '#side': ['#levels-title', '#levels', '#switches'],
  '#settings': ['#settings-said', '#figures'],
};

// The five views of the pad's page: what the switch calls each, and whether it looks from above.
const VIEWS = [
  { view: 'top', name: 'Top view', above: true },
  { view: 'side', name: 'Side view', above: false },
  { view: 'far', name: 'Other side', above: false },
  { view: 'front', name: 'Front view', above: false },
  { view: 'back', name: 'Back view', above: false },
] as const;
// Neither the top view nor the side view is shown from behind. A place on the night rooms of the
// made-up sketch, in cells of each (sketch-paper.ts): from above on the level that the sketch is
// drawn on, and in the slice that it opens with.
const ON_A_BLOCK = { top: [32, 31], side: [35, 15] } as const;

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// The toolbar's things in their order: of each its id, the role and the name it is read out by,
// and the word that the stylesheet writes under it - `none` where it writes none, `""` a drawing.
const TOOLBAR = `[...document.querySelector('header').children].map((one) => [
  one.id,
  one.getAttribute('role'),
  one.getAttribute('aria-label'),
  getComputedStyle(one, '::before').content,
])`;
/** Page code: which of the things stand inside a place, each as what finds it, in the order they stand there. */
const inside = (place: string, things: readonly string[]): string => `(() => {
  const things = ${JSON.stringify(things)};
  const found = document.querySelector(${JSON.stringify(place)}).querySelectorAll(things.join(','));
  return [...found].map((one) => things.find((thing) => one.matches(thing)));
})()`;

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

/** The toolbar is these groups in this order, each read out by its name and with that name under it - but File, which has no word under it - then what stands in no group, where a page has such a thing: a button, with its drawing and no word of the stylesheet's - and last the title. */
async function expectToolbar(page: Page, groups: Groups, alone: string[] = []): Promise<void> {
  const worded = ([id, name]: Groups[number]): unknown[] =>
    id === FILE[0] ? [id, 'group', null, 'none'] : [id, 'group', name, `"${name}"`];
  expect(await page.evaluate<unknown[]>(TOOLBAR)).toEqual([
    ...groups.map(worded),
    ...alone.map((id) => [id, null, null, '""']),
    ['title', null, null, 'none'],
  ]);
  for (const [id, name] of groups) {
    await expect(page.getByRole('group', { name, exact: true })).toHaveAttribute('id', id);
  }
  // File is one button, which names its group, says that it is shut and what it opens: the
  // part with its entries, which does not show.
  await expect(page.locator(`#${FILE[0]}`)).toHaveAttribute('aria-labelledby', 'file-menu');
  await expect(page.locator(`#${FILE[0]} > button`)).toHaveText([FILE[1]]);
  const file = page.getByRole('button', { name: FILE[1], exact: true });
  await expect(file).toHaveAttribute('id', 'file-menu');
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(file).toHaveAttribute('aria-controls', 'file-entries');
  await expect(page.locator('#file-entries')).toBeHidden();
  // The switch of views has no name of its own: its group names it.
  await expect(page.getByRole('navigation', { name: 'View' })).toHaveCount(0);
  await expect(page.locator('#title')).not.toBeEmpty();
}

/** Every thing of every place stands in that place, in its order. */
async function expectPlaces(page: Page, places: Places): Promise<void> {
  for (const [place, things] of Object.entries(places)) {
    expect(await page.evaluate<string[]>(inside(place, things)), place).toEqual(things);
  }
}

/** Where a part of the page lies: its left edge, its right edge, its top and its foot, in pixels. */
type Box = Record<'left' | 'right' | 'top' | 'foot', number>;
async function lies(page: Page, part: string): Promise<Box> {
  const box = await page.locator(part).boundingBox();
  if (box === null) throw new Error(`the page shows no ${part}`);
  return { left: box.x, right: box.x + box.width, top: box.y, foot: box.y + box.height };
}

for (const { view, name, above } of VIEWS) {
  test(`${name}: five groups in the toolbar, the ${above ? 'levels' : 'slice'} left of the paper, what is selected right of it`, async ({
    page,
  }) => {
    await open(page, `/#${view}`);
    await expect(page).toHaveTitle(`${name} — sketch pad`);
    await expectToolbar(page, PAD_GROUPS, ['distances-open']);
    await expectPlaces(page, PAD);
    // Block has no button: its group holds two things, the field of a height and the colours.
    await expect(page.locator(tool('block'))).toHaveCount(0);
    await expect(page.locator('#block-group > *')).toHaveCount(2);
    // The Objects group holds one: the button `#object`, which is the Object tool. The gallery
    // stands in the right side, after what is selected, and does not show: Select is the tool.
    await expect(page.locator('#objects-group > *')).toHaveCount(1);
    await expect(page.locator(`#objects-group > #object${tool('object')}`)).toHaveCount(1);
    await expect(page.locator('#kind')).toHaveCount(0);
    await expect(page.locator('#right > #selected + #gallery')).toBeHidden();

    // The left side lies wholly left of the paper's place, and the right side wholly right of it.
    const left = await lies(page, '#left');
    const paper = await lies(page, '#scroller');
    const right = await lies(page, '#right');
    for (const side of [left, paper, right]) expect(side.right).toBeGreaterThan(side.left);
    expect(left.right).toBeLessThanOrEqual(paper.left);
    expect(paper.right).toBeLessThanOrEqual(right.left);

    // From above the left side is the levels, and a block has a field for its height. Standing
    // up it is the slice, and there is no such field.
    for (const part of ['#level-tools', '#layers', '#high-row']) {
      await expect(page.locator(part)).toBeVisible({ visible: above });
    }
    await expect(page.locator('#cut-tools')).toBeVisible({ visible: !above });
    await expect(page.locator('#layers-title')).toHaveText(above ? 'Layers' : 'The slice');
    await expect(page.locator('#layers-hint')).not.toBeEmpty();

    // A button whose text is a sign answers to a name in words: the two that zoom, in every
    // view; from above the two arrows of every level of the list - of every row but its last,
    // the ground, which has none - and standing up the two that step the slice.
    const named = (words: string) => page.getByRole('button', { name: words, exact: true });
    await expect(named('Zoom out')).toHaveAttribute('id', 'smaller');
    await expect(named('Zoom in')).toHaveAttribute('id', 'larger');
    await expect(named('Zoom to fit')).toHaveAttribute('id', 'fit');
    if (above) {
      const levels = (await page.locator('#layers li').count()) - 1;
      expect(levels, 'the made-up sketch has no level').toBeGreaterThan(0);
      const lift = named('Lift this level, with all that stands on it, by one cell');
      const lower = named('Lower this level, with all that stands on it, by one cell');
      await expect(lift).toHaveText(Array.from({ length: levels }, () => '▲'));
      await expect(lower).toHaveText(Array.from({ length: levels }, () => '▼'));
    } else {
      await expect(named('The slice a cell nearer')).toHaveAttribute('id', 'nearer');
      await expect(named('The slice a cell further')).toHaveAttribute('id', 'farther');
    }
  });
}

for (const view of ['top', 'side'] as const) {
  test(`${view}: with nothing selected the right side says so, and a block selected moves no paper`, async ({
    page,
  }) => {
    await open(page, `/#${view}`);
    // Where the paper lies - its corner on the page (sketch-paper.ts), and the window that shows
    // it - and from where to where across the page the paper's place and the right side reach.
    // Their foot, and the window's, is the footer's to move: it says the pointer's place, in a
    // line or in two.
    const places = async (): Promise<unknown[]> => {
      const [place, right] = [await lies(page, '#scroller'), await lies(page, '#right')];
      const paper = await lies(page, '#paper');
      const shows = [paper.left, paper.right, paper.top];
      return [await placeOf(page, [0, 0]), shows, place.left, place.right, right.left, right.right];
    };

    // Nothing is selected: a line says so, where the pad's words of a thing would stand.
    await expect(page.locator('#picked')).toBeHidden();
    await expect(page.locator('#none-picked')).toBeVisible();
    await expect(page.locator('#none-picked')).toHaveText('Nothing is selected.');
    await expect(page.locator('#category-row')).toBeHidden();
    await expect(page.locator('#swatch-row')).toBeHidden();
    const before = await places();

    // A click with Select, the tool the pad opens with, on a block: the pad's words of it, the
    // list of its categories and its colour show, and the line is gone.
    await page.mouse.click(...(await placeOf(page, ON_A_BLOCK[view])));
    await expect(page.locator('#picked')).toBeVisible();
    await expect(page.locator('#picked')).not.toBeEmpty();
    await expect(page.locator('#category-row')).toBeVisible();
    await expect(page.locator('#swatch-row')).toBeVisible();
    await expect(page.locator('#none-picked')).toBeHidden();
    // The right side is where it was and as wide, and so the paper lies where it lay, to the pixel.
    expect(await places()).toEqual(before);
  });
}

test('3D: the toolbar begins with File and View, and every control stands in its place', async ({
  page,
}) => {
  await open(page, '/3d.html');
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  const drawn = (await page.locator('body').getAttribute('data-stage')) === 'drawn';
  test.skip(!drawn, NO_STAGE);

  await expectToolbar(page, SOLID_GROUPS, ['settings-open', 'full-screen']);
  await expectPlaces(page, SOLID);
  // The stands are five buttons and nothing else: the words "Seen from" are the group's name.
  await expect(page.locator('#stands > *')).toHaveCount(5);
  await expect(page.locator('#stands > button[data-stand]')).toHaveCount(5);
  await expect(page.locator('#stands-title')).toHaveCount(0);
});
