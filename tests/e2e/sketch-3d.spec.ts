import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The sketch pad's 3D page, end to end, on the made-up plot: `pnpm sketch --demo` serves the pad
// as files, and its page puts tools/sketch/demo-site.js in the place of site.js, and three.js out of the pad's own
// node_modules. The real plot is in no part of this run: a case asks yes or no whether its page
// is on the made-up plot, before a matcher reads that page (directive 34).

const fromRoot = (file: string): string =>
  readFileSync(fileURLToPath(new URL(`../../${file}`, import.meta.url)), 'utf8');
// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = fromRoot('tests/__fixtures__/sketch/made-up.json');
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
// How many solids the 3D page says its scene has: a thing of the made-up sketch each, but for
// the last two - its lawn, which is ground, and its cut: each the hill where it lies, no solid.
const THINGS = String((JSON.parse(SKETCH) as { things: unknown[] }).things.length - 2);
const PLOT = 'Made-up hillside plot';
// three.js's revision is the middle figure of its version: the pad's manifest names 0.186.1,
// and the page must have loaded revision 186 - the one on this machine.
const manifest = JSON.parse(fromRoot('tools/sketch/package.json')) as {
  dependencies: { three: string };
};
const [, REVISION = ''] = manifest.dependencies.three.split('.');
const SWITCH = ['Top view', 'Side view', 'Other side', 'Front view', 'Back view', '3D', 'Info'];
// What the page's body says of its stage, once it knows; and what the page says in words where
// the stage is drawn with no sketch on it, and where the browser gives no WebGL.
const DRAWN_OR_NONE = /^(drawn|none)$/;
const NOTHING_YET = /^Nothing is drawn yet/;
const NO_WEBGL_SAID = /gives the page no WebGL/;

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
// Every drawing that WebGL is asked for is counted: a stage that draws in a loop keeps counting.
const COUNT_DRAWINGS = `{
  globalThis.drawings = 0;
  const { prototype } = globalThis.WebGL2RenderingContext ?? {};
  for (const name of prototype ? ['drawArrays', 'drawElements'] : []) {
    const draw = prototype[name];
    prototype[name] = function (...all) {
      globalThis.drawings += 1;
      return draw.apply(this, all);
    };
  }
}`;
// The canvas's own pixels, and the size of its place on the page: a pixel each, in these tests.
const SIZES = `['#stage canvas', '#stage'].map((one) => document.querySelector(one))
  .map((one) => [one.width ?? one.clientWidth, one.height ?? one.clientHeight])`;

interface Seen {
  /** Every error of the console, and every error no script caught. */
  readonly errors: string[];
  /** Every request to another origin than the page's own. */
  readonly elsewhere: string[];
  /** The path of every request to the page's own origin. */
  readonly own: string[];
}

/** What goes wrong in the page and what it asks for, and of whom, heard from before it loads. */
function watch(page: Page, baseURL: string | undefined): Seen {
  const origin = new URL(baseURL ?? '').origin;
  const seen: Seen = { errors: [], elsewhere: [], own: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') seen.errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    seen.errors.push(error.message);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === origin) seen.own.push(url.pathname);
    else if (url.protocol !== 'data:') seen.elsewhere.push(request.url());
  });
  return seen;
}

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
}

test('the 3D page opens, with three.js from the pad alone', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL);
  await open(page, '/3d.html');
  await page.waitForLoadState('networkidle');

  // three.js is loaded, and the stage is drawn - or the browser gives no WebGL, and none is: a
  // canvas where it is drawn, and none where it is not. No sketch is kept here, so the scene has
  // no solid, and the page says in words which of the two it is, never both and never neither:
  // that nothing is drawn yet, over a stage with the ground alone - or why nothing can be drawn.
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-three', REVISION);
  await expect(body).toHaveAttribute('data-stage', DRAWN_OR_NONE);
  await expect(body).toHaveAttribute('data-solids', '0');
  const drawn = (await body.getAttribute('data-stage')) === 'drawn';
  await expect(page.locator('#stage canvas')).toHaveCount(drawn ? 1 : 0);
  await expect(page.locator('#said')).toBeVisible();
  await expect(page.locator('#said')).toHaveText(drawn ? NOTHING_YET : NO_WEBGL_SAID);
  await expect(page).toHaveTitle('3D — sketch pad');
  await expect(page.locator('#title')).toHaveText(`${PLOT}, 644 m²`);
  // The page keeps nothing in the browser as it opens: no sketch was there, and none is now.
  expect(await page.evaluate<number>('localStorage.length')).toBe(0);
  // three.js came from the pad's own server, and the page asked nobody else for anything.
  expect(seen.own).toContain('/three/build/three.module.js');
  expect(seen.own).toContain('/three/examples/jsm/controls/OrbitControls.js');
  expect(seen.elsewhere).toEqual([]);
  expect(seen.errors).toEqual([]);

  // And its policy refuses a connection - asked of the pad itself, so that a request would stay
  // on this machine were the policy gone.
  const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(policy).toHaveAttribute('content', "connect-src 'none'");
  const asked = `fetch('/3d.html').then(() => 'answered', () => 'refused')`;
  expect(await page.evaluate<string>(asked)).toBe('refused');
});

test('without WebGL the page says so, and the five views work', async ({ page, baseURL }) => {
  await page.addInitScript(NO_WEBGL);
  const seen = watch(page, baseURL);
  await open(page, '/3d.html');

  await expect(page.locator('body')).toHaveAttribute('data-stage', 'none');
  await expect(page.locator('body')).toHaveAttribute('data-three', REVISION);
  await expect(page.locator('#said')).toBeVisible();
  await expect(page.locator('#said')).toHaveText(NO_WEBGL_SAID);
  await expect(page.locator('#stage canvas')).toHaveCount(0);

  await page.getByRole('link', { name: 'Top view' }).click();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expect(page.locator('#alarm')).toBeEmpty();
  // Said in words, and not as an error: three.js was not left to find it out.
  expect(seen.errors).toEqual([]);
});

test('where three.js does not come, the page says that the view did not load', async ({ page }) => {
  // As the pad's server answers where three.js is not installed. Answered here, in the browser.
  await page.route('**/three/**', (route) => route.fulfill({ status: 404, body: 'No such file.' }));
  await open(page, '/3d.html');

  await expect(page.locator('body')).toHaveAttribute('data-stage', 'none');
  await expect(page.locator('#said')).toBeVisible();
  await expect(page.locator('#said')).toHaveText(/did not load/);
  expect(await page.locator('body').getAttribute('data-three')).toBeNull();
  // The switch is the pad's own, and needs nothing of three.js.
  await expect(page.locator('#views a')).toHaveText(SWITCH);
});

test('the switch has seven entries, and the keys 1 to 7 and V go round them', async ({ page }) => {
  const current = page.locator('#views a[aria-current]');
  await open(page, '/#top');
  await expect(page.locator('#views a')).toHaveText(SWITCH);
  await expect(current).toHaveText('Top view');

  // The sixth key opens the sixth view, a page of its own, and the seventh the seventh, another;
  // from there the first leads back.
  await page.keyboard.press('6');
  await expect(page).toHaveTitle('3D — sketch pad');
  await expect(page).toHaveURL(/\/3d\.html$/);
  await expect(page.locator('#views a')).toHaveText(SWITCH);
  await expect(current).toHaveText('3D');
  await page.keyboard.press('7');
  await expect(page).toHaveTitle('Info — sketch pad');
  await expect(page).toHaveURL(/\/info\.html$/);
  await expect(current).toHaveText('Info');
  await page.keyboard.press('1');
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expect(page).toHaveURL(/\/index\.html#top$/);
  // V goes round all seven: from the fifth to the sixth, from the sixth to the seventh, and from
  // the seventh to the first.
  await page.keyboard.press('5');
  await expect(page).toHaveTitle('Back view — sketch pad');
  await page.keyboard.press('v');
  await expect(page).toHaveTitle('3D — sketch pad');
  await page.keyboard.press('v');
  await expect(page).toHaveTitle('Info — sketch pad');
  await page.keyboard.press('v');
  await expect(page).toHaveTitle('Top view — sketch pad');
  // And by the pointer: to 3D, and from there to a slice, which says where it is seen from.
  await page.getByRole('link', { name: '3D' }).click();
  await expect(page).toHaveTitle('3D — sketch pad');
  await page.getByRole('link', { name: 'Side view' }).click();
  await expect(page).toHaveTitle('Side view — sketch pad');
  await expect(page.locator('#title')).toHaveText(
    'A slice along the plot, seen from the north-west',
  );
  await expect(current).toHaveText('Side view');
});

test('the 3D page writes nothing of the sketch unasked: "Top view" shows it as it was', async ({
  page,
}) => {
  const kept = (): Promise<string | null> =>
    page.evaluate<string | null>(`localStorage.getItem(${STORE})`);
  // Put into the store once, by a page of the pad: a script that ran before every load would
  // put the sketch back each time, and hide a page that had written over it.
  await open(page, '/3d.html');
  await page.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(SKETCH)})`);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-stage', DRAWN_OR_NONE);
  expect(await kept()).toBe(SKETCH);

  // In the pad: the levels of the made-up sketch, as tests/e2e/sketch.spec.ts works them out.
  await page.getByRole('link', { name: 'Top view' }).click();
  await expect(page).toHaveTitle('Top view — sketch pad');
  const levels = ['Level 817 m', 'Level 814 m', 'Level 812 m', 'Ground'];
  await expect(page.locator('#layers li button:first-child')).toHaveText(levels);
  expect(await kept()).toBe(SKETCH);
});

test('the stage draws when something changed, and never in a loop', async ({ page }) => {
  // With the made-up sketch on the stage: its solids, the ground and the outline are what is
  // drawn, and counted.
  await page.addInitScript(COUNT_DRAWINGS);
  await page.addInitScript(`localStorage.setItem(${STORE}, ${JSON.stringify(SKETCH)})`);
  await open(page, '/3d.html');
  await expect(page.locator('body')).toHaveAttribute('data-stage', DRAWN_OR_NONE);
  await expect(page.locator('body')).toHaveAttribute('data-solids', THINGS);
  const stage = await page.locator('body').getAttribute('data-stage');
  test.skip(stage === 'none', 'this browser gives no WebGL: there is no drawing to count');

  /** Over when the browser has shown so many frames more. */
  const frames = (count: number): Promise<unknown> =>
    page.evaluate(`new Promise((done) => {
      let left = ${count};
      const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
      frame();
    })`);
  /** How often WebGL was asked to draw, once it is done - and half a second on it is no more. */
  const drawings = async (): Promise<number> => {
    await frames(5);
    const done = await page.evaluate<number>('globalThis.drawings');
    await frames(30);
    expect(await page.evaluate<number>('globalThis.drawings'), 'drawn in a loop').toBe(done);
    return done;
  };
  const picture = (): Promise<Buffer> => page.locator('#stage canvas').screenshot();

  const [opened, first] = [await drawings(), await picture()];
  expect(opened).toBeGreaterThan(0);
  // A drag is drawn, and shows another picture: the view turned.
  await page.mouse.move(640, 400);
  await page.mouse.down();
  await page.mouse.move(840, 360, { steps: 8 });
  await page.mouse.up();
  const [turned, second] = [await drawings(), await picture()];
  expect(turned).toBeGreaterThan(opened);
  expect(second.equals(first), 'a drag did not turn the view').toBe(false);
  // So is a turn of the wheel.
  await page.mouse.wheel(0, -400);
  const [moved, third] = [await drawings(), await picture()];
  expect(moved).toBeGreaterThan(turned);
  expect(third.equals(second), 'the wheel did not move the view').toBe(false);
  // And a window of another size: the canvas has the size of its place, to the pixel - all of
  // the window's width that the levels beside the stage leave.
  await page.setViewportSize({ width: 900, height: 620 });
  expect(await drawings()).toBeGreaterThan(moved);
  const [canvas, place] = await page.evaluate<[number[], number[]]>(SIZES);
  const beside = await page.locator('#side').boundingBox();
  expect(canvas).toEqual(place);
  expect(beside?.width).toBeGreaterThan(0);
  expect(place[0]).toBe(900 - (beside?.width ?? 0));
});
