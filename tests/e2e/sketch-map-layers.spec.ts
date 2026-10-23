import { creditsOf, shownAt } from './sketch-cadastre';
import { FIRST, LAYERS, expect, expectPictures, openMap, rests, test } from './sketch-own-pad';
import type { Layer } from './sketch-own-pad';

// Which layer the map's page shows at each level near, end to end (story ST-031, task T-031.5;
// moved here whole from sketch-map.spec.ts by T-044.12): the national map, and from a metre a
// pixel the cadastral map in its place where the pad offers the cadastre - with the cantons'
// credit beside swisstopo's - and the aerial photo at the switch; where there is none, as in
// Blockplot, the national map to level 27 and the photo at 28. What shows where, and its
// credits, is sketch-cadastre.ts's: its statement says whether there is a cadastre. The case has
// a pad and a stand-in of its own (sketch-own-pad.ts): no test asks another machine. Page code
// is handed over as text: these tests are typed for Node, which has no `document`.

const MIDDLE = { e: FIRST.e, n: FIRST.n };

test('which layer shows at each level near, with its credits, and the photo at the switch', async ({
  pad,
}, testInfo) => {
  const page = await openMap(pad);
  const [credits, photo] = [page.locator('#credits span'), page.locator('#photo')];
  const shows = (layer: Layer): Promise<void> =>
    expect(page.locator('body')).toHaveAttribute('data-shows', layer);
  const named = async (layer: Layer): Promise<boolean> =>
    (await expectPictures(page, pad.standIn.origin)).every((target) =>
      target.includes(LAYERS[layer][0]),
    );
  // Nine levels nearer, at the middle: 1.5 m a pixel, and the national map still, with
  // swisstopo's credit alone.
  for (let level = 16; level <= 24; level += 1) await page.keyboard.press('+');
  expect(await rests(page, 24)).toMatchObject({ shows: shownAt(24), ...MIDDLE });
  await expect(credits).toHaveText(creditsOf(shownAt(24)));
  expect(await named(shownAt(24))).toBe(true);
  // A level nearer, a metre a pixel: the cadastral map shows in its place where there is a
  // cadastre, with its own credit beside swisstopo's - and no picture of the national map: one
  // layer at a time.
  await page.keyboard.press('+');
  expect(await rests(page, 25)).toMatchObject({ shows: shownAt(25), ...MIDDLE });
  await expect(credits).toHaveText(creditsOf(shownAt(25)));
  expect(await named(shownAt(25))).toBe(true);
  // The switch shows the aerial photo instead, near and from afar, and back.
  await photo.click();
  await shows(shownAt(25, true));
  await expect(photo).toHaveAttribute('aria-pressed', 'true');
  await rests(page, 25);
  await expect(credits).toHaveText(creditsOf(shownAt(25, true)));
  expect(await named(shownAt(25, true))).toBe(true);
  await page.keyboard.press('-');
  expect(await rests(page, 24)).toMatchObject({ shows: shownAt(24, true) });
  expect(await named(shownAt(24, true))).toBe(true);
  await photo.click();
  await shows(shownAt(24));
  await expect(photo).toHaveAttribute('aria-pressed', 'false');
  await rests(page, 24);
  expect(await named(shownAt(24))).toBe(true);
  // Half a metre a pixel: the layer of that level, with its credits - at the map's foot, and over
  // all else that lies on the map.
  await page.locator('#nearer').click();
  await page.locator('#nearer').click();
  expect(await rests(page, 26)).toMatchObject({ shows: shownAt(26), ...MIDDLE });
  await expect(credits).toHaveText(creditsOf(shownAt(26)));
  expect(await named(shownAt(26))).toBe(true);
  const over = await page.evaluate<boolean>(`(() => {
    const level = (part) => Number(getComputedStyle(part).zIndex) || 0;
    const [map, credits] = ['map', 'credits'].map((id) => document.getElementById(id));
    const [inner, outer] = [credits, map].map((part) => part.getBoundingClientRect());
    const others = Array.from(map.children).filter((part) => part !== credits).map(level);
    return level(credits) > Math.max(...others) && inner.bottom === outer.bottom && inner.left === outer.left;
  })()`);
  expect(over).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('near.png') });
  // And as near as the map goes: a tenth of a metre a pixel, level 28, and no level beyond it.
  for (let key = 0; key < 3; key += 1) await page.keyboard.press('+');
  expect(await rests(page, 28)).toMatchObject({ shows: shownAt(28), ...MIDDLE });
  await expectPictures(page, pad.standIn.origin);
});
