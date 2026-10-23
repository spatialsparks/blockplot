import { spawn, type ChildProcess, type ChildProcessByStdio } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { expect, test as base, type APIRequestContext } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { CADASTRE } from './sketch-cadastre';
import { padOn, stopped } from './sketch-started';

// A pad of a case's own that asks a stand-in (story ST-031): what the browser tests of a new plot
// share. No test file, by its name: sketch-map.spec.ts and sketch-map-find.spec.ts take their
// `test` from here, and so do the two of the marking, sketch-new-plot*. Each case gets a pad -
// tools/sketch/serve.js, told its port alone, on a port that was free a moment ago, another where
// it was taken by then (sketch-started.ts): a plain file server, which reads and writes nothing
// but the pad's own files - and beside it the stand-in for swisstopo,
// tools/sketch/swisstopo/stand-in.js, as a process of its own, which the map's page is told by
// its address, `?asks=<port>` (T-041.2): the pad is told nothing of it (T-041.4). Both are
// stopped however the case ends. `startOwn` starts the two, for the fixture and for the story's
// end-to-end test of ST-041, sketch-new-plot-folder.spec.ts, in sketch-folder.ts's browser.
//
// **No test asks another machine** (directive 34; ST-031, rule 3), and this is where that is held
// for the browser tests. A map's page opened without the word `asks` would ask swisstopo: every
// case opens it at `map`, which names the stand-in. Both processes run behind the gate of the
// pad's checks, tools/sketch/offline.js. And every request of the case's browser that goes to
// neither the pad nor the stand-in is refused here, before it leaves, and fails the case.

const fromRoot = (file: string): string => fileURLToPath(new URL(`../../${file}`, import.meta.url));
/** The window of a case, in pixels: the map of a new plot has more than 960 by 640 of them. */
export const WINDOW = { width: 1440, height: 1000 } as const;
// The gate of the pad's checks, as the order that has a Node process load it before all else.
const GATE = `--import=${new URL('../../tools/sketch/offline.js', import.meta.url).href}`;
const STAND_IN = /^The stand-in for swisstopo: (\S+) - made-up pictures, places and ground\./;
const PIPED: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe'];

/** One request that the stand-in was asked, as it says at /asked: a header that did not come is null. */
export type Asked = Record<'method' | 'target', string> &
  Record<'range' | 'referer' | 'cookie' | 'origin', string | null> & { beside: number };
/** The stand-in of a case: its address, every request that it was asked since it started, and a way to stop it. */
export type StandIn = { origin: string; asked: () => Promise<Asked[]>; stop: () => Promise<void> };
/** A pad and a stand-in of a case's own, started: the pad's address, the stand-in, and a way to stop both. */
export type Own = { origin: string; standIn: StandIn; stop: () => Promise<void> };
/**
 * What a case gets: the pad's address and a browser on it, in a window of `WINDOW`; its stand-in; `map`, the address of the map's page that asks it (T-041.2); and
 * what its pages said was wrong - an error that a page threw, and every error of the console. A
 * case that expects one takes it out of `wrong`: what is left there fails the case.
 */
export type OwnPad = Omit<Own, 'stop'> & { browser: BrowserContext; map: string; wrong: string[] };

type Running = ChildProcessByStdio<null, Readable, Readable>;
/** A script of the pad as a Node process of its own, behind the gate: itself, and what it says - on stdout and on stderr. */
function start(script: string, env: Record<string, string>): { run: Running; said: () => string } {
  const gated = [process.env['NODE_OPTIONS'] ?? '', GATE].join(' ').trim();
  const how = { env: { ...process.env, ...env, NODE_OPTIONS: gated }, stdio: PIPED };
  const run = spawn(process.execPath, [fromRoot(script)], how);
  const heard: string[] = [];
  for (const out of [run.stdout, run.stderr])
    out.on('data', (text: Buffer) => heard.push(text.toString()));
  return { run, said: () => heard.join('') };
}

/** A pad and a stand-in of a case's own, started as the head says, `api` asking what the stand-in heard: the fixture's, and that of sketch-new-plot-folder.spec.ts, in sketch-folder.ts's browser (T-041.5). `stop` stops both - and so does a start that fails, before it throws. */
export async function startOwn(api: APIRequestContext): Promise<Own> {
  const started: ChildProcess[] = [];
  const stopAll = (): void => started.forEach((run) => void run.kill());
  process.once('exit', stopAll);
  const stop = async (): Promise<void> => {
    process.off('exit', stopAll);
    await Promise.all(started.map(stopped));
  };
  try {
    // The stand-in, on a port that the system picks - named but empty is not named.
    const standIn = start('tools/sketch/swisstopo/stand-in.js', { PORT: '' });
    started.push(standIn.run);
    await expect.poll(standIn.said, 'the stand-in did not start').toMatch(STAND_IN);
    const asks = STAND_IN.exec(standIn.said())?.[1] ?? '';
    // The pad, told its port alone: it has started once it said its one line.
    const serve = (PORT: string): Running => start('tools/sketch/serve.js', { PORT }).run;
    const { run, said, origin } = await padOn(serve, ' - Ctrl+C stops it.\n');
    started.push(run);
    expect(said()).toBe(`The sketch pad: ${origin} - Ctrl+C stops it.\n`);
    const asked = async (): Promise<Asked[]> =>
      (await (await api.get(`${asks}/asked`)).json()) as Asked[];
    return { origin, standIn: { origin: asks, asked, stop: () => stopped(standIn.run) }, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

export { expect };
export const test = base.extend<{ pad: OwnPad }>({
  pad: async ({ browser, playwright }, use) => {
    const api = await playwright.request.newContext();
    const [wrong, left]: [string[], string[]] = [[], []];
    let [own, context]: [Own | null, BrowserContext | null] = [null, null];
    try {
      own = await startOwn(api);
      const { origin, standIn } = own;
      context = await browser.newContext({ baseURL: origin, viewport: WINDOW });
      context.on('weberror', (error) => wrong.push(error.error().message));
      context.on('console', (message) => message.type() === 'error' && wrong.push(message.text()));
      // The gate: what goes to neither the pad nor its stand-in is refused, and written down.
      await context.route('**/*', (route) => {
        const to = new URL(route.request().url()).origin;
        if (to === origin || to === standIn.origin) return route.fallback();
        left.push(route.request().url());
        return route.abort('blockedbyclient');
      });
      const map = `${MAP}?asks=${new URL(standIn.origin).port}`;
      await use({ origin, browser: context, standIn, map, wrong });
      // No request left this machine, and no page said an error that the case did not expect.
      expect(left, 'a request went to neither the pad nor its stand-in').toEqual([]);
      expect(wrong, 'a page said an error that the case did not expect').toEqual([]);
    } finally {
      await context?.close();
      await Promise.all([own?.stop(), api.dispose()]);
    }
  },
});

/**
 * Holds that the pages of a case said so many errors and no more, and takes them out of `wrong`:
 * it gives them, for the case to read. The console's word of a request that failed comes when
 * the browser gets to it - after the page went on - so the case waits for as many as it expects.
 */
export async function wrongOf(pad: OwnPad, count: number): Promise<string[]> {
  await expect.poll(() => pad.wrong.length, 'the console said fewer errors').toBe(count);
  return pad.wrong.splice(0);
}

// The map's page as a case reads it. What the map is - the metres of a pixel at each level, the
// sheet, a layer's name at the service and the ending of its pictures - is tools/sketch/swisstopo/
// hosts.js's, and which pictures a view has is tools/sketch/map/view.js's: both are stated here a
// second time, for a test loads no script of the pad - the cadastral map's of sketch-cadastre.ts,
// none where there is no cadastre. `MAP` is the page's path; a case opens it at `pad.map`, which
// names its stand-in.
export const MAP = '/map/index.html';
export const METRES = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250,
  100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1,
];
export const LAYERS = {
  national: ['ch.swisstopo.pixelkarte-farbe', 'jpeg'],
  cadastral: [CADASTRE?.layer ?? 'none', CADASTRE?.ending ?? 'none'],
  photo: ['ch.swisstopo.swissimage', 'jpeg'],
} as const;
export type Layer = keyof typeof LAYERS;
/** What the body of the map's page says of its map: the level, the place at the middle in LV95, the layer, how many pictures the view has, and how many of them came. */
export type View = Record<'level' | 'e' | 'n' | 'pictures' | 'came', number> & { shows: Layer };
/** The map's place in the window, in pixels: where its top left corner lies, and how large it is. */
export type Place = { x: number; y: number; wide: number; high: number };
/** A picture of the map: the path of its address, and where its top left corner lies in the map's place. */
export type Picture = { target: string; left: number; top: number };

/** The first view in a case's window, at rest: all of the sheet, its middle at the sheet's own, at 500 m a pixel. */
export const FIRST: View = {
  level: 15,
  e: 2_660_000,
  n: 1_190_000,
  shows: 'national',
  pictures: 12,
  came: 12,
};

/** The path of a picture's address at the map service, by its layer, level, column and row. */
export const targetOf = (layer: Layer, level: number, column: number, row: number): string =>
  `/1.0.0/${LAYERS[layer][0]}/default/current/2056/${level}/${column}/${row}.${LAYERS[layer][1]}`;

/** What the body says of the map, read as figures. Page code, handed over as text: these tests are typed for Node, which has no `document`. */
export const viewOf = (page: Page): Promise<View> =>
  page.evaluate<View>(`(({ level, e, n, shows, pictures, came }) => ({
    level: Number(level), e: Number(e), n: Number(n), shows, pictures: Number(pictures), came: Number(came),
  }))(document.body.dataset)`);
/** Where the map lies in the window, and how large it is: the place of its pictures. */
export const placeOf = (page: Page): Promise<Place> =>
  page.evaluate<Place>(`(({ x, y, width, height }) => ({ x, y, wide: width, high: height }))(
    document.getElementById('tiles').getBoundingClientRect())`);

/** Waits until the map is at a level and rests there - every picture of its view was asked for, and came - and gives what the body then says. */
export async function rests(page: Page, level: number): Promise<View> {
  await expect(page.locator('body')).toHaveAttribute('data-level', String(level));
  const lacks = async (): Promise<number> => {
    const { pictures, came } = await viewOf(page);
    return pictures - came;
  };
  await expect.poll(lacks, 'a picture of the view did not come').toBe(0);
  return viewOf(page);
}
/** Holds the made-up terrace plot in the case's browser, of the file way, as the plot shown last (T-040.3): a page of the pad then shows it. Page code, handed over as text. */
export async function holdTerrace(pad: OwnPad): Promise<void> {
  const page = await pad.browser.newPage();
  await page.goto('/');
  const text = readFileSync(fromRoot('tests/__fixtures__/plots/terrace/plot.json'), 'utf8');
  await page.evaluate(`(async () => {
    const [{ hold }, { recordOf, LAST }, { read }] = await Promise.all(
      ['/store/held.js', '/store/rules.js', '/plot-file.js'].map((at) => import(at)));
    const text = ${JSON.stringify(text)};
    await hold(recordOf({ id: 'terrace', site: read(text).site, text, way: 'file', day: '2026-10-20' }));
    localStorage.setItem(LAST, 'terrace');
  })()`);
  await page.close();
}
/** Waits until a window shows the pad's own page on the terrace plot, held in the browser - asked yes or no, of its PLOT. */
export async function onTerrace(page: Page): Promise<void> {
  await page.waitForURL(({ pathname }) => pathname === '/');
  await expect(page.locator('html[data-shown="terrace"]')).toHaveCount(1);
  expect(await page.evaluate<boolean>(`globalThis.PLOT?.id === 'terrace'`)).toBe(true);
}
/** The map's page of a case's pad, opened in a window of its own and at rest on its first view. */
export async function openMap(pad: OwnPad, address = pad.map): Promise<Page> {
  const page = await pad.browser.newPage();
  await page.goto(address);
  await rests(page, 15);
  return page;
}

/** The pentagon of the first hand case of a plot (T-031.3), at a tenth of a metre a pixel: of each corner two figures, how many pixels it lies right of the first and up from it. */
export const PENTAGON = [0, 0, 180, 240, 84, 312, -100, 200, -160, 120];
/** The map's page of a case's pad, gone to the first made-up place - the pentagon's first corner - which Find finds: at rest at a level from 26 on, with that place at the map's middle. */
export async function openNear(pad: OwnPad, level: number): Promise<Page> {
  const page = await openMap(pad);
  await page.locator('#find-words').fill('lane');
  await page.locator('#find-words').press('Enter');
  await page.locator('#places > *').first().click();
  for (let at = 26; at < level; at += 1) await page.keyboard.press('+');
  await rests(page, level);
  return page;
}
/** Clicks on the map, once for every two figures: so many pixels right of the map's middle, and so many up from it. */
export async function clickAt(page: Page, ...pixels: number[]): Promise<void> {
  const { x, y, wide, high } = await placeOf(page);
  for (let at = 0; at < pixels.length; at += 2)
    await page.mouse.click(x + wide / 2 + (pixels[at] ?? 0), y + high / 2 - (pixels[at + 1] ?? 0));
}

/**
 * The pictures that a view has in a place, a row after another: every tile of its level of which
 * the view shows ground, and no other - column `c` from the sheet's west edge plus `c` pictures
 * on, row `r` down from its north edge, within the columns and rows that the level has.
 */
export function picturesOf({ level, e, n, shows }: View, { wide, high }: Place): Picture[] {
  const metres = METRES[level] ?? Number.NaN;
  const [west, north] = [(e - 2_420_000) / metres - wide / 2, (1_350_000 - n) / metres - high / 2];
  const span = (from: number, length: number, sheet: number): number[] => {
    const [first, end] = [Math.floor(from / 256), Math.ceil((from + length) / 256)];
    const tiles = Array.from({ length: end - first }, (_, index) => first + index);
    return tiles.filter((tile) => tile >= 0 && tile < Math.ceil(sheet / (256 * metres)));
  };
  return span(north, high, 320_000).flatMap((row) =>
    span(west, wide, 480_000).map((column) => ({
      target: targetOf(shows, level, column, row),
      left: column * 256 - west,
      top: row * 256 - north,
    })),
  );
}

/**
 * Holds that the map shows the pictures of its view, each where it belongs, and no other; that
 * each came; and that each is asked for as another site's page asks, with nothing of its own to
 * drag. It gives the paths of their addresses, in the order of their letters.
 */
export async function expectPictures(page: Page, standIn: string): Promise<string[]> {
  type Shown = Picture & { came: boolean; how: string };
  const shown = await page.evaluate<Shown[]>(`(() => {
    const place = document.getElementById('tiles').getBoundingClientRect();
    return Array.from(document.querySelectorAll('#tiles > *'), (img) => {
      const { left, top, width, height } = img.getBoundingClientRect();
      const says = (name) => img.getAttribute(name) ?? 'not said';
      const how = ['crossorigin', 'referrerpolicy', 'alt', 'draggable'].map(says);
      const came = img.complete && img.naturalWidth === 256 && width === 256 && height === 256;
      return { target: img.src, left: left - place.left, top: top - place.top, came, how: img.localName + ' ' + how };
    });
  })()`);
  // The page has them in the order in which they were asked for: here each by its address.
  const byTarget = (one: Picture, other: Picture): number => (one.target < other.target ? -1 : 1);
  const belong = picturesOf(await viewOf(page), await placeOf(page)).sort(byTarget);
  shown.sort(byTarget);
  const targets = belong.map(({ target }) => `${standIn}${target}`);
  expect(shown.map(({ target }) => target)).toEqual(targets);
  shown.forEach((one, index) => {
    expect(one, one.target).toMatchObject({ came: true, how: 'img anonymous,no-referrer,,false' });
    // To a tenth of a pixel: the body says the middle to the centimetre, and a browser lays a
    // part on sixty-fourths of a pixel.
    const off = [one.left - (belong[index]?.left ?? 0), one.top - (belong[index]?.top ?? 0)];
    expect(Math.max(...off.map(Math.abs)), one.target).toBeLessThan(0.1);
  });
  return belong.map(({ target }) => target);
}
/** A drag on the map with a button of the pointer, `by`, from one pixel by way of others to the last, each way in four steps: a pixel is so many pixels right of the map's middle and up from it. */
export async function drag(page: Page, by: 'left' | 'right', ...way: number[][]): Promise<void> {
  const { x, y, wide, high } = await placeOf(page);
  for (const [at, [right = 0, up = 0]] of way.entries()) {
    await page.mouse.move(x + wide / 2 + right, y + high / 2 - up, { steps: at === 0 ? 1 : 4 });
    if (at === 0) await page.mouse.down({ button: by });
  }
  await page.mouse.up({ button: by });
}
