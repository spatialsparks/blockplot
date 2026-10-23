import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf, type Place } from './sketch-paper';

// The story's main path, end to end (ST-042, T-042.3): a paper without edges, on the made-up plot
// from above, its sketch empty but for one level. The grid follows the zoom out - 0.5 m, then 1,
// 1, 2, 2 and 5 m; a block drawn on the 5 m grid wholly beyond the plot's paper, its 92 columns,
// is kept on whole cells of it; zoomed back in, the grid is the half metre again; "Zoom to fit"
// shows the plot's paper and the block together. The ground under the block is the height of the
// paper's downhill edge in the same row; in the side view the line under the paper says there is
// no measured ground there; the 3D page builds the block on ground that reaches past it. Then the
// made-up sketch opens as it did. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// No thing, and one level, on row 20 of a standing paper, drawn on: a block from above stands on it.
const EMPTY = {
  space: VERSION,
  things: [],
  floors: [20],
  notes: [],
  on: { top: 20 },
  show: { top: {} },
};
// The stroke, in cells of the top view's paper, and what the 5 m grid makes of it: from the 5 m
// line at or before its low corner to the one past its high corner (snap.check.js, by hand).
const [FROM, TO] = [
  [150.3, 20.4],
  [189.6, 39.7],
] as const;
const [ALONG, ACROSS] = [
  [148, 198],
  [16, 46],
] as const;
const MIDDLE = [(ALONG[0] + ALONG[1]) / 2, (ACROSS[0] + ACROSS[1]) / 2] as const;
// The grid as #smaller shows it, click after click from the first view's 8 px a cell.
const OUT = [1, 1, 2, 2, 5];
// How far past the paper's downhill edge the 3D page's ground reaches at the least: the block's
// far edge, column 198, lies (198 - 92) / 2 = 53 m past it.
const PAST = 53;

interface Box {
  x: number[];
  y: number[];
  z: [number, number];
}
const kept = (page: Page): Promise<Box[]> =>
  page.evaluate<Box[]>(`JSON.parse(localStorage.getItem(${KEY}) ?? '{"things":[]}').things`);
const shownGrid = (page: Page): Promise<number> => page.evaluate<number>('globalThis.grid.shown');

/** Fails unless the page is on the made-up plot: asked yes or no. */
async function expectMadeUpPlot(page: Page): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
}

/** Whether every place lies within the canvas, its edges within. */
async function inCanvas(page: Page, places: Place[]): Promise<boolean[]> {
  const box = await page.locator('#paper').boundingBox();
  if (box === null) throw new Error('the pad shows no paper');
  const within = ([x, y]: [number, number]) =>
    x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  return Promise.all(places.map(async (place) => within(await placeOf(page, place))));
}

test('the paper has no edge: a block drawn beyond the plot at 5 m, fitted, on flat ground in a slice and in 3D', async ({
  page,
  context,
}) => {
  const heard: string[] = [];
  context.on('weberror', (error) => void heard.push(error.error().message));
  const empty = JSON.stringify(JSON.stringify(EMPTY));
  await page.addInitScript(
    `if (localStorage.getItem(${KEY}) === null) localStorage.setItem(${KEY}, ${empty});`,
  );
  await page.goto('/#top');
  await expectMadeUpPlot(page);
  expect(await page.evaluate<number>('globalThis.zoom.px')).toBe(8);

  // Out: the grid follows the zoom, 0.5 m at first.
  expect(await shownGrid(page)).toBe(0.5);
  for (const step of OUT) {
    await page.locator('#smaller').click();
    expect(await shownGrid(page)).toBe(step);
  }
  // A block drawn by Block, its key, wholly beyond the plot's paper: on the 5 m grid, whole cells.
  const from = await placeOf(page, FROM);
  await page.mouse.move(...from);
  await page.keyboard.press('b');
  await page.mouse.down();
  await page.mouse.move(...(await placeOf(page, TO)), { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => kept(page)).toHaveLength(1);
  const [block] = await kept(page);
  expect([block?.x, block?.y]).toEqual([ALONG, ACROSS]);

  // In again, to the half metre; then Zoom to fit: the plot's paper and the block, corner by corner.
  for (let step = 0; step < OUT.length; step += 1) await page.locator('#larger').click();
  expect(await shownGrid(page)).toBe(0.5);
  await page.getByRole('button', { name: 'Zoom to fit' }).click();
  const [wide, rows] = await page.evaluate<[number, number]>('[paper.WIDE, paper.ROWS]');
  const corners: Place[] = [
    [0, 0],
    [wide, rows],
    [ALONG[0], ACROSS[0]],
    [ALONG[1], ACROSS[1]],
  ];
  expect(await inCanvas(page, corners)).toEqual([true, true, true, true]);

  // The ground under the block is the height of the paper's downhill edge in the same row.
  const [under, edge] = await page.evaluate<[number, number]>(
    `[paper.groundAt(${MIDDLE[0]}, ${MIDDLE[1]}), paper.realAt(paper.COLS, ${MIDDLE[1]})]`,
  );
  expect(wide).toBe(92);
  expect(under).toBe(edge);

  // In the side view, fitted, the pointer over the block: no measured ground there.
  const side = await context.newPage();
  await side.goto('/#side');
  await expectMadeUpPlot(side);
  await side.getByRole('button', { name: 'Zoom to fit' }).click();
  const [low, high] = block?.z ?? [0, 0];
  const column = await side.evaluate<number>(`paper.shown(${MIDDLE[0]})`);
  await side.mouse.move(...(await placeOf(side, [column, (low + high) / 2])));
  await expect(side.locator('#status')).toHaveText(/ — no measured ground here$/);

  // In 3D: one solid, on ground drawn past the block's far edge.
  const solid = await context.newPage();
  await solid.goto('/3d.html');
  await expectMadeUpPlot(solid);
  const body = solid.locator('body');
  await expect(body).toHaveAttribute('data-solids', '1');
  expect(Number(await body.getAttribute('data-beyond'))).toBeGreaterThanOrEqual(PAST);

  // The made-up sketch, opened in a tab of its own, shows as it did: 8 px a cell, its paper's top
  // left corner at the canvas's, and its text in the store as it was put there.
  await page.evaluate(`localStorage.setItem(${KEY}, ${JSON.stringify(SKETCH)})`);
  await Promise.all([page.close(), side.close(), solid.close()]);
  const again = await context.newPage();
  await again.goto('/#top');
  await expectMadeUpPlot(again);
  expect(await again.evaluate<number>('globalThis.zoom.px')).toBe(8);
  const canvas = await again.locator('#paper').boundingBox();
  expect(await placeOf(again, [0, 0])).toEqual([canvas?.x, canvas?.y]);
  expect(await again.evaluate<string | null>(`localStorage.getItem(${KEY})`)).toBe(SKETCH);
  expect(heard).toEqual([]);
});
