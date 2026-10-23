// The check of a plot made in the page (ST-041, T-041.3), Rule 2 of the story: a plot made in a
// browser is byte for byte the plot that the server made, of the same order and the same answers.
// Held by one golden file, tests/__fixtures__/new-plot/trial-slope.json - the very text that
// `made` of the server's made.js gave for the pentagon of the first hand case, as the map's page
// orders it, on the stand-in, on 2026-10-20, before the server's making went (T-041.4) - which
// `plotMadeOf` of making.js gives through what a page of another origin is shown of the answers
// (../swisstopo/as-a-browser.js): by the eight GETs of the stand-in that the server asked, target
// and range, by hand, in their order, none beside another. And of making.js and every module that
// it loads, to the last, the text: nothing of Node, so that the page loads them; of making.js
// itself, no global, no clock and no request of its own. And of the same pentagon marked on the
// aerial photo, a second golden file, tests/__fixtures__/new-plot/trial-slope-photo.json, which
// plotMadeOf wrote once (T-044.10): byte for byte the first but for its credit and the first of
// its sources; and marked on the national map, as Blockplot marks one, the photo's golden but for
// those two, typed in. What is refused is making-refused.check.js's. Nothing is asked but this machine, and nothing is written.
import '../offline.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { asABrowser } from '../swisstopo/as-a-browser.js';
import { getJson } from '../swisstopo/door.js';
import { collectionAddress, fileAddress, itemsAddress, tileName } from '../swisstopo/hosts.js';
import { plotMadeOf } from './making.js';

const PAD = path.join(import.meta.dirname, '..');
const FIXTURES = path.join(PAD, '..', '..', 'tests', '__fixtures__', 'new-plot');
const GOLDEN = path.join(FIXTURES, 'trial-slope.json');
const PHOTO = path.join(FIXTURES, 'trial-slope-photo.json');
const DAY = '2026-10-20';
// The pentagon's order, as the map's page writes it: to the letter the server's first hand case.
const ORDER =
  '{"name":"Trial slope","corners":[[2600020,1200010],[2600038,1200034],[2600028.4,1200041.2],[2600010,1200030],[2600004,1200022]],"side":0,"aroundM":5,"on":["cadastral"]}';
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };

// The stand-in, on a port that the system picked: it says its address, and is asked there.
const standIn = spawn(process.execPath, [path.join(PAD, 'swisstopo', 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.once('exit', () => standIn.kill());
const [, AT] = /^The stand-in for swisstopo: (\S+) - /.exec(
  await once(standIn.stdout, 'data', soon),
);
const machines = globalThis.fetch;
/** What `run` gives with `ask` in the place of the machine's `fetch`, and what the stand-in heard. */
async function asking(ask, run) {
  await getJson(AT, '/asked?forget');
  globalThis.fetch = ask;
  try {
    const given = await run();
    return { given, asked: await getJson(AT, '/asked') };
  } finally {
    globalThis.fetch = machines;
  }
}

const golden = fs.readFileSync(GOLDEN, 'utf8');
// The eight GETs that the server asked for this order, as its check had them by hand: the
// collection; the items, by the sixteen names that the two tiles could have; and of each tile -
// the stand-in's 2599/1200 of 2021 and 2600/1200 of 2025 - its head and two parts.
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const NAMES = [2599, 2600].flatMap((km) => YEARS.map((year) => tileName(year, km, 1200)));
const TILES = ['swissalti3d_2021_2599-1200', 'swissalti3d_2025_2600-1200'];
try {
  // The page's: through what a page of another origin is shown, the folder that the name gives
  // and the golden file's text, byte for byte.
  const byPage = await asking(asABrowser(machines), () =>
    plotMadeOf(ORDER, { origin: AT, day: DAY }),
  );
  assert.deepEqual(Object.keys(byPage.given), ['folder', 'text']);
  assert.equal(byPage.given.folder, 'Trial slope');
  assert.ok(byPage.given.text === golden, 'plotMadeOf gave another text than the golden one');

  // By the server's eight GETs, target and range, in their order, none beside another.
  const target = (address) => address.slice(AT.length);
  const [west, east] = TILES.map((name) => target(fileAddress(AT, name)));
  const catalogue = [collectionAddress(AT), itemsAddress(AT, NAMES)].map(target);
  const asked = byPage.asked;
  assert.deepEqual(
    asked.map((one) => one.target),
    [...catalogue, west, west, west, east, east, east],
  );
  const parts = asked.map(({ range }) => range?.replace(/=[1-9]\d*-\d+$/, '=a part') ?? null);
  const tile = ['bytes=0-16383', 'bytes=a part', 'bytes=a part'];
  assert.deepEqual(parts, [null, null, ...tile, ...tile]);
  assert.ok(asked.every((one) => one.method === 'GET' && one.beside === 0));

  // The day is the one handed over: of another, the text says that day where it says one, and
  // is the golden file in nothing else.
  const later = await plotMadeOf(ORDER, { origin: AT, day: '2026-10-21' });
  assert.notEqual(later.text, golden);
  assert.equal(later.text, golden.replaceAll(`on ${DAY}`, 'on 2026-10-21'));

  // Marked on the aerial photo: its golden file, byte for byte. Marked on the national map: the
  // photo's golden but for its credit and the first of its sources, each typed in, which name
  // the national map and swisstopo's credit alone.
  const onPhoto = await plotMadeOf(ORDER.replace('["cadastral"]', '["photo"]'), {
    origin: AT,
    day: DAY,
  });
  const photo = fs.readFileSync(PHOTO, 'utf8');
  assert.ok(
    onPhoto.text === photo,
    'plotMadeOf gave another text than the golden one on the photo',
  );
  const onNational = await plotMadeOf(ORDER.replace('["cadastral"]', '["national"]'), {
    origin: AT,
    day: DAY,
  });
  const NATIONAL = {
    credit:
      'Outline: marked by hand on the national map, no survey. Ground: swissALTI3D. © swisstopo',
    source:
      'Outline: marked by hand on the national map, on 2026-10-20. No survey: a corner is good to a few decimetres, and is no boundary of the land register. © swisstopo',
  };
  const read = JSON.parse(onNational.text);
  assert.deepEqual([read.credit, read.sources[0]], [NATIONAL.credit, NATIONAL.source]);
  const FIRST = /("credit": )"[^"]*"(,\n {2}"sources": \[\n {4})"[^"]*"/;
  const unsaid = (text) => text.replace(FIRST, '$1…$2…');
  assert.ok(unsaid(photo) !== photo && unsaid(onNational.text) === unsaid(photo));
} finally {
  standIn.kill();
}

// What a script imports, by every way of writing it: each name, in its order - a module loaded
// for what it does, as plot.js loads ../squares.js, among them.
const IMPORTED = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]|\brequire\s*\(/g;
const textOf = (file) => fs.readFileSync(file, 'utf8');
const importsOf = (file) =>
  [...textOf(file).matchAll(IMPORTED)].map((found) => found[1] ?? 'require(');
// The rule, proved on what it must find: Node's, written four ways.
const NODE = /^(node:|fs$|path$|process$|os$|http$|require\()/;
for (const line of ["import fs from 'node:fs';", "await import('path')", 'require("os")']) {
  const found = [...line.matchAll(IMPORTED)].map((one) => one[1] ?? 'require(');
  assert.ok(
    found.some((name) => NODE.test(name)),
    line,
  );
}
// making.js and what it loads, to the last: each a module of the pad, and nothing of Node.
const MAKING = path.join(import.meta.dirname, 'making.js');
const loaded = [MAKING];
for (const file of loaded) {
  for (const name of importsOf(file)) {
    assert.ok(/^\.\.?\//.test(name) && !NODE.test(name), `${path.relative(PAD, file)}: ${name}`);
    const next = path.resolve(path.dirname(file), name);
    if (!loaded.includes(next)) loaded.push(next);
  }
}
const LOADS = `new-plot/making.js plot-file.js swisstopo/ground.js new-plot/frame.js
  new-plot/plot.js new-plot/request.js squares.js swisstopo/catalogue.js swisstopo/door.js
  swisstopo/grid.js swisstopo/hosts.js swisstopo/tile.js windows.js swisstopo/statuses.js
  swisstopo/blocks.js swisstopo/lzw.js swisstopo/tiff.js swisstopo/cadastre.js`.split(/\s+/);
assert.deepEqual(
  loaded.map((file) => path.relative(PAD, file).replaceAll('\\', '/')).sort(),
  [...LOADS].sort(),
);
// Of making.js itself, the code: no global, no clock, no request, no file of its own.
const code = textOf(MAKING).replace(/^\s*\/\/.*$/gm, '');
for (const word of ['globalThis', 'Date', 'fetch', 'window', 'document', 'location', 'import(']) {
  assert.equal(code.includes(word), false, word);
}

process.stdout.write(
  `tools/sketch/new-plot: a plot made in the page is the golden file, byte for byte, as the server made it - by the server's eight GETs of the stand-in, as a browser is shown them - and making.js and the ${loaded.length - 1} modules it loads import nothing of Node\n`,
);
