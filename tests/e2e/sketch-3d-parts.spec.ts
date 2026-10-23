import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The parts of the house on the pad's 3D page, end to end, on the made-up plot with made-up
// sketches: in White the stage shows what the house is built of, and no solid; a level down, the
// storey it stops at is open; a change of the sketch in another window is drawn at once; and a
// roof in the sun is as light as the rule of the lights says. `pnpm sketch --demo` serves the pad
// as files, and its page puts tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this
// run: a case asks yes or no whether its page is on the made-up plot, before a matcher reads
// that page (directive 34). Every count is the page's own, or the file's: a rule that is added
// to the scene later makes more parts, and no case here counts them by hand.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing is drawn';
// A box of a sketch has `z`, its top and its floor as rows; an object the `floor` it stands on.
const DOC = JSON.parse(SKETCH) as { things: { kind?: string; z?: number[]; floor?: unknown }[] };
// Its solids: a thing each, but for the last two - the lawn, ground, and the cut: no solids.
const THINGS = DOC.things.length - 2;
// The made-up sketch without all that stands on its upper level, row 18 of a standing view; and
// with two figures of the house changed, as Settings will change them: higher doors, and roofs
// thick enough to see.
const lower = DOC.things.filter(({ z, floor }) => (z ? z[1] : floor) !== 18);
const NO_UPPER = JSON.stringify({ ...DOC, things: lower });
const FIGURES = { roofSlabM: 0.8, doorHighM: 2.4 };
const FIGURED = JSON.stringify({ ...DOC, figures: FIGURES });
// One block of the test's own in the middle of the plot, 4 m by 4 m, from 814 m up to 818 m.
const ONE_BLOCK = `{"space":3,"things":[{"x":[40,48],"y":[26,34],"z":[16,24],"colour":10}],"floors":[],"notes":[],"on":{},"show":{"top":{}}}`;

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
// What a picture of the stage shows, and against another of the same view: how many pixels have
// a colour, are white and are ink; how many that were white in the other are a grey here - in
// the shade, or the side of a thing - and the colour in the middle of the white ones.
type Seen = Record<'coloured' | 'white' | 'ink' | 'greyed', number> & { whiteIs: number[] };
// A colour is far from grey, or green, as in sketch-3d-ways.spec.ts. White is what the sun falls
// on, of a white house: neither backdrop is. Ink is darker than any face of a white
// house in any light: the lines along the edges of the volumes, and the parcel's outline. A grey
// has no colour - earth has - and is darker by far than the white that was there.
const seenIn = (png: Buffer, other: Buffer): string => `Promise.all(
  ['${png.toString('base64')}', '${other.toString('base64')}'].map((png) => new Promise((done) => {
    const picture = new Image();
    picture.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [picture.width, picture.height];
      const pen = canvas.getContext('2d');
      pen.drawImage(picture, 0, 0);
      done(pen.getImageData(0, 0, canvas.width, canvas.height));
    };
    picture.src = 'data:image/png;base64,' + png;
  })),
).then(([{ data, width }, { data: there }]) => {
  const count = { coloured: 0, white: 0, ink: 0, greyed: 0 };
  const sum = [0, 0];
  const white = (of, at) => Math.min(of[at], of[at + 1], of[at + 2]) > 240;
  for (let at = 0; at < data.length; at += 4) {
    const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (spread > 60 || (green > red + 8 && green > blue + 8)) count.coloured += 1;
    if (Math.max(red, green, blue) < 70) count.ink += 1;
    if (white(data, at)) {
      count.white += 1;
      [sum[0], sum[1]] = [sum[0] + ((at / 4) % width), sum[1] + Math.floor(at / 4 / width)];
    }
    const darker = there[at] + there[at + 1] + there[at + 2] - red - green - blue > 60;
    if (white(there, at) && darker && spread < 15) count.greyed += 1;
  }
  const [x, y] = sum.map((total) => Math.round(total / Math.max(count.white, 1)));
  return { ...count, whiteIs: [...data.slice(4 * (y * width + x), 4 * (y * width + x) + 3)] };
})`;
// So many pixels of a house, or of what stands in it, at the least; and so many of the thin
// lines of the made-up house's eight blocks, of which a part is as dark as ink.
const [SOME, SOME_INK] = [1000, 400];

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
/** What a picture shows, and what it shows against another: against itself, where none is given. */
const seen = (page: Page, png: Buffer, other: Buffer = png): Promise<Seen> =>
  page.evaluate<Seen>(seenIn(png, other));
const pick = (page: Page, way: string) => page.locator(`button[data-way=${way}]`).click();
const standAt = (page: Page, at: string) => page.locator(`#stands [data-stand="${at}"]`).click();
/** What the body says under a name, as a number. */
const said = async (page: Page, name: string): Promise<number> =>
  Number(await page.locator('body').getAttribute(`data-${name}`));
/** Has another window keep a sketch, as the pad does with every stroke. */
const keeps = (pad: Page, sketch: string) =>
  pad.evaluate(`localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(sketch)})`);

test.describe('with the made-up sketch', () => {
  withSketch(SKETCH);

  test('White is the parts, and a level down its storey is open', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    test.skip(!(await open(page)), NO_STAGE);
    const body = page.locator('body');
    // The volumes: a solid for each thing, and no part. With the ground off, and its outline
    // with it, the lines along the edges of the blocks are the ink in the picture. What the body
    // says of the solids at each cut is noted: it says the same in White.
    await expect(body).toHaveAttribute('data-parts', '0');
    expect(await said(page, 'solids')).toBe(THINGS);
    await page.getByLabel('Ground').uncheck();
    expect((await seen(page, await picture(page))).ink).toBeGreaterThan(SOME_INK);
    const shown = [await said(page, 'shown')];
    for (const key of ['PageDown', 'PageDown', 'PageUp', 'PageUp']) {
      await page.keyboard.press(key);
      if (key === 'PageDown') shown.push(await said(page, 'shown'));
    }
    // Every solid at first, and fewer with each level down.
    expect([shown.length, shown.at(0), new Set(shown).size]).toEqual([3, THINGS, 3]);
    expect(shown).toEqual([...shown].sort((one, other) => other - one));

    // White: more parts than the sketch has things, every one white and none with a line along
    // an edge - no ink is left, and nothing has a colour - and of the solids the body says what
    // it said.
    await pick(page, 'white');
    await expect(body).toHaveAttribute('data-way', 'white');
    const parts = await said(page, 'parts');
    expect(parts).toBeGreaterThan(THINGS);
    expect([await said(page, 'solids'), await said(page, 'shown')]).toEqual([THINGS, THINGS]);
    const bare = await seen(page, await picture(page));
    expect([bare.ink, bare.coloured]).toEqual([0, 0]);
    expect(bare.white).toBeGreaterThan(SOME);

    // From above, with the ground. A level down, fewer parts stand there, and the storey the cut
    // stops at has no roof: where roofs were white, what stands in the night rooms shows, by
    // its sides and by the shadows it casts on the floor. A level more, what stands in the day
    // rooms does, where the floors over them were.
    await page.getByLabel('Ground').check();
    await standAt(page, 'above');
    const closed = await picture(page);
    let [stood, above] = [parts, closed];
    for (const solids of shown.slice(1)) {
      await page.keyboard.press('PageDown');
      const [now, open] = [await said(page, 'parts'), await picture(page)];
      expect(now).toBeLessThan(stood);
      expect(await said(page, 'shown')).toBe(solids);
      const inside = await seen(page, open, above);
      expect(inside.greyed, `nothing shows inside, with ${now} parts`).toBeGreaterThan(SOME);
      expect(inside.coloured).toBe(0);
      [stood, above] = [now, open];
    }
    // Back up, the house is closed again: every part, and the picture it was, to the pixel.
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await expect(body).toHaveAttribute('data-level', 'all');
    expect(await said(page, 'parts')).toBe(parts);
    expect((await picture(page)).equals(closed), 'the house is not as it was').toBe(true);
    // And in the volumes no part stands there. The page wrote nothing of the sketch.
    await pick(page, 'volumes');
    await expect(body).toHaveAttribute('data-parts', '0');
    expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
    expect(errors).toEqual([]);
  });

  test('a way, a level and a changed sketch are one picture each', async ({ page, context }) => {
    await page.addInitScript(COUNT_PICTURES);
    test.skip(!(await open(page)), NO_STAGE);
    const pad = await context.newPage();
    await open(pad, '/#top');
    /** How many pictures were drawn, once the page is done - and half a second on it is no more. */
    const drawn = async (): Promise<number> => {
      await page.bringToFront();
      await frames(page, 5);
      const done = await page.evaluate<number>('globalThis.pictures');
      await frames(page, 30);
      expect(await page.evaluate<number>('globalThis.pictures'), 'drawn in a loop').toBe(done);
      return done;
    };
    const opened = await drawn();
    expect(opened).toBeGreaterThan(0);
    // A sketch that another window keeps is this page's once its body says so of the solids.
    const [solids, all] = [page.locator('body'), ['data-solids', String(THINGS)] as const];
    const steps = [
      () => pick(page, 'white'),
      () => page.keyboard.press('PageDown'),
      () => page.keyboard.press('PageDown'),
      () => page.keyboard.press('PageUp'),
      () => keeps(pad, NO_UPPER).then(() => expect(solids).not.toHaveAttribute(...all)),
      () => keeps(pad, FIGURED).then(() => expect(solids).toHaveAttribute(...all)),
      () => pick(page, 'volumes'),
    ];
    const counts: number[] = [];
    for (const step of steps) counts.push(await step().then(drawn));
    expect(counts.map((count) => count - opened)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('a change of the sketch in another window is drawn in White with no reload, from where the view was looking', async ({
    page,
    context,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    const whole = await said(page, 'parts');
    // The view is turned, and a mark is set that a page loaded anew would not have.
    await page.mouse.move(640, 400);
    await page.mouse.down();
    await page.mouse.move(780, 380, { steps: 8 });
    await page.mouse.up();
    const turned = await picture(page);
    await page.evaluate('globalThis.stayed = true');

    // Another window keeps the sketch without its upper floor: fewer solids here, and fewer parts.
    const pad = await context.newPage();
    await open(pad, '/#top');
    await keeps(pad, NO_UPPER);
    await expect(page.locator('body')).not.toHaveAttribute('data-solids', String(THINGS));
    expect(await said(page, 'parts')).toBeLessThan(whole);
    expect((await picture(page)).equals(turned), 'the upper floor is still drawn').toBe(false);
    // And the whole sketch again: every part, in the picture it was - seen from where the view
    // was looking, not from the front again.
    await keeps(pad, SKETCH);
    await expect(page.locator('body')).toHaveAttribute('data-solids', String(THINGS));
    expect(await said(page, 'parts')).toBe(whole);
    expect((await picture(page)).equals(turned), 'the view did not stay where it was').toBe(true);

    // Then a figure of the house is changed there. Here the pad's own scripts hold the sketch
    // that was read last, so a door is as high as it says now - 2.4 m are 4.8 rows of a standing
    // view - and the house is drawn with roofs of another thickness.
    await keeps(pad, FIGURED);
    const held = () => page.evaluate<unknown>('globalThis.sketch.doc.figures');
    await expect.poll(held).toEqual(FIGURES);
    const door = DOC.things.findIndex(({ kind }) => kind === 'door');
    const rows = `(([, top, , foot]) => foot - top)(sketch.rect(sketch.doc.things[${door}], 'side'))`;
    expect(await page.evaluate<number>(rows)).toBeCloseTo(4.8, 9);
    expect((await picture(page)).equals(turned), 'the roofs are as thick as before').toBe(false);
    expect(await page.evaluate<unknown>('globalThis.stayed'), 'the page loaded anew').toBe(true);
    expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(FIGURED);
  });
});

test.describe('with one block in the middle of the plot', () => {
  withSketch(ONE_BLOCK);

  test('a roof in the sun is as light as the rule says, and not burnt out', async ({ page }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    await standAt(page, 'above');
    const { white, whiteIs } = await seen(page, await picture(page));
    expect(white).toBeGreaterThan(SOME);
    // The rule, asked of the page's own scripts, for a face that looks straight up under the
    // named sun over this plot: a share of the light of white, in red, green and blue - which
    // the screen shows on its own curve, as a level of 255.
    const light = await page.evaluate<number[]>(`Promise.all(
      [import('/view3d/lights.js'), import('/scene/sun.js')],
    ).then(([lights, sun]) => lights.lightOn([0, 0, 1], sun.sunOf(SITE.bearingDeg).toward))`);
    expect([light.length, whiteIs.length, Math.max(...light) < 1]).toEqual([3, 3, true]);
    const levels = light.map((share) => 255 * (1.055 * share ** (1 / 2.4) - 0.055));
    const off = whiteIs.map((level, channel) => Math.abs(level - (levels[channel] ?? NaN)));
    expect(Math.max(...off), `the roof shows ${whiteIs.join()}`).toBeLessThan(2);
  });
});
