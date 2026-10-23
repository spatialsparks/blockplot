import { expect, test, type Page } from '@playwright/test';
import { golden, VERSION } from './sketch-golden';

// The Info page of the sketch pad, end to end, on the made-up plot (story ST-032, task T-032.5):
// "Info" stands after "3D" on all three pages, and the keys go round the seven views; its
// toolbar is the pad's - File in its place and not seen, the switch where the pad has it, the
// plot's name, one line - and its policy asks nobody; a change made in another window shows with
// no reload; an empty sketch says that nothing is drawn yet, and the made-up house as its file
// has it is in no section. What the page says of the made-up house, and the rates typed into it,
// are sketch-info-rates.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time. And two sketches of the test's own: nothing
// drawn, and the made-up house's store alone - 4 m by 4 m, 2 m high.
const SKETCH = golden('made-up');
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const drawn = (things: unknown[]): string =>
  JSON.stringify({ space: VERSION, things, floors: [], notes: [], on: {}, show: { top: {} } });
const STORE = { x: [22, 30], y: [24, 32], z: [20, 24], colour: 10, name: 'Store' };
const SWITCH = ['Top view', 'Side view', 'Other side', 'Front view', 'Back view', '3D', 'Info'];
// The whole house as the page says it of the made-up house, with no rate: no cost.
const HOUSE = 'The whole house: 188 m² of floor, 28 m² of open air, 520 m³ — no cost.';
const HEAD = ['Floor', 'Open air', 'Volume', 'Rough cost'];

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// Where File and the seven links of the switch lie: of each its words, and its left edge, its
// top, its width and its height in pixels - seen or not.
type Lies = [words: string, left: number, top: number, width: number, height: number];
const LIES = `[...document.querySelectorAll('#file-menu, #views a')].map((one) => {
  const { left, top, width, height } = one.getBoundingClientRect();
  return [one.textContent.trim(), left, top, width, height];
})`;

interface Seen {
  /** Every error of the console, and every error no script caught. */
  readonly errors: string[];
  /** Every request to another origin than the page's own. */
  readonly elsewhere: string[];
}

/** What goes wrong in a page and of whom it asks, heard from before it loads. */
function watch(page: Page, baseURL: string | undefined): Seen {
  const origin = new URL(baseURL ?? '').origin;
  const seen: Seen = { errors: [], elsewhere: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') seen.errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    seen.errors.push(error.message);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin && url.protocol !== 'data:') seen.elsewhere.push(request.url());
  });
  return seen;
}

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await page.waitForLoadState('load');
}
/** Opens the Info page on a sketch of the test's own: put into the store once, by a page of the pad, and the page loaded anew. */
async function openOn(page: Page, sketch: string): Promise<void> {
  await open(page, '/info.html');
  await page.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(sketch)})`);
  await page.reload();
  await page.waitForLoadState('load');
}
/** Of a table of the page, a row each: the text of each cell - page code, handed over as text. */
const rows = (page: Page, table: string): Promise<string[][]> =>
  page.evaluate<string[][]>(
    `[...document.querySelectorAll('#${table} tr')].map((row) => [...row.cells].map((cell) => cell.textContent))`,
  );

test('"Info" stands after "3D" on every page, and 7 and V go to it and on', async ({ page }) => {
  const current = page.locator('#views a[aria-current]');
  for (const address of ['/#top', '/3d.html', '/info.html']) {
    await open(page, address);
    await expect(page.locator('#views a')).toHaveText(SWITCH);
  }
  // On its own page Info is the view that shows, and the toolbar says the plot's name and area.
  await expect(current).toHaveText('Info');
  await expect(page).toHaveTitle('Info — sketch pad');
  await expect(page.locator('#title')).toHaveText(`${PLOT}, 644 m²`);
  // V from Info goes round to the first view, 7 from there to Info, and V from 3D to Info.
  await page.keyboard.press('v');
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expect(page).toHaveURL(/\/index\.html#top$/);
  await page.keyboard.press('7');
  await expect(page).toHaveTitle('Info — sketch pad');
  await expect(page).toHaveURL(/\/info\.html$/);
  await page.keyboard.press('6');
  await expect(page).toHaveTitle('3D — sketch pad');
  await page.keyboard.press('v');
  await expect(page).toHaveTitle('Info — sketch pad');
  // And by the pointer: from Info to a slice, which says where it is seen from.
  await page.getByRole('link', { name: 'Side view' }).click();
  await expect(page).toHaveTitle('Side view — sketch pad');
  await expect(current).toHaveText('Side view');
});

for (const [width, height] of [
  [1440, 900],
  [1280, 720],
] as const) {
  test(`in a window of ${width} by ${height}, File and the seven links lie where the pad has them, and each toolbar is one line`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    /** Where File and the links lie on a page, and how high its toolbar is. */
    const lie = async (address: string): Promise<[Lies[], number]> => {
      await open(page, address);
      if (address === '/3d.html') {
        await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
      }
      const box = await page.locator('header').boundingBox();
      return [await page.evaluate<Lies[]>(LIES), box?.height ?? NaN];
    };
    // The pad's page, from above: File and the seven links, each with a place, on a line of 79.
    const [pad, high] = await lie('/#top');
    expect(pad.map(([words]) => words)).toEqual(['File', ...SWITCH]);
    expect([pad.every(([, , , wide, tall]) => wide > 0 && tall > 0), high]).toEqual([true, 79]);
    // The 3D page and the Info page: each where the pad has it, to the pixel, on a line of 79.
    for (const address of ['/3d.html', '/info.html']) {
      expect(await lie(address), address).toEqual([pad, 79]);
    }
    // File is in the Info page and not seen: nothing answers to its name, and Tab passes it by,
    // to the first of the views.
    await expect(page.locator('#file-menu')).toBeHidden();
    await expect(page.locator('#file-menu')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'File', exact: true })).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Top view' })).toBeFocused();
  });
}

test('the Info page asks nobody, and its policy refuses a connection', async ({
  page,
  baseURL,
}) => {
  const seen = watch(page, baseURL);
  await openOn(page, SKETCH);
  await expect(page.locator('#info-house')).toHaveText(HOUSE);
  // And through the switch, the pad's page and the 3D page, and back: no page said an error, and
  // none asked another origin for anything.
  for (const name of ['Top view', '3D', 'Info']) {
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveTitle(`${name} — sketch pad`);
  }
  await expect(page.locator('#info-house')).toHaveText(HOUSE);
  expect(seen.elsewhere).toEqual([]);
  expect(seen.errors).toEqual([]);
  // Its policy refuses a connection - asked of the pad itself, so that a request would stay on
  // this machine were the policy gone.
  const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(policy).toHaveAttribute('content', "connect-src 'none'");
  const asked = `fetch('/info.html').then(() => 'answered', () => 'refused')`;
  expect(await page.evaluate<string>(asked)).toBe('refused');
});

test('a change made in the pad in another window shows here, with no reload', async ({
  page,
  context,
}) => {
  await openOn(page, SKETCH);
  await expect(page.locator('#info-house')).toHaveText(HOUSE);
  // A mark that a page loaded anew would not have.
  await page.evaluate('globalThis.stayed = true');
  // In another window, the pad: "Open file" takes a sketch of the store alone, as a stroke takes
  // a block - through the pad's one way to change the sketch, which keeps it at once.
  const pad = await context.newPage();
  await open(pad, '/#top');
  const buffer = Buffer.from(drawn([STORE]));
  await pad
    .locator('#file')
    .setInputFiles({ name: 'store.json', mimeType: 'application/json', buffer });
  const ALONE = 'The whole house: 16 m² of floor, 0 m² of open air, 32 m³ — no cost.';
  await expect(page.locator('#info-house')).toHaveText(ALONE);
  await expect(page.locator('#info-apart')).toBeHidden();
  // The pad takes the change back: the made-up house again.
  await pad.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#info-house')).toHaveText(HOUSE);
  await expect(page.locator('#info-apart')).toHaveText('Not counted: 1 block of ground and 1 cut.');
  expect(await page.evaluate<boolean>('globalThis.stayed === true')).toBe(true);
});

test('an empty sketch says that nothing is drawn yet, and the made-up house is in no section', async ({
  page,
}) => {
  // Nothing drawn: the sentence, and no table - but the rates, which the owner may type.
  await openOn(page, drawn([]));
  await expect(page.locator('#info-none')).toHaveText('Nothing is drawn yet.');
  await expect(page.locator('#info table')).toHaveCount(3);
  await expect(page.locator('#info table:visible')).toHaveCount(0);
  await expect(page.locator('#info-house')).toBeHidden();
  await expect(page.locator('#rates input:visible')).toHaveCount(3);
  // The made-up house as its file has it: one row by section, "No section", over the total.
  await page.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(SKETCH)})`);
  await page.reload();
  await expect(page.locator('#info-none')).toBeHidden();
  expect(await rows(page, 'info-sections')).toEqual([
    ['Section', ...HEAD],
    ['No section', '188 m²', '28 m²', '520 m³', 'no cost'],
    ['Total', '188 m²', '28 m²', '520 m³', 'no cost'],
  ]);
});
