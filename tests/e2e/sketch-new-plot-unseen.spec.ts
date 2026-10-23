import { clickAt, expect, openNear, targetOf, test, viewOf, wrongOf } from './sketch-own-pad';
import { shownAt } from './sketch-cadastre';

// A corner set where a picture of the map did not come (story ST-031, task T-031.7): moved here
// from sketch-new-plot-made.spec.ts, which had no room for it once the plot was made in the page
// (T-041.3). The case has a pad and a stand-in of its own (sketch-own-pad.ts).

const FAR = 'Come nearer to mark a corner: here a pixel of the map is more than half a metre.';
const NO_PICTURE =
  "A picture of the map did not come: swisstopo's map service does not answer, or answered what is no picture. What shows, goes on showing.";

test('a picture of the map that does not come: a click sets a corner all the same', async ({
  pad,
}) => {
  // Two pictures are cut off by the case: the one that the first corner lies in at a quarter of
  // a metre a pixel, and the one at a metre a pixel - each of the layer that shows there.
  const page = await openNear(pad, 26);
  for (const [level, column, row] of [
    [27, 2812, 2343],
    [25, 703, 585],
  ] as const)
    await page.route(`**${targetOf(shownAt(level), level, column, row)}`, (route) => route.abort());
  const [said, corners] = [page.locator('#said'), page.locator('#corners-said')];
  await page.keyboard.press('+');
  await expect(page.locator('body')).toHaveAttribute('data-level', '27');
  await expect(said).toHaveText(NO_PICTURE);
  const lacks = async (): Promise<number> =>
    (await viewOf(page)).pictures - (await viewOf(page)).came;
  await expect.poll(lacks).toBe(1);
  // What the map has, it goes on showing, and a click sets a corner where it shows nothing too.
  await clickAt(page, 0, 0, 80, 0, 0, 80);
  await expect(corners).toHaveText('3 corners, 200 m².');
  await expect(said).toHaveText(NO_PICTURE);
  // From afar both are said: to come nearer, and that a picture did not come.
  await page.keyboard.press('-');
  await page.keyboard.press('-');
  await expect(page.locator('body')).toHaveAttribute('data-level', '25');
  await expect(said).toHaveText(NO_PICTURE);
  await clickAt(page, 200, 0);
  await expect(said).toHaveText(`${FAR} ${NO_PICTURE}`);
  await expect(corners).toHaveText('3 corners, 200 m².');
  expect(await wrongOf(pad, 2)).toEqual(Array(2).fill('Failed to load resource: net::ERR_FAILED'));
});
