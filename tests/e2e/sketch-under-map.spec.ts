import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { LAYERS, expect, test, type OwnPad } from './sketch-own-pad';

// swisstopo's map under the top view (story ST-046, task T-046.3): the story's one end-to-end
// test, its main path. On a pad and a stand-in of its own (sketch-own-pad.ts), the pad told
// nothing and its page told the stand-in by `?asks=<port>`: the trial plot of the stand-in's
// made-up world held in the case's browser as the plot shown last, the top view opened, Map
// switched on. It names nothing of the cadastre, and so passes in both trees, Blockplot's among
// them. Where the map lies, its level and its pictures are the fast gate's, place.check.js and
// lay.check.js, by hand; what the tab keeps of the control, switch.check.js. Page code is handed
// over as text.

const FIXTURE = 'tests/__fixtures__/new-plot/trial-slope-photo.json';
const TRIAL = readFileSync(new URL(`../../${FIXTURE}`, import.meta.url), 'utf8');
const KEY = 'blockplot/sketch/under';
// The path of every picture that the stand-in may be asked: of a layer of `LAYERS`, in LV95.
const LAYER_IDS = Object.values(LAYERS).map(([id]) => id.replaceAll('.', '\\.'));
const PICTURE = new RegExp(
  `^/1\\.0\\.0/(${LAYER_IDS.join('|')})/default/current/2056/\\d+/\\d+/\\d+\\.(jpeg|png)$`,
);

/** Holds the trial plot in the case's browser, of the file way, as the plot shown last (T-040.3). */
async function holdTrial(pad: OwnPad): Promise<void> {
  const page = await pad.browser.newPage();
  await page.goto('/');
  await page.evaluate(`(async () => {
    const [{ hold }, { recordOf, LAST }, { read }] = await Promise.all(
      ['/store/held.js', '/store/rules.js', '/plot-file.js'].map((at) => import(at)));
    const text = ${JSON.stringify(TRIAL)};
    await hold(recordOf({ id: 'trial', site: read(text).site, text, way: 'file', day: '2026-10-29' }));
    localStorage.setItem(LAST, 'trial');
  })()`);
  await page.close();
}

/** The pad's page on the trial plot, told the stand-in, at `hash`: once its last script has loaded. */
async function openTrial(page: Page, pad: OwnPad, hash = ''): Promise<void> {
  await page.goto(`/?asks=${new URL(pad.standIn.origin).port}${hash}`);
  await expect(page.locator('html[data-shown="trial"]')).toHaveCount(1);
}

/** What lies under the paper: the pictures, whether each came, how strongly each shows, the turn of their box in degrees, and the words in the corner. */
type Laid = {
  shown: boolean;
  turn: number;
  sources: string[];
  came: boolean[];
  opacities: string[];
  said: string;
};
const laidOf = (page: Page): Promise<Laid> =>
  page.evaluate<Laid>(`(() => {
    const holder = document.getElementById('under-map');
    const box = holder.querySelector(':scope > div');
    const { a, b } = new DOMMatrix(getComputedStyle(box).transform);
    const pictures = [...holder.querySelectorAll('img')];
    return {
      shown: !holder.hidden,
      turn: Math.atan2(b, a) * 180 / Math.PI,
      sources: pictures.map((img) => img.src),
      came: pictures.map((img) => img.complete && img.naturalWidth === 256),
      opacities: [...new Set(pictures.map((img) => img.style.opacity))],
      said: holder.querySelector(':scope > p').textContent,
    };
  })()`);
/** Waits until pictures lie under the paper and every one came, and gives what lies there. */
async function laid(page: Page): Promise<Laid> {
  const ready = async (): Promise<boolean> => {
    const { sources, came } = await laidOf(page);
    return sources.length > 0 && came.every(Boolean);
  };
  await expect.poll(ready, 'the pictures of the map did not come').toBe(true);
  return laidOf(page);
}
/** Holds that nothing lies under the paper, no credits show, and that the stand-in is asked nothing more meanwhile. */
async function none(page: Page, pad: OwnPad): Promise<void> {
  const before = (await pad.standIn.asked()).length;
  await page.evaluate('new Promise((done) => setTimeout(done, 600))');
  expect(await laidOf(page)).toMatchObject({ shown: false, sources: [] });
  await expect(page.locator('#under-map > p')).toBeHidden();
  expect((await pad.standIn.asked()).length).toBe(before);
}
/** What File saves - Picture (PNG) or Save file - as bytes. */
async function saved(page: Page, entry: 'picture' | 'save'): Promise<Buffer> {
  await page.locator('#file-menu').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator(`#${entry}`).click(),
  ]);
  return readFile(await download.path());
}
const photo = (pad: OwnPad, level = ''): string =>
  `${pad.standIn.origin}/1.0.0/${LAYERS.photo[0]}/default/current/2056/${level}`;

test('Map in the top view: the photo under the paper, turned by the bearing, at the slider strength, kept for the tab, never in a slice, the picture or the sketch', async ({
  pad,
}, testInfo) => {
  await holdTrial(pad);
  const page = await pad.browser.newPage();
  await openTrial(page, pad);
  // The control, in the View group, off, the photo and 50 % first; nothing asked yet.
  const control = page.locator('#view-group #under-control');
  const on = page.locator('#under-on');
  const layer = page.locator('#under-layer');
  const strength = page.locator('#under-strength');
  await expect(control).toBeVisible();
  await expect(on).not.toBeChecked();
  await expect(layer).toHaveText('Aerial photo');
  await expect(strength).toHaveValue('50');
  // The choice of map is a menu, as File is, and no list: none in the header.
  await expect(page.locator('header select')).toHaveCount(0);
  const entries = page.locator('#under-layers');
  await expect(entries).toBeHidden();
  await layer.click();
  await expect(entries.locator('button')).toContainText(['National map', 'Aerial photo']);
  await expect(entries.locator('[aria-checked="true"]')).toHaveText('Aerial photo');
  await page.screenshot({ path: testInfo.outputPath('menu.png') });
  await page.keyboard.press('Escape');
  await expect(entries).toBeHidden();
  /** A map chosen from the menu: its button pressed, then its entry. */
  const choose = async (name: string): Promise<void> => {
    await layer.click();
    await entries.getByRole('menuitemradio', { name, exact: true }).click();
    await expect(entries).toBeHidden();
    await expect(layer).toHaveText(name);
  };
  await none(page, pad);
  const paper = (): Promise<string> =>
    page.evaluate<string>(`document.getElementById('paper').toDataURL()`);
  const plain = await paper();

  // Switched on: the stand-in's photo under the paper, its box turned by the plot's bearing, at
  // half its strength, the credits in the corner; the paper's ground no longer painted.
  await on.check();
  const first = await laid(page);
  const bearing = await page.evaluate<number>('globalThis.SITE.bearingDeg');
  expect(bearing).toBeCloseTo(36.8699, 4);
  expect(first.turn).toBeCloseTo(90 - bearing, 3);
  expect(first.sources.every((source) => source.startsWith(photo(pad)))).toBe(true);
  expect(first.opacities).toEqual(['0.5']);
  expect(first.said).toContain('© swisstopo');
  await expect(page.locator('#under-map > p')).toBeVisible();
  const over = await paper();
  expect(over).not.toBe(plain);
  await page.screenshot({ path: testInfo.outputPath('under.png') });

  // 20 % on the slider: the pictures show at 20 %, and the drawing is unchanged.
  await strength.fill('20');
  await expect.poll(async () => (await laidOf(page)).opacities).toEqual(['0.2']);
  expect(await paper()).toBe(over);
  // Another map chosen: its pictures replace the others, with its credits; then the photo again.
  await choose('National map');
  const national = await laid(page);
  expect(national.sources.every((source) => source.includes(`/${LAYERS.national[0]}/`))).toBe(true);
  expect(national.said).toContain('© swisstopo');
  await choose('Aerial photo');
  await laid(page);

  // A slice: no control, no map, no credits, nothing more asked. Back to the top view, there again.
  await openTrial(page, pad, '#side');
  await expect(control).toBeHidden();
  await none(page, pad);
  await page.screenshot({ path: testInfo.outputPath('slice.png') });
  await openTrial(page, pad, '#top');
  await expect(on).toBeChecked();
  expect((await laid(page)).opacities).toEqual(['0.2']);

  // At 30 %, the tab reloaded: on again, the photo at 30 %. In a new tab it is off.
  await strength.fill('30');
  await page.reload();
  await expect(page.locator('html[data-shown="trial"]')).toHaveCount(1);
  await expect(on).toBeChecked();
  await expect(layer).toHaveText('Aerial photo');
  await expect(strength).toHaveValue('30');
  expect((await laid(page)).opacities).toEqual(['0.3']);
  const other = await pad.browser.newPage();
  await openTrial(other, pad);
  await expect(other.locator('#under-on')).not.toBeChecked();
  await none(other, pad);
  await other.close();

  // Picture (PNG) is the paper as it always was: the same with the map on as with it off.
  const withMap = await saved(page, 'picture');
  const sketch = (await saved(page, 'save')).toString('utf8');
  await on.uncheck();
  await none(page, pad);
  expect(await saved(page, 'picture')).toEqual(withMap);
  // The sketch, the plot held and the browser's notes hold nothing of the map; the tab its three settings.
  expect(sketch).not.toMatch(/under|strength|swissimage|swisstopo/);
  const held = `import('/store/held.js').then(({ plot }) => plot('trial')).then((one) => one.text)`;
  expect(await page.evaluate<string>(held)).toBe(TRIAL);
  const notes = await page.evaluate<string[]>('Object.values(localStorage)');
  expect(notes.filter((note) => /under|strength|swissimage/.test(note))).toEqual([]);
  expect(await page.evaluate<string | null>(`sessionStorage.getItem('${KEY}')`)).toBe(
    '{"on":false,"layer":"photo","strength":0.3}',
  );

  // Every request the stand-in heard is a GET of a picture of a layer of `LAYERS`.
  const asked = await pad.standIn.asked();
  expect(asked.length).toBeGreaterThan(0);
  for (const { method, target } of asked) {
    expect(method, target).toBe('GET');
    expect(target).toMatch(PICTURE);
  }
});

test('the made-up pad offers no map, even told a stand-in', async ({ page }) => {
  await page.goto('/?asks=5123');
  await expect(page.locator('html[data-shown="example"]')).toHaveCount(1);
  expect(await page.evaluate<boolean>('globalThis.under.offered')).toBe(false);
  await expect(page.locator('#under-control')).toBeHidden();
});
