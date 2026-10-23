import { FIRST, METRES, expect, expectPictures, holdTerrace } from './sketch-own-pad';
import { onTerrace, openMap, placeOf, rests, targetOf, test } from './sketch-own-pad';
import { viewOf, type View } from './sketch-own-pad';
import { CADASTRE, CADASTRE_FILES } from './sketch-cadastre';

// The map's page, end to end (story ST-031, task T-031.5): swisstopo's map on the page of a new
// plot - here the stand-in's made-up map, for no test asks another machine. Each case has a pad
// and a stand-in of its own (sketch-own-pad.ts): the page's policy, the first view and each
// picture where it belongs, what the page asked of whom, nearer and further by wheel, keys and
// buttons, pictures asked for when the view rests and at a drag's end, and a click told from a
// drag. Which layer shows near, with which credits, is sketch-map-layers.spec.ts's; Find and the
// rest are sketch-map-find.spec.ts's. Page code is handed over as text: these tests are typed for
// Node, which has no `document`.

const CREDIT = '© swisstopo';
// The page's head, its own (T-041.2): no referrer, the first policy of its markup, which names no
// host, and the second that page.js puts in for a page that asks a stand-in - `policyOf` of
// tools/sketch/swisstopo/hosts.js - each stated a second time; and no header says either.
const MARKUP_POLICY =
  "script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const policyOf = (standIn: string): string =>
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' ${standIn}; connect-src 'self' ${standIn}; base-uri 'none'; form-action 'none'`;
const HEAD_SAYS = `[...document.head.querySelectorAll('meta[name="referrer"], meta[http-equiv]')].map((one) => one.content)`;
// The middle of the first view, the twelve pictures that it has, and the files of the pad that
// the page asks its own server for - the cadastre's among them where there is one.
const MIDDLE = { e: FIRST.e, n: FIRST.n };
const SAYS_MIDDLE = 'document.body.dataset.e + " " + document.body.dataset.n';
const sorted = (targets: string[]): string[] => [...targets].sort();
const TWELVE = [0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => targetOf('national', 15, c, r)));
const OWN = `frame.css map/find.js map/make.js map/map.css map/map.js map/marking.js map/marks.js
  map/page.js map/view.js new-plot/frame.js new-plot/making.js new-plot/plot.js
  new-plot/request.js plot-file.js routes.js squares.js store/held.js store/rules.js
  store/ways.js swisstopo/blocks.js swisstopo/cadastre.js swisstopo/catalogue.js swisstopo/door.js
  swisstopo/grid.js swisstopo/ground.js swisstopo/hosts.js swisstopo/lzw.js swisstopo/statuses.js
  swisstopo/tiff.js swisstopo/tile.js windows.js`
  .split(/\s+/)
  .concat(CADASTRE === null ? [] : CADASTRE_FILES);

test('the page of a new plot: its policy, its first view, what it asked, and back to the plot held', async ({
  pad,
}, testInfo) => {
  // The terrace plot, held in the browser and shown last (T-040.3): the way back leads to it.
  await holdTerrace(pad);
  // A cookie that the browser holds for the stand-in's host: no request of the map takes it there.
  await pad.browser.addCookies([{ name: 'made-up', value: 'cookie', url: pad.standIn.origin }]);
  const page = await pad.browser.newPage();
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  const said = (await page.goto(pad.map))?.headers() ?? {};
  expect(Object.keys(said).filter((name) => /security-policy|referrer/.test(name))).toEqual([]);
  const head = ['no-referrer', MARKUP_POLICY, policyOf(pad.standIn.origin)];
  expect(await page.evaluate<string[]>(HEAD_SAYS)).toEqual(head);
  await expect(page).toHaveTitle('New plot - Sketch pad');
  await expect(page.locator('body')).toHaveAttribute('data-asks', 'stand-in');
  // The first view: all of the sheet, its middle at the sheet's own - said to the centimetre -
  // at 500 m a pixel: the nearest level at which it shows whole, for the page gives the map
  // what the window has.
  expect(await rests(page, 15)).toEqual(FIRST);
  expect(await page.evaluate<string>(SAYS_MIDDLE)).toBe('2660000.00 1190000.00');
  const place = await placeOf(page);
  expect([place.wide > 960, place.high > 640]).toEqual([true, true]);
  // Twelve pictures of the national map, four across and three down, each where it belongs. By
  // hand: the sheet's middle lies 480 pixels east of its west edge and 320 south of its north
  // edge, so the first picture lies as far left of the place's middle, and as far above it.
  expect(await expectPictures(page, pad.standIn.origin)).toEqual(TWELVE);
  const first = await page.locator('#tiles img').first().boundingBox();
  const lies = [(first?.x ?? 0) - place.x, (first?.y ?? 0) - place.y];
  expect(lies).toEqual([place.wide / 2 - 480, place.high / 2 - 320]);
  // The credit on the map, the line of what the page asks, and the way back.
  await expect(page.locator('#credits span')).toHaveText([CREDIT]);
  const asks = `This page asks a stand-in on this machine, ${pad.standIn.origin}, in the place of swisstopo: its map, its places and its ground are made up.`;
  await expect(page.locator('#asks')).toHaveText(asks);
  await expect(page.locator('#back')).toHaveText('Back to the pad');
  await expect(page.locator('#back')).toHaveAttribute('href', '../');
  await page.screenshot({ path: testInfo.outputPath('first.png') });
  // What was asked. Of the stand-in those twelve pictures and nothing else - none with a
  // referrer or a cookie, each with the pad's address as its origin, and no path. Of the pad the
  // page, at its address, and its own files - nothing to learn whom it asks (T-041.2), and no
  // list of the plots (T-040.3).
  const heard = await pad.standIn.asked();
  expect(sorted(heard.map(({ target }) => target))).toEqual(TWELVE);
  const how = { method: 'GET', range: null, referer: null, cookie: null, origin: pad.origin };
  for (const one of heard) expect(one, one.target).toMatchObject(how);
  const own = sorted(asked.filter((url) => url.startsWith(`${pad.origin}/`)));
  const files = OWN.map((name) => `${pad.origin}/${name}`);
  expect(own).toEqual(sorted([`${pad.origin}${pad.map}`, ...files]));
  expect(asked).toHaveLength(own.length + TWELVE.length);
  // The cookie was there to be taken: a picture that is asked plainly, with no `crossorigin`,
  // takes it along - and says no origin.
  const plain = targetOf('photo', 15, 0, 0);
  await page.evaluate(`new Promise((done) => Object.assign(new Image(),
    { onload: done, onerror: done, src: '${pad.standIn.origin}${plain}' })).then(() => null)`);
  const taken = { target: plain, cookie: 'made-up=cookie', origin: null, referer: null };
  expect((await pad.standIn.asked()).at(-1)).toMatchObject(taken);
  // And back: the pad's own page, on the plot that this browser showed last.
  await page.locator('#back').click();
  await onTerrace(page);
});

test('nearer at the pointer, and further: by the wheel, keys and buttons', async ({ pad }) => {
  const page = await openMap(pad);
  const place = await placeOf(page);
  // The place under a pixel of the map, by what the body says: east to the right, north upward.
  const [x, y] = [700, 250];
  const under = ({ level, e, n }: View): number[] => {
    const metres = METRES[level] ?? 0;
    return [e + (x - place.wide / 2) * metres, n - (y - place.high / 2) * metres];
  };
  // The wheel, a notch, with the pointer off the middle: a level nearer, and the place under
  // the pointer is under it still - so the middle is another. The turn is the map's alone: the
  // page does not scroll or grow with it.
  await page.evaluate(`document.addEventListener('wheel', (event) => {
    globalThis.MAPS_ALONE = event.defaultPrevented; })`);
  await page.mouse.move(place.x + x, place.y + y);
  await page.mouse.wheel(0, -100);
  const nearer = await rests(page, 16);
  expect(under(nearer)).toEqual(under(FIRST));
  expect(nearer.e).not.toBe(FIRST.e);
  expect(await page.evaluate<boolean>('MAPS_ALONE')).toBe(true);
  await expectPictures(page, pad.standIn.origin);
  // A notch back is the first view again. Further than that there is no level: not by the
  // wheel, not by the key and not by the button - the next key nearer is level 16, and no other.
  await page.mouse.wheel(0, 100);
  expect(await rests(page, 15)).toEqual(FIRST);
  await page.mouse.wheel(0, 100);
  await page.keyboard.press('-');
  await page.locator('#further').click();
  // The two keys, and the two buttons: at the middle, which stays.
  await page.keyboard.press('+');
  expect(await rests(page, 16)).toMatchObject(MIDDLE);
  await expectPictures(page, pad.standIn.origin);
  await page.keyboard.press('-');
  expect(await rests(page, 15)).toEqual(FIRST);
  await page.locator('#nearer').click();
  expect(await rests(page, 16)).toMatchObject(MIDDLE);
  await page.locator('#further').click();
  expect(await rests(page, 15)).toEqual(FIRST);
  // With Ctrl the key is the browser's, and where a field has the keys they are the field's:
  // the map stays.
  await page.keyboard.press('Control++');
  await page.locator('#find-words').focus();
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  await expect(page.locator('#find-words')).toHaveValue('++');
  expect(await viewOf(page)).toEqual(FIRST);
});

test('pictures are asked for when the view rests, and a drag asks at its end', async ({ pad }) => {
  // The page's clock is the case's: it stands still from here on, but where the case moves it.
  const page = await pad.browser.newPage();
  await page.clock.install();
  await page.goto(pad.map);
  await rests(page, 15);
  await page.clock.pauseAt(Date.now() + 60_000);
  const asked = async (): Promise<string[]> => (await pad.standIn.asked()).map((one) => one.target);
  expect(sorted(await asked())).toEqual(TWELVE);
  // Three levels nearer, each key 149 milliseconds after the one before: the rest begins anew
  // at each. The pictures of before go at once, and none is asked for until the view has rested
  // for 150 milliseconds: then those of the view that shows, and none of the two levels that it
  // went through.
  for (let level = 16; level <= 18; level += 1) {
    await page.keyboard.press('+');
    await page.clock.runFor(149);
  }
  await expect(page.locator('body')).toHaveAttribute('data-level', '18');
  expect(await page.locator('#tiles > *').count()).toBe(0);
  expect((await viewOf(page)).came).toBe(0);
  expect(await asked()).toHaveLength(12);
  await page.clock.runFor(1);
  const rested = await rests(page, 18);
  const eighteen = await expectPictures(page, pad.standIn.origin);
  expect(sorted((await asked()).slice(12))).toEqual(eighteen);
  // A drag: 400 pixels to the left - the last hundred beside the map, where the pointer is the
  // map's still - and 100 up, at 50 m a pixel: the middle lies 20 km further east and 5 km
  // further south. On its way nothing is asked for, however long it takes: the pictures that
  // the map has go with it, and what it lacks is plain ground.
  const place = await placeOf(page);
  await page.mouse.move(place.x + 300, place.y + 400);
  await page.mouse.down();
  await page.mouse.move(place.x - 100, place.y + 300, { steps: 5 });
  await page.clock.runFor(1000);
  const dragged = await viewOf(page);
  expect([dragged.e - rested.e, dragged.n - rested.n]).toEqual([20_000, -5_000]);
  expect(dragged.came).toBeLessThan(dragged.pictures);
  expect(await page.locator('#tiles > *').count()).toBe(dragged.came);
  expect(await asked()).toHaveLength(12 + eighteen.length);
  // Its end: the pictures that the view lacks are asked for at once - the page's clock stands
  // still - each once, and no other.
  await page.mouse.up();
  expect(await rests(page, 18)).toMatchObject({ e: dragged.e, n: dragged.n });
  const now = await expectPictures(page, pad.standIn.origin);
  const fresh = now.filter((one) => !eighteen.includes(one));
  expect(fresh).toHaveLength(dragged.pictures - dragged.came);
  expect(sorted((await asked()).slice(12 + eighteen.length))).toEqual(fresh);
});

test('a click is no drag: the map says the place under it, and stays', async ({ pad }) => {
  const page = await openMap(pad);
  await page.evaluate(`globalThis.HEARD = [];
    for (const word of ['mapview', 'mapclick']) document.getElementById('map').addEventListener(
      word, (event) => HEARD.push([word, event.detail]))`);
  const place = await placeOf(page);
  type Word = [string, Record<string, number>];
  const heard = (): Promise<Word[]> => page.evaluate<Word[]>('HEARD');
  const pressed = async (from: number, ...to: number[]): Promise<void> => {
    await page.mouse.move(place.x + from, place.y + 200);
    await page.mouse.down();
    for (const x of to) await page.mouse.move(place.x + x, place.y + 200);
    await page.mouse.up();
  };
  // Down and up within 4 pixels of one place is a click: the map stays, and says the place that
  // lies under the pointer - by hand, at 500 m a pixel - and of its view no word. Nor of a key
  // that has no level to go to.
  await page.keyboard.press('-');
  await pressed(100, 104);
  expect(await viewOf(page)).toEqual(FIRST);
  const e = FIRST.e + (100 - place.wide / 2) * 500;
  const n = FIRST.n - (200 - place.high / 2) * 500;
  expect(await heard()).toEqual([['mapclick', { e, n }]]);
  // A pixel further is a drag, and no click: the map goes 5 pixels, 2500 m, and says its view.
  await pressed(100, 105);
  const moved = { level: 15, e: FIRST.e - 2500, n: FIRST.n };
  expect(await rests(page, 15)).toMatchObject(moved);
  const view = { ...moved, wide: place.wide, high: place.high };
  expect((await heard()).slice(1)).toEqual([['mapview', view]]);
  // And a drag stays one where the pointer comes back to its place: 50 pixels on, 47 back.
  await pressed(100, 150, 103);
  moved.e -= 1500;
  expect(await rests(page, 15)).toMatchObject(moved);
  // A pointer that the browser takes away is up, and has not clicked: the map does not go on
  // with it. And the pointer's second button is none of the map's.
  await page.mouse.down();
  await page.evaluate(`document.getElementById('tiles').dispatchEvent(
    new PointerEvent('pointercancel', { pointerId: 1 }))`);
  await page.mouse.move(place.x + 160, place.y + 200);
  await page.mouse.up();
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(place.x + 100, place.y + 200);
  await page.mouse.up({ button: 'right' });
  expect(await viewOf(page)).toMatchObject(moved);
  expect(await heard()).toHaveLength(4);
});
