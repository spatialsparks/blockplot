import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';
import { test as withFolders } from './sketch-folder';

// Open plot in the browser, end to end (story ST-040, task T-040.3), on the made-up pad of the
// project: File's entry; its window, which lists the plots this browser holds and the example,
// with the two ways in under them - a plot's file, given by its field, and a plot's folder, in a
// browser of a profile of its own with a stand-in picker (sketch-folder.ts); a plot held and shown
// in this window, in every view and again on a reload; a file that does not read refused; a file
// given twice, and a folder's own file, one plot; a browser that takes no folder; the plot shown
// last gone from the browser. Each case has a browser of its own, which holds nothing as it begins,
// and after every case no page has said an error or asked another origin (directive 34). A case
// asks yes or no which plot a page shows (`SITE.name`, `PLOT`) once it marks itself shown.

const fixture = (id: string): string =>
  fileURLToPath(new URL(`../__fixtures__/plots/${id}/plot.json`, import.meta.url));
// The made-up plots' names; the id the terrace plot's file is held under - the folder New plot
// gives its name - and the words of the window, each stated a second time.
const [EXAMPLE, TERRACE] = ['Made-up hillside plot', 'Made-up terrace, by the lake / north'];
const AS_FILE = 'Made-up terrace by the lake north';
const PERSIST =
  "This browser may clear what it holds when it is short of room: a plot's folder keeps its sketches; a sketch kept in the browser is safe once saved as a file.";
const NO_FOLDER =
  "This browser cannot be given a folder — Chrome and Edge can. A plot's file opens here, and what is kept on it stays in this browser.";
/** This machine's day, as the store notes the day a plot was opened: `2026-10-20`. */
const today = (): string => new Date().toLocaleDateString('sv-SE');
const ENTRIES = ['Open file', 'Open kept', 'Open plot', 'Save file', 'Keep', 'Picture (PNG)'];

/** A browser of the case's own, on the made-up pad, which hears what its pages say is wrong. */
const test = base.extend<{ own: BrowserContext }>({
  own: async ({ browser, baseURL }, use) => {
    if (baseURL === undefined) throw new Error('the project names no address of the pad');
    const [context, wrong] = [await browser.newContext({ baseURL }), [] as string[]];
    context.on('weberror', (error) => wrong.push(error.error().message));
    context.on('console', (said) => said.type() === 'error' && wrong.push(said.text()));
    context.on('request', (request) => {
      if (new URL(request.url()).origin !== baseURL) wrong.push(`asked: ${request.url()}`);
    });
    await use(context);
    expect(wrong).toEqual([]);
    await context.close();
  },
});

/** Waits until a page marks itself shown on a plot, and fails unless it is that plot - by its script's site and its PLOT, of a way. */
async function expectShown(page: Page, id: string, name: string, way: string) {
  await expect(page.locator(`html[data-shown="${id}"]`)).toHaveCount(1);
  const plotted = `globalThis.PLOT?.id === ${JSON.stringify(id)} && globalThis.PLOT?.way === '${way}'`;
  const shows = `globalThis.SITE?.name === ${JSON.stringify(name)} && ${plotted}`;
  expect(await page.evaluate<boolean>(shows), `not the plot ${id}`).toBe(true);
}
/** File, then Open plot: the window, by its name. */
async function openWindow(page: Page) {
  await page.locator('#file-menu').click();
  await page.locator('#open-plot').click();
  const shown = page.getByRole('dialog', { name: 'Open a plot' });
  await expect(shown).toBeVisible();
  return shown;
}
/** A plot's file given in the window's field: the page loads anew where it is held. */
async function give(page: Page, id: string): Promise<void> {
  const loaded = page.waitForEvent('load');
  await page.locator('#plot-file').setInputFiles(fixture(id));
  await loaded;
}
/** The ids of the plots this browser holds, the newest first, asked of the pad's own store. */
const held = (page: Page): Promise<string[]> =>
  page.evaluate<string[]>(`import('/store/held.js').then(async ({ held }) =>
    (await held()).map(({ id }) => id))`);
const listed = (page: Page) => page.locator('#plot-list > p');
const said = (page: Page) => page.locator('#plot-said');

test('a first visit: File has "Open plot", whose window lists the example alone, with both ways in', async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#top');
  await expectShown(page, 'example', EXAMPLE, 'example');
  await page.locator('#file-menu').click();
  await expect(page.locator('#file-entries').getByRole('button')).toHaveText(ENTRIES);
  await page.locator('#file-menu').click();
  // The window, over the page: the example, the one that shows - and under it the two ways in.
  const shown = await openWindow(page);
  await expect(shown).toHaveAttribute('id', 'plot-window');
  expect(
    await page.evaluate<boolean>(`document.querySelector('#plot-window:modal') !== null`),
  ).toBe(true);
  await expect(listed(page)).toHaveText([`${EXAMPLE} the example, shows now`]);
  const plots = shown.locator('#plot-list').getByRole('button');
  await expect(plots).toHaveText([EXAMPLE]);
  await expect(plots).toHaveAttribute('aria-current', 'true');
  await expect(shown.locator('#plot-folder')).toHaveText("A plot's folder…");
  await expect(shown.locator('#plot-file-pick')).toHaveText("A plot's file…");
  await expect(shown.locator('#plot-file')).toHaveAttribute('accept', '.json,application/json');
  await expect(shown.locator('#plot-file')).toBeHidden();
  await expect(shown.locator('#plot-no-folder')).toHaveCount(0);
  await expect(said(page)).toBeEmpty();
  // A key pressed in the window is the window's: a 2 goes to no view. "Close" closes it; a pick
  // of the plot that shows closes it too, on the page as it was - and nothing is noted.
  await page.evaluate('globalThis.stayed = true');
  await plots.press('2');
  expect(new URL(page.url()).hash).toBe('#top');
  await shown.getByRole('button', { name: 'Close' }).click();
  await expect(shown).toBeHidden();
  await openWindow(page);
  await plots.click();
  await expect(shown).toBeHidden();
  expect(await page.evaluate<boolean>('globalThis.stayed === true')).toBe(true);
  expect(page.url()).toMatch(/\/#top$/);
  expect(await page.evaluate<string[]>('Object.keys(localStorage)')).toEqual([]);
});

test("a plot's file is held and shown in this window, in every view and on a reload, and listed first", async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#top');
  await openWindow(page);
  await give(page, 'terrace');
  // Shown, at the address it was given at. The first plot this browser holds: the window says,
  // once, that the browser may clear it - a test's browser keeps nothing for good.
  await expectShown(page, AS_FILE, TERRACE, 'file');
  expect(new URL(page.url()).hash).toBe('#top');
  await expect(said(page)).toHaveText(PERSIST);
  const mine = `${TERRACE} 336 m², opened ${today()}, this browser`;
  await expect(listed(page)).toHaveText([`${mine}, shows now`, `${EXAMPLE} the example`]);
  await expect(page.locator('#plot-list [aria-current="true"]')).toHaveText([TERRACE]);
  expect(await held(page)).toEqual([AS_FILE]);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#title')).toHaveText(TERRACE);
  // Each of the four other views by its key, and 3D: that plot.
  const VIEWS = { side: 'Side view', far: 'Other side', front: 'Front view', back: 'Back view' };
  for (const [at, [hash, view]] of Object.entries(VIEWS).entries()) {
    await page.keyboard.press(String(at + 2));
    await expect(page).toHaveTitle(`${view} — sketch pad`);
    expect(new URL(page.url()).hash).toBe(`#${hash}`);
    await expectShown(page, AS_FILE, TERRACE, 'file');
  }
  await page.keyboard.press('6');
  await expect(page).toHaveTitle('3D — sketch pad');
  await expectShown(page, AS_FILE, TERRACE, 'file');
  await expect(page.locator('#open-plot, #plot-window')).toHaveCount(0);
  // A reload shows it again, and says nothing more. A pick of the example shows the example.
  await page.goto('/#top');
  await expectShown(page, AS_FILE, TERRACE, 'file');
  await page.reload();
  await expectShown(page, AS_FILE, TERRACE, 'file');
  await expect(page.locator('#plot-window')).toBeHidden();
  const shown = await openWindow(page);
  await expect(said(page)).toBeEmpty();
  await shown.getByRole('button', { name: EXAMPLE }).click();
  await expectShown(page, 'example', EXAMPLE, 'example');
  await openWindow(page);
  await expect(listed(page)).toHaveText([mine, `${EXAMPLE} the example, shows now`]);
});

test("a file that does not read is refused with the reader's sentence, and nothing is held", async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#top');
  await openWindow(page);
  await page.evaluate('globalThis.stayed = true');
  await page.locator('#plot-file').setInputFiles(fixture('no-outline'));
  await expect(said(page)).toHaveText(
    '"plot.json" cannot be opened: It has no outline: three corners at the least, each two numbers.',
  );
  expect(await page.evaluate<boolean>('globalThis.stayed === true')).toBe(true);
  await expect(listed(page)).toHaveText([`${EXAMPLE} the example, shows now`]);
  expect(await held(page)).toEqual([]);
});

test('the same file given twice is one plot', async ({ own }) => {
  const page = await own.newPage();
  await page.goto('/#side');
  await openWindow(page);
  await give(page, 'terrace');
  await expectShown(page, AS_FILE, TERRACE, 'file');
  await expect(said(page)).toHaveText(PERSIST);
  // Given again: that plot, shown - nothing held anew, and nothing said.
  await give(page, 'terrace');
  await expectShown(page, AS_FILE, TERRACE, 'file');
  await expect(page.locator('#plot-window')).toBeHidden();
  expect(await held(page)).toEqual([AS_FILE]);
  await openWindow(page);
  await expect(listed(page)).toHaveCount(2);
});

test('a browser that takes no folder offers the file alone, and says why', async ({ own }) => {
  await own.addInitScript('delete globalThis.showDirectoryPicker;');
  const page = await own.newPage();
  await page.goto('/#top');
  const shown = await openWindow(page);
  await expect(shown.locator('#plot-no-folder')).toHaveText(NO_FOLDER);
  await expect(shown.locator('#plot-folder')).toHaveCount(0);
  await expect(shown.locator('#plot-file-pick')).toBeVisible();
});

test('the plot shown last, gone from the browser: the window opens as the page does, and says so', async ({
  own,
}) => {
  const page = await own.newPage();
  await page.goto('/#top');
  await page.evaluate(`sessionStorage.setItem('blockplot/plot/tab', 'nowhere')`);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Open a plot' })).toBeVisible();
  await expect(said(page)).toHaveText(
    'The plot "nowhere" that this browser showed last is no longer held here: the browser may have cleared what it held. Open its folder or its file again.',
  );
  await expect(listed(page)).toHaveText([`${EXAMPLE} the example, shows now`]);
});

withFolders(
  "a plot's folder is held as the folder and shown; its own file is that plot; a folder named example is refused",
  async ({ folders }) => {
    await folders.put('terrace');
    const page = await folders.browser.newPage();
    await page.goto('/#top');
    await openWindow(page);
    await page.locator('#plot-folder').click();
    await expectShown(page, 'terrace', TERRACE, 'folder');
    await expect(said(page)).toHaveText(PERSIST);
    const mine = `${TERRACE} 336 m², opened ${today()}, the folder terrace`;
    await expect(listed(page)).toHaveText([`${mine}, shows now`, `${EXAMPLE} the example`]);
    // The page wrote nothing into the folder: its plot.json is the fixture's, and alone there.
    expect(await folders.list('terrace')).toEqual(['plot.json']);
    const text = readFileSync(fixture('terrace'), 'utf8');
    expect(await folders.read('terrace', 'plot.json')).toBe(text);
    // Its own file, given: that one plot, still the folder's.
    await give(page, 'terrace');
    await expectShown(page, 'terrace', TERRACE, 'folder');
    expect(await held(page)).toEqual(['terrace']);
    await openWindow(page);
    await expect(listed(page)).toHaveText([`${mine}, shows now`, `${EXAMPLE} the example`]);
    // A folder named example: refused, nothing held.
    await folders.put('terrace', 'example');
    await folders.picks('example');
    await page.locator('#plot-folder').click();
    await expect(said(page)).toHaveText(
      '"example" cannot be opened: Its folder has a name that the pad does not take.',
    );
    expect(await held(page)).toEqual(['terrace']);
    // The permission withdrawn: the held folder may no longer be written into.
    await folders.withdraw();
    const later = await folders.browser.newPage();
    await later.goto('/#top');
    const mayWrite = `Promise.all(['/store/held.js', '/store/ways.js'].map((at) => import(at)))
      .then(async ([held, ways]) => ways.mayWrite((await held.plot('terrace')).folder))`;
    expect(await later.evaluate<boolean>(mayWrite)).toBe(false);
  },
);
