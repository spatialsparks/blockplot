import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The header of the pad's 3D page, end to end, on the made-up plot with the made-up sketch: File
// holds two entries in every way - the picture, on in each, and the 3D file, off in the Volumes,
// where the line under it says why, on in White and in Materials - and neither the header nor
// the stage is another size in any way, with the menu open or shut; open, the menu has this
// page's keys too; the header breaks into lines between its groups - File, the views, the ways,
// the stands, and its tail: the two switches - and never inside one, however narrow the window;
// a line of it is 68 pixels, whatever stands on it - Settings and Full screen too, its two
// buttons outside a group, Settings first; no line is empty where a way hides what it has no use
// for; the stage has all the header leaves; the levels stand left of the stage, and the figures
// right of it once Settings open them, on a stage so much narrower - which shut shows what it
// showed (T-029.5); and without WebGL only the switch of views. What the entries save is
// sketch-3d-picture.spec.ts's and sketch-3d-file.spec.ts's; that the switch of views stands where
// the pad has it, sketch-menu.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts demo-site.js in
// the place of site.js. The real plot is in no part of this run: a case asks yes or no whether its
// page is on the made-up plot, before a matcher reads that page (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no control of one';

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// A browser that gives no WebGL: a canvas is asked for it, and has none.
const NO_WEBGL = `{
  const ask = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...more) {
    return /webgl/.test(kind) ? null : ask.call(this, kind, ...more);
  };
}`;
// The groups of the header, and of each: how many things it has a place for, and how many of
// them are seen; how far apart their middles lie down the page - on one line, not at all - the
// line it is on, by its middle, and its right edge; and how high its place in the header is,
// over the word under it. A thing that is not seen and keeps its place has its place on the
// line. The views are the switch itself, the one thing of their group.
const GROUPS = ['#file-group', '#views', '#ways', '#stands', '.tail'];
type Group = Record<'things' | 'seen' | 'apart' | 'line' | 'right' | 'high', number>;
const LINES = `${JSON.stringify(GROUPS)}.map((group) => {
  const one = document.querySelector(group);
  const all = [...one.children].filter((thing) => !thing.hidden);
  const seen = all.filter((thing) => getComputedStyle(thing).visibility !== 'hidden').length;
  const boxes = all.map((thing) => thing.getBoundingClientRect());
  const middles = boxes.map((box) => box.top + box.height / 2);
  const [line, last] = [Math.min(...middles), Math.max(...middles)];
  const { right } = one.getBoundingClientRect();
  const high = one.closest('header > *').getBoundingClientRect().height;
  return { things: all.length, seen, apart: last - line, line, right, high };
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
const pick = async (page: Page, way: string): Promise<void> => {
  await page.locator(`button[data-way=${way}]`).click();
  await expect(page.locator('body')).toHaveAttribute('data-way', way);
};
/** Where the header and the stage lie, File, the switch of views beside it, Settings and Full screen - or the parts that are named: left, top, width and height of each, in pixels - of File also where it is not seen - and nothing of a part that has no place. */
const TOP = ['header', '#stage', '#file-menu', '#views', '#settings-open', '#full-screen'];
const placed = (page: Page, parts = TOP): Promise<(number[] | null)[]> =>
  Promise.all(
    parts.map(async (one) => {
      const box = await page.locator(one).boundingBox();
      return box && [box.x, box.y, box.width, box.height];
    }),
  );
/** The stage as it shows once it has been drawn: a picture of its canvas, taken when the browser has shown six frames more. And the canvas's own pixels, across and down: page code. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await page.evaluate(`(async () => {
    for (let left = 6; left > 0; left -= 1) await new Promise(requestAnimationFrame);
  })()`);
  return page.locator('#stage canvas').screenshot();
}
const CANVAS = `(({ width, height }) => [width, height])(document.querySelector('#stage canvas'))`;
// File's menu, one under the other: why the 3D file is off, where it is; the Google Earth file.
const ENTRIES = ['Export', 'Picture (PNG)', '3D file (GLB)'];
const WHY = 'The Volumes show no part of a house: White and Materials do.';
const EARTH = ['Google Earth file (KML)', 'Raise in Google Earth m — tuned by eye'];

test('File holds the picture and the 3D file in every way: the picture on in each, the file off in the Volumes, where it says why', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  const file = page.getByRole('button', { name: 'File', exact: true });
  const entry = page.getByRole('button', { name: '3D file (GLB)' });
  const picture = page.getByRole('button', { name: 'Picture (PNG)' });
  const entries = page.locator('#file-entries > :visible');
  // The page opens in the volumes. File is one button, and shut: no entry shows - nothing
  // answers to an entry's name.
  await expect(page.locator('body')).toHaveAttribute('data-way', 'volumes');
  await expect(file).toHaveAttribute('id', 'file-menu');
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  for (const one of [entry, picture]) await expect(one).toHaveCount(0);
  await expect(page.locator('#save')).toBeHidden();
  const first = await placed(page);
  expect(first[2]?.[2]).toBeGreaterThan(0);
  // In every way File opens on the word "Export" and its two entries, the picture first, each
  // saying what it saves to a pointer that rests on it. The picture is on in every way, and has
  // the focus: the stage shows in each. The 3D file is on in White and in Materials; in the
  // Volumes, where no part of a house stands on the stage, it is off, and the line under it
  // says why. And neither the header nor the stage is another size, in whichever way, with the
  // menu shut or open - nor do the switch of views and Settings move: a menu takes no room.
  for (const way of ['volumes', 'white', 'materials', 'volumes', 'white']) {
    const built = way !== 'volumes';
    await pick(page, way);
    expect(await placed(page), way).toEqual(first);
    await file.click();
    await expect(file).toHaveAttribute('aria-expanded', 'true');
    await expect(entries).toHaveText([...ENTRIES, ...(built ? [] : [WHY]), ...EARTH]);
    await expect(picture).toHaveAttribute('id', 'picture');
    await expect(picture).toBeEnabled();
    await expect(picture).toHaveAttribute('title', /^The stage as it shows, as a picture/);
    await expect(entry).toHaveAttribute('id', 'save');
    await expect(entry).toBeEnabled({ enabled: built });
    await expect(page.locator('#save-why')).toBeVisible({ visible: !built });
    await expect(entry).toHaveAttribute(
      'title',
      /in metres.* one file that other 3D programs open$/,
    );
    await expect(picture).toBeFocused();
    expect(await placed(page), `${way}, with the menu open`).toEqual(first);
    // Open, the menu has the keys of this page too: 1 goes to no view, Page Down to no level.
    await page.keyboard.press('1');
    await page.keyboard.press('PageDown');
    await expect(page).toHaveTitle('3D — sketch pad');
    await expect(page.locator('body')).toHaveAttribute('data-level', 'all');
    // Escape shuts it, and File has the focus.
    await page.keyboard.press('Escape');
    await expect(file).toHaveAttribute('aria-expanded', 'false');
    await expect(file).toBeFocused();
    await expect(entry).toHaveCount(0);
  }
  // Shut, a key is what it was: Page Down goes a level down.
  await page.keyboard.press('PageDown');
  await expect(page.locator('body')).toHaveAttribute('data-level', '817');
  // The pointer down on the stage shuts the menu too, and a pick: the entry, on in White,
  // saves a file.
  await file.click();
  await expect(file).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#stage').click({ position: { x: 600, y: 400 } });
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await file.click();
  await expect(entry).toHaveText('3D file (GLB)');
  await expect(entry).toBeEnabled();
  const saving = page.waitForEvent('download');
  await entry.click();
  expect((await saving).suggestedFilename()).toMatch(/^house-\d{4}-\d{2}-\d{2}\.glb$/);
  await expect(file).toHaveAttribute('aria-expanded', 'false');
});

test('the header breaks between its groups and never inside one, and the stage has the rest', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  // In the volumes, as the page opens: the way that hides the most of the header.
  await expect(page.locator('body')).toHaveAttribute('data-way', 'volumes');
  // Every width from a window wider than any header, in whatever font, down to a narrow one, in
  // steps smaller than the narrowest thing of a group: wherever a line of the header ends, some
  // window of these ends it there. Down to 480 pixels, where it was 600: with its controls as
  // squares the header's groups are narrower, and break into a third line that much later -
  // from 579 pixels down, where it was 708 - which the narrowest window of before did not reach.
  const lines: number[] = [];
  for (let width = 2400; width >= 480; width -= 30) {
    await page.setViewportSize({ width, height: 720 });
    const groups = await page.evaluate<Group[]>(LINES);
    // File, one button - its entries take no place, and are hidden; the seven views; the three
    // ways; the five stands; and the tail: the two switches. File is seen in every way, and of
    // the tail the switch of the ground alone is here: it stands on a line with the one that
    // is not.
    expect(groups.map(({ things }) => things)).toEqual([1, 7, 3, 5, 2]);
    expect(groups.map(({ seen }) => seen)).toEqual([1, 7, 3, 5, 1]);
    // The things of a group lie on one line, and no group is cut off by the window's edge. And
    // every group is as high, whatever it holds: 54 pixels of controls, over 14 for its name.
    for (const [at, { apart, right, high }] of groups.entries()) {
      expect(apart, `${GROUPS[at]} at ${width}`).toBeLessThan(3);
      expect(right, `${GROUPS[at]} at ${width}`).toBeLessThanOrEqual(width);
      expect(high, `${GROUPS[at]} at ${width}`).toBe(54);
    }
    // The groups follow each other in their order: each on the line of the one before it, or
    // on a later one - a line being 68 pixels high, and six more to the next.
    const steps = groups.slice(1).map(({ line }, at) => line - (groups[at]?.line ?? NaN));
    expect(
      Math.min(...steps),
      `a group stands over the one before it, at ${width}`,
    ).toBeGreaterThan(-3);
    // The views stand on the line of File: the switch stands beside it, as on the pad's page.
    expect(steps[0], `File stands alone on its line, at ${width}`).toBeLessThan(3);
    lines.push(1 + steps.filter((step) => step > 10).length);
    // And the stage has what the header leaves it: all the window under it, to its foot - from
    // a whole pixel on, however many lines the header is: a picture of the stage is the stage's.
    const [header, stage, , , ...alone] = await placed(page);
    const [, , , high = NaN] = header ?? [];
    const [, top = NaN, , deep = NaN] = stage ?? [];
    expect([top, top + deep], `the stage at ${width}`).toEqual([high, 720]);
    expect(Number.isInteger(high), `the header is ${high} pixels high at ${width}`).toBe(true);
    // It is so many lines of 68 pixels, 6 between two, in 10 of padding over a line of 1.
    expect((high - 5) % 74, `the header is ${high} pixels high at ${width}`).toBe(0);
    // Settings and Full screen, in no group, stand on a line as a square does: 2 down, 50 high.
    for (const [left = NaN, down = NaN, wide = NaN, tall = NaN] of alone.map((box) => box ?? [])) {
      expect([(down - 8) % 74, tall, left >= 0], `${left} at ${width}`).toEqual([0, 50, true]);
      expect(left + wide, `Settings or Full screen at ${width}`).toBeLessThanOrEqual(width);
    }
  }
  // The case can fail: the header is one line in the widest window, and more with every line
  // that a narrower one breaks it into - never fewer.
  expect(lines[0]).toBe(1);
  expect(lines.at(-1)).toBeGreaterThan(2);
  expect(lines).toEqual([...lines].sort((one, next) => one - next));
});

test('the levels stand left of the stage, and the figures right of it once Settings open them: on a stage 260 pixels narrower, which shut shows what it showed', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  await pick(page, 'white');
  /** From where to where across the window, 1280 pixels wide, the levels, the stage and the figures reach - nothing, of what has no place - and after them the canvas's own pixels. */
  const across = async (): Promise<number[]> => [
    ...(await placed(page, ['#side', '#stage', '#settings'])).flatMap((box) =>
      box ? [box[0] ?? NaN, (box[0] ?? NaN) + (box[2] ?? NaN)] : [],
    ),
    ...(await page.evaluate<number[]>(CANVAS)),
  ];
  // Settings is a button of the toolbar itself, and shut as the page opens: the levels have
  // the window's first 200 pixels, wholly left of the stage, and the stage all the rest.
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  await expect(page.locator('header > button')).toHaveText(['Settings', 'Full screen']);
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  const high = (await page.locator('#stage').boundingBox())?.height ?? NaN;
  const SHUT = [0, 200, 200, 1280, 1080, high];
  expect(await across()).toEqual(SHUT);
  const before = await picture(page);
  // Opened, the figures stand wholly right of the stage, in the window's last 260 pixels: the
  // stage is so much narrower, as high, and drawn at that size - its canvas, and its picture.
  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#settings #figures li')).toHaveCount(8);
  await expect.poll(across).toEqual([0, 200, 200, 1020, 1020, 1280, 820, high]);
  const opened = await picture(page);
  expect([opened.readUInt32BE(16), opened.readUInt32BE(20)]).toEqual([820, high]);
  // Shut, the stage has that room again and shows the picture it showed before Settings were
  // opened, to the pixel: drawn again at its size, from where the view looked - no camera moved.
  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(across).toEqual(SHUT);
  expect((await picture(page)).equals(before), 'the stage is not as it was').toBe(true);
});

test('without WebGL there is no stage: the page has the switch of views and no other control, and File, not seen, keeps its place', async ({
  page,
}) => {
  await page.addInitScript(NO_WEBGL);
  expect(await open(page)).toBe(false);
  // File is in the page and not seen: nothing answers to its name, and Tab passes it by, to the
  // first of the views. Its entries are in the page too - not seen either, and the file's off.
  for (const part of ['#file-menu', '#picture', '#save']) {
    await expect(page.locator(part)).toBeHidden();
    await expect(page.locator(part)).toHaveCount(1);
  }
  await expect(page.locator('#save')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'File', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '3D file (GLB)' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Picture (PNG)' })).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Top view' })).toBeFocused();
  // So the page has the switch and no other control: its seven links alone are seen, of all that
  // is pressed or typed into - no Settings, no level, no way, no stand.
  const SWITCH = ['Top view', 'Side view', 'Other side', 'Front view', 'Back view', '3D', 'Info'];
  await expect(page.locator(':is(a, button, input, select):visible')).toHaveText(SWITCH);
  // It keeps its place: as wide as it is where it is seen, with the views right of it - at the
  // pixels they have on the pad's page, which sketch-menu.spec.ts holds.
  const [, , file] = await placed(page);
  const views = await page.locator('#views').boundingBox();
  expect(file?.[2]).toBeGreaterThan(0);
  expect(views?.x).toBeGreaterThan((file?.[0] ?? NaN) + (file?.[2] ?? NaN));
  // Nor is the group seen that holds nothing but controls of a stage, word and all: only the
  // views. And no group answers to the name of File.
  for (const group of ['File', 'With'])
    await expect(page.getByRole('group', { name: group })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'View' })).toHaveCount(1);
});
