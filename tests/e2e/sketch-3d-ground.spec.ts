import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { pixelOf, placeOf, scaleOf } from './sketch-paper';

// The made-up house with its lawn, end to end, on the made-up plot (story ST-027): the ground
// that a block of ground shapes, in the pad's slices and in 3D together, on the house that every
// test of the pad sees - beside the same house with its lawn taken out of the text. Both have
// the cut beside the day rooms (ST-028; sketch-3d-cut.spec.ts): without the lawn the ground is
// what the cut leaves of the hill. In the side view, a slice through the lawn: earth beside its
// downhill end where that ground leaves paper, and a place measured from the lawn. In the slice
// the file opens with, the tree on the lawn: no other browser test has an object on ground that
// is then shaped, and so none holds that the page works the ground out before it asks where a
// thing stands on it. In 3D, from one stand, the two houses in the Volumes, in White and in
// Materials: other pictures - also with the tree off both, where the hill alone is another - and
// as many solids; and one solid more where the lawn says nothing of what it is: there it is a
// room. `pnpm sketch --demo` serves the pad as files, and its page puts tools/sketch/demo-site.js in the place of
// site.js. The real plot is in no part of this run: a case asks yes or no whether its page is on
// the made-up plot, before a matcher reads that page (directive 34).

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
// 820 - 0.1 c - 0.02 r m, and a height h lies in row 2 (826 - h) of a standing paper, which is
// 92 cells wide. Things are said as tests/__fixtures__/CLAUDE.md has them.
// THE LAWN, the last but one of the file's things, the cut after it: a block of ground on columns 58 to 72 and rows 24 to
// 36 of the top view, its top in row 24 of a standing view, 814 m. The same house without it is
// the file without this text; and with no word on what it is, the lawn is a room by its name.
const LAWN = ',{"x":[58,72],"y":[24,36],"z":[24,28],"colour":9,"name":"Lawn","is":"ground"}';
const NO_LAWN = SKETCH.replace(LAWN, '');
const A_ROOM = SKETCH.replace(LAWN, LAWN.replace(',"is":"ground"', ''));
// THE TREE, 6 m by 6 m and 8 m high, stands on the ground with its middle at column 70 and row
// 26: on the lawn, its foot in row 24 - and without the lawn in row 27.14, a metre and a half
// lower, by what the rule works out with the cut: 812.43 m, where the hill alone lies at
// 820 - 7 - 0.52 = 812.48 m, in row 27.04. The slice the file opens with, along row 30, runs
// through it: there it is drawn from column 64 to 76.
const TREE = ',{"kind":"tree","x":70,"y":26,"floor":"ground"}';
const [TREE_HIGH, ON_LAWN, ON_HILL] = [16, 24, 27.14];
// THE SLICE THREE ROWS ON, along row 33: 28 - 33 / 2 = 11.5 m across the plot. It runs through
// the lawn, and beside the tree. Two places of it, each clear of every line of the grid.
// BESIDE THE LAWN'S DOWNHILL END, column 73.5 and row 26.5: the hill lies in row 28.0 there, at
// 820 - 7.35 - 0.66 = 811.99 m - with the cut in row 28.1 - and the ground on its way from the
// lawn to the plot boundary in row 25.1, by the rule: the place lies between the two, over the
// hill, and in the earth once the lawn is there. OVER THE LAWN, column 65 and row 22, 815 m above
// sea level: 1.0 m over the lawn, and 2.2 m over the ground without it - the hill, which lies at
// 820 - 6.5 - 0.66 = 812.84 m there, 2.16 m under the place, and with the cut at 812.79 m, 2.21 m.
const [ON, BESIDE, OVER] = [33, [73.5, 26.5], [65, 22]] as const;
// The paper, and the tint under the line of the ground (land.js): red, green, blue.
const [PAPER, TINT] = [
  [255, 255, 255],
  [0xf1, 0xeb, 0xe0],
];
const WAYS = ['volumes', 'white', 'materials'] as const;
// So many pixels at the least, where two pictures of the stage differ.
const SOME = 1000;
type Place = readonly [column: number, row: number];

/** Every error of the console and every error no script caught, and every request to another origin: heard from before the page loads. */
function watch(page: Page, baseURL: string | undefined): string[] {
  const [own, heard] = [new URL(baseURL ?? '').origin, [] as string[]];
  page.on('console', (message) => {
    if (message.type() === 'error') heard.push(message.text());
  });
  page.on('pageerror', (error) => {
    heard.push(error.message);
  });
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

/** The side view of the pad on a sketch, once its paper is drawn: under the ground, at the foot of the paper, it is tinted. */
async function openSide(page: Page, sketch: string): Promise<void> {
  await open(page, '/#side', sketch);
  await expect(page).toHaveTitle('Side view — sketch pad');
  await expect.poll(() => colour(page, [70.5, 38.5])).toEqual(TINT);
}

/** The colour of the paper's picture at a place of the paper: red, green, blue. */
const colour = async (page: Page, place: Place): Promise<number[]> => {
  const [x, y] = await pixelOf(page, place);
  return page.evaluate<number[]>(`(() => {
    const canvas = document.getElementById('paper');
    return [...canvas.getContext('2d').getImageData(${x}, ${y}, 1, 1).data.slice(0, 3)];
  })()`);
};

/** What the pad says of a place of the paper that the pointer is brought to, from beside it: the pad says a place when the pointer moves. */
async function saidAt(page: Page, place: Place): Promise<string> {
  const [x, y] = await placeOf(page, place);
  await page.mouse.move(x + 30, y);
  await page.mouse.move(x, y);
  return (await page.locator('#status').textContent()) ?? '';
}

// For each row of pixels of the paper's picture, a number of all it shows between column 62 and
// column 78, where the tree is drawn: two pictures show the same in a row where the two numbers
// are one. With how many pixels a cell is.
type Band = { readonly cell: number; readonly rows: readonly number[] };
const band = async (page: Page): Promise<string> => {
  const [[x], scale] = [await pixelOf(page, [62, 0]), await scaleOf(page)];
  return `(() => {
  const canvas = document.getElementById('paper');
  const cell = ${scale};
  const [left, wide] = [${x}, 16 * cell];
  const { data } = canvas.getContext('2d').getImageData(left, 0, wide, canvas.height);
  const rows = [];
  for (let y = 0; y < canvas.height; y += 1) {
    let all = 0;
    for (let at = 4 * wide * y; at < 4 * wide * (y + 1); at += 1) {
      all = (all * 31 + data[at]) % 1000000007;
    }
    rows.push(all);
  }
  return { cell, rows };
})()`;
};

/** Where the page draws the tree of a sketch, in rows of the paper: its top and its foot - the first and the last row in which the paper with the tree is another picture than the paper of the same sketch without it. */
async function treeOf(page: Page, sketch: string): Promise<{ top: number; foot: number }> {
  expect(sketch.split(TREE)).toHaveLength(2);
  const bands: Band[] = [];
  for (const drawn of [sketch, sketch.replace(TREE, '')]) {
    await openSide(page, drawn);
    bands.push(await page.evaluate<Band>(await band(page)));
  }
  const [{ cell, rows }, bare] = bands as [Band, Band];
  const other = rows.flatMap((row, y) => (row === bare.rows[y] ? [] : [y]));
  return { top: (other.at(0) ?? NaN) / cell, foot: ((other.at(-1) ?? NaN) + 1) / cell };
}

// Page code: how many pixels of a picture of the stage are another colour in a second picture
// of the same view - where one of red, green and blue differs by more than 4 of 255. That
// little, for earth is one colour: in the Volumes a terrace is told by its shade alone. And
// that much, for a picture that is drawn twice may be off by 1 of 255, on a graphics card.
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

test('in a slice through the lawn the ground beside it is earth, and the pad measures from the lawn', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  // The lawn was in the text once, and the house without it says nothing of one.
  expect([SKETCH.split(LAWN).length, NO_LAWN.includes('"Lawn"')]).toEqual([2, false]);
  const HOUSES = [
    { sketch: SKETCH, beside: TINT, over: 1.0 },
    { sketch: NO_LAWN, beside: PAPER, over: 2.2 },
  ];
  for (const { sketch, beside, over } of HOUSES) {
    await openSide(page, sketch);
    // Three rows on: the pad says where the slice runs, and keeps it with the sketch.
    for (let steps = 0; steps < ON - 30; steps += 1) await page.keyboard.press('PageDown');
    await expect(page.locator('#cut-at')).toHaveText(/^Slice 11\.5 m across the plot: /);
    const kept = await page.evaluate<string>(`localStorage.getItem(${STORE})`);
    expect((JSON.parse(kept) as { on: { side: number } }).on.side).toBe(ON);
    // Beside the lawn's downhill end: earth with the lawn, and paper over the hill without it.
    await expect.poll(() => colour(page, BESIDE)).toEqual(beside);
    // Over the lawn, to a decimetre: a pointer is a pixel off, some centimetres of the plot.
    const figures = [-0.1, 0, 0.1].map((off) => (over + off).toFixed(1).replace('.', '\\.'));
    const words = new RegExp(`, (${figures.join('|')}) m above the ground at the slice$`);
    await expect.poll(() => saidAt(page, OVER)).toMatch(words);
    await expect(page.locator('#alarm')).toBeEmpty();
  }
  expect(heard).toEqual([]);
});

test('in the slice the file opens with the tree stands on the lawn, a metre and a half over the hill', async ({
  page,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  // As the page opens: the ground is worked out before the layers are read, or the tree would
  // be drawn where the ground was before - on the hill, in the earth of the lawn.
  const [lawn, hill] = [await treeOf(page, SKETCH), await treeOf(page, NO_LAWN)];
  // To half a row: the line round the tree is drawn a pixel or two beyond it.
  for (const [tree, foot] of [
    [lawn, ON_LAWN],
    [hill, ON_HILL],
  ] as const) {
    expect(Math.abs(tree.foot - foot), `its foot is in row ${tree.foot}`).toBeLessThan(0.5);
    expect(Math.abs(tree.foot - tree.top - TREE_HIGH), 'it is not 8 m high').toBeLessThan(0.5);
  }
  // A metre and a half between the two, 3.14 rows: measured the same way, to a pixel or two.
  expect(Math.abs(hill.foot - lawn.foot - (ON_HILL - ON_LAWN))).toBeLessThan(0.25);
  expect(heard).toEqual([]);
});

test('in 3D the house with its lawn is another picture than the house without, in each of the three ways, with 35 solids each', async ({
  page,
  context,
  baseURL,
}) => {
  const heard = watch(page, baseURL);
  await open(page, '/3d.html', SKETCH);
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-stage', /^(drawn|none)$/);
  test.skip((await body.getAttribute('data-stage')) !== 'drawn', NO_STAGE);
  // From the side, where the lawn lies to the right of the house - and what the view looks at
  // moved onto it: a stand has the blocks of the house in view, and a block of ground is none.
  await page.locator('#stands [data-stand="left"]').click();
  await page.mouse.move(900, 500);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(640, 440, { steps: 12 });
  await page.mouse.up({ button: 'right' });
  // Four houses, one after another: the made-up one and the one without its lawn, each with its
  // tree and without it. Another window keeps each, as the pad does with every stroke, and this
  // page draws it with no reload, from where it stood: its body says so of the solids - 35 with
  // the tree and 34 without, of either house, all of them shown: the lawn is none.
  const pad = await context.newPage();
  const heardThere = watch(pad, baseURL);
  await open(pad, '/#top', SKETCH);
  const HOUSES = [SKETCH, SKETCH.replace(TREE, ''), NO_LAWN, NO_LAWN.replace(TREE, '')];
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
  // In each way the made-up house is another picture than the house without its lawn. And so
  // are the two without their tree - which stands a metre and a half higher on the lawn, and
  // would tell the two apart whatever the hill did: there the hill itself is another, level
  // before the porch and banked down to the plot boundary.
  for (const [at, way] of WAYS.entries()) {
    for (const treeless of [0, 1]) {
      const [here, there] = [shown[treeless]?.[at], shown[treeless + 2]?.[at]];
      if (!here || !there) throw new Error(`no picture of ${way}`);
      const what = `${way}, ${treeless ? 'without' : 'with'} the tree: the two houses look alike`;
      expect(await page.evaluate<number>(apartIn(here, there)), what).toBeGreaterThan(SOME);
    }
  }
  // And the lawn that says nothing of what it is: a room by its name - a solid, the 36th, on a
  // level of its own, where its box has its foot.
  await pad.evaluate(`localStorage.setItem(${STORE}, ${JSON.stringify(A_ROOM)})`);
  await expect(body).toHaveAttribute('data-solids', '36');
  await expect(page.locator('#levels button')).toHaveText([
    'All',
    'Level 817 m',
    'Level 814 m',
    'Level 812 m',
  ]);
  expect([...heard, ...heardThere]).toEqual([]);
});
