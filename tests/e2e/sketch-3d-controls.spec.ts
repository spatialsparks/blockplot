import { expect, test, type Page } from '@playwright/test';
import { golden, VERSION } from './sketch-golden';

// The controls of the sketch pad's 3D page, end to end, on the made-up plot with made-up
// sketches: the level the scene is cut at and the ground on or off, each with the count of the
// solids that show, and the level that a change of the sketch keeps. Where the view stands is
// sketch-3d-stands.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js
// in the place of site.js. The real plot is in no part of this run: a case asks yes or no whether
// its page is on the made-up plot, before a matcher reads that page (directive 34). The controls
// are there where there is a stage: what a case asks of them, it asks where the browser has
// WebGL.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = golden('made-up');
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so there are no controls';
/** A thing of a sketch: a box has `z`, its top and its floor as rows of a standing view, and may say what its block `is`, or the `category` that was picked for it; an object has the `floor` it stands on. */
interface Thing {
  readonly name?: string;
  readonly kind?: string;
  readonly z?: readonly [number, number];
  readonly floor?: number | 'ground';
  readonly is?: string;
  readonly category?: string;
}
const THINGS = (JSON.parse(SKETCH) as { things: Thing[] }).things;
// The lawn of the made-up sketch, as the file has it: its one block of ground, before the porch.
// And its ground cut, beside the day rooms: its one box that says a category (story ST-028).
const LAWN = { x: [58, 72], y: [24, 36], z: [24, 28], colour: 9, name: 'Lawn', is: 'ground' };
const DUG = { x: [30, 50], y: [10, 22], z: [18, 24], colour: 1, category: 'ground-cut' };
/** A sketch of some things, as the pad keeps it: of the version it writes - of version 6 at the least, for the house has a ground cut, whose box says the category that was picked for it. */
const sketchOf = (things: readonly object[]): string =>
  JSON.stringify({ space: VERSION, things, floors: [], notes: [], on: {}, show: { top: {} } });

/** A cut, as the page says it: its name in the list, and on the body its level and how many solids show. */
interface Cut {
  readonly name: string;
  readonly level: string;
  readonly shown: string;
}
// What the made-up sketch shows at each cut of the view, by hand (tests/__fixtures__/CLAUDE.md).
// It has 37 things: ten boxes and 27 objects. One box is its lawn, which is ground (story
// ST-027), and one its ground cut, a block that takes ground away (ST-028): each is the hill
// where it lies and no solid, and gives the list no level - not the lawn for its foot at 812 m,
// and the ground cut has its floor at 814 m, the day rooms'. So 35 solids stand there. At 817 m
// all show but the car, which stands on the ground uphill of the house: over 817 m still, some
// 0.2 m under the hill's 817.85 m - the ground cut lowers the ground there too, by what the rule
// works out. At 814 m all that stands at 817 m is gone as well - the two boxes of the night
// rooms, the bath and the roof terrace, and the twelve objects on their floor: left are the
// four boxes that stand at 814 m, the thirteen objects on their floor - the wide staircase
// among them - and the tree below the house, which stands on the lawn, at 814 m, where the
// hill lay at 812.48 m. A cut asks the floor a thing stands on, and a top that slopes moves
// none: the bath goes with the upper floor, and the porch stays with the lower.
const ALL: Cut = { name: 'All', level: 'all', shown: '35' };
const UPPER: Cut = { name: 'Level 817 m', level: '817', shown: '34' };
const LOWER: Cut = { name: 'Level 814 m', level: '814', shown: '18' };
const CUTS = [ALL, UPPER, LOWER];
// The made-up sketch without its upper floor - without all that stands at 817 m, row 18 of a
// standing view: twenty-one things and nineteen solids - the lawn and the ground cut, whose
// floors lie lower, stay, and are none - with 814 m for their one level, and all of them at it
// but the car. And its night rooms with the car alone: three things, and nothing stands at 814 m.
const UPPER_ROW = 18;
const upstairs = ({ z, floor }: Thing): boolean => (z ? z[1] : floor) === UPPER_ROW;
const NO_UPPER = sketchOf(THINGS.filter((thing) => !upstairs(thing)));
const NIGHT = 'Night rooms';
const NIGHT_ALONE = sketchOf(THINGS.filter(({ name, kind }) => name === NIGHT || kind === 'car'));

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
/** How many pixels of a picture are warm, blue, earth, and anything but the backdrop. */
interface Tints {
  readonly warm: number;
  readonly blue: number;
  readonly earth: number;
  readonly drawn: number;
}
// Warm is red or orange, far redder than green and blue; earth a little redder than green and
// somewhat redder than blue, as the ground is, in light and in shade. The backdrop is #e5e7eb.
const tintsOf = (png: Buffer): string => `new Promise((done, failed) => {
  const picture = new Image();
  picture.onerror = () => failed(new Error('the picture did not load'));
  picture.onload = () => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [picture.width, picture.height];
    const pen = canvas.getContext('2d');
    pen.drawImage(picture, 0, 0);
    const { data } = pen.getImageData(0, 0, canvas.width, canvas.height);
    const tints = { warm: 0, blue: 0, earth: 0, drawn: 0 };
    for (let at = 0; at < data.length; at += 4) {
      const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
      const off = Math.abs(red - 229) + Math.abs(green - 231) + Math.abs(blue - 235);
      if (red > green + 40 && red > blue + 40) tints.warm += 1;
      if (blue > red + 40 && blue > green + 40) tints.blue += 1;
      if (red > blue + 20 && red < blue + 70 && red >= green && red < green + 30) tints.earth += 1;
      if (off > 12) tints.drawn += 1;
    }
    done(tints);
  };
  picture.src = 'data:image/png;base64,${png.toString('base64')}';
})`;
// So many pixels of the ground at the least, where it is drawn.
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
const tints = async (page: Page): Promise<Tints> =>
  page.evaluate<Tints>(tintsOf(await picture(page)));

/** Says of the page that it shows a cut: on its body, and as the one level that is marked. */
async function showsCut(page: Page, { name, level, shown }: Cut): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-level', level);
  await expect(page.locator('body')).toHaveAttribute('data-shown', shown);
  await expect(page.locator('#levels button[aria-pressed="true"]')).toHaveText([name]);
}

test('the made-up sketch is cut at each of its levels, by pointer and by key, and the counts are its own', async ({
  page,
}) => {
  const errors = errorsOf(page);
  test.skip(!(await openWith(page, SKETCH)), NO_STAGE);
  const [ground, picked] = [
    THINGS.filter(({ is }) => is === 'ground'),
    THINGS.filter(({ category }) => category !== undefined),
  ];
  expect([THINGS.length, ground, picked]).toEqual([37, [LAWN], [DUG]]);
  const body = page.locator('body');

  // The list: all, and the two levels from the top down, named as the pad's top view names them
  // - of its three: the lawn's is none here.
  await expect(page.locator('#levels button')).toHaveText(CUTS.map(({ name }) => name));
  await showsCut(page, ALL);
  await expect(body).toHaveAttribute('data-ground', 'on');
  const whole = await tints(page);
  expect(whole.blue).toBeGreaterThan(100);

  // By pointer, to the lower level. The night rooms are blue, and gone with all that stood
  // beside them: nothing in the picture is blue. The day rooms under them are orange and stand
  // whole: their roof shows now.
  await page.getByRole('button', { name: LOWER.name }).click();
  await showsCut(page, LOWER);
  const cut = await tints(page);
  expect(cut.blue).toBe(0);
  expect(cut.warm).toBeGreaterThan(whole.warm);
  // By key: Page Up goes a level up, to all of it and no further; Page Down down, to the lowest.
  const steps = [
    ['PageUp', UPPER],
    ['PageUp', ALL],
    ['PageUp', ALL],
    ['PageDown', UPPER],
    ['PageDown', LOWER],
    ['PageDown', LOWER],
  ] as const;
  for (const [key, to] of steps) {
    await page.keyboard.press(key);
    await showsCut(page, to);
  }
  // The ground off and on again: the cut is the same, and so is what stands there.
  await page.getByLabel('Ground').uncheck();
  await expect(body).toHaveAttribute('data-ground', 'off');
  await showsCut(page, LOWER);
  await page.getByLabel('Ground').check();
  await expect(body).toHaveAttribute('data-ground', 'on');
  // The scene had all its solids all the while, and the sketch is as it was.
  await expect(body).toHaveAttribute('data-solids', '35');
  expect(await page.evaluate<string | null>(`localStorage.getItem(${STORE})`)).toBe(SKETCH);
  expect(errors).toEqual([]);
});

test('with the ground off nothing of it is drawn, not its top, its sides or the outline; on, all are back', async ({
  page,
}) => {
  // No sketch, so nothing but the ground: earth, and on it the outline, which is no earth.
  test.skip(!(await openWith(page, null)), NO_STAGE);
  const on = await tints(page);
  expect(on.earth).toBeGreaterThan(SOME_GROUND);
  expect(on.drawn).toBeGreaterThan(on.earth);

  // Off, the picture is the backdrop from edge to edge.
  await page.getByLabel('Ground').uncheck();
  await expect(page.locator('body')).toHaveAttribute('data-ground', 'off');
  expect(await tints(page)).toEqual({ warm: 0, blue: 0, earth: 0, drawn: 0 });
  await page.getByLabel('Ground').check();
  await expect(page.locator('body')).toHaveAttribute('data-ground', 'on');
  expect(await tints(page)).toEqual(on);
});

test('where the browser gives no WebGL there is no stage, and no control of one', async ({
  page,
}) => {
  await page.addInitScript(NO_WEBGL);
  await open(page, '/3d.html');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-stage', 'none');
  for (const control of ['#stands', '#ground-row', '#side', '#settings-open', '#settings']) {
    await expect(page.locator(control)).toBeHidden();
  }
  await expect(page.locator('#figures li')).toHaveCount(0);
  await page.keyboard.press('PageDown');
  expect(await body.getAttribute('data-level')).toBeNull();
  expect(await body.getAttribute('data-ground')).toBeNull();
});

test('a change of the sketch from another window keeps the level where it still exists, and goes to all where it does not', async ({
  page,
  context,
}) => {
  test.skip(!(await openWith(page, SKETCH)), NO_STAGE);
  const body = page.locator('body');
  await page.getByRole('button', { name: LOWER.name }).click();
  await showsCut(page, LOWER);
  await page.evaluate('globalThis.stayed = true');

  // Another window of the pad keeps another sketch, as the pad does with every stroke: the
  // made-up one without its upper floor. 814 m is still a level, and the view stays cut there.
  const pad = await context.newPage();
  await open(pad, '/#top');
  await pad.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(NO_UPPER)})`);
  await expect(body).toHaveAttribute('data-solids', '19');
  await expect(page.locator('#levels button')).toHaveText([ALL.name, LOWER.name]);
  await showsCut(page, LOWER);
  // Then the night rooms and the car alone: nothing stands at 814 m, and all of it shows.
  await pad.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(NIGHT_ALONE)})`);
  await expect(body).toHaveAttribute('data-solids', '3');
  await expect(page.locator('#levels button')).toHaveText([ALL.name, UPPER.name]);
  await showsCut(page, { ...ALL, shown: '3' });
  expect(await page.evaluate<boolean>('globalThis.stayed === true'), 'the page loaded anew').toBe(
    true,
  );
});
