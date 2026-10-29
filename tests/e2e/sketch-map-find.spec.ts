import type { Locator, Page, Route } from '@playwright/test';
import { FIRST, MAP, expect, expectPictures, openMap, placeOf } from './sketch-own-pad';
import { rests, targetOf, test, viewOf, wrongOf } from './sketch-own-pad';
import { shownAt } from './sketch-cadastre';

// Find on the map's page, and what the first test had no room for (story ST-031, task T-031.5):
// a place found by its words and the map gone there; what does not come - a search, a picture -
// said in words, with the page going on; a page that is told nobody; a map that follows its
// window; the pad's own two pages, which ask nobody but their server; the made-up pad of the
// project, which has no such page; and the two refusals, each proved to fire - the page's own,
// by its policy, and the fixture's, which fails a case that asks another machine. Each case but
// the one on the made-up pad has a pad and a stand-in of its own (sketch-own-pad.ts). Page code
// is handed over as text: these tests are typed for Node, which has no `document`.

const TYPE = 'Type an address or a place, and press Enter.';
const THREE = '3 places. Pick one, and the map goes there.';
const NOT_COME = "The search did not come: swisstopo's search";
const NO_PICTURE =
  "A picture of the map did not come: swisstopo's map service does not answer, or answered what is no picture. What shows, goes on showing.";
const NOBODY =
  'This page was told to ask "nobody": a port of this machine, for a stand-in, or nothing, for swisstopo. It shows no map and makes no plot.';
// What the console says of a request that the case itself cut off, and of one that got no answer.
const CUT_OFF = 'Failed to load resource: net::ERR_FAILED';
const NO_ANSWER = 'Failed to load resource: net::ERR_CONNECTION_REFUSED';
const STATUS_500 =
  'Failed to load resource: the server responded with a status of 500 (Internal Server Error)';
// The made-up places as the page lists them: their names as text, the third cut to 120 characters.
const NAMES = ['Made-up lane 1 0000 Madeupville', 'Made-up square 0000 Madeupville'];
NAMES.push(`Made-up place with a long name${' long'.repeat(18)}…`);
const searchOf = (words: string): string =>
  `/rest/services/api/SearchServer?searchText=${words}&type=locations&sr=2056&limit=10`;
// Whether the list of the places holds buttons alone, and no name of a place ran anything.
const INERT = `globalThis.RAN === undefined && document.querySelector('#places :not(button)') === null`;
// A name that leads nowhere: `.invalid` is reserved for that. No request for it leaves the browser.
const NOWHERE = 'https://refused.invalid/';
/** The parts of Find on a page: its field, its sentence, and all that its list holds. */
const findOn = (page: Page): Record<'field' | 'said' | 'places', Locator> => ({
  field: page.locator('#find-words'),
  said: page.locator('#find-said'),
  places: page.locator('#places > *'),
});

test('Find: one request at Enter, the places as text, and the map goes to a pick', async ({
  pad,
}, testInfo) => {
  const page = await openMap(pad);
  const { field, said, places } = findOn(page);
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  await expect(said).toHaveText(TYPE);
  // Nothing is asked while a word is typed.
  await field.pressSequentially('lane');
  await expect(field).toHaveValue('lane');
  expect(asked).toEqual([]);
  expect(await pad.standIn.asked()).toHaveLength(12);
  // Enter: one request - which the case holds back, so that a second Enter and a press of the
  // button come while it is asked. It stays the one.
  const held: Route[] = [];
  await page.route(/\/SearchServer\?/, (route) => void held.push(route));
  await field.press('Enter');
  await expect.poll(() => held.length).toBe(1);
  await field.press('Enter');
  await page.locator('#find button').click();
  await held[0]?.fallback();
  await expect(said).toHaveText(THREE);
  expect(asked).toEqual([`${pad.standIn.origin}${searchOf('lane')}`]);
  // It reached the stand-in once, at that address, with the pad's address as its origin, and
  // with no referrer and no cookie.
  const how = { method: 'GET', referer: null, cookie: null, origin: pad.origin };
  expect((await pad.standIn.asked()).slice(12)).toMatchObject([
    { target: searchOf('lane'), ...how },
  ]);
  // Three places, by their names as text: the list holds three buttons and nothing else - no
  // picture of the name that has one written into it - and that name ran nothing.
  await expect(places).toHaveText(NAMES);
  expect(await page.evaluate<boolean>(INERT)).toBe(true);
  // A pick: the map goes to the place, at half a metre a pixel, with that place at its middle -
  // and the picture that the origin of the Swiss grid lies in, 1406/1171, lies where it belongs:
  // its corner 70 m west of the place and 78 m north of it, 140 pixels and 156.
  const marks = `Array.from(document.querySelectorAll('#places > *'), (one) => one.getAttribute('aria-current'))`;
  const current = (): Promise<(string | null)[]> => page.evaluate<(string | null)[]>(marks);
  expect(await current()).toEqual([null, null, null]);
  await places.nth(1).click();
  expect(await rests(page, 26)).toMatchObject({ shows: shownAt(26), e: 2_600_038, n: 1_200_034 });
  expect(await current()).toEqual([null, 'true', null]);
  await expectPictures(page, pad.standIn.origin);
  const place = await placeOf(page);
  const origin = `#tiles img[src$="${targetOf(shownAt(26), 26, 1406, 1171)}"]`;
  const box = await page.locator(origin).boundingBox();
  const lies = [(box?.x ?? 0) - place.x, (box?.y ?? 0) - place.y];
  expect(lies).toEqual([place.wide / 2 - 140, place.high / 2 - 156]);
  await page.screenshot({ path: testInfo.outputPath('found.png') });
  // Another pick, and the mark goes with it.
  await places.first().click();
  expect(await rests(page, 26)).toMatchObject({ e: 2_600_020, n: 1_200_010 });
  expect(await current()).toEqual(['true', null, null]);
});

test('Find says in words what did not come, and goes on', async ({ pad }) => {
  const page = await openMap(pad);
  const { field, said, places } = findOn(page);
  const find = async (words: string, says: string): Promise<void> => {
    await field.fill(words);
    await field.press('Enter');
    await expect(said).toHaveText(says);
  };
  await find('lane', THREE);
  await expect(places).toHaveCount(3);
  // Nothing found, a failure with what the service said - without its tags - and an answer that
  // cannot be read: each in its sentence, and the places of before are gone.
  await find('nowhere', 'Nothing was found for "nowhere".');
  await expect(places).toHaveCount(0);
  await find(
    'fails',
    `${NOT_COME} answered 500. It said: A made-up failure of the search with markup`,
  );
  expect(await wrongOf(pad, 1)).toEqual([STATUS_500]);
  await find('garbage', `${NOT_COME} answered what cannot be read.`);
  // No words are said, and not asked: each of the four before was one request.
  await find('   ', TYPE);
  const searches = (await pad.standIn.asked()).slice(12).map(({ target }) => target);
  expect(searches).toEqual(['lane', 'nowhere', 'fails', 'garbage'].map(searchOf));
  // A name that is a tag once its tags are out - answered by the case - is text still: it
  // shows as it is written, and makes no part of the page.
  const label = '<<b></b>img src="x" onerror="globalThis.RAN = 1">Made-up <<i></i>b>tag';
  const json = { results: [{ attrs: { label, x: 1_200_000, y: 2_600_000 } }] };
  const allowed = { 'access-control-allow-origin': '*' };
  await page.route(/\/SearchServer\?/, (route) => route.fulfill({ json, headers: allowed }));
  await find('made up', '1 place. Pick one, and the map goes there.');
  await expect(places).toHaveText(['<img src="x" onerror="globalThis.RAN = 1">Made-up <b>tag']);
  expect(await page.evaluate<boolean>(INERT)).toBe(true);
  await page.unrouteAll();
  // With the stand-in stopped the search does not answer: the page says so, and goes on - the
  // map shows what it has, and a search after it is asked again.
  await pad.standIn.stop();
  await find('lane', `${NOT_COME} does not answer.`);
  await find('square', `${NOT_COME} does not answer.`);
  expect(await wrongOf(pad, 2)).toEqual([NO_ANSWER, NO_ANSWER]);
  expect(await viewOf(page)).toEqual(FIRST);
});

test('a picture that does not come is said in words, and the others show', async ({ pad }) => {
  // Of the first view, one picture is answered with a text, and one is cut off.
  const page = await pad.browser.newPage();
  const says = { 'access-control-allow-origin': '*', 'content-type': 'text/plain' };
  await page.route('**/15/1/1.jpeg', (route) =>
    route.fulfill({ headers: says, body: 'No picture.' }),
  );
  await page.route('**/15/2/1.jpeg', (route) => route.abort());
  await page.goto(pad.map);
  const [said, body] = [page.locator('#said'), page.locator('body')];
  await expect(said).toHaveText(NO_PICTURE);
  await expect(body).toHaveAttribute('data-came', '10');
  expect(await viewOf(page)).toEqual({ ...FIRST, came: 10 });
  const shown = `Array.from(document.querySelectorAll('#tiles > *'), (img) =>
    img.complete && img.naturalWidth === 256 ? img.src.split('/2056/15/')[1] : 'no picture')`;
  const ten = ['0/0', '1/0', '2/0', '3/0', '0/1', '3/1', '0/2', '1/2', '2/2', '3/2'];
  expect(await page.evaluate<string[]>(shown)).toEqual(ten.map((name) => `${name}.jpeg`));
  expect(await wrongOf(pad, 1)).toEqual([CUT_OFF]);
  // What shows, goes on showing, and the page goes on: a level nearer every picture comes, and
  // nothing is said.
  await page.keyboard.press('+');
  await rests(page, 16);
  await expect(said).toBeHidden();
  await expect(said).toHaveText('');
  await expectPictures(page, pad.standIn.origin);
  // A picture that does not come once the view has left it says nothing any more: one of the
  // next level is held back, the map goes back, and then it is cut off.
  const held: Route[] = [];
  await page.route('**/17/9/6.jpeg', (route) => void held.push(route));
  await page.keyboard.press('+');
  await expect.poll(() => held.length).toBe(1);
  await page.keyboard.press('-');
  await rests(page, 16);
  await held[0]?.abort();
  expect(await wrongOf(pad, 1)).toEqual([CUT_OFF]);
  await expect(said).toBeHidden();
  // Back on the first view the two are asked for again, and said again - until the service
  // answers: the map is moved, its view rests once more, and every picture is there. Of the
  // stand-in each of the two was asked once, then: before, the case answered in its place.
  await page.keyboard.press('-');
  await expect(said).toHaveText(NO_PICTURE);
  await expect(body).toHaveAttribute('data-came', '10');
  expect(await wrongOf(pad, 1)).toEqual([CUT_OFF]);
  await page.unrouteAll();
  const place = await placeOf(page);
  await page.mouse.move(place.x + 300, place.y + 300);
  await page.mouse.down();
  await page.mouse.move(place.x + 306, place.y + 300);
  await page.mouse.up();
  expect(await rests(page, 15)).toEqual({ ...FIRST, e: FIRST.e - 3000 });
  await expect(said).toBeHidden();
  await expectPictures(page, pad.standIn.origin);
  const two = (await pad.standIn.asked()).filter(({ target }) =>
    /\/15\/[12]\/1\.jpeg$/.test(target),
  );
  expect(two).toHaveLength(2);
});

test('a page that is told nobody shows no map and no Find, and asks for no picture', async ({
  pad,
}) => {
  // The page's address names what is no port (T-041.2): its line says so, and it asks nobody.
  const page = await pad.browser.newPage();
  await page.goto(`${MAP}?asks=nobody`);
  await expect(page.locator('body')).toHaveAttribute('data-asks', 'nobody');
  await expect(page.locator('#asks')).toHaveText(NOBODY);
  for (const part of ['#work', '#map', '#find', '#find-words'])
    await expect(page.locator(part)).toBeHidden();
  await expect(page.locator('#back')).toBeVisible();
  expect(await page.locator('img').count()).toBe(0);
  expect(await pad.standIn.asked()).toEqual([]);
});

test('the map follows its window: its middle stays, at a level that the place has', async ({
  pad,
}) => {
  const page = await openMap(pad);
  // A smaller window: the view keeps its level and its middle, and its pictures lie by the place.
  await page.setViewportSize({ width: 1100, height: 700 });
  await expect.poll(async () => (await placeOf(page)).wide).toBeLessThan(700);
  await expect(() => expectPictures(page, pad.standIn.origin)).toPass();
  expect(await viewOf(page)).toEqual(FIRST);
  // A window in which the whole sheet shows a level nearer: that level is the first one there.
  await page.setViewportSize({ width: 2400, height: 1500 });
  expect(await rests(page, 16)).toMatchObject({ e: FIRST.e, n: FIRST.n });
  await expectPictures(page, pad.standIn.origin);
});

test("the pad's own two pages ask nobody but their own server", async ({ pad }) => {
  const page = await pad.browser.newPage();
  const asked = new Set<string>();
  page.on('request', (request) => asked.add(new URL(request.url()).origin));
  await page.goto('/');
  await expect(page).toHaveTitle('Top view — sketch pad');
  await page.goto('/3d.html');
  await expect(page).toHaveTitle('3D — sketch pad');
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  expect([...asked]).toEqual([pad.origin]);
  expect(await pad.standIn.asked()).toEqual([]);
});

test('the made-up pad of the project has no page of a new plot', async ({ request }) => {
  // The page itself is nothing, 204; nothing else of its folder is there; and New plot's old
  // address is no file (T-041.4).
  const page = await request.get('/map/index.html');
  expect([page.status(), (await page.body()).length]).toEqual([204, 0]);
  const NONE = ['/map/page.js', '/map/make.js', '/new-plot/'];
  for (const at of NONE) expect((await request.get(at)).status(), at).toBe(404);
  expect((await request.get('/index.html')).status()).toBe(200);
});

test('a request to a host that the policy does not name does not leave the page', async ({
  pad,
}) => {
  const page = await openMap(pad);
  // A script of the page asks elsewhere, for a picture and for a search: the page itself refuses
  // both, by its policy, and says which rule of it did.
  const refused = await page.evaluate<string[]>(`new Promise((done) => {
    const said = [];
    const hear = (event) => said.push(event.violatedDirective + ' ' + event.blockedURI);
    document.addEventListener('securitypolicyviolation', hear);
    const picture = new Promise((gone) => Object.assign(new Image(),
      { onload: () => gone('a picture'), onerror: () => gone('no picture'), src: '${NOWHERE}x.png' }));
    const search = fetch('${NOWHERE}search').then(() => 'an answer', () => 'no answer');
    Promise.all([picture, search]).then((how) => setTimeout(() => done([...how, ...said.sort()]), 100));
  })`);
  const rules = [`connect-src ${NOWHERE}search`, `img-src ${NOWHERE}x.png`];
  expect(refused).toEqual(['no picture', 'no answer', ...rules]);
  // The console says each refusal - the search's twice - which is what this case expects. And
  // the fixture heard no request: it would have refused it, and failed this case - as it fails
  // the next one.
  const errors = await wrongOf(pad, 3);
  expect(errors.every((error) => error.includes('Content Security Policy'))).toBe(true);
  expect(await pad.standIn.asked()).toHaveLength(12);
});

test('a request that leaves this machine is refused by the fixture, which fails the case', async ({
  pad,
}) => {
  // Marked as failing: this case passes only because the fixture refused the request and failed
  // it. On the pad's Info page, whose policy lets a picture come from anywhere, the address of a
  // picture is set to a name that leads nowhere. Nothing of the case itself fails it: what a
  // step of it throws is caught, and what the console says of the picture is waited for and
  // taken out.
  test.fail();
  const asks = async (): Promise<void> => {
    const page = await pad.browser.newPage();
    await page.goto('/info.html');
    await page.evaluate(`new Promise((done) => Object.assign(new Image(),
      { onload: done, onerror: done, src: '${NOWHERE}x.png' })).then(() => null)`);
    await wrongOf(pad, 1);
  };
  await asks().catch(() => undefined);
  pad.wrong.length = 0;
});
