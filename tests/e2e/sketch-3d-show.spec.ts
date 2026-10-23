import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The story's one end-to-end test (ST-033, "A model good to show", its first row of Behaviour,
// task T-033.6): on the pad's 3D page, with the sketch of every part, in Materials, one section
// switched off - its blocks and what stands in them gone - the house opened along the front
// view's slice, and then Full screen: the stage alone, filling the window - the tests' browser
// may refuse its own full screen, and the stage is then alone in the window - with nothing of the
// page around it; the corner's "Picture" saves a PNG as large as the canvas has pixels, as File's
// "Picture (PNG)" does; and Escape brings the page back as it was - the section still off, the
// house still open, the line saying what was saved. The page asks nobody, and nothing goes wrong.
// What full screen decides is tools/sketch/view3d/full.check.js's; what a picture holds of the
// stage, sketch-3d-picture.spec.ts's; what a switch takes away, scene/shows.check.js's.
// `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of site.js. The
// real plot is in no part of this run: the case asks yes or no whether its page is on the
// made-up plot, before a matcher reads that page (directive 34). No picture is kept: the browser
// saves into the folder it has for this run.

// The sketch of every part, and where the page keeps its sketch: `KEY` of tools/sketch/sketch.js,
// stated a second time. Its first section, and what the page shows of the file, worked out by
// hand from tests/__fixtures__/CLAUDE.md: thirteen solids at every level - the studio, the two
// boxes of the workshop, the cellar, and nine objects: the window, the bed, the spiral
// staircase, the sink, the person, the bush, the desk, the wide staircase, the cupboard; the
// bank is ground and the dig a cut, and neither is a solid. "Atelier "Süd"" holds the studio
// and both boxes of the workshop, and the seven objects that stand in them - the window, the
// bed, the spiral, the desk and the cupboard in the studio, the sink and the wide staircase in
// the workshop: ten solids. Switched off, 13 - 10 = 3 show: the cellar, the person and the
// bush, which are in no section.
// (tools/sketch/view3d/read-sections.check.js reads the same file to the same three.)
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/every-part.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const SECTION = 'Atelier "Süd"';
const [ALL_SHOWN, IN_SECTION] = [13, 10];
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing to show of one';
// What every PNG begins with: eight bytes, and then how wide and how high it is, in pixels.
const PNG = Buffer.from('\x89PNG\r\n\x1a\n', 'latin1');
const sizeOf = (png: Buffer): number[] => [png.readUInt32BE(16), png.readUInt32BE(20)];

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// The canvas's own pixels, across and down; and the window's, at the screen's pixels.
const CANVAS = `(({ width, height }) => [width, height])(document.querySelector('#stage canvas'))`;
const WINDOW = `[innerWidth, innerHeight].map((one) => Math.round(one * devicePixelRatio))`;

test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** Opens the 3D page, fails unless it is on the made-up plot - asked yes or no, before any matcher reads it - and says whether its stage is drawn. */
async function open(page: Page): Promise<boolean> {
  await page.goto('/3d.html');
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}

test('in Materials, a section off and the house open along the front slice, Full screen shows the stage alone, saves its picture, and Escape brings the page back as it was - asking nobody', async ({
  page,
}) => {
  // What goes wrong in the page; and what it asks for, of whomever, once it has opened.
  const errors: string[] = [];
  const asked: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  test.skip(!(await open(page)), NO_STAGE);
  page.on('request', (request) => !request.url().startsWith('data:') && asked.push(request.url()));
  const body = page.locator('body');
  const header = page.locator('header');

  // Materials, every solid of the file shown: no section off, at every level, not opened.
  await page.locator('button[data-way=materials]').click();
  await expect(body).toHaveAttribute('data-way', 'materials');
  await expect(body).toHaveAttribute('data-level', 'all');
  await expect(body).toHaveAttribute('data-shown', String(ALL_SHOWN));
  await expect(body).toHaveAttribute('data-full', 'off');
  // The first section off: its blocks and what stands in them are not drawn.
  const section = page.locator('#switch-sections').getByRole('checkbox', { name: SECTION });
  await section.uncheck();
  await expect(body).toHaveAttribute('data-shown', String(ALL_SHOWN - IN_SECTION));
  // Opened along the front view's slice.
  await page.locator('button[data-open=front]').click();
  await expect(body).toHaveAttribute('data-open', 'front');
  await expect(page.locator('button[data-open=front]')).toHaveAttribute('aria-pressed', 'true');

  // Full screen: the stage alone - no header, no line of words, no side - its canvas the whole
  // window, drawn at that size; and in its corner a picture and back.
  const corner = page.locator('#full-corner');
  await expect(corner).toBeHidden();
  await page.locator('#full-screen').click();
  await expect(body).toHaveAttribute('data-full', 'on');
  for (const part of [header, page.locator('#side'), page.locator('#said')]) {
    await expect(part).toBeHidden();
  }
  const { width, height } = page.viewportSize() ?? { width: NaN, height: NaN };
  const canvas = page.locator('#stage canvas');
  expect(await canvas.boundingBox()).toEqual({ x: 0, y: 0, width, height });
  const whole = await page.evaluate<number[]>(WINDOW);
  await expect.poll(() => page.evaluate<number[]>(CANVAS)).toEqual(whole);
  await expect(corner).toBeVisible();
  await expect(corner.locator('button')).toHaveText(['Picture', 'Back']);

  // The corner's Picture: a PNG of the stage under the name of the day, as large as the canvas
  // has pixels - the whole window's - and the stage stays alone.
  const days = [new Date().toISOString().slice(0, 10)];
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#full-picture').click(),
  ]);
  days.push(new Date().toISOString().slice(0, 10));
  const name = download.suggestedFilename();
  expect(days.map((day) => `house-${day}.png`)).toContain(name);
  const png = readFileSync(await download.path());
  expect(png.subarray(0, PNG.length).equals(PNG), 'what was saved is no PNG').toBe(true);
  expect(sizeOf(png)).toEqual(whole);
  await expect(body).toHaveAttribute('data-full', 'on');

  // Escape: the page as it was - the header, the side and its controls - the section still off,
  // still opened along the front, in Materials, at every level; and the line says, now that it
  // shows, what was saved.
  await page.keyboard.press('Escape');
  await expect(body).toHaveAttribute('data-full', 'off');
  await expect(header).toBeVisible();
  await expect(page.locator('#side')).toBeVisible();
  await expect(page.locator('#full-screen')).toBeVisible();
  await expect(corner).toBeHidden();
  await expect(section).not.toBeChecked();
  await expect(body).toHaveAttribute('data-shown', String(ALL_SHOWN - IN_SECTION));
  await expect(body).toHaveAttribute('data-open', 'front');
  await expect(body).toHaveAttribute('data-way', 'materials');
  await expect(body).toHaveAttribute('data-level', 'all');
  await expect(page.locator('#said')).toHaveText(
    `Saved as ${name}, where this browser saves its files.`,
  );

  // The page asked nobody, wrote nothing of the sketch, and nothing went wrong.
  expect(asked).toEqual([]);
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
  expect(errors).toEqual([]);
});
