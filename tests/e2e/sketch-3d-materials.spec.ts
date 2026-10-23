import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// Materials, the third way of showing the sketch on the pad's 3D page, end to end, on the made-up
// plot with the made-up sketch: the switch, the way on the body, a house that is not white before
// a sky, grass where the garden lies, the floor of the bath in another colour than the floor of
// the night rooms beside it - each the colour that the page's own surfaces and lights say - one
// picture for a way picked, and what a tab keeps. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34). No colour is written here, but that grass is green: a surface may be set to
// another, and this holds.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so there is no way to pick';
// The solids of the made-up sketch: all its things but two - its lawn, ground, and its cut.
const THINGS = (JSON.parse(SKETCH) as { things: unknown[] }).things.length - 2;
// The same house under two other names: its garden a terrace, which is open air too and has a
// floor of stone, and its bath a study, a room with the floor of wood that the night rooms have.
// Nothing else of it is another: where the two houses differ in a picture, the garden lies, and
// the floor of the bath.
const RENAMED = SKETCH.replace('"name":"Garden"', '"name":"Terrace"').replace(
  '"name":"Bath"',
  '"name":"Study"',
);

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
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
type Colour = readonly number[];
// What a picture of the stage shows against another of the same view: how many of its pixels have
// a colour, and the colour in its top left corner; how many pixels are another colour in the
// other - and of those how many are grass here, how many grass there, and how many are no grass
// here - with the commonest colour of the grass, and of the rest here and there; and how many
// pixels that are the same in both have the colour the rest has there.
type Told = Record<'coloured' | 'apart' | 'grass' | 'grassThere' | 'rest' | 'beside', number> &
  Record<'corner' | 'grassIs' | 'restIs' | 'restThere', Colour>;
// A colour is far from grey, or green, as in sketch-3d-ways.spec.ts. Grass is green: greener than
// it is red, and far greener than blue - earth, stone, wood and the sky are not. Two pixels are
// apart where one of red, green and blue differs by more than a tenth of what a screen shows.
const toldBy = (png: Buffer, other: Buffer): string => `Promise.all(
  ['${png.toString('base64')}', '${other.toString('base64')}'].map((png) => new Promise((done) => {
    const picture = new Image();
    picture.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [picture.width, picture.height];
      const pen = canvas.getContext('2d');
      pen.drawImage(picture, 0, 0);
      done(pen.getImageData(0, 0, canvas.width, canvas.height).data);
    };
    picture.src = 'data:image/png;base64,' + png;
  })),
).then(([here, there]) => {
  const green = (of, at) => of[at + 1] > of[at] + 12 && of[at + 1] > of[at + 2] + 25;
  const off = (at, colour) => Math.max(...[0, 1, 2].map((n) => Math.abs(here[at + n] - colour[n])));
  // The commonest colour of some pixels: the middle of the fullest of the boxes, four levels wide.
  const commonest = (of, places) => {
    const boxes = new Map();
    for (const at of places) {
      const key = (of[at] >> 2) * 4096 + (of[at + 1] >> 2) * 64 + (of[at + 2] >> 2);
      if (!boxes.has(key)) boxes.set(key, []);
      boxes.get(key).push(at);
    }
    const [fullest = []] = [...boxes.values()].sort((one, next) => next.length - one.length);
    return [0, 1, 2].map((n) => fullest.reduce((sum, at) => sum + of[at + n], 0) / fullest.length);
  };
  const [grass, rest, same] = [[], [], []];
  let [coloured, grassThere] = [0, 0];
  for (let at = 0; at < here.length; at += 4) {
    const levels = [here[at], here[at + 1], here[at + 2]];
    if (Math.max(...levels) - Math.min(...levels) > 60 || green(here, at)) coloured += 1;
    if (off(at, [there[at], there[at + 1], there[at + 2]]) <= 25) same.push(at);
    else {
      (green(here, at) ? grass : rest).push(at);
      if (green(there, at)) grassThere += 1;
    }
  }
  const restThere = commonest(there, rest);
  return {
    coloured,
    corner: [here[0], here[1], here[2]],
    apart: grass.length + rest.length,
    grass: grass.length,
    grassThere,
    rest: rest.length,
    grassIs: commonest(here, grass),
    restIs: commonest(here, rest),
    restThere,
    beside: same.filter((at) => off(at, restThere) <= 4).length,
  };
})`;
// The light of a level of 255, by the screen's curve: a share of the light of white.
const LIGHT = `(level) => ((level / 255 + 0.055) / 1.055) ** 2.4`;
const lightOf = (level: number): number => ((level / 255 + 0.055) / 1.055) ** 2.4;
// What a floor of a surface shows in the sun, seen from above, by the page's own scripts: the
// light of the colour its surface was given, in the light that the lights' rule gives a face
// that looks straight up - in red, in green and in blue. With the step, in light, that the
// lights' rule tells two faces apart by, and the sky over a house in its surfaces, as levels.
const SHOWN = `Promise.all(
  ['/view3d/lights.js', '/scene/sun.js', '/scene/surfaces.js'].map((script) => import(script)),
).then(([lights, sun, { SURFACES }]) => {
  const light = lights.lightOn([0, 0, 1], sun.sunOf(SITE.bearingDeg).toward, lights.SURFACED);
  const levels = (hex) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  const floor = (name) => levels(SURFACES[name].colour).map(${LIGHT}).map(
    (share, channel) => share * light[channel],
  );
  const [step, sky] = [lights.TOLD_APART, [lights.SKY.horizon, lights.SKY.zenith].map(levels)];
  return { grass: floor('grass'), stone: floor('stone'), wood: floor('wood'), step, sky };
})`;
type Shown = Record<'grass' | 'stone' | 'wood', Colour> & { step: number; sky: Colour[] };
// So many pixels of a house, or of a floor, at the least; so few pixels apart, two pictures show
// one thing from one place; and so near, in light, a floor is to what is worked out for it: the
// rule knows nothing of the little that a face throws back of the sun as a mirror does.
const [SOME, SAME, NEAR] = [1000, 200, 0.03];

// Every case opens in a tab that has the made-up sketch in the pad's store.
test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** Opens a page of the pad, fails unless it is on the made-up plot - asked yes or no, before any matcher reads it - and says whether a stage is drawn there. */
async function open(page: Page, address = '/3d.html'): Promise<boolean> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  if (address !== '/3d.html') return false;
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
/** What a picture shows against another: against itself, where none is given. */
const told = (page: Page, png: Buffer, other: Buffer = png): Promise<Told> =>
  page.evaluate<Told>(toldBy(png, other));
/** How far one is from another: by the one of red, green and blue that is furthest. */
const off = (one: Colour, other: Colour): number =>
  Math.max(...one.map((share, channel) => Math.abs(share - (other[channel] ?? NaN))));
/** Says of a colour in a picture - levels of 255 - that its light is what was worked out for it. */
const is = (seen: Colour, worked: Colour, what: string): void =>
  expect(off(seen.map(lightOf), worked), `${what} shows ${seen.join()}`).toBeLessThan(NEAR);
/** Says of the page that it shows a way, with shadows cast or not: on its body, and on its switch. */
async function showsWay(page: Page, way: string, shadows: 'on' | 'off'): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-way', way);
  await expect(page.locator('body')).toHaveAttribute('data-shadows', shadows);
  await expect(page.locator('#ways [aria-pressed="true"]')).toHaveAttribute('data-way', way);
}
const pick = (page: Page, way: string) => page.locator(`button[data-way=${way}]`).click();
const said = async (page: Page, name: string): Promise<number> =>
  Number(await page.locator('body').getAttribute(`data-${name}`));

test('Materials is the house in its surfaces: grass where the garden lies, and a bath that is told from the night rooms', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  test.skip(!(await open(page)), NO_STAGE);
  expect(['"Terrace"', '"Study"'].every((name) => RENAMED.includes(name))).toBe(true);
  // The switch has three ways. White first, for what Materials is held against: its parts.
  await expect(page.locator('#ways button')).toHaveText(['Volumes', 'White', 'Materials']);
  await pick(page, 'white');
  await showsWay(page, 'white', 'on');
  const [parts, white] = [await said(page, 'parts'), await picture(page)];
  expect((await told(page, white)).coloured).toBe(0);
  // Materials, by pointer: the same parts, and of the solids the body says what it said - under
  // the sun, with its shadows. The house is not white: it has colours, before a sky.
  await pick(page, 'materials');
  await showsWay(page, 'materials', 'on');
  await expect(page.getByLabel('Shadows')).toBeChecked();
  expect([await said(page, 'parts'), await said(page, 'shown')]).toEqual([parts, THINGS]);
  expect(parts).toBeGreaterThan(THINGS);
  const shown = await page.evaluate<Shown>(SHOWN);
  const front = await told(page, await picture(page), white);
  expect(front.coloured).toBeGreaterThan(SOME);
  expect(front.apart).toBeGreaterThan(SOME);
  const sky = (level: number, at: number): boolean =>
    shown.sky.reduce((product, end) => product * (level - (end[at] ?? NaN)), 1) <= 0;
  expect(front.corner.every(sky), `the corner is ${front.corner.join()}`).toBe(true);

  // From above, without the shadows: a floor is its colour but for a pattern's under a third. The
  // house whole, and a level down, where the upper storey is open.
  await page.locator('#stands [data-stand="above"]').click();
  await page.getByLabel('Shadows').uncheck();
  await showsWay(page, 'materials', 'off');
  const whole = await picture(page);
  await page.keyboard.press('PageDown');
  await expect(page.locator('body')).toHaveAttribute('data-level', '817');
  const opened = await picture(page);
  // Another window keeps the house under its other names, as the pad does with every stroke.
  const pad = await context.newPage();
  await open(pad, '/#top');
  await pad.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(RENAMED)})`);
  await expect.poll(async () => (await picture(page)).equals(opened)).toBe(false);
  const openedThere = await picture(page);
  await page.keyboard.press('PageUp');
  await expect(page.locator('body')).toHaveAttribute('data-level', 'all');
  // The whole house: where the two differ, the garden lies - and there this one is grass, all of
  // it but a twentieth at the most, the pixels along its edge, in the colour that the surfaces
  // give grass; the terrace in its place has none.
  const garden = await told(page, whole, await picture(page));
  expect(garden.grass).toBeGreaterThan(SOME);
  expect(20 * garden.rest).toBeLessThan(garden.grass);
  expect(garden.grassThere).toBe(0);
  is(garden.grassIs, shown.grass, 'the garden');
  // A level down, the two differ in the garden and in the floor of the bath. That floor is
  // stone here and wood there - two colours, further apart in light than the step that tells
  // two faces apart - and wood is what the floor of the night rooms beside it is, in both.
  const bath = await told(page, opened, openedThere);
  expect(bath.grass).toBeGreaterThan(SOME);
  expect(bath.rest).toBeGreaterThan(SOME);
  is(bath.restIs, shown.stone, 'the floor of the bath');
  is(bath.restThere, shown.wood, 'the floor of a study');
  expect(off(bath.restIs.map(lightOf), bath.restThere.map(lightOf))).toBeGreaterThan(shown.step);
  expect(bath.beside).toBeGreaterThan(SOME);
  // The page wrote nothing of the sketch, and nothing went wrong.
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(RENAMED);
  expect(errors).toEqual([]);
});

test('Materials picked is one picture, and so is each way after it: nothing is drawn in a loop', async ({
  page,
}) => {
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
  const drawn = [await pictures()];
  expect(drawn[0]).toBeGreaterThan(0);
  const steps = [
    () => pick(page, 'materials'),
    () => page.keyboard.press('PageDown'),
    () => page.getByLabel('Shadows').uncheck(),
    () => pick(page, 'white'),
    () => pick(page, 'materials'),
    () => pick(page, 'volumes'),
  ];
  for (const step of steps) drawn.push(await step().then(pictures));
  expect(drawn.map((count) => count - (drawn[0] ?? 0))).toEqual([0, 1, 2, 3, 4, 5, 6]);
});

test('a reload and a visit to the top view keep Materials', async ({ page }) => {
  test.skip(!(await open(page)), NO_STAGE);
  await pick(page, 'materials');
  await page.locator('#stands [data-stand="above"]').click();
  await page.keyboard.press('PageDown');
  const left = await picture(page);
  const asItWas = async (): Promise<void> => {
    await expect(page.locator('body')).toHaveAttribute('data-stage', 'drawn');
    await showsWay(page, 'materials', 'on');
    await expect(page.locator('body')).toHaveAttribute('data-level', '817');
    const now = await told(page, await picture(page), left);
    expect(now.apart).toBeLessThan(SAME);
    expect(now.coloured).toBeGreaterThan(SOME);
  };
  await page.reload();
  await asItWas();
  await page.getByRole('link', { name: 'Top view' }).click();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.keyboard.press('6');
  await expect(page).toHaveTitle('3D — sketch pad');
  await asItWas();
});
