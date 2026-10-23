// A look at a page of the sketch pad, for whoever has to see what was drawn and has no window to
// see it in - an agent, or a browser whose window is hidden and draws nothing. From the
// repository root:
//
//   pnpm sketch:look <page> <sketch file> <picture file> --demo|--plot=<plot file>
//                    [--width=<pixels>] [step ...]
//
// It starts a pad of its own on a free port, the made-up pad: the server holds no plot (ST-040),
// and the page shows the example, or the plot its browser holds. With --demo the page shows the
// made-up plot; with --plot=<a plot's file> the page is given that file through Open plot, as a
// person gives it, and the browser reads it - this script reads nothing of it. Neither, or both,
// is refused in one sentence. It opens the page named, `index.html#side` or `3d.html`, in the
// tests' browser, without a window, with the sketch file in the page's store, under the shown
// plot's key, before it loads. It does the steps, saves a picture of the page as a PNG where it
// was told, and prints what the page says. The page is as wide as --width says, 1440 pixels where
// it says nothing, and 900 high. The browser draws WebGL in software, where it can. No request
// leaves this machine: one to another origin is refused here, and listed.
//
// A step is one argument, and the steps are done in the order they are given:
//   click=<selector>          a click on what the selector finds: click=#larger, "click=text=Front"
//   click=<x>,<y>             a click at a place of the page, in pixels from its top left corner
//   key=<key>                 a key pressed: key=2, key=PageDown, key=Control+z
//   drag=<x>,<y>,<x>,<y>      the left button down at the first place, and up at the second
//   sdrag=<x>,<y>,<x>,<y>     the same with Shift held down: at a top corner of a box, in a
//                             standing view of the pad, it slopes the top of that box
//   rdrag=<x>,<y>,<x>,<y>     the same with the right button: it moves what the 3D view looks at
//   wheel=<x>,<y>,<notches>   the wheel turned at a place, so many notches: towards the house -
//                             nearer, in 3D - for a figure above nought, and away for one below
//   wait=<milliseconds>       nothing, for so long
// What the command line says is read by look-args.js.
//
// It is no test and no part of a gate, and it names no folder: a picture lies where the caller
// said, and a picture of a plot of one's own belongs outside the repository.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { setTimeout as pause } from 'node:timers/promises';
import { URL } from 'node:url';
import { chromium } from '@playwright/test';
import { argsOf, SWITCH, WIDE } from './look-args.js';

const HOST = '127.0.0.1';
// Where the made-up pad's page keeps the example's sketch: `keyOf('example')` of store/rules.js.
const EXAMPLE_KEY = 'blockplot/sketch/plot/example/space';
// The note of this look's own, in its throwaway browser's tab, that the sketch is in the store.
const SEEDED = 'blockplot-look/seeded';
// The page as large as a window on a desk, a pixel of the picture for each of its own: so wide
// where no --width says otherwise, and always so high.
const WINDOW = { width: WIDE, height: 900 };
// Drawn by the processor, whatever graphics card the machine has or lacks: the same picture on
// every machine, and one at all where no window is.
const SOFTWARE_WEBGL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
// How long the pad may take to start, and the page to do what it is asked.
const START_MS = 10_000;
const PAGE_MS = 15_000;
// How long a step is given to set off what it sets off - the page loaded anew - before the next.
const SETTLE_MS = 300;

const say = (line) => process.stdout.write(`${line}\n`);

/** A port of this machine that nothing listens on: the operating system picks it. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, HOST, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** Starts a pad of this look's own - the made-up pad, which holds no plot - and hands it over once it listens. */
function startPad(port) {
  const serve = path.join(import.meta.dirname, 'serve.js');
  const pad = spawn(process.execPath, [serve, SWITCH], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // However this look ends, its pad ends with it.
  process.once('exit', () => pad.kill());
  return new Promise((resolve, reject) => {
    let said = '';
    const failed = (why) => {
      clearTimeout(late);
      pad.kill();
      reject(new Error(`The pad did not start on port ${port}: ${why}`));
    };
    const late = setTimeout(() => failed('it took too long.'), START_MS);
    pad.stderr.on('data', (text) => (said += text));
    pad.on('error', (error) => failed(error.message));
    pad.on('exit', () => failed(said.trim() || 'it stopped.'));
    pad.stdout.on('data', (text) => {
      if (!String(text).includes(`http://${HOST}:${port}`)) return;
      clearTimeout(late);
      pad.removeAllListeners('exit');
      resolve(pad);
    });
  });
}

/** Over once what a step set off has shown: the page loaded anew, and what it queued for the next frame drawn. */
async function settled(page) {
  const frames = () =>
    page.evaluate(() => {
      const { requestAnimationFrame } = globalThis;
      return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
  await pause(SETTLE_MS);
  await page.waitForLoadState('load');
  // A page that goes as it is asked has gone: the one that came is asked again, once.
  await frames().catch(() => page.waitForLoadState('load').then(frames));
}

/**
 * Gives the page a plot's file through Open plot's own field, `#plot-file`, as a person picks it:
 * the browser reads it, holds it and shows it. Then the sketch goes under that plot's key, once,
 * as the next page begins - after the page that goes has said its last - and what a step draws
 * stays through the page loading anew. A file that the page refuses ends the look with what the
 * window said.
 */
async function givePlot(page, origin, plotFile, sketch) {
  await page.goto(`${origin}/index.html`);
  await page.locator('html[data-shown="example"]').waitFor({ state: 'attached' });
  await page.setInputFiles('#plot-file', plotFile);
  const shown = () => {
    const { shown: id } = globalThis.document.documentElement.dataset;
    return id !== undefined && id !== 'example' && id === globalThis.PLOT?.id;
  };
  await page.waitForFunction(shown).catch(async () => {
    const said = await page
      .locator('#plot-said')
      .textContent()
      .catch(() => null);
    throw new Error(`The plot's file was not opened: ${said || 'the page said nothing'}`);
  });
  const key = await page.evaluate(() => globalThis.PLOT.key);
  await page.context().addInitScript(
    ([home, at, text, once]) => {
      // A page of no origin - the blank one - has no store to so much as name.
      if (globalThis.location.origin !== home) return;
      const { localStorage, sessionStorage } = globalThis;
      if (sessionStorage.getItem(once) !== null) return;
      localStorage.setItem(at, text);
      sessionStorage.setItem(once, 'yes');
    },
    [origin, key, sketch, SEEDED],
  );
  // Away, so that the page asked for is loaded whole, though it be this one with another hash.
  await page.goto('about:blank');
}

/** What the page says of itself: its title, its alarm, and what its body is marked with. */
async function saidBy(page) {
  const { alarm, dataset } = await page.evaluate(() => {
    const { document } = globalThis;
    const alarm = document.getElementById('alarm');
    return { alarm: alarm && alarm.textContent, dataset: { ...document.body.dataset } };
  });
  return [
    `page: ${page.url()}`,
    `title: ${await page.title()}`,
    `#alarm: ${alarm === null ? 'the page has none' : alarm || 'empty'}`,
    `dataset of the body: ${JSON.stringify(dataset)}`,
  ];
}

/** Opens the page with the sketch in its store, does the steps, saves the picture, and says what the page says. */
async function look(browser, origin, asked, sketch) {
  const { page: name, pictureFile, width, steps, plotFile } = asked;
  const address = new URL(name, `${origin}/`);
  if (address.origin !== origin) throw new Error(`"${name}" is no page of the pad.`);
  // On the made-up plot the sketch goes into the page's store once, before the page loads: what
  // a step draws stays through the page loading anew, as it does in the pad.
  const seeded = plotFile === null ? [{ name: EXAMPLE_KEY, value: sketch }] : [];
  const context = await browser.newContext({
    viewport: { ...WINDOW, width },
    storageState: { cookies: [], origins: [{ origin, localStorage: seeded }] },
  });
  const [errors, elsewhere] = [[], []];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.continue();
    elsewhere.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(PAGE_MS);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  if (plotFile !== null) await givePlot(page, origin, plotFile, sketch);
  const answer = await page.goto(address.href);
  if (!answer?.ok()) {
    throw new Error(`The pad has no page "${name}": it answered ${answer?.status() ?? 'nothing'}.`);
  }
  await settled(page);
  for (const { text, act } of steps) {
    try {
      await act(page);
    } catch (error) {
      throw new Error(`The step ${text} failed: ${error.message}`, { cause: error });
    }
    await settled(page);
  }
  await page.screenshot({ path: pictureFile, type: 'png' });

  for (const line of await saidBy(page)) say(line);
  say(`errors of the console: ${errors.length}`);
  for (const error of errors) say(`  ${error}`);
  say(`requests to another origin, refused here: ${elsewhere.length}`);
  for (const url of elsewhere) say(`  ${url}`);
  say(`picture: ${path.resolve(pictureFile)}`);
}

async function main() {
  const asked = argsOf(process.argv.slice(2));
  const sketch = await readFile(asked.sketchFile, 'utf8').catch(() => {
    throw new Error(`The sketch file could not be read: ${asked.sketchFile}`);
  });
  const port = await freePort();
  const pad = await startPad(port);
  try {
    const { plotFile } = asked;
    const of = `the plot of ${plotFile} - a picture of a plot of one's own stays on this machine`;
    say(`plot: ${plotFile === null ? 'the made-up one' : of}`);
    const browser = await chromium.launch({ headless: true, args: SOFTWARE_WEBGL });
    try {
      await look(browser, `http://${HOST}:${port}`, asked, sketch);
    } finally {
      await browser.close();
    }
  } finally {
    pad.kill();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
