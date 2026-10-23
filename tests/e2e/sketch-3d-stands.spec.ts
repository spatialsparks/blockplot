import { expect, test, type Page } from '@playwright/test';

// Where the sketch pad's 3D view stands, what a tab keeps of it, and its ground as a hill, end to
// end, on the made-up plot with made-up sketches: `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34). Every case here looks at pictures of the stage, but one: which stand is marked
// as chosen, as the view is put there and moved by hand, which no picture settles. Each asks
// where the browser has WebGL.

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no picture to look at';
/** A sketch of some blocks, as the pad keeps it. */
const sketchOf = (things: readonly object[]): string =>
  JSON.stringify({ space: 3, things, floors: [], notes: [], on: {}, show: { top: {} } });
// On the made-up plot a column is 2 * (x + 4), a row of the top view 2 * (28 - y) and a row of a
// standing view 2 * (826 - height); the ground lies at 820 m less 0.2 m a metre down the plot and
// 0.04 m a metre across it, from y = 28 (docs/sketch/pad-gotchas.md). 1 is the pad's red, 6 its
// blue, 10 its grey.
// Two blocks, 3 m by 3 m and 4 m high. A red one uphill and at the larger y, from x = 11 and
// y = 15 on, on a floor at 816 m: to the left and further up in the top view. A blue one
// downhill of it and at the smaller y, from x = 21 and y = 7 on, on a floor at 813 m.
const MARKED = sketchOf([
  { x: [30, 36], y: [20, 26], z: [12, 20], colour: 1 },
  { x: [50, 56], y: [36, 42], z: [18, 26], colour: 6 },
]);
// A grey house that stands in the slope, from 814 m up to 819 m; and uphill of it a red block
// of 4 m by 4 m that lies wholly under the ground, from 812 m up to 814 m. The ground over it
// is lowest at its downhill corner, x = 12 and y = 11: 820 - 3.2 - 0.68 = 816.12 m, 2 m over it.
const BURIED = sketchOf([
  { x: [40, 56], y: [24, 36], z: [14, 24], colour: 10 },
  { x: [24, 32], y: [26, 34], z: [24, 28], colour: 1 },
]);

/** What a picture of the stage shows of a red and a blue block, and of the ground. */
interface Seen {
  /** How many pixels are warm - red - and how many earth. */
  readonly warm: number;
  readonly earth: number;
  /** The middle of the warm pixels and of the blue ones, in pixels from the picture's top left. */
  readonly warmAt: readonly [number, number];
  readonly blueAt: readonly [number, number];
  /** The box around the warm and the blue pixels - left, top, right, bottom - and the picture's size. */
  readonly box: readonly [number, number, number, number];
  readonly size: readonly [number, number];
}
// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// The pixels of a picture, four numbers a pixel, with its width and its height.
const PIXELS = `(png) => new Promise((done, failed) => {
  const picture = new Image();
  picture.onerror = () => failed(new Error('the picture did not load'));
  picture.onload = () => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [picture.width, picture.height];
    const pen = canvas.getContext('2d');
    pen.drawImage(picture, 0, 0);
    done(pen.getImageData(0, 0, canvas.width, canvas.height));
  };
  picture.src = 'data:image/png;base64,' + png;
})`;
const pixelsOf = (png: Buffer): string => `(${PIXELS})('${png.toString('base64')}')`;
// Warm is far redder than green and blue, blue far bluer than red and green. Earth is the
// ground's own colour, #cbbfa6, in light and in shade: of its red, some nine tenths in green and
// eight tenths in blue, however dark - a wall of the hill that faces away from the light is.
const seenIn = (png: Buffer): string => `${pixelsOf(png)}.then(({ data, width, height }) => {
  const count = { warm: 0, blue: 0, earth: 0 };
  const sum = { warm: [0, 0], blue: [0, 0] };
  const box = [width, height, -1, -1];
  for (let at = 0; at < data.length; at += 4) {
    const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
    const [x, y] = [(at / 4) % width, Math.floor(at / 4 / width)];
    const warm = red > green + 40 && red > blue + 40;
    const tint = warm ? 'warm' : blue > red + 40 && blue > green + 40 ? 'blue' : '';
    if (tint !== '') {
      count[tint] += 1;
      sum[tint] = [sum[tint][0] + x, sum[tint][1] + y];
      [box[0], box[1]] = [Math.min(box[0], x), Math.min(box[1], y)];
      [box[2], box[3]] = [Math.max(box[2], x), Math.max(box[3], y)];
    }
    const [greens, blues] = [green / red, blue / red];
    if (greens > 0.9 && greens <= 1 && blues > 0.75 && blues < 0.88) count.earth += 1;
  }
  const middle = (tint) => sum[tint].map((total) => total / Math.max(count[tint], 1));
  const [warmAt, blueAt] = [middle('warm'), middle('blue')];
  return { warm: count.warm, earth: count.earth, warmAt, blueAt, box, size: [width, height] };
})`;
// How many pixels of two pictures are not of one colour.
const differing = (one: Buffer, other: Buffer): string =>
  `Promise.all([${pixelsOf(one)}, ${pixelsOf(other)}]).then(([{ data: a }, { data: b }]) => {
  let count = Math.abs(a.length - b.length);
  for (let at = 0; at < Math.min(a.length, b.length); at += 4) {
    const off = [0, 1, 2].reduce((sum, part) => sum + Math.abs(a[at + part] - b[at + part]), 0);
    if (off > 24) count += 1;
  }
  return count;
})`;
// So many pixels of the ground at the least, where it is drawn; so few pixels apart, two pictures
// show one thing from one place; and so many apart, they do not.
const SOME_GROUND = 10_000;
const [SAME, OTHER] = [200, 20_000];

/**
 * Has every case of a group open in a tab that has a sketch in the pad's store and never looked
 * at the 3D view. The sketch is there before a page loads: no page of the pad had to put it
 * there, and so none kept where it was looking.
 */
function withSketch(sketch: string): void {
  test.use({
    storageState: async ({ baseURL }, use) => {
      const origin = new URL(baseURL ?? '').origin;
      await use({
        cookies: [],
        origins: [{ origin, localStorage: [{ name: KEY, value: sketch }] }],
      });
    },
  });
}

/** Opens the 3D page, fails unless it is on the made-up plot, and says whether its stage is drawn. */
async function open(page: Page): Promise<boolean> {
  await page.goto('/3d.html');
  // Asked yes or no, before any matcher reads the page.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  await expect(page.locator('body')).toHaveAttribute('data-solids', '2');
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}

/** The stage as it shows once it has been drawn: over when the browser has shown some frames more. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
  return page.locator('#stage canvas').screenshot();
}
const look = async (page: Page): Promise<Seen> => page.evaluate<Seen>(seenIn(await picture(page)));

/** Turns the view by a drag of the pointer over the stage. */
async function drag(page: Page, from: [number, number], to: [number, number]): Promise<void> {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(...to, { steps: 8 });
  await page.mouse.up();
}

test.describe('with a red block uphill and a blue one downhill', () => {
  withSketch(MARKED);

  test('each stand, and the view as it opens, has the house in view and little else, unmirrored; Above lies as the top view does', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    // A side is named by the wind it is seen from, as the pad names its slices: on the made-up
    // plot the side view is seen from the north-west (tests/e2e/sketch-3d.spec.ts).
    const names = ['Front', 'Back', 'North-west', 'South-east', 'Above'];
    await expect(page.locator('#stands button')).toHaveText(names);
    const opened = await picture(page);
    await drag(page, [540, 400], [760, 330]);
    expect((await picture(page)).equals(opened), 'a drag did not turn the view').toBe(false);

    // Where the red block shows from the blue one, by hand. From the front y runs to the right,
    // so red is on the right; from the back it is on the left. From the left x runs to the right,
    // as in the pad's side view, so red is on the left; from the right it is on the right. From
    // above it is on the left and further up, as in the top view. Red stands further up the
    // hill: where it is the further one too - from the front, and from the left - it shows
    // higher. Where it is the nearer one, it shows about as high as blue, and nothing is asked.
    const stands = [
      { stand: 'front', onLeft: false, higher: true },
      { stand: 'back', onLeft: true, higher: null },
      { stand: 'left', onLeft: true, higher: true },
      { stand: 'right', onLeft: false, higher: null },
      { stand: 'above', onLeft: true, higher: true },
    ];
    for (const { stand, onLeft, higher } of stands) {
      await page.locator(`#stands [data-stand="${stand}"]`).click();
      const shot = await picture(page);
      const { warmAt, blueAt, box, size } = await page.evaluate<Seen>(seenIn(shot));
      expect(warmAt[0] < blueAt[0], `${stand}: red on the left of blue`).toBe(onLeft);
      if (higher !== null) expect(warmAt[1] < blueAt[1], `${stand}: red above blue`).toBe(higher);
      // The house is in view, whole: no part of it touches an edge of the picture. And little
      // else is: the two blocks, at two ends of the house, are more than three fifths of the
      // picture apart, across it or up it. A ball around the house would leave them half of it.
      const [left, top, right, bottom] = box;
      const [width, height] = size;
      const taken = Math.max((right - left) / width, (bottom - top) / height);
      expect(Math.min(left, top, width - 1 - right, height - 1 - bottom), stand).toBeGreaterThan(2);
      expect(taken, `${stand}: how much of the picture the house takes`).toBeGreaterThan(0.6);
      // The view opened at the front: the stand shows the picture the page opened with.
      if (stand === 'front') expect(shot.equals(opened), 'the view did not open there').toBe(true);
    }
  });

  test('the stand the view is at is marked as chosen, from the page opened anew until a drag moves the view', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    /** Which stand is marked: the one named, alone, with the ink of the way that is - or none. */
    const marked = async (chosen: string | null): Promise<void> => {
      for (const stand of ['front', 'back', 'left', 'right', 'above']) {
        const one = page.locator(`#stands [data-stand="${stand}"]`);
        await expect(one, stand).toHaveAttribute('aria-pressed', String(stand === chosen));
      }
      if (chosen === null) return;
      const ink = `(one) => getComputedStyle(one).backgroundColor`;
      const [stood, way] = ['#stands [aria-pressed="true"]', '#ways [aria-pressed="true"]'];
      expect(await page.locator(stood).evaluate(ink)).toBe(await page.locator(way).evaluate(ink));
    };
    // Opened anew, with no look kept for the tab: the view is put at the front, and Front is marked.
    await marked('front');
    await page.locator('#stands [data-stand="back"]').click();
    await marked('back');
    // A click on the stage that moves nothing leaves the mark; a drag moves the view, and none is.
    await page.locator('#stage canvas').click();
    await marked('back');
    await drag(page, [540, 400], [760, 330]);
    await marked(null);
    await page.locator('#stands [data-stand="above"]').click();
    await marked('above');
  });

  test('after a reload, and after a visit to the top view and back, the level, the ground and the direction of view are as they were', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    const body = page.locator('body');
    const opened = await picture(page);
    // Turned, cut at the lower level - the blue block's, where the red one is gone - and the
    // ground off: another picture than the page opened with.
    await drag(page, [540, 400], [760, 330]);
    await page.getByRole('button', { name: 'Level 813 m' }).click();
    await page.getByLabel('Ground').uncheck();
    const left = await picture(page);
    expect(await page.evaluate<number>(differing(opened, left))).toBeGreaterThan(OTHER);
    const asItWas = async (): Promise<void> => {
      await expect(body).toHaveAttribute('data-stage', 'drawn');
      await expect(body).toHaveAttribute('data-level', '813');
      await expect(body).toHaveAttribute('data-shown', '1');
      await expect(body).toHaveAttribute('data-ground', 'off');
      await expect(page.locator('#levels [aria-pressed="true"]')).toHaveText(['Level 813 m']);
      await expect(page.getByLabel('Ground')).not.toBeChecked();
      expect(await page.evaluate<number>(differing(left, await picture(page)))).toBeLessThan(SAME);
    };

    await page.reload();
    await asItWas();
    // To the top view, where a colour is picked - the Block tool, in blue - and back by the sixth
    // key: the 3D view is as it was - and so is the pad, whose tab kept its tool and its colour.
    await page.getByRole('link', { name: 'Top view' }).click();
    await expect(page).toHaveTitle('Top view — sketch pad');
    await page.locator('#colours-open').click();
    await page.locator('#colours [aria-label="blue"]').click();
    await page.keyboard.press('6');
    await expect(page).toHaveTitle('3D — sketch pad');
    await asItWas();
    await page.keyboard.press('1');
    await expect(page).toHaveTitle('Top view — sketch pad');
    const blue = page.getByRole('button', { name: 'blue', exact: true });
    await expect(blue).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('with a red block that lies wholly under the ground', () => {
  withSketch(BURIED);

  test('with the ground on, the block shows from no side, nor from level with the house; with it off, it shows', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    for (const stand of ['front', 'back', 'left', 'right']) {
      // From the station, which looks a little down on the house: the ground beside the block
      // hides it. Then from level with the house, as far down as the view turns, where the eye
      // is lower than the ground at the edge of the paper: the hill has sides, and they hide it.
      await page.locator(`#stands [data-stand="${stand}"]`).click();
      const down = await look(page);
      expect(down.warm, `from the ${stand}`).toBe(0);
      await drag(page, [540, 620], [540, 320]);
      const level = await look(page);
      expect(level.warm, `from the ${stand}, level with the house`).toBe(0);
      expect(level.earth, `from the ${stand}, level with the house`).toBeGreaterThan(SOME_GROUND);
      expect(level).not.toEqual(down);
    }
    // With the ground off, there it is.
    await page.getByLabel('Ground').uncheck();
    await expect(page.locator('body')).toHaveAttribute('data-ground', 'off');
    expect((await look(page)).warm).toBeGreaterThan(1000);
  });
});
