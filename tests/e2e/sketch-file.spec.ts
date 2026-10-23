import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { asNow, BEFORE, golden, VERSION } from './sketch-golden';
import { placeOf, scaleOf } from './sketch-paper';

// The sketch file of the version the pad writes, in the pad, end to end, on the made-up plot
// with the golden files of the format: a file of each version before - from version 2 on - is
// read as it was and saved as one of this version; a figure, a top that slopes, a wide
// staircase, a block of ground and a cut with its category that a sketch holds are what the pad
// reads and what it saves - with its sections and its rates, which no page reads yet, as they
// were; and the wide staircase and the five kinds of furniture are set down with the Object
// tool. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of
// site.js. The real plot is in no part of this run: a case asks yes or no whether its page is
// on the made-up plot, before a matcher reads that page (directive 34). No kept sketch is in it
// either: design/sketches is neither read nor written.

// The file that holds every part of the format. And the frozen files of the versions before: the
// made-up sketch as a pad of version 2 wrote it, a smaller house than the one of now - the two
// boxes of the upper floor at 817 m; the lower floor, the porch and the store at 814 m, with a
// door and a staircase; a car and a tree on the ground - as a pad of version 3 wrote it, the
// house of version 4 without its wide staircase and with every top level; as a pad of version 4
// wrote it, the house of now without its lawn and its cut; as a pad of version 5 wrote it, the
// house of now without its cut; and as a pad of version 6 wrote it, the house of now. With each,
// what the top view lists of its layers: two levels and the ground - and of the house with its
// lawn a third, at 812 m, with the lawn alone on it; its cut is a fifth block of the lower floor.
// Each is said by the version that brought it: 3 the house of then, 4 the wide staircase, 5 the
// lawn, 6 the cut.
const EVERY_PART = golden('every-part');
const LEVELS = ['Level 817 m', 'Level 814 m', 'Ground'];
const WITH_LAWN = ['Level 817 m', 'Level 814 m', 'Level 812 m', 'Ground'];
const listed = (space: number): string[] => {
  const lower = [space > 5 ? 5 : space > 2 ? 4 : 3, space > 3 ? 13 : space > 2 ? 12 : 2];
  const upper = space > 2 ? '4 blocks, 12 objects' : '2 blocks';
  const lawn = space > 4 ? ['1 block'] : [];
  return [upper, `${lower[0]} blocks, ${lower[1]} objects`, ...lawn, '2 objects'];
};
const OF_BEFORE = BEFORE.map((space) => ({
  space,
  file: golden('made-up', space),
  levels: space > 4 ? WITH_LAWN : LEVELS,
  lists: listed(space),
}));
// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';

/**
 * Opens the pad's top view on the made-up plot, with a sketch in its store or with none, and
 * gives every error of the console and every error no script caught, heard from before it loads.
 */
async function openPad(page: Page, sketch: string | null): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  if (sketch !== null) {
    await page.addInitScript(`localStorage.setItem(${STORE}, ${JSON.stringify(sketch)});`);
  }
  await page.goto('/#top');
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  // Asked yes or no, before any matcher reads the page.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  return errors;
}

/** The file that "Save file" saves, as text: File first, which opens its menu, and then the entry. */
async function saved(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save file' }).click(),
  ]);
  return readFileSync(await download.path(), 'utf8');
}

/** O, which takes the Object tool: the gallery shows. It gives what the gallery says, tile for tile in its order: after its picture a kind's name and its size, as the list of kinds said the two in one line. */
async function gallery(page: Page): Promise<string[]> {
  await page.keyboard.press('o');
  await expect(page.locator('#gallery')).toBeVisible();
  return page.evaluate<string[]>(`[...document.querySelectorAll('#gallery button[data-kind]')]
    .map((tile) => [...tile.children].slice(1).map((one) => one.textContent).join(', '))`);
}

for (const { space, file, levels, lists } of OF_BEFORE) {
  test(`a sketch of version ${space} is read as it was, and saved again it is a file of this version`, async ({
    page,
  }) => {
    const errors = await openPad(page, file);

    // The made-up sketch as a pad of that version wrote it: two levels, with no lawn for a
    // third - and as a pad of version 5 or of version 6 wrote it three, its lawn alone on the
    // lowest.
    const layers = page.locator('#layers li');
    await expect(layers.locator('button:first-child')).toHaveText(levels);
    await expect(layers.locator('small')).toHaveText(lists);
    await expect(page.locator('#alarm')).toBeEmpty();
    // Saved, it is the same sketch to the byte, but for its version: nothing of it was lost, and
    // nothing was added to it - no figure and no word on what a block counts as, to a file of
    // version 2; no top that slopes, to that one or to one of version 3; to none of those three a
    // block that is ground; to none of the first four a cut, or a category on a box; and to none
    // of the five a section or a rate.
    const was = `{"space":${space},`;
    expect(file.startsWith(was), `the file is not of version ${space}`).toBe(true);
    expect(await saved(page)).toBe(asNow('made-up', space));
    expect(errors).toEqual([]);
  });
}

test('a sketch that holds every part: the pad says how high its window is and how large its wide staircase, and saves the sketch as it was', async ({
  page,
}) => {
  const errors = await openPad(page, EVERY_PART);

  // The file of every part says under `figures` that a window is 1.2 m high, where a sketch that
  // says nothing has one of 1.5 m. Its studio stands at 817 m, the level drawn on, with a window
  // on the line of its wall: in row 14, from column 25 to column 28. Select takes it there.
  await expect(page.getByRole('button', { name: 'Level 817 m' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await scaleOf(page)).toBeGreaterThan(0);
  await page.mouse.click(...(await placeOf(page, [26.5, 14])));
  await expect(page.locator('#picked')).toHaveText(
    'Window: 1.5 m by 0.3 m, 1.2 m high, on the level at 817 m. R turns it.',
  );
  // The gallery, which O shows, says a window by the same figure - and S takes Select again.
  const listed = (await gallery(page)).filter((says) => says.includes('Window'));
  expect(listed).toEqual(['Window, 1.5 by 0.3 m, 1.2 m high']);
  await page.keyboard.press('s');
  // Its wide staircase stands on the same level, on columns 33 to 44 and rows 16 to 19: eleven
  // cells by three. Select takes it by its middle, and the pad says its size. It is found in the
  // sketch by its kind: two blocks and a cupboard stand after it.
  await page.mouse.click(...(await placeOf(page, [38.5, 17.5])));
  await expect(page.locator('#picked')).toHaveText(
    'Wide staircase, one storey: 5.5 m by 1.5 m, 3 m high, 18 steps, each 16.7 cm by 30.6 cm, on the level at 817 m. R turns it.',
  );
  const object = `sketch.doc.things.find((thing) => thing.kind === 'widestairs')`;
  const lies = await page.evaluate<unknown[]>(`[${object}.kind, ...sketch.rect(${object}, 'top')]`);
  expect(lies).toEqual(['widestairs', 33, 16, 44, 19]);
  // And the tops of two of its six boxes slope, by the pad's one reading of a slope: the
  // studio's falls down the plot, from row 12 to row 15 of a standing view; the top of the
  // workshop's second box falls across the plot the other way, from row 12 down to row 16. Its
  // fifth box is level: a bank that is ground, by what the box says. And so is its sixth, the
  // last of its boxes, before the cupboard that ends its things: a cut by what the box says,
  // with the category that was picked for it - by the pad's one list, which the page has loaded.
  const tops = await page.evaluate<unknown[]>(
    `sketch.doc.things.filter(sketch.isBox).map((box) => blocks.topOf(box))`,
  );
  const [down, across] = [
    { axis: 'x', rows: [12, 15] },
    { axis: 'y', rows: [16, 12] },
  ];
  expect(tops).toEqual([down, null, across, null, null, null]);
  const [bank, dig] = ['sketch.doc.things.at(-3)', 'sketch.doc.things.at(-2)'];
  const counted = await page.evaluate<unknown[]>(
    `[${bank}, ${dig}].map((box) => blocks.countsAs(sketch.blockOf(box)))`,
  );
  expect(counted).toEqual([
    { as: 'ground', by: 'is' },
    { as: 'cut', by: 'is' },
  ]);
  const category = await page.evaluate<unknown[]>(
    `Object.values(categories.of(sketch.blockOf(${dig}))).map((said) => said.name ?? said)`,
  );
  expect(category).toEqual(['Ground cut', 'picked']);
  // Saved, the sketch is the file again: with its figure, with what its blocks say they are, with
  // its two slopes, with its wide staircase, with its block of ground after that, with its cut,
  // and with a cupboard of 2.5 m as the last of its things.
  for (const part of ['"slope":{"x":[20,32],"z":[12,15]}', '"slope":{"y":[20,30],"z":[16,12]}']) {
    expect(EVERY_PART).toContain(part);
  }
  expect(EVERY_PART).toContain(
    '{"kind":"widestairs","x":38.5,"y":17.5,"floor":18,"long":5.5},' +
      '{"x":[50,56],"y":[14,26],"z":[20,22],"colour":9,"name":"Bank","is":"ground"},' +
      '{"x":[62,68],"y":[14,26],"z":[18,22],"colour":8,"name":"Dig","category":"ground-cut",' +
      '"is":"cut"},{"kind":"cupboard","x":22.5,"y":25.5,"floor":18,"long":2.5}],"floors"',
  );
  expect(await saved(page)).toBe(EVERY_PART);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('the gallery has five kinds of furniture one after the other, and each is set down on whole cells', async ({
  page,
}) => {
  const errors = await openPad(page, null);

  // What a tile says of each - its name and its size, as tools/sketch/shapes.js has them - and
  // how many cells it covers, along the plot and across it.
  const FURNITURE = [
    { kind: 'sofa', says: 'Sofa, 2 by 1 m, 0.8 m high', cells: [4, 2] },
    { kind: 'table', says: 'Table, 2 by 1 m, 0.75 m high', cells: [4, 2] },
    { kind: 'chair', says: 'Chair, 0.5 by 0.5 m, 0.9 m high', cells: [1, 1] },
    { kind: 'desk', says: 'Desk, 1.5 by 1 m, 0.75 m high', cells: [3, 2] },
    { kind: 'wardrobe', says: 'Wardrobe, 1.5 by 0.5 m, 2 m high', cells: [3, 1] },
  ] as const;
  // In the gallery, which O shows, the five stand in this order, from the sofa on.
  const list = await gallery(page);
  const sofa = list.indexOf(FURNITURE[0].says);
  expect(list.slice(sofa, sofa + FURNITURE.length)).toEqual(FURNITURE.map(({ says }) => says));
  // With no figure set, a door and a window are as high as they were before there were figures.
  expect(list).toEqual(
    expect.arrayContaining(['Door, 1 by 1 m, 2.1 m high', 'Window, 1.5 by 0.3 m, 1.5 m high']),
  );

  // An empty paper has the ground alone, and the ground takes objects. Each kind is picked in the
  // gallery, by a click on its tile, and set down with a click at a place of its own, on no
  // grid point. Then the wardrobe once more, turned by a quarter with R: it lies across.
  for (const [index, { kind }] of FURNITURE.entries()) {
    await page.locator(`#gallery button[data-kind="${kind}"]`).click();
    await page.locator('#paper').click({ position: { x: 103 + 90 * index, y: 157 } });
  }
  await page.keyboard.press('r');
  await page.locator('#paper').click({ position: { x: 103, y: 307 } });
  await expect(page.locator('#layers small')).toHaveText(['6 objects']);

  // Where each lies from above, by the pad's own rule: its left, top, right and bottom, in cells.
  const lying = await page.evaluate<[string, number, number, number, number][]>(
    `sketch.doc.things.map((thing) => [thing.kind, ...sketch.rect(thing, 'top')])`,
  );
  const covers = lying.map(([kind, left, top, right, bottom]) => [
    kind,
    right - left,
    bottom - top,
  ]);
  expect(covers).toEqual([
    ...FURNITURE.map(({ kind, cells }) => [kind, ...cells]),
    ['wardrobe', 1, 3],
  ]);
  expect(lying.flatMap(([, ...rect]) => rect).every(Number.isInteger), 'on whole cells').toBe(true);
  // And what the pad keeps of them is a sketch of this version.
  const kept = await page.evaluate<string | null>(`localStorage.getItem(${STORE})`);
  expect(kept?.startsWith(`{"space":${VERSION},"things":[{"kind":"sofa",`)).toBe(true);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('the gallery has the wide staircase after the staircase, and it is set down on nine cells by three', async ({
  page,
}) => {
  const errors = await openPad(page, null);

  // What the gallery, which O shows, says of the two: the staircase as tools/sketch/shapes.js has
  // it, and after it the wide staircase - a named starting size of it (ST-035), as long and as
  // high, and half as wide again.
  const list = await gallery(page);
  const staircase = list.indexOf('Staircase, one storey, 4.5 by 1 m, 3 m high');
  expect(staircase).toBeGreaterThanOrEqual(0);
  expect(list[staircase + 1]).toBe('Wide staircase, one storey, 4.5 by 1.5 m, 3 m high');

  // An empty paper has the ground alone, and the ground takes objects. The wide staircase is
  // picked in the gallery, by a click on its tile, and set down with a click on no grid point;
  // then once more, turned by a quarter with R: it lies across. Each is a staircase 1.5 m deep.
  await page.locator('#gallery button[data-kind="widestaircase"]').click();
  await page.locator('#paper').click({ position: { x: 203, y: 157 } });
  await page.keyboard.press('r');
  await page.locator('#paper').click({ position: { x: 403, y: 257 } });
  await expect(page.locator('#layers small')).toHaveText(['2 objects']);

  // Where each lies from above, by the pad's own rule: nine whole cells along the plot by three
  // across it, and turned, three by nine.
  const lying = await page.evaluate<[string, number, number, number, number][]>(
    `sketch.doc.things.map((thing) => [thing.kind, ...sketch.rect(thing, 'top')])`,
  );
  const covers = lying.map(([kind, left, top, right, bottom]) => [
    kind,
    right - left,
    bottom - top,
  ]);
  expect(covers).toEqual([
    ['stairs', 9, 3],
    ['stairs', 3, 9],
  ]);
  expect(lying.flatMap(([, ...rect]) => rect).every(Number.isInteger), 'on whole cells').toBe(true);
  // And what the pad keeps of them is a sketch of this version, each a staircase 1.5 m deep.
  const kept = await page.evaluate<string | null>(`localStorage.getItem(${STORE})`);
  expect(kept?.startsWith(`{"space":${VERSION},"things":[{"kind":"stairs",`)).toBe(true);
  expect(kept?.match(/"deep":1\.5[,}]/g)).toHaveLength(2);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(errors).toEqual([]);
});
