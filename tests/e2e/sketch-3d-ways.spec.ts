import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The ways of showing the sketch on the pad's 3D page, end to end, on the made-up plot with
// made-up sketches: the volumes and White, the sun's shadows on and off, and what a tab keeps of
// both. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of
// site.js. The real plot is in no part of this run: a case asks yes or no whether its page is on
// the made-up plot, before a matcher reads that page (directive 34). Of White a case asks what
// holds whatever White is built of: the way on the body, no colour in the picture, the shadows,
// and what the tab keeps - and it asks where the browser has WebGL.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so there is no way to pick';
// The solids of the made-up sketch, in whichever way: its things but two - ground, and a cut.
const THINGS = String((JSON.parse(SKETCH) as { things: unknown[] }).things.length - 2);
// One block of the test's own in the middle of the plot, 4 m by 4 m, from 814 m up to 818 m, in
// the pad's grey: in cells, as docs/sketch/pad-gotchas.md works them out for the made-up plot.
const BLOCK = { x: [40, 48], y: [26, 34], z: [16, 24], colour: 10 };
const ONE_BLOCK = `{"space":3,"things":[${JSON.stringify(BLOCK)}],"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
// Every picture that WebGL is asked for is counted: a picture begins with the canvas emptied. The
// map of the shadows is emptied too, and is no picture: it is no canvas.
const COUNT_PICTURES = `{
  globalThis.pictures = 0;
  const { prototype } = globalThis.WebGL2RenderingContext ?? {};
  const clear = prototype?.clear;
  if (clear) prototype.clear = function (...all) {
    if (this.getParameter(this.FRAMEBUFFER_BINDING) === null) globalThis.pictures += 1;
    return clear.apply(this, all);
  };
}`;
// What a picture of the stage shows, and against another of the same view: how many pixels have
// a colour, are earth and are white; how many pixels of earth are darker by far than the other's
// - shaded - and how many pixels lighter; and the middle of the white ones and of the shaded.
type Seen = Record<'coloured' | 'earth' | 'white' | 'shaded' | 'lighter', number> &
  Record<'whiteAt' | 'shadeAt', readonly [number, number]>;
// The pixels of a picture, four numbers a pixel, with its width.
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
// A colour is far from grey - one of red, green and blue far over another, as every colour of
// the pad's is but its grey and its ink - or it is green, as a see-through block and a tree are.
// Earth is a little redder than green and somewhat redder than blue, in light and in shade. White
// is what the sun falls on, of a white house: no backdrop is, the volumes' nor the sun's.
const seenIn = (png: Buffer, other: Buffer): string => `Promise.all(
  ['${png.toString('base64')}', '${other.toString('base64')}'].map(${PIXELS}),
).then(([{ data, width }, { data: there }]) => {
  const count = { coloured: 0, earth: 0, white: 0, shaded: 0, lighter: 0 };
  const sum = { white: [0, 0], shaded: [0, 0] };
  const add = (what, at) => {
    count[what] += 1;
    sum[what] = [sum[what][0] + ((at / 4) % width), sum[what][1] + Math.floor(at / 4 / width)];
  };
  for (let at = 0; at < data.length; at += 4) {
    const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
    const far = Math.max(red, green, blue) - Math.min(red, green, blue) > 60;
    if (far || (green > red + 8 && green > blue + 8)) count.coloured += 1;
    const earth = red > blue + 20 && red < blue + 70 && red >= green && red < green + 30;
    if (earth) count.earth += 1;
    if (Math.min(red, green, blue) > 240) add('white', at);
    const off = there[at] + there[at + 1] + there[at + 2] - red - green - blue;
    if (off < -60) count.lighter += 1;
    if (off > 60 && earth) add('shaded', at);
  }
  const middle = (what) => sum[what].map((total) => total / Math.max(count[what], 1));
  return { ...count, whiteAt: middle('white'), shadeAt: middle('shaded') };
})`;
// So many pixels of the ground at the least, where it is drawn; so many of a house, or of its
// shadow; and so few pixels apart, two pictures show one thing from one place.
const SOME_GROUND = 10_000;
const [SOME, SAME] = [1000, 200];

/** Has every case of a group open in a tab that has a sketch in the pad's store and never looked at the 3D view. */
function withSketch(sketch: string): void {
  test.use({
    storageState: async ({ baseURL }, use) => {
      const origin = new URL(baseURL ?? '').origin;
      const kept = [{ name: KEY, value: sketch }];
      await use({ cookies: [], origins: [{ origin, localStorage: kept }] });
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
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}

/** Over when the browser has shown so many frames more. */
const frames = (page: Page, count: number): Promise<unknown> =>
  page.evaluate(`new Promise((done) => {
    let left = ${count};
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
/** The stage as it shows once it has been drawn. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await frames(page, 6);
  return page.locator('#stage canvas').screenshot();
}
/** What a picture shows, and what it shows against another: against itself, where none is given. */
const seen = (page: Page, png: Buffer, other: Buffer = png): Promise<Seen> =>
  page.evaluate<Seen>(seenIn(png, other));

/** Says of the page that it shows a way, with shadows cast or not: on its body, and on its switch. */
async function showsWay(page: Page, way: string, shadows: 'on' | 'off'): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-way', way);
  await expect(page.locator('body')).toHaveAttribute('data-shadows', shadows);
  await expect(page.locator('#ways [aria-pressed="true"]')).toHaveAttribute('data-way', way);
}
const pick = (page: Page, way: string) => page.locator(`button[data-way=${way}]`).click();
const standAt = (page: Page, at: string) => page.locator(`#stands [data-stand="${at}"]`).click();

test.describe('with the made-up sketch', () => {
  withSketch(SKETCH);

  test('White is white on the earth, with shadows that can be switched off', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    test.skip(!(await open(page)), NO_STAGE);
    const body = page.locator('body');
    const shadows = page.getByLabel('Shadows');
    // The switch: the volumes, White and Materials, a button each. The volumes first, as the page
    // opens: in the colours the blocks were drawn in, with no shadow and no switch for one.
    await expect(page.locator('#ways button')).toHaveText(['Volumes', 'White', 'Materials']);
    await showsWay(page, 'volumes', 'off');
    await expect(shadows).toBeHidden();
    await expect(body).toHaveAttribute('data-solids', THINGS);
    const shown = await body.getAttribute('data-shown');
    const volumes = await picture(page);
    expect((await seen(page, volumes)).coloured).toBeGreaterThan(SOME);

    // White, by pointer: nothing in the picture has a colour, the house is white, and the ground
    // is earth. The shadows are on, and their switch names the sun, and no day and no hour.
    await pick(page, 'white');
    await showsWay(page, 'white', 'on');
    await expect(shadows).toBeChecked();
    const named = await page.locator('#shadows-row').getAttribute('title');
    expect(named).toMatch(/^The shadows of an early afternoon sun in the south-south-west:/);
    expect(named).not.toMatch(/\d/);
    const inWhite = await seen(page, await picture(page));
    expect(inWhite.coloured).toBe(0);
    expect(inWhite.white).toBeGreaterThan(SOME);
    expect(inWhite.earth).toBeGreaterThan(SOME_GROUND);

    // From above, where the ground lies open beside the house. The shadows off: the same house
    // without them. With them the ground beside the house was darker, and nothing was lighter.
    await standAt(page, 'above');
    const lit = await picture(page);
    await shadows.uncheck();
    await showsWay(page, 'white', 'off');
    const bare = await picture(page);
    const against = await seen(page, lit, bare);
    expect(against.shaded).toBeGreaterThan(SOME);
    expect(against.lighter).toBe(0);
    const inBare = await seen(page, bare);
    expect([inBare.coloured, against.coloured]).toEqual([0, 0]);
    expect(inBare.earth).toBeGreaterThan(SOME_GROUND);
    // The scene has its solids all the while, and as many of them show.
    await expect(body).toHaveAttribute('data-solids', THINGS);
    expect(await body.getAttribute('data-shown')).toBe(shown);
    // On again: the picture with the shadows, as it was, to the pixel.
    await shadows.check();
    await showsWay(page, 'white', 'on');
    expect((await picture(page)).equals(lit), 'the shadows are not as they were').toBe(true);

    // Back to the volumes and to the front: the picture the page opened with, to the pixel, and
    // no switch for a shadow. The sketch is as it was: the page wrote nothing of it.
    await pick(page, 'volumes');
    await showsWay(page, 'volumes', 'off');
    await expect(shadows).toBeHidden();
    await standAt(page, 'front');
    expect((await picture(page)).equals(volumes), 'the volumes are not as they were').toBe(true);
    expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
    expect(errors).toEqual([]);
  });

  test('a way picked and the shadows switched are one picture each', async ({ page }) => {
    await page.addInitScript(COUNT_PICTURES);
    test.skip(!(await open(page)), NO_STAGE);
    /** How many pictures were drawn, once the page is done - and half a second on it is no more. */
    const pictures = async (): Promise<number> => {
      await frames(page, 5);
      const done = await page.evaluate<number>('globalThis.pictures');
      await frames(page, 30);
      expect(await page.evaluate<number>('globalThis.pictures'), 'drawn in a loop').toBe(done);
      return done;
    };
    // One picture for White, one each for its shadows off and on, and one for the volumes.
    const opened = await pictures();
    expect(opened).toBeGreaterThan(0);
    const steps = [
      () => pick(page, 'white'),
      () => page.getByLabel('Shadows').uncheck(),
      () => page.getByLabel('Shadows').check(),
      () => pick(page, 'volumes'),
    ];
    const drawn: number[] = [];
    for (const step of steps) drawn.push(await step().then(pictures));
    expect(drawn.map((count) => count - opened)).toEqual([1, 2, 3, 4]);
  });

  test('a reload and a visit to the top view keep the way and the shadows', async ({ page }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    await standAt(page, 'above');
    await page.getByLabel('Shadows').uncheck();
    const left = await picture(page);
    const asItWas = async (shadows: 'on' | 'off', was: Buffer): Promise<void> => {
      await expect(page.locator('body')).toHaveAttribute('data-stage', 'drawn');
      await showsWay(page, 'white', shadows);
      await expect(page.getByLabel('Shadows')).toBeChecked({ checked: shadows === 'on' });
      const now = await picture(page);
      const [apart, back] = [await seen(page, now, was), await seen(page, was, now)];
      expect(apart.lighter + back.lighter).toBeLessThan(SAME);
      expect(apart.coloured).toBe(0);
    };
    // White, from above, with its shadows off: so it is after a reload, and after a visit.
    await page.reload();
    await asItWas('off', left);
    await page.getByRole('link', { name: 'Top view' }).click();
    await expect(page).toHaveTitle('Top view — sketch pad');
    await page.keyboard.press('6');
    await expect(page).toHaveTitle('3D — sketch pad');
    await asItWas('off', left);
    // And with the shadows on, which darken the ground: kept so too.
    await page.getByLabel('Shadows').check();
    const lit = await picture(page);
    expect((await seen(page, lit, left)).shaded).toBeGreaterThan(SOME);
    await page.reload();
    await asItWas('on', lit);
  });

  test('where the browser gives no WebGL, neither switch shows', async ({ page }) => {
    await page.addInitScript(NO_WEBGL);
    expect(await open(page)).toBe(false);
    await expect(page.locator('#ways')).toBeHidden();
    await expect(page.locator('#shadows-row')).toBeHidden();
    await expect(page.locator('#ways button')).toHaveCount(0);
    expect(await page.locator('body').getAttribute('data-way')).toBeNull();
    expect(await page.locator('body').getAttribute('data-shadows')).toBeNull();
  });
});

test.describe('with one block in the middle of the plot', () => {
  withSketch(ONE_BLOCK);

  test('from above, a shadow lies on the side away from the sun', async ({ page }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    await standAt(page, 'above');
    const lit = await picture(page);
    await page.getByLabel('Shadows').uncheck();
    await expect(page.locator('body')).toHaveAttribute('data-shadows', 'off');
    const { shaded, whiteAt, shadeAt, white } = await seen(page, lit, await picture(page));
    expect(white).toBeGreaterThan(SOME);
    expect(shaded).toBeGreaterThan(SOME);
    // From above the plot's x runs to the right and its y up the picture, as in the top view. The
    // made-up plot runs down towards 232 degrees and the sun stands at 200: to the right, and 32
    // degrees up. So the shadow lies to the left of the roof, and down: a quarter as far or more.
    const left = whiteAt[0] - shadeAt[0];
    expect(left, 'the shadow lies to the left').toBeGreaterThan(40);
    expect(shadeAt[1] - whiteAt[1], 'the shadow lies down').toBeGreaterThan(left / 4);
  });
});
