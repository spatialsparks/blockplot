import type { Page } from '@playwright/test';

// Where a place of the pad's paper lies, for the browser tests that point at one or read the
// picture there (story ST-042). The paper has no edge: the canvas is the window, and what it
// shows is `globalThis.zoom` (tools/sketch/zoom.js) - `px` CSS pixels a cell, and the place
// `left`, `top` at the canvas's top left corner. A place is `[column, row]` in cells as the view
// shows the paper - its columns counted from the left of the screen, also in a flipped view, as
// the tests always counted them. No test file, by its name.

/** A place of the paper, in cells, its columns as the screen shows them. */
export type Place = readonly [number, number];

/** What the window shows: so many CSS pixels a cell, the place at its corner, and the screen's pixels a CSS pixel. */
interface Shown {
  px: number;
  left: number;
  top: number;
  ratio: number;
}
const shown = (page: Page): Promise<Shown> =>
  page.evaluate<Shown>(`(({ px, left, top }) =>
    ({ px, left, top, ratio: globalThis.devicePixelRatio || 1 }))(globalThis.zoom)`);

/** Where on the page a place of the paper lies, in CSS pixels. */
export async function placeOf(page: Page, [column, row]: Place): Promise<[number, number]> {
  const box = await page.locator('#paper').boundingBox();
  if (box === null) throw new Error('the pad shows no paper');
  const { px, left, top } = await shown(page);
  return [box.x + (column - left) * px, box.y + (row - top) * px];
}

/** How many of the canvas's own pixels a cell is. */
export async function scaleOf(page: Page): Promise<number> {
  const { px, ratio } = await shown(page);
  return px * ratio;
}

/** The canvas's own pixel of a place of the paper, made whole by `whole` - down, unless told otherwise: where its picture is read. */
export async function pixelOf(
  page: Page,
  [column, row]: Place,
  whole: (pixel: number) => number = Math.floor,
): Promise<[number, number]> {
  const { px, left, top, ratio } = await shown(page);
  const scale = px * ratio;
  // The window's corner lies on a whole pixel of the canvas (tools/sketch/draw.js).
  const on = (at: number, from: number): number => whole(at * scale - Math.round(from * scale));
  return [on(column, left), on(row, top)];
}
