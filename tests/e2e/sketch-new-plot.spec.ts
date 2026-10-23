import type { Locator, Page } from '@playwright/test';
import { PENTAGON, clickAt, expect, openMap, openNear } from './sketch-own-pad';
import { drag, rests, test, viewOf } from './sketch-own-pad';
import { onOf, shownAt } from './sketch-cadastre';

// A plot marked on the map, end to end (story ST-031, task T-031.7): File's entry and the way
// back; a corner set from half a metre a pixel on, and none from afar; the pentagon of the first
// hand case of a plot, corner after corner - a line, an outline with its area, the paper as it
// will lie - on its ground wherever the map goes; a corner dragged, the last undone, all taken
// away; another side, other ground around. Each case but one has a pad and a stand-in of its
// own (sketch-own-pad.ts): no test asks another machine. The name and the making are
// sketch-new-plot-made.spec.ts's. Page code is handed over as text: Node has no `document`.

const ENTRIES = 'Open file|Open kept|Open plot|New plot|Save file|Keep|Picture (PNG)'.split('|');
const NONE = 'No corner yet. Go near, and click the corners of your plot, one after the other.';
const SURVEY =
  'Marked by hand on a map: good to a few decimetres, no survey, and of no legal effect.';
const FAR = 'Come nearer to mark a corner: here a pixel of the map is more than half a metre.';
const NO_FIGURE = 'The ground around the plot is none: 0 to 20 m, in steps of half a metre.';
const lies = (side: number, count: number, long: number, along: number, across: number): string =>
  `The paper lies along side ${side} of ${count}, ${long} m long, and will be ${along} m by ${across} m.`;
// The pentagon's corners as the body says them: in LV95, to the centimetre, in their order.
const MARKED =
  '2600020.00,1200010.00 2600038.00,1200034.00 2600028.40,1200041.20 2600010.00,1200030.00 2600004.00,1200022.00';
/** Places of a flat list of figures, two a place. */
const pairs = (flat: number[]): number[][] =>
  Array.from({ length: flat.length / 2 }, (_, at) => flat.slice(2 * at, 2 * at + 2));
const FIVE = pairs(PENTAGON);
// The pentagon's paper, with 5 m around: its four corners as `paperOf` has them - 1 m east and
// 7 m south of the first corner, and so on round the paper - in pixels at a tenth of a metre.
const SHEET = pairs([10, -70, 250, 250, 10, 430, -230, 110]);

/** What is marked on the map: where each part lies, in pixels right of the map's middle and up from it, to a hundredth - the corners' marks, the outline, the paper's sheet, and the side that the paper lies along, or null where none shows. */
type Marks = { dots: number[][]; outline: number[][]; sheet: number[][]; along: number[][] | null };
const marksOf = (page: Page): Promise<Marks> =>
  page.evaluate<Marks>(`(() => {
    const $ = (id) => document.getElementById(id);
    const { width, height } = $('marks').getBoundingClientRect();
    const hundredth = (pixels) => Math.round(pixels * 100) / 100 + 0;
    const from = ([x, y]) => [hundredth(x - width / 2), hundredth(height / 2 - y)];
    const says = (part, ...names) => names.map((name) => Number(part.getAttribute(name)));
    const places = (text) => text.split(' ').filter(Boolean).map((one) => from(one.split(',').map(Number)));
    const points = (id) => places($(id).getAttribute('points'));
    const along = $('along').hasAttribute('hidden') ? null : [says($('along'), 'x1', 'y1'), says($('along'), 'x2', 'y2')].map(from);
    const dots = Array.from($('dots').children, (dot) => from(says(dot, 'cx', 'cy')));
    return { dots, outline: points('outline'), sheet: points('sheet'), along };
  })()`);
/** The parts of the page that a case reads, each by its id. */
type Parts = Record<'said' | 'corners' | 'paper' | 'body', Locator>;
const partsOf = (page: Page): Parts => ({
  said: page.locator('#said'),
  corners: page.locator('#corners-said'),
  paper: page.locator('#paper-said'),
  body: page.locator('body'),
});
// The look: the sheet, the outline and the side - its line, and what fills it - their light
// edge; and in the plot's side a row, the ground of a control that is on, and the field's width.
const LOOKS =
  'broken 1.5px none; whole 2px rgba(31, 41, 51, 0.1); whole 5px none; drop-shadow; flex; rgb(238, 240, 243); 56px';
const looks = `(() => {
  const of = (part) => getComputedStyle(document.querySelector(part));
  const line = ({ strokeDasharray, strokeWidth, fill }) =>
    [strokeDasharray === 'none' ? 'whole' : 'broken', strokeWidth, fill].join(' ');
  const marks = [line(of('#sheet')), line(of('#outline')), line(of('#along')), of('#marks').filter.split('(')[0]];
  return [...marks, of('#plot .row').display, of('#undo-corner').backgroundColor, of('#around').width].join('; ');
})()`;

test('File has "New plot" after "Open plot" where the map\'s page is: the map, and back', async ({
  pad,
}) => {
  // The example's side view, at an address that names the stand-in - GET map/index.html answers
  // 200: seven entries. "New plot" to its map, with that word alone (T-041.2), and back: none noted.
  const page = await pad.browser.newPage();
  await page.goto(`/${new URL(pad.map, pad.origin).search}#side`);
  await expect(page).toHaveTitle('Side view — sketch pad');
  await page.locator('#file-menu').click();
  await expect(page.locator('#file-entries').getByRole('button')).toHaveText(ENTRIES);
  await page.locator('#new-plot').click();
  await page.waitForURL(({ pathname, search, hash }) => `${pathname}${search}${hash}` === pad.map);
  await rests(page, 15);
  await page.locator('#back').click();
  await expect(page.locator('html[data-shown="example"]')).toHaveCount(1);
  const IN_3D = ['Picture (PNG)', '3D file (GLB)', 'Google Earth file (KML)']; // the 3D page's File
  await page.goto('/3d.html');
  await expect(page).toHaveTitle('3D — sketch pad');
  await page.locator('#file-menu').click();
  await expect(page.locator('#file-entries button')).toHaveText(IN_3D);
  await expect(page.locator('#new-plot, #open-plot')).toHaveCount(0);
});

test('the made-up pad has no "New plot": its map\'s page is nothing', async ({ page }) => {
  // File asks for map/index.html: 204, with nothing - no entry, and no error on the console.
  const wrong: string[] = [];
  page.on('console', (message) => message.type() === 'error' && wrong.push(message.text()));
  const asked = page.waitForResponse((one) => one.url().endsWith('/map/index.html'));
  await page.goto('/');
  expect((await asked).status()).toBe(204);
  await page.locator('#file-menu').click();
  const six = ENTRIES.filter((entry) => entry !== 'New plot');
  await expect(page.locator('#file-entries').getByRole('button')).toHaveText(six);
  expect(wrong).toEqual([]);
});

test('a corner is set from half a metre a pixel on: from afar the page says to come nearer', async ({
  pad,
}) => {
  // The first view: no corner, every control of the plot's side off - and a click sets none.
  const first = await openMap(pad);
  await expect(first.locator('#corners-said')).toHaveText(NONE);
  for (const off of ['undo-corner', 'start-again', 'side-before', 'side-next', 'make'])
    await expect(first.locator(`#${off}`)).toBeDisabled();
  await clickAt(first, 0, 0);
  await expect(first.locator('#said')).toHaveText(FAR);
  await expect(first.locator('#said')).toBeVisible();
  await expect(first.locator('body')).toHaveAttribute('data-corners', '0');
  // What was said goes as the map comes nearer.
  await first.keyboard.press('+');
  await rests(first, 16);
  await expect(first.locator('#said')).toBeHidden();
  // A metre a pixel, level 25, where any cadastral map shows already: none. Half a metre: one.
  const page = await openNear(pad, 26);
  const { said, corners, body } = partsOf(page);
  const marks = page.locator('#marks');
  await expect(marks).toHaveClass('near');
  await page.keyboard.press('-');
  expect(await rests(page, 25)).toMatchObject({ shows: shownAt(25) });
  await expect(marks).not.toHaveClass('near');
  await clickAt(page, 0, 0);
  await expect(said).toHaveText(FAR);
  await expect(corners).toHaveText(NONE);
  await page.keyboard.press('+');
  await rests(page, 26);
  await clickAt(page, 0, 0);
  await expect(corners).toHaveText('1 corner.');
  await expect(said).toBeHidden();
  await expect(body).toHaveAttribute('data-marked', MARKED.slice(0, 21));
  // With the photo showing a corner is set as well, and the body says what each was marked on.
  await page.locator('#photo').click();
  await clickAt(page, 40, 0);
  await expect(corners).toHaveText('2 corners.');
  await expect(body).toHaveAttribute('data-on', onOf(shownAt(26), 'photo'));
  // From afar a click sets none, and the plot says no word of it. A corner undone there: the
  // plot says its word, what was said of the click is gone, and what it was marked on with it.
  await page.locator('#further').click();
  await page.evaluate(`plot.addEventListener('marked', () => (document.title = 'marked'))`);
  await clickAt(page, 0, 100);
  await expect(said).toHaveText(FAR);
  await expect(page).toHaveTitle('New plot - Sketch pad');
  await page.locator('#undo-corner').click();
  await expect(page).toHaveTitle('marked');
  await expect(said).toBeHidden();
  await expect(body).toHaveAttribute('data-on', onOf(shownAt(26)));
});

test('the pentagon, marked: a line, an outline with its area, and the paper as it will lie', async ({
  pad,
}, testInfo) => {
  const page = await openNear(pad, 28);
  const { corners, paper, body } = partsOf(page);
  // A tenth of a metre a pixel, its layer, and the pentagon's first corner at the middle.
  const near = { level: 28, shows: shownAt(28), e: 2_600_020, n: 1_200_010 };
  expect(await viewOf(page)).toMatchObject(near);
  // One corner: its mark. Two: a line joins them, and nothing is said of an area or a paper.
  await clickAt(page, ...PENTAGON.slice(0, 2));
  await expect(corners).toHaveText('1 corner.');
  const [one, two] = [FIVE.slice(0, 1), FIVE.slice(0, 2)];
  expect(await marksOf(page)).toEqual({ dots: one, outline: one, sheet: [], along: null });
  await clickAt(page, ...PENTAGON.slice(2, 4));
  await expect(corners).toHaveText('2 corners.');
  expect(await marksOf(page)).toEqual({ dots: two, outline: two, sheet: [], along: null });
  await expect(page.locator('#no-survey')).toHaveAttribute('hidden', '');
  await expect(paper).toHaveText('');
  // Three: the outline closes, its area shows with the line that it is no survey, and the paper
  // shows around it, along the longest side - the third, back to the first corner.
  await clickAt(page, ...PENTAGON.slice(4, 6));
  await expect(corners).toHaveText('3 corners, 180 m².');
  await expect(page.locator('#no-survey')).toHaveText(SURVEY);
  await expect(paper).toHaveText(lies(3, 3, 32.3, 42.5, 21.5));
  const three = await marksOf(page);
  expect(three).toMatchObject({ outline: FIVE.slice(0, 3), along: [FIVE[2], FIVE[0]] });
  expect(three.sheet).toHaveLength(4);
  // Five: 520 m², the paper along the first side, and on the map its sheet - a broken line, its
  // four corners where `paperOf` has them - with that side drawn stronger.
  await clickAt(page, ...PENTAGON.slice(6));
  await expect(corners).toHaveText('5 corners, 520 m².');
  await expect(paper).toHaveText(lies(1, 5, 30, 40, 30));
  expect(await marksOf(page)).toEqual({ dots: FIVE, outline: FIVE, sheet: SHEET, along: two });
  // The body says the plot as it is marked: its corners in LV95, to the centimetre, and the rest.
  await expect(body).toHaveAttribute('data-marked', MARKED);
  const says = `'corners area side around on'.split(' ').map((word) => document.body.dataset[word])`;
  const on = onOf(shownAt(28));
  expect(await page.evaluate<string[]>(says)).toEqual(['5', '520.000', '0', '5', on]);
  expect(await page.evaluate<string>(looks)).toBe(LOOKS);
  // The look: the plot as it is marked, with its name and the folder that it will get - all of
  // it in the plot's side, which nothing in it makes wider.
  await page.locator('#name').fill('Trial slope');
  await expect(page.locator('#folder')).toHaveText('It will lie in the folder "Trial slope".');
  const fits = `(({ scrollWidth, clientWidth }) => scrollWidth === clientWidth)(document.getElementById('plot'))`;
  expect(await page.evaluate<boolean>(fits)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('marked.png') });
  // All of it stays on its ground: a level further, a quarter of a metre a pixel; with the map
  // dragged 100 pixels right and 50 down; and from afar, at 10 m a pixel, where no corner is set.
  const lying = (metres: number, right = 0, up = 0): number[][] =>
    FIVE.map(([x = 0, y = 0]) => [x / (10 * metres) + right, y / (10 * metres) + up]).map((at) =>
      at.map((pixels) => Math.round(pixels * 100) / 100 + 0),
    );
  await page.locator('#further').click();
  await rests(page, 27);
  expect((await marksOf(page)).dots).toEqual(lying(0.25));
  await drag(page, 'left', [-300, -200], [-200, -250]);
  await rests(page, 27);
  const moved = await marksOf(page);
  expect([moved.dots, moved.outline]).toEqual([lying(0.25, 100, -50), lying(0.25, 100, -50)]);
  for (let level = 26; level >= 20; level -= 1) await page.keyboard.press('-');
  await rests(page, 20);
  expect((await marksOf(page)).dots).toEqual(lying(10, 2.5, -1.25));
  await expect(corners).toHaveText('5 corners, 520 m².');
});

test('a corner is dragged, the last undone, all taken away; another side, and other ground around', async ({
  pad,
}) => {
  const page = await openNear(pad, 28);
  const { corners, paper, body } = partsOf(page);
  const around = page.locator('#around');
  await clickAt(page, ...PENTAGON);
  await expect(corners).toHaveText('5 corners, 520 m².');
  const stood = await viewOf(page);
  // The fifth corner, dragged 80 pixels down: 8 m south, where the outline encloses 560 m² and
  // the paper is 6.5 m longer. The map stood still meanwhile.
  await drag(page, 'left', [-160, 120], [-160, 40]);
  await expect(corners).toHaveText('5 corners, 560 m².');
  await expect(paper).toHaveText(lies(1, 5, 30, 46.5, 30));
  await expect(body).toHaveAttribute('data-marked', MARKED.replace('1200022.00', '1200014.00'));
  // Grabbed 3 pixels beside its middle, it goes as far as the pointer goes, and does not jump:
  // 80 pixels up, it is where it was. A press that stays within 4 pixels moves nothing, and
  // neither does the pointer's second button, however far it goes.
  await drag(page, 'left', [-157, 43], [-157, 123]);
  await expect(body).toHaveAttribute('data-marked', MARKED);
  await drag(page, 'left', [-160, 120], [-157, 122]);
  await drag(page, 'right', [-160, 120], [-100, 60]);
  expect([await viewOf(page), (await marksOf(page)).dots]).toEqual([stood, FIVE]);
  // And a drag stays one where the pointer comes back to its place: 50 pixels on, 48 back - with
  // the photo showing, which the corner is then marked on too.
  await page.locator('#photo').click();
  await drag(page, 'left', [-160, 120], [-110, 120], [-158, 121]);
  const back = MARKED.replace(/\S+$/, '2600004.20,1200022.10');
  await expect(body).toHaveAttribute('data-marked', back);
  await expect(body).toHaveAttribute('data-on', onOf(shownAt(28), 'photo'));
  // "Undo corner" takes the last away, "Start again" all: then every control is off again.
  await page.locator('#undo-corner').click();
  await expect(corners).toHaveText('4 corners, 420 m².');
  await page.locator('#start-again').click();
  await expect(corners).toHaveText(NONE);
  await expect(page.locator('#no-survey')).toHaveAttribute('hidden', '');
  expect(await marksOf(page)).toEqual({ dots: [], outline: [], sheet: [], along: null });
  for (const off of ['undo-corner', 'start-again', 'side-before', 'side-next'])
    await expect(page.locator(`#${off}`)).toBeDisabled();
  // The pentagon again. The next side picked, 12 m: the paper turns - the same sheet, a corner
  // on, 30 m by 40 m. The side before the first is the last, 20 m.
  await clickAt(page, ...PENTAGON);
  await page.locator('#side-next').click();
  await expect(paper).toHaveText(lies(2, 5, 12, 30, 40));
  const turned = [...SHEET.slice(1), ...SHEET.slice(0, 1)];
  expect(await marksOf(page)).toMatchObject({ sheet: turned, along: FIVE.slice(1, 3) });
  await page.locator('#side-before').click();
  await page.locator('#side-before').click();
  await expect(paper).toHaveText(lies(5, 5, 20, 30, 40));
  expect((await marksOf(page)).along).toEqual([FIVE[4], FIVE[0]]);
  await page.locator('#side-next').click();
  await expect(paper).toHaveText(lies(1, 5, 30, 40, 30));
  // The ground around: 5 m as the page comes, and taken when the field lets a figure go, not at
  // every letter. None: the paper is the outline's own box, with three of the plot's corners on
  // its edge. 21 m is refused in the order's own sentence - twice, typed twice - and so is a
  // figure between two halves, and none at all: the paper stays, and the field has its figure.
  await expect(around).toHaveValue('5');
  for (const [limit, figure] of Object.entries({ min: '0', max: '20', step: '0.5' }))
    await expect(around).toHaveAttribute(limit, figure);
  const sets = async (figure: string, says: string, value: string, no = ''): Promise<void> => {
    await around.fill('');
    await around.pressSequentially(figure);
    await around.press('Enter');
    await expect(paper).toHaveText(`${no} ${says}`.trim());
    await expect(around).toHaveValue(value);
    await expect(body).toHaveAttribute('data-around', value);
  };
  await sets('0', lies(1, 5, 30, 30, 20), '0');
  expect((await marksOf(page)).sheet).toEqual(pairs([0, 0, 180, 240, 20, 360, -160, 120]));
  for (const figure of ['21', '21']) await sets(figure, lies(1, 5, 30, 30, 20), '0', NO_FIGURE);
  await sets('2.5', lies(1, 5, 30, 35, 25), '2.5');
  for (const figure of ['2.25', '']) await sets(figure, lies(1, 5, 30, 35, 25), '2.5', NO_FIGURE);
  // From afar a corner's mark takes no pointer: a metre a pixel, and a drag that begins on the
  // fifth corner moves the map, 50 m, and no corner.
  for (let level = 27; level >= 25; level -= 1) await page.locator('#further').click();
  await rests(page, 25);
  await drag(page, 'left', [-16, 12], [34, 12]);
  expect(await rests(page, 25)).toMatchObject({ e: stood.e - 50, n: stood.n });
  await expect(body).toHaveAttribute('data-marked', MARKED);
});
