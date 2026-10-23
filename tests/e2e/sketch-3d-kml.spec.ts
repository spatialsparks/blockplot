import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Download, type Page } from '@playwright/test';

// "Google Earth file (KML)" on the pad's 3D page, end to end, on the made-up plot with the
// made-up sketch: story ST-038's one browser test, ST-016's main path with it. The entry is on in
// the Volumes; a raise typed under it, the browser saves `house-<day>.kml` and the page says so,
// and how many parts it holds; the file is a KML document of the parts that White builds of the
// house's blocks above the ground - all white - and the plot's outline, at the made-up place,
// raised as typed; the raise is kept for the next time the page opens; a level switched off is
// not in the file; and the page asked nobody. Where the entry stands among File's is
// sketch-3d-header.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js
// in the place of site.js, whose made-up place is the zero of the Swiss grid in Bern: the real
// plot is in no part of this run, and a case asks yes or no whether its page is on the made-up
// plot before a matcher reads that page (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time; and where the page keeps the raise on a pad
// with no plot of the owner's, `RAISE_KEY` of tools/sketch/kml/house.js.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const RAISE_KEY = 'blockplot/earth/raise/example';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no File';
// As tools/sketch/kml/house.check.js works them out by hand: the eight blocks of the house all
// stand above the ground - the store, wholly under the hill, bare at its corner by the cut - and
// White builds 153 parts of them, 24 of them panes; the lowest foot of a part is the day rooms'
// floor, 814 m, and the highest top the night rooms' roof, 820 m. The upper level, 817 m, is the
// floor of the night rooms, the bath and the roof terrace: switched off, it leaves 93 parts, none
// above its floor (tools/sketch/kml/white.check.js holds the switches).
const PARTS = 153;
const PANES = 24;
const LOWEST_FOOT_M = 814;
const HIGHEST_TOP_M = 820;
const UPPER = 'Level 817 m';
const UPPER_M = 817;
const BELOW_UPPER = 93;
// The colours of the file's faces: white, and the panes' see-through white.
const WHITES = ['ffffffff', '59ffffff'];
const OUTLINE = 'Plot outline';
// Every point of the file lies within so many metres of the made-up place: the plot is 34 m by
// 20 m, its corners some 40 m from its zero at the most.
const NEAR_M = 200;
// Metres of a degree of latitude, and of longitude at the equator, on a sphere of 6 371 000 m.
const DEGREE_M = (6_371_000 * Math.PI) / 180;

type Mark = { name: string; points: number[][] };

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
const entry = (page: Page) => page.getByRole('button', { name: 'Google Earth file (KML)' });
const raise = (page: Page) => page.locator('#earth-raise');

/** Opens File, types a raise under the entry, presses it, and reads the file the browser saved: the page says under which name, and that it holds `parts` parts. */
async function saveRaised(page: Page, typed: string, parts: number): Promise<string> {
  await page.locator('#file-menu').click();
  await expect(entry(page)).toBeEnabled();
  await expect(page.locator('#earth-why')).toBeHidden();
  await raise(page).fill(typed);
  const [download]: [Download, void] = await Promise.all([
    page.waitForEvent('download'),
    entry(page).click(),
  ]);
  const name = download.suggestedFilename();
  const days = [-1, 0].map((by) => new Date(Date.now() + by * 60_000).toISOString().slice(0, 10));
  expect(days.map((day) => `house-${day}.kml`)).toContain(name);
  await expect(page.locator('#said')).toHaveText(
    `Saved as ${name}, where this browser saves its files. It holds ${parts} parts of the house.`,
  );
  return readFileSync(await download.path(), 'utf8');
}

/** The Placemarks of a file: each its name and its points, `[longitude, latitude, altitude]`. */
function marksOf(text: string): Mark[] {
  return [...text.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)].map(([, mark = '']) => ({
    name: /<name>(.*?)<\/name>/.exec(mark)?.[1] ?? '',
    points: [...mark.matchAll(/<coordinates>(.*?)<\/coordinates>/g)].flatMap(([, list = '']) =>
      list.split(' ').map((point) => point.split(',').map(Number)),
    ),
  }));
}
const altitudes = (marks: Mark[]): number[] =>
  marks.flatMap(({ points }) => points.map(([, , altitude]) => altitude ?? NaN));
/** The Placemarks of a file's parts: every one but the outline, which is the last. */
function partsOf(marks: Mark[]): Mark[] {
  expect(marks.at(-1)?.name).toBe(OUTLINE);
  return marks.slice(0, -1);
}

test('the 3D page saves the White model as a Google Earth file at the made-up place, raised as typed, less a level switched off, and asks nobody', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  // The made-up place in WGS84, asked of the page's own conversion - before anything is
  // listened for: loading the module is the page asking its own pad.
  const [longitude0 = NaN, latitude0 = NaN] = await page.evaluate<number[]>(
    `import('/kml/wgs84.js').then(({ wgs84Of }) => wgs84Of(globalThis.SITE.originLV95))`,
  );
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  // The page opens in the Volumes, which show no part of a house: the entry is on all the same,
  // and the file holds White's parts all the same.
  await expect(page.locator('body')).toHaveAttribute('data-way', 'volumes');
  const text = await saveRaised(page, '2.5', PARTS);

  // A KML document: a Placemark for each part, named by its block and what it is - walls and
  // panes among them - and the outline last.
  expect(text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<kml xmlns="[^"]+\/kml\/2\.2">/);
  expect(text).toContain(`<name>${PLOT} — house</name>`);
  const marks = marksOf(text);
  const parts = partsOf(marks);
  expect(parts.length).toBe(PARTS);
  expect(parts.filter(({ name }) => !/^\S.* — \S+$/.test(name))).toEqual([]);
  const what = parts.map(({ name }) => name.split(' — ').at(-1));
  expect([what.includes('wall'), what.filter((one) => one === 'pane').length]).toEqual([
    true,
    PANES,
  ]);
  // All white: every style's colour white or see-through white; plain faces, none with a hole.
  const colours = [...text.matchAll(/<color>(.*?)<\/color>/g)].map(([, colour = '']) => colour);
  expect(colours.length).toBeGreaterThan(0);
  expect(colours.filter((colour) => !WHITES.includes(colour))).toEqual([]);
  expect(text).not.toContain('innerBoundaryIs');
  // It says its raise, tuned by eye, and what it left out.
  expect(text).toContain('Raised by 2.5 m, tuned by eye to Google Earth&apos;s ground.');
  expect(text).toContain('Left out: the objects, and the ground as the sketch shapes it.');
  // Every point lies within 200 m of the made-up place.
  const far = marks
    .flatMap(({ points }) => points)
    .map(([longitude = NaN, latitude = NaN]) => {
      const east = (longitude - longitude0) * DEGREE_M * Math.cos((latitude0 * Math.PI) / 180);
      return Math.hypot(east, (latitude - latitude0) * DEGREE_M);
    });
  expect(Math.max(...far)).toBeLessThan(NEAR_M);
  // The lowest foot and the highest top of a part, where the boxes stood, plus the raise.
  const first = altitudes(parts);
  expect(Math.min(...first)).toBeCloseTo(LOWEST_FOOT_M + 2.5, 2);
  expect(Math.max(...first)).toBeCloseTo(HIGHEST_TOP_M + 2.5, 2);
  expect(asked).toEqual([]);

  // Opened again, the page has the raise in its field: the browser kept it, for this pad.
  await page.reload();
  expect(await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`)).toBe(
    true,
  );
  await expect(page.locator('body')).toHaveAttribute('data-stage', 'drawn');
  await expect(raise(page)).toHaveValue('2.5');
  expect(await page.evaluate<string | null>(`localStorage.getItem('${RAISE_KEY}')`)).toBe('2.5');

  // 0 typed and saved again: every altitude of a part 2.5 m lower, and the outline the same.
  asked.length = 0;
  const flat = marksOf(await saveRaised(page, '0', PARTS));
  const lower = altitudes(partsOf(flat));
  expect(lower.length).toBe(first.length);
  lower.forEach((altitude, at) => expect(altitude).toBeCloseTo((first[at] ?? NaN) - 2.5, 2));
  expect(flat.at(-1)).toEqual(marks.at(-1));

  // The upper level switched off by its checkbox and saved again, the raise still 0: its parts
  // are not in the file, nothing stands above its floor, and the file says what it left out.
  const upper = page.locator('#levels').getByRole('checkbox', { name: UPPER });
  await upper.uncheck();
  await expect(upper).not.toBeChecked();
  const lowText = await saveRaised(page, '0', BELOW_UPPER);
  const low = partsOf(marksOf(lowText));
  expect(low.length).toBe(BELOW_UPPER);
  expect(Math.max(...altitudes(low))).toBeLessThanOrEqual(UPPER_M + 0.005);
  expect(lowText).toContain(
    'Left out: the objects, and the ground as the sketch shapes it, and what is switched off in 3D.',
  );

  // The page asked nobody, and wrote nothing of the sketch.
  expect(asked).toEqual([]);
  expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
});
