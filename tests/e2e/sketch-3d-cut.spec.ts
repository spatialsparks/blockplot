import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { pixelOf, placeOf, scaleOf } from './sketch-paper';

// The cut of the made-up house, end to end, on the made-up plot (story ST-028): the list, the
// rule and both views together, on the house that every test of the pad sees. The last of its
// things is a block with no name along the long side of its day rooms, for which the category
// "Ground cut" was picked: a category that was picked, and a cut. Beside it: the same house with
// that category taken out of the text, the block a room as it has no name, and the house without
// the block. From above: the list beside the paper stands at the category, the pad says a cut
// and where its floor lies, and the paper has the category's word on the block. In the side
// view, on a slice through the block: the pad measures from the cut ground, the paper uphill of
// it is paper where the other two have earth, and the hint says how ground is taken away. In
// 3D, from the side the cut lies on, in each of the three ways: another picture than the house
// without the block - with the car off both too, which stands on the ground, and lower - and as
// many solids, for a cut is none; and one solid more where the block says no category. `pnpm
// sketch --demo` serves the pad on its made-up plot: the real plot is in no part of this run, and
// a case asks yes or no whether its page is on that plot before a matcher reads it (directive 34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const STORE = JSON.stringify('blockplot/sketch/plot/example/space');
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no hill on it';

// The made-up ground is a plane: at column c and row r of the top view's paper it lies at
// 820 - 0.1 c - 0.02 r m, and a height h lies in row 2 (826 - h) of a standing paper. Both papers
// are 92 cells wide. THE CUT, the last of the file's things (tests/__fixtures__/CLAUDE.md): a
// block on columns 30 to 50 and rows 10 to 22 of the top view, 10 m by 6 m, from the long side
// of the day rooms out to the edge of the plot, its floor in row 24 of a standing view, 814 m,
// the day rooms' own. It says its category, and nothing else: no name, and no `is`. THE SAME
// BLOCK AS A ROOM is the file without that word, THE HOUSE WITHOUT THE BLOCK without this text.
const CUT = ',{"x":[30,50],"y":[10,22],"z":[18,24],"colour":1,"category":"ground-cut"}';
const PICKED = ',"category":"ground-cut"';
const [A_ROOM, NO_BLOCK] = [SKETCH.replace(PICKED, ''), SKETCH.replace(CUT, '')];
const SAID =
  'Block: a cut, by its category. C changes it. 60 m², 10 m by 6 m. Its floor is 814 m above sea level.';
// Four places. From above ITS MIDDLE, column 40 and row 16, where Select takes it and the paper
// writes a word on a block, and A PLACE OF ITS FILL, clear of that word and of the grid's lines.
// And two of THE SLICE ALONG ROW 16, 20 m across the plot: a copy of a house opens its side view
// there, where the file opens along row 30. IN THE BLOCK, column 40 and row 20, 816 m above sea
// level: 2.0 m over the cut's floor - and 0.32 m over the hill, 820 - 4 - 0.32 = 815.68 m there:
// 0.3 m, as the pad says of a room and of no block. UPHILL OF THE BLOCK, column 28.5 and row
// 20.5, clear of it and of the grid's lines: the hill lies in row 18.3 there, at 820 - 2.85 -
// 0.32 = 816.83 m, and the ground on its way from the cut's floor up to the plot boundary in row
// 22.7, by the rule - between the two the place is in the earth, and over the ground once cut.
const AT = { mid: [40, 16], fill: [33.5, 12.5], inside: [40, 20], uphill: [28.5, 20.5] } as const;
const along16 = (sketch: string): string => sketch.replace('"side":30', '"side":16');
const HELD = ' — a block of 10 m by 3 m, 30 m²';
// What the hint of a standing view says of a cut (layers.js), to the letter.
const OF_A_CUT =
  'A block that is a cut takes ground away: where the ground stands higher than its floor, the ground is its floor. Pick "Ground cut" in the list beside the paper, or press C until the pad says a cut.';
// THE CAR stands on the ground uphill of the house, and 0.18 m lower once the ground is cut.
const CAR = ',{"kind":"car","x":16,"y":27.5,"floor":"ground","turn":1}';
// The paper, the ground's tint (land.js), and a block in the pad's red, #d9482b, at 0.6 over it.
const HUE = { paper: [255, 255, 255], tint: [0xf1, 0xeb, 0xe0], red: [232, 145, 128] } as const;
const WAYS = ['volumes', 'white', 'materials'] as const;
// So many pixels at the least, where two pictures of the stage differ - the cut alone was 137 000
// of them in the Volumes and 197 000 in White. And a word on a block is more ink than this.
const [SOME, INK_OF_A_WORD] = [1000, 10];
type Place = readonly [column: number, row: number];

/** Every error of the console and every error no script caught, and every request to another origin: heard from before the page loads. */
function watch(page: Page, baseURL: string | undefined): string[] {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => {
    if (message.type() === 'error') heard.push(message.text());
  });
  page.on('pageerror', (error) => void heard.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith('data:') && new URL(url).origin !== own) heard.push(`elsewhere: ${url}`);
  });
  return heard;
}

/** Opens a page of the pad with a sketch in its store - put there by a page of the pad, and the page loaded anew: what it shows is what it draws as it opens. It fails unless the page is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string, sketch: string): Promise<void> {
  // Page code, handed over as text: these tests are typed for Node, which has no `document`.
  const madeUp = `globalThis.SITE?.name === ${JSON.stringify(PLOT)}`;
  await page.goto(address);
  expect(await page.evaluate<boolean>(madeUp), 'the pad is not on the made-up plot').toBe(true);
  await page.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(sketch)})`);
  await page.reload();
  expect(await page.evaluate<boolean>(madeUp), 'the pad is not on the made-up plot').toBe(true);
}

/** Where a place of the paper is on the page, in pixels (sketch-paper.ts). */
const onPage = placeOf;

/** The colour of the paper's picture at a place of the paper: red, green, blue. */
const colour = async (page: Page, place: Place): Promise<number[]> => {
  const [x, y] = await pixelOf(page, place);
  return page.evaluate<number[]>(`(() => {
    const canvas = document.getElementById('paper');
    return [...canvas.getContext('2d').getImageData(${x}, ${y}, 1, 1).data.slice(0, 3)];
  })()`);
};

/** How far the paper's picture at a place is from a colour: the most of red, green and blue. */
const offBy = async (page: Page, place: Place, hue: readonly number[]): Promise<number> =>
  Math.max(...(await colour(page, place)).map((part, n) => Math.abs(part - (hue[n] ?? 0))));

/** How much ink the paper's picture has about a place, as sketch-category.spec.ts counts it: of a strip three cells to either side of it and one cell high, the pixels whose red, green and blue are under 400 together. A word written there is ink; the block's colour, and a line of the grid over it, are none. */
const ink = async (page: Page, [column, row]: Place): Promise<number> => {
  const [[x, y], cell] = [
    await pixelOf(page, [column - 3, row - 0.5], Math.round),
    await scaleOf(page),
  ];
  return page.evaluate<number>(`(() => {
    const canvas = document.getElementById('paper');
    const [x, y, cell] = [${x}, ${y}, ${cell}];
    const { data } = canvas.getContext('2d').getImageData(x, y, 6 * cell, cell);
    let dark = 0;
    for (let at = 0; at < data.length; at += 4)
      if (data[at] + data[at + 1] + data[at + 2] < 400) dark += 1;
    return dark;
  })()`);
};

/** What the pad says of a place of the paper that the pointer is brought to, from beside it: the pad says a place when the pointer moves. */
async function saidAt(page: Page, place: Place): Promise<string> {
  const [x, y] = await onPage(page, place);
  await page.mouse.move(x + 30, y);
  await page.mouse.move(x, y);
  return (await page.locator('#status').textContent()) ?? '';
}

// Page code: how many pixels of a picture of the stage are another colour in a second picture
// of the same view - where one of red, green and blue differs by more than 4 of 255, as
// sketch-3d-ground.spec.ts tells two hills apart: earth is one colour.
const apartIn = (png: Buffer, other: Buffer): string => `Promise.all(
  ['${png.toString('base64')}', '${other.toString('base64')}'].map((png) => new Promise((done) => {
    const picture = new Image();
    picture.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [picture.width, picture.height];
      const pen = canvas.getContext('2d');
      pen.drawImage(picture, 0, 0);
      done(pen.getImageData(0, 0, canvas.width, canvas.height).data);
    };
    picture.src = 'data:image/png;base64,' + png;
  })),
).then(([here, there]) => {
  let apart = 0;
  for (let at = 0; at < here.length; at += 4) {
    if ([0, 1, 2].some((n) => Math.abs(here[at + n] - there[at + n]) > 4)) apart += 1;
  }
  return apart;
})`;

/** The stage as it shows once it has been drawn: over when the browser has shown some frames more. */
async function picture(page: Page): Promise<Buffer> {
  await page.bringToFront();
  await page.evaluate(`new Promise((done) => {
    let left = 6;
    const frame = () => (left-- > 0 ? requestAnimationFrame(frame) : done());
    frame();
  })`);
  return page.locator('#stage canvas').screenshot();
}

test('from above the block says its category in the list, in the words of the pad and on the paper, and as a room it says none', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  // Each text was in the file once: the room says no category, and the third house has no block.
  expect([SKETCH.split(CUT).length, SKETCH.split(PICKED).length]).toEqual([2, 2]);
  expect([A_ROOM.includes('category'), NO_BLOCK.includes('"y":[10,22]')]).toEqual([false, false]);
  const [words, row] = [page.locator('#picked'), page.locator('#category-row')];
  const [list, said] = [page.locator('#category'), page.locator('#category-said')];
  // The top view on the level at 814 m, where the block stands, the fifth, with the day rooms:
  // nothing is selected, and the paper has drawn it on its level - red, as a browser rounds it.
  const openOn814 = async (sketch: string): Promise<void> => {
    await open(page, '/#top', sketch);
    await expect(page).toHaveTitle('Top view — sketch pad');
    await page.getByRole('button', { name: 'Level 814 m' }).click();
    await expect(page.locator('#layers li small').nth(1)).toHaveText('5 blocks, 13 objects');
    await expect(row).toBeHidden();
    const off = (): Promise<number> => offBy(page, AT.fill, HUE.red);
    await expect.poll(off, 'the block is not drawn on its level, in red').toBeLessThanOrEqual(1);
  };

  // THE CUT. The paper has ink in its middle: the category's word, where a name would stand.
  // Selected, the pad says a cut and where its floor lies - no height, no volume, no floor of a
  // room; the list stands at "Ground cut", and its first entry says that the name gives nothing.
  await openOn814(SKETCH);
  expect(await ink(page, AT.mid)).toBeGreaterThan(INK_OF_A_WORD);
  await page.mouse.click(...(await onPage(page, AT.mid)));
  await expect(words).toHaveText(SAID);
  await expect(list).toHaveValue('ground-cut');
  await expect(list.locator('option:checked')).toHaveText('Ground cut');
  await expect(list.locator('option').first()).toHaveText('By its name: no category');
  await expect(said).toHaveText('Category: Ground cut, picked from the list.');
  await page.keyboard.press('Escape');
  await expect(row).toBeHidden();
  await expect(page.locator('#alarm')).toBeEmpty();

  // THE SAME BLOCK AS A ROOM: no word on the paper, the list at its first entry, and no category.
  await openOn814(A_ROOM);
  expect(await ink(page, AT.mid)).toBe(0);
  await page.mouse.click(...(await onPage(page, AT.mid)));
  await expect(words).toContainText('Block: a room, as it has no name. C changes it.');
  await expect(list).toHaveValue('');
  await expect(said).toHaveText('No category: it has no name.');
  await expect(page.locator('#alarm')).toBeEmpty();
  expect(heard).toEqual([]);
});

test('in a slice through the block the ground lies at its floor: the pad measures from there, the earth uphill of it is gone, and the hint says how', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  const HOUSES = [
    { sketch: SKETCH, uphill: HUE.paper, over: 2.0, through: '1 block', held: HELD },
    { sketch: A_ROOM, uphill: HUE.tint, over: 0.3, through: '1 block', held: HELD },
    { sketch: NO_BLOCK, uphill: HUE.tint, over: 0.3, through: 'nothing yet', held: '' },
  ];
  for (const { sketch, uphill, over, through, held } of HOUSES) {
    expect(sketch.split('"side":30').length, 'the file opens on another slice').toBe(2);
    await open(page, '/#side', along16(sketch));
    await expect(page).toHaveTitle('Side view — sketch pad');
    // The paper is drawn: under the ground, at its foot, it is tinted. And the slice runs there.
    await expect.poll(() => colour(page, [70.5, 38.5])).toEqual(HUE.tint);
    await expect(page.locator('#cut-at')).toHaveText(`Slice 20 m across the plot: ${through}.`);
    await expect(page.locator('#layers-hint')).toContainText(OF_A_CUT);
    // Uphill of the block: paper once the ground is cut, and earth under the hill.
    await expect.poll(() => colour(page, AT.uphill)).toEqual(uphill);
    // In the block, to a decimetre: a pointer is a pixel off, some centimetres of the plot.
    const figures = [-0.1, 0, 0.1].map((off) => (over + off).toFixed(1).replace('.', '\\.'));
    const words = new RegExp(`, (${figures.join('|')}) m above the ground at the slice${held}$`);
    await expect.poll(() => saidAt(page, AT.inside)).toMatch(words);
    await expect(page.locator('#alarm')).toBeEmpty();
  }
  expect(heard).toEqual([]);
});

test('in 3D the house with its cut is another picture than the house without the block, in each of the three ways, with 35 solids each', async ({
  page,
  context,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await open(page, '/3d.html', SKETCH);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-stage', /^(drawn|none)$/);
  test.skip((await body.getAttribute('data-stage')) !== 'drawn', NO_STAGE);
  // From the pad's other side, which looks at the long side of the day rooms that the cut lies
  // along: the cut is beside the house, and in view.
  await page.locator('#stands [data-stand="right"]').click();
  // Four houses: the made-up one and the one without the block, each with its car and without
  // it. Another window keeps each, as the pad does with every stroke, and this page draws it from
  // where it stood: 35 solids with the car and 34 without, of either house - the cut is none.
  const pad = await context.newPage();
  const heardThere = watch(pad, baseURL);
  await open(pad, '/#top', SKETCH);
  expect(SKETCH.split(CAR)).toHaveLength(2);
  const HOUSES = [SKETCH, SKETCH.replace(CAR, ''), NO_BLOCK, NO_BLOCK.replace(CAR, '')];
  const shown: Buffer[][] = [];
  for (const [at, house] of HOUSES.entries()) {
    const solids = String(35 - (at % 2));
    await pad.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(house)})`);
    await expect(body).toHaveAttribute('data-solids', solids);
    const pictures: Buffer[] = [];
    for (const way of WAYS) {
      await page.locator(`button[data-way=${way}]`).click();
      await expect(body).toHaveAttribute('data-way', way);
      await expect(body).toHaveAttribute('data-shown', solids);
      pictures.push(await picture(page));
    }
    shown.push(pictures);
  }
  // In each way the made-up house is another picture than the house without the block: nothing
  // of a house can differ, for the block is handed on in neither. And so are the two without
  // their car - which stands lower where the ground is cut, and would tell the two apart whatever
  // the hill did: there the hill alone is another, level along the bared wall of the day rooms.
  for (const [at, way] of WAYS.entries()) {
    for (const carless of [0, 1]) {
      const [here, there] = [shown[carless]?.[at], shown[carless + 2]?.[at]];
      if (!here || !there) throw new Error(`no picture of ${way}`);
      const what = `${way}, ${carless ? 'without' : 'with'} the car: the two houses look alike`;
      expect(await page.evaluate<number>(apartIn(here, there)), what).toBeGreaterThan(SOME);
    }
  }
  // And the block that says no category: a room, as it has no name - a solid, the 36th, on the
  // level of the day rooms: no level more.
  await pad.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(A_ROOM)})`);
  await expect(body).toHaveAttribute('data-solids', '36');
  await expect(page.locator('#levels button')).toHaveText(['All', 'Level 817 m', 'Level 814 m']);
  expect([...heard, ...heardThere]).toEqual([]);
});
