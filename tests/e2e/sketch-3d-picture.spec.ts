import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// "Picture (PNG)" on the pad's 3D page, end to end, on the made-up plot with the made-up sketch
// (story ST-029, task T-029.5): the picture that entry of File saves - a PNG under the name
// `house-<day>.png`, as wide and as high as the stage's canvas has pixels, which shows the stage
// as it shows: held against the picture that this test takes of that canvas, as the other tests
// of the 3D page take one. In the Volumes, as the page opens, where the 3D file is not to be
// had; and in White, where the picture is another. The page says the name it saved under, on
// its line; it asks nobody, this machine neither; and nothing goes wrong. The stage keeps no
// drawing between two frames, so a picture that is not taken in the turn of a drawing is empty
// - and every pixel of it is another than the stage's: this case then fails. Where the entry
// stands is sketch-3d-header.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34). No picture is kept: the browser saves into the folder it has for this run.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no picture of one';
// What every PNG begins with: eight bytes, and then how wide and how high it is, in pixels.
const PNG = Buffer.from('\x89PNG\r\n\x1a\n', 'latin1');
const sizeOf = (png: Buffer): number[] => [png.readUInt32BE(16), png.readUInt32BE(20)];

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// The canvas's own pixels: how many across, and how many down.
const CANVAS = `(({ width, height }) => [width, height])(document.querySelector('#stage canvas'))`;
// The pixels of a picture, four numbers a pixel. Read from the picture's own text, and not
// asked for: the page's policy lets it ask nobody.
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
// From so far apart on, in the three colours together, two pixels are not of one colour; so few
// such pixels apart, two pictures show one thing; and so many apart, they do not.
const STEP = 6;
const [SAME, OTHER] = [200, 20_000];
/** Page code: how many pixels of two pictures are not of one colour - a pixel that one has and the other lacks among them. */
const differing = (one: Buffer, other: Buffer): string =>
  `Promise.all([${pixelsOf(one)}, ${pixelsOf(other)}]).then(([{ data: a }, { data: b }]) => {
  let count = Math.abs(a.length - b.length) / 4;
  for (let at = 0; at < Math.min(a.length, b.length); at += 4) {
    const off = [0, 1, 2].reduce((sum, part) => sum + Math.abs(a[at + part] - b[at + part]), 0);
    if (off > ${STEP}) count += 1;
  }
  return count;
})`;

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
/** The stage as it shows once it has been drawn, as this test sees it: a picture of its canvas, taken when the browser has shown some frames more. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
  return page.locator('#stage canvas').screenshot();
}
/** Presses File and then "Picture (PNG)", and reads the picture that the browser saved: under the name of this day, which the page says on a quiet line - and a PNG as large as the canvas was at the press. */
async function save(page: Page): Promise<Buffer> {
  const canvas = await page.evaluate<number[]>(CANVAS);
  const days = [new Date().toISOString().slice(0, 10)];
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const entry = page.getByRole('button', { name: 'Picture (PNG)' });
  await expect(entry).toHaveAttribute('id', 'picture');
  const [download] = await Promise.all([page.waitForEvent('download'), entry.click()]);
  days.push(new Date().toISOString().slice(0, 10));
  const name = download.suggestedFilename();
  expect(days.map((day) => `house-${day}.png`)).toContain(name);
  await expect(page.locator('#said')).toHaveText(
    `Saved as ${name}, where this browser saves its files.`,
  );
  await expect(page.locator('#said')).toHaveClass('line');
  const png = readFileSync(await download.path());
  expect(png.subarray(0, PNG.length).equals(PNG), 'what was saved is no PNG').toBe(true);
  expect(sizeOf(png)).toEqual(canvas);
  return png;
}

test('File saves the stage as it shows as a PNG, a pixel for each of the canvas: in the Volumes, and in White another - and asks nobody', async ({
  page,
}) => {
  // What goes wrong in the page; and what the page asks for, of whomever, from the first press
  // of File on - but for what this test reads there itself, from a text and off no machine.
  const errors: string[] = [];
  const asked: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  test.skip(!(await open(page)), NO_STAGE);
  const differ = (one: Buffer, other: Buffer) => page.evaluate<number>(differing(one, other));

  // The Volumes, as the page opens: the way in which no 3D file is to be had. The stage as this
  // test sees it, and then the picture that the page saves of it: the same picture.
  await expect(page.locator('body')).toHaveAttribute('data-way', 'volumes');
  const seen = await picture(page);
  page.on('request', (request) => !request.url().startsWith('data:') && asked.push(request.url()));
  const saved = await save(page);
  expect(sizeOf(saved)).toEqual(sizeOf(seen));
  expect(await differ(saved, seen), 'the picture does not show the stage').toBeLessThan(SAME);

  // The page's line took its height of the stage: the Volumes as they show from now on. In
  // White the picture is another - the stage as White shows it, and no longer the Volumes.
  const volumes = await picture(page);
  await page.locator('button[data-way=white]').click();
  await expect(page.locator('body')).toHaveAttribute('data-way', 'white');
  const white = await save(page);
  expect(sizeOf(white)).toEqual(sizeOf(volumes));
  expect(await differ(white, await picture(page)), 'not the stage in White').toBeLessThan(SAME);
  expect(await differ(white, volumes), 'White shows what the Volumes show').toBeGreaterThan(OTHER);

  // The page asked nobody for either, wrote nothing of the sketch, and nothing went wrong.
  expect(asked).toEqual([]);
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
  expect(errors).toEqual([]);
  // And its policy is as it was: it lets the page ask nobody - the pad itself is refused.
  const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(policy).toHaveAttribute('content', "connect-src 'none'");
  const fetched = `fetch('/3d.html').then(() => 'answered', () => 'refused')`;
  expect(await page.evaluate<string>(fetched)).toBe('refused');
});
