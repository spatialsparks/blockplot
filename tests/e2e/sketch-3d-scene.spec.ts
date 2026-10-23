import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The scene of the sketch on the pad's 3D page, end to end, on the made-up plot with made-up
// sketches: `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of
// site.js. The real plot is in no part of this run: a case asks yes or no whether its page is on
// the made-up plot, before a matcher reads that page (directive 34). What a case asks of a
// picture, it asks where the browser has WebGL; what the page says of its scene, everywhere.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
// How many solids the scene of the made-up sketch has: one for each of its things but the last
// two - the lawn, ground (story ST-027), and the cut (ST-028): the hill where each lies, no solid.
const THINGS = String((JSON.parse(SKETCH) as { things: unknown[] }).things.length - 2);
const PLOT = 'Made-up hillside plot';
const NOTHING_YET = /^Nothing is drawn yet/;
const NO_WEBGL_SAID = /gives the page no WebGL/;
const UNREADABLE = /cannot be read/;

/** A sketch of some things, as the pad keeps it. */
const sketchOf = (things: readonly object[]): string =>
  JSON.stringify({ space: 3, things, floors: [], notes: [], on: {}, show: { top: {} } });
// A red block, and downhill of it a larger one that stands before it for one who looks from the
// front: wider by 2 m on either side, 3 m higher and a metre deeper. `colour` is the larger
// one's: 4 is the pad's green, which is see-through, and 10 its grey.
const hidden = (colour: number): string =>
  sketchOf([
    { x: [40, 44], y: [28, 34], z: [20, 24], colour: 1 },
    { x: [44, 48], y: [24, 38], z: [14, 26], colour },
  ]);
// Kept, and no sketch: the pad knows no such kind of object.
const NO_SKETCH = sketchOf([{ kind: 'unicorn', x: 10, y: 10, floor: 'ground' }]);

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
// Every error that reaches the window. The browser tells a page so there, and not on its
// console, when a place changed its size while its observer spoke: a stage drawn a frame late.
const HEAR_ERRORS = `{
  globalThis.heard = [];
  globalThis.addEventListener('error', (event) => globalThis.heard.push(event.message));
}`;
// How many pixels of a picture are warm - red or orange, far redder than green and blue - how
// many blue, and how many earth: a little redder than green and somewhat redder than blue, as
// the ground is. The backdrop, the outline and a grey block are none of the three.
const tintsOf = (png: Buffer): string => `new Promise((done, failed) => {
  const picture = new Image();
  picture.onerror = () => failed(new Error('the picture did not load'));
  picture.onload = () => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [picture.width, picture.height];
    const pen = canvas.getContext('2d');
    pen.drawImage(picture, 0, 0);
    const { data } = pen.getImageData(0, 0, canvas.width, canvas.height);
    const tints = { warm: 0, blue: 0, earth: 0 };
    for (let at = 0; at < data.length; at += 4) {
      const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
      if (red > green + 40 && red > blue + 40) tints.warm += 1;
      if (blue > red + 40 && blue > green + 40) tints.blue += 1;
      if (red > blue + 20 && red < blue + 70 && red >= green && red < green + 30) tints.earth += 1;
    }
    done(tints);
  };
  picture.src = 'data:image/png;base64,${png.toString('base64')}';
})`;
interface Tints {
  readonly warm: number;
  readonly blue: number;
  readonly earth: number;
}
// So many pixels of the ground at the least, where it is drawn: a tenth of what it takes up.
const SOME_GROUND = 10_000;

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
}

/** Every error of the page's console, and every error no script caught, heard from now on. */
function errorsOf(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

/**
 * Opens the 3D page with a sketch in its store, and says whether its stage is drawn. The sketch
 * is put there once, by a page of the pad: `null` leaves the store empty.
 */
async function openWith(page: Page, sketch: string | null): Promise<boolean> {
  await open(page, '/3d.html');
  if (sketch !== null) {
    await page.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(sketch)})`);
    await page.reload();
  }
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
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

for (const webgl of [true, false]) {
  const where = webgl ? 'where the browser draws' : 'and so where it gives no WebGL';
  test(`the scene has no solid with no sketch, and one for each thing of the made-up sketch but its lawn and its cut, ${where}`, async ({
    page,
  }) => {
    if (!webgl) await page.addInitScript(NO_WEBGL);
    await page.addInitScript(HEAR_ERRORS);
    const errors = errorsOf(page);
    const [body, said] = [page.locator('body'), page.locator('#said')];

    // No sketch: no solid. Where the stage is drawn, the page says that nothing is drawn yet, on
    // a line of its own over the stage, which the canvas fills: the words cover nothing of it.
    // The line was there before the stage was drawn, so the stage had its size from the first.
    const bare = await openWith(page, null);
    expect(bare && !webgl, 'a stage was drawn without WebGL').toBe(false);
    await expect(body).toHaveAttribute('data-solids', '0');
    await expect(said).toHaveText(bare ? NOTHING_YET : NO_WEBGL_SAID);
    if (bare) {
      const [words, stage, canvas] = await Promise.all(
        ['#said', '#stage', '#stage canvas'].map((one) => page.locator(one).boundingBox()),
      );
      expect((words?.y ?? 0) + (words?.height ?? Infinity)).toBeLessThanOrEqual(stage?.y ?? 0);
      expect(canvas).toEqual(stage);
    }
    const ground = bare ? await picture(page) : null;
    expect(await page.evaluate<string[]>('globalThis.heard')).toEqual([]);

    // The made-up sketch: a solid for each of its things but the lawn and the cut, and nothing
    // left to say in words.
    const drawn = await openWith(page, SKETCH);
    await expect(body).toHaveAttribute('data-solids', THINGS);
    await expect(said).toBeVisible({ visible: !drawn });
    if (drawn && ground) {
      // With no sketch the ground was drawn, and nothing orange or blue on it; the day rooms
      // are orange, and the night rooms blue.
      const [before, after] = [
        await page.evaluate<Tints>(tintsOf(ground)),
        await page.evaluate<Tints>(tintsOf(await picture(page))),
      ];
      expect(before).toMatchObject({ warm: 0, blue: 0 });
      expect(before.earth).toBeGreaterThan(SOME_GROUND);
      expect(after.warm).toBeGreaterThan(100);
      expect(after.blue).toBeGreaterThan(100);
      expect(after.earth).toBeGreaterThan(SOME_GROUND);
    }
    // The page read the sketch and wrote nothing: it is kept as it was.
    expect(await page.evaluate<string | null>(`localStorage.getItem(${STORE})`)).toBe(SKETCH);
    expect(await page.evaluate<string[]>('globalThis.heard')).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('a green block is see-through, and a grey one is not: what stands behind it shows', async ({
  page,
}) => {
  // Behind a grey block the red one is hidden, from the front: nothing in the picture is red.
  const drawn = await openWith(page, hidden(10));
  test.skip(!drawn, 'this browser gives no WebGL: there is no picture to look at');
  await expect(page.locator('body')).toHaveAttribute('data-solids', '2');
  const behind = await page.evaluate<Tints>(tintsOf(await picture(page)));
  expect(behind).toMatchObject({ warm: 0, blue: 0 });

  // Behind a green one it shows: through the block, red.
  await openWith(page, hidden(4));
  await expect(page.locator('body')).toHaveAttribute('data-solids', '2');
  const through = await page.evaluate<Tints>(tintsOf(await picture(page)));
  expect(through.warm).toBeGreaterThan(200);
});

test('a change made in the pad in another window is drawn, with no reload and from where the view was looking', async ({
  page,
  context,
}) => {
  const errors = errorsOf(page);
  const [body, said] = [page.locator('body'), page.locator('#said')];
  const drawn = await openWith(page, null);
  await expect(body).toHaveAttribute('data-solids', '0');
  // A mark that a page loaded anew would not have.
  await page.evaluate('globalThis.stayed = true');

  // In another window, the pad: "Open file" takes the made-up sketch, as a stroke takes a block
  // - through the pad's one way to change the sketch, which keeps it at once.
  const pad = await context.newPage();
  await open(pad, '/#top');
  await pad.locator('#file').setInputFiles({
    name: 'made-up.json',
    mimeType: 'application/json',
    buffer: Buffer.from(SKETCH),
  });
  // The pad lists its three levels - the lawn's, at 812 m, is one of them there; the cut stands
  // on the day rooms', and makes none - and the ground.
  await expect(pad.locator('#layers li')).toHaveCount(4);
  // The 3D window has it: every solid, and nothing left to say.
  await expect(body).toHaveAttribute('data-solids', THINGS);
  await expect(said).toBeVisible({ visible: !drawn });

  // The view is turned, and shows another picture. Then the pad takes the change back and makes
  // it again: the scene goes and comes, and stands as it stood - seen from where the view was
  // looking, not from the front again.
  const front = drawn ? await picture(page) : null;
  if (drawn) {
    await page.mouse.move(640, 400);
    await page.mouse.down();
    await page.mouse.move(780, 380, { steps: 8 });
    await page.mouse.up();
  }
  const turned = drawn ? await picture(page) : null;
  await pad.getByRole('button', { name: 'Undo' }).click();
  await expect(body).toHaveAttribute('data-solids', '0');
  await expect(said).toHaveText(drawn ? NOTHING_YET : NO_WEBGL_SAID);
  await pad.getByRole('button', { name: 'Redo' }).click();
  await expect(body).toHaveAttribute('data-solids', THINGS);
  if (front && turned) {
    expect(turned.equals(front), 'a drag did not turn the view').toBe(false);
    expect((await picture(page)).equals(turned), 'the view did not stay where it was').toBe(true);
  }
  expect(await page.evaluate<boolean>('globalThis.stayed === true'), 'the page loaded anew').toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('a sketch that cannot be read: the page says so, draws the ground and leaves it as it is', async ({
  page,
}) => {
  const errors = errorsOf(page);
  const drawn = await openWith(page, NO_SKETCH);

  await expect(page.locator('body')).toHaveAttribute('data-solids', '0');
  await expect(page.locator('#said')).toBeVisible();
  await expect(page.locator('#said')).toHaveText(drawn ? UNREADABLE : NO_WEBGL_SAID);
  await expect(page.locator('#stage canvas')).toHaveCount(drawn ? 1 : 0);
  if (drawn) {
    // The ground is drawn, and nothing on it.
    const alone = await page.evaluate<Tints>(tintsOf(await picture(page)));
    expect(alone).toMatchObject({ warm: 0, blue: 0 });
    expect(alone.earth).toBeGreaterThan(SOME_GROUND);
  }
  expect(await page.evaluate<string | null>(`localStorage.getItem(${STORE})`)).toBe(NO_SKETCH);
  expect(errors).toEqual([]);
});
