import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// Boundary distances on the plan (story ST-036), end to end: the story's one browser test, on the
// made-up plot. From above, on the made-up sketch, which holds no distance: "Distances" opens its
// panel, with its three fields empty and nothing drawn; a text that is no distance is refused in
// words beside its field and writes nothing; 4 under Small and 7.5 under Large are kept in the
// sketch that the browser keeps, and drawn inside the outline, a closed line of six corners each,
// labelled - and so they are after a reload. "Show the lines" unticked takes the lines away, and
// writes nothing into the sketch; the tab keeps it so through a reload; ticked, they are back.
// 10.5 under Annexes is kept, and draws no line, which is said beside the field; Small emptied
// takes its figure out of the sketch, and its line away. Nothing of them is drawn from the front,
// and the 3D page has neither the button nor the panel. `pnpm sketch --demo` serves
// the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part of this run, a
// page is asked yes or no whether it is on the made-up plot before a matcher reads it, and
// neither page asks another machine (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const MADE_UP = readFileSync(
  fileURLToPath(new URL('../__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
).trim();
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// What model.js refuses "abc" with, and says of a figure that gives no line (panel.js).
const REFUSED = 'A boundary distance is a number from 0.5 to 30 m: "abc" is none.';
const NO_LINE = 'No place of the plot is 10.5 m from its outline: there is no line.';
// The two lines inside the made-up plot - a 34 by 20 m rectangle with two corners cut - at 4 m
// and at 7.5 m: one piece each, of its six corners and the first again.
const BOTH = [
  ['4.0 m', 1, 7],
  ['7.5 m', 1, 7],
];

/** Listens to a page from before it loads: every error it says, and every request to another origin. */
function listen(page: Page, origin: string): string[] {
  const heard: string[] = [];
  page.on('console', (message) => void (message.type() === 'error' && heard.push(message.text())));
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== origin) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before a matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the page is not on the made-up plot').toBe(true);
  await page.waitForLoadState('load');
}

/** The sketch that the browser keeps, as the text it is kept as. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);

/** What the paper draws of the distances: of each, its label, its pieces and the points of its first. */
const drawn = (page: Page): Promise<unknown[]> =>
  page.evaluate<unknown[]>(
    'globalThis.distancePanel.drawn().map(({ label, pieces }) => [label, pieces.length, pieces[0].length])',
  );

/** A text typed into the field of a distance, and Enter pressed. */
async function type(page: Page, name: string, words: string): Promise<void> {
  await page.locator(`#distance-${name}`).fill(words);
  await page.locator(`#distance-${name}`).press('Enter');
}

/** The field of a distance, by its name. */
const field = (page: Page, name: string) => page.locator(`#distance-${name}`);

test('4 m and 7.5 m typed from above are kept in the sketch and drawn inside the outline, labelled; the switch hides them for the tab alone', async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? '').origin;
  const heard = listen(page, origin);
  await page.addInitScript(
    `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${JSON.stringify(MADE_UP)});`,
  );
  await open(page, '/#top');
  await expect(page).toHaveTitle('Top view — sketch pad');

  // The panel is shut; "Distances" opens it, its fields empty and nothing drawn.
  const panel = page.locator('#right > #distances:first-child');
  await expect(panel).toBeHidden();
  const button = page.getByRole('button', { name: 'Distances', exact: true });
  await button.click();
  await expect(panel).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  for (const name of ['smallM', 'largeM', 'annexM']) {
    await expect(field(page, name)).toHaveValue('');
  }
  await expect(page.locator('#distances-shown')).toBeChecked();
  expect(await drawn(page)).toEqual([]);
  const before = await keptText(page);
  expect(before).not.toContain('"distances"');

  // A text that is no distance: refused beside its field, kept in it, and the sketch as it was.
  await type(page, 'smallM', 'abc');
  await expect(page.locator('#distance-smallM-said')).toHaveText(REFUSED);
  await expect(field(page, 'smallM')).toHaveValue('abc');
  expect(await keptText(page)).toBe(before);

  // 4 under Small and 7.5 under Large: kept, nothing said, and both drawn.
  await type(page, 'smallM', '4');
  await type(page, 'largeM', '7.5');
  await expect.poll(() => keptText(page)).toMatch(/,"distances":\{"smallM":4,"largeM":7\.5\}\}$/);
  const both = await keptText(page);
  await expect(page.locator('#distance-smallM-said')).toHaveText('');
  expect(await drawn(page)).toEqual(BOTH);

  // Reloaded: the same sketch, the same lines, the fields saying their figures.
  await page.reload();
  await page.waitForLoadState('load');
  expect([await keptText(page), await drawn(page)]).toEqual([both, BOTH]);
  await button.click();
  await expect(field(page, 'smallM')).toHaveValue('4');
  await expect(field(page, 'largeM')).toHaveValue('7.5');

  // The switch off: nothing drawn, the sketch as it was - and so through a reload. On: both again.
  const shown = page.getByLabel('Show the lines');
  await shown.uncheck();
  expect([await drawn(page), await keptText(page)]).toEqual([[], both]);
  await page.reload();
  await page.waitForLoadState('load');
  await expect(shown).not.toBeChecked();
  expect([await drawn(page), await keptText(page)]).toEqual([[], both]);
  await button.click();
  await shown.check();
  expect(await drawn(page)).toEqual(BOTH);

  // 10.5 under Annexes: kept, and no line for it, which is said beside its field.
  await type(page, 'annexM', '10.5');
  await expect.poll(() => keptText(page)).toContain('"annexM":10.5');
  expect(await drawn(page)).toEqual(BOTH);
  await expect(page.locator('#distance-annexM-said')).toHaveText(NO_LINE);

  // Small emptied: its figure leaves the sketch, and its line goes.
  await type(page, 'smallM', '');
  const left = '"distances":{"largeM":7.5,"annexM":10.5}';
  await expect.poll(() => keptText(page)).toContain(left);
  expect(await drawn(page)).toEqual([['7.5 m', 1, 7]]);
  const last = await keptText(page);

  // From the front, in a window of its own, nothing of them is drawn, and the sketch is unchanged.
  const front = await context.newPage();
  const heardFront = listen(front, origin);
  await open(front, '/#front');
  expect([await drawn(front), await keptText(front)]).toEqual([[], last]);
  await expect(front.locator('#alarm')).toBeEmpty();

  // The 3D page has no button of them, and no panel.
  const three = await context.newPage();
  const heardThere = listen(three, origin);
  await open(three, '/3d.html');
  await expect(three.locator('#distances-open, #distances')).toHaveCount(0);
  expect(await three.evaluate<string>('typeof globalThis.distancePanel')).toBe('undefined');
  await expect(page.locator('#alarm')).toBeEmpty();
  expect([heard, heardFront, heardThere]).toEqual([[], [], []]);
});
