import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// The one look of the pad's two pages, end to end, on the made-up plot and sketch (ST-029,
// T-029.6), held by what the browser works out of a part: a ribbon with nothing hidden, on one
// line at 1440 pixels, of squares and lesser controls; no box; the ink for what is chosen alone; a
// track; round colours; a menu that floats; Tab with a ring; words told apart by 4.5 to 1. How calm
// it is only a person sees. On `pnpm sketch --demo`, a case asks it is on the made-up plot (34).

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so no control of one';
// The look's own figures (tools/sketch/frame.css), stated a second time: the ink and white, as
// a browser says a colour, and what it says of no ground at all; how high a main control is,
// how far its width may lie from that - a few pixels: "Materials" is one long word - how large
// a lesser one is, and how far apart words and their ground are to be (WCAG 2, a small text);
// and a drawing, by its `::before`: an empty content, 20 pixels each way, a picture as text.
const [INK, WHITE, CLEAR] = ['rgb(31, 41, 51)', 'rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)'];
const [SQUARE, FEW, LESSER, TOLD_APART] = [50, 8, 24, 4.5];
const A_DRAWING = '"" 20px 20px url("data:image/svg+xml,';
// The main controls of the two pages, the lesser ones and the tracks: as the stylesheets find them.
const MAIN = `#file-menu, #views a, button:is([data-tool], [data-way], [data-stand]):not(#object), #settings-open, #full-screen, #distances-open`;
const SMALL = '#undo, #redo, #smaller, #larger, #fit';
const TRACKS = ['#views', '#ways', '#stands'];

// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// The controls of the toolbar that show, in the order of the page: of each what finds it - its
// id, the name it is read out by, or its words - how large it is; its border, its ground, its
// words, its ring and how round it is, as the browser works them out; its drawing, its word and
// how large that is written; and whether it is off, a colour to draw in, the box of a switch -
// a box by what it is - a main control or a lesser one.
type Control = Record<'said' | 'border' | 'ground' | 'words' | 'ring' | 'round', string> &
  Record<'drawing' | 'word' | 'size', string> &
  Record<'wide' | 'high', number> &
  Record<'off' | 'colour' | 'box' | 'main' | 'lesser', boolean>;
const SAID = `(one) => one.id || one.getAttribute('aria-label') || one.textContent.trim()`;
const CONTROLS = `[...document.querySelectorAll('header :is(a, button, select, input)')]
  .filter((one) => one.getClientRects().length > 0)
  .filter((one) => getComputedStyle(one).visibility === 'visible')
  .map((one) => {
    const [style, drawn] = [getComputedStyle(one), getComputedStyle(one, '::before')];
    const [box, sides] = [one.getBoundingClientRect(), ['Top', 'Right', 'Bottom', 'Left']];
    const picture = (drawn.maskImage || drawn.webkitMaskImage || '').slice(0, 24);
    return {
      said: (${SAID})(one), wide: box.width, high: box.height,
      border: sides.map((side) => style['border' + side + 'Width']).join(' '),
      ground: style.backgroundColor, words: style.color, ring: style.boxShadow,
      round: style.borderRadius, word: one.textContent.trim(), size: style.fontSize,
      drawing: [drawn.content, drawn.width, drawn.height, picture].join(' '),
      off: one.disabled === true, colour: one.matches('#palette *'), box: one.type === 'checkbox',
      main: one.matches(${JSON.stringify(MAIN)}), lesser: one.matches(${JSON.stringify(SMALL)}),
    };
  })`;
/** Page code: how far the words of each thing that a selector finds are told apart from the ground they stand on - the first ground under them that is one - as WCAG works it out of the two colours. `part` is the thing itself, or a part that the stylesheet writes: `::before`. */
const told = (selector: string, part = ''): string => `(() => {
  const light = (colour) => {
    const [red, green, blue] = colour.match(/[\\d.]+/g).map((figure) => {
      const share = Number(figure) / 255;
      return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue + 0.05;
  };
  const ground = (one) => {
    const colour = one ? getComputedStyle(one).backgroundColor : ${JSON.stringify(WHITE)};
    return colour === ${JSON.stringify(CLEAR)} ? ground(one.parentElement) : colour;
  };
  return [...document.querySelectorAll(${JSON.stringify(selector)})].map((one) => {
    const words = getComputedStyle(one, ${JSON.stringify(part)} || undefined).color;
    const [more, less] = [light(words), light(ground(one))].sort((a, b) => b - a);
    return more / less;
  });
})()`;
// What has the focus: what finds it, and its ring - how it is drawn, how wide, and in what colour.
const FOCUS = `(({ activeElement: one }) => {
  const { outlineStyle, outlineWidth, outlineColor } = getComputedStyle(one);
  return [(${SAID})(one), outlineStyle, outlineWidth, outlineColor];
})(document)`;
/** Page code: the ground of each part that is named, as the browser works it out. */
const grounds = (...parts: string[]): string =>
  `${JSON.stringify(parts)}.map((one) => getComputedStyle(document.querySelector(one)).backgroundColor)`;

test.use({
  viewport: { width: 1440, height: 900 },
  storageState: async ({ baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await use({ cookies: [], origins: [{ origin, localStorage: [{ name: KEY, value: SKETCH }] }] });
  },
});

/** Opens a page of the pad, and fails unless it is on the made-up plot: asked yes or no, before any matcher reads it. */
async function open(page: Page, address: string): Promise<void> {
  await page.goto(address);
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await page.waitForLoadState('load');
}
const controls = (page: Page): Promise<Control[]> => page.evaluate<Control[]>(CONTROLS);
/** Where a part of the page lies: left, top, width and height, in pixels. */
async function lies(page: Page, part: string): Promise<number[]> {
  const box = await page.locator(part).boundingBox();
  if (box === null) throw new Error(`the page shows no ${part}`);
  return [box.x, box.y, box.width, box.height];
}

/** A ribbon with nothing hidden: every group shows with nothing clicked, all on one line; a main control is a square with a drawing over its word, and a lesser one small, its drawing alone - so many of each. */
async function expectRibbon(page: Page, groups: string[], many: number[]): Promise<void> {
  const tops = new Set<number>();
  for (const group of groups) {
    await expect(page.locator(`header > #${group}.group`)).toBeVisible();
    tops.add((await lies(page, `#${group}`))[1] ?? NaN);
  }
  // One line: every group begins as high, and the toolbar is no higher than two groups.
  const [, , , high = NaN] = await lies(page, 'header');
  const [, , , group = NaN] = await lies(page, '#view-group');
  expect([tops.size, high < 2 * group], `the toolbar is ${high} pixels high`).toEqual([1, true]);
  // A main control: each as high, and as wide as it is high, to a few pixels; its drawing has a
  // size and a picture - a shape said in the stylesheet - and its word is written under it.
  const all = await controls(page);
  const [main, lesser] = [all.filter((one) => one.main), all.filter((one) => one.lesser)];
  expect([main.length, lesser.length]).toEqual(many);
  for (const { said, wide, high: tall, drawing, word, size } of main) {
    const square = tall === SQUARE && Math.abs(wide - tall) <= FEW;
    const found = [square, drawing, word === '', size];
    expect(found, `${said}, ${wide} by ${tall}`).toEqual([true, A_DRAWING, false, '11px']);
  }
  // A lesser control: small, with a drawing and no word to see - its name is read out.
  for (const { said, wide, high: tall, drawing, size } of lesser)
    expect([wide, tall, drawing, size], said).toEqual([LESSER, LESSER, A_DRAWING, '0px']);
}
/** No control of the toolbar has a box, and what has the ink for its ground - with white words - is exactly these, by what finds each: nothing else has it, a colour to draw in apart. */
async function expectChosen(page: Page, chosen: string[]): Promise<void> {
  const all = (await controls(page)).filter(({ box }) => !box);
  const said = (some: Control[]): string[] => some.map((one) => one.said);
  expect(said(all.filter(({ border }) => border !== '0px 0px 0px 0px'))).toEqual([]);
  const worded = all.filter(({ colour }) => !colour);
  expect(said(worded.filter(({ ground }) => ground === INK))).toEqual(chosen);
  // And white words stand on the ink alone: no other control has them.
  expect(said(worded.filter(({ words }) => words === WHITE))).toEqual(chosen);
}
/** Tab goes through the controls of the toolbar that are not off, in the page's order, and each shows its ring while it has the focus: it gives them, by what finds each. */
async function expectTabbed(page: Page): Promise<string[]> {
  const order = (await controls(page)).filter(({ off }) => !off).map(({ said }) => said);
  for (const said of order) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate<string[]>(FOCUS)).toEqual([said, 'solid', '2px', INK]);
  }
  return order;
}
/** The words of what each selector finds - of its `::before`, where one is named - are told apart from their ground. */
async function expectTold(page: Page, words: [selector: string, part?: string][]): Promise<void> {
  for (const [selector, part] of words) {
    const apart = await page.evaluate<number[]>(told(selector, part));
    expect(apart.length, selector).toBeGreaterThan(0);
    expect(Math.min(...apart), selector).toBeGreaterThanOrEqual(TOLD_APART);
  }
}

test('the pad has a ribbon with nothing hidden, of squares', async ({ page }) => {
  const GROUPS = ['file-group', 'view-group', 'edit-group', 'block-group', 'objects-group'];
  for (const view of ['top', 'side']) {
    await open(page, `/#${view}`);
    // File, the seven views, the five tools of Edit and Distances are squares; Undo, Redo and
    // the two that zoom and Zoom to fit are small, and keep the names that are read out.
    await expectRibbon(page, GROUPS, [14, 5]);
    for (const name of ['Undo', 'Redo', 'Zoom in', 'Zoom out'])
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
    // The button of the Objects group is a square like the others, and wider: as high, with its
    // object's own picture where they have a drawing, and its name.
    const [, , wide = NaN, high] = await lies(page, '#object');
    expect([high, wide > SQUARE]).toEqual([SQUARE, true]);
    await expect(page.locator('#object > canvas#object-picture')).toBeVisible();
    await expect(page.locator('#object-name')).toHaveText('Person');
    await page.goto('about:blank');
  }
});

test('no control of the pad has a box, and what is chosen has the ink', async ({ page }) => {
  await open(page, '/#top');
  // As the pad opens: the top view shows, and Select is the tool.
  await expectChosen(page, ['Top view', 'Select']);
  // File, while its menu is open - and no entry of it.
  await page.locator('#file-menu').click();
  await expect(page.locator('#file-entries')).toBeVisible();
  await expectChosen(page, ['file-menu', 'Top view', 'Select']);
  await page.keyboard.press('Escape');
  await expectChosen(page, ['Top view', 'Select']);
  // Another tool, and the one before it is as every other control. A colour of the menu leaves
  // Line on (ST-039); `#colour` is Block: no tool has the ink, the colour its ring. And Object.
  await page.locator('[data-tool="line"]').click();
  await expectChosen(page, ['Top view', 'Line']);
  await page.locator('#colours-open').click();
  await page.locator('#colours [aria-label="blue"]').click();
  await expectChosen(page, ['Top view', 'Line']);
  await page.locator('#colour').click();
  await expectChosen(page, ['Top view']);
  await page.keyboard.press('o');
  await expectChosen(page, ['Top view', 'object']);
});

test('a track for the views, round colours, and a menu that floats', async ({ page }) => {
  await open(page, '/#top');
  // The track: the switch has a ground of its own, which is neither none nor the toolbar's.
  const [toolbar, track] = await page.evaluate<string[]>(grounds('header', TRACKS[0] ?? ''));
  expect([toolbar, track === toolbar || track === CLEAR]).toEqual([WHITE, false]);
  // With Select the colour to draw with has no ring; the eleven of the menu its arrow opens are
  // round, red ringed in the ink, drawn in. Teal picked: Block, round too, ringed, and none else.
  const look = ({ said, round, wide, high, ring }: Control) =>
    `${said} ${round} ${wide === high ? 'square' : wide} ${ring.includes(INK) ? 'ink' : ring}`;
  const looks = async () => (await controls(page)).filter(({ colour }) => colour).map(look);
  const ringed = async () => (await looks()).filter((one) => !one.endsWith(' none'));
  expect(await ringed()).toEqual([]);
  await page.locator('#colours-open').click();
  const shapes = (await looks()).slice(2, 13).map((one) => one.split(' ').slice(1, 3).join(' '));
  expect([shapes, await ringed()]).toEqual([Array(11).fill('50% square'), ['red 50% square ink']]);
  await page.locator('#colours [aria-label="teal"]').click();
  await page.mouse.move(700, 500);
  expect(await ringed()).toEqual(['colour 50% square ink']);

  // The menu: open, the toolbar is as high and the paper lies where it lay. It lies over the
  // page - out of the flow, above it, reaching under the toolbar's foot - with a shadow.
  const places = () => Promise.all(['header', '#paper'].map((part) => lies(page, part)));
  const before = await places();
  await page.locator('#file-menu').click();
  await expect(page.locator('#file-entries')).toBeVisible();
  expect(await places()).toEqual(before);
  const [, top = NaN, , high = NaN] = await lies(page, '#file-entries');
  expect(top + high).toBeGreaterThan((before[0]?.[1] ?? NaN) + (before[0]?.[3] ?? NaN));
  const floats = `(({ position, zIndex, boxShadow }) => [position, Number(zIndex) > 0, boxShadow !== 'none'])(getComputedStyle(document.querySelector('#file-entries')))`;
  expect(await page.evaluate<unknown[]>(floats)).toEqual(['absolute', true, true]);
});

test('Tab goes through the toolbar in the order of the page, with a ring', async ({ page }) => {
  await open(page, '/#top');
  // File, the seven views, the three that zoom, the five tools - Undo and Redo are off, with
  // nothing to undo - the height, the colour and its arrow, the Objects group's button, Distances.
  const order = await expectTabbed(page);
  const ends = ['file-menu', 'smaller', 'object', 'distances-open'];
  expect([order.length, order[0], order[8], ...order.slice(-2)]).toEqual([21, ...ends]);
});

test('words are told apart from their ground by 4.5 to 1 at the least', async ({ page }) => {
  await open(page, '/#top');
  await expectTold(page, [
    // A control of the toolbar - a chosen one among them, and by itself - the name of a group,
    // the words after the height, the plot's name, and a menu's entries with its small word.
    ['header :is(a, button:enabled):not(#palette *)'],
    ['header :is([aria-current], [aria-pressed="true"]):not(#palette *)'],
    ['header > .group[aria-label]', '::before'],
    ['#high-row, #title, #file-entries :is(button, small)'],
    // A level's row: its name, how it shows - a quiet word - and what stands on it. And every
    // other word of a side: a heading, a line, a button - but a sign, which is no word.
    ['#layers li > :first-child'],
    ['#layers li > :nth-child(2)'],
    ['#layers small'],
    ['aside :is(h2, p, button:not([aria-label]))'],
  ]);
  // The case can fail: what is off has fainter words than that - Undo, with nothing to undo.
  const off = await page.evaluate<number[]>(told('#undo:disabled'));
  expect([off.length, (off[0] ?? NaN) < TOLD_APART]).toEqual([1, true]);
});

test('3D: the same ribbon, three tracks, and the ink for what is chosen', async ({ page }) => {
  await open(page, '/3d.html');
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  test.skip((await page.locator('body').getAttribute('data-stage')) !== 'drawn', NO_STAGE);
  // File, the seven views, the three ways, the five stands, Settings and Full screen are squares.
  await expectRibbon(page, ['file-group', 'view-group', 'ways', 'stands', 'with'], [18, 0]);
  // Three tracks: each with a ground of its own, neither none nor the toolbar's.
  const [toolbar, ...tracks] = await page.evaluate<string[]>(grounds('header', ...TRACKS));
  const none = tracks.filter((track) => track === toolbar || track === CLEAR);
  expect([tracks.length, none]).toEqual([TRACKS.length, []]);
  // Tab, from File on - the switch of the ground, a box, among them: each with its ring.
  const order = await expectTabbed(page);
  expect(order).toHaveLength(19);
  expect([order[0], ...order.slice(-2)]).toEqual(['file-menu', 'settings-open', 'full-screen']);
  // What is chosen: the 3D view, the way that shows, the stand the view is at - Front, where a
  // page that kept no look puts it, till a hand moves it - then Settings, open, and File, open.
  await expectChosen(page, ['3D', 'Volumes', 'Front']);
  await page.locator('[data-way="white"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-way', 'white');
  await expectChosen(page, ['3D', 'White', 'Front']);
  await page.locator('#settings-open').click();
  await expectChosen(page, ['3D', 'White', 'Front', 'settings-open']);
  await page.locator('#file-menu').click();
  await expectChosen(page, ['file-menu', '3D', 'White', 'Front', 'settings-open']);
  // Words on their ground, here too: a control, the name of a group, a switch, a level, a figure.
  await expectTold(page, [
    ['header :is(a, button:enabled)'],
    ['header > .group[aria-label]', '::before'],
    ['#with label, #title, #levels button, #file-entries small'],
    ['#figures :is(label, small:not(.refused), span, input)'],
  ]);
});
