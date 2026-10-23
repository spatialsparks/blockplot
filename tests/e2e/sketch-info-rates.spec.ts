import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// What the Info page says of the made-up house, end to end (story ST-032, task T-032.5): in two
// sections and with no rate, the three tables to the letter, every cost "no cost", what the
// figures are, what each rate multiplies and what is not counted; rates typed - each kept in the
// sketch that the browser keeps, as the field is left or at Enter, every cost following at once,
// the field keeping the focus - a text that is no rate refused in words, 0 a rate, a field
// emptied taking its rate away, and the pad's Undo taking a rate back; a hidden section, which
// changes no word, and the sections in the order of their list; and floor counted twice, said in
// a sentence. The switch, the toolbar, the policy and another window are sketch-info.spec.ts's.
// `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of site.js. The
// real plot is in no part of this run: a case asks yes or no whether its page is on the made-up
// plot, before a matcher reads that page (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time. Made of it by the test: the house in two
// sections - "Upper home", the night rooms, the bath and the roof terrace; "Lower home", the day
// rooms, the porch and the garden; the store in none - and its rates, as the pad writes them.
let HOMES = readFileSync(
  fileURLToPath(new URL('../__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
for (const [at, names] of [
  'Night rooms|Bath|Roof terrace',
  'Day rooms|Glass porch|Garden',
].entries()) {
  for (const name of names.split('|')) {
    HOMES = HOMES.replaceAll(`"name":"${name}"`, `$&,"section":${at + 1}`);
  }
}
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const [UPPER, LOWER] = ['{"id":1,"name":"Upper home"}', '{"id":2,"name":"Lower home"}'];
const listed = (...sections: string[]): string => `"sections":[${sections.join(',')}]`;
const homes = (...more: string[]): string =>
  HOMES.replace(/\}\s*$/, `,${[listed(UPPER, LOWER), ...more].join(',')}}`);
const rated = (as: string, category = ''): string =>
  `"rates":{"as":{${as}}${category === '' ? '' : `,"category":{${category}}`}}`;
const ROOM = rated('"room":900');
const ALL = rated('"room":900,"glass":600,"open":350', '"bathroom":1200');

// What the page says of the whole house, and of what its figures are; what the rates multiply.
const HOUSE = 'The whole house: 188 m² of floor, 28 m² of open air, 520 m³';
const IS =
  "These figures are the sketch's own: the floor of a block as it is drawn, its walls included, and what the block encloses from its floor to its top. They are not the areas or the volumes that the building law counts.";
const ARE =
  'The pad picks no rate: what has none has no cost. Rooms and glass are costed by their volume, open air by its area; a category with a rate of its own is costed by that one.';
const WORDS = ['A cubic metre of rooms', 'A cubic metre under glass', 'A square metre of open air'];
// The three tables, row by row, but for their costs; and a category's field of its own rate.
const HEAD = ['Floor', 'Open air', 'Volume', 'Rough cost'];
const TOTAL = ['Total', '188 m²', '28 m²', '520 m³'];
const SECTIONS = [
  ['Upper home', '68 m²', '12 m²', '200 m³'],
  ['Lower home', '104 m²', '16 m²', '288 m³'],
  ['No section', '16 m²', '0 m²', '32 m³'],
  TOTAL,
];
const LEVELS = [
  ['Level 817 m', '68 m²', '12 m²', '200 m³'],
  ['Level 814 m', '120 m²', '16 m²', '320 m³'],
  TOTAL,
];
const CATEGORIES = [
  ['Bathroom', '8 m²', '0 m²', '20 m³'],
  ['Garden', '0 m²', '16 m²', '0 m³'],
  ['Roof', '0 m²', '12 m²', '0 m³'],
  ['No category', '180 m²', '0 m²', '500 m³'],
  TOTAL,
];
const owns = (bathroom: string): string[] => [
  `CHF [${bathroom}] per m³`,
  'CHF [] per m²',
  'CHF [] per m²',
  '',
  '',
];
/** A table as the page is to show it: its head, and each row with its cost - and its own rate. */
const expected = (kind: string, figures: string[][], costs: string[], own: string[] = []) => [
  [kind, ...HEAD, ...(own.length > 0 ? ['Its own rate'] : [])],
  ...figures.map((row, at) => [
    ...row,
    costs[at] ?? '',
    ...(own.length > 0 ? [own[at] ?? ''] : []),
  ]),
];

/** Opens the Info page on a sketch of the test's own: put into the store once, by a page of the pad, and the page loaded anew. */
async function openOn(page: Page, sketch: string): Promise<void> {
  await page.goto('/info.html');
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await page.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(sketch)})`);
  await page.reload();
  await page.waitForLoadState('load');
}
/** Of a table of the page, a row each: the text of each cell - of a field, what it holds, in brackets. Page code, handed over as text. */
const rows = (page: Page, table: string): Promise<string[][]> =>
  page.evaluate<string[][]>(`[...document.querySelectorAll('#${table} tr')].map((row) =>
    [...row.cells].map((cell) => {
      const field = cell.querySelector('input');
      return field ? cell.textContent.replace('CHF ', 'CHF [' + field.value + ']') : cell.textContent;
    }))`);
/** The cost of each row of a table, its total last. */
const costs = async (page: Page, table: string): Promise<string[]> =>
  (await rows(page, table)).slice(1).map((row) => row[4] ?? '');
/** The sketch that the browser keeps. */
const kept = (page: Page): Promise<string | null> =>
  page.evaluate<string | null>(`localStorage.getItem(${JSON.stringify(KEY)})`);
/** A text typed into the field of a rate, and Enter pressed. */
async function type(page: Page, field: string, words: string): Promise<void> {
  await page.locator(`#${field}`).fill(words);
  await page.locator(`#${field}`).press('Enter');
}

test('the made-up house in two sections and with no rate: the three tables to the letter, and no cost', async ({
  page,
}) => {
  await openOn(page, homes());
  await expect(page.locator('#info-house')).toHaveText(`${HOUSE} — no cost.`);
  await expect(page.locator('#info-is')).toHaveText(IS);
  await expect(page.locator('#info-apart')).toHaveText('Not counted: 1 block of ground and 1 cut.');
  for (const id of ['info-none', 'info-said', 'info-twice', 'info-through']) {
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
  // The three fields of the rates, empty, each with its words and "CHF"; and what each multiplies.
  await expect(page.locator('#rates label')).toHaveText(WORDS);
  await expect(page.locator('#rates .rate')).toHaveText(['CHF', 'CHF', 'CHF']);
  for (const as of ['room', 'glass', 'open'])
    await expect(page.locator(`#rate-${as}`)).toHaveValue('');
  await expect(page.locator('#rates-are')).toHaveText(ARE);
  // Every row of the three tables, and every cost "no cost".
  const none = (count: number): string[] => Array<string>(count).fill('no cost');
  await expect(page.locator('#info caption')).toHaveText(['By section', 'By level', 'By category']);
  expect(await rows(page, 'info-sections')).toEqual(expected('Section', SECTIONS, none(4)));
  expect(await rows(page, 'info-levels')).toEqual(expected('Level', LEVELS, none(3)));
  const byCategory = expected('Category', CATEGORIES, none(5), owns(''));
  expect(await rows(page, 'info-categories')).toEqual(byCategory);
});

test('a rate typed is kept in the sketch and every cost follows; a text that is no rate is refused in words', async ({
  page,
}) => {
  await openOn(page, homes());
  // 900 FOR A CUBIC METRE OF ROOMS, and Enter: kept in the sketch, every cost follows at once -
  // with what it leaves out - and the field keeps the focus.
  await type(page, 'rate-room', '900');
  await expect(page.locator('#info-house')).toHaveText(
    `${HOUSE} — CHF 424'800 without glass and open air.`,
  );
  await expect(page.locator('#rate-room')).toBeFocused();
  expect(await kept(page)).toBe(homes(ROOM));
  const LEFT = "CHF 424'800 without glass and open air";
  const BY_SECTION = ["CHF 180'000 without open air", "CHF 216'000 without glass and open air"];
  expect(await costs(page, 'info-sections')).toEqual([...BY_SECTION, "CHF 28'800", LEFT]);
  const BY_LEVEL = ["CHF 180'000 without open air", "CHF 244'800 without glass and open air"];
  expect(await costs(page, 'info-levels')).toEqual([...BY_LEVEL, LEFT]);
  const BY_CATEGORY = ["CHF 18'000", 'no cost', 'no cost', "CHF 406'800 without glass", LEFT];
  expect(await costs(page, 'info-categories')).toEqual(BY_CATEGORY);
  // "x" AND "-5" FOR GLASS: refused in words under the field, which keeps the text, and nothing
  // is written: the kept sketch is the text it was.
  const refused = page.locator('#rates li').nth(1).locator('.refused');
  for (const words of ['x', '-5']) {
    await type(page, 'rate-glass', words);
    await expect(refused).toHaveText(
      `A rate is a number from 0 to 1000000, in francs: "${words}" is none.`,
    );
    await expect(page.locator('#rate-glass')).toHaveValue(words);
    expect(await kept(page)).toBe(homes(ROOM));
  }
  // 600, 350, AND BESIDE "BATHROOM" 1'200, typed with its apostrophe: kept as 1200, which its
  // field shows, with the focus; the refusal is gone, and every row is the card's.
  await type(page, 'rate-glass', '600');
  await expect(refused).toBeHidden();
  await type(page, 'rate-open', '350');
  await type(page, 'rate-bathroom', "1'200");
  await expect(page.locator('#rate-bathroom')).toHaveValue('1200');
  await expect(page.locator('#rate-bathroom')).toBeFocused();
  expect(await kept(page)).toBe(homes(ALL));
  await expect(page.locator('#info-house')).toHaveText(`${HOUSE} — CHF 469'400.`);
  const SUM = "CHF 469'400";
  const sections = ["CHF 190'200", "CHF 250'400", "CHF 28'800", SUM];
  expect(await rows(page, 'info-sections')).toEqual(expected('Section', SECTIONS, sections));
  const levels = ["CHF 190'200", "CHF 279'200", SUM];
  expect(await rows(page, 'info-levels')).toEqual(expected('Level', LEVELS, levels));
  const categories = ["CHF 24'000", "CHF 5'600", "CHF 4'200", "CHF 435'600", SUM];
  const byCategory = expected('Category', CATEGORIES, categories, owns('1200'));
  expect(await rows(page, 'info-categories')).toEqual(byCategory);
  // 0 FOR OPEN AIR is a rate: the two terraces cost "CHF 0".
  await type(page, 'rate-open', '0');
  expect((await costs(page, 'info-categories')).slice(1, 3)).toEqual(['CHF 0', 'CHF 0']);
  expect(await kept(page)).toBe(homes(rated('"room":900,"glass":600,"open":0', '"bathroom":1200')));
  // EMPTIED, the rate is gone from the kept sketch, and the terraces have no cost again.
  await type(page, 'rate-open', '');
  expect(await kept(page)).toBe(homes(rated('"room":900,"glass":600', '"bathroom":1200')));
  expect((await costs(page, 'info-categories')).slice(1, 3)).toEqual(['no cost', 'no cost']);
  // Each rate is a step that the pad's Undo takes back: in the pad, Undo, and the rate of 0 for
  // open air is in the field again.
  await page.getByRole('link', { name: 'Top view' }).click();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('link', { name: 'Info' }).click();
  await expect(page.locator('#rate-open')).toHaveValue('0');
});

test('a hidden section changes no word of the page, and the sections stand in the order of their list', async ({
  page,
}) => {
  await openOn(page, homes(ALL));
  await expect(page.locator('#info-house')).toHaveText(`${HOUSE} — CHF 469'400.`);
  const page1 = await page.locator('#info').innerText();
  const fields = (): Promise<string[]> =>
    page.evaluate<string[]>(
      `[...document.querySelectorAll('#info input')].map((one) => one.value)`,
    );
  const held = await fields();
  // "Upper home" hidden, in the sketch: the page is, word for word, the page it was.
  const hidden = HOMES.replace(
    /\}\s*$/,
    `,${listed(UPPER.replace('}', ',"hidden":true}'), LOWER)},${ALL}}`,
  );
  await page.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(hidden)})`);
  await page.reload();
  await expect(page.locator('#info-house')).toHaveText(`${HOUSE} — CHF 469'400.`);
  expect([await page.locator('#info').innerText(), await fields()]).toEqual([page1, held]);
  // The two sections the other way round in the sketch's list: the table by section has them so.
  const turned = HOMES.replace(/\}\s*$/, `,${listed(LOWER, UPPER)},${ALL}}`);
  await page.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(turned)})`);
  await page.reload();
  const names = (await rows(page, 'info-sections')).map(([name]) => name);
  expect(names).toEqual(['Section', 'Lower home', 'Upper home', 'No section', 'Total']);
});

test('a kitchen over the day rooms and the porch: the floor counted twice is said in a sentence', async ({
  page,
}) => {
  // A box from column 46 to 54 and from row 18 to 26, on the level of row 24: over 4 m² of the
  // day rooms and 2 m² of the porch.
  const KITCHEN = '{"x":[46,54],"y":[18,26],"z":[18,24],"colour":2,"name":"Kitchen"}';
  await openOn(page, homes().replace('"things":[', `$&${KITCHEN},`));
  const twice =
    'On Level 814 m, 6 m² of floor are counted twice: blocks lie over each other there.';
  await expect(page.locator('#info-twice')).toHaveText(twice);
  await expect(page.locator('#info-through')).toBeHidden();
});
