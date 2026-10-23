import type { Page } from '@playwright/test';
import { BEFORE, asNow, golden } from './sketch-golden';
import { BROWSER, NO_ROOM, TAKEN, expect, keepAs, keptWindow, named } from './sketch-folder';
import { openFolder, pick, saved, test, type Folders } from './sketch-folder';

// Keep and Open kept on a plot that came as its folder (ST-040, T-040.5), on the made-up pad of
// the project, in a browser of a profile of its own with a stand-in picker that hands over a
// folder of the origin's private file system (sketch-folder.ts): the terrace plot's. Kept into
// its sketches/, byte for byte what "Save file" saves, never over a file; a sketch of an earlier
// version that lay there before - as a pad of before kept it - listed and opened as it was (the
// story's Rule 4); the leave to write there withdrawn - asked, refused, kept in the browser and
// said - and Open kept of that folder then listing both, the browser's said "in this browser".

const KEY = JSON.stringify('blockplot/sketch/plot/terrace/space');
const REFUSED = `The folder terrace may not be written to, so this sketch is kept ${BROWSER}.`;
const OLDEST = BEFORE[0] ?? 0;

/** A page of the case's browser on the terrace plot, opened from its folder. */
async function onTerrace(folders: Folders): Promise<Page> {
  const page = await folders.browser.newPage();
  await page.goto('/#top');
  await openFolder(page, 'terrace');
  return page;
}

test("Keep writes into the folder's sketches/, as Save file saves, and never over a file", async ({
  folders,
}) => {
  await folders.put('terrace');
  const page = await onTerrace(folders);
  const name = named('In the folder');
  await pick(page.locator('#keep'));
  await expect(keptWindow(page).where).toHaveText(
    'Sketches of this plot are kept in the folder terrace.',
  );
  expect(await keepAs(page, name)).toBe(`Kept in the folder terrace: sketches/${name}.json`);
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  const file = `${name}.json`;
  const first = await folders.read('terrace', 'sketches', file);
  expect(Buffer.from(first ?? '').equals(await saved(page)), 'not what Save file saves').toBe(true);
  // The same name again: taken, and the file is as it was, alone there.
  expect(await keepAs(page, name)).toBe(TAKEN(name));
  expect(await folders.read('terrace', 'sketches', file)).toBe(first);
  expect(await folders.list('terrace', 'sketches')).toEqual([file]);
  // Listed by Open kept, with nothing said of this browser: the folder holds it.
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  await pick(page.locator('#open-kept'));
  await expect(keptWindow(page).picks).toHaveText([name]);
  await expect(keptWindow(page).shown.locator('#kept-list p')).not.toContainText('in this browser');
});

test('a sketch of an earlier version, lying in sketches/ before, is listed and opened as it was', async ({
  folders,
}) => {
  await folders.put('terrace');
  // As the pad's server kept them before: the made-up house of the oldest version, beside a
  // file under a name the pad does not take - counted, not listed.
  await folders.write(golden('made-up', OLDEST), 'terrace', 'sketches', 'Before 1.json');
  await folders.write('{}', 'terrace', 'sketches', 'Küche.json');
  const page = await onTerrace(folders);
  const { shown, picks, said } = keptWindow(page);
  await pick(page.locator('#open-kept'));
  await expect(picks).toHaveText(['Before 1']);
  await expect(said).toContainText('Not listed: 1 of the files there');
  await picks.first().click();
  await expect(shown).toBeHidden();
  // Read as "Open file" reads it: as the pad of now writes it, and one step to undo.
  await expect
    .poll(() => page.evaluate<string | null>(`localStorage.getItem(${KEY})`))
    .toBe(asNow('made-up', OLDEST));
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  // Nothing was written into the folder by opening it.
  expect(await folders.read('terrace', 'sketches', 'Before 1.json')).toBe(
    golden('made-up', OLDEST),
  );
});

test('the leave withdrawn: Keep asks, is refused, keeps in the browser and says so; Open kept lists both', async ({
  folders,
}) => {
  await folders.put('terrace');
  const first = await onTerrace(folders);
  const inFolder = named('Before the leave went');
  expect(await keepAs(first, inFolder)).toBe(
    `Kept in the folder terrace: sketches/${inFolder}.json`,
  );
  await first.close();
  // The leave withdrawn, for every page opened from now on: asked, it is refused.
  await folders.withdraw();
  const page = await folders.browser.newPage();
  await page.goto('/#top');
  await expect(page.locator('html[data-shown="terrace"]')).toHaveCount(1);
  const inBrowser = named('After the leave went');
  expect(await keepAs(page, inBrowser)).toBe(`${REFUSED} ${NO_ROOM}`);
  expect(await folders.list('terrace', 'sketches')).toEqual([`${inFolder}.json`]);
  // Open kept: the folder's first, then this browser's, said so.
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  await pick(page.locator('#open-kept'));
  const entries = keptWindow(page).shown.locator('#kept-list p');
  await expect(keptWindow(page).picks).toHaveText([inFolder, inBrowser]);
  await expect(entries.first()).not.toContainText('in this browser');
  await expect(entries.last()).toHaveText(/ kept \S.* in this browser$/);
  // The browser's opens as the folder's would.
  await keptWindow(page).picks.last().click();
  await expect(keptWindow(page).shown).toBeHidden();
});
