import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The backdrop of the pad's 3D page, end to end, on the made-up plot with the made-up sketch:
// behind the volumes the grey that lies around the paper in the pad's other views, and in White,
// which is lit by the sun, a darker grey - no line runs along the edge of a white house, and a
// wall in the sun is as light as the lighter grey. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34). That every face of a house stands clear of the darker grey is worked out by
// hand, in tools/sketch/view3d/lights.check.js: here the page is held to the colour it says.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
// The grey around the paper in the pad's other views, #e5e7eb: red, green and blue of 255.
const AROUND_THE_PAPER = [229, 231, 235];
// So much darker, of 255, a backdrop is at the least that a white house stands clear of.
const DARKER_BY = 60;

// Page code, handed over as text: these tests are typed for Node, which has no `document`. The
// colour in the top left corner of a picture - red, green and blue - where the view from the
// front has nothing but the backdrop.
const cornerOf = (png: Buffer): string => `new Promise((done, failed) => {
  const picture = new Image();
  picture.onerror = () => failed(new Error('the picture did not load'));
  picture.onload = () => {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [picture.width, picture.height];
    const pen = canvas.getContext('2d');
    pen.drawImage(picture, 0, 0);
    done([...pen.getImageData(0, 0, 1, 1).data.slice(0, 3)]);
  };
  picture.src = 'data:image/png;base64,${png.toString('base64')}';
})`;
// The colour that the page's own rule gives a stage that is lit by the sun, as `#rrggbb`.
const BY_THE_SUN = `import('/view3d/lights.js').then(({ BACKDROP }) => BACKDROP.sunlit)`;

test.use({
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** The backdrop as the stage shows it, once it has been drawn: over when the browser has shown some frames more. */
async function backdrop(page: Page): Promise<number[]> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
  return page.evaluate<number[]>(cornerOf(await page.locator('#stage canvas').screenshot()));
}

test('in White the backdrop is a darker grey, and the volumes keep theirs', async ({ page }) => {
  await page.goto('/3d.html');
  // Asked yes or no, before any matcher reads the page.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-stage', /^(drawn|none)$/);
  test.skip((await body.getAttribute('data-stage')) !== 'drawn', 'this browser gives no WebGL');

  // The volumes, as the page opens, from the front: behind them the grey around the paper.
  await expect(body).toHaveAttribute('data-way', 'volumes');
  expect(await backdrop(page)).toEqual(AROUND_THE_PAPER);

  // White is lit by the sun: its backdrop is the one the page's rule says goes with the sun -
  // another than the volumes', and darker by far in red, in green and in blue.
  await page.locator('button[data-way=white]').click();
  await expect(body).toHaveAttribute('data-way', 'white');
  const said = await page.evaluate<string>(BY_THE_SUN);
  expect(said).toMatch(/^#[0-9a-f]{6}$/);
  const bySun = [1, 3, 5].map((at) => Number.parseInt(said.slice(at, at + 2), 16));
  const inWhite = await backdrop(page);
  expect(inWhite).toEqual(bySun);
  const darker = AROUND_THE_PAPER.map((level, channel) => level - (inWhite[channel] ?? level));
  expect(Math.min(...darker), `the backdrop in White is ${said}`).toBeGreaterThan(DARKER_BY);
  // Without its shadows White is lit by the sun still, before the same backdrop.
  await page.getByLabel('Shadows').uncheck();
  await expect(body).toHaveAttribute('data-shadows', 'off');
  expect(await backdrop(page)).toEqual(bySun);

  // And back in the volumes the backdrop is the grey around the paper again.
  await page.locator('button[data-way=volumes]').click();
  await expect(body).toHaveAttribute('data-way', 'volumes');
  expect(await backdrop(page)).toEqual(AROUND_THE_PAPER);
});
