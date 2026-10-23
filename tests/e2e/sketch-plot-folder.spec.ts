import { expect, keepAs, keptWindow, named, openFolder, pick, saved, test } from './sketch-folder';

// The story's main path, end to end (ST-040, Behaviour row 1; T-040.5): the pages served as plain
// files by the project's pad (`pnpm sketch --demo`), a made-up plot's folder on the disk - here
// the terrace plot's, in the origin's private file system of a browser with a profile of its own,
// since a test cannot answer the real folder picker (sketch-folder.ts) - picked through File,
// Open plot, "A plot's folder…"; the plot shows with its ground; a block drawn from above; Keep
// under a name: the file sketches/<name>.json lies in that folder, byte for byte what "Save file"
// saves; the page opened again opens on the terrace plot, and Open kept lists the sketch.

const TERRACE = 'Made-up terrace, by the lake / north';
const KEY = JSON.stringify('blockplot/sketch/plot/terrace/space');

test("a plot's folder opened, a block drawn and kept: the file lies in its sketches/, and the plot opens again", async ({
  folders,
}) => {
  await folders.put('terrace');
  const page = await folders.browser.newPage();
  await page.goto('/#top');
  await openFolder(page, 'terrace');
  // The terrace plot, from its folder, with its ground: the paper says its levels, the ground among them.
  const shows = `globalThis.SITE?.name === ${JSON.stringify(TERRACE)} && globalThis.PLOT?.way === 'folder'`;
  expect(await page.evaluate<boolean>(shows), 'not the terrace plot of its folder').toBe(true);
  const ground = 'globalThis.SITE?.ground?.rowsCm?.length > 1';
  expect(await page.evaluate<boolean>(ground), 'the plot shows no ground').toBe(true);
  await expect(page.locator('#layers li button:first-child').last()).toHaveText('Ground');

  // A block drawn from above: a level made - "New level", its height asked, in the middle of
  // what the plot's paper spans - then Block by its key, dragged across the middle of the paper.
  const [low, high] = await page.evaluate<[number, number]>('globalThis.paper.SPANS.side');
  page.once('dialog', (asked) => void asked.accept(String(Math.round((low + high) / 2))));
  await page.locator('#add').click();
  await expect(page.locator('#layers li')).toHaveCount(2);
  const paper = await page.locator('#paper').boundingBox();
  if (paper === null) throw new Error('the paper is not seen');
  const at = (part: number) =>
    [paper.x + paper.width * part, paper.y + paper.height * part] as const;
  await page.mouse.move(...at(0.45));
  await page.keyboard.press('b');
  await page.mouse.move(...at(0.46));
  await page.mouse.down();
  await page.mouse.move(...at(0.55), { steps: 4 });
  await page.mouse.up();
  const things = `JSON.parse(localStorage.getItem(${KEY}) ?? '{"things":[]}').things.length`;
  await expect.poll(() => page.evaluate<number>(things)).toBe(1);

  // Kept under a name: in the folder, as "Save file" saves it.
  const name = named('Terrace block');
  await pick(page.locator('#keep'));
  await expect(keptWindow(page).where).toHaveText(
    'Sketches of this plot are kept in the folder terrace.',
  );
  expect(await keepAs(page, name)).toBe(`Kept in the folder terrace: sketches/${name}.json`);
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  const file = await folders.read('terrace', 'sketches', `${name}.json`);
  expect(file, 'no file in the folder').not.toBeNull();
  const bytes = await saved(page);
  expect(Buffer.from(file ?? '').equals(bytes), 'Keep wrote another file than "Save file"').toBe(
    true,
  );

  // A new page of the browser opens on the terrace plot, and Open kept lists the sketch.
  const again = await folders.browser.newPage();
  await again.goto('/#top');
  await expect(again.locator('html[data-shown="terrace"]')).toHaveCount(1);
  await pick(again.locator('#open-kept'));
  await expect(keptWindow(again).picks).toHaveText([name]);
});
