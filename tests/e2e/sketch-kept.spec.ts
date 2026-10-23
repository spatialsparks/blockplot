import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { BROWSER, NO_ROOM, TAKEN, keepAs, keptWindow, named, pick, saved } from './sketch-folder';

// The kept sketches of the sketch pad in the browser, end to end (ST-025, ST-040 T-040.5), on the
// made-up pad of the project, `pnpm sketch --demo`, which serves the pages as plain files: on the
// example, and on a plot given as its file, Keep keeps in the browser's store and says so; Open
// kept lists what is kept and opens it as "Open file" opens a file. A plot's folder is
// sketch-kept-folder.spec.ts's. Each case has a browser of its own, which holds nothing as it
// begins - and asks for no kept sketch of the server, which keeps none.

const fromRoot = (file: string): string => fileURLToPath(new URL(`../../${file}`, import.meta.url));
// The made-up sketch as "Save file" writes it, and where the page keeps the example's sketch.
const SKETCH = readFileSync(fromRoot('tests/__fixtures__/sketch/made-up.json'));
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// The levels of the made-up sketch, as the top view lists them; an empty paper has the ground.
const LEVELS = ['Level 817 m', 'Level 814 m', 'Level 812 m', 'Ground'];
const IN_BROWSER = `Kept ${BROWSER}.`;
const ELSEWHERE = 'https://example.invalid/';

/** Opens the pad's top view on the made-up plot - with the made-up sketch, or with none. */
async function openPad(page: Page, sketch: Buffer | null): Promise<void> {
  if (sketch) {
    const text = JSON.stringify(sketch.toString('utf8'));
    await page.addInitScript(`localStorage.setItem(${STORE}, ${text});`);
  }
  await page.goto('/#top');
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page.locator('#layers li')).toHaveCount(sketch ? LEVELS.length : 1);
}

/** Another page of the same browser on an empty paper: the example's sketch taken out first. */
async function emptyPage(page: Page): Promise<Page> {
  const other = await page.context().newPage();
  await other.addInitScript(`localStorage.removeItem(${STORE});`);
  await openPad(other, null);
  return other;
}

/** What the browser's store holds of a plot's kept sketches, asked of the pad's own module: `[name, text]`, the newest first. */
const inStore = (page: Page, plot: string): Promise<[string, string][]> =>
  page.evaluate(`import('/store/held.js').then(async ({ kept, keptText }) =>
    Promise.all((await kept(${JSON.stringify(plot)})).map(async ({ name }) =>
      [name, await keptText(${JSON.stringify(plot)}, name)])))`);

test('the example is kept in the browser, said so, listed and opened as the same sketch', async ({
  page,
}) => {
  const asked: string[] = [];
  page.on('request', (request) => asked.push(new URL(request.url()).pathname));
  const name = named('Made-up 2 be');
  await openPad(page, SKETCH);
  const { shown, field, where, said } = keptWindow(page);
  // Keep offers the day and the time, selected, and says first where the sketches go.
  await pick(page.getByRole('button', { name: 'Keep', exact: true }));
  await expect(field).toHaveValue(/^\d{4}-\d\d-\d\d \d\d\.\d\d\.\d\d$/);
  await expect(where).toHaveText(`Sketches of this plot are kept ${BROWSER}.`);
  await field.pressSequentially(name);
  await expect(field).toHaveValue(name);
  await expect(page.locator('[data-tool="move"]')).toHaveAttribute('aria-pressed', 'true');
  await shown.getByRole('button', { name: 'Keep under this name' }).click();
  // The first sketch the browser keeps: its no to keeping what it holds is said with it.
  await expect(said).toHaveText(`${IN_BROWSER} ${NO_ROOM}`);
  await expect(field).toBeHidden();
  await shown.getByRole('button', { name: 'Close' }).click();
  // What the store holds is what "Save file" saves, byte for byte.
  const kept = await inStore(page, 'example');
  expect(kept.map(([one]) => one)).toEqual([name]);
  expect(
    Buffer.from(kept[0]?.[1] ?? '').equals(await saved(page)),
    'not what Save file saves',
  ).toBe(true);
  expect(asked.filter((path) => path.includes('kept/'))).toEqual([]);

  // On an empty paper: Open kept lists it, with the time it was kept, and opens it.
  const other = await emptyPage(page);
  const list = keptWindow(other);
  await pick(other.getByRole('button', { name: 'Open kept' }));
  await expect(list.picks).toHaveText([name]);
  const entry = list.shown.locator('#kept-list p').first();
  await expect(entry).toHaveText(new RegExp(`^${name} kept \\S`));
  await expect(entry).not.toContainText('in this browser');
  await expect(list.said).toContainText('The newest first.');
  await list.picks.first().click();
  await expect(list.shown).toBeHidden();
  await expect(other.locator('#layers li button:first-child')).toHaveText(LEVELS);
  const opened = await other.evaluate<string | null>(`localStorage.getItem(${STORE})`);
  expect(opened === SKETCH.toString('utf8'), 'another sketch than the one that was kept').toBe(
    true,
  );
  // Undo brings back what was there: the empty paper.
  await other.getByRole('button', { name: 'Undo' }).click();
  await expect(other.locator('#layers li')).toHaveCount(1);
});

test('a name that is taken writes nothing, and the pad takes another; a name sent twice is kept once', async ({
  page,
}) => {
  const name = named('Taken');
  await openPad(page, SKETCH);
  expect(await keepAs(page, name)).toBe(`${IN_BROWSER} ${NO_ROOM}`);
  // On an empty paper, the same name: taken, and the kept sketch is as it was.
  const other = await emptyPage(page);
  expect(await keepAs(other, name)).toBe(TAKEN(name));
  const { field } = keptWindow(other);
  await expect(field).toHaveValue(name);
  expect(await keepAs(other, `${name} b`)).toBe(IN_BROWSER);
  const kept = new Map(await inStore(page, 'example'));
  expect([...kept.keys()]).toEqual([`${name} b`, name]);
  expect(kept.get(name) === SKETCH.toString('utf8'), 'the kept sketch was written over').toBe(true);

  // Enter, and Enter again with nothing in between: the second is no second sketch.
  await other.getByRole('button', { name: 'Close' }).click();
  await pick(other.locator('#keep'));
  await field.fill(`${name} c`);
  await other.evaluate(`{
    const form = document.querySelector('#kept-window form');
    form.requestSubmit();
    form.requestSubmit();
  }`);
  await expect(keptWindow(other).said).toHaveText(IN_BROWSER);
  expect((await inStore(page, 'example')).map(([one]) => one)).toEqual([
    `${name} c`,
    `${name} b`,
    name,
  ]);
});

test('a name that is none is refused in words, and nothing is kept', async ({ page }) => {
  await openPad(page, SKETCH);
  for (const name of ['a/b', '.hidden', '   ', 'a\\b', '..', 'Küche', 'n'.repeat(81)]) {
    expect(await keepAs(page, name), name).toMatch(/^Nothing was kept: /);
    await expect(keptWindow(page).field).toBeVisible();
  }
  expect(await inStore(page, 'example')).toEqual([]);
});

test('Open kept opens a kept sketch as "Open file" opens that file: a sketch, an old one, and what is none', async ({
  page,
}) => {
  const name = named('As a file');
  await openPad(page, null);
  // Kept in the browser by hand, as a pad of before might have: the made-up sketch, an old one of
  // the top view alone, which adds its block, and a note that is no sketch, refused in words.
  const sheet = { name: 'Level 817 m', level: 817, blocks: [[20, 14, 32, 26, 3]], lines: [] };
  const old = JSON.stringify({ view: 'top', current: 0, sheets: [{ ...sheet, labels: [] }] });
  const files = [
    { kept: name, text: SKETCH.toString('utf8'), layers: LEVELS.length },
    { kept: `${name} old`, text: old, layers: 2 },
    { kept: `${name} note`, text: 'A note, and no sketch.', layers: 1 },
  ];
  for (const { kept, text, layers } of files) {
    const put = `import('/store/held.js').then(({ keep }) => keep('example', ${JSON.stringify(kept)}, ${JSON.stringify(text)}))`;
    await page.evaluate(put);
    const refused = layers === 1 ? `"${kept}.json" is not a sketch: nothing was changed.` : '';
    const byFile = await emptyPage(page);
    const file = { name: `${kept}.json`, mimeType: 'application/json', buffer: Buffer.from(text) };
    await byFile.locator('#file').setInputFiles(file);
    await expect(byFile.locator('#alarm')).toHaveText(refused);
    const fromFile = await byFile.evaluate<string | null>(`localStorage.getItem(${STORE})`);
    await byFile.close();

    const byName = await emptyPage(page);
    const { shown, said } = keptWindow(byName);
    await pick(byName.getByRole('button', { name: 'Open kept' }));
    await shown.getByRole('button', { name: kept, exact: true }).click();
    await expect(shown).toBeVisible({ visible: refused !== '' });
    if (refused) await expect(said).toHaveText(refused);
    await expect(byName.locator('#layers li')).toHaveCount(layers);
    const fromName = await byName.evaluate<string | null>(`localStorage.getItem(${STORE})`);
    expect(fromName === fromFile, `${kept}: another sketch than "Open file" opens`).toBe(true);
    expect(fromName === null, kept).toBe(refused !== '');
    await expect(byName.getByRole('button', { name: 'Undo' })).toBeEnabled({ enabled: !refused });
    await byName.close();
  }
});

test('a plot given as its file keeps in the browser, by its id, and says so', async ({ page }) => {
  await page.goto('/#top');
  await pick(page.locator('#open-plot'));
  const loaded = page.waitForEvent('load');
  const terrace = fromRoot('tests/__fixtures__/plots/terrace/plot.json');
  await page.locator('#plot-file').setInputFiles(terrace);
  await loaded;
  await expect(page.locator('html[data-shown]:not([data-shown="example"])')).toHaveCount(1);
  const id = await page.evaluate<string>(
    `globalThis.PLOT.way === 'file' ? globalThis.PLOT.id : ''`,
  );
  expect(id).not.toBe('');
  const plots = page.getByRole('dialog', { name: 'Open a plot' });
  await plots.getByRole('button', { name: 'Close' }).click();
  const name = named('On its file');
  await pick(page.locator('#keep'));
  await expect(keptWindow(page).where).toHaveText(`Sketches of this plot are kept ${BROWSER}.`);
  expect(await keepAs(page, name)).toBe(`${IN_BROWSER} ${NO_ROOM}`);
  expect((await inStore(page, id)).map(([one]) => one)).toEqual([name]);
  expect(await inStore(page, 'example')).toEqual([]);
  await keptWindow(page).shown.getByRole('button', { name: 'Close' }).click();
  await pick(page.locator('#open-kept'));
  await expect(keptWindow(page).picks).toHaveText([name]);
});

test('the policy of the page lets it ask its own server, and nobody else', async ({ page }) => {
  await openPad(page, null);
  const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(policy).toHaveAttribute('content', "connect-src 'self'");
  // Asked of the pad itself, the page is answered. Asked of another origin, it is refused by its
  // own policy - and were the policy gone, the answer would come from here, in the browser: no
  // request leaves this machine.
  const elsewhere: string[] = [];
  await page.route(`${ELSEWHERE}**`, (route) => {
    elsewhere.push(route.request().url());
    return route.fulfill({ contentType: 'text/plain', body: 'elsewhere' });
  });
  const ask = (address: string): string =>
    `fetch(${JSON.stringify(address)}).then((answer) => String(answer.status), () => 'refused')`;
  expect(await page.evaluate<string>(ask('/frame.css'))).toBe('200');
  expect(await page.evaluate<string>(ask('/kept/'))).toBe('404');
  expect(await page.evaluate<string>(ask(`${ELSEWHERE}kept/`))).toBe('refused');
  expect(elsewhere).toEqual([]);
});
