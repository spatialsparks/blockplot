import type { Page } from '@playwright/test';
import { clickAt, expect, openNear, placeOf, rests, test } from './sketch-own-pad';

// A paper too large for the pad (story ST-042, task T-042.4): a plot of 991 m by 20 m, marked at
// half a metre a pixel with the map dragged between its corners, whose paper with 5 m around
// would be 1001 m long - one metre over the kilometre that the pad takes. Said beside the paper,
// refused at the press in the same sentence, with no order and nothing asked of the terrain. The
// case has a pad and a stand-in of its own (sketch-own-pad.ts).

const LARGE =
  'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.';

/**
 * The map dragged so many pixels right, in eight steps: from 10 pixels inside its far edge and
 * 200 over its middle, clear of every corner. The map is narrower than 991 pixels in a window of
 * 1440, and the pointer is the map's until it is up: the drag ends beside it.
 */
async function dragBy(page: Page, right: number): Promise<void> {
  const { x, y, wide, high } = await placeOf(page);
  const [from, up] = [right < 0 ? x + wide - 10 : x + 10, y + high / 2 - 200];
  await page.mouse.move(from, up);
  await page.mouse.down();
  await page.mouse.move(from + right, up, { steps: 8 });
  await page.mouse.up();
}

test('a paper of 1001 m is refused in words, and nothing is asked or written', async ({ pad }) => {
  const page = await openNear(pad, 26);
  const [paper, make, said] = [
    page.locator('#paper-said'),
    page.locator('#make'),
    page.locator('#make-said'),
  ];
  const orders: string[] = [];
  page.on('request', (request) => request.method() === 'POST' && orders.push(request.url()));
  await page.locator('#name').fill('Long');
  // At half a metre a pixel 991 m are 1982 pixels: a corner 480 pixels left of the middle; the
  // map dragged 991 pixels west twice, and two corners at the same pixels, 991 m east of it; the
  // map dragged back, and the last corner - a rectangle of 991 m by 20 m, in that order.
  await clickAt(page, -480, -20);
  for (const right of [-991, -991]) await dragBy(page, right);
  await clickAt(page, -480, -20, -480, 20);
  for (const right of [991, 991]) await dragBy(page, right);
  await rests(page, 26);
  await clickAt(page, -480, 20);
  // Its corners in LV95, as the page holds them; and no area, for its paper is none.
  const MARKED =
    '2599780.00,1200000.00 2600771.00,1200000.00 2600771.00,1200020.00 2599780.00,1200020.00';
  await expect(page.locator('body')).toHaveAttribute('data-marked', MARKED);
  await expect(page.locator('#corners-said')).toHaveText('4 corners.');
  await expect(paper).toHaveText(LARGE);
  await make.click();
  await expect(said).toHaveText(LARGE);
  await expect(make).toBeEnabled();
  // No order went, and the stand-in was asked nothing of the terrain: pictures and the one
  // search alone.
  expect(orders).toEqual([]);
  const heard = await pad.standIn.asked();
  expect(
    heard.filter(({ target }) => /^\/(api\/stac\/|ch\.swisstopo\.swissalti3d\/)/.test(target)),
  ).toEqual([]);
});
