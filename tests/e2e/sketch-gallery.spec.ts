import { expect, test, type Locator, type Page } from '@playwright/test';
import { VERSION } from './sketch-golden';
import { placeOf } from './sketch-paper';

// The gallery of the objects, end to end, on the made-up plot (story ST-029, task T-029.4): what
// the owner does. O, or the button of the Objects group, takes the Object tool, and the gallery
// stands right of the paper in the place of what is selected: every kind the pad has, in its
// group, with its picture, its name and its size. A click on a tile is what the next click on
// the paper sets down, and shows on the button; R turns it; another tool, and what is selected
// shows again. The pad has no list of kinds and no Object button any more. `pnpm sketch --demo`
// serves the pad, whose page puts tools/sketch/demo-site.js in the place of site.js: the real plot is in no part of this
// run, and a case asks yes or no whether its page is on the made-up plot before a matcher reads
// that page (directive 34).

// Where the page keeps its sketch: `KEY` of tools/sketch/sketch.js, stated a second time.
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
// A place of the top view's paper, which is not shown from behind (sketch-paper.ts).
type Place = readonly [column: number, row: number];
type Box = Record<'x' | 'y' | 'width' | 'height', number>;

// THE SKETCH, this test's own: nothing drawn, written as the pad writes an empty sketch - and,
// for one case, with a door of 2.4 m among its figures, where a sketch that says nothing has
// one of 2.1 m.
const EMPTY = { space: VERSION, things: [], floors: [], notes: [], on: {}, show: { top: {} } };
const TALL_DOOR = { ...EMPTY, figures: { doorHighM: 2.4 } };
// The six groups, in the gallery's order, and how many tiles each holds: forty-three in all -
// a kind's, or a named starting size's (ST-035): three beds in Furniture.
const GROUPS = {
  'Doors, windows and stairs': 5,
  Kitchen: 5,
  Bathroom: 5,
  Furniture: 18,
  Garden: 8,
  'People and cars': 2,
} as const;
// WHAT THE PAD OF BEFORE KEPT, to the letter: of a sofa picked in its list of kinds and set down
// with a click on column 30.3 and row 20.4 of an empty paper, and of a second one, turned by a
// quarter with R, on column 50.3 and row 30.4 - written down from that pad before its list went.
// A sofa is 2 m by 1 m: it lies on whole cells, and the first object puts the ground to draw on.
const SOFA = '{"kind":"sofa","x":30.5,"y":20.5,"floor":"ground"}';
const TURNED = '{"kind":"sofa","x":50.5,"y":30.5,"floor":"ground","turn":1}';
const keeping = (...things: string[]): string =>
  `{"space":${VERSION},"things":[${things.join()}],"floors":[],"notes":[],` +
  '"on":{"top":"ground"},"show":{"top":{}}}';

/** The sketch that the browser keeps, as the text it is kept as. */
const keptText = (page: Page): Promise<string> =>
  page.evaluate<string>(`localStorage.getItem(${STORE})`);

/** Opens the top view of the pad with a sketch of the test's own in its store - put there once: what the pad keeps after it stays through a reload - and fails unless it is on the made-up plot: asked yes or no, before a matcher reads the page. It gives what is heard from before the page loads: every error, and every request to another origin. */
async function openPad(page: Page, baseURL: string | undefined, own: object): Promise<string[]> {
  const [origin, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => void (message.type() === 'error' && heard.push(message.text())));
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== origin) heard.push(`elsewhere: ${url}`);
  });
  const sketch = JSON.stringify(JSON.stringify(own));
  await page.addInitScript(
    `if (localStorage.getItem(${STORE}) === null) localStorage.setItem(${STORE}, ${sketch});`,
  );
  await page.goto('/#top');
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.waitForLoadState('load');
  return heard;
}

/** Where a part of the page lies, in pixels: its left edge, its top, how wide and how high. */
async function lying(part: Locator): Promise<Box> {
  const box = await part.boundingBox();
  if (box === null) throw new Error('a part of the page is not seen');
  return box;
}

/** A click on a place of the paper, with the tool that is on: with Object, what is picked is set down there. */
async function click(page: Page, place: Place): Promise<void> {
  await page.mouse.click(...(await placeOf(page, place)));
}

/** Waits until one thing of the toolbar shows pressed, and it is this one - by the name it is read out by: a tool by its word, the button of the Objects group by its object. */
async function expectPressed(page: Page, name: string): Promise<void> {
  const pressed = `[...document.querySelectorAll('header [aria-pressed="true"]')]
    .map((one) => one.getAttribute('aria-label') ?? one.textContent.trim())`;
  await expect.poll(() => page.evaluate<string[]>(pressed), `${name}, alone`).toEqual([name]);
}

/** The parts of the gallery, and of the button of the Objects group: the gallery, its headings, its tiles, the tile of a kind, the tiles that are marked as picked - and the button, with its name. */
const gallery = (page: Page) => ({
  shown: page.locator('#right > #selected + #gallery'),
  headings: page.locator('#gallery').getByRole('heading'),
  tiles: page.locator('#gallery button[data-kind]'),
  tile: (kind: string) => page.locator(`#gallery button[data-kind="${kind}"]`),
  picked: page.locator('#gallery [aria-pressed="true"]'),
  button: page.locator('#objects-group > #object'),
  name: page.locator('#object > #object-name'),
});

test('O shows the gallery where what is selected stood, a pick is what a click sets down, and another tool brings back what is selected', async ({
  page,
  baseURL,
}) => {
  const heard = await openPad(page, baseURL, EMPTY);
  const { shown, headings, tiles, tile, picked, button, name } = gallery(page);
  // The pad opens with Select: right of the paper a line says that nothing is selected, and
  // there is no gallery. The button of the Objects group shows the object that the pad opens
  // with, a person. No list of kinds is left, and no button named "Object".
  await expectPressed(page, 'Select');
  const line = page.locator('#selected > #none-picked');
  await expect(line).toHaveText('Nothing is selected.');
  await expect(shown).toBeHidden();
  await expect(page.locator('#objects-group > *')).toHaveCount(1);
  await expect(button).toHaveAttribute('data-tool', 'object');
  await expect(name).toHaveText('Person');
  await expect(page.locator('#kind, header select')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Object', exact: true })).toHaveCount(0);
  const [stood, paper] = [await lying(line), await lying(page.locator('#paper'))];

  // O: the button shows pressed, and no other tool. The gallery stands right of the paper,
  // where the line stood, which is gone: six headings in their order, and a tile a key, each
  // group's under its heading - the person's marked as picked, and no other.
  await page.keyboard.press('o');
  await expectPressed(page, 'Person');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(shown).toBeVisible();
  await expect(line).toBeHidden();
  await expect(headings).toHaveText(Object.keys(GROUPS));
  await expect(tiles).toHaveCount(43);
  const under = `[...document.querySelectorAll('#gallery > section')]
    .map((group) => group.querySelectorAll(':scope > h2 ~ button[data-kind]').length)`;
  expect(await page.evaluate<number[]>(under)).toEqual(Object.values(GROUPS));
  await expect(picked).toHaveAttribute('data-kind', 'person');
  const [lies, place] = [await lying(shown), await lying(page.locator('#scroller'))];
  expect(lies.x).toBeGreaterThanOrEqual(place.x + place.width);
  expect([lies.x, lies.width]).toEqual([stood.x, stood.width]);
  expect(lies.y).toBeLessThanOrEqual(stood.y);
  expect(lies.y + lies.height).toBeGreaterThanOrEqual(stood.y + stood.height);
  expect(await lying(page.locator('#paper'))).toEqual(paper);

  // A click on the Sofa: its tile is picked, and no other; the button says "Sofa", and answers
  // to that name. A click on the paper sets a sofa down: the sketch that the browser keeps is
  // the text that the pad of before kept of it. The gallery stays, for the next one.
  await tile('sofa').click();
  await expect(picked).toHaveAttribute('data-kind', 'sofa');
  await expect(name).toHaveText('Sofa');
  await expectPressed(page, 'Sofa');
  await expect(page.locator('header').getByRole('button', { name: 'Sofa' })).toHaveId('object');
  await click(page, [30.3, 20.4]);
  await expect.poll(() => keptText(page)).toBe(keeping(SOFA));
  await expect(shown).toBeVisible();
  // R, and the next is turned by a quarter - as the pad of before turned it.
  await page.keyboard.press('r');
  await click(page, [50.3, 30.4]);
  await expect.poll(() => keptText(page)).toBe(keeping(SOFA, TURNED));
  await expect(page.locator('#layers small')).toHaveText(['2 objects']);

  // S: the gallery is gone, and the line is back where it stood, with the paper where it lay.
  await page.keyboard.press('s');
  await expectPressed(page, 'Select');
  await expect(shown).toBeHidden();
  await expect(line).toHaveText('Nothing is selected.');
  expect([await lying(line), await lying(page.locator('#paper'))]).toEqual([stood, paper]);
  // The button of the Objects group takes the tool as O does: the gallery, with the sofa picked.
  await button.click();
  await expectPressed(page, 'Sofa');
  await expect(shown).toBeVisible();
  // The tab keeps the tool, the object and how it is turned: loaded anew, the gallery shows as
  // the page opens, the sofa picked - and the next click sets down a sofa, turned by a quarter.
  await page.reload();
  await expect(page).toHaveTitle('Top view — sketch pad');
  await expectPressed(page, 'Sofa');
  await expect(shown).toBeVisible();
  await expect(line).toBeHidden();
  await expect(picked).toHaveAttribute('data-kind', 'sofa');
  expect(await keptText(page)).toBe(keeping(SOFA, TURNED));
  await click(page, [70.3, 30.4]);
  const third = TURNED.replace('"x":50.5', '"x":70.5');
  await expect.poll(() => keptText(page)).toBe(keeping(SOFA, TURNED, third));
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('a tile says its name and its size, and a door as high as the figures of the sketch have it', async ({
  page,
  baseURL,
}) => {
  const heard = await openPad(page, baseURL, TALL_DOOR);
  const { shown, tile } = gallery(page);
  await page.keyboard.press('o');
  await expect(shown).toBeVisible();
  // A tile holds a picture, the kind's name and under it its size: the door's is the sketch's
  // own figure, 2.4 m, and a window's what a sketch has that says nothing of it.
  const says = (kind: string): Locator => tile(kind).locator(':scope > canvas ~ *');
  await expect(says('door')).toHaveText(['Door', '1 by 1 m, 2.4 m high']);
  await expect(says('window')).toHaveText(['Window', '1.5 by 0.3 m, 1.5 m high']);
  await expect(says('sofa')).toHaveText(['Sofa', '2 by 1 m, 0.8 m high']);
  // Every picture is drawn: the canvas of every tile has ink on it, forty-three, and so
  // has the one on the button. A tile's is 44 pixels square, with the words right of it.
  const drawn = `[...document.querySelectorAll('#gallery canvas, #object-picture')].map((one) => {
    const { data } = one.getContext('2d').getImageData(0, 0, one.width, one.height);
    return data.some((part, at) => at % 4 === 3 && part > 0);
  })`;
  expect(await page.evaluate<boolean[]>(drawn)).toEqual(Array.from({ length: 44 }, () => true));
  const [picture, name] = [tile('door').locator('canvas'), says('door').first()];
  const [square, word] = [await lying(picture), await lying(name)];
  expect([square.width, square.height]).toEqual([44, 44]);
  expect(word.x).toBeGreaterThanOrEqual(square.x + square.width);
  // Nothing was set down: to look at the gallery writes nothing.
  expect(await keptText(page)).toBe(JSON.stringify(TALL_DOOR));

  // A size is read anew whenever the sketch changed. A figure that is set while the gallery
  // shows - as the Settings of the 3D page set one, through the pad's own scripts - is on the
  // tile at once; and Undo, with the keyboard, has the tile say what it said.
  await page.evaluate(`void sketch.change((doc) => figures.set(doc, 'doorHighM', 2.2))`);
  await expect(says('door')).toHaveText(['Door', '1 by 1 m, 2.2 m high']);
  expect(await keptText(page)).toContain('"figures":{"doorHighM":2.2}');
  await page.keyboard.press('Control+z');
  await expect(says('door')).toHaveText(['Door', '1 by 1 m, 2.4 m high']);
  expect(await keptText(page)).toContain('"figures":{"doorHighM":2.4}');
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('the gallery scrolls inside the right side, under headings that stay, and the page does not', async ({
  page,
  baseURL,
}) => {
  const heard = await openPad(page, baseURL, EMPTY);
  const { shown, headings, tile } = gallery(page);
  await page.keyboard.press('o');
  await expect(shown).toBeVisible();
  const [side, paper] = [page.locator('#right'), await lying(page.locator('#paper'))];
  // Page code: the right side, and the page itself. Of either, how far it is scrolled and how
  // far it can be; and the right side scrolled on by so many pixels, or as far as it goes.
  const [SIDE, PAGE] = [`document.getElementById('right')`, 'document.scrollingElement'];
  type Scrolled = Record<'at' | 'most', number>;
  const scrolled = (part: string): Promise<Scrolled> =>
    page.evaluate<Scrolled>(`(({ scrollTop, scrollHeight, clientHeight }) =>
      ({ at: scrollTop, most: scrollHeight - clientHeight }))(${part})`);
  const scroll = (by: number): Promise<void> =>
    page.evaluate<undefined>(`void (${SIDE}.scrollTop += ${by})`);
  // More objects than fit: the right side can be scrolled, and the page cannot.
  const { at, most } = await scrolled(SIDE);
  expect([at, most > 0, await scrolled(PAGE)]).toEqual([0, true, { at: 0, most: 0 }]);

  // Scrolled until the fridge, the last of the kitchen's five, lies 40 pixels under the top of
  // the side: the kitchen's first tile is scrolled out, and its heading is in sight all the
  // same - at the top of the side, over the fridge.
  const fridge = await lying(tile('fridge'));
  await scroll(fridge.y - (await lying(side)).y - 40);
  const kitchen = headings.filter({ hasText: 'Kitchen' });
  const [edge, heading] = [await lying(side), await lying(kitchen)];
  const [first, last] = [await lying(tile('island')), await lying(tile('fridge'))];
  // The side is scrolled by whole pixels: the fridge lies within one of where it was sent.
  expect(Math.abs(last.y - edge.y - 40)).toBeLessThanOrEqual(1);
  expect(first.y + first.height).toBeLessThanOrEqual(edge.y);
  expect(heading.y).toBeGreaterThanOrEqual(edge.y - 1);
  expect(heading.y + heading.height).toBeLessThanOrEqual(last.y + 1);
  await expect(kitchen).toBeInViewport({ ratio: 1 });

  // Scrolled to its foot: the last heading is in sight, and under it the last tile, whole.
  await scroll(1e6);
  expect(await scrolled(SIDE)).toEqual({ at: most, most });
  await expect(headings.last()).toHaveText('People and cars');
  await expect(headings.last()).toBeInViewport({ ratio: 1 });
  await expect(tile('car')).toBeInViewport({ ratio: 1 });
  // And the wheel over the gallery scrolls the side back, and nothing else: the page is where
  // it was, and so is the paper.
  const over = await lying(tile('car'));
  await page.mouse.move(over.x + 20, over.y + 20);
  await page.mouse.wheel(0, -200);
  await expect.poll(async () => (await scrolled(SIDE)).at).toBeLessThan(most);
  expect(await scrolled(PAGE)).toEqual({ at: 0, most: 0 });
  expect(await lying(page.locator('#paper'))).toEqual(paper);
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});
